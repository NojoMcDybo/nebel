// Alarme für die vorausberechneten Werte (window.NebelAlarms in index.html). Kein Server:
// iOS stellt sie zur geplanten Zeit selbst zu, auch bei gesperrtem Handy.
// Mit AlarmKit-Erlaubnis (ab iOS 26) als Wecker, der auch im Lautlos-Modus klingelt
// (NebelAlarmPlugin in ios/App/App/SceneDelegate.swift), sonst als Mitteilung mit Ton.
import { registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface Alarm {
  at: number; // ms seit Epoche
  title: string;
  body: string;
  short: string; // Weckertext: AlarmKit zeigt nur eine Zeile
}

type WeckerState = "authorized" | "denied" | "notDetermined" | "unsupported";
const Wecker = registerPlugin<{
  state(): Promise<{ state: WeckerState }>;
  ask(): Promise<{ state: WeckerState }>;
  replace(o: { alarms: { at: number; title: string }[] }): Promise<{ scheduled: number; error: string }>;
}>("NebelAlarm");

const weckerState = (f: "state" | "ask") =>
  Wecker[f]().then((r) => r.state, (): WeckerState => "unsupported");

export async function allowed(): Promise<boolean> {
  if ((await weckerState("state")) === "authorized") return true;
  try {
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

/** Fragt nach Mitteilungen und, ab iOS 26, nach dem Wecker. true, wenn eins davon erlaubt ist. */
export async function ask(): Promise<boolean> {
  let note = false;
  try {
    note = (await LocalNotifications.requestPermissions()).display === "granted";
  } catch {}
  return (await weckerState("ask")) === "authorized" || note;
}

// iOS hält höchstens 64 geplante Mitteilungen pro App: 56 Alarme plus 7 Klarsicht-Morgen.
const MAX = 56;
const MORNING_ID = 1000; // Klarsicht-Morgen: 1001–1007, Alarme: 1–56

async function clearNotes(morning = false) {
  const pending = await LocalNotifications.getPending();
  const ids = pending.notifications.filter((n) => (n.id > MORNING_ID) === morning).map((n) => ({ id: n.id }));
  if (ids.length) await LocalNotifications.cancel({ notifications: ids });
}

async function doReplace(alarms: Alarm[]) {
  const now = Date.now();
  const next = alarms.filter((a) => a.at > now).slice(0, MAX);
  if ((await weckerState("state")) === "authorized") {
    const r = await Wecker.replace({ alarms: next.map((a) => ({ at: a.at, title: a.short })) }).catch(() => null);
    if (r && r.scheduled === next.length) return clearNotes();
  }
  // Kein Wecker erlaubt oder teilweise abgelehnt: keine halben Wecker stehen lassen, alles als Mitteilung
  await Wecker.replace({ alarms: [] }).catch(() => null);
  await clearNotes();
  if (!next.length) return;
  await LocalNotifications.schedule({
    // sound: ohne Angabe stellt iOS lautlos zu (Test 13.11.2026). alarm.wav baut build.mjs.
    // timeSensitive: darf durch einen Fokus, soweit iOS das der App erlaubt.
    notifications: next.map((a, i) => ({
      id: i + 1, title: a.title, body: a.body, schedule: { at: new Date(a.at) },
      sound: "alarm.wav", interruptionLevel: "timeSensitive" as const,
    })),
  });
}

// Nacheinander, sonst löscht ein später gestarteter Aufruf die Planung eines früheren halb.
let chain: Promise<void> = Promise.resolve();
export function replace(alarms: Alarm[]): Promise<void> {
  chain = chain.then(() => doReplace(alarms)).catch(() => {});
  return chain;
}

export interface Morning {
  at: number; // ms seit Epoche
  title: string;
  body: string;
}

/** Klarsicht: eine Mitteilung pro Morgen für die nächsten Tage. Leere Liste löscht sie.
 *  Fragt nach Mitteilungen, wenn noch nie gefragt wurde (nur nach Zustimmung zu Klarsicht). */
export function morning(list: Morning[]): Promise<void> {
  chain = chain.then(async () => {
    await clearNotes(true);
    const next = list.filter((m) => m.at > Date.now()).slice(0, 7);
    if (!next.length) return;
    if ((await LocalNotifications.requestPermissions()).display !== "granted") return;
    await LocalNotifications.schedule({
      notifications: next.map((m, i) => ({
        id: MORNING_ID + 1 + i, title: m.title, body: m.body, schedule: { at: new Date(m.at) },
        extra: { hash: "daily" },
      })),
    });
  }).catch(() => {});
  return chain;
}

/** Tipp auf eine Mitteilung mit Sprungziel (extra.hash). iOS hebt das Ereignis bis hierher auf. */
export function onOpen(fn: (hash: string) => void): void {
  LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const h = a.notification.extra?.hash;
    if (typeof h === "string") fn(h);
  }).catch(() => {});
}
