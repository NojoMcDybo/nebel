import { describe, it, expect } from "vitest";
import * as u from "../src/units.js";

describe("Einheiten", () => {
  it("rechnet Glukose verlustfrei hin und zurueck", () => {
    expect(u.mmollToMgdl(5.5)).toBeCloseTo(99.1, 1);
    expect(u.mgdlToMmoll(180)).toBeCloseTo(9.99, 2);
    expect(u.mgdlToMmoll(u.mmollToMgdl(7.3))).toBeCloseTo(7.3, 10);
  });

  it("rechnet Kohlenhydrate in mmol", () => {
    expect(u.gCarbsToMmol(18.0156)).toBeCloseTo(100, 6);
    expect(u.mmolToGCarbs(u.gCarbsToMmol(45))).toBeCloseTo(45, 10);
  });

  it("rechnet Insulin in mU", () => {
    expect(u.unitsToMU(1)).toBe(1000);
    expect(u.basalRateToMUPerMin(1.2)).toBeCloseTo(20, 10);
    expect(u.bolusToMUPerMin(6, 1)).toBe(6000);
  });

  it("lehnt eine Bolusdauer von null ab", () => {
    expect(() => u.bolusToMUPerMin(4, 0)).toThrow(RangeError);
  });

  it("fuehrt die klinischen Schwellen in mmol/L", () => {
    expect(u.CLINICAL_THRESHOLDS_MMOLL.hypoLevel1).toBe(3.9);
    expect(u.mmollToMgdl(u.CLINICAL_THRESHOLDS_MMOLL.hypoLevel1)).toBeCloseTo(70, 0);
    expect(u.mmollToMgdl(u.CLINICAL_THRESHOLDS_MMOLL.hypoLevel2)).toBeCloseTo(54, 0);
  });
});
