/**
 * ExtHovorka, 16 Zustaende.
 * Gleichungen: docs/10_Engine_Spec_V2_ExtHovorka.md Abschnitt 6.
 *
 * Implementiert aus den publizierten Gleichungen. Kein Code aus py-mgipsim.
 * Das Basalgleichgewicht wird bewusst numerisch bestimmt statt ueber einen
 * uebernommenen geschlossenen Ausdruck — robuster und lizenzsauber.
 */

import { STATE_COUNT, createState, set, type StateVector } from "./state.js";
import { rk4Step } from "./solver.js";
import { MODEL_CONSTANTS, type Parameters } from "./parameters.js";

export interface ModelInputs {
  uFastCarbs: number; // [mmol/min]
  uSlowCarbs: number; // [mmol/min]
  uHR: number;        // [bpm]
  uInsulin: number;   // [mU/min]
}

export const NOT_IMPLEMENTED = "NICHT IMPLEMENTIERT";

const C = MODEL_CONSTANTS;
const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);

/** Glukosekonzentration aus der zentralen Masse, mit numerischer Klammerung. */
export const glucoseFrom = (Q1: number, VG: number): number =>
  clamp(Q1 / VG, C.glucoseClampMmolL.min, C.glucoseClampMmolL.max);

/** Glukoseabhaengige Modulation der Insulinsensitivitaet. Keine Tageszeitabhaengigkeit. */
export const sensitivityFactor = (G: number, p: Parameters): number => {
  const hypo =
    (p.aSI * Math.tanh(G / p.b + p.dSI) + p.c) /
    (p.aSI * Math.tanh(C.siNormGlucoseMmolL / p.b + p.dSI) + p.c);
  const hyper = 1 - C.hyperSiSlope * (G - C.hyperSiRefMmolL);
  return hypo * hyper;
};

/** Nicht-insulinabhaengige Aufnahme, unterhalb der Schwelle linear reduziert. */
export const nonInsulinUptake = (G: number, p: Parameters): number => {
  const base = p.BW * p.F01;
  return G < C.f01ThresholdMmolL ? (base * G) / C.f01ThresholdMmolL : base;
};

/** Renale Elimination oberhalb der Nierenschwelle. */
export const renalClearance = (G: number, p: Parameters): number =>
  G >= C.renalThresholdMmolL ? C.renalSlope * (G - C.renalThresholdMmolL) * p.VG : 0;

/** Anteil der Herzfrequenzreserve und Anteil oberhalb der ventilatorischen Schwelle. */
export const heartRateReserve = (
  HR: number, p: Parameters,
): { hrr: number; hrrHigh: number } => {
  const hrr = clamp((HR - p.HRrest) / (p.HRmax - p.HRrest), 0, 1);
  const hrrHigh = clamp((hrr - p.VT_HRR) / (1 - p.VT_HRR), 0, 1);
  return { hrr, hrrHigh };
};

/** dz/dt fuer den 16-Zustandsvektor. */
export const derivatives = (
  state: StateVector, _t: number, p: Parameters, u: ModelInputs,
): StateVector => {
  const [S1, S2, I, x1, x2, x3, Q1raw, Q2, IG, D1Slow, D2Slow, D1Fast, D2Fast, EEfast, EEhigh, EElong] =
    [
      state[0]!, state[1]!, state[2]!, state[3]!, state[4]!, state[5]!, state[6]!, state[7]!,
      state[8]!, state[9]!, state[10]!, state[11]!, state[12]!, state[13]!, state[14]!, state[15]!,
    ];

  const G = glucoseFrom(Q1raw, p.VG);
  const Q1 = G * p.VG;
  const si = sensitivityFactor(G, p);

  const d = new Float64Array(STATE_COUNT);

  // Insulinabsorption und Plasmainsulin
  d[0] = u.uInsulin - S1 / p.tmaxI;
  d[1] = (S1 - S2) / p.tmaxI;
  d[2] = S2 / (p.VI * p.tmaxI) - p.ke * I;

  // Insulinwirkung, drei Pfade
  d[3] = p.kb1 * si * I - p.ka1 * x1;
  d[4] = p.kb2 * si * I - p.ka2 * x2;
  d[5] = p.kb3 * si * I - p.ka3 * x3;

  // Bewegung
  const { hrr, hrrHigh } = heartRateReserve(u.uHR, p);

  // Glukoseflüsse
  const F01n = nonInsulinUptake(G, p);
  const FR = renalClearance(G, p);
  const UGe = D2Slow / p.tmaxG + D2Fast / p.tmaxGFast;
  const EGP = Math.max(0, p.EGP0 * (1 - x3) * (1 + p.p1 * EEfast + p.p2 * EEhigh));

  d[6] = -x1 * Q1 + p.k12 * Q2 - F01n - FR + UGe + EGP - p.p3 * EEfast;
  d[7] = x1 * Q1 - p.k12 * Q2 - x2 * Q2 + p.p3 * EEfast - p.p4 * EEfast - p.p5 * x2 * EElong;

  // Interstitium
  d[8] = (G - IG) / p.tsub;

  // Kohlenhydrate, langsam und schnell getrennt
  d[9] = p.AG * u.uSlowCarbs - D1Slow / p.tmaxG;
  d[10] = (D1Slow - D2Slow) / p.tmaxG;
  d[11] = p.AG * u.uFastCarbs - D1Fast / p.tmaxGFast;
  d[12] = (D1Fast - D2Fast) / p.tmaxGFast;

  // Bewegungszustaende
  d[13] = p.p6 * (hrr - EEfast);
  d[14] = p.p8 * (hrrHigh - EEhigh);
  d[15] = p.p6 * EEfast - p.p7 * EElong;

  return d;
};

/**
 * Residuum der Glukosebilanz im Ruhezustand bei konstantem Insulinstrom.
 * Null bedeutet Gleichgewicht.
 */
const steadyResidual = (G: number, basalMUPerMin: number, p: Parameters): number => {
  const I = basalMUPerMin / (p.VI * p.ke);
  const si = sensitivityFactor(G, p);
  const x1 = (p.kb1 * si * I) / p.ka1;
  const x2 = (p.kb2 * si * I) / p.ka2;
  const x3 = (p.kb3 * si * I) / p.ka3;
  const Q1 = G * p.VG;
  // dQ2 = 0  =>  Q2 = x1*Q1 / (k12 + x2)
  const netDisposal = (x1 * Q1 * x2) / (p.k12 + x2);
  const EGP = Math.max(0, p.EGP0 * (1 - x3));
  return -netDisposal - nonInsulinUptake(G, p) - renalClearance(G, p) + EGP;
};

const bisect = (
  f: (x: number) => number, lo: number, hi: number, iterations = 120,
): number => {
  let a = lo, b = hi;
  let fa = f(a);
  if (fa === 0) return a;
  if (fa * f(b) > 0) return fa > 0 ? b : a;
  for (let i = 0; i < iterations; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
};

/** Zustand aus Insulinspiegel und Glukose, ohne Mahlzeit und ohne Bewegung. */
const restingStateAt = (p: Parameters, G: number, basalMUPerMin: number): StateVector => {
  const I = basalMUPerMin / (p.VI * p.ke);
  const si = sensitivityFactor(G, p);
  const x1 = (p.kb1 * si * I) / p.ka1;
  const x2 = (p.kb2 * si * I) / p.ka2;
  const x3 = (p.kb3 * si * I) / p.ka3;
  const Q1 = G * p.VG;
  const s = createState();
  set(s, "S1", basalMUPerMin * p.tmaxI);
  set(s, "S2", basalMUPerMin * p.tmaxI);
  set(s, "I", I);
  set(s, "x1", x1);
  set(s, "x2", x2);
  set(s, "x3", x3);
  set(s, "Q1", Q1);
  set(s, "Q2", (x1 * Q1) / (p.k12 + x2));
  set(s, "IG", G);
  return s;
};

/**
 * Eingeschwungener Zustand bei konstanter Basalrate — durch Relaxation, nicht
 * algebraisch.
 *
 * Begruendung: Das Residuum der Glukosebilanz hat bei einer passend gewaehlten
 * Basalrate eine tangentiale Nullstelle (die Rate ist ja genau darauf gefittet,
 * den Zielwert zu halten). Ein Vorzeichenwechsel existiert dort nicht, jedes
 * Bisektionsverfahren scheitert. Ausintegrieren ist robust und liefert genau
 * den Zustand, den ein Simulator ohnehin braucht.
 */
export const equilibriumState = (
  p: Parameters, basalMUPerMin: number, settleMin = 4320,
): StateVector => {
  const u: ModelInputs = { uFastCarbs: 0, uSlowCarbs: 0, uHR: p.HRrest, uInsulin: basalMUPerMin };
  let s = restingStateAt(p, 6, basalMUPerMin);
  for (let t = 0; t < settleMin; t++) s = rk4Step(derivatives, s, t, 1, p, u);
  return s;
};

/** Gleichgewichtsglukose [mmol/L] bei konstantem Basalinsulin [mU/min]. */
export const equilibriumGlucose = (p: Parameters, basalMUPerMin: number): number =>
  glucoseFrom(equilibriumState(p, basalMUPerMin)[6]!, p.VG);

/**
 * Basalrate [mU/min], die eine Zielglukose haelt.
 * Hier ist Bisektion zulaessig: das Residuum ist bei festem G monoton im Insulin.
 */
export const basalEquilibrium = (p: Parameters, targetGlucoseMmolL: number): number =>
  bisect((u) => -steadyResidual(targetGlucoseMmolL, u, p), 0, 2000);

/** Anfangszustand im Gleichgewicht bei gegebener Basalrate. */
export const initialState = (p: Parameters, basalMUPerMin: number): StateVector =>
  equilibriumState(p, basalMUPerMin);
