// Baut www/: die Simulation (index.html) und den Pulsgurt-Test (puls.html).
//
// Geteilt mit der Website wird nur Logik: engine/src, app/adapter.js, app/personas.js.
// Die Oberflaeche src/app.html ist eine einmalige Kopie von app/template.html (12.11.2026)
// und wird hier eigenstaendig weiterentwickelt.
// Die Parametersaetze (GPL-3.0), Schriften und Lizenztexte kommen aus engine/dist/site,
// das 'npm run viewer' in engine/ erzeugt.
import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const engineDir = resolve("../engine"), site = resolve(engineDir, "dist/site");
const dataFile = resolve(site, "personen-daten.js");
if (!existsSync(dataFile)) {
  console.error("engine/dist/site fehlt. Erst in engine/ 'npm run oracle:fetch' und 'npm run viewer' ausfuehren.");
  process.exit(1);
}

rmSync("www", { recursive: true, force: true });
mkdirSync("www", { recursive: true });

const engine = (await build({
  entryPoints: [resolve(engineDir, "src/index.ts")],
  bundle: true, format: "iife", globalName: "Nebel", target: "es2022", minify: true, write: false,
})).outputFiles[0].text;
const adapter = readFileSync("../app/adapter.js", "utf8");
const personas = readFileSync("../app/personas.js", "utf8");
const data = readFileSync(dataFile, "utf8");

/* Antwortprofile der Personen einmal hier rechnen, wie build-viewer.mjs: im Handy waeren es Sekunden. */
const ctx = vm.createContext({ window: {} });
vm.runInContext(engine, ctx);
vm.runInContext(data, ctx);
vm.runInContext(personas + "\nglobalThis.__PERSONAS = PERSONAS;", ctx);
const profiles = {};
for (const p of ctx.__PERSONAS) {
  const s = ctx.window.SUBJECTS.find((x) => x.id === p.id);
  if (!s) throw new Error(`Person ${p.name}: Subjekt ${p.id} fehlt`);
  profiles[p.id] = ctx.Nebel.responseProfile(ctx.Nebel.nebelParameters(s.subject), s.therapy);
}
const profilesJs = `window.PROFILES = ${JSON.stringify(profiles)};`;

const html = readFileSync("src/app.html", "utf8")
  .replace("/*__ENGINE__*/", () => engine)
  .replace("/*__ADAPTER__*/", () => adapter)
  .replace("/*__PERSONAS__*/", () => personas + "\n" + profilesJs);
if (/\/\*__[A-Z]+__\*\//.test(html)) throw new Error("app.html: Platzhalter nicht ersetzt");
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1], { filename: "index.html" });
writeFileSync("www/index.html", html);

writeFileSync("www/personen-daten.js", data);
cpSync(resolve(site, "fonts"), "www/fonts", { recursive: true });
cpSync(resolve(site, "lizenzen"), "www/lizenzen", { recursive: true });

await build({
  entryPoints: ["src/main.ts"], bundle: true, format: "iife", target: "es2022", minify: true,
  outfile: "www/puls.js", logLevel: "error",
});
cpSync("src/puls.html", "www/puls.html");
console.log(`www/ gebaut: index.html ${(html.length / 1024).toFixed(0)} KB, ${ctx.__PERSONAS.length} Personen`);
