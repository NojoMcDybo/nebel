import { describe, it, expect } from "vitest";
import {
  NUTRITION, MEAL_DELIVERY_MIN, carbDeliveredShare, erlang3Cdf, fatBell, mealInputsAt, carbsInStomachG,
} from "../src/nutrition.js";
import { validateEvents, type SimEvent } from "../src/events.js";
import { gCarbsToMmol } from "../src/units.js";
import { derivatives } from "../src/model.js";
import { createState } from "../src/state.js";
import { nebelParameters } from "../src/calibration.js";
import {
  wolpertInsulinRatio, patersonProteinExcess, smartCrossCheck, oConnellFatExcess,
} from "../src/scenario/nutrition-check.js";
import { loadSubject, loadTherapy, oracleAvailable } from "./fixtures.js";

const meal = (extra: Partial<Extract<SimEvent, { kind: "meal" }>> = {}): SimEvent =>
  ({ kind: "meal", t: 100, fastCarbsG: 20, slowCarbsG: 40, ...extra });

/** Summe einer Eingabe ueber viele Minuten [mmol]. */
const total = (ev: SimEvent[], key: "uFastCarbs" | "uSlowCarbs" | "uProteinGlucose", to = 4000) => {
  let s = 0;
  for (let t = 0; t < to; t++) s += mealInputsAt(t, 1, ev)[key];
  return s;
};

describe("Fett und Eiweiss: Neutralitaet", () => {
  it("ohne Fett, Eiweiss und Essdauer liefert eine Mahlzeit alles in einer Minute", () => {
    const ev = [meal()];
    expect(mealInputsAt(99, 1, ev)).toEqual({ uFastCarbs: 0, uSlowCarbs: 0, uProteinGlucose: 0, siFactor: 1 });
    const m = mealInputsAt(100, 1, ev);
    expect(m.uFastCarbs).toBeCloseTo(gCarbsToMmol(20), 12);
    expect(m.uSlowCarbs).toBeCloseTo(gCarbsToMmol(40), 12);
    expect(m.siFactor).toBe(1);
    expect(mealInputsAt(101, 1, ev).uFastCarbs).toBe(0);
    expect(MEAL_DELIVERY_MIN).toBe(1);
  });

  it("verteilt bei groesserem Schritt anteilig wie bisher", () => {
    const m = mealInputsAt(98, 5, [meal()]);
    expect(m.uFastCarbs).toBeCloseTo(gCarbsToMmol(20) / 5, 12);
  });

  it("aendert die Ableitungen nicht, solange die Zusatzeingaben fehlen oder neutral sind", () => {
    const p = nebelParameters({
      kb1: 0.0034, kb2: 0.056, kb3: 0.024, EGP0: 0.0161, F01: 0.0097, tmaxI: 55, p3: 0, p4: 0, p5: 0,
      BW: 70, HRrest: 60, HRmax: 190, VG: 0.16, VI: 0.12, VT_HRR: 0.6,
    } as never);
    const s = createState();
    s[6] = 6 * p.VG; s[8] = 6; s[2] = 10;
    const base = { uFastCarbs: 0.1, uSlowCarbs: 0.2, uHR: 60, uInsulin: 15 };
    expect(derivatives(s, 0, p, { ...base, uProteinGlucose: 0, siFactor: 1 })).toEqual(derivatives(s, 0, p, base));
  });

  it("lehnt negatives Fett, Eiweiss und ungueltige Essdauer ab", () => {
    expect(() => validateEvents([meal({ fatG: -1 })])).toThrow();
    expect(() => validateEvents([meal({ proteinG: -1 })])).toThrow();
    expect(() => validateEvents([meal({ durationMin: Number.NaN })])).toThrow();
    expect(() => validateEvents([meal({ fatG: 30, proteinG: 20, durationMin: 20 })])).not.toThrow();
  });
});

describe("Fett und Eiweiss: Mengen und Zeitverlauf", () => {
  it("Verteilungsfunktionen laufen von 0 nach 1 und sind monoton", () => {
    for (const [eat, delay] of [[1, 0], [20, 0], [1, 40], [30, 60]] as const) {
      let prev = 0;
      for (let s = 0; s <= 2000; s += 7) {
        const v = carbDeliveredShare(s, eat, delay);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = v;
      }
      expect(carbDeliveredShare(0, eat, delay)).toBe(0);
      expect(carbDeliveredShare(5000, eat, delay)).toBeCloseTo(1, 9);
    }
    expect(erlang3Cdf(0, 90)).toBe(0);
    expect(erlang3Cdf(1e5, 90)).toBeCloseTo(1, 12);
  });

  it("Fett und Essdauer verschieben die Kohlenhydrate, verlieren aber nichts", () => {
    const ev = [meal({ fatG: 60, proteinG: 40, durationMin: 25 })];
    expect(total(ev, "uFastCarbs")).toBeCloseTo(gCarbsToMmol(20), 6);
    expect(total(ev, "uSlowCarbs")).toBeCloseTo(gCarbsToMmol(40), 6);
    // in der ersten Viertelstunde kommt mit Fett weniger an als ohne
    const early = (e: SimEvent[]) => { let s = 0; for (let t = 100; t < 115; t++) s += mealInputsAt(t, 1, e).uFastCarbs; return s; };
    expect(early(ev)).toBeLessThan(0.5 * early([meal({ durationMin: 25 })]));
  });

  it("Eiweiss liefert genau Ausbeute mal Menge, mit Gipfel der Rate nach 2·tau", () => {
    const ev = [meal({ fastCarbsG: 0, slowCarbsG: 0, proteinG: 50 })];
    expect(total(ev, "uProteinGlucose")).toBeCloseTo(gCarbsToMmol(50 * NUTRITION.proteinGlucoseYield), 5);
    let peak = 0, tPeak = 0;
    for (let t = 100; t < 1000; t++) { const r = mealInputsAt(t, 1, ev).uProteinGlucose; if (r > peak) { peak = r; tPeak = t - 100; } }
    expect(tPeak).toBeGreaterThan(2 * NUTRITION.proteinTauMin - 3);
    expect(tPeak).toBeLessThan(2 * NUTRITION.proteinTauMin + 3);
  });

  it("Fett unter der Schwelle laesst das Insulin in Ruhe, darueber mit Gipfel nach 3·tau", () => {
    const at = (fatG: number, s: number) => mealInputsAt(100 + s, 1, [meal({ fatG })]).siFactor;
    expect(at(NUTRITION.fatResistanceThresholdG, 330)).toBe(1);
    const peak = 3 * NUTRITION.fatResistanceTauMin;
    const expected = 1 / (1 + NUTRITION.fatResistancePerG * (60 - NUTRITION.fatResistanceThresholdG));
    expect(at(60, peak - 0.5)).toBeCloseTo(expected, 3);
    expect(at(60, 60)).toBeGreaterThan(at(60, peak));
    expect(at(60, 1440)).toBeGreaterThan(0.99);
    expect(fatBell(3 * 110, 110)).toBeCloseTo(1, 12);
  });

  it("zaehlt Kohlenhydrate im Magen, solange Fett sie zurueckhaelt", () => {
    const ev = [meal({ fatG: 60, durationMin: 10 })];
    expect(carbsInStomachG(99, ev)).toBe(0);
    expect(carbsInStomachG(130, ev)).toBeGreaterThan(20);
    expect(carbsInStomachG(130, ev)).toBeGreaterThan(carbsInStomachG(200, ev));
    expect(carbsInStomachG(2000, ev)).toBeLessThan(1e-3);
    expect(carbsInStomachG(101, [meal()])).toBe(0);
  });
});

const run = oracleAvailable() ? describe : describe.skip;
const ALL = oracleAvailable()
  ? Array.from({ length: 20 }, (_, i) => ({ p: nebelParameters(loadSubject(i + 1)), th: loadTherapy(i + 1) }))
  : [];
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

run("Fett und Eiweiss: Kalibrierung gegen Studien (Mittel der 20 Subjekte)", () => {
  it("Paterson 2016: 75 g und 100 g Eiweiss liegen in allen vier Konfidenzintervallen", () => {
    const ci: Record<number, [[number, number], [number, number]]> = {
      75: [[0.01, 1.41], [0.93, 2.36]],
      100: [[0.40, 1.73], [1.04, 2.41]],
    };
    for (const g of [75, 100]) {
      const r = ALL.map((S) => patersonProteinExcess(S.p, S.th, g));
      const a = avg(r.map((x) => x.w180to240)), b = avg(r.map((x) => x.w240to300));
      expect(a).toBeGreaterThan(ci[g]![0][0]); expect(a).toBeLessThan(ci[g]![0][1]);
      expect(b).toBeGreaterThan(ci[g]![1][0]); expect(b).toBeLessThan(ci[g]![1][1]);
    }
  });

  it("Wolpert 2013: +50 g Fett verlangen im Mittel rund 42 % mehr Insulin", () => {
    const m = avg(ALL.map((S) => wolpertInsulinRatio(S.p, S.th)));
    expect(m).toBeGreaterThan(1.37);
    expect(m).toBeLessThan(1.47);
  }, 120_000);

  it("Smart 2013, Richtung: Fett daempft frueh, hebt spaet; Eiweiss hebt spaet; beides addiert sich", () => {
    for (const S of ALL.slice(0, 20)) {
      const s = smartCrossCheck(S.p, S.th);
      expect(s.fatFirst90).toBeLessThan(0);
      expect(s.fatAt5h).toBeGreaterThan(0);
      expect(s.proteinAt5h).toBeGreaterThan(0);
      expect(s.bothAt5h).toBeGreaterThan(Math.max(s.fatAt5h, s.proteinAt5h));
    }
  });

  it("O'Connell 2021, Richtung: mehr Fett, mehr spaeter Anstieg", () => {
    const S = ALL[9]!;
    const r = [13, 26, 39, 51].map((g) => oConnellFatExcess(S.p, S.th, g).w330to480);
    for (let i = 1; i < r.length; i++) expect(r[i]!).toBeGreaterThan(r[i - 1]!);
  });
});
