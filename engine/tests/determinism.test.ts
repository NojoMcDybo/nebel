/**
 * Voraussetzung fuer den Analyse-Screen mit Sandbox:
 * gleiche Eingabe, bitgleiches Ergebnis.
 */
import { describe, it, expect } from "vitest";
import { simulate } from "../src/simulate.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { subjectParams, loadTherapy } from "./fixtures.js";
import { eulerStep, rk4Step } from "../src/solver.js";
import { derivatives } from "../src/model.js";
import { createState } from "../src/state.js";

const cfg = () => {
  const therapy = loadTherapy();
  return {
    durationMin: 720, stepMin: 1,
    parameters: subjectParams(), therapy,
    pump: flatBasalProfile(therapy.basalRateUPerH),
    events: [{ kind: "meal", t: 60, fastCarbsG: 40, slowCarbsG: 20 }] as const,
    sensor: DEFAULT_SENSOR,
    solver: "euler" as const,
  };
};

describe("Determinismus und Numerik", () => {
  it("reproduziert denselben Verlauf bei identischer Eingabe", () => {
    const a = simulate(cfg());
    const b = simulate(cfg());
    expect(a.G).toEqual(b.G);
    expect(a.gSensor).toEqual(b.gSensor);
  });

  it("konvergiert zwischen 1 min und 0.25 min", () => {
    const coarse = simulate({ ...cfg(), stepMin: 1 });
    const fine = simulate({ ...cfg(), stepMin: 0.25 });
    const last = (r: { G: number[] }) => r.G[r.G.length - 1]!;
    expect(Math.abs(last(coarse) - last(fine))).toBeLessThan(0.1);
  });

  it("Euler und RK4 liefern bei 1 min vergleichbare Verlaeufe", () => {
    const e = simulate({ ...cfg(), solver: "euler" });
    const r = simulate({ ...cfg(), solver: "rk4" });
    expect(Math.abs(e.G[e.G.length - 1]! - r.G[r.G.length - 1]!)).toBeLessThan(0.1);
  });

  it("Solver veraendern den Eingangszustand nicht", () => {
    const p = subjectParams();
    const s = createState();
    const before = Array.from(s);
    eulerStep(derivatives, s, 0, 1, p, { uFastCarbs: 0, uSlowCarbs: 0, uHR: 60, uInsulin: 0 });
    rk4Step(derivatives, s, 0, 1, p, { uFastCarbs: 0, uSlowCarbs: 0, uHR: 60, uInsulin: 0 });
    expect(Array.from(s)).toEqual(before);
  });
});
