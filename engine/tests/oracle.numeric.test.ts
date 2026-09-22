/**
 * Validierungsstufe 0: numerischer Abgleich gegen py-mgipsim.
 *
 * Vergleicht ausschliesslich Zahlen. Kein Code aus dem Orakel wird verwendet,
 * die Referenzwerte liegen unter vendor/ und sind gitignored.
 */
import { describe, it, expect } from "vitest";
import { derivatives, type ModelInputs } from "../src/model.js";
import { eulerStep } from "../src/solver.js";
import { STATE_NAMES, type StateVector } from "../src/state.js";
import {
  loadReference, referenceAvailable, REFERENCE_HINT, subjectParams, subjectNumber,
} from "./fixtures.js";

const available = referenceAvailable();

/** Relativer Fehler, robust bei Werten nahe null. */
const relError = (a: number, b: number): number =>
  Math.abs(a - b) / Math.max(1, Math.abs(b));

describe("Orakelabgleich", () => {
  it("Referenzwerte sind vorhanden", () => {
    expect(available, REFERENCE_HINT).toBe(true);
  });

  it.runIf(available)("Ableitungen stimmen zustandsweise ueberein", () => {
    const ref = loadReference();
    let worst = { rel: 0, state: "", subject: "" };

    for (const [key, data] of Object.entries(ref.subjects)) {
      const p = subjectParams(subjectNumber(key));
      for (const c of data.derivativeCases) {
        const u: ModelInputs = c.inputs;
        const ours = derivatives(Float64Array.from(c.state), 0, p, u);
        for (let i = 0; i < ours.length; i++) {
          const rel = relError(ours[i]!, c.d[i]!);
          if (rel > worst.rel) worst = { rel, state: STATE_NAMES[i]!, subject: key };
        }
      }
    }
    expect(
      worst.rel,
      `groesste Abweichung bei ${worst.subject}/${worst.state}`,
    ).toBeLessThan(1e-12);
  });

  it.runIf(available)("24-h-Trajektorie stimmt ueberein", () => {
    const ref = loadReference();

    for (const [key, data] of Object.entries(ref.subjects)) {
      const p = subjectParams(subjectNumber(key));
      const tr = data.trajectory;
      let s: StateVector = Float64Array.from(tr.startState);
      let worst = 0;

      for (let t = 0; t < tr.G.length; t++) {
        const u: ModelInputs = {
          uFastCarbs: t === 480 ? tr.mealMmol : 0,
          uSlowCarbs: 0,
          uHR: t >= 1020 && t < 1080 ? tr.hrExercise : p.HRrest,
          uInsulin: tr.basalMUPerMin + (t === 480 ? tr.bolusMU : 0),
        };
        s = eulerStep(derivatives, s, t, 1, p, u);
        const ourG = s[6]! / p.VG;
        worst = Math.max(worst, Math.abs(ourG - tr.G[t]!));
      }
      expect(worst, `${key}: groesste Abweichung der Glukose`).toBeLessThan(1e-9);
    }
  });

  it.runIf(available)("die Trajektorie ist physiologisch nicht trivial", () => {
    const ref = loadReference();
    for (const [key, data] of Object.entries(ref.subjects)) {
      const g = data.trajectory.G;
      expect(Math.max(...g) - Math.min(...g), `${key} ist zu flach`).toBeGreaterThan(2);
    }
  });

  it.runIf(available)("der Vergleich ist scharf: ein verstimmter Parameter faellt auf", () => {
    // Gegenprobe. Ohne sie koennte der Abgleich aus einem trivialen Grund gruen sein.
    const ref = loadReference();
    const key = Object.keys(ref.subjects)[0]!;
    const data = ref.subjects[key]!;
    const p = subjectParams(subjectNumber(key));
    const detuned = { ...p, k12: p.k12 * 1.01 };

    let worst = 0;
    for (const c of data.derivativeCases) {
      const ours = derivatives(Float64Array.from(c.state), 0, detuned, c.inputs);
      for (let i = 0; i < ours.length; i++) worst = Math.max(worst, relError(ours[i]!, c.d[i]!));
    }
    expect(worst).toBeGreaterThan(1e-3);
  });
});
