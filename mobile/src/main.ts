// Pulsgurt-Test (puls.html): zeigt den Puls ohne Simulation.
import { createBelt } from "./belt";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const btn = $("connect") as HTMLButtonElement;

const belt = createBelt({
  onBpm(bpm) {
    $("bpm").textContent = String(bpm);
    $("last").textContent = "Letzter Wert: " + new Date().toLocaleTimeString("de-DE");
  },
  onStatus(state, name, msg) {
    $("dev").textContent =
      state === "verbunden" ? name : state === "getrennt" ? name + " getrennt" : state === "suche" ? "Suche Pulsgurt …" : "Kein Pulsgurt verbunden";
    $("msg").textContent = msg ? "Verbindung nicht möglich: " + msg : "";
    btn.disabled = state === "suche";
  },
});

btn.addEventListener("click", () => void belt.connect(true));
if (belt.remembered()) void belt.connect(false);
