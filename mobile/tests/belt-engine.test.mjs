// BeltEngine (src/belt-engine.js) gegen die echte Engine und den Adapter.
// Braucht engine/dist/site (npm run oracle:fetch und npm run viewer in engine/).
import { beforeAll, describe, expect, it } from "vitest";
import { loadParts } from "../scripts/core.mjs";

let ctx, BeltEngine, Engine;
beforeAll(async () => {
  const parts = await loadParts();
  ctx = parts.ctx; ({ BeltEngine, Engine } = parts.core);
});

const make = (seed = 7) => new BeltEngine(seed, 0);
const hr = (e, t = e.s.t) => ctx.Nebel.heartRateAt(t, e.input, e.p.HRrest);
/** Ein Zustand wie in app.html: speichern und in ein frisches Objekt laden. */
const reload = (e) => {
  const d = JSON.parse(JSON.stringify({ s: e.s, rng: e.rng.state(), core: e.snapshot(), events: e.events, acts: e.acts }));
  const n = make(e.seed);
  Object.assign(n.s, d.s); n.rng.setState(d.rng); n.restore(d.core);
  n.events = d.events; n.acts = d.acts;
  return n;
};

describe("BeltEngine", () => {
  it("ein Gurtwert wird zum Herzfrequenzereignis ab jetzt, die Nachwirkung folgt", () => {
    const e = make();
    for (let i = 0; i < 40; i++) { e.beltBpm(150); e.step(); }
    expect(hr(e)).toBe(150);
    expect(e.input.filter((x) => x.kind === "heartRate").length).toBeGreaterThan(30);
    expect(e.s.Z).toBeGreaterThan(0.03);
    const ohne = make();
    for (let i = 0; i < 40; i++) ohne.step();
    expect(ohne.s.Z).toBeLessThan(0.03);
  });

  it("ohne Wert faellt die Spur nach der Karenzzeit auf Ruhe zurueck, die Bewegung ist wieder simuliert", () => {
    const e = make();
    for (let i = 0; i < 5; i++) { e.beltBpm(140); e.step(); }
    expect(e.beltT).not.toBeNull();
    for (let i = 0; i < 2; i++) e.step();
    expect(e.beltT).not.toBeNull();             // noch in der Karenzzeit, der letzte Wert gilt
    expect(hr(e)).toBe(140);
    for (let i = 0; i < 3; i++) e.step();
    expect(e.beltT).toBeNull();
    expect(hr(e)).toBe(e.p.HRrest);
    expect(e.events.some((x) => x.kind === "state" && /Kein Puls vom Gurt/.test(x.name))).toBe(true);
  });

  it("Nachrechnen nach einer Pause ist bitgleich zum durchgehenden Lauf", () => {
    const lauf = (e, from, to) => { for (let i = from; i < to; i++) { if (i >= 60 && i < 66) e.beltBpm(120 + i); e.step(); } };
    const a = make(); lauf(a, 0, 400);
    const b = make(); lauf(b, 0, 63);                // mitten im Gurtbetrieb unterbrechen
    const c = reload(b); lauf(c, 63, 400);
    expect(c.s.G).toBe(a.s.G);
    expect(c.beltT).toBe(a.beltT);
    expect(c.input).toEqual(a.input);
  });

  it("solange der Gurt gilt, beginnt keine Bewegung aus dem Plan", () => {
    const ohne = new Engine(7, 0);
    for (let i = 0; i < 1440; i++) ohne.step();
    expect(ohne.events.some((x) => x.kind === "move")).toBe(true);
    const e = make();
    for (let i = 0; i < 1440; i++) { e.beltBpm(65); e.step(); }
    expect(e.events.some((x) => x.kind === "move")).toBe(false);
  });
});
