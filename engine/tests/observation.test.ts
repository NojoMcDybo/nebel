/**
 * Validierungsstufe 5: Beobachtungsmodell.
 * Nebel-Eigenleistung. Harte Regel: aendert nie den physiologischen Zustand.
 */
import { describe, it, expect } from "vitest";
import { uniformAt, normalAt, sensorTrace, DEFAULT_SENSOR } from "../src/observation.js";

describe("Beobachtungsschicht", () => {
  it("Zufall ist zaehlerbasiert und damit haeppchenunabhaengig", () => {
    const seq = Array.from({ length: 100 }, (_, i) => uniformAt(7, i));
    const again = Array.from({ length: 100 }, (_, i) => uniformAt(7, i));
    expect(seq).toEqual(again);
    expect(seq.every((x) => x >= 0 && x < 1)).toBe(true);
    // Minute 57 haengt nicht davon ab, ob 0..56 vorher gezogen wurden
    expect(uniformAt(7, 57)).toBe(seq[57]);
  });

  it("Zufall unterscheidet sich bei anderem Seed und anderem Index", () => {
    expect(uniformAt(1, 0)).not.toBe(uniformAt(2, 0));
    expect(uniformAt(1, 0)).not.toBe(uniformAt(1, 1));
  });

  it("Normalverteilung ist reproduzierbar und grob standardnormal", () => {
    const xs = Array.from({ length: 4000 }, (_, i) => normalAt(3, i));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(Math.abs(mean)).toBeLessThan(0.08);
    expect(Math.abs(sd - 1)).toBeLessThan(0.08);
    expect(normalAt(3, 10)).toBe(xs[10]);
  });

  it("tastet im 5-Minuten-Raster ab", () => {
    const ig = Array.from({ length: 61 }, (_, i) => 5 + i * 0.01);
    const { t } = sensorTrace(ig, 1, DEFAULT_SENSOR);
    expect(t.length).toBe(13);
    expect(t[1]! - t[0]!).toBe(5);
  });

  it("gibt ohne Rauschen und Filter die abgetastete Spur zurueck", () => {
    const ig = Array.from({ length: 11 }, () => 6);
    const { gSensor } = sensorTrace(ig, 1, { ...DEFAULT_SENSOR, noiseSd: 0, filterTauMin: 0 });
    expect(gSensor.every((g) => g === 6)).toBe(true);
  });

  it("veraendert die uebergebene IG-Spur nicht", () => {
    const ig = [5, 5.1, 5.2, 5.3, 5.4, 5.5];
    const copy = [...ig];
    sensorTrace(ig, 1, { ...DEFAULT_SENSOR, noiseSd: 0.3, seed: 7 });
    expect(ig).toEqual(copy);
  });
});
