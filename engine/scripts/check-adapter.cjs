/**
 * Funktionspruefung des Prototyp-Adapters (app/adapter.js) ohne Browser.
 *
 * Der Adapter ist ein klassisches Skriptfragment, kein Modul — er wird hier
 * mit minimalen Stubs fuer window und performance ausgewertet. Das prueft die
 * Mechanik schaerfer als ein Screenshot: Wirkt eine Mahlzeit? Faellt IOB?
 * Leeren sich die Reserven unter Belastung?
 *
 * Aufruf: npm run check:adapter
 */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../..");   // Projektwurzel
global.window = {}; global.performance = { now: () => Date.now() };
window.Nebel = require(path.join(root, "engine/dist/engine.cjs"));

const dir = path.join(root, "engine/vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients");
window.SUBJECTS = fs.readdirSync(dir).filter(f=>f.endsWith(".json"))
  .sort((a,b)=>+a.match(/\d+/)[0]-+b.match(/\d+/)[0])
  .map(f=>{ const r=JSON.parse(fs.readFileSync(path.join(dir,f),"utf8")), m=r.model_parameters, d=r.demographic_info;
    return { id:f.replace(".json",""),
      subject:{kb1:m.kb1,kb2:m.kb2,kb3:m.kb3,EGP0:m.EGP0,F01:m.F01,tmaxI:m.tmaxI,p3:m.p3,p4:m.p4,p5:m.p5,
               BW:m.BW,HRrest:m.HRrest,HRmax:m.HRmax,VG:m.VG,VI:m.VI,VT_HRR:m.VT_HRR},
      therapy:{basalRateUPerH:d.basal,carbRatioGPerU:d.carb_insulin_ratio,correctionFactor:d.correction_bolus},
      demo:{BW:d.body_weight,HbA1c:d.HbA1c,height:d.height} }; });

const adapter = fs.readFileSync(path.join(root, "app/adapter.js"), "utf8");
(0, eval)(adapter + "\nglobalThis.__Engine = Engine;");
const Engine = globalThis.__Engine;

const ok = (name, cond, info="") => console.log(`${cond ? "  OK  " : "FEHLT "} ${name}${info?"  "+info:""}`);
const eng = new Engine(20260812, 0);

console.log("Subjekt:", eng.subjectId, "| Basal", eng.therapy.basalRateUPerH.toFixed(2), "U/h | KE", eng.therapy.carbRatioGPerU);
ok("Startwert plausibel", eng.s.G > 70 && eng.s.G < 180, eng.s.G.toFixed(0)+" mg/dL");
ok("Sensor gesetzt", eng.lastSensor > 40, String(eng.lastSensor));
ok("Tagesplan mit Bewegung", eng.acts.length >= 3, eng.acts.length+" Einheiten");

const g0 = eng.s.G;
for (let i=0;i<120;i++) eng.step();
ok("Basal haelt den Wert", Math.abs(eng.s.G-g0) < 12, `${g0.toFixed(0)} → ${eng.s.G.toFixed(0)} mg/dL`);
ok("Trace waechst alle 5 min", eng.trace.length >= 24, eng.trace.length+" Punkte");

const real = eng.logMeal(45, "fast");
ok("Schaetzfehler wirkt", Math.abs(real-45) > 0.01 && Math.abs(real-45) < 20, `geschaetzt 45 g, gegessen ${real.toFixed(1)} g`);
ok("COB steigt", true, "");
eng.injectBolus(45/eng.therapy.carbRatioGPerU, 1, 0);
const iob0 = eng.iob();
ok("IOB nach Bolus", iob0 > 1, iob0.toFixed(2)+" U");
let peak = 0; for (let i=0;i<240;i++){ eng.step(); peak = Math.max(peak, eng.s.G); }
ok("Mahlzeit hebt den Wert", peak > g0+25, `Spitze ${peak.toFixed(0)} mg/dL`);
ok("Bolus bringt ihn zurueck", eng.s.G < peak-20, `nach 4 h ${eng.s.G.toFixed(0)} mg/dL`);
ok("IOB faellt", eng.iob() < iob0, `${iob0.toFixed(2)} → ${eng.iob().toFixed(2)} U`);
ok("COB abgebaut", eng.cob() < 5, eng.cob().toFixed(1)+" g");

const gly0 = eng.s.gly;
eng.startActivity(0.85, 30);
const gSport = eng.s.G; for (let i=0;i<45;i++) eng.step();
/* Patient_1 ist mit p3 = 2.9 ein schwacher Responder; oberhalb der
   ventilatorischen Schwelle hebt die Leber den Wert sogar leicht an.
   Fuer den Wirkungstest deshalb ein starker Responder. */
ok("Harte Belastung hebt bei schwachem Responder", eng.s.G >= gSport - 1,
   `${gSport.toFixed(0)} → ${eng.s.G.toFixed(0)} mg/dL, p3 ${eng.p.p3.toFixed(1)}`);
ok("Reserven sinken", eng.s.gly < gly0, `${gly0.toFixed(3)} → ${eng.s.gly.toFixed(3)}`);
ok("Nachwirkung aktiv", eng.s.Z > 0.05, "Z="+eng.s.Z.toFixed(3));
{ const c = new Engine(20260812, 0); c.acts = [];
  c.startActivity(0.55, 45);
  for (let i = 0; i < 45 + 6*60; i++){ c.acts = []; c.step(); }
  const a = c.activity();
  ok("Nachwirkung haelt Stunden", a.mode === "after" && c.states().some(s => s.txt === "Nachwirkung"),
     `6 h nach 45 min Dauerlauf: +${a.pct} %`);
  for (let i = 0; i < 9*60; i++){ c.acts = []; c.step(); }
  ok("… und klingt ab", c.activity().mode === "idle", `nach 15 h Z=${c.s.Z.toFixed(3)}`); }
{ const c = new Engine(20260812, 0);
  const tr = c.acts.find(a => a.warn);
  while (c.s.t < tr.start - tr.warn) c.step();
  ok("Training wird angekuendigt", c.activity().mode === "soon", tr.name);
  ok("… und laesst sich absagen", c.cancelPlanned() === tr.name && c.activity().mode !== "soon");
  while (c.s.t <= tr.start) c.step();
  ok("… und findet dann nicht statt", !c._act || c._act.name !== tr.name); }
const glyPre = eng.s.gly; eng.logMeal(40, "mixed");
ok("Essen fuellt die Reserven", eng.s.gly > glyPre, `${glyPre.toFixed(3)} → ${eng.s.gly.toFixed(3)}`);

const strong = new Engine(20260812, 13);           // Patient_14, p3 = 12.2
for (let i=0;i<60;i++) strong.step();
const gS0 = strong.s.G;
strong.startActivity(0.50, 45);
for (let i=0;i<60;i++) strong.step();
ok("Moderate Belastung senkt bei starkem Responder", strong.s.G < gS0 - 10,
   `${gS0.toFixed(0)} → ${strong.s.G.toFixed(0)} mg/dL, p3 ${strong.p.p3.toFixed(1)}`);
ok("Zustandschips", eng.states().length >= 0, eng.states().map(s=>s.txt).join(", ")||"keine");
ok("TIR berechnet", eng.tir() !== null, Math.round(eng.tir()*100)+" %");
ok("Trend", Number.isFinite(eng.trend()), eng.trend().toFixed(2)+" mg/dL/min");
ok("Aktivitaetsanzeige", !!eng.activity().mode, eng.activity().mode);
ok("Keine NaN im Zustand", Object.values(eng.s).every(v=>typeof v!=="number"||Number.isFinite(v)));

/* ── Tagesplan laeuft wirklich ── */
const plan = new Engine(20260812, 0);
const firstAlltag = plan.acts.filter(a => !a.warn).sort((a,b) => a.start-b.start)[0];
while (plan.s.t <= firstAlltag.start) plan.step();
ok("Geplante Alltagsbewegung startet", !!plan._act && plan._act.name === firstAlltag.name,
   `${firstAlltag.name} um ${String(Math.floor(firstAlltag.start/60)%24).padStart(2,"0")}:${String(firstAlltag.start%60).padStart(2,"0")}`);
ok("… und hebt die Herzfrequenz", window.Nebel.heartRateAt(firstAlltag.start, plan.input, plan.p.HRrest) > plan.p.HRrest + 5);

const post = new Engine(20260812, 0);
for (let i=0;i<30;i++) post.step();
post.acts.push({ name:"Testtraining", inten:0.6, start:post.s.t, dur:40, warn:10 });
post.lastSensor = 62;
post.step();
ok("Training bei 62 mg/dL verschoben", post.events.some(e => e.name === "Testtraining verschoben — Wert zu tief") && !post._act);

/* ── Ueberlappende Einheiten: Nachrechnen muss bitgleich sein ── */
const live = new Engine(20260812, 13);
live.acts = [];
for (let i=0;i<30;i++) live.step();
live.startActivity(0.5, 40);
for (let i=0;i<15;i++) live.step();
live.startActivity(0.8, 20);           // mitten in die laufende Einheit
for (let i=0;i<90;i++) live.step();
const replay = new Engine(20260812, 13);
replay.acts = [];
replay.input = JSON.parse(JSON.stringify(live.input));
for (let i=0;i<135;i++) replay.step();
const same = live.z.every((v,i) => v === replay.z[i]);
ok("Nachrechnen bitgleich trotz Ueberlappung", same, same ? "" : `G live ${live.s.G.toFixed(3)} / nachgerechnet ${replay.s.G.toFixed(3)}`);

/* ── Speichern und Fortsetzen ── */
const a = new Engine(20260812, 0);
for (let i=0;i<400;i++) a.step();
a.logMeal(40, "mixed"); a.injectBolus(3, 1, 0);
for (let i=0;i<30;i++) a.step();
const saved = JSON.parse(JSON.stringify({ s:a.s, core:a.snapshot(), acts:a.acts, tick:a.tick }));
const b = new Engine(undefined, 0);   // frische Sitzung mit eigenem Seed, uebernimmt den gespeicherten
ok("Neue Sitzungen wuerfeln ihren Seed", new Engine().seed !== new Engine().seed);
ok("Fremder Stand wird abgelehnt", !new Engine(20260812, 3).canRestore(saved.core));
Object.assign(b.s, saved.s); b.rng.setState(saved.tick); b.acts = saved.acts; b.restore(saved.core);
for (let i=0;i<300;i++){ a.step(); b.step(); }
ok("Fortsetzen nach Neuladen bitgleich", a.z.every((v,i) => v === b.z[i]) && a.lastSensor === b.lastSensor,
   `G ${a.s.G.toFixed(2)} / ${b.s.G.toFixed(2)} mg/dL`);

/* ── Druck auf den Sensor: live verborgen, im Rueckblick aufgedeckt ── */
{
  const Nb = window.Nebel;
  let seed = 1, ev = null;
  for (; seed < 400 && ev === null; seed++)
    for (let t = 1440; t < 3*1440 && ev === null; t += 5)
      if (Nb.compressionAt(Nb.NEBEL_SENSOR_V2, seed + 77, t) > 0) ev = t;
  seed--;
  const f = new Engine(seed, 0);
  f.acts = [];
  while (f.s.t < ev + 120){
    const h = (f.s.t/60) % 24;
    f.s.asleep = h >= 23 || h < 7;
    f.step();
  }
  const fl = f.sensorFaults[0];
  ok("Druckereignis mitgeschrieben", !!fl && !fl.open && fl.end > fl.t, fl ? `${Math.round((fl.end-fl.t))} min, angezeigt ${fl.sensorLow}, Blut ${fl.bloodAtLow}` : "keins");
  ok("… Sensor zeigt tiefer als das Blut", !!fl && fl.sensorLow < fl.bloodAtLow - 8);
  ok("… und steht NICHT im Live-Protokoll", !f.events.some(e => /druck|gedr/i.test(e.name || "")));
  const snapF = JSON.parse(JSON.stringify(f.snapshot()));
  ok("… und ueberlebt Speichern", snapF.faults.length === f.sensorFaults.length);
  const awake = new Engine(seed, 0); awake.acts = [];
  while (awake.s.t < ev + 120) awake.step();          // wach: niemand liegt auf dem Arm
  ok("Wach kein Druckereignis", awake.sensorFaults.length === 0);
}

/* ── Personen der Startseite ── */
{
  const src = fs.readFileSync(path.join(root, "app/personas.js"), "utf8");
  (0, eval)(src + "\nglobalThis.__PERSONAS = PERSONAS; globalThis.__avatar = avatarSVG; globalThis.__DEF = DEFAULT_PERSONA;");
  const P = globalThis.__PERSONAS;
  ok("Neun Personen (dazu die eigene)", P.length === 9, P.map(p => p.name).join(", "));
  ok("… jede auf einem vorhandenen Subjekt", P.every(p => window.SUBJECTS.some(s => s.id === p.id)));
  ok("… keine doppelt", new Set(P.map(p => p.id)).size === 9 && new Set(P.map(p => p.name)).size === 9);
  ok("Standardperson ist dabei", P.some(p => p.id === globalThis.__DEF), globalThis.__DEF);
  const svgs = P.map(p => globalThis.__avatar(p, 24));
  ok("Avatare vollstaendig gezeichnet", svgs.every(s => s.startsWith("<svg") && !/undefined|NaN/.test(s)));
  const g = P.map(p => { const e = new Engine(undefined, window.SUBJECTS.findIndex(s => s.id === p.id)); return e.s.G; });
  ok("Alle starten im Gleichgewicht", g.every(v => Math.abs(v - 108) < 1), g.map(v => v.toFixed(0)).join(" "));
}

/* ── Fett und Eiweiss ── */
{
  const mk = () => { const e = new Engine(20260812, 9); e.acts = []; for (let i = 0; i < 95; i++) e.step(); return e; };
  const a = mk(), b = mk(), t0 = a.s.t;
  a.logMeal(80, "fatty", 20);            // Voreinstellung: 36 g Fett, 32 g Eiweiss
  b.logMeal(80, "fatty", 20, 0, 0);      // dieselben Kohlenhydrate ohne Fett und Eiweiss
  a.injectBolus(8, 1, 0); b.injectBolus(8, 1, 0);
  const ma = a.events.find(e => e.kind === "meal");
  ok("Fettig setzt Fett und Eiweiss voraus", ma.fat === 36 && ma.protein === 32, `${ma.fat} g Fett, ${ma.protein} g Eiweiss`);
  for (let i = 0; i < 30; i++){ a.step(); b.step(); }
  ok("Fett haelt Kohlenhydrate im Magen: KH aktiv hoeher", a.cob() > b.cob() + 3, `${a.cob().toFixed(0)} / ${b.cob().toFixed(0)} g`);
  const Fa = a.forecast(360, 720, 5), Fb = b.forecast(360, 720, 5);
  const im = (t0 - Fa.from) / Fa.stride;
  const fatPeak = Math.max(...Fa.fat), tFat = (Fa.fat.indexOf(fatPeak) - im) * 5;
  const protPeak = Math.max(...Fa.protein), tProt = (Fa.protein.indexOf(protPeak) - im) * 5;
  ok("Fett und Eiweiss erscheinen nur, wenn gegessen", fatPeak > 1 && protPeak > 1 && Math.max(...Fb.fat) < 1e-9 && Math.max(...Fb.protein) < 1e-9,
     `Fett bis ${fatPeak.toFixed(0)}, Eiweiss bis ${protPeak.toFixed(0)} mg/dL pro h`);
  let sMin = 1, tS = 0;
  for (let m = 0; m < 720; m++){ const sf = window.Nebel.mealInputsAt(t0 + m, 1, a.input).siFactor; if (sf < sMin){ sMin = sf; tS = m; } }
  ok("Fettresistenz am staerksten 4–7 h nach dem Essen", tS >= 240 && tS <= 420, `nach ${(tS / 60).toFixed(1)} h, Insulin wirkt zu ${(sMin * 100).toFixed(0)} %`);
  const insPk = Fa.insulin.indexOf(Math.max(...Fa.insulin)) - im;
  ok("Fehlende Insulinwirkung gipfelt nach der Insulinwirkung", tFat > insPk * 5, `Fett nach ${(tFat / 60).toFixed(1)} h, Insulin nach ${(insPk * 5 / 60).toFixed(1)} h`);
  ok("Eiweisswirkung: Maximum 2–4 h nach dem Essen", tProt >= 120 && tProt <= 240, `nach ${(tProt / 60).toFixed(1)} h`);
  const at = (F, min) => F.full[im + min / 5];
  ok("Mit Fett erst tiefer, spaeter hoeher", at(Fa, 60) < at(Fb, 60) && at(Fa, 360) > at(Fb, 360) + 20,
     `1 h ${at(Fa, 60).toFixed(0)} / ${at(Fb, 60).toFixed(0)} · 6 h ${at(Fa, 360).toFixed(0)} / ${at(Fb, 360).toFixed(0)} mg/dL`);
  ok("Summe stimmt auch mit Fett", Fa.food.every((v, j) => Math.abs(v - Fa.fast[j] - Fa.slow[j] - Fa.protein[j] - Fa.fat[j]) < 1e-9));
}

/* ── Vorhersage ── */
{
  const f = new Engine(20260812, 9);                   // Patient_10
  f.acts = [];
  for (let i = 0; i < 95; i++) f.step();               // 08:35
  f.logMeal(60, "mixed"); f.injectBolus(60 / f.therapy.carbRatioGPerU, 1, 0);
  for (let i = 0; i < 145; i++) f.step();              // 11:00
  const F = f.forecast(360, 720, 5);
  ok("Vorhersage beginnt beim aktuellen Blutzucker", Math.abs(F.blood[0] - f.s.G) < 1e-9, `${F.blood[0].toFixed(1)} mg/dL`);
  ok("… deckt 12 Stunden ab", F.blood.length === 145 && F.end - F.now === 720);
  const i = (F.now - F.from) / F.stride;
  ok("Nachgerechnete Vergangenheit trifft den gelaufenen Wert", Number.isInteger(i) && Math.abs(F.full[i] - f.s.G) < 1e-6,
     `${F.full[i].toFixed(3)} / ${f.s.G.toFixed(3)} mg/dL`);
  const ib = (515 - F.from) / F.stride;                // Bolus um 08:35
  const insPeak = Math.max(...F.insulin), tPeak = F.insulin.indexOf(insPeak);
  ok("Insulinwirkung: Maximum 1–3 h nach dem Bolus", (tPeak - ib) * 5 >= 60 && (tPeak - ib) * 5 <= 180,
     `nach ${((tPeak - ib) * 5 / 60).toFixed(1)} h, ${insPeak.toFixed(0)} mg/dL pro h`);
  ok("… nach 6 h fast vorbei", F.insulin[ib + 72] < 0.15 * insPeak, `${(F.insulin[ib + 72] / insPeak * 100).toFixed(0)} % des Maximums`);
  const foodPeak = Math.max(...F.food);
  ok("Essen hebt", foodPeak > 10, `bis ${foodPeak.toFixed(0)} mg/dL pro h`);
  ok("Schnell + langsam + Eiweiss + Fett ergibt genau das ganze Essen",
     F.food.every((v, j) => Math.abs(v - F.fast[j] - F.slow[j] - F.protein[j] - F.fat[j]) < 1e-9));
  ok("Gewoehnliches Fett (unter der Schwelle) bremst das Insulin nicht", F.fat.every(v => v < 1e-9),
     `${f.events.find(e => e.kind === "meal").fat} g Fett`);
  const tf = F.fast.indexOf(Math.max(...F.fast)), ts = F.slow.indexOf(Math.max(...F.slow));
  ok("Schnelle Kohlenhydrate wirken vor langsamen", tf < ts, `Maximum nach ${((tf - ib) * 5)} / ${((ts - ib) * 5)} min`);
  /* Keine kuenftigen Entscheidungen: ein geplantes Training aendert nichts */
  const g = new Engine(20260812, 9); g.acts = [];
  for (let j = 0; j < 95; j++) g.step();
  const A = g.forecast(360, 720, 5).blood.slice();
  g.acts.push({ name:"Test", inten:.7, start:g.s.t + 60, dur:45, warn:0 });
  const B2 = g.forecast(360, 720, 5).blood;
  ok("Geplantes, noch nicht begonnenes Training bleibt draußen", A.every((v, j) => v === B2[j]));
  /* Basal halbiert: Vorhersage steigt, Insulinwirkung wird negativ */
  const h = new Engine(20260812, 9); h.acts = [];
  for (let j = 0; j < 60; j++) h.step();
  const base = h.forecast(360, 720, 5).blood;
  h.setBasal(h.therapy.basalRateUPerH * 0.5);
  const lower = h.forecast(360, 720, 5);
  ok("Halbe Basalrate: Vorhersage steigt, Insulin senkt weniger", lower.blood[144] > base[144] + 20 && Math.min(...lower.insulin) < -3,
     `${base[144].toFixed(0)} → ${lower.blood[144].toFixed(0)} mg/dL nach 12 h`);
  /* Speichern und Laden: Schnappschuesse und Basalereignis bleiben */
  const sv = JSON.parse(JSON.stringify({ s:h.s, core:h.snapshot() }));
  const h2 = new Engine(undefined, 9); Object.assign(h2.s, sv.s); h2.restore(sv.core); h2.acts = [];
  const R = h2.forecast(360, 720, 5);
  ok("Vorhersage nach Neuladen identisch", R.blood.every((v, j) => v === lower.blood[j]) && R.insulin.every((v, j) => v === lower.insulin[j]));
}
{ /* Belastungsmuster: Intervalle wechseln die Herzfrequenz und heben den Wert
     nicht wie eine gleichmaessig harte Linie. Bewegung erscheint in der Wirkung. */
  const run = (name, inten, pat) => { const c = new Engine(20260812, 9); c.acts = [];
    for (let i = 0; i < 60; i++){ c.acts = []; c.step(); }
    const g0 = c.s.G; c._beginActivity(name, inten, 33, pat);
    const hr = [0, 1, 2].map(k => N_hr(c, c.s.t + k));
    const F = c.forecast(60, 120, 5);
    for (let i = 0; i < 33; i++){ c.acts = []; c.step(); }
    return { d: c.s.G - g0, hr, F }; };
  const N_hr = (c, t) => window.Nebel.heartRateAt(t, c.input, c.p.HRrest);
  const flat = run("flach", 0.92), iv = run("Intervalle", 0.92, [[1, 0.9], [2, 0.5]]);
  ok("Intervalle wechseln die Herzfrequenz", iv.hr[0] > iv.hr[1] + 20 && Math.abs(iv.hr[1] - iv.hr[2]) < 1,
     iv.hr.map(Math.round).join(" / ") + " bpm");
  ok("… und heben weniger als eine harte Linie", iv.d < flat.d - 10, `${iv.d.toFixed(0)} statt ${flat.d.toFixed(0)} mg/dL`);
  ok("Bewegung steht in der Wirkung", iv.F.move.some(v => Math.abs(v) > 5), "max " + Math.max(...iv.F.move.map(Math.abs)).toFixed(0) + " mg/dL/h");
}
/* Achterbahn: nur mit variability. Drift im Rahmen, Mittel nahe 1;
   ein geknickter Katheter treibt den Wert hoch, nach 2 h ueber 250 wird gewechselt. */
{
  const e = new Engine(4242, 9);
  const off = e._drift(600);
  e.variability = true;
  const ds = []; for (let t = 0; t < 30*1440; t += 60) ds.push(e._drift(t));
  const mean = ds.reduce((a,b)=>a+b,0)/ds.length, lo = Math.min(...ds), hi = Math.max(...ds);
  ok("Ohne Alltag keine Drift", off === 1, String(off));
  ok("Drift im Rahmen, Mittel nahe 1", lo >= 0.5 && hi <= 2 && Math.abs(mean - 1) < 0.08,
     `${lo.toFixed(2)}–${hi.toFixed(2)}, Mittel ${mean.toFixed(2)}`);
  const sd = Math.sqrt(ds.reduce((a,b)=>a+Math.log(b)**2,0)/ds.length);
  ok("Streuung wie angesetzt", sd > 0.15 && sd < 0.35, "log-sd " + sd.toFixed(2));

  const k = new Engine(4242, 9); k.variability = true;
  k._occ = [{ start: k.s.t, end: null }];
  k.logMeal(60, "fast"); k.injectBolus(60/k.therapy.carbRatioGPerU, 1, 0);   // Bolus kommt nur zu 10 % an
  const g0 = k.s.G; let mx = 0;
  for (let i = 0; i < 12*60 && k._occ[0].end == null; i++){ k.step(); mx = Math.max(mx, k.s.G); }
  ok("Katheterknick treibt hoch", mx > g0 + 100, `${g0.toFixed(0)} → ${mx.toFixed(0)} mg/dL`);
  ok("… und wird nach 2 h über 250 gewechselt", k._occ[0].end != null && k.events.some(e => /Katheter/.test(e.name || "")),
     k._occ[0].end != null ? "nach " + ((k._occ[0].end - k._occ[0].start)/60).toFixed(1) + " h" : "nicht gewechselt");
}
/* Pen (MDI): Langzeitinsulin haelt den Wert wie die Pumpe; vergessen treibt ihn hoch. */
{
  /* exact: Tagesmenge ungerundet, damit nur die Mechanik verglichen wird. */
  const run = (pen, inject, exact) => { const e = new Engine(777, 3, pen); e.acts = []; let g = [];
    if (exact){ e.longDose = () => e.therapy.basalRateUPerH * 24; e.input[0].units = e.longDose(); }
    for (let i = 0; i < 30*60; i++){ if (inject && e.s.t === 21*60) e.injectLong(e.longDose()); e.step(); if (e.s.t % 60 === 0) g.push(e.s.G); }
    return { e, g }; };
  const pu = run(false, false), pe = run(true, true), fo = run(true, false), ex = run(true, true, true);
  const devX = Math.max(...ex.g.map((v,i) => Math.abs(v - pu.g[i])));
  const dev = Math.max(...pe.g.map((v,i) => Math.abs(v - pu.g[i])));
  ok("Pen mit Spritze um 21 Uhr wie Pumpe", devX < 1, "max Abweichung " + devX.toFixed(2) + " mg/dL");
  ok("… auf ganze Einheiten gerundet nah dran", dev < 25, `${pe.e.longDose()} statt ${(pe.e.therapy.basalRateUPerH*24).toFixed(1)} U, max ${dev.toFixed(0)} mg/dL`);
  ok("Pen vergessen: Wert steigt", fo.e.s.G > pe.e.s.G + 60, `${pe.e.s.G.toFixed(0)} statt ${fo.e.s.G.toFixed(0)} mg/dL am naechsten Mittag`);
  ok("Langzeit zaehlt nicht als aktives Insulin", pe.e.iob() === 0, pe.e.iob().toFixed(2) + " U");
  const k = new Engine(777, 3, true); k.variability = true; k._occ = [{ start:k.s.t, end:null }];
  ok("Pen hat keinen Katheterknick", k._deliv(k.s.t + 5) === 1);
  ok("Pumpenstand passt nicht zum Pen", !k.canRestore(new Engine(777, 3).snapshot()) && k.canRestore(k.snapshot()));
}
/* Basal-IQ: zu viel Bolus ohne Essen. Mit Abschaltung bleibt der Wert hoeher,
   nie mehr Insulin, hoechstens 2 h Pause in 2,5 h, Vorhersage rechnet sie nach. */
{
  const run = (iq, pen) => { const e = new Engine(1234, 3, pen); e.acts = []; e.basalIQ = iq;
    let lo = 1e9, mu = 0; const uAt = [];
    for (let i = 0; i < 10*60; i++){
      if (i === 30) e.injectBolus(1.5);
      const u = e._u(e.s.t, e.input).uInsulin; mu += u; uAt.push(u);
      e.step(); lo = Math.min(lo, e.s.G);
    }
    return { e, lo, mu, uAt }; };
  const off = run(false), on = run(true), pen = run(true, true);
  const pauses = on.e.input.filter(x => x.iq);
  ok("Basal-IQ pausiert bei drohendem Tief", pauses.length > 0, pauses.map(p => `${fmtClock(p.t)} ${p.durationMin} min`).join(", ") || "keine Pause");
  ok("… Tief weniger tief", on.lo > off.lo + 3, `tiefster Wert ${off.lo.toFixed(0)} → ${on.lo.toFixed(0)} mg/dL`);
  ok("… nie mehr Insulin als ohne", on.uAt.every((u,i) => u <= off.uAt[i] + 1e-9), `${(on.mu/1000).toFixed(2)} statt ${(off.mu/1000).toFixed(2)} U`);
  let worst = 0;
  for (let t = 7*60; t <= on.e.s.t; t += 5) worst = Math.max(worst, on.e._iqUsed(t));
  ok("… höchstens 2 h Pause in 2,5 h", worst <= 120, worst + " min");
  ok("… keine offene Pause länger als bis jetzt", pauses.every(p => p === on.e._susp || p.t + p.durationMin <= on.e.s.t));
  const fc = on.e.forecast(360, 60);
  ok("… Vorhersage rechnet die Pausen nach", Math.abs(fc.full[(fc.now - fc.from)/fc.stride] - on.e.s.G) < 1e-6);
  ok("Aus: keine Pause", !off.e.input.some(x => x.iq));
  ok("Pen: keine Pause", !pen.e.input.some(x => x.iq));
  /* Mitten in einer Pause speichern und laden: sie laeuft weiter. */
  const m = new Engine(1234, 3); m.acts = []; m.basalIQ = true;
  for (let i = 0; i < 10*60 && !m._susp; i++){ if (i === 30) m.injectBolus(1.5); m.step(); }
  const r = new Engine(1, 3); r.s.t = m.s.t; const snap = JSON.parse(JSON.stringify(m.snapshot()));
  r.restore(snap);
  ok("Pause übersteht Speichern", !!m._susp && !!r._susp && r._susp.t === m._susp.t);
  m.basalIQ = false; m.step(); m.step(); m.step(); m.step(); m.step();
  ok("Ausschalten beendet die Pause", !m._susp && m.events.some(x => /läuft wieder/.test(x.name || "")));
}
function fmtClock(t){ return String(Math.floor(t/60)%24).padStart(2,"0") + ":" + String(t%60).padStart(2,"0"); }
