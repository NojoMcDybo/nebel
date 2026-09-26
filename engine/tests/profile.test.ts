import { describe, it, expect } from "vitest";
import { responseProfile } from "../src/scenario/profile.js";
import { nebelParameters } from "../src/calibration.js";
import { loadSubject, loadTherapy, oracleAvailable } from "./fixtures.js";

const run = oracleAvailable() ? describe : describe.skip;
const prof = (n: number) => responseProfile(nebelParameters(loadSubject(n)), loadTherapy(n));

run("Antwortprofil", () => {
  it("startet im Basalgleichgewicht bei 108 mg/dL", () => {
    expect(prof(10).startMgdl).toBeCloseTo(108.1, 0);
  });

  it("trifft die Registry-Tabelle fuer Patient 10", () => {
    const r = prof(10);
    expect(r.oneUnitDropMgdl).toBeCloseTo(33, -0.5);
    expect(r.mealPeakMgdl).toBeCloseTo(163, -0.5);
    expect(r.moderateExerciseDropMgdl).toBeCloseTo(31, -0.5);
    expect(r.hardExerciseRiseMgdl).toBeCloseTo(40, -0.5);
  });

  it("unterscheidet die Personen in der erwarteten Richtung", () => {
    expect(prof(7).oneUnitDropMgdl).toBeLessThan(prof(4).oneUnitDropMgdl);          // unempfindlich vs. empfindlich
    expect(prof(11).moderateExerciseDropMgdl).toBeLessThan(prof(6).moderateExerciseDropMgdl); // schwacher vs. starker Sport-Responder
    expect(prof(10).mealNoBolusPeakMgdl).toBeGreaterThan(prof(10).mealPeakMgdl);
  });

  it("ist deterministisch", () => {
    expect(prof(8)).toEqual(prof(8));
  });
});
