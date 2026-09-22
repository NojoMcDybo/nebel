/**
 * Parameter des ExtHovorka-Modells.
 * Werte und Ranges: docs/20_Parameter_Registry.md
 *
 * Bewusst NICHT enthalten: beta und a. Beide stehen im Parametervektor der
 * Referenzimplementierung, werden dort aber in keiner Gleichung verwendet
 * (Reste des aelteren Exercise-Modells). Siehe Widerspruchspruefung W4.
 */

/** Subjektspezifisch. Kommen aus einem publizierten Parametersatz, nie aus Schaetzung. */
export interface SubjectParameters {
  kb1: number;    // Verstaerkung Insulinwirkung Transport
  kb2: number;    // Verstaerkung Insulinwirkung Utilisation
  kb3: number;    // Verstaerkung Insulinwirkung EGP-Suppression
  EGP0: number;   // [mmol/min] endogene Glukoseproduktion bei null Insulinwirkung
  F01: number;    // [mmol/min/kg] nicht-insulinabhaengige Aufnahme
  tmaxI: number;  // [min] Zeitkonstante subkutane Insulinabsorption
  p3: number;     // [mmol/min] bewegungsgetriebener Fluss ins periphere Kompartiment
  p4: number;     // [mmol/min] bewegungsgetriebener peripherer Verbrauch
  p5: number;     // [mmol] verlaengerter Nacheffekt
  BW: number;     // [kg]
  HRrest: number; // [bpm]
  HRmax: number;  // [bpm]
  VG: number;     // [L] Verteilungsvolumen Glukose
  VI: number;     // [L] Verteilungsvolumen Insulin
  VT_HRR: number; // [-] ventilatorische Schwelle als Anteil der HF-Reserve
}

/** In allen 20 publizierten Subjekten identisch. */
export const POPULATION_CONSTANTS = {
  ke: 0.138,        // [1/min]  Insulin-Elimination
  k12: 0.066,       // [1/min]  Transfer peripher -> zentral
  ka1: 0.006,       // [1/min]
  ka2: 0.06,        // [1/min]
  ka3: 0.03,        // [1/min]
  AG: 0.8,          // [-]      bioverfuegbare KH-Fraktion
  tmaxG: 40,        // [min]    langsame KH
  tmaxGFast: 20,    // [min]    schnelle KH
  tsub: 15,         // [min]    Plasma -> Interstitium. Abweichung zu ISPAD 5-10 min ist bekannt, siehe W9
  aSI: -1.9,
  b: 0.28,
  c: 7,
  dSI: -12,
  p1: 2.73,         // EGP-Anhebung durch moderate Belastung
  p2: 8.23,         // EGP-Anhebung durch hochintensive Belastung
  p6: 0.18,         // [1/min] schnelle Bewegungsantwort
  p7: 0.1,          // [1/min] Abklingen des Nacheffekts
  p8: 0.1,          // [1/min] hochintensiver Pfad
} as const;

/** Modellschwellen. Keine klinischen Grenzwerte. */
export const MODEL_CONSTANTS = {
  f01ThresholdMmolL: 4.5,
  renalThresholdMmolL: 9,
  renalSlope: 0.003,
  hyperSiSlope: 0.018,
  siNormGlucoseMmolL: 5,
  hyperSiRefMmolL: 5.55,
  /** Numerischer Schutz, keine Physiologie. */
  glucoseClampMmolL: { min: 1, max: 32 },
} as const;

/**
 * Populationskonstanten sind als Zahlen typisiert, nicht als Literale: sie
 * muessen fuer Gegenproben und spaetere Sensitivitaetsanalysen ueberschreibbar
 * sein, ohne dass der Typ dagegen haelt.
 */
export type PopulationConstants = { -readonly [K in keyof typeof POPULATION_CONSTANTS]: number };

export type Parameters = SubjectParameters & PopulationConstants;

export const withPopulationConstants = (s: SubjectParameters): Parameters => ({
  ...s,
  ...POPULATION_CONSTANTS,
});

/**
 * Therapieparameter des Subjekts. Stammen aus dem publizierten Datensatz,
 * werden nicht erfunden.
 */
export interface TherapySettings {
  basalRateUPerH: number;
  carbRatioGPerU: number;
  correctionFactor: number;
}
