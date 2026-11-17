/**
 * Nebel-Kalibrierung: bewusste, belegte Abweichungen von den Quellwerten.
 *
 * Die Engine rechnet ExtHovorka exakt so wie die Referenzimplementierung —
 * das prueft der Orakelabgleich, und der braucht die unveraenderten
 * Quellwerte. Wo ein Quellwert nachweislich nicht zur Wirklichkeit passt,
 * wird er HIER korrigiert, an genau einer Stelle, mit Beleg.
 *
 *   Quelle:  withPopulationConstants(subject)   — Orakel, Tests der Gleichungen
 *   Nebel:   nebelParameters(subject)           — App, Viewer, Kalibrierskripte
 *
 * Jeder Eintrag steht auch in docs/20_Parameter_Registry.md, Abschnitt 7.
 * Regel aus der Parameterpolitik: ein Wert ist entweder Quelle oder Nebel,
 * nie beides zugleich, und die Quelle bleibt immer abrufbar.
 */

import { withPopulationConstants, type Parameters, type SubjectParameters } from "./parameters.js";
import { basalEquilibrium, derivatives, initialState } from "./model.js";
import { rk4Step } from "./solver.js";
import type { StateVector } from "./state.js";

export const NEBEL_CALIBRATION = {
  /**
   * Plasma -> Interstitium [min]. Quelle 15 min. ISPAD: 5–10 min physiologische
   * Verzoegerung; Vettoretti 2019: tau 3,8 min (IQR 2,39–5,37). Zulaessig ohne
   * Nebenwirkung, weil IG von keinem anderen Zustand gelesen wird.
   * Widerspruchspruefung W9.
   */
  tsub: 5,
  /**
   * Subkutane Insulinaufnahme [min], fuer alle Subjekte gleich. Quelle 58–131 min
   * (Median 109): 1 U wirkt dort am staerksten nach 1,7 h, Tiefpunkt nach 6,1 h.
   * Fachinformation Insulin aspart (NovoRapid) 5.1/5.2: Maximum nach 1–3 h,
   * Wirkdauer 3–5 h, Plasmaspitze 40 min (IQR 30–40). Mit 50 min: Maximum 1,0 h,
   * Tiefpunkt 3,5 h (Median der 20). Die Plasmaspitze kommt dann nach ~59 min;
   * beides zugleich trifft das Modell mit einem Parameter nicht, Vorrang hat die
   * sichtbare Wirkung. Das Basalgleichgewicht haengt nicht von tmaxI ab.
   * Changelog Nachtrag 9.
   */
  tmaxI: 50,
} as const satisfies Partial<Record<keyof Parameters, number>>;

/** Kalibrierung auf einen vollstaendigen Parametersatz anwenden. Veraendert die Eingabe nicht. */
export const applyNebelCalibration = (p: Parameters): Parameters => ({ ...p, ...NEBEL_CALIBRATION });

/**
 * Akute Bewegungsantwort, je Koerper. Die Quellwerte p3/p4 (Glukoseaufnahme in
 * den Muskel) streuen so stark, dass dieselbe Stunde bei 55 % HRR je nach Subjekt
 * 5 % bis 83 % der Glukose abbaut, ohne Bewegung (P2) sogar leicht steigt.
 * Belege: DirecNet 2005 (Tsalikian et al., PMC2258153), 75 min bei ~55 % VO2max mit Basal weiter:
 * 82 % fallen um mindestens 25 %, 22 % auf 60 mg/dL oder tiefer. T1DEXI 2023:
 * aerob −18 ± 39 mg/dL in ~30 min, Intervall −14, Kraft −9 (grosse Streuung).
 * Kalibriert wird ein gemeinsamer Faktor k auf p3 und p4 (nicht p5, die
 * Nachwirkung haengt daran): im Basalgleichgewicht bei 6 mmol/L faellt die
 * Glukose in 60 min bei 55 % HRR um floor + span·(1 − e^(−eigen/scale)), also
 * 20–60 %. Die Reihenfolge der Koerper bleibt, die Extreme werden gestaucht.
 * Changelog Nachtrag 43, Registry Abschnitt 7.
 */
export const EXERCISE_CALIBRATION = {
  hrr: 0.55, minutes: 60, glucoseMmolL: 6, floor: 0.18, span: 0.36, scale: 0.35,
} as const;

/** Relativer Glukoseabfall nach `minutes` bei `hrr`, mit p3/p4 ×k, aus dem Gleichgewicht z0. */
export const exerciseDrop = (
  p: Parameters, k: number, hrr = EXERCISE_CALIBRATION.hrr, minutes: number = EXERCISE_CALIBRATION.minutes,
  basal = basalEquilibrium(p, EXERCISE_CALIBRATION.glucoseMmolL), z0: StateVector = initialState(p, basal),
): number => {
  const q = { ...p, p3: p.p3 * k, p4: p.p4 * k };
  const inp = { uFastCarbs: 0, uSlowCarbs: 0, uHR: p.HRrest + hrr * (p.HRmax - p.HRrest), uInsulin: basal };
  let z = z0;
  for (let t = 0; t < minutes; t++) z = rk4Step(derivatives, z, t, 1, q, inp);
  return 1 - z[6]! / z0[6]!;   // G = Q1/VG, das Verhaeltnis genuegt
};

/** p3/p4 so skalieren, dass die Stunde bei 55 % HRR das Ziel aus EXERCISE_CALIBRATION trifft. */
export const calibrateExercise = (p: Parameters): Parameters => {
  const c = EXERCISE_CALIBRATION, basal = basalEquilibrium(p, c.glucoseMmolL), z0 = initialState(p, basal);
  const drop = (k: number) => exerciseDrop(p, k, c.hrr, c.minutes, basal, z0);
  const target = c.floor + c.span * (1 - Math.exp(-Math.max(0, drop(1)) / c.scale));
  let lo = Math.log(0.02), hi = Math.log(50);   // Abfall steigt monoton mit k
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (drop(Math.exp(m)) < target) lo = m; else hi = m; }
  const k = Math.exp((lo + hi) / 2);
  return { ...p, p3: p.p3 * k, p4: p.p4 * k };
};

const cache = new WeakMap<SubjectParameters, Parameters>();

/** Der Parametersatz, mit dem Nebel rechnet: Quellsubjekt, Populationskonstanten, Kalibrierung. */
export const nebelParameters = (s: SubjectParameters): Parameters => {
  let p = cache.get(s);
  if (!p) cache.set(s, p = calibrateExercise(applyNebelCalibration(withPopulationConstants(s))));
  return p;
};
