/**
 * Validierungsstufe 2: Subsystemtests.
 * Schlaegt fehl, bis src/model.ts implementiert ist. Beabsichtigt.
 */
import { describe, it, expect } from "vitest";
import { derivatives, initialState, equilibriumGlucose, basalEquilibrium, type ModelInputs } from "../src/model.js";
import { createState, get, set, STATE_COUNT } from "../src/state.js";
import { subjectParams, loadTherapy } from "./fixtures.js";
import { basalRateToMUPerMin } from "../src/units.js";

const quiet: ModelInputs = { uFastCarbs: 0, uSlowCarbs: 0, uHR: 60, uInsulin: 0 };

describe("Subsysteme", () => {
  it("liefert einen Ableitungsvektor der Laenge 16", () => {
    const p = subjectParams();
    const d = derivatives(createState(), 0, p, quiet);
    expect(d.length).toBe(STATE_COUNT);
  });

  it("Insulin: ein Bolus fuellt zuerst S1, nicht sofort das Plasma", () => {
    const p = subjectParams();
    const d = derivatives(createState(), 0, p, { ...quiet, uInsulin: 1000 });
    expect(d[0]!).toBeGreaterThan(0);  // dS1
    expect(d[2]!).toBe(0);             // dI, noch kein S2
  });

  it("Insulin: Plasmainsulin klingt ohne Zufuhr mit ke ab", () => {
    const p = subjectParams();
    const s = createState();
    set(s, "I", 10);
    const d = derivatives(s, 0, p, quiet);
    expect(d[2]!).toBeCloseTo(-p.ke * 10, 10);
  });

  it("Mahlzeit: Kohlenhydrate erscheinen verzoegert, nicht als Sprung", () => {
    const p = subjectParams();
    const withMeal = derivatives(createState(), 0, p, { ...quiet, uSlowCarbs: 5 });
    const without = derivatives(createState(), 0, p, quiet);
    expect(withMeal[9]!).toBeCloseTo(p.AG * 5, 10);   // fuellt das erste Kompartiment
    expect(withMeal[6]!).toBe(without[6]!);           // erreicht die Glukose noch nicht
  });

  it("Mahlzeit: schnelle KH laufen schneller ab als langsame", () => {
    expect(subjectParams().tmaxGFast).toBeLessThan(subjectParams().tmaxG);
  });

  it("Bewegung: unterhalb der ventilatorischen Schwelle bleibt EEhigh bei null", () => {
    const p = subjectParams();
    const hrModerate = p.HRrest + 0.4 * (p.HRmax - p.HRrest);
    const d = derivatives(createState(), 0, p, { ...quiet, uHR: hrModerate });
    expect(d[13]!).toBeGreaterThan(0); // dEEfast
    expect(d[14]!).toBe(0);            // dEEhigh
  });

  it("Bewegung: oberhalb der Schwelle laeuft der hochintensive Pfad an", () => {
    const p = subjectParams();
    const hrHard = p.HRrest + 0.95 * (p.HRmax - p.HRrest);
    const d = derivatives(createState(), 0, p, { ...quiet, uHR: hrHard });
    expect(d[14]!).toBeGreaterThan(0);
  });

  it("Bewegung: Herzfrequenz unter Ruhepuls erzeugt keinen Effekt", () => {
    const p = subjectParams();
    const d = derivatives(createState(), 0, p, { ...quiet, uHR: p.HRrest - 20 });
    expect(d[13]!).toBe(0);
  });

  it("Glukose: unter 4.5 mmol/L wird die ZNS-Aufnahme reduziert", () => {
    const p = subjectParams();
    // ohne Insulinwirkung besteht dQ1 nur aus EGP minus F01 minus FR
    const at = (G: number) => {
      const s = createState(); set(s, "Q1", G * p.VG);
      return derivatives(s, 0, p, quiet)[6]!;
    };
    expect(at(3.0)).toBeGreaterThan(at(6.0));                       // weniger Aufnahme im Hypobereich
    expect(at(6.0)).toBeCloseTo(at(8.0), 10);                       // dazwischen konstant
  });

  it("Glukose: ab 9 mmol/L greift die renale Elimination", () => {
    const p = subjectParams();
    const below = createState(); set(below, "Q1", 8.9 * p.VG);
    const above = createState(); set(above, "Q1", 15 * p.VG);
    expect(derivatives(above, 0, p, quiet)[6]!).toBeLessThan(
      derivatives(below, 0, p, quiet)[6]! + 1e-9,
    );
  });

  it("EGP wird nie negativ", () => {
    const p = subjectParams();
    const at = (x3: number) => {
      const s = createState(); set(s, "x3", x3); set(s, "Q1", 6 * p.VG);
      return derivatives(s, 0, p, quiet)[6]!;
    };
    expect(at(5)).toBe(at(100));                    // beide auf null geklemmt
    expect(at(0)).toBeGreaterThan(at(5));           // ohne Suppression produziert die Leber
  });

  it("Gleichgewicht: bei der publizierten Basalrate ist der Zustand stabil", () => {
    const p = subjectParams();
    const basal = basalRateToMUPerMin(loadTherapy().basalRateUPerH);
    const s = initialState(p, basal);
    const d = derivatives(s, 0, p, { ...quiet, uInsulin: basal });
    for (let i = 0; i < d.length; i++) expect(Math.abs(d[i]!)).toBeLessThan(1e-6);
    const G = get(s, "Q1") / p.VG;
    expect(G).toBeGreaterThan(3.9);
    expect(G).toBeLessThan(15);
  });

  it("Gleichgewicht: mehr Basal senkt die Gleichgewichtsglukose", () => {
    const p = subjectParams();
    expect(equilibriumGlucose(p, 30)).toBeLessThan(equilibriumGlucose(p, 15));
  });

  it("Gleichgewicht: Basal fuer eine Zielglukose ist konsistent", () => {
    const p = subjectParams();
    const u = basalEquilibrium(p, 6);
    expect(equilibriumGlucose(p, u)).toBeCloseTo(6, 3);
  });
});
