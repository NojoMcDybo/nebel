// Nachtragen (src/rewind.js): Zurueckspringen und Neurechnen muss genau den Lauf
// ergeben, der mit durchgehendem Gurt entstanden waere.
import { beforeAll, describe, expect, it } from "vitest";
import { loadParts } from "../scripts/core.mjs";

let C;
beforeAll(async () => { C = (await loadParts()).core; });

const make = () => new C.BeltEngine(11, 0);
const view = (e) => JSON.parse(JSON.stringify({ s: e.s, sensor: e.lastSensor, tick: e.rng.state(),
  trace: e.trace.map((p) => [p.t, p.G, p.sensor]), input: e.input }));

describe("rewind", () => {
  it("Zustand als JSON sichern und laden laeuft identisch weiter", () => {
    const a = make();
    for (let i = 0; i < 300; i++) a.step();
    const dump = C.dumpEngine(a), b = make();
    C.loadEngine(b, dump);
    b.trace = a.trace.slice();
    for (let i = 0; i < 300; i++) { a.step(); b.step(); }
    expect(view(b)).toEqual(view(a));
  });

  it("Luecke aus Health fuellen ergibt denselben Lauf wie mit durchgehendem Gurt", () => {
    const G = 600, END = 900;          // Luecke 600..660, Mahlzeit in der Luecke, Schlaf danach
    const run = (gapped) => {
      const e = make();
      let gap = null;
      const j = C.journalInputs(e, () => gap, () => {});
      while (e.s.t < END) {
        const t = e.s.t;
        if (t >= G - 20 && t < G) e.beltBpm(95);                 // Gurt vor der Luecke
        if (gapped && t === G) gap = C.openGap(e, 0);
        if (t >= G && t < G + 60 && !gapped) e.beltBpm(150);     // Basketball
        if (t === G + 30) e.logMeal(30, "fast", 10);
        if (t === G + 120) e.setAsleep(true);
        e.step();
      }
      return { e, gap, j };
    };
    const ref = run(false).e;
    const { e, gap, j } = run(true);
    expect(view(e)).not.toEqual(view(ref));                       // ohne Nachtrag fehlt das Training

    const samples = [];
    for (let t = G; t < G + 60; t++) samples.push({ t: t + 0.2, bpm: 148 }, { t: t + 0.7, bpm: 152 });
    const r = C.fillGap(e, gap, samples, j);
    expect(r).toMatchObject({ minutes: 60, first: G, last: G + 59 });
    const got = view(e), want = view(ref);
    expect(got.s).toEqual(want.s);
    expect(got.sensor).toBe(want.sensor);
    expect(got.trace).toEqual(want.trace);
    expect(e.events.some((x) => x.name.startsWith("Puls aus Apple Health"))).toBe(true);
  });

  it("ohne Werte in der Luecke bleibt alles, wie es ist", () => {
    const e = make();
    let gap = null;
    const j = C.journalInputs(e, () => gap, () => {});
    for (let i = 0; i < 100; i++) e.step();
    gap = C.openGap(e, 0);
    for (let i = 0; i < 50; i++) e.step();
    const before = view(e);
    expect(C.fillGap(e, gap, [{ t: 10, bpm: 140 }], j)).toBeNull();
    expect(view(e)).toEqual(before);
  });
});
