/**
 * Validierungsstufe 0: numerischer Abgleich gegen py-mgipsim.
 * Nur Vergleich, kein Codeport. Laeuft nur mit lokalem Klon unter vendor/.
 */
import { describe, it, expect } from "vitest";
import { oracleAvailable, loadSubject, ORACLE_HINT } from "./fixtures.js";

describe("Referenzdatensatz", () => {
  it("ist vorhanden", () => {
    expect(oracleAvailable(), ORACLE_HINT).toBe(true);
  });

  it.runIf(oracleAvailable())("liefert vollstaendige Subjektparameter", () => {
    const s = loadSubject(1);
    expect(s.VG).toBeGreaterThan(5);
    expect(s.HRmax).toBeGreaterThan(s.HRrest);
    expect(s.VT_HRR).toBeGreaterThan(0);
    expect(s.VT_HRR).toBeLessThan(1);
  });

  // Der eigentliche Abgleich liegt in oracle.numeric.test.ts (Validierungsstufe 0).
});
