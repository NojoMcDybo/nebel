/**
 * Echtzeit-Betrieb. Siehe docs/06_Echtzeit_Modus.md
 *
 * Grundidee: Der Browser laeuft nicht durch. Gespeichert wird nur, was zur
 * exakten Rekonstruktion noetig ist — Anker, Seed, Zustand, Events, letzte
 * integrierte Minute. Beim Oeffnen wird bis jetzt nachgerechnet.
 */

import { deserializeState, serializeState, type SerializedState } from "./state.js";
import type { SimEvent } from "./events.js";
import type { SensorConfig } from "./observation.js";
import type { PumpProgram } from "./pump.js";
import { simulate } from "./simulate.js";
import { withPopulationConstants, type SubjectParameters, type TherapySettings } from "./parameters.js";

export interface RealtimeSession {
  v: 1;
  /** Wall-Clock-Zeitpunkt, der Simulationsminute 0 entspricht. */
  anchorEpochMs: number;
  /** Subjektkennung aus dem publizierten Datensatz. */
  subjectId: string;
  subject: SubjectParameters;
  therapy: TherapySettings;
  seed: number;
  /** Zustand zur Simulationsminute lastIntegratedMin. */
  state: SerializedState;
  lastIntegratedMin: number;
  /** Append-only. Vergangene Eintraege werden nie veraendert. */
  events: SimEvent[];
  pump: PumpProgram;
  sensor: SensorConfig;
}

/** Simulationsminute zu einem Wall-Clock-Zeitpunkt. Nie negativ. */
export const simMinuteAt = (session: RealtimeSession, nowEpochMs: number): number =>
  Math.max(0, (nowEpochMs - session.anchorEpochMs) / 60000);

/**
 * Traegt ein Ereignis ein. Nur Gegenwart oder Zukunft — ein rueckwirkender
 * Eintrag wuerde einen bereits angezeigten Verlauf veraendern.
 */
export const appendEvent = (
  session: RealtimeSession, event: SimEvent, nowEpochMs: number,
): RealtimeSession => {
  const now = simMinuteAt(session, nowEpochMs);
  if (event.t < session.lastIntegratedMin - 1e-9) {
    throw new Error(
      `Rueckwirkendes Ereignis bei t=${event.t}, bereits integriert bis ${session.lastIntegratedMin}. ` +
      `Fuer Was-waere-wenn die Sandbox auf einer Kopie verwenden.`,
    );
  }
  if (event.t < now - 1e-9) throw new Error("Ereignis liegt vor der aktuellen Uhrzeit");
  return { ...session, events: [...session.events, event] };
};

/**
 * Rechnet von lastIntegratedMin bis zur aktuellen Uhrzeit nach.
 *
 * Liefert genau die neu gerechneten Minuten, damit sich Teilstuecke
 * lueckenlos aneinanderreihen: ein Lauf am Stueck und derselbe Lauf in
 * beliebig vielen Haeppchen ergeben dieselbe Folge.
 */
export const advanceTo = (
  session: RealtimeSession, nowEpochMs: number,
): { session: RealtimeSession; G: number[]; gSensor: number[] } => {
  const target = simMinuteAt(session, nowEpochMs);
  const from = session.lastIntegratedMin;
  const minutes = Math.floor(target - from);
  if (minutes <= 0) return { session, G: [], gSensor: [] };

  const p = withPopulationConstants(session.subject);
  const initial = deserializeState(session.state);

  const run = simulate({
    durationMin: minutes,
    stepMin: 1,
    parameters: p,
    therapy: session.therapy,
    pump: session.pump,
    events: session.events,
    sensor: session.sensor,
    solver: "rk4",
    initial,
    startTimeMin: from,
  });

  const last = run.states[run.states.length - 1]!;
  return {
    session: {
      ...session,
      state: serializeState(last),
      lastIntegratedMin: from + minutes,
    },
    G: run.G,
    gSensor: run.gSensor,
  };
};

/** Kopie fuer die Sandbox. Der Echtzeitlauf bleibt unberuehrt. */
export const forkForSandbox = (session: RealtimeSession): RealtimeSession => ({
  ...session,
  events: [...session.events],
  state: { ...session.state, s: [...session.state.s] },
});
