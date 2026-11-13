// Pulsgurt über Bluetooth (0x180D / 0x2A37). Eine Verbindung, automatisches Neuverbinden,
// letztes Gerät wird gemerkt. Es kommen nur BPM-Werte heraus; Rohwerte bleiben nicht erhalten.
import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le";
import { registerPlugin } from "@capacitor/core";
import { MinuteAverager, parseHeartRate } from "./hr";

export { MinuteAverager };

export type BeltState = "aus" | "suche" | "verbunden" | "getrennt";
export interface BeltHandlers {
  onBpm(bpm: number): void;
  onStatus(state: BeltState, name: string, msg: string): void;
}

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";
const KEY = "nebel.hr.device";
const RETRY_MS = 3000;
// Alles außerhalb gilt als Sensorfehler (Kontaktverlust), nicht als Puls.
const BPM_MIN = 30, BPM_MAX = 250;

function remembered(): { id: string; name: string } | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function createBelt(h: BeltHandlers) {
  let deviceId: string | null = null;
  let name = "";
  let retrying = false;

  const status = (s: BeltState, msg = "") => h.onStatus(s, name, msg);

  async function attach(device: BleDevice) {
    deviceId = device.deviceId;
    name = device.name ?? "Pulsgurt";
    try {
      localStorage.setItem(KEY, JSON.stringify({ id: deviceId, name }));
    } catch {}
    await BleClient.connect(device.deviceId, () => {
      status("getrennt", "verbinde neu …");
      void reconnect();
    });
    status("verbunden");
    await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, (value) => {
      const bpm = parseHeartRate(value);
      if (bpm !== null && bpm >= BPM_MIN && bpm <= BPM_MAX) h.onBpm(bpm);
    });
  }

  async function reconnect() {
    if (retrying || !deviceId) return;
    retrying = true;
    try {
      for (;;) {
        try {
          const [d] = await BleClient.getDevices([deviceId]);
          await attach(d ?? { deviceId, name });
          return;
        } catch {
          await new Promise((r) => setTimeout(r, RETRY_MS));
        }
      }
    } finally {
      retrying = false;
    }
  }

  async function find(interactive: boolean): Promise<BleDevice | null> {
    const saved = remembered();
    if (saved) {
      name = saved.name;
      const [d] = await BleClient.getDevices([saved.id]);
      if (d) return d;
    }
    if (!interactive) return null;
    // Der Gurt hängt oft schon an Zepp: zuerst bei iOS nach bereits verbundenen Geräten fragen.
    const [connected] = await BleClient.getConnectedDevices([HR_SERVICE]);
    if (connected) return connected;
    return BleClient.requestDevice({ services: [HR_SERVICE] });
  }

  /** interactive=false: nur das gemerkte Gerät, nie die Geräteauswahl (für den Start der App). */
  async function connect(interactive = true) {
    status("suche");
    try {
      await BleClient.initialize();
      const d = await find(interactive);
      if (d) await attach(d);
      else status("aus");
    } catch {
      // Häufigster Grund: der Gurt liegt nicht an und wirbt dann nicht.
      status(deviceId ? "getrennt" : "aus", "Gurt nicht erreichbar");
      if (deviceId) void reconnect();
    }
  }

  return { connect, remembered: () => remembered() !== null };
}

/** Puls aus Apple Health (NebelHealthPlugin in ios/App/App/SceneDelegate.swift), für Lücken. */
export const health = registerPlugin<{
  ask(): Promise<{ ok: boolean; error: string }>;
  heartRate(o: { from: number; to: number }): Promise<{ samples: { t: number; bpm: number }[] }>;
}>("NebelHealth");
