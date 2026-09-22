/**
 * Zustandsvektor des ExtHovorka-Modells.
 * Die Reihenfolge ist normativ: Solver, Tests und der Orakelabgleich haengen daran.
 * Siehe docs/10_Engine_Spec_V2 Abschnitt 4.
 */

export const STATE_NAMES = [
  "S1",      // 0  subkutanes Insulin, Kompartiment 1        [mU]
  "S2",      // 1  subkutanes Insulin, Kompartiment 2        [mU]
  "I",       // 2  Plasmainsulin                             [mU/L]
  "x1",      // 3  Insulinwirkung Transport                  [1/min]
  "x2",      // 4  Insulinwirkung Utilisation                [1/min]
  "x3",      // 5  Insulinwirkung EGP-Suppression            [-]
  "Q1",      // 6  zentrale Glukosemasse                     [mmol]
  "Q2",      // 7  periphere Glukosemasse                    [mmol]
  "IG",      // 8  interstitielle Glukose                    [mmol/L]
  "D1Slow",  // 9  langsame KH, Kompartiment 1               [mmol]
  "D2Slow",  // 10 langsame KH, Kompartiment 2               [mmol]
  "D1Fast",  // 11 schnelle KH, Kompartiment 1               [mmol]
  "D2Fast",  // 12 schnelle KH, Kompartiment 2               [mmol]
  "EEfast",  // 13 schnelle Bewegungsantwort                 [-]
  "EEhigh",  // 14 hochintensiver Anteil                     [-]
  "EElong",  // 15 verzoegerter Nacheffekt                   [-]
] as const;

export type StateName = (typeof STATE_NAMES)[number];
export const STATE_COUNT = STATE_NAMES.length;

export const STATE_UNITS: Record<StateName, string> = {
  S1: "mU", S2: "mU", I: "mU/L",
  x1: "1/min", x2: "1/min", x3: "-",
  Q1: "mmol", Q2: "mmol", IG: "mmol/L",
  D1Slow: "mmol", D2Slow: "mmol", D1Fast: "mmol", D2Fast: "mmol",
  EEfast: "-", EEhigh: "-", EElong: "-",
};

export const STATE_INDEX = Object.freeze(
  Object.fromEntries(STATE_NAMES.map((n, i) => [n, i])) as Record<StateName, number>,
);

/** Dichter Zustandsvektor. Laenge immer STATE_COUNT. */
export type StateVector = Float64Array;

export const createState = (): StateVector => new Float64Array(STATE_COUNT);

export const get = (s: StateVector, name: StateName): number => s[STATE_INDEX[name]]!;
export const set = (s: StateVector, name: StateName, v: number): void => {
  s[STATE_INDEX[name]] = v;
};

export const toRecord = (s: StateVector): Record<StateName, number> =>
  Object.fromEntries(STATE_NAMES.map((n, i) => [n, s[i]!])) as Record<StateName, number>;

export const assertFinite = (s: StateVector, context: string): void => {
  for (let i = 0; i < STATE_COUNT; i++) {
    if (!Number.isFinite(s[i]!)) {
      throw new Error(`${context}: Zustand ${STATE_NAMES[i]} ist ${s[i]}`);
    }
  }
};

/** Serialisierter Zustand fuer Persistenz und Wiederaufnahme. */
export interface SerializedState {
  v: 1;
  s: number[];
}

export const serializeState = (s: StateVector): SerializedState => {
  if (s.length !== STATE_COUNT) throw new RangeError(`serializeState: ${s.length} statt ${STATE_COUNT}`);
  return { v: 1, s: Array.from(s) };
};

export const deserializeState = (o: SerializedState): StateVector => {
  if (o?.v !== 1) throw new Error("deserializeState: unbekannte Version");
  if (o.s.length !== STATE_COUNT) throw new RangeError(`deserializeState: ${o.s.length} statt ${STATE_COUNT}`);
  return Float64Array.from(o.s);
};
