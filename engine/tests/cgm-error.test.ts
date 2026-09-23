/**
 * CGM-Fehlermodell (Vettoretti et al. 2019, Dexcom G6).
 * Prueft, dass die Implementierung die publizierten statistischen
 * Eigenschaften reproduziert — und dass sie echtzeit-tauglich bleibt.
 */
import { describe, it, expect } from "vitest";
import {
  DEXCOM_G6_VETTORETTI_2019 as G6, arImpulseResponse, arStationarySd,
  cgmNoiseAt, cgmGain, cgmReadingMgdl, sensorTrace, REALISTIC_SENSOR,
} from "../src/observation.js";

const series = (n: number, seed = 11) => Array.from({ length: n }, (_, k) => cgmNoiseAt(G6, seed, k));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const lag1 = (xs: number[]) => {
  const m = mean(xs); let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { den += (xs[i]! - m) ** 2; if (i) num += (xs[i]! - m) * (xs[i - 1]! - m); }
  return num / den;
};

describe("AR(2)-Messrauschen", () => {
  it("ist stationaer mit den publizierten Koeffizienten", () => {
    const { alpha1: a1, alpha2: a2 } = G6;
    expect(a1 + a2).toBeLessThan(1);
    expect(a2 - a1).toBeLessThan(1);
    expect(Math.abs(a2)).toBeLessThan(1);
  });

  it("die abgeschnittene Impulsantwort traegt die volle Varianz", () => {
    const h = arImpulseResponse(G6.alpha1, G6.alpha2);
    const varTrunc = h.reduce((a, x) => a + x * x, 0) * G6.sigmaW ** 2;
    expect(Math.sqrt(varTrunc)).toBeCloseTo(arStationarySd(G6), 6);
  });

  it("empirische Streuung trifft die theoretische", () => {
    const xs = series(20000);
    expect(Math.abs(mean(xs))).toBeLessThan(0.25);
    expect(sd(xs) / arStationarySd(G6)).toBeGreaterThan(0.95);
    expect(sd(xs) / arStationarySd(G6)).toBeLessThan(1.05);
  });

  it("ist autokorreliert wie ein AR(2) — glatt, nicht zappelig", () => {
    const rho1 = G6.alpha1 / (1 - G6.alpha2);   // theoretische Lag-1-Autokorrelation
    expect(lag1(series(20000))).toBeCloseTo(rho1, 1);
    expect(rho1).toBeGreaterThan(0.75);
  });

  it("haengt nur von (seed, Index) ab — Nachholen bleibt bitgleich", () => {
    const forward = [0, 1, 2, 3, 500, 501].map((k) => cgmNoiseAt(G6, 5, k));
    const shuffled = [501, 3, 0, 500, 2, 1].map((k) => [k, cgmNoiseAt(G6, 5, k)] as const);
    const byK = new Map(shuffled);
    expect([0, 1, 2, 3, 500, 501].map((k) => byK.get(k))).toEqual(forward);
  });

  it("unterscheidet sich zwischen Seeds", () => {
    expect(cgmNoiseAt(G6, 1, 100)).not.toBe(cgmNoiseAt(G6, 2, 100));
  });
});

describe("Verstaerkungsfehler", () => {
  it("startet bei a0 und bleibt ueber die Tragedauer plausibel", () => {
    expect(cgmGain(G6, 0)).toBeCloseTo(0.95, 10);
    for (let d = 0; d < 10; d += 0.5) {
      const a = cgmGain(G6, d * 1440);
      expect(a).toBeGreaterThan(0.9);
      expect(a).toBeLessThan(1.05);
    }
  });

  it("beginnt nach Ablauf der Tragedauer mit einem neuen Sensor", () => {
    expect(cgmGain(G6, 10 * 1440)).toBeCloseTo(cgmGain(G6, 0), 10);
  });
});

describe("Sensorspur mit Fehlermodell", () => {
  const ig = Array.from({ length: 24 * 60 }, (_, i) => 6 + 2 * Math.sin(i / 180));

  it("weicht von der interstitiellen Glukose ab, aber in plausiblem Rahmen", () => {
    const { t, gSensor } = sensorTrace(ig, 1, REALISTIC_SENSOR);
    const rel = gSensor.map((g, k) => Math.abs(g - ig[t[k]!]!) / ig[t[k]!]!);
    const mard = mean(rel) * 100;
    expect(mard).toBeGreaterThan(2);
    expect(mard).toBeLessThan(15);
  });

  it("ist reproduzierbar", () => {
    expect(sensorTrace(ig, 1, REALISTIC_SENSOR).gSensor)
      .toEqual(sensorTrace(ig, 1, REALISTIC_SENSOR).gSensor);
  });

  it("Teilstuecke fuegen sich luecklos zusammen", () => {
    const whole = sensorTrace(ig, 1, REALISTIC_SENSOR).gSensor;
    const a = sensorTrace(ig.slice(0, 600), 1, REALISTIC_SENSOR, 0).gSensor;
    const b = sensorTrace(ig.slice(600), 1, REALISTIC_SENSOR, 600).gSensor;
    expect(a.concat(b)).toEqual(whole);
  });

  it("mg/dL-Wert folgt der Modellgleichung", () => {
    const v = cgmReadingMgdl(G6, 100, 0, 3, 7);
    expect(v).toBeCloseTo(0.95 * 100 + 0.14 + cgmNoiseAt(G6, 3, 7), 10);
  });
});
