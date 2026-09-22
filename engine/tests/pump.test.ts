import { describe, it, expect } from "vitest";
import { flatBasalProfile, insulinInputAt, insulinOnBoardUnits } from "../src/pump.js";
import type { SimEvent } from "../src/events.js";

const program = flatBasalProfile(1.2); // 1.2 U/h = 20 mU/min

describe("Pumpenschicht (CSII, Open Loop)", () => {
  it("bildet die Basalrate auf mU/min ab", () => {
    expect(insulinInputAt(0, 1, program, [])).toBeCloseTo(20, 10);
  });

  it("legt einen Bolus additiv auf die Basalrate", () => {
    const events: SimEvent[] = [{ kind: "bolus", t: 30, units: 6 }];
    expect(insulinInputAt(30, 1, program, events)).toBeCloseTo(20 + 6000, 6);
    expect(insulinInputAt(31, 1, program, events)).toBeCloseTo(20, 10);
  });

  it("liefert die volle Bolusmenge unabhaengig von der Dauer", () => {
    const short: SimEvent[] = [{ kind: "bolus", t: 0, units: 4, durationMin: 1 }];
    const long: SimEvent[] = [{ kind: "bolus", t: 0, units: 4, durationMin: 30 }];
    const sum = (ev: SimEvent[], n: number) =>
      Array.from({ length: n }, (_, i) => insulinInputAt(i, 1, program, ev) - 20)
        .reduce((a, b) => a + b, 0);
    expect(sum(short, 60)).toBeCloseTo(4000, 6);
    expect(sum(long, 60)).toBeCloseTo(4000, 6);
  });

  it("skaliert bei Temp-Basal und stoppt bei Faktor null", () => {
    const events: SimEvent[] = [{ kind: "tempBasal", t: 10, factor: 0.5, durationMin: 60 }];
    expect(insulinInputAt(30, 1, program, events)).toBeCloseTo(10, 10);
    expect(insulinInputAt(80, 1, program, events)).toBeCloseTo(20, 10);
    const stop: SimEvent[] = [{ kind: "tempBasal", t: 0, factor: 0, durationMin: 30 }];
    expect(insulinInputAt(5, 1, program, stop)).toBe(0);
  });

  it("haelt IOB als reine Anzeigegroesse aus der Bolushistorie", () => {
    const events: SimEvent[] = [{ kind: "bolus", t: 0, units: 4 }];
    expect(insulinOnBoardUnits(0, events)).toBeCloseTo(4, 10);
    expect(insulinOnBoardUnits(120, events)).toBeCloseTo(2, 10);
    expect(insulinOnBoardUnits(240, events)).toBe(0);
  });
});
