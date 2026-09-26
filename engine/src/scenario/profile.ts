/**
 * Antwortprofil einer Person: dieselben vier Handlungen, gemessen am Koerper.
 *
 * Erlebnisschicht, keine Physiologie: Die Engine rechnet, hier wird nur
 * standardisiert gefragt und gemessen. Gebraucht fuer die Personenauswahl der
 * App („Was das ausmacht") und fuer die Tabelle in der Registry, Abschnitt 4.
 * Gemessen wird die physiologische Glukose, ohne Sensorfehler.
 *
 * Kein Therapiewerkzeug. Die Zahlen beschreiben simulierte Personen und
 * werden nie auf reale Menschen uebertragen.
 */

import type { Parameters, TherapySettings } from "../parameters.js";
import { MGDL_PER_MMOLL } from "../units.js";
import { simulate } from "../simulate.js";
import { flatBasalProfile } from "../pump.js";
import { exerciseBlock, type SimEvent } from "../events.js";
import { DEFAULT_SENSOR } from "../observation.js";

export interface ResponseProfile {
  /** Ausgangswert im Basalgleichgewicht [mg/dL]. */
  startMgdl: number;
  /** 1 U ohne Essen: groesster Abfall [mg/dL]. */
  oneUnitDropMgdl: number;
  /** 60 g (24 schnell, 36 langsam), Bolus nach KE-Faktor 10 min vorher: Spitze [mg/dL]. */
  mealPeakMgdl: number;
  /** … und der tiefste Wert danach [mg/dL]. */
  mealLowMgdl: number;
  /** 60 g ohne Bolus: Spitze [mg/dL]. */
  mealNoBolusPeakMgdl: number;
  /** 45 min bei 55 % der Herzfrequenzreserve, nuechtern: groesster Abfall [mg/dL]. */
  moderateExerciseDropMgdl: number;
  /** 20 min bei 90 % der Herzfrequenzreserve, nuechtern: groesster Anstieg [mg/dL]. */
  hardExerciseRiseMgdl: number;
}

export const PROFILE_SCENARIOS = {
  mealG: 60, mealFastShare: 0.4, bolusLeadMin: 10,
  moderate: { durationMin: 45, hrrShare: 0.55 },
  hard: { durationMin: 20, hrrShare: 0.9 },
} as const;

export const responseProfile = (p: Parameters, therapy: TherapySettings): ResponseProfile => {
  const run = (events: SimEvent[], durationMin: number): number[] =>
    simulate({
      durationMin, stepMin: 1, parameters: p, therapy,
      pump: flatBasalProfile(therapy.basalRateUPerH), events, sensor: DEFAULT_SENSOR, solver: "rk4",
    }).G.map((g) => g * MGDL_PER_MMOLL);
  const max = (xs: number[]) => xs.reduce((a, b) => (b > a ? b : a), -Infinity);
  const min = (xs: number[]) => xs.reduce((a, b) => (b < a ? b : a), Infinity);

  const S = PROFILE_SCENARIOS, t0 = 60;
  const meal: SimEvent = { kind: "meal", t: t0, fastCarbsG: S.mealG * S.mealFastShare, slowCarbsG: S.mealG * (1 - S.mealFastShare) };
  const bolus: SimEvent = { kind: "bolus", t: t0 - S.bolusLeadMin, units: S.mealG / therapy.carbRatioGPerU };
  const hr = (share: number) => p.HRrest + share * (p.HRmax - p.HRrest);

  const one = run([{ kind: "bolus", t: 0, units: 1 }], 480);
  const withBolus = run([bolus, meal], 480);
  const noBolus = run([meal], 480);
  const moderate = run(exerciseBlock(t0, S.moderate.durationMin, hr(S.moderate.hrrShare), p.HRrest), 300);
  const hard = run(exerciseBlock(t0, S.hard.durationMin, hr(S.hard.hrrShare), p.HRrest), 300);

  return {
    startMgdl: one[0]!,
    oneUnitDropMgdl: one[0]! - min(one),
    mealPeakMgdl: max(withBolus),
    mealLowMgdl: min(withBolus.slice(t0)),
    mealNoBolusPeakMgdl: max(noBolus),
    moderateExerciseDropMgdl: moderate[t0]! - min(moderate.slice(t0, t0 + 140)),
    hardExerciseRiseMgdl: max(hard.slice(t0, t0 + 80)) - hard[t0]!,
  };
};
