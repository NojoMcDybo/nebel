import { describe, it, expect } from "vitest";
import {
  HR_KINETICS, HR_KINETICS_REST, hrKineticsStep, hrrFromKinetics, steadyHrr, powerForHrr,
  kineticHeartRateTrace, kineticExerciseBlock,
} from "../src/heartRateKinetics.js";
import { validateEvents } from "../src/events.js";
import type { Parameters } from "../src/parameters.js";

const p = { HRrest: 60, HRmax: 190, VT_HRR: 0.8 } as Parameters;
const hrr = (bpm: number) => (bpm - p.HRrest) / (p.HRmax - p.HRrest);

describe("Herzfrequenz-Kinetik (Svendby 2016)", () => {
  it("Ruhe bleibt exakt Ruhe", () => {
    let s = HR_KINETICS_REST;
    for (let i = 0; i < 600; i++) s = hrKineticsStep(s, 0, p.VT_HRR);
    expect(hrrFromKinetics(HR_KINETICS_REST)).toBe(0);
    expect(hrrFromKinetics(s)).toBeLessThan(1e-9);
    expect(s[1]).toBeCloseTo(HR_KINETICS.G0, 9);
  });

  it("an der Schwelle steht G bei GT still (tau_p aus Gl. 10.18; Ruhe bei G0 prueft Gl. 10.17)", () => {
    let s: [number, number, number] = [0, HR_KINETICS.GT, 2 * 0.8 * (1 - 1e-12)];
    const pT = 0.8, G0 = s[1];
    for (let i = 0; i < 30; i++) s = [...hrKineticsStep(s, pT, pT)] as [number, number, number];
    expect(s[1]).toBeCloseTo(G0, 6);
  });

  it("unterhalb der Schwelle annaehernd linear in der Leistung (Kap. 10.8)", () => {
    for (const x of [0.2, 0.4, 0.6]) expect(Math.abs(steadyHrr(x, 0.8) - x)).toBeLessThan(0.06);
  });

  it("powerForHrr kehrt das Gleichgewicht um und ist monoton", () => {
    let prev = -1;
    for (const f of [0.1, 0.3, 0.55, 0.7, 0.9]) {
      const pw = powerForHrr(f, p.VT_HRR);
      expect(pw).toBeGreaterThan(prev); prev = pw;
      if (pw < p.VT_HRR) expect(steadyHrr(pw, p.VT_HRR)).toBeCloseTo(f, 6);
    }
  });

  it("Einheit unterhalb der Schwelle: Anstieg in Minuten, Ziel erreicht, Erholung in unter einer Stunde", () => {
    const tr = kineticHeartRateTrace(0, Array(60).fill(0.55), p);
    expect(tr[0]!.bpm).toBe(p.HRrest);
    expect(hrr(tr[5]!.bpm)).toBeGreaterThan(0.45);
    expect(Math.abs(hrr(tr[59]!.bpm) - 0.55)).toBeLessThan(0.02);
    expect(hrr(tr[70]!.bpm)).toBeLessThan(0.1);
    expect(tr.length).toBeLessThan(60 + 60);
    expect(tr[tr.length - 1]!.bpm).toBe(p.HRrest);
    tr.forEach((q, i) => expect(q.t).toBe(i));
  });

  it("oberhalb der Schwelle kein Gleichgewicht: die Herzfrequenz driftet nach oben", () => {
    const tr = kineticHeartRateTrace(0, Array(30).fill(0.9), p);
    expect(tr[29]!.bpm).toBeGreaterThan(tr[10]!.bpm + 3);
    expect(tr[29]!.bpm).toBeLessThanOrEqual(p.HRmax);
    // nach harter Belastung bleibt sie laenger erhoeht als nach moderater
    const mod = kineticHeartRateTrace(0, Array(30).fill(0.55), p);
    expect(hrr(tr[45]!.bpm)).toBeGreaterThan(hrr(mod[45]!.bpm));
  });

  it("Fortsetzen aus dem Zwischenzustand ist bitgleich mit dem Durchlauf", () => {
    const full = kineticHeartRateTrace(0, [...Array(20).fill(0.5), ...Array(20).fill(0.8)], p);
    const head = kineticHeartRateTrace(0, Array(20).fill(0.5), p);
    const tail = kineticHeartRateTrace(20, Array(20).fill(0.8), p, head[20]!.hk);
    for (let i = 0; i < tail.length - 1; i++) expect(tail[i]!.bpm).toBe(full[20 + i]!.bpm);
  });

  it("kineticExerciseBlock liefert gueltige Ereignisse", () => {
    const ev = kineticExerciseBlock(100, 45, 0.55, p);
    expect(() => validateEvents(ev)).not.toThrow();
    expect(ev[0]).toEqual({ kind: "heartRate", t: 100, bpm: p.HRrest });
  });
});
