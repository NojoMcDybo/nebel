// Pulsgurt-Test (puls.html): zeigt den Puls ohne Simulation, dazu einen Hintergrund-Test
// (Phase 4): Werte pro Minute, gezählt mit dem Zeitpunkt, an dem sie im JavaScript ankommen.
import { createBelt } from "./belt";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const btn = $("connect") as HTMLButtonElement;

const counts = new Map<number, number>(); // Minute seit Epoche → Anzahl Werte
const fmt = (m: number) => new Date(m * 60000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
function renderCounts() {
  const now = Math.floor(Date.now() / 60000);
  const rows: string[] = [];
  for (let m = now; m > now - 12; m--) rows.push(`<li>${fmt(m)} · ${counts.get(m) ?? 0} Werte</li>`);
  $("counts").innerHTML = rows.join("");
}
setInterval(renderCounts, 5000);
document.addEventListener("visibilitychange", renderCounts);

const belt = createBelt({
  onBpm(bpm) {
    const m = Math.floor(Date.now() / 60000);
    counts.set(m, (counts.get(m) ?? 0) + 1);
    $("bpm").textContent = String(bpm);
    $("last").textContent = "Letzter Wert: " + new Date().toLocaleTimeString("de-DE");
  },
  onStatus(state, name, msg) {
    $("dev").textContent =
      state === "verbunden" ? name : state === "getrennt" ? name + " getrennt" : state === "suche" ? "Suche Pulsgurt …" : "Kein Pulsgurt verbunden";
    $("msg").textContent = msg;
    btn.disabled = state === "suche";
  },
});

btn.addEventListener("click", () => void belt.connect(true));
if (belt.remembered()) void belt.connect(false);
renderCounts();
