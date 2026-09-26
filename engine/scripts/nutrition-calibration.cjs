/**
 * Kalibrierung und Nachrechnung von Fett und Eiweiss.
 * Siehe docs/11_Fett_und_Eiweiss.md und docs/20_Parameter_Registry.md Abschnitt 8.
 *
 *  1. Fett-Insulinresistenz: fatResistancePerG so, dass das Wolpert-Szenario
 *     im Mittel der 20 Subjekte m = 1,42 ergibt.
 *  2. Eiweiss: proteinGlucoseYield nach kleinsten Quadraten auf die vier
 *     Paterson-Punkte (75 g und 100 g, 180–240 und 240–300 min, jeweils Mitte
 *     des 95-%-Konfidenzintervalls), wieder im Mittel der 20 Subjekte.
 *     proteinTauMin bestimmen die Daten nicht (siehe docs/11).
 *  3. Gegenproben Smart 2013 und O'Connell 2021, Streuung ueber die zehn
 *     Personen der App.
 *
 * Aufruf: npm run check:adapter (baut dist/engine.cjs), dann
 *         node scripts/nutrition-calibration.cjs          Nachrechnung
 *         node scripts/nutrition-calibration.cjs --fit    Kalibrierung (dauert Minuten)
 */
const path = require("path"), fs = require("fs");
const N = require(path.join(__dirname, "../dist/engine.cjs"));
const dir = path.join(__dirname, "../vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients");
const load = (k) => {
  const r = JSON.parse(fs.readFileSync(path.join(dir, `Patient_${k}.json`), "utf8")), m = r.model_parameters, d = r.demographic_info;
  return {
    p: N.nebelParameters({ kb1:m.kb1,kb2:m.kb2,kb3:m.kb3,EGP0:m.EGP0,F01:m.F01,tmaxI:m.tmaxI,p3:m.p3,p4:m.p4,p5:m.p5,
         BW:m.BW,HRrest:m.HRrest,HRmax:m.HRmax,VG:m.VG,VI:m.VI,VT_HRR:m.VT_HRR }),
    th: { basalRateUPerH: d.basal, carbRatioGPerU: d.carb_insulin_ratio, correctionFactor: d.correction_bolus },
  };
};
const f2 = (x) => x.toFixed(2);
const REF = load(10);   // Lena, typischste Person der App
const fit = process.argv.includes("--fit");

const ALL = Array.from({ length: 20 }, (_, i) => load(i + 1));
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

if (fit) {
  /* Die Studien berichten Kohortenmittel. Kalibriert wird deshalb auf das
     Mittel aller 20 Subjekte des Datensatzes, nicht auf eine Person. */
  /* 1. Fett: m haengt nahezu linear von fatResistancePerG ab — zwei Stuetzstellen,
        linear interpoliert, dann einmal nachgeprueft. */
  const WOLPERT = 1.42;
  const mAt = (k) => avg(ALL.map((S) => N.wolpertInsulinRatio(S.p, S.th, { ...N.NUTRITION, fatResistancePerG: k })));
  const k1 = 0.015, k2 = 0.03, m1 = mAt(k1), m2 = mAt(k2);
  const k = k1 + (WOLPERT - m1) * (k2 - k1) / (m2 - m1);
  console.log(`Fett: mittleres m bei ${k1} = ${f2(m1)}, bei ${k2} = ${f2(m2)} -> fatResistancePerG ${k.toFixed(4)}, Probe m = ${f2(mAt(k))}`);

  /* 2. Eiweiss: fast linear in der Ausbeute. */
  const target = [[75, 0.71, 1.645], [100, 1.065, 1.725]];
  for (const tau of [60, 90, 120]) {
    const n = { ...N.NUTRITION, proteinTauMin: tau, proteinGlucoseYield: 0.1 };
    const rows = target.map(([g]) => {
      const r = ALL.map((S) => N.patersonProteinExcess(S.p, S.th, g, n));
      return { a: avg(r.map((x) => x.w180to240)), b: avg(r.map((x) => x.w240to300)) };
    });
    let num = 0, den = 0, sse = 0;
    rows.forEach((r, i) => { for (const [x, y] of [[r.a, target[i][1]], [r.b, target[i][2]]]) { num += x * y; den += x * x; } });
    const kk = num / den;
    rows.forEach((r, i) => { sse += (kk * r.a - target[i][1]) ** 2 + (kk * r.b - target[i][2]) ** 2; });
    console.log(`Eiweiss: tau ${tau} -> proteinGlucoseYield ${(0.1 * kk).toFixed(3)} (SSE ${sse.toFixed(3)})`);
  }
  process.exit(0);
}

console.log("Konstanten:", JSON.stringify(N.NUTRITION));
console.log(`\nReferenz Patient 10`);
console.log(`  Wolpert m = ${f2(N.wolpertInsulinRatio(REF.p, REF.th))}   (Studie: 1,42; Spanne einzeln 0,83–2,08)`);
for (const g of [25, 50, 75, 100]) {
  const r = N.patersonProteinExcess(REF.p, REF.th, g);
  console.log(`  Paterson ${String(g).padStart(3)} g: 60–120 ${f2(r.w60to120)} · 180–240 ${f2(r.w180to240)} · 240–300 ${f2(r.w240to300)} mmol/L`);
}
console.log("  Paterson Studie:   75 g 180–240 0,01…1,41 · 240–300 0,93…2,36; 100 g 0,40…1,73 · 1,04…2,41; 100 g 60–120 −1,74…−0,71");
const s = N.smartCrossCheck(REF.p, REF.th);
console.log(`  Smart (Gegenprobe): Fett ${f2(s.fatAt5h)} · Eiweiss ${f2(s.proteinAt5h)} · beides ${f2(s.bothAt5h)} mmol/L nach 5 h; Fett erste 90 min ${f2(s.fatFirst90)}`);
console.log("  Smart Studie (Kinder): 2,3 · 2,4 · 5,4 mmol/L nach 5 h; Fett daempft die ersten 90 min");
for (const g of [13, 26, 39, 51]) {
  const o = N.oConnellFatExcess(REF.p, REF.th, g);
  console.log(`  O'Connell ${String(g).padStart(2)} g Fett: 120–240 ${f2(o.w120to240)} · 240–330 ${f2(o.w240to330)} · 330–480 ${f2(o.w330to480)} mmol/L   (Studie ab 330 min: ${f2(0.028 * (g - 1))}, KI ${f2(0.015 * (g - 1))}–${f2(0.039 * (g - 1))})`);
}

console.log(`\nMittel der 20 Subjekte (die Studien berichten Kohortenmittel)`);
{
  const m = avg(ALL.map((S) => N.wolpertInsulinRatio(S.p, S.th)));
  const pa = [75, 100].map((g) => { const r = ALL.map((S) => N.patersonProteinExcess(S.p, S.th, g));
    return `${g} g ${f2(avg(r.map((x) => x.w180to240)))} / ${f2(avg(r.map((x) => x.w240to300)))}`; });
  const sm = ALL.map((S) => N.smartCrossCheck(S.p, S.th));
  const oc = [13, 26, 39, 51].map((g) => `${g} g ${f2(avg(ALL.map((S) => N.oConnellFatExcess(S.p, S.th, g).w330to480)))}`);
  console.log(`  Wolpert m ${f2(m)}`);
  console.log(`  Paterson 180–240 / 240–300: ${pa.join(" · ")}`);
  console.log(`  Smart nach 5 h: Fett ${f2(avg(sm.map((x) => x.fatAt5h)))} · Eiweiss ${f2(avg(sm.map((x) => x.proteinAt5h)))} · beides ${f2(avg(sm.map((x) => x.bothAt5h)))}; Fett erste 90 min ${f2(avg(sm.map((x) => x.fatFirst90)))}`);
  console.log(`  O'Connell 330–480: ${oc.join(" · ")}`);
}

console.log(`\nDie zehn Personen der App`);
for (const k of [10, 4, 6, 7, 8, 11, 13, 14, 15, 18]) {
  const P = load(k), sm = N.smartCrossCheck(P.p, P.th), pa = N.patersonProteinExcess(P.p, P.th, 75);
  console.log(`  P${String(k).padEnd(3)} Wolpert m ${f2(N.wolpertInsulinRatio(P.p, P.th))} · Paterson 75 g 240–300 ${f2(pa.w240to300)} · Smart Fett ${f2(sm.fatAt5h)} Eiweiss ${f2(sm.proteinAt5h)} beides ${f2(sm.bothAt5h)}`);
}
