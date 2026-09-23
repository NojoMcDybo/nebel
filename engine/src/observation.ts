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
  /** Nebel-Modell V2. Hat Vorrang vor errorModel. */
  modelV2?: SensorModelV2;
  /** Druck auf den Sensor zulassen (nur V2). Standard: ja. */
  compression?: boolean;
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
  eeFastTrace?: readonly number[],
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
    if (cfg.modelV2) {
      const mgdl = cgmReadingV2(cfg.modelV2, filtered[i]! * 18.0182, tMin, cfg.seed,
        { eeFast: eeFastTrace?.[i] ?? 0, compression: cfg.compression !== false });
      gSensor.push(mgdl / 18.0182);
    } else if (cfg.errorModel) {
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

/* ══════════════════════════════════════════════════════════════════
   Sensorfehlermodell V2 (Nebel)

   Warum ein zweites Modell: Das G6-Modell von Vettoretti beschreibt den
   Abstand zwischen Sensor und Laborblut in Kliniksitzungen. Auf Alltagsdaten
   passt es schlecht. Dort ist der Fehler "rosa bis rotes Rauschen", also von
   langsamen Anteilen dominiert (Garnica et al. 2020), und seine Staerke
   schwankt je nach Situation um mehr als das Sechzigfache der Varianz
   (Frontiers in Bioengineering 2023). Mit dem G6-Modell sprang der
   angezeigte Wert in ruhigen Phasen jedes vierte Mal um 4 mg/dL und mehr.

   Aufbau:
     CGM = a(t)·IG + b0 + Drift(t) + L(t)·Zittern(k) − Druck(t)

     a, b0    je Sensor gezogen, Spannweite aus Vettoretti 2019 (IQR)
     Drift    langsam, Stuetzstellen alle drei Stunden, glatt verbunden
     Zittern  klein, AR(1)
     L        Rauschanhebung: nach dem Setzen und bei Bewegung
     Druck    Liegen auf dem Sensor (Mensh et al. 2013), ab der zweiten Nacht

   Einstieg: Beim Start sitzt der Sensor schon 2 bis 7 Tage. Kein Wechsel
   und keine Ungenauigkeit durch frisches Setzen am ersten Tag.

   Alles ist eine reine Funktion von (seed, Zeit). Nachholintegration im
   Echtzeitbetrieb bleibt damit bitgleich.

   Belegt ist die STRUKTUR und die Spannweiten. Die genaue Mischung aus
   langsam und schnell ist Nebel-Kalibrierung; Ziel: ruhige Phasen glatt,
   Abweichung zum Blut im publizierten Bereich.
   ══════════════════════════════════════════════════════════════════ */

export interface SensorModelV2 {
  lifetimeDays: number;
  /** Sensoralter beim Simulationsstart [Tage]. */
  startAgeDays: readonly [number, number];
  calib: { a0Median: number; a0Sd: number; a0Min: number; a0Max: number;
           b0Median: number; b0Sd: number; a1: number; a2: number };
  drift: { sdMgdl: number; knotMin: number };
  jitter: { sdMgdl: number; rho: number };
  firstDay: { factor: number; tauHours: number };
  exercise: { factor: number };
  compression: { pPerNight: number; firstNight: number;
                 windowStartHour: number; windowHours: number;
                 durMin: readonly [number, number]; depthMgdl: readonly [number, number] };
}

export const NEBEL_SENSOR_V2: SensorModelV2 = {
  lifetimeDays: 10,
  startAgeDays: [2, 7],
  /* Vettoretti 2019, Tab. 1: a0 Median 0.95, IQR 0.91–0.99 → sd ≈ IQR/1.349;
     b0 Median 0.14, IQR −2.19–2.54 mg/dL. Drift a1, a2 als Mediane. */
  calib: { a0Median: 0.95, a0Sd: 0.059, a0Min: 0.85, a0Max: 1.05,
           b0Median: 0.14, b0Sd: 3.5, a1: 0.0039, a2: -0.000027 },
  /* NEBEL-KALIBRIERUNG innerhalb der belegten Struktur. */
  drift:   { sdMgdl: 4, knotMin: 180 },
  /* Camerlingo et al. 2023 (Front Bioeng Biotechnol 11:1280233), G6-Spuren:
     Rauschvarianz 0,4–25 mg²/dL², also SD 0,6–5 mg/dL, Mittel 2,0–3,2.
     Nebel setzt den ruhigen Normalfall bewusst an den unteren Rand. */
  jitter:  { sdMgdl: 1.2, rho: 0.5 },
  /* Hanson et al. 2024 (JDST, doi 10.1177/19322968231225676): Libre 3
     MARD Tag 1 12,8 % gegen Tag 2 8,6 %. Form und Staerke: Nebel-Kalibrierung. */
  firstDay: { factor: 2.5, tauHours: 8 },
  /* Camerlingo 2023 nennt Aktivitaet als Rauschquelle, ohne sie zu
     beziffern. Faktor: Nebel-Kalibrierung. */
  exercise: { factor: 1.5 },
  /* Mensh et al. 2013 (JDST 7:863): Liegen auf dem Sensor erzeugt Fehlwerte
     > 25 mg/dL, meist als ploetzlicher Abfall. Baysal et al. 2014 (JDST 8:1091):
     ~3 % der naechtlichen Werte betroffen. pPerNight 0.25 x mittlere Dauer
     60 min / 8 h Nacht = 3,1 %. Dauer und Tiefe: Nebel-Kalibrierung.
     Fruehestens in der zweiten Nacht (Designentscheidung). */
  compression: { pPerNight: 0.25, firstNight: 1, windowStartHour: 0, windowHours: 5,
                 durMin: [30, 90], depthMgdl: [15, 40] },
};

const lerpU = (a: number, b: number, u: number): number => a + (b - a) * u;

/** Welcher Sensor sitzt gerade, und wie alt ist er. */
export const sensorAgeAt = (
  m: SensorModelV2, seed: number, simMin: number,
): { index: number; ageMin: number; firstChangeMin: number } => {
  const life = m.lifetimeDays * 1440;
  const start = lerpU(m.startAgeDays[0], m.startAgeDays[1], uniformAt(seed + 9001, 0)) * 1440;
  const total = simMin + start;
  const index = Math.floor(total / life);
  return { index, ageMin: total - index * life, firstChangeMin: life - start };
};

/** Kalibriercharakter eines Sensors — fest fuer seine ganze Tragedauer. */
export const sensorCalibration = (
  m: SensorModelV2, seed: number, index: number,
): { a0: number; b0: number } => {
  const c = m.calib;
  const a0 = Math.min(c.a0Max, Math.max(c.a0Min, c.a0Median + c.a0Sd * normalAt(seed + 9101, index)));
  const b0 = c.b0Median + c.b0Sd * normalAt(seed + 9103, index);
  return { a0, b0 };
};

const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
       + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

/** Langsame Drift [mg/dL]: Zufallsstuetzstellen, glatt verbunden. */
export const sensorDriftAt = (m: SensorModelV2, seed: number, simMin: number): number => {
  const k = m.drift.knotMin, j = Math.floor(simMin / k), f = simMin / k - j;
  const n = (i: number) => normalAt(seed + 9201, i);
  return m.drift.sdMgdl * catmullRom(n(j - 1), n(j), n(j + 1), n(j + 2), f);
};

const JITTER_IR = new Map<number, number[]>();
/** Kleines schnelles Zittern [mg/dL], AR(1), zaehlerbasiert. */
export const sensorJitterAt = (m: SensorModelV2, seed: number, sampleIndex: number): number => {
  const rho = m.jitter.rho;
  let h = JITTER_IR.get(rho);
  if (!h) {
    h = [];
    for (let v = 1; v > 1e-8 && h.length < 200; v *= rho) h.push(v);
    JITTER_IR.set(rho, h);
  }
  let s = 0;
  for (let j = 0; j < h.length; j++) s += h[j]! * normalAt(seed + 9301, sampleIndex - j);
  return m.jitter.sdMgdl * Math.sqrt(1 - rho * rho) * s;
};

/** Rauschanhebung: nach dem Setzen abklingend, bei Bewegung proportional zu EEfast. */
export const sensorNoiseLevel = (m: SensorModelV2, ageMin: number, eeFast: number): number =>
  1 + (m.firstDay.factor - 1) * Math.exp(-ageMin / (m.firstDay.tauHours * 60))
    + m.exercise.factor * Math.max(0, eeFast);

/** Abfall durch Druck auf den Sensor [mg/dL, ≥ 0]. Nur nachts, fruehestens Nacht 2. */
export const compressionAt = (m: SensorModelV2, seed: number, simMin: number): number => {
  const c = m.compression;
  const day = Math.floor(simMin / 1440);
  const night = day - 1;   // Nacht n liegt zwischen Tag n und n+1, ihr Fenster am Morgen von Tag n+1
  if (night < c.firstNight) return 0;
  if (uniformAt(seed + 9401, night) >= c.pPerNight) return 0;
  const start = day * 1440 + (c.windowStartHour + uniformAt(seed + 9403, night) * c.windowHours) * 60;
  const dur = lerpU(c.durMin[0], c.durMin[1], uniformAt(seed + 9405, night));
  if (simMin < start || simMin >= start + dur) return 0;
  const depth = lerpU(c.depthMgdl[0], c.depthMgdl[1], uniformAt(seed + 9407, night));
  return depth * Math.sin(Math.PI * (simMin - start) / dur) ** 2;
};

/** Angezeigter Sensorwert [mg/dL] nach Modell V2. */
export const cgmReadingV2 = (
  m: SensorModelV2, igMgdl: number, simMin: number, seed: number,
  opts: { eeFast?: number; compression?: boolean } = {},
): number => {
  const { index, ageMin } = sensorAgeAt(m, seed, simMin);
  const { a0, b0 } = sensorCalibration(m, seed, index);
  const d = ageMin / 1440;
  const gain = a0 + m.calib.a1 * d + m.calib.a2 * d * d;
  const level = sensorNoiseLevel(m, ageMin, opts.eeFast ?? 0);
  const comp = opts.compression === false ? 0 : compressionAt(m, seed, simMin);
  return gain * igMgdl + b0 + sensorDriftAt(m, seed, simMin)
       + level * sensorJitterAt(m, seed, Math.round(simMin / 5)) - comp;
};

/* Laborsensor: das publizierte G6-Modell, unveraendert. Zum Vergleich. */
export const LAB_G6_SENSOR: SensorConfig = {
  samplingIntervalMin: 5, noiseSd: 0, filterTauMin: 0, seed: 20260923,
  errorModel: DEXCOM_G6_VETTORETTI_2019,
};

/* Realistischer Sensor: Nebel-Modell V2. */
export const REALISTIC_SENSOR: SensorConfig = {
  samplingIntervalMin: 5, noiseSd: 0, filterTauMin: 0, seed: 20260923,
  modelV2: NEBEL_SENSOR_V2,
};
