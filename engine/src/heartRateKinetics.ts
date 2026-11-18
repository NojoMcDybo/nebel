/**
 * Herzfrequenz-Kinetik: aus einer Belastung wird eine Herzfrequenzspur mit
 * Anstieg, Drift oberhalb der Schwelle und Erholung. Siehe
 * docs/20_Parameter_Registry.md Abschnitt 11.
 *
 * Quelle der Gleichungen und Parameter: Svendby SR (2016), Mathematical
 * Modelling of Heart Rate During Cycling Exercise, Masterarbeit, Universitaet
 * Oslo, http://hdl.handle.net/10852/52702, Kapitel 10, Gl. 10.4–10.20 und
 * Tabelle 10.1. Rashid et al. 2019 (DOI 10.1016/j.compchemeng.2019.106565)
 * nennen dieses Modell als Herzfrequenzmodell ihres Simulators. Umgesetzt aus
 * der Arbeit, nicht aus dem Code von py-mgipsim (GPL-3.0).
 *
 * Drei Anteile der Herzfrequenzreserve, alle auf die Reserve normiert:
 *   νL  schnell, Sauerstoffbedarf der arbeitenden Muskeln      (τL)
 *   νG  langsamer, Abbau von Laktat; oberhalb der Schwelle      (G-Modell)
 *       kein Gleichgewicht, die Herzfrequenz driftet nach oben
 *   νM  sehr langsam, Waerme und Stoffwechsel; haelt nach harter (τM)
 *       Belastung lange an
 *
 *   νMmax konstant, νLmax' = νLmax − νM/2, νGmax' = νGmax − νM/2
 *   DL(p)  = νLmax' · 2 · (1/(1 + e^(−p/αL)) − 0,5)
 *   dνL/dt = (DL(p) − νL) / τL
 *   dG/dt  = p0 + (e^(p/pT) − 1)/τp − (r0 + 1 − e^(−p/pT)) · (1 − e^(−G/α))/τr
 *   dM/dt  = (β·p − M) / τM
 *   νG     = νGmax' · (1 − e^(−(G − G0)/αG))
 *   νM     = νMmax / (1 + e^(−(M − M0)/αM))
 *   τr = frem(0, G0)/p0,  τp = fprod(pT) / (frem(pT, GT)/τr − p0)   (Gl. 10.17, 10.18)
 *
 * p ist die Leistung als Anteil der maximalen aeroben Leistung (MAP).
 *
 * Nebel-Entscheidungen (Status N):
 * - pT = VT_HRR des Koerpers. Unterhalb der Schwelle ist die Herzfrequenz in
 *   der Arbeit linear in der Leistung (Kap. 10.8), Leistungs- und Reserveanteil
 *   fallen dort zusammen. Die Arbeit fittet pT je Person, ExtHovorka liefert
 *   VT_HRR je Person.
 * - τL = 30 s fuer alle (typischer Wert, Kap. 11.1). Die Arbeit fittet τL je Person.
 * - Die Ruhe ist exakt HRrest: der kleine Ruhebeitrag von νM bei M = 0
 *   (0,07 % der Reserve) wird abgezogen. Ohne Belastung aendert sich nichts.
 * - Die Intensitaet in der App bleibt ein Herzfrequenzziel. powerForHrr rechnet
 *   sie ueber das Gleichgewicht in eine Leistung um; oberhalb der Schwelle gibt
 *   es kein Gleichgewicht, dort Steigung 1 ab der Schwelle.
 * - Die Arbeit rechnet in Sekunden, Nebel in Minuten: p0 und alle Zeitkonstanten
 *   sind umgerechnet.
 */

import type { Parameters } from "./parameters.js";
import type { HeartRateEvent } from "./events.js";

export const HR_KINETICS = {
  /** Tabelle 10.1. */
  alpha: 0.3,
  alphaL: 0.2,
  alphaG: 0.82,
  alphaM: 0.12,
  beta: 2,
  /** 0,0025 1/s = 0,15 1/min. */
  p0PerMin: 0.15,
  r0: 0.17,
  G0: 0.25,
  M0: 0.6,
  /** 1500 s. */
  tauMMin: 25,
  nuLmax: 0.5,
  nuGmax: 0.5,
  nuMmax: 0.1,
  /** G an der Schwelle, per Definition 1 (Kap. 10.6). */
  GT: 1,
  /** 30 s, Kap. 11.1 (NEBEL-ANNAHME: fuer alle gleich). */
  tauLMin: 0.5,
  /** RK4-Teilschritte je Minute. τr ≈ 0,64 min verlangt kleine Schritte. */
  substeps: 10,
} as const;

/** Zustand der Kinetik: [νL, G, M]. */
export type HrKineticsState = readonly [number, number, number];

export const HR_KINETICS_REST: HrKineticsState = [0, HR_KINETICS.G0, 0];

const K = HR_KINETICS;
const fprod = (p: number, pT: number) => Math.exp(p / pT) - 1;
const fremP = (p: number, pT: number) => K.r0 + 1 - Math.exp(-p / pT);
const fremG = (G: number) => 1 - Math.exp(-Math.max(0, G) / K.alpha);
/** Gl. 10.17 und 10.18, in Minuten. */
const tauR = K.r0 * fremG(K.G0) / K.p0PerMin;
const tauP = (pT: number) => fprod(pT, pT) / (fremP(pT, pT) * fremG(K.GT) / tauR - K.p0PerMin);

const nuM = (M: number) => K.nuMmax / (1 + Math.exp(-(M - K.M0) / K.alphaM));
const NU_M_REST = nuM(0);

const derivs = (s: HrKineticsState, p: number, pT: number): [number, number, number] => {
  const [nuL, G, M] = s;
  const DL = (K.nuLmax - nuM(M) / 2) * 2 * (1 / (1 + Math.exp(-p / K.alphaL)) - 0.5);
  return [
    (DL - nuL) / K.tauLMin,
    K.p0PerMin + fprod(p, pT) / tauP(pT) - fremP(p, pT) * fremG(G) / tauR,
    (K.beta * p - M) / K.tauMMin,
  ];
};

/** Eine Minute bei konstanter Leistung p (Anteil der MAP). */
export const hrKineticsStep = (s: HrKineticsState, p: number, pT: number): HrKineticsState => {
  const h = 1 / K.substeps;
  let z: [number, number, number] = [s[0], s[1], s[2]];
  for (let i = 0; i < K.substeps; i++) {
    const add = (k: number[], f: number): HrKineticsState => [z[0] + f * k[0]!, z[1] + f * k[1]!, z[2] + f * k[2]!];
    const k1 = derivs(z, p, pT), k2 = derivs(add(k1, h / 2), p, pT);
    const k3 = derivs(add(k2, h / 2), p, pT), k4 = derivs(add(k3, h), p, pT);
    z = [0, 1, 2].map(j => z[j]! + (h / 6) * (k1[j]! + 2 * k2[j]! + 2 * k3[j]! + k4[j]!)) as [number, number, number];
    z[1] = Math.max(0, z[1]);      // G > 0 (Kap. 10.6.3)
  }
  return z;
};

/** Anteil der Herzfrequenzreserve aus dem Zustand, Ruhe = 0, begrenzt auf [0, 1]. */
export const hrrFromKinetics = (s: HrKineticsState): number => {
  const [nuL, G, M] = s, m = nuM(M);
  const nuG = (K.nuGmax - m / 2) * (1 - Math.exp(-(G - K.G0) / K.alphaG));
  return Math.min(1, Math.max(0, nuL + nuG + m - NU_M_REST));
};

/** Gleichgewicht der Reserve bei Leistung p < pT. */
export const steadyHrr = (p: number, pT: number): number => {
  // dG/dt faellt streng in G: Nullstelle per Bisektion.
  const g = (G: number) => K.p0PerMin + fprod(p, pT) / tauP(pT) - fremP(p, pT) * fremG(G) / tauR;
  let lo = 0, hi = 50;
  if (g(hi) > 0) return 1;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
  const M = K.beta * p, m = nuM(M);
  const DL = (K.nuLmax - m / 2) * 2 * (1 / (1 + Math.exp(-p / K.alphaL)) - 0.5);
  return hrrFromKinetics([DL, (lo + hi) / 2, M]);
};

/**
 * Leistung, deren Gleichgewicht den Reserveanteil f trifft. Oberhalb dessen,
 * was unterhalb der Schwelle erreichbar ist: Schwelle plus Abstand.
 */
export const powerForHrr = (f: number, pT: number): number => {
  if (f <= 0) return 0;
  const pMax = pT * (1 - 1e-9), hT = steadyHrr(pMax, pT);
  if (f >= hT) return pT + (f - hT);
  let lo = 0, hi = pMax;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (steadyHrr(mid, pT) < f) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};

/** Stuetzstelle der Spur; hk ist der Kinetikzustand zu diesem Zeitpunkt. */
export interface KineticHeartRatePoint { t: number; bpm: number; hk: HrKineticsState }

/**
 * Herzfrequenzspur ab t0 im Minutenraster. `targets[i]` ist das Ziel der
 * Minute t0 + i als Anteil der Reserve (0 = Ruhe). Danach Erholung, bis die
 * Reserve unter `restBelow` faellt (hoechstens `maxTailMin`); der letzte Punkt
 * steht auf HRrest, damit heartRateAt danach Ruhe liefert.
 */
export const kineticHeartRateTrace = (
  t0: number, targets: readonly number[], p: Parameters,
  start: HrKineticsState = HR_KINETICS_REST, restBelow = 0.002, maxTailMin = 240,
): KineticHeartRatePoint[] => {
  const pT = p.VT_HRR, bpm = (h: number) => p.HRrest + h * (p.HRmax - p.HRrest);
  const power = new Map<number, number>();
  const pow = (f: number) => { let v = power.get(f); if (v === undefined) power.set(f, v = powerForHrr(f, pT)); return v; };
  const out: KineticHeartRatePoint[] = [];
  let s = start;
  for (let i = 0; i < targets.length; i++) {
    out.push({ t: t0 + i, bpm: bpm(hrrFromKinetics(s)), hk: s });
    s = hrKineticsStep(s, pow(targets[i]!), pT);
  }
  for (let i = targets.length; i < targets.length + maxTailMin; i++) {
    const h = hrrFromKinetics(s);
    if (h < restBelow) break;
    out.push({ t: t0 + i, bpm: bpm(h), hk: s });
    s = hrKineticsStep(s, 0, pT);
  }
  out.push({ t: t0 + out.length, bpm: p.HRrest, hk: s });
  return out;
};

/** Gleichmaessige Einheit als Herzfrequenzereignisse, Gegenstueck zu exerciseBlock. */
export const kineticExerciseBlock = (
  startMin: number, durationMin: number, hrrShare: number, p: Parameters,
): HeartRateEvent[] =>
  kineticHeartRateTrace(startMin, Array<number>(Math.round(durationMin)).fill(hrrShare), p)
    .map(({ t, bpm }) => ({ kind: "heartRate", t, bpm }));
