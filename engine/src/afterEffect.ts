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
   * Nebel, 60 min bei 55 % um 16 Uhr: Median −22 mg/dL. Gegenprobe Taplin
   * 2010: 20 % weniger Basal ueber 6 h gleicht das zu gut 80 % aus.
   * Nachrechnung in tests/afterEffect.test.ts.
   */
  gainPerLoadMin: 0.0045,
} as const;

export type AfterEffectConstants = { readonly [K in keyof typeof AFTER_EFFECT]: number };

/**
 * Abklingende Belastungssumme bis t [min]. Die Herzfrequenz folgt heartRateAt:
 * linear zwischen den Stuetzstellen, davor Ruhe, nach der letzten deren Wert.
 * Jedes Stueck wird exakt integriert.
 */
export const afterEffectLoad = (
  t: number, events: readonly SimEvent[], p: Parameters, tau: number = AFTER_EFFECT.tauMin,
): number => {
  // shortcut: Stuetzstellen aelter als 12 tau (5 Tage) wiegen weniger als e^-12 und fallen weg.
  const pts: { t: number; h: number }[] = [];
  for (const e of events)
    if (e.kind === "heartRate" && e.t > t - 12 * tau) pts.push({ t: e.t, h: heartRateReserve(e.bpm, p).hrr });
  pts.sort((a, b) => a.t - b.t);

  const w = (s: number) => Math.exp((s - t) / tau);
  let L = 0;
  for (let i = 0; i < pts.length && pts[i]!.t < t; i++) {
    const a = pts[i]!, b = pts[i + 1];
    const end = b ? Math.min(b.t, t) : t;
    if (end <= a.t) continue;
    const slope = b && b.t > a.t ? (b.h - a.h) / (b.t - a.t) : 0;
    const wa = w(a.t), we = w(end), span = end - a.t;
    // ∫ (h_a + slope·(s − a)) · w(s) ds von a bis end, mit ∫ w = tau · w
    L += a.h * tau * (we - wa) + slope * (tau * span * we - tau * tau * (we - wa));
  }
  return L;
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
