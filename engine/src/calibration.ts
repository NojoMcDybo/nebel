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

/** Der Parametersatz, mit dem Nebel rechnet: Quellsubjekt, Populationskonstanten, Kalibrierung. */
export const nebelParameters = (s: SubjectParameters): Parameters =>
  applyNebelCalibration(withPopulationConstants(s));
