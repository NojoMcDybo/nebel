/**
 * Eventstrom. Alles, was von aussen auf den Koerper wirkt, ist ein Ereignis
 * mit exaktem Zeitstempel in Minuten seit Simulationsbeginn.
 */

export interface MealEvent {
  kind: "meal";
  t: number;          // [min]
  fastCarbsG: number; // schnell resorbierbare KH [g]
  slowCarbsG: number; // langsam resorbierbare KH [g]
  label?: string;
}

export interface BolusEvent {
  kind: "bolus";
  t: number;
  units: number;
  durationMin?: number; // Standard 1 min
  label?: string;
}

export interface BasalChangeEvent {
  kind: "basal";
  t: number;
  rateUPerH: number;
}

/** Temporaere Basalrate als Faktor auf das laufende Profil. */
export interface TempBasalEvent {
  kind: "tempBasal";
  t: number;
  factor: number;      // 0 = Pumpenstopp
  durationMin: number;
}

/** Herzfrequenzverlauf. Zwischen zwei Punkten wird linear interpoliert. */
export interface HeartRateEvent {
  kind: "heartRate";
  t: number;
  bpm: number;
}

export type SimEvent =
  | MealEvent
  | BolusEvent
  | BasalChangeEvent
  | TempBasalEvent
  | HeartRateEvent;

export const sortEvents = (events: readonly SimEvent[]): SimEvent[] =>
  [...events].sort((a, b) => a.t - b.t);

export const validateEvents = (events: readonly SimEvent[]): void => {
  for (const e of events) {
    if (!Number.isFinite(e.t) || e.t < 0) throw new RangeError(`Event mit ungueltigem t: ${e.t}`);
    if (e.kind === "meal" && (e.fastCarbsG < 0 || e.slowCarbsG < 0))
      throw new RangeError("Mahlzeit mit negativen Kohlenhydraten");
    if (e.kind === "bolus" && e.units < 0) throw new RangeError("Negativer Bolus");
    if (e.kind === "tempBasal" && e.factor < 0) throw new RangeError("Negativer Temp-Basal-Faktor");
    if (e.kind === "heartRate" && e.bpm <= 0) throw new RangeError("Herzfrequenz <= 0");
  }
};

/**
 * Herzfrequenzereignisse sind Stuetzstellen einer kontinuierlichen Spur;
 * dazwischen wird linear interpoliert. Fuer einen Belastungsblock braucht es
 * deshalb einen Wert am Anfang, einen kurz vor dem Ende und den Ruhewert danach
 * — sonst rampt die Herzfrequenz ueber den ganzen Block ab.
 */
export const exerciseBlock = (
  startMin: number, durationMin: number, bpm: number, restingBpm: number,
): HeartRateEvent[] => {
  if (durationMin <= 1) throw new RangeError("exerciseBlock: Dauer muss > 1 min sein");
  return [
    { kind: "heartRate", t: startMin, bpm },
    { kind: "heartRate", t: startMin + durationMin - 1, bpm },
    { kind: "heartRate", t: startMin + durationMin, bpm: restingBpm },
  ];
};
