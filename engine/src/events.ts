/**
 * Eventstrom. Alles, was von aussen auf den Koerper wirkt, ist ein Ereignis
 * mit exaktem Zeitstempel in Minuten seit Simulationsbeginn.
 */

export interface MealEvent {
  kind: "meal";
  t: number;          // [min]
  fastCarbsG: number; // schnell resorbierbare KH [g]
  slowCarbsG: number; // langsam resorbierbare KH [g]
  /** Fett [g]: verzoegert die KH derselben Mahlzeit, senkt ueber Stunden die Insulinsensitivitaet. */
  fatG?: number;
  /** Eiweiss [g]: liefert spaet zusaetzliche Glukose aus der Leber. */
  proteinG?: number;
  /** Essdauer [min]; die KH kommen gleichmaessig verteilt an. Standard 1 min. */
  durationMin?: number;
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
    if (e.kind === "meal" && ((e.fatG ?? 0) < 0 || (e.proteinG ?? 0) < 0))
      throw new RangeError("Mahlzeit mit negativem Fett oder Eiweiss");
    if (e.kind === "meal" && e.durationMin !== undefined && !(e.durationMin >= 0 && Number.isFinite(e.durationMin)))
      throw new RangeError("Mahlzeit mit ungueltiger Essdauer");
    if (e.kind === "bolus" && e.units < 0) throw new RangeError("Negativer Bolus");
    if (e.kind === "tempBasal" && e.factor < 0) throw new RangeError("Negativer Temp-Basal-Faktor");
    if (e.kind === "heartRate" && e.bpm <= 0) throw new RangeError("Herzfrequenz <= 0");
  }
};

/**
 * Herzfrequenzereignisse sind Stuetzstellen einer kontinuierlichen Spur;
 * dazwischen wird linear interpoliert. Ein Belastungsblock braucht deshalb
 * VIER Punkte: Ruhe direkt davor, Belastung am Anfang und kurz vor dem Ende,
 * Ruhe danach.
 *
 * Fehlt die Ruhe davor, interpoliert die Spur vom Ende des vorigen Blocks
 * bis zum Anfang des naechsten — bei Bloecken an aufeinanderfolgenden Tagen
 * steigt die Herzfrequenz dann den ganzen Tag lang an, und die simulierte
 * Person trainiert rund um die Uhr unterschwellig. Genau das ist passiert,
 * gefunden am 24.09.2026.
 *
 * Reihenfolge der Rueckgabe: der Belastungsbeginn zuerst, damit Aufrufer ein
 * Label auf das erste Element setzen koennen. Sortiert wird ohnehin.
 */
export const exerciseBlock = (
  startMin: number, durationMin: number, bpm: number, restingBpm: number,
): HeartRateEvent[] => {
  if (durationMin <= 1) throw new RangeError("exerciseBlock: Dauer muss > 1 min sein");
  const block: HeartRateEvent[] = [
    { kind: "heartRate", t: startMin, bpm },
    { kind: "heartRate", t: startMin + durationMin - 1, bpm },
    { kind: "heartRate", t: startMin + durationMin, bpm: restingBpm },
  ];
  if (startMin >= 1) block.push({ kind: "heartRate", t: startMin - 1, bpm: restingBpm });
  return block;
};
