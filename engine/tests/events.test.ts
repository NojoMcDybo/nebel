import { describe, it, expect } from "vitest";
import { sortEvents, validateEvents, exerciseBlock, type SimEvent } from "../src/events.js";

const meal = (t: number): SimEvent => ({ kind: "meal", t, fastCarbsG: 30, slowCarbsG: 20 });

describe("Eventstrom", () => {
  it("sortiert nach Zeitstempel", () => {
    const sorted = sortEvents([meal(120), meal(0), meal(60)]);
    expect(sorted.map((e) => e.t)).toEqual([0, 60, 120]);
  });

  it("veraendert die Eingabe nicht", () => {
    const input = [meal(120), meal(0)];
    sortEvents(input);
    expect(input[0]!.t).toBe(120);
  });

  it("weist negative Zeit, negative KH und negativen Bolus zurueck", () => {
    expect(() => validateEvents([meal(-1)])).toThrow(RangeError);
    expect(() => validateEvents([{ kind: "meal", t: 0, fastCarbsG: -1, slowCarbsG: 0 }])).toThrow();
    expect(() => validateEvents([{ kind: "bolus", t: 0, units: -2 }])).toThrow();
  });
});

describe("Belastungsblock", () => {
  it("setzt drei Stuetzstellen, damit die Herzfrequenz nicht abrampt", () => {
    const b = exerciseBlock(60, 45, 150, 65);
    expect(b.map((e) => [e.t, e.bpm])).toEqual([[60, 150], [104, 150], [105, 65]]);
  });

  it("weist zu kurze Bloecke zurueck", () => {
    expect(() => exerciseBlock(0, 1, 150, 65)).toThrow(RangeError);
  });
});
