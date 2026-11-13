// Baut www/: die Simulation (index.html) und den Pulsgurt-Test (puls.html).
//
// Die Oberflaeche src/app.html ist eine einmalige Kopie von app/template.html (12.11.2026)
// und wird hier eigenstaendig weiterentwickelt.
import { build } from "esbuild";
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

const html = readFileSync("src/app.html", "utf8")
  .replace("/*__ENGINE__*/", () => engine)
  .replace("/*__ADAPTER__*/", () => adapter + "\n" + beltEngine)
  .replace("/*__PERSONAS__*/", () => personas + "\n" + profilesJs);
if (/\/\*__[A-Z]+__\*\//.test(html)) throw new Error("app.html: Platzhalter nicht ersetzt");
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
console.log(`www/ gebaut: index.html ${(html.length / 1024).toFixed(0)} KB, ${core.PERSONAS.length} Personen`);
