/**
 * Pumpenschicht (CSII, Open Loop).
 * Bildet Bedienhandlungen auf den kontinuierlichen Insulinstrom uInsulin [mU/min] ab.
 * Enthaelt KEINE Physiologie und keinen Regelalgorithmus.
 */

import { basalRateToMUPerMin, bolusToMUPerMin } from "./units.js";
import type { SimEvent } from "./events.js";

export const DEFAULT_BOLUS_DURATION_MIN = 1;

export interface PumpProgram {
  /** Basalrate in U/h, Index = Minute des Tages. */
  basalProfileUPerH: readonly number[];
}

/**
 * Baut den Insulinstrom fuer das Intervall [t, t+dt).
 * Rueckgabe in mU/min. Rein arithmetisch, deterministisch.
 */
export const insulinInputAt = (
  t: number,
  dt: number,
  program: PumpProgram,
  events: readonly SimEvent[],
): number => {
  if (dt <= 0) throw new RangeError("insulinInputAt: dt muss > 0 sein");
  const minuteOfDay = ((Math.floor(t) % 1440) + 1440) % 1440;
  const profile = program.basalProfileUPerH;
  if (profile.length === 0) throw new RangeError("Basalprofil ist leer");
  let baseUPerH = profile[minuteOfDay % profile.length]!;

  // Eine gesetzte Basalrate ueberschreibt das Profil ab ihrem Zeitpunkt.
  let latestChange = -Infinity;
  for (const e of events) {
    if (e.kind === "basal" && e.t <= t && e.t > latestChange) {
      latestChange = e.t;
      baseUPerH = e.rateUPerH;
    }
  }

  let factor = 1;
  for (const e of events) {
    if (e.kind === "tempBasal" && t >= e.t && t < e.t + e.durationMin) factor = e.factor;
  }

  let mUPerMin = basalRateToMUPerMin(baseUPerH) * factor;

  for (const e of events) {
    if (e.kind !== "bolus") continue;
    const dur = e.durationMin ?? DEFAULT_BOLUS_DURATION_MIN;
    const overlap = Math.min(t + dt, e.t + dur) - Math.max(t, e.t);
    if (overlap > 0) mUPerMin += bolusToMUPerMin(e.units, dur) * (overlap / dt);
  }

  return mUPerMin;
};

/** Flaches 24-h-Profil aus einer einzelnen Rate. */
export const flatBasalProfile = (rateUPerH: number): PumpProgram => ({
  basalProfileUPerH: new Array<number>(1440).fill(rateUPerH),
});

/**
 * Insulin on Board: abgeleitete ANZEIGEgroesse aus der Bolushistorie.
 * Ausdruecklich nicht identisch mit S1+S2 oder I. Nie im Modell verwenden.
 */
export const insulinOnBoardUnits = (
  t: number,
  events: readonly SimEvent[],
  durationOfActionMin = 240,
): number => {
  let iob = 0;
  for (const e of events) {
    if (e.kind !== "bolus" || e.t > t) continue;
    const age = t - e.t;
    if (age >= durationOfActionMin) continue;
    iob += e.units * (1 - age / durationOfActionMin);
  }
  return iob;
};
