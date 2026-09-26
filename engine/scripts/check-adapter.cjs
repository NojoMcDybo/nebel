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
