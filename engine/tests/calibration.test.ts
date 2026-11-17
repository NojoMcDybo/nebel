import { describe, it, expect } from "vitest";
import { EXERCISE_CALIBRATION, NEBEL_CALIBRATION, applyNebelCalibration, exerciseDrop, nebelParameters } from "../src/calibration.js";
import { equilibriumGlucose } from "../src/model.js";
import { basalRateToMUPerMin } from "../src/units.js";
import { simulate } from "../src/simulate.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { loadSubject, loadTherapy, subjectParams, oracleAvailable } from "./fixtures.js";

const run = oracleAvailable() ? describe : describe.skip;

/** 1 U ohne Essen im Gleichgewicht: wann faellt der Wert am schnellsten, wann ist der Tiefpunkt. */
const bolusProfile = (n: number, calibrated: boolean) => {
  const p = calibrated ? nebelParameters(loadSubject(n)) : subjectParams(n);
  const th = loadTherapy(n);
  const G = simulate({
    durationMin: 600, stepMin: 1, parameters: p, therapy: th,
    pump: flatBasalProfile(th.basalRateUPerH), events: [{ kind: "bolus", t: 0, units: 1 }], sensor: DEFAULT_SENSOR,
  }).G;
  let nadir = 0; for (let i = 0; i < G.length; i++) if (G[i]! < G[nadir]!) nadir = i;
  let fastest = 0, rate = 0;
  for (let i = 10; i < G.length; i++) { const r = G[i - 10]! - G[i]!; if (r > rate) { rate = r; fastest = i - 5; } }
  return { nadirMin: nadir, fastestMin: fastest };
};

describe("Nebel-Kalibrierung", () => {
  it("setzt genau die dokumentierten Werte und laesst den Rest unberuehrt", () => {
    const src = { tsub: 15, tmaxI: 114, kb1: 1, ke: 0.138 } as never;
    const cal = applyNebelCalibration(src);
    expect(cal).toMatchObject({ ...NEBEL_CALIBRATION, kb1: 1, ke: 0.138 });
    expect(src).toMatchObject({ tsub: 15, tmaxI: 114 });   // Eingabe nicht veraendert
    expect(Object.keys(NEBEL_CALIBRATION).sort()).toEqual(["tmaxI", "tsub"]);
  });
});

run("Nebel-Kalibrierung gegen die Quellsubjekte", () => {
  it("veraendert das Basalgleichgewicht nicht", () => {
    for (const n of [1, 7, 14]) {
      const u = basalRateToMUPerMin(loadTherapy(n).basalRateUPerH);
      const raw = equilibriumGlucose(subjectParams(n), u);
      const cal = equilibriumGlucose(nebelParameters(loadSubject(n)), u);
      expect(Math.abs(raw - cal)).toBeLessThan(1e-6);
    }
  });

  it("legt die Insulinwirkung in die Grenzen der Fachinformation (Maximum 1–3 h, Wirkdauer 3–5 h)", () => {
    for (const n of [1, 7, 14]) {
      const b = bolusProfile(n, true);
      expect(b.fastestMin).toBeGreaterThanOrEqual(45);
      expect(b.fastestMin).toBeLessThanOrEqual(180);
      expect(b.nadirMin).toBeGreaterThanOrEqual(180);
      expect(b.nadirMin).toBeLessThanOrEqual(300);
    }
  });

  it("Gegenprobe: mit den Quellwerten liegt der Tiefpunkt jenseits von fuenf Stunden", () => {
    expect(bolusProfile(1, false).nadirMin).toBeGreaterThan(300);
  });
});

run("Kalibrierung: Bewegung (p3/p4 je Koerper)", () => {
  const c = EXERCISE_CALIBRATION;
  const rows = Array.from({ length: 20 }, (_, i) => {
    const src = applyNebelCalibration(subjectParams(i + 1)), cal = nebelParameters(loadSubject(i + 1));
    return { src, cal, own: exerciseDrop(src, 1), drop: exerciseDrop(cal, 1) };
  });

  it("60 min bei 55 % HRR: jeder Koerper faellt um 18–54 %, Median um 40 % (DirecNet 2005)", () => {
    for (const r of rows) {
      expect(r.drop).toBeGreaterThanOrEqual(c.floor - 1e-3);
      expect(r.drop).toBeLessThanOrEqual(c.floor + c.span + 1e-3);
    }
    const s = rows.map((r) => r.drop).sort((a, b) => a - b);
    expect((s[9]! + s[10]!) / 2).toBeGreaterThan(0.35);
    expect((s[9]! + s[10]!) / 2).toBeLessThan(0.45);
  });

  it("die Reihenfolge der Koerper bleibt (wer ohne Abfall war, landet gemeinsam am Boden)", () => {
    for (const a of rows) for (const b of rows)
      if (a.own < b.own && b.own > 0) expect(a.drop).toBeLessThan(b.drop + 1e-6);
  });

  it("unterhalb der Schwelle: mehr Intensitaet, mehr Abfall", () => {
    for (const r of rows) expect(exerciseDrop(r.cal, 1, 0.35)).toBeLessThan(r.drop);
  });

  it("aendert nur p3 und p4, das Ruhegleichgewicht bleibt", () => {
    for (const r of rows) {
      const changed = Object.keys(r.cal).filter((k) => r.cal[k as keyof typeof r.cal] !== r.src[k as keyof typeof r.src]);
      expect(changed.sort()).toEqual(changed.length ? ["p3", "p4"] : []);
      expect(equilibriumGlucose(r.cal, 30)).toBeCloseTo(equilibriumGlucose(r.src, 30), 10);
    }
  });

  it("rechnet je Subjekt einmal", () => {
    const s = loadSubject(3);
    expect(nebelParameters(s)).toBe(nebelParameters(s));
  });
});
