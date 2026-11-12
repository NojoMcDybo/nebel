// Phase 1: Puls vom Bluetooth-Pulsgurt anzeigen. Keine Simulation, nichts wird gespeichert außer der Geräte-ID.
import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le";
import { parseHeartRate } from "./hr";

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";
const KEY = "nebel.hr.device";
const RETRY_MS = 3000;

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const btn = $("connect") as HTMLButtonElement;

let deviceId: string | null = null;
let deviceName = "";
let retrying = false;

function remembered(): { id: string; name: string } | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function show(msg: string) {
  $("msg").textContent = msg;
}

function onValue(value: DataView) {
  const bpm = parseHeartRate(value);
  if (bpm === null || bpm <= 0) return;
  $("bpm").textContent = String(bpm);
  $("last").textContent = "Letzter Wert: " + new Date().toLocaleTimeString("de-DE");
}

async function attach(device: BleDevice) {
  deviceId = device.deviceId;
  deviceName = device.name ?? "Pulsgurt";
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: deviceId, name: deviceName }));
  } catch {}
  await BleClient.connect(device.deviceId, () => {
    $("dev").textContent = deviceName + " getrennt, verbinde neu …";
    void reconnect();
  });
  $("dev").textContent = deviceName;
  show("");
  await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, onValue);
}

async function reconnect() {
  if (retrying || !deviceId) return;
  retrying = true;
  try {
    for (;;) {
      try {
        const [d] = await BleClient.getDevices([deviceId]);
        await attach(d ?? { deviceId, name: deviceName });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, RETRY_MS));
      }
    }
  } finally {
    retrying = false;
  }
}

async function findDevice(): Promise<BleDevice> {
  const saved = remembered();
  if (saved) {
    const [d] = await BleClient.getDevices([saved.id]);
    if (d) return d;
  }
  // Der Gurt hängt oft schon an Zepp: zuerst bei iOS nach bereits verbundenen Geräten fragen.
  const [connected] = await BleClient.getConnectedDevices([HR_SERVICE]);
  if (connected) return connected;
  return BleClient.requestDevice({ services: [HR_SERVICE] });
}

async function connectBelt() {
  btn.disabled = true;
  show("Suche Pulsgurt …");
  try {
    await BleClient.initialize();
    await attach(await findDevice());
  } catch (e) {
    show("Verbindung nicht möglich: " + (e instanceof Error ? e.message : String(e)));
    if (deviceId) void reconnect();
  } finally {
    btn.disabled = false;
  }
}

btn.addEventListener("click", () => void connectBelt());
if (remembered()) void connectBelt();
