// Baut www/: die Simulation (index.html) und den Pulsgurt-Test (puls.html).
//
// Die Oberflaeche ist app/template.html der Website, beim Bauen gepatcht (app-patches.mjs).
import { build } from "esbuild";
import { applyPatches } from "./app-patches.mjs";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { loadParts, site } from "./core.mjs";

let parts;
try { parts = await loadParts(); } catch (e) { console.error(e.message); process.exit(1); }
const { engine, adapter, personas, beltEngine, data, ctx, core } = parts;

rmSync("www", { recursive: true, force: true });
mkdirSync("www", { recursive: true });

/* Antwortprofile der Personen einmal hier rechnen, wie build-viewer.mjs: im Handy waeren es Sekunden. */
const profiles = {};
for (const p of core.PERSONAS) {
  const s = ctx.window.SUBJECTS.find((x) => x.id === p.id);
  if (!s) throw new Error(`Person ${p.name}: Subjekt ${p.id} fehlt`);
  profiles[p.id] = ctx.Nebel.responseProfile(ctx.Nebel.nebelParameters(s.subject), s.therapy);
}
const profilesJs = `window.PROFILES = ${JSON.stringify(profiles)};`;

let patched;
try { patched = applyPatches(readFileSync("../app/template.html", "utf8")); } catch (e) { console.error(e.message); process.exit(1); }
const html = patched
  .replace("/*__ENGINE__*/", () => engine)
  .replace("/*__ADAPTER__*/", () => adapter + "\n" + beltEngine)
  .replace("/*__PERSONAS__*/", () => personas + "\n" + profilesJs);
if (/\/\*__[A-Z]+__\*\//.test(html)) throw new Error("index.html: Platzhalter nicht ersetzt");
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1], { filename: "index.html" });
writeFileSync("www/index.html", html);

writeFileSync("www/personen-daten.js", data);
cpSync(resolve(site, "fonts"), "www/fonts", { recursive: true });
cpSync(resolve(site, "lizenzen"), "www/lizenzen", { recursive: true });

/* belt.js: der Bluetooth-Teil als Skript fuer index.html (window.NebelBelt) und fuer puls.html. */
await build({
  entryPoints: ["src/belt.ts"], bundle: true, format: "iife", globalName: "NebelBelt", target: "es2022",
  minify: true, outfile: "www/belt.js", logLevel: "error",
});
/* alarms.js: lokale Mitteilungen fuer die vorausberechneten Alarme (window.NebelAlarms). */
await build({
  entryPoints: ["src/alarms.ts"], bundle: true, format: "iife", globalName: "NebelAlarms", target: "es2022",
  minify: true, outfile: "www/alarms.js", logLevel: "error",
});
await build({
  entryPoints: ["src/main.ts"], bundle: true, format: "iife", target: "es2022", minify: true,
  outfile: "www/puls.js", logLevel: "error",
});
cpSync("src/puls.html", "www/puls.html");

/* alarm.wav: Weckton fuer die Mitteilungen. Ohne angegebenen Ton stellt iOS sie
   lautlos zu. Drei Pieptoene, Pause, wiederholt; 28 s, iOS spielt hoechstens 30 s. */
{
  const rate = 11025, secs = 28, n = rate * secs, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / rate, p = t % 1.4, k = Math.floor(p / 0.25);      // 3 Toene à 0,15 s, dann Pause
    const on = k < 3 && p - k * 0.25 < 0.15;
    const v = on ? Math.sin(2 * Math.PI * (k === 1 ? 1320 : 880) * t) * 0.8 : 0;
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync("www/alarm.wav", buf);
}
console.log(`www/ gebaut: index.html ${(html.length / 1024).toFixed(0)} KB, ${core.PERSONAS.length} Personen`);
