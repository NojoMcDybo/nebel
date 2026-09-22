import { describe, it, expect } from "vitest";
import { STATE_NAMES, STATE_COUNT, STATE_INDEX, createState, get, set, assertFinite } from "../src/state.js";

describe("Zustandsvektor", () => {
  it("hat genau 16 Zustaende", () => {
    expect(STATE_COUNT).toBe(16);
  });

  it("haelt die normative Reihenfolge ein", () => {
    expect(STATE_NAMES[0]).toBe("S1");
    expect(STATE_NAMES[6]).toBe("Q1");
    expect(STATE_NAMES[8]).toBe("IG");
    expect(STATE_NAMES[15]).toBe("EElong");
  });

  it("vergibt jeden Namen genau einmal", () => {
    expect(new Set(STATE_NAMES).size).toBe(STATE_COUNT);
    expect(STATE_INDEX.Q2).toBe(7);
  });

  it("liest und schreibt ueber Namen", () => {
    const s = createState();
    set(s, "Q1", 66.5);
    expect(get(s, "Q1")).toBe(66.5);
  });

  it("erkennt nicht endliche Zustaende", () => {
    const s = createState();
    set(s, "I", Number.NaN);
    expect(() => assertFinite(s, "Test")).toThrow(/I ist NaN/);
  });
});
