import { describe, it, expect } from "vitest";
import { NEBEL_CALIBRATION, applyNebelCalibration, nebelParameters } from "../src/calibration.js";
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
