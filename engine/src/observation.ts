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
  /** Publiziertes Fehlermodell. Ist es gesetzt, ersetzt es noiseSd. */
  errorModel?: CgmErrorModel;
}

/* Ohne Fehler — fuer Physiologietests, in denen der Sensor nicht stoeren soll. */
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
    const tMin = globalIndex * dtMin;
    t.push(tMin);
    if (cfg.errorModel) {
      /* Das Fehlermodell rechnet in mg/dL, die Engine in mmol/L. */
      const sampleIdx = Math.round(tMin / cfg.samplingIntervalMin);
      const mgdl = cgmReadingMgdl(cfg.errorModel, filtered[i]! * 18.0182, tMin, cfg.seed, sampleIdx);
      gSensor.push(mgdl / 18.0182);
    } else {
      const noise = cfg.noiseSd > 0 ? normalAt(cfg.seed, globalIndex) * cfg.noiseSd : 0;
      gSensor.push(filtered[i]! + noise);
    }
  }
  return { t, gSensor };
};

/* ══════════════════════════════════════════════════════════════════
   CGM-Fehlermodell nach Vettoretti et al. (2019), Dexcom G6.
   Sensors 19(23):5320. https://www.mdpi.com/1424-8220/19/23/5320

   CGM(t) = a(t) · IG(t) + b0 + v(t)
     a(t) = a0 + a1·t + a2·t²      Verstaerkungsfehler, t in Tagen seit Setzen
     v(k) = α1·v(k−1) + α2·v(k−2) + w(k),   w ~ N(0, σ²)   Messrauschen, AR(2)

   Parameter: Mediane aus Tabelle 1 (zweistufige Identifikation).

   Zur Zeiteinheit von t: Das Paper definiert t als Zeit seit Setzen.
   Nur "Tage" ergibt eine plausible Verstaerkung — in Minuten laege a
   nach einem Tag bei 6, in Stunden nach zehn Tagen bei 0,33. Aus der
   Groessenordnung erschlossen, gegen das PDF zu pruefen.

   Echtzeit-Tauglichkeit: Ein AR-Prozess traegt Zustand. Das wuerde die
   Nachholintegration brechen (docs/06_Echtzeit_Modus.md). Deshalb wird
   v(k) nicht fortgeschrieben, sondern als Faltung der Impulsantwort mit
   zaehlerbasiertem weissem Rauschen berechnet. v(k) haengt damit nur von
   (seed, k) ab — in welchen Haeppchen gerechnet wird, ist egal.
   ══════════════════════════════════════════════════════════════════ */

export interface CgmErrorModel {
  a0: number; a1: number; a2: number;   // Verstaerkung, t in Tagen
  b0: number;                           // Versatz [mg/dL]
  alpha1: number; alpha2: number;       // AR(2)
  sigmaW: number;                       // Standardabweichung des weissen Rauschens [mg/dL]
  lifetimeDays: number;                 // Tragedauer des Sensors
  source: string;
}

export const DEXCOM_G6_VETTORETTI_2019: CgmErrorModel = {
  a0: 0.95, a1: 0.0039, a2: -0.000027,
  b0: 0.14,
  alpha1: 0.62, alpha2: 0.22,
  sigmaW: 3.16,
  lifetimeDays: 10,
  source: "Vettoretti et al. 2019, Sensors 19(23):5320, Tab. 1, Mediane",
};

/** Impulsantwort des AR(2)-Prozesses, abgeschnitten bei |h| < tol. */
export const arImpulseResponse = (alpha1: number, alpha2: number, tol = 1e-7, max = 400): number[] => {
  const h = [1, alpha1];
  while (h.length < max) {
    const n = h.length;
    const next = alpha1 * h[n - 1]! + alpha2 * h[n - 2]!;
    h.push(next);
    if (Math.abs(next) < tol && Math.abs(h[n - 1]!) < tol) break;
  }
  return h;
};

/** Theoretische stationaere Standardabweichung eines AR(2) [gleiche Einheit wie sigmaW]. */
export const arStationarySd = (m: CgmErrorModel): number => {
  const { alpha1: a1, alpha2: a2, sigmaW: s } = m;
  const v = (s * s * (1 - a2)) / ((1 + a2) * ((1 - a2) ** 2 - a1 ** 2));
  return Math.sqrt(v);
};

const IR_CACHE = new Map<string, number[]>();
const impulseFor = (m: CgmErrorModel): number[] => {
  const key = `${m.alpha1}|${m.alpha2}`;
  let h = IR_CACHE.get(key);
  if (!h) { h = arImpulseResponse(m.alpha1, m.alpha2); IR_CACHE.set(key, h); }
  return h;
};

/** Messrauschen v(k) [mg/dL] — rein aus (seed, k), ohne fortgeschriebenen Zustand. */
export const cgmNoiseAt = (m: CgmErrorModel, seed: number, sampleIndex: number): number => {
  const h = impulseFor(m);
  let v = 0;
  for (let j = 0; j < h.length; j++) {
    v += h[j]! * normalAt(seed, sampleIndex - j);
  }
  return v * m.sigmaW;
};

/** Verstaerkung a(t), t = Tage seit Setzen; der Sensor wird nach Ablauf gewechselt. */
export const cgmGain = (m: CgmErrorModel, simMinute: number): number => {
  const days = (simMinute / 1440) % m.lifetimeDays;
  return m.a0 + m.a1 * days + m.a2 * days * days;
};

/** Angezeigter Sensorwert [mg/dL] aus interstitieller Glukose [mg/dL]. */
export const cgmReadingMgdl = (
  m: CgmErrorModel, igMgdl: number, simMinute: number, seed: number, sampleIndex: number,
): number => cgmGain(m, simMinute) * igMgdl + m.b0 + cgmNoiseAt(m, seed, sampleIndex);

/* Realistischer Sensor: publiziertes G6-Fehlermodell, 5-min-Raster. */
export const REALISTIC_SENSOR: SensorConfig = {
  samplingIntervalMin: 5,
  noiseSd: 0,
  filterTauMin: 0,
  seed: 20260923,
  errorModel: DEXCOM_G6_VETTORETTI_2019,
};
