/**
 * Fett und Eiweiss. Siehe docs/11_Fett_und_Eiweiss.md und
 * docs/20_Parameter_Registry.md Abschnitt 8.
 *
 * Drei Wirkungen, alle als Eingaben der Engine — kein neuer Zustand, der
 * 16er-Vektor bleibt, wie er ist:
 *
 *  1. Fett verzoegert die Magenentleerung. Die Kohlenhydrate DERSELBEN
 *     Mahlzeit kommen gestreckt im Darm an (Faltung aus Essdauer und einem
 *     exponentiellen Magenspeicher).
 *  2. Fett senkt ueber Stunden die Insulinsensitivitaet. Die Engine bekommt
 *     einen Faktor siFactor = 1 / (1 + R(t)) auf alle drei Insulinpfade.
 *     R folgt einer Glocke mit Gipfel nach 5,5 h und zaehlt nur Fett ueber
 *     einer Schwelle pro Mahlzeit.
 *  3. Eiweiss liefert spaet zusaetzliche Glukose, direkt ins Plasma — sie
 *     kommt aus der Leber (Glukoneogenese), nicht aus dem Darm.
 *
 * Ohne Fett, ohne Eiweiss und ohne Essdauer ist alles exakt wie vorher:
 * Lieferung in einer Minute, siFactor 1, keine Zusatzglukose. Der
 * Orakelabgleich gegen py-mgipsim bleibt dadurch unberuehrt.
 *
 * Alle Zahlen unten sind Nebel-Kalibrierung (Status N in der Registry):
 * an wenigen Studien festgemacht, mit grosser Streuung zwischen Menschen.
 * Sie zeigen die Richtung und die Groessenordnung, keine Dosis.
 */

import type { MealEvent, SimEvent } from "./events.js";
import { gCarbsToMmol } from "./units.js";

/** Ohne Essdauer landet eine Mahlzeit innerhalb einer Minute im Darm. */
export const MEAL_DELIVERY_MIN = 1;

export const NUTRITION = {
  /**
   * Mittlere Zusatzverzoegerung der Kohlenhydrate pro Gramm Fett [min/g].
   * Annahme. Richtung: Smart 2013 (35 g Fett daempfen die ersten 90 min),
   * Lupoli 2019 (verzoegerte Magenentleerung verschiebt den Gipfel um ~27 min).
   * Kontrolle: docs/11, Abschnitt „Nachrechnung".
   */
  fatGastricDelayMinPerG: 1.0,
  /** Obergrenze der Magenverzoegerung [min]. */
  fatGastricDelayMaxMin: 120,
  /**
   * Senkung der Insulinsensitivitaet pro Gramm Fett ueber der Schwelle, auf
   * dem Gipfel der Glocke: R_max = fatResistancePerG · (Fett − Schwelle),
   * siFactor = 1 / (1 + R).
   * Kalibriert am Wolpert-Szenario (Erwachsene, gemischte Mahlzeit): +50 g
   * Fett verlangen rund 42 % mehr Insulin fuer denselben mittleren Blutzucker
   * ueber zwoelf Stunden — im Mittel der 20 Subjekte des Datensatzes. Zwei Kinderstudien liegen links und rechts davon:
   * Smart 2013 (gemischt) zeigt mehr, O'Connell 2021 (reines Fett) weniger.
   */
  fatResistancePerG: 0.020,
  /**
   * Fett bis zu dieser Menge pro Mahlzeit senkt die Insulinsensitivitaet
   * nicht [g]. Keine physiologische Schwelle — O'Connell 2021 findet keine.
   * Sondern ein Bezugspunkt: KE-Faktor und Basalrate einer Person sind im
   * echten Leben auf ihr gewoehnliches Essen eingestellt, gewoehnliches Fett
   * steckt schon darin. Die Studien messen dagegen Kontraste zu fast
   * fettfreien Mahlzeiten (Wolpert 10 g, O'Connell 1 g).
   * Nachgerechnet (Patient 10, drei Tage, Mahlzeiten „gemischt", gleiche
   * Steigung): ohne Schwelle Tagesmittel 295 statt 194 mg/dL, mit 10 g 227,
   * mit 20 g 194.
   * Nebel-Annahme, entspricht der Voreinstellung „gemischt" bis 80 g KH.
   */
  fatResistanceThresholdG: 20,
  /** Zeitkonstante der Fettglocke [min]; Gipfel bei 3·tau = 330 min. */
  fatResistanceTauMin: 110,
  /**
   * Anteil des Eiweisses, der als Glukose im Blut ankommt [g Glukose / g Eiweiss].
   * Kalibriert an Paterson 2016 (kleinste Quadrate, Mittel der 20 Subjekte):
   * 75 g und 100 g Eiweiss ohne Insulin heben den Blutzucker nach 180–240 und
   * 240–300 min gegenueber Wasser; alle vier Modellwerte liegen in den
   * 95-%-Konfidenzintervallen der Studie.
   */
  proteinGlucoseYield: 0.19,
  /**
   * Zeitkonstante der Eiweissglukose (Erlang, Ordnung 3) [min]; Gipfel der
   * Rate bei 2·tau = 3 h, Mittel bei 4,5 h. Die Paterson-Daten bestimmen tau
   * nicht (Fehlerquadrate flach); gewaehlt nach der in Reviews beschriebenen
   * Wirkung 3–5 h nach dem Essen (Paterson 2015, Margaritis 2025). Groessere
   * Werte verlangen eine unplausibel hohe Ausbeute.
   */
  proteinTauMin: 90,
} as const;

export type NutritionConstants = { readonly [K in keyof typeof NUTRITION]: number };

/** Was eine Mahlzeitenliste in der Minute [t, t+dt) in die Engine gibt. */
export interface NutritionInputs {
  uFastCarbs: number;       // [mmol/min]
  uSlowCarbs: number;       // [mmol/min]
  uProteinGlucose: number;  // [mmol/min]
  siFactor: number;         // [-], 1 = unveraendert
}

/** Magenverzoegerung einer Mahlzeit [min]. */
export const gastricDelayMin = (fatG: number, n: NutritionConstants = NUTRITION): number =>
  Math.min(n.fatGastricDelayMaxMin, Math.max(0, fatG) * n.fatGastricDelayMinPerG);

/**
 * Anteil der Kohlenhydrate einer Mahlzeit, der s Minuten nach Essbeginn im
 * Darm angekommen ist. Verteilungsfunktion von „gleichverteilt ueber die
 * Essdauer" plus „exponentieller Magenspeicher mit Mittel delay".
 */
export const carbDeliveredShare = (s: number, eatMin: number, delayMin: number): number => {
  if (s <= 0) return 0;
  const D = Math.max(MEAL_DELIVERY_MIN, eatMin);
  const tau = delayMin;
  if (tau <= 1e-9) return Math.min(1, s / D);
  if (s <= D) return (s - tau * (1 - Math.exp(-s / tau))) / D;
  return 1 - (tau / D) * (Math.exp(-(s - D) / tau) - Math.exp(-s / tau));
};

/** Erlang-Verteilungsfunktion der Ordnung 3. */
export const erlang3Cdf = (s: number, tau: number): number => {
  if (s <= 0) return 0;
  const x = s / tau;
  return 1 - Math.exp(-x) * (1 + x + (x * x) / 2);
};

/** Glocke x³·e^(−x), auf den Gipfel 1 bei s = 3·tau normiert. */
export const fatBell = (s: number, tau: number): number => {
  if (s <= 0) return 0;
  const x = s / tau;
  return (x / 3) ** 3 * Math.exp(3 - x);
};

const isMeal = (e: SimEvent): e is MealEvent => e.kind === "meal";

/**
 * Eingaben aus allen Mahlzeiten fuer die Minute [t, t+dt).
 * Mengen werden ueber das Intervall exakt integriert (Differenz der
 * Verteilungsfunktionen), der siFactor in der Intervallmitte gewertet.
 */
export const mealInputsAt = (
  t: number, dt: number, events: readonly SimEvent[], n: NutritionConstants = NUTRITION,
): NutritionInputs => {
  let fast = 0, slow = 0, protein = 0, R = 0;
  const mid = t + dt / 2;
  for (const e of events) {
    if (!isMeal(e) || e.t >= t + dt) continue;
    const fat = e.fatG ?? 0, prot = e.proteinG ?? 0;
    const eat = e.durationMin ?? MEAL_DELIVERY_MIN;
    const delay = gastricDelayMin(fat, n);
    const share = carbDeliveredShare(t + dt - e.t, eat, delay) - carbDeliveredShare(t - e.t, eat, delay);
    if (share > 0) {
      fast += (gCarbsToMmol(e.fastCarbsG) * share) / dt;
      slow += (gCarbsToMmol(e.slowCarbsG) * share) / dt;
    }
    if (prot > 0) {
      const p = erlang3Cdf(t + dt - e.t, n.proteinTauMin) - erlang3Cdf(t - e.t, n.proteinTauMin);
      protein += (gCarbsToMmol(prot * n.proteinGlucoseYield) * p) / dt;
    }
    const excess = fat - n.fatResistanceThresholdG;
    if (excess > 0) R += n.fatResistancePerG * excess * fatBell(mid - e.t, n.fatResistanceTauMin);
  }
  return { uFastCarbs: fast, uSlowCarbs: slow, uProteinGlucose: protein, siFactor: 1 / (1 + R) };
};

/**
 * Kohlenhydrate, die gegessen, aber noch nicht im Darm angekommen sind [g] —
 * sie liegen noch im Magen. Fuer die Anzeige „KH aktiv", die sonst nur den
 * Darm zaehlt und nach fettem Essen zu wenig zeigen wuerde.
 */
export const carbsInStomachG = (
  t: number, events: readonly SimEvent[], n: NutritionConstants = NUTRITION,
): number => {
  let g = 0;
  for (const e of events) {
    if (!isMeal(e) || e.t > t) continue;
    const left = 1 - carbDeliveredShare(t - e.t, e.durationMin ?? MEAL_DELIVERY_MIN, gastricDelayMin(e.fatG ?? 0, n));
    if (left > 1e-6) g += (e.fastCarbsG + e.slowCarbsG) * left;
  }
  return g;
};
