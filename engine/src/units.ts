/**
 * Einheiten und Umrechnungen.
 *
 * Intern rechnet die Engine durchgaengig SI-nah:
 *   Zeit mmin, Glukosekonzentration mmol/L, Glukosemasse mmol,
 *   Insulin mU bzw. mU/min, Plasmainsulin mU/L, Kohlenhydrate mmol/min.
 *
 * Umrechnung in mg/dL, Gramm und Insulineinheiten passiert ausschliesslich hier
 * und wird nur an der UI-Grenze aufgerufen. Siehe docs/10_Engine_Spec_V2 Abschnitt 3.
 */

/** 1 mmol/L Glukose entspricht 18.0182 mg/dL. */
export const MGDL_PER_MMOLL = 18.0182;

/** Molare Masse Glukose in g/mmol. */
export const G_PER_MMOL_GLUCOSE = 0.180156;

/** 1 Internationale Einheit Insulin entspricht 1000 mU. */
export const MU_PER_UNIT = 1000;

export const mmollToMgdl = (mmoll: number): number => mmoll * MGDL_PER_MMOLL;
export const mgdlToMmoll = (mgdl: number): number => mgdl / MGDL_PER_MMOLL;

export const gCarbsToMmol = (grams: number): number => grams / G_PER_MMOL_GLUCOSE;
export const mmolToGCarbs = (mmol: number): number => mmol * G_PER_MMOL_GLUCOSE;

export const unitsToMU = (units: number): number => units * MU_PER_UNIT;
export const muToUnits = (mu: number): number => mu / MU_PER_UNIT;

/** Basalrate: U/h -> mU/min. */
export const basalRateToMUPerMin = (unitsPerHour: number): number =>
  (unitsPerHour * MU_PER_UNIT) / 60;

/** Bolus: U, ueber dauerMin gleichmaessig verteilt -> mU/min. */
export const bolusToMUPerMin = (units: number, durationMin: number): number => {
  if (durationMin <= 0) throw new RangeError("bolusToMUPerMin: durationMin muss > 0 sein");
  return (units * MU_PER_UNIT) / durationMin;
};

/**
 * Klinische Schwellen nach ADA 2026, in mmol/L.
 * Anzeigeschicht. NICHT mit den Modellschwellen aus CONSTANTS verwechseln.
 */
export const CLINICAL_THRESHOLDS_MMOLL = {
  hypoLevel2: 3.0,
  hypoLevel1: 3.9,
  targetLow: 3.9,
  targetHigh: 10.0,
} as const;
