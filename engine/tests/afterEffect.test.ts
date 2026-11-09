import { describe, it, expect } from "vitest";
import { AFTER_EFFECT, afterEffectFactor, afterEffectLoad } from "../src/afterEffect.js";
import { exerciseBlock, type SimEvent } from "../src/events.js";
import { heartRateAt, simulate } from "../src/simulate.js";
import { heartRateReserve } from "../src/model.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { nebelParameters } from "../src/calibration.js";
import { MGDL_PER_MMOLL } from "../src/units.js";
import type { Parameters } from "../src/parameters.js";
import { loadSubject, loadTherapy, oracleAvailable } from "./fixtures.js";

/** Fuer die Spur zaehlen nur Ruhepuls, Maximalpuls und Schwelle. */
const p = { HRrest: 60, HRmax: 180, VT_HRR: 0.6 } as Parameters;
const bpm = (share: number) => p.HRrest + share * (p.HRmax - p.HRrest);

/** Dieselbe Groesse, numerisch: Trapez in 0,01-min-Schritten ueber heartRateAt. */
const numericLoad = (t: number, ev: SimEvent[], tau = AFTER_EFFECT.tauMin) => {
  const h = (s: number) => heartRateReserve(heartRateAt(s, ev, p.HRrest), p).hrr * Math.exp((s - t) / tau);
  let L = 0;
  for (let s = 0; s < t; s += 0.01) L += ((h(s) + h(Math.min(t, s + 0.01))) / 2) * Math.min(0.01, t - s);
  return L;
};

describe("Nachwirkung: Spur", () => {
  it("ist ohne Bewegung exakt 1", () => {
    const ev: SimEvent[] = [
      { kind: "meal", t: 100, fastCarbsG: 20, slowCarbsG: 40 },
      { kind: "bolus", t: 100, units: 4 },
      { kind: "heartRate", t: 200, bpm: p.HRrest },
    ];
    expect(afterEffectFactor(900, [], p)).toBe(1);
    expect(afterEffectFactor(900, ev, p)).toBe(1);
  });

  it("integriert die Herzfrequenzspur exakt, auch Rampen und laufende Bloecke", () => {
    const ev: SimEvent[] = [
      ...exerciseBlock(60, 45, bpm(0.55), p.HRrest),
      { kind: "heartRate", t: 300, bpm: p.HRrest },
      { kind: "heartRate", t: 330, bpm: bpm(0.8) },    // langsame Rampe
      { kind: "heartRate", t: 350, bpm: p.HRrest },
    ];
    for (const t of [80, 104.5, 200, 320, 345, 900])
      expect(afterEffectLoad(t, ev, p), `t=${t}`).toBeCloseTo(numericLoad(t, ev), 3);
  });

  it("haengt nicht an der Reihenfolge der Ereignisse", () => {
    const ev = exerciseBlock(60, 45, bpm(0.55), p.HRrest);
    expect(afterEffectLoad(500, [...ev].reverse(), p)).toBeCloseTo(afterEffectLoad(500, ev, p), 12);
  });

  it("klingt mit tau ab: nach tau · ln 2 die Haelfte", () => {
    const ev = exerciseBlock(60, 45, bpm(0.55), p.HRrest);
    const end = afterEffectLoad(105, ev, p);
    expect(afterEffectLoad(105 + AFTER_EFFECT.tauMin * Math.LN2, ev, p) / end).toBeCloseTo(0.5, 6);
  });

  it("waechst mit Dauer und Intensitaet", () => {
    const at = (share: number, dur: number) => afterEffectFactor(60 + dur, exerciseBlock(60, dur, bpm(share), p.HRrest), p);
    expect(at(0.55, 60)).toBeGreaterThan(at(0.55, 30));
    expect(at(0.8, 30)).toBeGreaterThan(at(0.55, 30));
    expect(at(0.55, 60)).toBeCloseTo(1.14, 2);   // 60 min moderat: Insulin wirkt 14 % staerker
  });
});

const run = oracleAvailable() ? describe : describe.skip;

/**
 * Nachrechnung mit den 20 Subjekten: 60 min bei 55 % der Herzfrequenzreserve
 * um 16 Uhr, Abendessen 60 g mit Bolus um 19 Uhr, Nachtmittel 22–6 Uhr.
 */
const nightMean = (n: number, sport: boolean, basalCut: boolean) => {
  const sp = nebelParameters(loadSubject(n)), therapy = loadTherapy(n);
  const basal = therapy.basalRateUPerH;
  const ev: SimEvent[] = [
    { kind: "meal", t: 1140, fastCarbsG: 24, slowCarbsG: 36 },
    { kind: "bolus", t: 1140, units: 60 / therapy.carbRatioGPerU },
  ];
  if (sport) ev.push(...exerciseBlock(960, 60, sp.HRrest + 0.55 * (sp.HRmax - sp.HRrest), sp.HRrest));
  if (basalCut) ev.push({ kind: "basal", t: 1260, rateUPerH: 0.8 * basal }, { kind: "basal", t: 1620, rateUPerH: basal });
  const r = simulate({
    durationMin: 1800, stepMin: 1, parameters: sp, therapy, pump: flatBasalProfile(basal),
    events: ev, sensor: DEFAULT_SENSOR, solver: "rk4",
  });
  const night = r.G.slice(1319, 1799);                  // G[i] gilt fuer t = i + 1
  return {
    night: (night.reduce((a, b) => a + b, 0) / night.length) * MGDL_PER_MMOLL,
    dayMin: Math.min(...r.G.slice(959, 1259)) * MGDL_PER_MMOLL,   // 16–21 Uhr
  };
};
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

run("Nachwirkung: Kalibrierung", () => {
  const all = Array.from({ length: 20 }, (_, i) => {
    const rest = nightMean(i + 1, false, false), sport = nightMean(i + 1, true, false);
    return { drop: sport.night - rest.night, cut: nightMean(i + 1, true, true).night - sport.night, dayMin: sport.dayMin };
  });
  /* Wer schon am Nachmittag unter 70 faellt, haette gegessen (DirecNet hat
     Unterzucker waehrend des Trainings behandelt). Ohne Behandlung bliebe
     dessen Nacht vom Tief bestimmt, nicht von der Nachwirkung. */
  const rows = all.filter((r) => r.dayMin >= 70);

  it("rechnet mit der Haelfte der Subjekte", () => {
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it("trifft DirecNet 2005: Nacht nach Nachmittagstraining 23 mg/dL tiefer", () => {
    const drop = median(rows.map((r) => r.drop));
    expect(drop).toBeGreaterThan(-26);
    expect(drop).toBeLessThan(-19);
  });

  it("Gegenprobe Taplin 2010: 20 % weniger Basal ueber 6 h gleicht das groesstenteils aus", () => {
    const ratio = median(rows.map((r) => -r.drop / r.cut));
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.5);
  });
});
