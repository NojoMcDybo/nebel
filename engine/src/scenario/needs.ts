/**
 * Bedürfnisschicht — Hunger und Reserven.
 *
 * SZENARIOSCHICHT, NICHT PHYSIOLOGIE. Dieses Modul liest den Zustandsvektor
 * nicht und schreibt ihn nicht. Es bekommt Zeit und Energieverbrauch, liefert
 * einen Reservestand und erzeugt daraus hoechstens eine Anzeige. Physiologische
 * Folgen entstehen ausschliesslich ueber die echten Kopplungen der Engine
 * (Bewegung, bereits abgegebener Bolus, Basalrate).
 *
 * Siehe docs/08_Beduerfnisse_und_Hunger.md
 *
 * Alle Zeitkonstanten hier sind NEBEL-ANNAHMEN, keine Literaturwerte.
 */

/** 1 = voll, 0 = leer. Semantik wie im Prototyp (`gly`). */
export type Reserve = number;

export interface ReserveConfig {
  /** Grundverbrauch pro Minute in Ruhe. Voll -> leer in rund 10 Stunden. */
  drainPerMin: number;
  /** Zusatzverbrauch pro Minute bei voller Belastung (EEfast = 1). */
  exerciseDrainPerMin: number;
  /** Zusatzverbrauch aus dem Nacheffekt (EElong). */
  afterEffectDrainPerMin: number;
  /** Auffuellung pro mmol Kohlenhydrat. */
  refillPerMmolCarb: number;
}

/** NEBEL-ANNAHMEN. Nicht als Physiologie ausgeben. */
export const DEFAULT_RESERVE_CONFIG: ReserveConfig = {
  drainPerMin: 1 / 600,
  exerciseDrainPerMin: 3 / 600,
  afterEffectDrainPerMin: 1 / 600,
  refillPerMmolCarb: 1 / 280,
};

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Ein Zeitschritt. Reiner Wert, kein Zustand im Modul. */
export const advanceReserve = (
  reserve: Reserve,
  dtMin: number,
  eeFast: number,
  eeLong: number,
  cfg: ReserveConfig = DEFAULT_RESERVE_CONFIG,
): Reserve => {
  if (dtMin < 0) throw new RangeError("advanceReserve: dtMin darf nicht negativ sein");
  const drain =
    cfg.drainPerMin +
    cfg.exerciseDrainPerMin * Math.max(0, eeFast) +
    cfg.afterEffectDrainPerMin * Math.max(0, eeLong);
  return clamp01(reserve - drain * dtMin);
};

/** Kohlenhydrataufnahme fuellt die Reserve auf. */
export const eat = (
  reserve: Reserve, carbsMmol: number, cfg: ReserveConfig = DEFAULT_RESERVE_CONFIG,
): Reserve => {
  if (carbsMmol < 0) throw new RangeError("eat: negative Kohlenhydrate");
  return clamp01(reserve + carbsMmol * cfg.refillPerMmolCarb);
};

export type ReserveLabel =
  | "Reserven"
  | "Reserven · iss etwas"
  | "Reserven · hungrig aufgewacht"
  | "Reserven · nachtanken"
  | "Reserven · Mittagszeit";

/**
 * Anzeigetext. Logik und Schwellen aus dem Prototyp uebernommen.
 * hourOfDay in Stunden [0, 24), recentLoad ist EElong.
 */
export const reserveLabel = (
  reserve: Reserve, hourOfDay: number, recentLoad: number,
): ReserveLabel => {
  if (reserve < 0.30) return "Reserven · iss etwas";
  if (hourOfDay >= 6 && hourOfDay < 10.5 && reserve < 0.70) return "Reserven · hungrig aufgewacht";
  if (recentLoad > 0.22 && reserve < 0.62) return "Reserven · nachtanken";
  if (hourOfDay >= 11 && hourOfDay < 14.5 && reserve < 0.60) return "Reserven · Mittagszeit";
  return "Reserven";
};

/** Kombinationsfaktor aus dem Prototyp: Belastung bei fast leeren Reserven. */
export const isHeisshunger = (reserve: Reserve, eeFast: number): boolean =>
  eeFast > 0.35 && reserve < 0.28;
