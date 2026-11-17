import { describe, it, expect } from "vitest";
import { EXERCISE_CALIBRATION, NEBEL_CALIBRATION, applyNebelCalibration, exerciseDrop, nebelParameters } from "../src/calibration.js";
import { basalEquilibrium, equilibriumGlucose, initialState } from "../src/model.js";
import { basalRateToMUPerMin } from "../src/units.js";
import { simulate } from "../src/simulate.js";
import { exerciseBlock, type SimEvent } from "../src/events.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { loadSubject, loadTherapy, subjectParams, oracleAvailable } from "./fixtures.js";

const run = oracleAvailable() ? describe : describe.skip;

/** 1 U ohne Essen im Gleichgewicht: wann faellt der Wert am schnellsten, wann ist der Tiefpunkt. */
const bolusProfile = (n: number, calibrated: boolean) => {
  const p = calibrated ? nebelParameters(loadSubject(n)) : subjectParams(n);
  const th = loadTherapy(n);
  const G = simulate({
    durationMin: 600, stepMin: 1, parameters: p, therapy: th,
    pump: flatBasalProfile(th.basalRateUPerH), events: [{ kind: "bolus", t: 0, units: 1 }], sensor: DEFAULT_SENSOR,
  }).G;
  let nadir = 0; for (let i = 0; i < G.length; i++) if (G[i]! < G[nadir]!) nadir = i;
  let fastest = 0, rate = 0;
  for (let i = 10; i < G.length; i++) { const r = G[i - 10]! - G[i]!; if (r > rate) { rate = r; fastest = i - 5; } }
  return { nadirMin: nadir, fastestMin: fastest };
};

describe("Nebel-Kalibrierung", () => {
  it("setzt genau die dokumentierten Werte und laesst den Rest unberuehrt", () => {
    const src = { tsub: 15, tmaxI: 114, kb1: 1, ke: 0.138 } as never;
    const cal = applyNebelCalibration(src);
    expect(cal).toMatchObject({ ...NEBEL_CALIBRATION, kb1: 1, ke: 0.138 });
    expect(src).toMatchObject({ tsub: 15, tmaxI: 114 });   // Eingabe nicht veraendert
    expect(Object.keys(NEBEL_CALIBRATION).sort()).toEqual(["exGlucoseRef", "exInsulinGain", "tmaxI", "tsub"]);
  });
});

run("Nebel-Kalibrierung gegen die Quellsubjekte", () => {
  it("veraendert das Basalgleichgewicht nicht", () => {
    for (const n of [1, 7, 14]) {
      const u = basalRateToMUPerMin(loadTherapy(n).basalRateUPerH);
      const raw = equilibriumGlucose(subjectParams(n), u);
      const cal = equilibriumGlucose(nebelParameters(loadSubject(n)), u);
      expect(Math.abs(raw - cal)).toBeLessThan(1e-6);
    }
  });

  it("legt die Insulinwirkung in die Grenzen der Fachinformation (Maximum 1–3 h, Wirkdauer 3–5 h)", () => {
    for (const n of [1, 7, 14]) {
      const b = bolusProfile(n, true);
      expect(b.fastestMin).toBeGreaterThanOrEqual(45);
      expect(b.fastestMin).toBeLessThanOrEqual(180);
      expect(b.nadirMin).toBeGreaterThanOrEqual(180);
      expect(b.nadirMin).toBeLessThanOrEqual(300);
    }
  });

  it("Gegenprobe: mit den Quellwerten liegt der Tiefpunkt jenseits von fuenf Stunden", () => {
    expect(bolusProfile(1, false).nadirMin).toBeGreaterThan(300);
  });
});

run("Kalibrierung: Bewegung (p3/p4 je Koerper)", () => {
  const c = EXERCISE_CALIBRATION;
  const rows = Array.from({ length: 20 }, (_, i) => {
    const src = applyNebelCalibration(subjectParams(i + 1)), cal = nebelParameters(loadSubject(i + 1));
    return { src, cal, own: exerciseDrop(src, 1), drop: exerciseDrop(cal, 1) };
  });

  it("60 min bei 55 % HRR: jeder Koerper faellt um 25–47 %, Median gut ein Drittel", () => {
    for (const r of rows) {
      expect(r.drop).toBeGreaterThanOrEqual(c.floor - 1e-3);
      expect(r.drop).toBeLessThanOrEqual(c.floor + c.span + 1e-3);
    }
    const s = rows.map((r) => r.drop).sort((a, b) => a - b);
    expect((s[9]! + s[10]!) / 2).toBeGreaterThan(0.3);
    expect((s[9]! + s[10]!) / 2).toBeLessThan(0.4);
  });

  it("die Reihenfolge der Koerper bleibt im Wesentlichen (Rangkorrelation > 0,6)", () => {
    // Wo schon der Insulinweg allein mehr traegt als das Ziel, liegt ein Koerper darueber.
    const rank = (k: "own" | "drop") => { const o = [...rows.keys()].sort((a, b) => rows[a]![k] - rows[b]![k]); const r: number[] = []; o.forEach((idx, i) => { r[idx] = i; }); return r; };
    const a = rank("own"), b = rank("drop"), n = rows.length;
    const rho = 1 - 6 * a.reduce((s, x, i) => s + (x - b[i]!) ** 2, 0) / (n * (n * n - 1));
    expect(rho).toBeGreaterThan(0.6);
  });

  it("unterhalb der Schwelle: mehr Intensitaet, mehr Abfall", () => {
    for (const r of rows) expect(exerciseDrop(r.cal, 1, 0.35)).toBeLessThan(r.drop);
  });

  it("aendert nur p3 und p4, das Ruhegleichgewicht bleibt", () => {
    for (const r of rows) {
      const changed = Object.keys(r.cal).filter((k) => r.cal[k as keyof typeof r.cal] !== r.src[k as keyof typeof r.src]);
      expect(changed.sort()).toEqual(changed.length ? ["p3", "p4"] : []);
      expect(equilibriumGlucose(r.cal, 30)).toBeCloseTo(equilibriumGlucose(r.src, 30), 10);
    }
  });

  it("rechnet je Subjekt einmal", () => {
    const s = loadSubject(3);
    expect(nebelParameters(s)).toBe(nebelParameters(s));
  });
});

run("Bewegung: Aufnahme waechst mit der Glukose (Yardley 2013)", () => {
  it("45 min bei 60 % HRR aus 166 mg/dL: Median 55–75 mg/dL Abfall (Studie −61 mit halbem Basal)", () => {
    const d = Array.from({ length: 20 }, (_, i) => {
      const p = nebelParameters(loadSubject(i + 1)), b = basalEquilibrium(p, 9.2);
      return exerciseDrop(p, 1, 0.6, 45, b, initialState(p, b)) * 166;
    }).sort((a, b) => a - b);
    const m = (d[9]! + d[10]!) / 2;
    expect(m).toBeGreaterThan(55);
    expect(m).toBeLessThan(75);
  });

  it("aus hoeherem Wert faellt mehr, die Quelle faellt gleich viel", () => {
    const p = nebelParameters(loadSubject(9)), q = { ...p, exGlucoseRef: 0, exInsulinGain: 0 };   // 0 = aus, wie in der Quelle
    const at = (x: typeof p, g: number) => { const b = basalEquilibrium(x, g); return exerciseDrop(x, 1, 0.55, 45, b, initialState(x, b)) * g; };
    expect(at(p, 9.2) / at(p, 6)).toBeGreaterThan(1.3);
    expect(at(q, 9.2) / at(q, 6)).toBeLessThan(1.2);
  });
});

run("Bewegung × Insulin an Bord (Schiavon 2021, T1DEXI 2024)", () => {
  /* 45 min bei 60 % HRR, 60 min nach Start: nuechtern gegen 50 g mit vollem Bolus.
     Gezaehlt wird nur der Bewegungsanteil (Lauf mit minus Lauf ohne Bewegung). */
  const share = (n: number, meal: boolean) => {
    const p = nebelParameters(loadSubject(n)), th = loadTherapy(n);
    const run = (ex: boolean) => {
      const ev: SimEvent[] = meal
        ? [{ kind: "meal", t: 0, fastCarbsG: 20, slowCarbsG: 30 }, { kind: "bolus", t: 0, units: 50 / th.carbRatioGPerU }] : [];
      if (ex) ev.push(...exerciseBlock(60, 45, p.HRrest + 0.6 * (p.HRmax - p.HRrest), p.HRrest));
      return simulate({ durationMin: 110, stepMin: 1, parameters: p, therapy: th, pump: flatBasalProfile(th.basalRateUPerH),
        events: ev, sensor: DEFAULT_SENSOR, solver: "rk4" }).G;
    };
    const a = run(true), c = run(false);
    return ((a[59]! - a[104]!) - (c[59]! - c[104]!)) * 18;
  };
  it("mit Bolus an Bord senkt dieselbe Einheit im Median mindestens 40 % mehr (gerechnet 1,53)", () => {
    const r = [1, 4, 7, 9, 10, 13, 15, 18].map((n) => share(n, true) / share(n, false)).sort((a, b) => a - b);
    expect((r[3]! + r[4]!) / 2).toBeGreaterThan(1.4);
  });
});
