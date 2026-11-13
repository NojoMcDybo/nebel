// Vorausberechnete Alarme (src/alarm-plan.js): die Kopie muss genau das rechnen,
// was der echte Lauf ohne weitere Eingaben spaeter anzeigt.
import { beforeAll, describe, expect, it } from "vitest";
import { loadParts } from "../scripts/core.mjs";

let C;
beforeAll(async () => { C = (await loadParts()).core; });

/* Dieselbe Regel, aber am echten Lauf mitgeschrieben. */
const live = (e, horizon) => {
  const side = (v) => v < C.TRAIN_LOW ? "low" : v > C.TRAIN_HIGH ? "high" : null;
  const end = e.s.t + horizon, out = [];
  let s = side(e.lastSensor), last = e.s.t;
  while (e.s.t < end) {
    e.step();
    if (e.s.t % 5) continue;
    const v = e.lastSensor, sd = side(v);
    if (sd && (sd !== s || e.s.t - last >= 30)) { out.push({ t: e.s.t, kind: sd, v }); last = e.s.t; }
    s = sd;
  }
  return out;
};

const start = () => { const e = new C.BeltEngine(11, 0); for (let i = 0; i < 30; i++) e.step(); return e; };

describe("planAlarms", () => {
  it("viel Essen ohne Insulin: Hochalarm, genau wie spaeter im echten Lauf", () => {
    const e = start();
    e.logMeal(150, "fast", 5);
    const plan = JSON.parse(JSON.stringify(C.planAlarms(e, 360)));
    expect(plan.some((a) => a.kind === "high")).toBe(true);
    expect(live(e, 360)).toEqual(plan);
  });

  it("zu viel Insulin: Tiefalarm, genau wie spaeter im echten Lauf", () => {
    const e = start();
    e.injectBolus(12);
    const plan = JSON.parse(JSON.stringify(C.planAlarms(e, 360)));
    expect(plan.some((a) => a.kind === "low")).toBe(true);
    expect(live(e, 360)).toEqual(plan);
  });

  it("bleibt der Wert draussen, wiederholt sich der Alarm hoechstens alle 30 Minuten", () => {
    const e = start();
    e.injectBolus(12);
    const lows = C.planAlarms(e, 600).filter((a) => a.kind === "low");
    expect(lows.length).toBeGreaterThan(1);
    for (let i = 1; i < lows.length; i++) expect(lows[i].t - lows[i - 1].t).toBeGreaterThanOrEqual(30);
  });

  it("die Planung veraendert den echten Lauf nicht", () => {
    const a = start(), b = start();
    C.planAlarms(a, 720);
    for (let i = 0; i < 120; i++) { a.step(); b.step(); }
    expect(a.s.G).toBe(b.s.G);
    expect(a.lastSensor).toBe(b.lastSensor);
  });
});
