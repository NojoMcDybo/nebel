/**
 * Sensormodell V2. Prueft zwei getrennte Eigenschaften, weil es zwei
 * verschiedene Dinge sind:
 *   Glaette     — wie ruhig die Kurve von Wert zu Wert ist
 *   Richtigkeit — wie weit sie vom Koerper entfernt ist
 * Das erste fehlte bisher. Ausserdem die Einstiegsregel: am ersten Tag
 * weder Sensorwechsel noch Druck auf den Sensor.
 */
import { describe, it, expect } from "vitest";
import {
  NEBEL_SENSOR_V2 as M, cgmReadingV2, sensorAgeAt, sensorCalibration,
  compressionAt, sensorNoiseLevel, sensorTrace, REALISTIC_SENSOR,
} from "../src/observation.js";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };

/** Ruhige Phase: Koerper konstant, keine Bewegung, kein Druck. Ab Tag 2, damit kein Setzen stoert. */
const quiet = (seed: number, ig = 108, samples = 2000) =>
  Array.from({ length: samples }, (_, i) =>
    Math.round(cgmReadingV2(M, ig, 1440 + i * 5, seed, { compression: false })));

describe("Glaette in ruhigen Phasen", () => {
  it("der Wert aendert sich von Messung zu Messung kaum", () => {
    const steps = quiet(7).slice(1).map((v, i, a) => v - quiet(7)[i]!);
    expect(sd(steps)).toBeLessThan(1.8);
  });

  it("Spruenge ab 4 mg/dL sind selten", () => {
    const v = quiet(11);
    const steps = v.slice(1).map((x, i) => Math.abs(x - v[i]!));
    expect(steps.filter((d) => d >= 4).length / steps.length).toBeLessThan(0.03);
  });

  it("nach zwei Anstiegen folgt selten ein Absturz um 3 und mehr", () => {
    const v = quiet(23, 108, 6000);
    let runs = 0, drops = 0;
    for (let i = 2; i < v.length - 1; i++) {
      if (v[i - 1]! > v[i - 2]! && v[i]! > v[i - 1]!) { runs++; if (v[i + 1]! <= v[i]! - 3) drops++; }
    }
    expect(drops / runs).toBeLessThan(0.1);   // G6-Labormodell: 32 %
  });
});

describe("Richtigkeit", () => {
  it("die Abweichung zum Koerper liegt im publizierten Bereich", () => {
    // ueber viele Sensoren gemittelt, konstanter Koerperwert
    const errs: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      for (let i = 0; i < 288; i++) {
        const v = cgmReadingV2(M, 120, 1440 + i * 5, seed, { compression: false });
        errs.push(Math.abs(v - 120) / 120);
      }
    }
    const mard = mean(errs) * 100;
    expect(mard).toBeGreaterThan(3);
    expect(mard).toBeLessThan(14);
  });

  it("jeder Sensor hat einen eigenen, festen Charakter", () => {
    const a = sensorCalibration(M, 5, 0), b = sensorCalibration(M, 5, 1);
    expect(a).toEqual(sensorCalibration(M, 5, 0));
    expect(a.a0).not.toBe(b.a0);
    for (let i = 0; i < 200; i++) {
      const c = sensorCalibration(M, 5, i);
      expect(c.a0).toBeGreaterThanOrEqual(M.calib.a0Min);
      expect(c.a0).toBeLessThanOrEqual(M.calib.a0Max);
    }
  });
});

describe("Einstiegsregel: der erste Tag bleibt frei von Sonderfaellen", () => {
  it("beim Start sitzt der Sensor schon mindestens zwei Tage", () => {
    for (let seed = 0; seed < 300; seed++) {
      expect(sensorAgeAt(M, seed, 0).ageMin).toBeGreaterThanOrEqual(2 * 1440);
    }
  });

  it("der erste Sensorwechsel kommt fruehestens am dritten Tag", () => {
    for (let seed = 0; seed < 300; seed++) {
      expect(sensorAgeAt(M, seed, 0).firstChangeMin).toBeGreaterThanOrEqual(2 * 1440);
    }
  });

  it("am Start gibt es keine Rauschanhebung durch frisches Setzen", () => {
    const age = sensorAgeAt(M, 3, 0).ageMin;
    expect(sensorNoiseLevel(M, age, 0)).toBeLessThan(1.01);
  });

  it("in der ersten Nacht liegt niemand auf dem Sensor", () => {
    for (let seed = 0; seed < 300; seed++) {
      for (let t = 0; t < 2 * 1440; t += 5) expect(compressionAt(M, seed, t)).toBe(0);
    }
  });
});

describe("Druck auf den Sensor", () => {
  it("trifft ab der zweiten Nacht etwa 3 % der Nachtwerte (Baysal 2014)", () => {
    let nights = 0, hits = 0, readings = 0, attenuated = 0;
    for (let seed = 0; seed < 80; seed++) {
      for (let day = 2; day < 12; day++) {
        nights++;
        let hit = false;
        for (let t = day * 1440; t < day * 1440 + 8 * 60; t += 5) {
          readings++;
          if (compressionAt(M, seed, t) > 0) { hit = true; attenuated++; }
        }
        if (hit) hits++;
      }
    }
    expect(hits / nights).toBeGreaterThan(0.15);
    expect(hits / nights).toBeLessThan(0.35);
    expect(attenuated / readings).toBeGreaterThan(0.015);
    expect(attenuated / readings).toBeLessThan(0.05);
  });

  it("bleibt in der belegten Groessenordnung: hoechstens 40 mg/dL, 30 bis 90 Minuten", () => {
    for (let seed = 0; seed < 80; seed++) {
      for (let day = 2; day < 8; day++) {
        let first = -1, last = -1, peak = 0;
        for (let t = day * 1440; t < day * 1440 + 8 * 60; t++) {
          const c = compressionAt(M, seed, t);
          if (c > 0) { if (first < 0) first = t; last = t; peak = Math.max(peak, c); }
        }
        if (first < 0) continue;
        expect(peak).toBeLessThanOrEqual(40);
        expect(last - first + 1).toBeGreaterThanOrEqual(28);
        expect(last - first + 1).toBeLessThanOrEqual(91);
      }
    }
  });
});

describe("Rauschanhebung", () => {
  it("steigt bei Bewegung", () => {
    expect(sensorNoiseLevel(M, 5 * 1440, 0.8)).toBeGreaterThan(sensorNoiseLevel(M, 5 * 1440, 0));
  });

  it("steigt direkt nach einem Sensorwechsel und klingt ab", () => {
    expect(sensorNoiseLevel(M, 30, 0)).toBeGreaterThan(2);
    expect(sensorNoiseLevel(M, 30 * 60, 0)).toBeLessThan(1.1);
  });
});

describe("Echtzeit-Tauglichkeit", () => {
  it("Teilstuecke fuegen sich bitgleich zusammen", () => {
    const ig = Array.from({ length: 3 * 1440 }, (_, i) => 6 + Math.sin(i / 200));
    const whole = sensorTrace(ig, 1, REALISTIC_SENSOR).gSensor;
    const a = sensorTrace(ig.slice(0, 1700), 1, REALISTIC_SENSOR, 0).gSensor;
    const b = sensorTrace(ig.slice(1700), 1, REALISTIC_SENSOR, 1700).gSensor;
    expect(a.concat(b)).toEqual(whole);
  });
});
