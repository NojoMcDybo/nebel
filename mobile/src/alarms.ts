// Lokale Mitteilungen für die vorausberechneten Alarme (window.NebelAlarms in index.html).
// Kein Server: iOS stellt sie zur geplanten Zeit selbst zu, auch bei gesperrtem Handy.
import { LocalNotifications } from "@capacitor/local-notifications";

export interface Alarm {
  at: number; // ms seit Epoche
  title: string;
  body: string;
}

export async function allowed(): Promise<boolean> {
  try {
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

export async function ask(): Promise<boolean> {
  try {
    return (await LocalNotifications.requestPermissions()).display === "granted";
  } catch {
    return false;
  }
}

// iOS hält höchstens 64 geplante Mitteilungen pro App.
const MAX = 60;

async function doReplace(alarms: Alarm[]) {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length)
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  const now = Date.now();
  const next = alarms.filter((a) => a.at > now).slice(0, MAX);
  if (!next.length) return;
  await LocalNotifications.schedule({
    notifications: next.map((a, i) => ({ id: i + 1, title: a.title, body: a.body, schedule: { at: new Date(a.at) } })),
  });
}

// Nacheinander, sonst löscht ein später gestarteter Aufruf die Planung eines früheren halb.
let chain: Promise<void> = Promise.resolve();
export function replace(alarms: Alarm[]): Promise<void> {
  chain = chain.then(() => doReplace(alarms)).catch(() => {});
  return chain;
}
