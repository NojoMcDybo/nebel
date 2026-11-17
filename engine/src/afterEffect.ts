/**
 * Lange Nachwirkung von Bewegung auf die Insulinwirkung. Siehe
 * docs/20_Parameter_Registry.md Abschnitt 9.
 *
 * ExtHovorka fuehrt die Nachwirkung ueber EElong, und EElong klingt mit
 * 1/p7 = 10 min ab: eine halbe Stunde nach dem Training ist sie vorbei.
 * Gemessen haelt die erhoehte Insulinwirkung viele Stunden an, nach einem
 * Nachmittagstraining bis in die Nacht (DirecNet 2005, Taplin 2010).
 *
 * Nebel ergaenzt den langen Teil als Eingang, ohne neuen Zustand und ohne
 * die Quellgleichungen anzufassen. Die Herzfrequenzspur ergibt eine
 * abklingende Belastungssumme
 *
 *     L(t) = ∫ hrr(s) · e^(−(t−s)/τ) ds        [min]
 *
 * und der siFactor aller drei Insulinpfade wird mit 1 + k · L multipliziert —
 * dieselbe Form wie (1 + α·Z) · X bei Breton 2008. Der Abfall WAEHREND der
 * Bewegung bleibt bei p3, p4, p5 der Quelle.
 *
 * Ohne Herzfrequenzereignisse ist der Faktor exakt 1, der Orakelabgleich
 * bleibt unberuehrt.
 *
 * Nebel-Kalibrierung (Status N): Die Belege stammen von Kindern und
 * Jugendlichen, die Subjekte sind Erwachsene. Richtung und Groessenordnung,
 * keine Dosis.
 */

import type { SimEvent } from "./events.js";
import { heartRateReserve } from "./model.js";
import type { Parameters } from "./parameters.js";

export const AFTER_EFFECT = {
  /**
   * Abklingzeit [min]. Dalla Man, Breton, Cobelli 2009, Tabelle 1: T_ex = 600 min
   * fuer den „rapid-on/slow-off"-Effekt auf die Insulinsensitivitaet. Breton 2008
   * waehlte seine Werte so, dass der Unterschied nach 20 h noch signifikant und
   * nach 24 h fraglich ist.
   */
  tauMin: 600,
  /**
   * Mehrwirkung des Insulins je Belastungsminute (Minuten × Anteil der
   * Herzfrequenzreserve) [1/min]. Kalibriert an DirecNet 2005: Nachtmittel
   * 22–6 Uhr nach Nachmittagstraining 23 mg/dL tiefer (131 statt 154 mg/dL).
   * Nebel, 60 min bei 55 % um 16 Uhr, alle 20 mit behandeltem Tief: Median −23 mg/dL. Gegenprobe Taplin
   * 2010: 20 % weniger Basal ueber 6 h gleicht das zu gut 80 % aus.
   * Nachrechnung in tests/afterEffect.test.ts.
   */
  gainPerLoadMin: 0.0045,
} as const;

export type AfterEffectConstants = { readonly [K in keyof typeof AFTER_EFFECT]: number };

/* Stuetzstellen der Herzfrequenz, zeitlich sortiert (stabil), als Anteil der Reserve.
   Die Vorhersage und jeder Rechenschritt fragen dieselbe Eingabeliste viele Male mit
   wachsendem t ab; sortiert wird nur, wenn sich die Liste geaendert hat. Erkannt an
   Laenge und letztem Eintrag: der Adapter haengt nur an oder schneidet aus und haengt
   dann an, Pulseintraege aendert er nie an Ort und Stelle. */
const tracks = new WeakMap<readonly SimEvent[], { len: number; last: SimEvent | undefined; p: Parameters; ts: number[]; hs: number[] }>();
const hrTrack = (events: readonly SimEvent[], p: Parameters) => {
  const c = tracks.get(events), last = events[events.length - 1];
  if (c && c.len === events.length && c.last === last && c.p === p) return c;
  let ts: number[] = [], hs: number[] = [], sorted = true;
  for (const e of events)
    if (e.kind === "heartRate") {
      if (ts.length && e.t < ts[ts.length - 1]!) sorted = false;
      ts.push(e.t); hs.push(heartRateReserve(e.bpm, p).hrr);
    }
  if (!sorted) {
    const idx = ts.map((_, k) => k).sort((a, b) => ts[a]! - ts[b]!);
    ts = idx.map((k) => ts[k]!); hs = idx.map((k) => hs[k]!);
  }
  const fresh = { len: events.length, last, p, ts, hs };
  tracks.set(events, fresh);
  return fresh;
};

/**
 * Abklingende Belastungssumme bis t [min]. Die Herzfrequenz folgt heartRateAt:
 * linear zwischen den Stuetzstellen, davor Ruhe, nach der letzten deren Wert.
 * Jedes Stueck wird exakt integriert.
 */
export const afterEffectLoad = (
  t: number, events: readonly SimEvent[], p: Parameters, tau: number = AFTER_EFFECT.tauMin,
): number => {
  // shortcut: Stuetzstellen aelter als 12 tau (5 Tage) wiegen weniger als e^-12 und fallen weg.
  const lo = t - 12 * tau;
  const { ts, hs } = hrTrack(events, p);
  let i = 0;
  for (let hi = ts.length; i < hi;) { const m = (i + hi) >> 1; if (ts[m]! > lo) hi = m; else i = m + 1; }   // erste nach lo

  /* Jedes Stueck a..end traegt we · K bei, we = e^((end − t)/tau), K haengt nur am Stueck.
     Horner ueber die Stueckenden: acc · e^(−Abstand/tau) + K. So braucht es exp nur, wenn
     sich Abstand oder Stuecklaenge aendern; mit dem Gurt (eine Stuetzstelle je Minute)
     fast nie. Vorher zwei exp je Stuetzstelle, zweimal je Rechenschritt. */
  let qArg = NaN, qVal = 0, dArg = NaN, dVal = 0, acc = 0, lastEnd = NaN;
  const n = ts.length;
  for (; i < n && ts[i]! < t; i++) {
    const aT = ts[i]!, aH = hs[i]!, more = i + 1 < n;
    const end = more ? Math.min(ts[i + 1]!, t) : t;
    if (end <= aT) continue;
    const slope = more && ts[i + 1]! > aT ? (hs[i + 1]! - aH) / (ts[i + 1]! - aT) : 0;
    const span = end - aT;
    if (span !== qArg) { qArg = span; qVal = Math.exp(-span / tau); }
    // ∫ (h_a + slope·(s − a)) · e^((s − end)/tau) ds von a bis end
    const K = aH * tau * (1 - qVal) + slope * (tau * span - tau * tau * (1 - qVal));
    if (lastEnd === lastEnd) {
      const gap = end - lastEnd;
      if (gap !== dArg) { dArg = gap; dVal = Math.exp(-gap / tau); }
      acc *= dVal;
    }
    acc += K; lastEnd = end;
  }
  return lastEnd === lastEnd ? acc * Math.exp((lastEnd - t) / tau) : 0;
};

/**
 * Faktor auf die Insulinsensitivitaet zum Zeitpunkt t, 1 = keine Nachwirkung.
 * Fuer einen Rechenschritt am Anfang des Schritts auswerten, wie die
 * Herzfrequenz selbst: Der Adapter darf die Spur ab der letzten gerechneten
 * Minute neu setzen, und das Nachrechnen muss bitgleich bleiben.
 */
export const afterEffectFactor = (
  t: number, events: readonly SimEvent[], p: Parameters, c: AfterEffectConstants = AFTER_EFFECT,
): number => 1 + c.gainPerLoadMin * afterEffectLoad(t, events, p, c.tauMin);
