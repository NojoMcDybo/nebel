/**
 * Fixschritt-Integratoren. Schrittweite ist eine Engineering-Entscheidung,
 * kein physiologischer Parameter. Ziel: 1 min, Konvergenztest gegen 0.5 und 0.25.
 *
 * Beide Verfahren lassen den Eingangszustand unveraendert.
 */

import { STATE_COUNT, type StateVector } from "./state.js";
import type { Parameters } from "./parameters.js";
import type { ModelInputs } from "./model.js";

export type Derivatives = (
  s: StateVector, t: number, p: Parameters, u: ModelInputs,
) => StateVector;

export const eulerStep = (
  f: Derivatives, s: StateVector, t: number, h: number, p: Parameters, u: ModelInputs,
): StateVector => {
  const d = f(s, t, p, u);
  const out = new Float64Array(STATE_COUNT);
  for (let i = 0; i < STATE_COUNT; i++) out[i] = s[i]! + h * d[i]!;
  return out;
};

export const rk4Step = (
  f: Derivatives, s: StateVector, t: number, h: number, p: Parameters, u: ModelInputs,
): StateVector => {
  const add = (base: StateVector, d: StateVector, factor: number): StateVector => {
    const out = new Float64Array(STATE_COUNT);
    for (let i = 0; i < STATE_COUNT; i++) out[i] = base[i]! + factor * d[i]!;
    return out;
  };
  const k1 = f(s, t, p, u);
  const k2 = f(add(s, k1, h / 2), t + h / 2, p, u);
  const k3 = f(add(s, k2, h / 2), t + h / 2, p, u);
  const k4 = f(add(s, k3, h), t + h, p, u);
  const out = new Float64Array(STATE_COUNT);
  for (let i = 0; i < STATE_COUNT; i++) {
    out[i] = s[i]! + (h / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!);
  }
  return out;
};
