/**
 * Validierungsstufe 3: integrierte Szenarien.
 * Das ist die Validierungsmatrix aus docs/10_Engine_Spec_V2 Abschnitt 12.
 */
import { describe, it, expect } from "vitest";
import { simulate, type SimulationConfig } from "../src/simulate.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { subjectParams, loadTherapy } from "./fixtures.js";
import { exerciseBlock, type SimEvent } from "../src/events.js";

const baseConfig = (events: SimEvent[], durationMin = 480): SimulationConfig => {
  const therapy = loadTherapy();
  return {
    durationMin,
    stepMin: 1,
    parameters: subjectParams(),
    therapy,
    pump: flatBasalProfile(therapy.basalRateUPerH),
    events,
    sensor: DEFAULT_SENSOR,
    solver: "euler",
  };
};

const peak = (xs: number[]) => Math.max(...xs);
const argPeak = (xs: number[]) => xs.indexOf(Math.max(...xs));

describe("Validierungsmatrix", () => {
  it("Baseline: stabil ohne Stoerung", () => {
    const r = simulate(baseConfig([]));
    expect(peak(r.G) - Math.min(...r.G)).toBeLessThan(0.5);
  });

  it("Mahlzeit: verzoegerter Anstieg, kein Sprung", () => {
    const r = simulate(baseConfig([{ kind: "meal", t: 60, fastCarbsG: 0, slowCarbsG: 60 }]));
    expect(r.G[61]! - r.G[60]!).toBeLessThan(0.2);
    expect(argPeak(r.G)).toBeGreaterThan(90);
  });

  it("Bolus: verzoegerte Senkung, dann Erholung", () => {
    const r = simulate(baseConfig([{ kind: "bolus", t: 60, units: 3 }]));
    expect(r.G[70]!).toBeGreaterThan(r.G[150]!);
  });

  it("Timing: Bolus vor der Mahlzeit ergibt einen anderen Verlauf als danach", () => {
    const meal: SimEvent = { kind: "meal", t: 120, fastCarbsG: 50, slowCarbsG: 0 };
    const early = simulate(baseConfig([meal, { kind: "bolus", t: 105, units: 4 }]));
    const late = simulate(baseConfig([meal, { kind: "bolus", t: 150, units: 4 }]));
    expect(Math.abs(peak(early.G) - peak(late.G))).toBeGreaterThan(0.3);
  });

  it("Bewegung moderat: Glukose faellt und wirkt nach", () => {
    const p = subjectParams();
    const hr = p.HRrest + 0.5 * (p.HRmax - p.HRrest);
    const r = simulate(baseConfig(exerciseBlock(60, 45, hr, p.HRrest)));
    expect(r.G[110]!).toBeLessThan(r.G[60]!);
    expect(r.G[300]!).toBeLessThan(r.G[60]!); // Nacheffekt ueber EElong
  });

  it("Bewegung hochintensiv: Glukose steigt zunaechst", () => {
    const p = subjectParams();
    const hr = p.HRrest + 0.95 * (p.HRmax - p.HRrest);
    const r = simulate(baseConfig(exerciseBlock(60, 15, hr, p.HRrest)));
    expect(r.G[80]!).toBeGreaterThan(r.G[60]!);
  });

  it("CGM laeuft der Physiologie hinterher", () => {
    const r = simulate(baseConfig([{ kind: "meal", t: 60, fastCarbsG: 60, slowCarbsG: 0 }]));
    const tPeakBody = r.t[argPeak(r.G)]!;
    const tPeakSensor = r.tSensor[argPeak(r.gSensor)]!;
    expect(tPeakSensor).toBeGreaterThan(tPeakBody);
  });

  it("Population: zwei Subjekte reagieren unterschiedlich, aber plausibel", () => {
    const a = simulate({ ...baseConfig([{ kind: "meal", t: 60, fastCarbsG: 50, slowCarbsG: 0 }]), parameters: subjectParams(1) });
    const b = simulate({ ...baseConfig([{ kind: "meal", t: 60, fastCarbsG: 50, slowCarbsG: 0 }]), parameters: subjectParams(7) });
    expect(Math.abs(peak(a.G) - peak(b.G))).toBeGreaterThan(0.2);
    for (const g of [...a.G, ...b.G]) expect(g).toBeGreaterThan(1);
  });

  it("Langzeit: 7 Tage bleiben numerisch stabil", () => {
    const r = simulate(baseConfig([], 7 * 1440));
    for (const g of r.G) expect(Number.isFinite(g)).toBe(true);
  });
});
