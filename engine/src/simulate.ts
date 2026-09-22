/**
 * Simulationsschleife. Events an exakten Zeitgrenzen, deterministisch.
 */

import { type StateVector } from "./state.js";
import type { Parameters, TherapySettings } from "./parameters.js";
import type { SimEvent } from "./events.js";
import { sortEvents, validateEvents } from "./events.js";
import { insulinInputAt, type PumpProgram } from "./pump.js";
import { sensorTrace, type SensorConfig } from "./observation.js";
import { derivatives, glucoseFrom, initialState, type ModelInputs } from "./model.js";
import { eulerStep, rk4Step } from "./solver.js";
import { gCarbsToMmol } from "./units.js";

export const MEAL_DELIVERY_MIN = 1;

export interface SimulationConfig {
  durationMin: number;
  stepMin: number;
  parameters: Parameters;
  therapy: TherapySettings;
  pump: PumpProgram;
  events: readonly SimEvent[];
  sensor: SensorConfig;
  solver?: "euler" | "rk4";
  /** Startzustand; fehlt er, wird das Basalgleichgewicht verwendet. */
  initial?: StateVector;
  /**
   * Absoluter Startzeitpunkt [min]. Wichtig fuer den Echtzeitbetrieb: Events
   * behalten ihre absolute Zeit, und das Basalprofil bleibt an der Tageszeit
   * ausgerichtet.
   */
  startTimeMin?: number;
}

export interface SimulationResult {
  t: number[];
  states: StateVector[];
  /** Physiologische Glukose [mmol/L]. Nie direkt anzeigen. */
  G: number[];
  /** Zeitpunkte der Sensorabtastung [min]. */
  tSensor: number[];
  /** Angezeigter Sensorwert [mmol/L]. */
  gSensor: number[];
}

/** Herzfrequenz zum Zeitpunkt t, linear zwischen den Stuetzstellen. */
export const heartRateAt = (
  t: number, events: readonly SimEvent[], restingBpm: number,
): number => {
  let prev: { t: number; bpm: number } | undefined;
  let next: { t: number; bpm: number } | undefined;
  for (const e of events) {
    if (e.kind !== "heartRate") continue;
    if (e.t <= t && (!prev || e.t >= prev.t)) prev = { t: e.t, bpm: e.bpm };
    if (e.t > t && (!next || e.t < next.t)) next = { t: e.t, bpm: e.bpm };
  }
  if (!prev) return restingBpm;
  if (!next) return prev.bpm;
  const span = next.t - prev.t;
  return span <= 0 ? next.bpm : prev.bpm + ((t - prev.t) / span) * (next.bpm - prev.bpm);
};

/** Kohlenhydratzufluss [mmol/min] im Intervall [t, t+dt). */
const carbInputAt = (
  t: number, dt: number, events: readonly SimEvent[],
): { fast: number; slow: number } => {
  let fast = 0, slow = 0;
  for (const e of events) {
    if (e.kind !== "meal") continue;
    const overlap = Math.min(t + dt, e.t + MEAL_DELIVERY_MIN) - Math.max(t, e.t);
    if (overlap <= 0) continue;
    const share = overlap / dt / MEAL_DELIVERY_MIN;
    fast += gCarbsToMmol(e.fastCarbsG) * share;
    slow += gCarbsToMmol(e.slowCarbsG) * share;
  }
  return { fast, slow };
};

export const simulate = (cfg: SimulationConfig): SimulationResult => {
  if (cfg.stepMin <= 0) throw new RangeError("simulate: stepMin muss > 0 sein");
  validateEvents(cfg.events);
  const events = sortEvents(cfg.events);
  const p = cfg.parameters;
  const step = cfg.solver === "rk4" ? rk4Step : eulerStep;
  const startTime = cfg.startTimeMin ?? 0;
  const startIndex = Math.round(startTime / cfg.stepMin);

  let s = cfg.initial ?? initialState(p, insulinInputAt(startTime, cfg.stepMin, cfg.pump, []));

  const steps = Math.round(cfg.durationMin / cfg.stepMin);
  const t: number[] = [];
  const states: StateVector[] = [];
  const G: number[] = [];
  const ig: number[] = [];

  for (let i = 0; i < steps; i++) {
    const now = startTime + i * cfg.stepMin;
    const carbs = carbInputAt(now, cfg.stepMin, events);
    const u: ModelInputs = {
      uFastCarbs: carbs.fast,
      uSlowCarbs: carbs.slow,
      uHR: heartRateAt(now, events, p.HRrest),
      uInsulin: insulinInputAt(now, cfg.stepMin, cfg.pump, events),
    };
    s = step(derivatives, s, now, cfg.stepMin, p, u);
    t.push(now + cfg.stepMin);
    states.push(s);
    G.push(glucoseFrom(s[6]!, p.VG));
    ig.push(s[8]!);
  }

  const sensor = sensorTrace(ig, cfg.stepMin, cfg.sensor, startIndex);
  return { t, states, G, tSensor: sensor.t, gSensor: sensor.gSensor };
};
