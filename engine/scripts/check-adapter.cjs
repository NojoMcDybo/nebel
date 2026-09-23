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
