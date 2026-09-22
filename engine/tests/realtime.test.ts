/**
 * Echtzeit-Modus. Siehe docs/06_Echtzeit_Modus.md
 * Die Aequivalenztests sind rot, bis simulate.ts und realtime.ts gebaut sind.
 */
import { describe, it, expect } from "vitest";
import { createState, serializeState, deserializeState, set, get, STATE_COUNT } from "../src/state.js";
import { initialState } from "../src/model.js";
import { withPopulationConstants } from "../src/parameters.js";
import { basalRateToMUPerMin } from "../src/units.js";
import { simMinuteAt, appendEvent, forkForSandbox, advanceTo, type RealtimeSession } from "../src/realtime.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import type { SimEvent } from "../src/events.js";
import { loadSubject, loadTherapy } from "./fixtures.js";

const ANCHOR = Date.UTC(2026, 8, 22, 6, 0, 0);
const startState = () =>
  initialState(withPopulationConstants(loadSubject(1)), basalRateToMUPerMin(loadTherapy(1).basalRateUPerH));

const session = (): RealtimeSession => ({
  v: 1,
  anchorEpochMs: ANCHOR,
  subjectId: "Patient_1",
  subject: loadSubject(1),
  therapy: loadTherapy(1),
  seed: 1,
  state: serializeState(startState()),
  lastIntegratedMin: 0,
  events: [],
  pump: flatBasalProfile(loadTherapy(1).basalRateUPerH),
  sensor: DEFAULT_SENSOR,
});

describe("Serialisierung", () => {
  it("ist verlustfrei", () => {
    const s = createState();
    set(s, "Q1", 66.123456789); set(s, "I", 12.5);
    const back = deserializeState(serializeState(s));
    expect(get(back, "Q1")).toBe(66.123456789);
    expect(back.length).toBe(STATE_COUNT);
  });

  it("weist fremde Versionen und falsche Laengen zurueck", () => {
    expect(() => deserializeState({ v: 2 as 1, s: [] })).toThrow();
    expect(() => deserializeState({ v: 1, s: [1, 2, 3] })).toThrow(RangeError);
  });
});

describe("Zeitankerung", () => {
  it("rechnet Wall-Clock in Simulationsminuten um", () => {
    expect(simMinuteAt(session(), ANCHOR)).toBe(0);
    expect(simMinuteAt(session(), ANCHOR + 90 * 60000)).toBe(90);
  });

  it("liefert bei rueckwaerts laufender Uhr nie negative Minuten", () => {
    expect(simMinuteAt(session(), ANCHOR - 3600_000)).toBe(0);
  });
});

describe("Append-only", () => {
  it("nimmt Ereignisse in der Zukunft an", () => {
    const s = session();
    const bolus: SimEvent = { kind: "bolus", t: 30, units: 2 };
    expect(appendEvent(s, bolus, ANCHOR + 10 * 60000).events).toHaveLength(1);
  });

  it("weist rueckwirkende Ereignisse zurueck", () => {
    const s = { ...session(), lastIntegratedMin: 120 };
    expect(() => appendEvent(s, { kind: "bolus", t: 60, units: 2 }, ANCHOR + 120 * 60000))
      .toThrow(/Rueckwirkend/);
  });

  it("die Sandbox-Kopie teilt keinen Zustand mit dem Echtzeitlauf", () => {
    const s = session();
    const fork = forkForSandbox(s);
    fork.events.push({ kind: "bolus", t: 10, units: 1 });
    const originalQ1 = s.state.s[6]!;
    fork.state.s[6] = 999;
    expect(s.events).toHaveLength(0);
    expect(s.state.s[6]).toBe(originalQ1);
  });
});

describe("Nachholintegration", () => {
  it("ein Stueck und viele Stuecke ergeben dasselbe", () => {
    const events: SimEvent[] = [{ kind: "meal", t: 60, fastCarbsG: 40, slowCarbsG: 20 }];
    const whole = advanceTo({ ...session(), events }, ANCHOR + 1440 * 60000);

    let s = { ...session(), events };
    const chunks: number[] = [];
    for (const min of [30, 75, 200, 600, 1000, 1440]) {
      const step = advanceTo(s, ANCHOR + min * 60000);
      s = step.session;
      chunks.push(...step.G);
    }
    expect(chunks).toEqual(whole.G);
  });

  it("speichern, laden, weiterrechnen aendert nichts", () => {
    const a = advanceTo(session(), ANCHOR + 300 * 60000);
    const roundtrip: RealtimeSession = JSON.parse(JSON.stringify(a.session));
    const b = advanceTo(roundtrip, ANCHOR + 600 * 60000);
    const c = advanceTo(a.session, ANCHOR + 600 * 60000);
    expect(b.G).toEqual(c.G);
  });

  it("schreibt die letzte integrierte Minute fort", () => {
    const r = advanceTo(session(), ANCHOR + 45 * 60000);
    expect(r.session.lastIntegratedMin).toBeCloseTo(45, 6);
  });
});
