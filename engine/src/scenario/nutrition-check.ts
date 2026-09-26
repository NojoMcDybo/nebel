/**
 * Nachrechnung der Studien, an denen Fett und Eiweiss kalibriert sind.
 * Siehe docs/11_Fett_und_Eiweiss.md, Abschnitt „Nachrechnung", und
 * docs/20_Parameter_Registry.md, Abschnitt 8.
 *
 * Jede Funktion stellt ein Studienszenario so nach, wie Nebel es versteht,
 * und misst am Koerper (physiologische Glukose, ohne Sensor). Die
 * Operationalisierung ist jeweils eine Nebel-Annahme und steht dabei.
 *
 * Kein Therapiewerkzeug. Die Zahlen beschreiben simulierte Personen.
 */

import type { Parameters, TherapySettings } from "../parameters.js";
import type { SimEvent } from "../events.js";
import { flatBasalProfile, insulinInputAt } from "../pump.js";
import { derivatives, glucoseFrom, initialState, type ModelInputs } from "../model.js";
import { rk4Step } from "../solver.js";
import { mealInputsAt, NUTRITION, type NutritionConstants } from "../nutrition.js";

/**
 * Minutenweiser Lauf in Ruhe mit frei skalierbarem Insulin.
 * Liefert die Glukose [mmol/L] am Ende jeder Minute, Index i = Minute i+1.
 */
export const runNutritionScenario = (
  p: Parameters, therapy: TherapySettings, events: readonly SimEvent[], durationMin: number,
  insulinScale: (t: number) => number = () => 1, n: NutritionConstants = NUTRITION,
): number[] => {
  const pump = flatBasalProfile(therapy.basalRateUPerH);
  let z = initialState(p, insulinInputAt(0, 1, pump, []));
  const G: number[] = [];
  for (let t = 0; t < durationMin; t++) {
    const m = mealInputsAt(t, 1, events, n);
    const u: ModelInputs = {
      uFastCarbs: m.uFastCarbs, uSlowCarbs: m.uSlowCarbs,
      uProteinGlucose: m.uProteinGlucose, siFactor: m.siFactor,
      uHR: p.HRrest,
      uInsulin: insulinInputAt(t, 1, pump, events) * insulinScale(t),
    };
    z = rk4Step(derivatives, z, t, 1, p, u);
    G.push(glucoseFrom(z[6]!, p.VG));
  }
  return G;
};

const mean = (xs: number[], from: number, to: number): number => {
  let s = 0;
  for (let i = from; i < to; i++) s += xs[i]!;
  return s / (to - from);
};

/** Wolpert 2013 als Nebel-Szenario. */
export const WOLPERT_SCENARIO = {
  mealMin: 60, carbsG: 60, fastShare: 0.4, proteinG: 25, eatMin: 15, bolusLeadMin: 10,
  lowFatG: 10, highFatG: 60, windowMin: 720,
} as const;

/**
 * Wolpert HA et al. 2013, Diabetes Care 36:810–816: gleiches Abendessen mit
 * 10 g gegen 60 g Fett, Insulin im geschlossenen Regelkreis; die fettreiche
 * Mahlzeit brauchte rund 42 % mehr Insulin.
 *
 * Operationalisierung (Nebel-Annahme, der geschlossene Regelkreis ist nicht
 * nachgebaut): Mit welchem Faktor m muss ALLES Insulin — Basal und Bolus — ab
 * dem Bolus zwoelf Stunden lang skaliert werden, damit die fettreiche Mahlzeit
 * denselben mittleren Blutzucker ergibt wie die fettarme mit m = 1?
 * Die Kohlenhydrat- und Eiweissmengen der Studie sind hier nicht bekannt und
 * angenommen; sie kuerzen sich im Vergleich weitgehend heraus.
 */
export const wolpertInsulinRatio = (
  p: Parameters, therapy: TherapySettings, n: NutritionConstants = NUTRITION,
): number => {
  const S = WOLPERT_SCENARIO;
  const meal = (fatG: number): SimEvent[] => [
    { kind: "bolus", t: S.mealMin - S.bolusLeadMin, units: S.carbsG / therapy.carbRatioGPerU },
    { kind: "meal", t: S.mealMin, fastCarbsG: S.carbsG * S.fastShare, slowCarbsG: S.carbsG * (1 - S.fastShare),
      fatG, proteinG: S.proteinG, durationMin: S.eatMin },
  ];
  const dur = S.mealMin + S.windowMin;
  const from = S.mealMin - S.bolusLeadMin;
  const target = mean(runNutritionScenario(p, therapy, meal(S.lowFatG), dur, () => 1, n), S.mealMin, dur);
  const high = meal(S.highFatG);
  const meanAt = (m: number) =>
    mean(runNutritionScenario(p, therapy, high, dur, (t) => (t >= from ? m : 1), n), S.mealMin, dur);
  let lo = 1, hi = 4;
  if (meanAt(lo) <= target) return 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (meanAt(mid) > target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

export interface ProteinExcess {
  /** Mittlere Differenz zu Wasser [mmol/L] in den Fenstern der Studie. */
  w60to120: number;
  w180to240: number;
  w240to300: number;
}

/**
 * Paterson MA et al. 2016, Diabet Med (doi 10.1111/dme.13011), 27 Teilnehmende 7–40 J.:
 * Molkeneiweiss in Wasser, ohne Kohlenhydrate und ohne Insulin, gegen Wasser.
 * Nachgestellt: Getraenk ueber 5 min, Basal laeuft, kein Bolus, 300 min.
 */
export const patersonProteinExcess = (
  p: Parameters, therapy: TherapySettings, proteinG: number, n: NutritionConstants = NUTRITION,
): ProteinExcess => {
  const t0 = 60, dur = t0 + 300;
  const drink = (g: number): SimEvent[] =>
    [{ kind: "meal", t: t0, fastCarbsG: 0, slowCarbsG: 0, proteinG: g, durationMin: 5 }];
  const a = runNutritionScenario(p, therapy, drink(proteinG), dur, () => 1, n);
  const b = runNutritionScenario(p, therapy, drink(0), dur, () => 1, n);
  const diff = a.map((g, i) => g - b[i]!);
  return {
    w60to120: mean(diff, t0 + 60, t0 + 120),
    w180to240: mean(diff, t0 + 180, t0 + 240),
    w240to300: mean(diff, t0 + 240, t0 + 300),
  };
};

export interface FatDrinkExcess {
  /** Mittlere Differenz zum Getraenk mit 1 g Fett [mmol/L]. */
  w120to240: number;
  w240to330: number;
  w330to480: number;
}

/**
 * O'Connell SM et al. 2021, Pediatr Diabetes 22:1108–1114: Fett als Getraenk
 * (1, 13, 26, 39, 51 g), ohne Kohlenhydrate, ohne Eiweiss, ohne Insulin,
 * 30 Kinder und Jugendliche 8–18 J. Ergebnis: je 10 g Fett ab 330 min im
 * Mittel +0,28 mmol/L (95-%-KI 0,15–0,39), dosisproportional, von 4 bis 8 h.
 * Nachgestellt: Getraenk ueber 5 min, Basal laeuft, kein Bolus, 8 h,
 * Vergleich gegen 1 g Fett.
 */
export const oConnellFatExcess = (
  p: Parameters, therapy: TherapySettings, fatG: number, n: NutritionConstants = NUTRITION,
): FatDrinkExcess => {
  const t0 = 60, dur = t0 + 480;
  const drink = (g: number): SimEvent[] =>
    [{ kind: "meal", t: t0, fastCarbsG: 0, slowCarbsG: 0, fatG: g, durationMin: 5 }];
  const a = runNutritionScenario(p, therapy, drink(fatG), dur, () => 1, n);
  const b = runNutritionScenario(p, therapy, drink(1), dur, () => 1, n);
  const diff = a.map((g, i) => g - b[i]!);
  return {
    w120to240: mean(diff, t0 + 120, t0 + 240),
    w240to330: mean(diff, t0 + 240, t0 + 330),
    w330to480: mean(diff, t0 + 330, t0 + 480),
  };
};

export interface SmartCheck {
  /** Differenz zur fett- und eiweissarmen Mahlzeit nach 5 h [mmol/L]. */
  fatAt5h: number;
  proteinAt5h: number;
  bothAt5h: number;
  /** Mittlere Differenz der fettreichen Mahlzeit in den ersten 90 min [mmol/L]. */
  fatFirst90: number;
}

/**
 * Smart CE et al. 2013, Diabetes Care 36:3897–3902 (Zahlen aus Paterson 2015,
 * Curr Diab Rep 15:61): 30 g Kohlenhydrate mit Insulin nach KE-Faktor, dazu
 * 35 g Fett, 40 g Eiweiss oder beides. Kinder und Jugendliche — die Personen
 * in Nebel sind Erwachsene. Das ist eine Gegenprobe, keine Kalibrierung.
 */
export const smartCrossCheck = (
  p: Parameters, therapy: TherapySettings, n: NutritionConstants = NUTRITION,
): SmartCheck => {
  const t0 = 60, dur = t0 + 300;
  const meal = (fatG: number, proteinG: number): SimEvent[] => [
    { kind: "bolus", t: t0, units: 30 / therapy.carbRatioGPerU },
    { kind: "meal", t: t0, fastCarbsG: 12, slowCarbsG: 18, fatG, proteinG, durationMin: 15 },
  ];
  const base = runNutritionScenario(p, therapy, meal(0, 0), dur, () => 1, n);
  const run = (f: number, pr: number) => runNutritionScenario(p, therapy, meal(f, pr), dur, () => 1, n);
  const fat = run(35, 0), prot = run(0, 40), both = run(35, 40);
  const at5h = (xs: number[]) => xs[dur - 1]! - base[dur - 1]!;
  let early = 0;
  for (let i = t0; i < t0 + 90; i++) early += fat[i]! - base[i]!;
  return { fatAt5h: at5h(fat), proteinAt5h: at5h(prot), bothAt5h: at5h(both), fatFirst90: early / 90 };
};
