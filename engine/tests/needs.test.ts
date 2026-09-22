/**
 * Bedürfnisschicht. Reine Szenarioarithmetik, keine Physiologie.
 */
import { describe, it, expect } from "vitest";
import {
  advanceReserve, eat, reserveLabel, isHeisshunger, DEFAULT_RESERVE_CONFIG,
} from "../src/scenario/needs.js";

describe("Reserven", () => {
  it("leeren sich in Ruhe monoton", () => {
    let r = 1;
    const first = advanceReserve(r, 60, 0, 0);
    const second = advanceReserve(first, 60, 0, 0);
    expect(first).toBeLessThan(r);
    expect(second).toBeLessThan(first);
  });

  it("leeren sich unter Belastung schneller", () => {
    const rest = advanceReserve(1, 30, 0, 0);
    const load = advanceReserve(1, 30, 0.8, 0);
    expect(load).toBeLessThan(rest);
  });

  it("beruecksichtigen den Nacheffekt der Belastung", () => {
    const plain = advanceReserve(1, 60, 0, 0);
    const after = advanceReserve(1, 60, 0, 0.5);
    expect(after).toBeLessThan(plain);
  });

  it("bleiben im Bereich 0 bis 1", () => {
    expect(advanceReserve(0.01, 10_000, 1, 1)).toBe(0);
    expect(eat(0.95, 10_000)).toBe(1);
  });

  it("werden durch Essen proportional aufgefuellt", () => {
    const small = eat(0.3, 50);
    const big = eat(0.3, 150);
    expect(small).toBeGreaterThan(0.3);
    expect(big).toBeGreaterThan(small);
  });

  it("weisen negative Eingaben zurueck", () => {
    expect(() => advanceReserve(1, -1, 0, 0)).toThrow(RangeError);
    expect(() => eat(1, -5)).toThrow(RangeError);
  });

  it("sind deterministisch", () => {
    expect(advanceReserve(0.7, 17, 0.3, 0.1)).toBe(advanceReserve(0.7, 17, 0.3, 0.1));
  });

  it("veraendern die Konfiguration nicht", () => {
    const before = { ...DEFAULT_RESERVE_CONFIG };
    advanceReserve(1, 60, 1, 1);
    eat(0.5, 100);
    expect(DEFAULT_RESERVE_CONFIG).toEqual(before);
  });
});

describe("Anzeige", () => {
  it("fordert bei fast leeren Reserven zum Essen auf", () => {
    expect(reserveLabel(0.2, 15, 0)).toBe("Reserven · iss etwas");
  });

  it("erkennt den Morgen", () => {
    expect(reserveLabel(0.6, 8, 0)).toBe("Reserven · hungrig aufgewacht");
    expect(reserveLabel(0.9, 8, 0)).toBe("Reserven");
  });

  it("erkennt den Bedarf nach Belastung", () => {
    expect(reserveLabel(0.5, 17, 0.4)).toBe("Reserven · nachtanken");
  });

  it("erkennt die Mittagszeit", () => {
    expect(reserveLabel(0.55, 12, 0)).toBe("Reserven · Mittagszeit");
  });

  it("schweigt, wenn nichts anliegt", () => {
    expect(reserveLabel(0.85, 16, 0)).toBe("Reserven");
  });

  it("erkennt Heisshunger nur bei Belastung und leeren Reserven", () => {
    expect(isHeisshunger(0.2, 0.5)).toBe(true);
    expect(isHeisshunger(0.2, 0.1)).toBe(false);
    expect(isHeisshunger(0.8, 0.5)).toBe(false);
  });
});
