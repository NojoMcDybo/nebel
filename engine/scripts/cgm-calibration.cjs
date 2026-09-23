/**
 * Kalibrierungspruefung des Sensorfehlermodells ueber alle 20 Subjekte.
 * Zerlegt die Sensorabweichung in ihre Anteile — Verzoegerung, systematischer
 * Fehler, Messrauschen — und prueft, ob die Verzoegerung sichtbar bleibt.
 * Aufruf: node scripts/cgm-calibration.cjs
 */
const path = require("path"), fs = require("fs");
const N = require(path.join(__dirname, "../dist/engine.cjs"));
const dir = path.join(__dirname, "../vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients");
const subjects = fs.readdirSync(dir).filter(f => f.endsWith(".json"))
  .sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0])
  .map(f => { const r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), m = r.model_parameters, d = r.demographic_info;
    return { id: f.replace(".json", ""),
      p: { ...N.withPopulationConstants({ kb1:m.kb1,kb2:m.kb2,kb3:m.kb3,EGP0:m.EGP0,F01:m.F01,tmaxI:m.tmaxI,p3:m.p3,p4:m.p4,p5:m.p5,
             BW:m.BW,HRrest:m.HRrest,HRmax:m.HRmax,VG:m.VG,VI:m.VI,VT_HRR:m.VT_HRR }), tsub: 5 },
      th: { basalRateUPerH: d.basal, carbRatioGPerU: d.carb_insulin_ratio, correctionFactor: d.correction_bolus } }; });

const G6 = N.DEXCOM_G6_VETTORETTI_2019;
const DAYS = 3;
const variants = {
  "nur Verzoegerung (5 min)":     m => ({ ...m, a0: 1, a1: 0, a2: 0, b0: 0, sigmaW: 0 }),
  "Verzoegerung + Verstaerkung":  m => ({ ...m, sigmaW: 0 }),
  "vollstaendiges G6-Modell":     m => m,
};

function day(s, p, th) {
  const ev = [];
  for (let d = 0; d < DAYS; d++) {
    const b = d * 1440;
    for (const [h, g] of [[7.5, 45], [12.5, 70], [19, 60]]) {
      ev.push({ kind: "meal", t: b + h * 60, fastCarbsG: g * 0.4, slowCarbsG: g * 0.6 });
      ev.push({ kind: "bolus", t: b + h * 60 - 10, units: g / th.carbRatioGPerU });
    }
    ev.push(...N.exerciseBlock(b + 17 * 60, 45, p.HRrest + 0.55 * (p.HRmax - p.HRrest), p.HRrest));
  }
  return N.simulate({ durationMin: DAYS * 1440, stepMin: 1, parameters: p, therapy: th,
    pump: N.flatBasalProfile(th.basalRateUPerH), events: ev, sensor: s, solver: "rk4" });
}

const mardOf = (r) => {
  let sum = 0, n = 0, lo = [], hi = [], tir = [];
  for (let k = 0; k < r.gSensor.length; k++) {
    const i = Math.min(r.G.length - 1, Math.max(0, Math.round(r.tSensor[k]) - 1));
    const g = r.G[i] * 18.0182, cgm = r.gSensor[k] * 18.0182, e = Math.abs(cgm - g) / g;
    sum += e; n++;
    (g < 70 ? lo : g > 180 ? hi : tir).push(e);
  }
  const m = xs => xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length * 100).toFixed(1) : "—";
  return { all: sum / n * 100, lo: m(lo), tir: m(tir), hi: m(hi), nLo: lo.length };
};

const lagOf = (r) => {
  // Kreuzkorrelation der Aenderungen: bei welcher Verschiebung passt der Sensor am besten zum Koerper?
  const Gs = r.tSensor.map(t => r.G[Math.min(r.G.length - 1, Math.round(t) - 1)]);
  const dG = Gs.slice(1).map((v, i) => v - Gs[i]), dS = r.gSensor.slice(1).map((v, i) => v - r.gSensor[i]);
  let best = 0, bestC = -1;
  for (let lag = 0; lag <= 4; lag++) {
    let c = 0; for (let i = lag; i < dS.length; i++) c += dS[i] * dG[i - lag];
    if (c > bestC) { bestC = c; best = lag; }
  }
  return best * 5;
};

console.log(`\n${subjects.length} Subjekte x ${DAYS} Tage, 3 Mahlzeiten mit Bolus, 45 min Belastung pro Tag\n`);
for (const [name, fn] of Object.entries(variants)) {
  const sensor = { ...N.REALISTIC_SENSOR, errorModel: fn(G6) };
  const res = subjects.map(s => { const r = day(sensor, s.p, s.th); return { ...mardOf(r), lag: lagOf(r) }; });
  const avg = res.reduce((a, r) => a + r.all, 0) / res.length;
  const min = Math.min(...res.map(r => r.all)), max = Math.max(...res.map(r => r.all));
  const lags = res.map(r => r.lag); const lagMed = lags.sort((a, b) => a - b)[Math.floor(lags.length / 2)];
  console.log(`${name.padEnd(30)} MARD ${avg.toFixed(1).padStart(4)} %  (Spanne ${min.toFixed(1)}–${max.toFixed(1)})   Verzoegerung erkennbar: ${lagMed} min`);
  if (name.startsWith("vollst")) {
    const pooled = { lo: [], tir: [], hi: [] };
    res.forEach(r => { if (r.lo !== "—") pooled.lo.push(+r.lo); pooled.tir.push(+r.tir); if (r.hi !== "—") pooled.hi.push(+r.hi); });
    const m = xs => xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—";
    console.log(`${"".padEnd(30)} nach Bereich: <70 ${m(pooled.lo)} %  ·  70–180 ${m(pooled.tir)} %  ·  >180 ${m(pooled.hi)} %`);
  }
}
console.log(`\nTheoretische Streuung des Messrauschens: ${N.arStationarySd(G6).toFixed(2)} mg/dL, Lag-1-Autokorrelation ${(G6.alpha1/(1-G6.alpha2)).toFixed(2)}`);
