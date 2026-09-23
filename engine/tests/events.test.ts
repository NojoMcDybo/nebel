import { describe, it, expect } from "vitest";
import { sortEvents, validateEvents, exerciseBlock, type SimEvent } from "../src/events.js";
import { heartRateAt } from "../src/simulate.js";

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
  it("setzt vier Stuetzstellen: Ruhe davor, Belastung, Ruhe danach", () => {
    const b = exerciseBlock(60, 45, 150, 65);
    expect(b.map((e) => [e.t, e.bpm])).toEqual([[60, 150], [104, 150], [105, 65], [59, 65]]);
  });

  it("zwischen zwei Bloecken an verschiedenen Tagen bleibt die Herzfrequenz in Ruhe", () => {
    const ev = sortEvents([...exerciseBlock(17 * 60, 45, 120, 66), ...exerciseBlock(1440 + 17 * 60, 45, 120, 66)]);
    for (const t of [18 * 60, 22 * 60, 1440 + 3 * 60, 1440 + 9 * 60, 1440 + 16 * 60 + 58]) {
      expect(heartRateAt(t, ev, 66), `t=${t}`).toBe(66);
    }
    expect(heartRateAt(1440 + 17 * 60 + 10, ev, 66)).toBe(120);
  });

  it("ein Block ab Minute 0 kommt ohne Ruhepunkt davor aus", () => {
    expect(exerciseBlock(0, 30, 140, 60)).toHaveLength(3);
  });

  it("weist zu kurze Bloecke zurueck", () => {
    expect(() => exerciseBlock(0, 1, 150, 65)).toThrow(RangeError);
  });
});
