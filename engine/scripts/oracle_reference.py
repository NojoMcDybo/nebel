"""
Erzeugt die Referenzwerte fuer Validierungsstufe 0.

Laedt ausschliesslich die Gleichungsfunktion aus py-mgipsim (GPL-3.0) und fuehrt
sie aus. Es wird kein Code kopiert und nichts davon ins Repo uebernommen — die
Ausgabe ist eine Zahlentabelle unter vendor/, das ist gitignored.

Aufruf:  python3 scripts/oracle_reference.py
Ausgabe: vendor/oracle-reference.json
"""
import ast, json, os, sys
import numpy as np

ROOT = os.path.join("vendor", "py-mgipsim", "pymgipsim", "VirtualPatient", "Models", "T1DM", "ExtHovorka")
if not os.path.isdir(ROOT):
    sys.exit("Orakel fehlt. Erst 'npm run oracle:fetch' ausfuehren.")

# --- Gleichungsfunktion isoliert laden, ohne den Importbaum und ohne numba ---
src = open(os.path.join(ROOT, "Model.py"), encoding="utf8").read()
tree = ast.parse(src)
fn = None
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef) and node.name == "model":
        fn = node
        break
if fn is None:
    sys.exit("model() nicht gefunden")
fn.decorator_list = []
ns = {"np": np, "NOMINAL_F01_threshold": 4.5, "NOMINAL_FR_threshold": 9}
exec(compile(ast.Module(body=[fn], type_ignores=[]), "<oracle>", "exec"), ns)
model = ns["model"]

PARAM_ORDER = ["kb1","kb2","kb3","EGP0","ke","F01","AG","tmaxI","tmaxG","p3","p4","p5","beta","a",
               "BW","HRrest","HRmax","VG","VI","VT_HRR","k12","ka1","ka2","ka3","aSI","b","c","dSI",
               "tsub","p1","p2","p6","p7","p8","tmaxGFast"]

def load(n):
    raw = json.load(open(os.path.join(ROOT, "Patients", f"Patient_{n}.json"), encoding="utf8"))
    m = raw["model_parameters"]
    return m, raw["demographic_info"], np.array([[m[k] for k in PARAM_ORDER]], dtype=float)

def start_state(m, basal):
    """Algebraischer Startzustand bei G = 6 mmol/L. Beide Seiten starten hier."""
    G = 6.0
    I = basal / (m["VI"] * m["ke"])
    hypo = ((m["aSI"]*np.tanh(G/m["b"] + m["dSI"]) + m["c"]) /
            (m["aSI"]*np.tanh(5/m["b"] + m["dSI"]) + m["c"]))
    si = hypo * (1 - 0.018*(G - 5.55))
    x1 = m["kb1"]*si*I/m["ka1"]; x2 = m["kb2"]*si*I/m["ka2"]; x3 = m["kb3"]*si*I/m["ka3"]
    Q1 = G*m["VG"]
    return [basal*m["tmaxI"], basal*m["tmaxI"], I, x1, x2, x3, Q1,
            x1*Q1/(m["k12"]+x2), G, 0,0,0,0, 0,0,0]

out = {"generator": "scripts/oracle_reference.py", "subjects": {}}
rng = np.random.default_rng(20260922)

for n in (1, 7, 14):
    m, demo, P = load(n)
    basal = demo["basal"]*1000/60
    cases = []

    # a) Ableitungen an zufaelligen, physiologisch plausiblen Punkten
    for _ in range(40):
        G = rng.uniform(1.5, 20.0)
        st = np.array([[
            rng.uniform(0, 4000), rng.uniform(0, 4000), rng.uniform(0, 40),
            rng.uniform(0, 0.5), rng.uniform(0, 0.02), rng.uniform(0, 0.9),
            G*m["VG"], rng.uniform(0, 120), rng.uniform(2, 15),
            rng.uniform(0, 300), rng.uniform(0, 300), rng.uniform(0, 300), rng.uniform(0, 300),
            rng.uniform(0, 1), rng.uniform(0, 1), rng.uniform(0, 3),
        ]], dtype=float)
        inp = np.array([[rng.uniform(0, 20), rng.uniform(0, 20),
                         rng.uniform(40, 200), rng.uniform(0, 5000), 0.0]], dtype=float)
        d = model(st.copy(), 0.0, P, inp)
        cases.append({"state": st[0].tolist(),
                      "inputs": {"uFastCarbs": inp[0][0], "uSlowCarbs": inp[0][1],
                                 "uHR": inp[0][2], "uInsulin": inp[0][3]},
                      "d": d[0].tolist()})

    # b) 24-h-Trajektorie mit Euler, 1 min — Mahlzeit, Bolus, Belastungsblock
    s0 = start_state(m, basal)
    st = np.array([s0], dtype=float)
    hr_rest, hr_max, vt = m["HRrest"], m["HRmax"], m["VT_HRR"]
    hr_ex = hr_rest + 0.6*(hr_max - hr_rest)
    meal_mmol = 60/0.180156           # 60 g
    bolus_mU = (60/17.5)*1000         # ueber 1 min
    traj = []
    for t in range(1440):
        uf = meal_mmol if t == 480 else 0.0          # 60 g schnell um 08:00
        ub = bolus_mU if t == 480 else 0.0
        hr = hr_ex if 1020 <= t < 1080 else hr_rest  # 60 min Belastung ab 17:00
        inp = np.array([[uf, 0.0, hr, basal + ub, 0.0]], dtype=float)
        d = model(st.copy(), float(t), P, inp)
        st = st + 1.0*d
        traj.append(st[0][6] / m["VG"])
    cases_traj = {"startState": s0, "basalMUPerMin": basal,
                  "mealMmol": meal_mmol, "bolusMU": bolus_mU,
                  "hrExercise": hr_ex, "G": traj}

    out["subjects"][f"Patient_{n}"] = {"derivativeCases": cases, "trajectory": cases_traj}

os.makedirs("vendor", exist_ok=True)
with open(os.path.join("vendor", "oracle-reference.json"), "w", encoding="utf8") as f:
    json.dump(out, f)
print("geschrieben: vendor/oracle-reference.json")
for k, v in out["subjects"].items():
    g = v["trajectory"]["G"]
    print(f"  {k}: {len(v['derivativeCases'])} Ableitungsfaelle, "
          f"Trajektorie min {min(g):.2f} / max {max(g):.2f} mmol/L")
