/**
 * Beobachtungsschicht. NEBEL-EIGENLEISTUNG, nicht Teil des publizierten Modells.
 * ExtHovorka endet bei der interstitiellen Glukose IG.
 *
 * Harte Regel: diese Schicht darf den physiologischen Zustand nie zurueck beeinflussen.
 */


export interface SensorConfig {
  samplingIntervalMin: number; // 5, Geraetekonvention
  noiseSd: number;             // NEBEL-ANNAHME, Groessenordnung noch zu belegen
  filterTauMin: number;        // NEBEL-ANNAHME, Designentscheidung
  seed: number;                // Determinismus
}

export const DEFAULT_SENSOR: SensorConfig = {
  samplingIntervalMin: 5,
  noiseSd: 0,        // bis zum Beleg bewusst 0: lieber kein Rauschen als erfundenes
  filterTauMin: 0,
  seed: 1,
};

/**
 * Zaehlerbasierter Zufall. Bewusst KEIN fortgeschriebener Generatorzustand:
 * nach einer Nachholintegration muss Minute n denselben Wert liefern wie im
 * Durchlauf. Siehe docs/06_Echtzeit_Modus.md Abschnitt 2.
 *
 * Gleichverteilt in [0, 1).
 */
export const uniformAt = (seed: number, index: number): number => {
  let h = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(index | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/** Standardnormalverteilt, aus zwei unabhaengigen Zaehlerwerten (Box-Muller). */
export const normalAt = (seed: number, index: number): number => {
  const u1 = Math.max(uniformAt(seed, 2 * index), Number.EPSILON);
  const u2 = uniformAt(seed, 2 * index + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/**
 * IG-Spur -> angezeigte Sensorspur im Abtastraster.
 *
 * startStepIndex verankert Abtastung und Rauschen global, damit Teilstuecke
 * aus dem Echtzeitbetrieb exakt zusammenpassen. Die Eingangsspur wird nie
 * veraendert — die Beobachtung aendert nichts am Koerper.
 */
export const sensorTrace = (
  igTrace: readonly number[], dtMin: number, cfg: SensorConfig, startStepIndex = 0,
): { t: number[]; gSensor: number[] } => {
  if (dtMin <= 0) throw new RangeError("sensorTrace: dtMin muss > 0 sein");
  const stepsPerSample = Math.max(1, Math.round(cfg.samplingIntervalMin / dtMin));

  // Optionale Glaettung auf der vollen Spur, vor der Abtastung.
  let filtered: readonly number[] = igTrace;
  if (cfg.filterTauMin > 0) {
    const alpha = dtMin / (cfg.filterTauMin + dtMin);
    const out: number[] = [];
    let y = igTrace[0] ?? 0;
    for (const x of igTrace) { y = y + alpha * (x - y); out.push(y); }
    filtered = out;
  }

  const t: number[] = [];
  const gSensor: number[] = [];
  for (let i = 0; i < filtered.length; i += stepsPerSample) {
    const globalIndex = startStepIndex + i;
    const noise = cfg.noiseSd > 0 ? normalAt(cfg.seed, globalIndex) * cfg.noiseSd : 0;
    t.push(globalIndex * dtMin);
    gSensor.push(filtered[i]! + noise);
  }
  return { t, gSensor };
};
