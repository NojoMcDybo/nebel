/**
 * Baut zwei Dinge aus derselben Engine:
 *
 * 1. dist/nebel-viewer.html — Entwicklerwerkzeug, EINE selbstenthaltene Datei
 *    mit allen 20 Parametersaetzen. Laeuft per Doppelklick ueber file://.
 *    Bleibt lokal, wird nicht veroeffentlicht.
 *
 * 2. dist/site/ — die App, so wie sie veroeffentlicht wird:
 *      index.html          App (Apache 2.0), Engine, Adapter, Personen
 *      personen-daten.js   die zehn Parametersaetze, eigene Datei unter GPL-3.0
 *      rechtliches.html    Impressum, Datenschutz, Lizenzen
 *      en/index.html       dieselbe App auf Englisch (scripts/i18n-en.mjs)
 *      en/legal.html       englische Fassung von rechtliches.html (app/rechtliches.en.html)
 *      fonts/             Schriften (SIL OFL 1.1), kein Google-Abruf
 *      lizenzen/           Apache-2.0.txt, GPL-3.0.txt
 *    Warum die Daten getrennt liegen: docs/30_Rechtliche_Einordnung.md, Abschnitt 7.
 *    dist/nebel.html leitet nur noch auf dist/site/index.html weiter.
 *
 * --release (in der GitHub Action): bricht ab, wenn Impressumsangaben fehlen,
 * ein Lizenztext fehlt oder eine Seite etwas von fremden Servern laedt.
 * Impressumsangaben kommen aus NEBEL_IMPRESSUM_NAME, NEBEL_IMPRESSUM_ANSCHRIFT
 * (Zeilen mit \n trennen) und NEBEL_IMPRESSUM_EMAIL — nie aus dem Repo.
 *
 * dist/ ist gitignored: Die Ausgaben enthalten Parametersaetze aus vendor/.
 */
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { PAIRS } from "./i18n-en.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const oracle = resolve(root, "vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients");

if (!existsSync(oracle)) {
  console.error("Subjektparameter fehlen. Erst 'npm run oracle:fetch' ausfuehren.");
  process.exit(1);
}

const subjects = readdirSync(oracle)
  .filter((f) => f.endsWith(".json"))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  .map((f) => {
    const raw = JSON.parse(readFileSync(resolve(oracle, f), "utf8"));
    const m = raw.model_parameters, d = raw.demographic_info;
    return {
      id: f.replace(".json", ""),
      subject: {
        kb1: m.kb1, kb2: m.kb2, kb3: m.kb3, EGP0: m.EGP0, F01: m.F01, tmaxI: m.tmaxI,
        p3: m.p3, p4: m.p4, p5: m.p5, BW: m.BW, HRrest: m.HRrest, HRmax: m.HRmax,
        VG: m.VG, VI: m.VI, VT_HRR: m.VT_HRR,
      },
      therapy: {
        basalRateUPerH: d.basal,
        carbRatioGPerU: d.carb_insulin_ratio,
        correctionFactor: d.correction_bolus,
      },
      demo: { BW: d.body_weight, HbA1c: d.HbA1c, height: d.height },
    };
  });

const result = await build({
  entryPoints: [resolve(root, "src/index.ts")],
  bundle: true,
  format: "iife",
  globalName: "Nebel",
  target: "es2022",
  write: false,
});
const engine = result.outputFiles[0].text;

/* Personen der App: erfundene Figuren auf veroeffentlichten Koerpern
   (app/personas.js). Ihr Antwortprofil wird hier mit derselben Engine
   gerechnet und eingebettet — im Browser waeren es mehrere Sekunden. */
const personasPath = resolve(root, "../app/personas.js");
const personasSrc = existsSync(personasPath) ? readFileSync(personasPath, "utf8") : "";
let profilesJs = "";
if (personasSrc) {
  const ctx = vm.createContext({});
  vm.runInContext(engine, ctx);
  vm.runInContext(personasSrc + "\nglobalThis.__PERSONAS = PERSONAS;", ctx);
  const N = ctx.Nebel, profiles = {};
  for (const p of ctx.__PERSONAS) {
    const s = subjects.find((x) => x.id === p.id);
    if (!s) throw new Error(`Person ${p.name}: Subjekt ${p.id} fehlt`);
    profiles[p.id] = N.responseProfile(N.nebelParameters(s.subject), s.therapy);
  }
  profilesJs = `window.PROFILES = ${JSON.stringify(profiles)};`;
  console.log(`${ctx.__PERSONAS.length} Personen, Antwortprofile gerechnet.`);
}

mkdirSync(resolve(root, "dist"), { recursive: true });
const release = process.argv.includes("--release");
const problems = [];
const problem = (msg) => { problems.push(msg); console.error((release ? "FEHLER: " : "Hinweis: ") + msg); };

const adapterPath = resolve(root, "../app/adapter.js");
const adapter = existsSync(adapterPath) ? readFileSync(adapterPath, "utf8") : "";
const fill = (tpl) => readFileSync(tpl, "utf8")
  .replace("/*__ADAPTER__*/", () => adapter)
  .replace("/*__ENGINE__*/", () => engine)
  .replace("/*__PERSONAS__*/", () => personasSrc + "\n" + profilesJs);

/* Syntaxpruefung aller Inline-Skripte: ein Tippfehler in der Vorlage
   soll den Bau abbrechen, nicht still eine tote Seite erzeugen. */
const checkScripts = (html, name) => {
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new vm.Script(m[1], { filename: name }); }
    catch (e) { console.error(`Syntaxfehler in ${name}: ${e.message}`); process.exit(1); }
  }
};

/* Nichts von fremden Servern laden — keine Schriften, keine Skripte, keine
   Stile. Verweise (<a href>) sind erlaubt. */
const checkNoExternal = (html, name) => {
  const pats = [/<script[^>]+src=["']?(https?:)?\/\//i, /<link[^>]+href=["']?(https?:)?\/\//i,
                /url\(\s*["']?(https?:)?\/\//i, /@import/i, /<img[^>]+src=["']?(https?:)?\/\//i,
                /<iframe/i];
  for (const re of pats) if (re.test(html)) problem(`${name} laedt etwas von einem fremden Server (${re})`);
};

/* ── 1. Viewer ── */
{
  const tpl = resolve(root, "viewer/template.html");
  if (existsSync(tpl)) {
    const html = fill(tpl).replace("/*__SUBJECTS__*/", () => `window.SUBJECTS = ${JSON.stringify(subjects)};`);
    checkScripts(html, "nebel-viewer.html");
    writeFileSync(resolve(root, "dist", "nebel-viewer.html"), html, "utf8");
    console.log(`geschrieben: dist/nebel-viewer.html  (${(html.length / 1024).toFixed(0)} KB, ${subjects.length} Subjekte)`);
  }
}

/* ── 2. App: dist/site ── */
const appTpl = resolve(root, "../app/template.html");
if (existsSync(appTpl)) {
  if (!personasSrc) { console.error("app/personas.js fehlt — ohne Personen keine App."); process.exit(1); }
  const site = resolve(root, "dist/site");
  for (const d of ["", "fonts", "lizenzen"]) mkdirSync(resolve(site, d), { recursive: true });

  /* index.html — ohne Parametersaetze */
  const html = fill(appTpl);
  if (html.includes("__SUBJECTS__")) { console.error("app/template.html bettet die Parametersaetze ein — sie gehoeren nach personen-daten.js."); process.exit(1); }
  if (!html.includes('<script src="personen-daten.js"></script>')) { console.error("app/template.html laedt personen-daten.js nicht."); process.exit(1); }
  checkScripts(html, "index.html");
  checkNoExternal(html, "index.html");
  writeFileSync(resolve(site, "index.html"), html, "utf8");

  /* en/index.html — dieselbe App, jeder Text Eins zu Eins aus i18n-en.mjs.
     Fehlt ein Schluessel im Quelltext, ist ein deutscher Text umgezogen. */
  mkdirSync(resolve(site, "en"), { recursive: true });
  let htmlEn = html;
  for (const [de, en] of [...PAIRS].sort((a, b) => b[0].length - a[0].length)) {
    if (!htmlEn.includes(de)) { problem(`en: Quelltext nicht gefunden: ${de.slice(0, 70)}`); continue; }
    htmlEn = htmlEn.split(de).join(en);
  }
  checkScripts(htmlEn, "en/index.html");
  checkNoExternal(htmlEn, "en/index.html");
  writeFileSync(resolve(site, "en/index.html"), htmlEn, "utf8");
  /* Deutsche Reste im Sichtbaren (ohne Kommentare, Stile, Bezeichner) melden. */
  {
    const visible = htmlEn
      .replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "")
      .replace(/<svg[\s\S]*?<\/svg>/g, "");
    const de = /\b(und|der|die|das|ist|nicht|ein|eine|einen|wird|mit|für|auf|sich|dein|deine|deinen|du|Sie|zu|von|wenn|nur|noch|aber|oder|Tag|Stunden|Minuten|Wert|keine|kein)\b|[äöüß]/;
    const hits = visible.split("\n").filter((l) => de.test(l) && /["'`>]/.test(l) && !/\bthrow\b|Error\(|^\s*`/.test(l));
    for (const l of hits.slice(0, 40)) console.error("en: deutscher Rest? " + l.trim().slice(0, 140));
    if (hits.length) console.error(`Hinweis: en: ${hits.length} Zeilen mit deutschem Rest (nur melden, nicht abbrechen)`);
  }

  /* personen-daten.js — nur die zehn Personen der App, eigene Lizenz */
  const ref = existsSync(resolve(root, "vendor/py-mgipsim/REF"))
    ? readFileSync(resolve(root, "vendor/py-mgipsim/REF"), "utf8").trim() : "unbekannt";
  const vm2 = vm.createContext({});
  vm.runInContext(personasSrc + "\nglobalThis.__IDS = PERSONAS.map(p => p.id);", vm2);
  const ids = vm2.__IDS;
  const chosen = subjects.filter((s) => ids.includes(s.id));
  if (chosen.length !== ids.length) { console.error("Nicht jede Person hat einen Parametersatz."); process.exit(1); }
  const today = new Date().toISOString().slice(0, 10);
  const dataJs = `/*
 * nebel. — Parametersaetze der zehn Personen
 *
 * Herkunft: py-mgipsim, Illinois Institute of Technology
 *   https://github.com/illinoistech-itm/py-mgipsim  (Stand ${ref})
 *   pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients/Patient_*.json
 *
 * Lizenz: GNU General Public License v3 (lizenzen/GPL-3.0.txt). Diese Datei
 * wird unter derselben Lizenz weitergegeben. Sie ist ein eigenstaendiger Teil
 * der Seite; der uebrige Code von nebel. steht unter Apache 2.0.
 *
 * Geaendert (${today}, nebel.): ${chosen.length} von ${subjects.length} Datensaetzen ausgewaehlt
 * (${ids.join(", ")}), die benoetigten Felder aus JSON in JavaScript
 * uebertragen. Die Werte selbst sind unveraendert. Zuordnung:
 *   subject  ← model_parameters (kb1 kb2 kb3 EGP0 F01 tmaxI p3 p4 p5 BW HRrest HRmax VG VI VT_HRR)
 *   therapy  ← demographic_info (basal, carb_insulin_ratio, correction_bolus)
 *   demo     ← demographic_info (body_weight, HbA1c, height)
 */
window.SUBJECTS = ${JSON.stringify(chosen, null, 1)};
`;
  writeFileSync(resolve(site, "personen-daten.js"), dataJs, "utf8");

  /* Schriften und Lizenztexte */
  const nm = resolve(root, "node_modules");
  const copies = [
    ["@fontsource/dm-mono/files/dm-mono-latin-300-normal.woff2", "fonts/dm-mono-300.woff2"],
    ["@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2", "fonts/dm-mono-400.woff2"],
    ["@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2", "fonts/dm-mono-500.woff2"],
    ["@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2", "fonts/plus-jakarta-sans.woff2"],
    ["@fontsource/dm-mono/LICENSE", "fonts/OFL-DM-Mono.txt"],
    ["@fontsource-variable/plus-jakarta-sans/LICENSE", "fonts/OFL-Plus-Jakarta-Sans.txt"],
  ].map(([a, b]) => [resolve(nm, a), b]);
  copies.push([resolve(root, "../LICENSE"), "lizenzen/Apache-2.0.txt"]);
  copies.push([resolve(root, "vendor/py-mgipsim/LICENSE"), "lizenzen/GPL-3.0.txt"]);
  for (const [from, to] of copies) {
    if (existsSync(from)) copyFileSync(from, resolve(site, to));
    else problem(`fehlt: ${from} (fuer ${to}) — npm install bzw. npm run oracle:fetch`);
  }

  /* rechtliches.html — Impressum aus Umgebungsvariablen */
  const esc = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const env = (k) => (process.env[k] ?? "").replace(/\\n/g, "\n").trim();
  const imp = { NAME: env("NEBEL_IMPRESSUM_NAME"), ANSCHRIFT: env("NEBEL_IMPRESSUM_ANSCHRIFT"), EMAIL: env("NEBEL_IMPRESSUM_EMAIL") };
  for (const [k, v] of Object.entries(imp)) if (!v) problem(`Impressum: NEBEL_IMPRESSUM_${k} ist nicht gesetzt`);
  const de = today.split("-").reverse().join(".");
  for (const [legalTpl, out] of [["../app/rechtliches.html", "rechtliches.html"], ["../app/rechtliches.en.html", "en/legal.html"]]) {
  if (existsSync(resolve(root, legalTpl))) {
    const legal = readFileSync(resolve(root, legalTpl), "utf8")
      .replaceAll("{{IMPRESSUM_NAME}}", esc(imp.NAME || "[Name fehlt: NEBEL_IMPRESSUM_NAME]"))
      .replaceAll("{{IMPRESSUM_ANSCHRIFT}}", esc(imp.ANSCHRIFT || "[Anschrift fehlt: NEBEL_IMPRESSUM_ANSCHRIFT]"))
      .replaceAll("{{IMPRESSUM_EMAIL}}", esc(imp.EMAIL || "[E-Mail fehlt: NEBEL_IMPRESSUM_EMAIL]"))
      .replaceAll("{{PYMGIPSIM_REF}}", esc(ref))
      .replaceAll("{{PYMGIPSIM_REF_SHORT}}", esc(ref.slice(0, 7)))
      .replaceAll("{{BUILD_DATE}}", de);
    if (/\{\{[A-Z_]+\}\}/.test(legal)) problem(`${out}: unbekannter Platzhalter`);
    checkNoExternal(legal, out);
    writeFileSync(resolve(site, out), legal, "utf8");
  } else problem(`${legalTpl} fehlt`);
  }

  writeFileSync(resolve(site, ".nojekyll"), "", "utf8");
  /* Alter Doppelklick-Pfad bleibt gueltig */
  writeFileSync(resolve(root, "dist/nebel.html"),
    `<!DOCTYPE html><meta charset="utf-8"><title>nebel.</title>` +
    `<meta http-equiv="refresh" content="0; url=site/index.html">` +
    `<p>Die App liegt jetzt in <a href="site/index.html">site/index.html</a>.</p>\n`, "utf8");
  console.log(`geschrieben: dist/site/  (index.html ${(html.length / 1024).toFixed(0)} KB, personen-daten.js ${chosen.length} Personen, Stand py-mgipsim ${ref.slice(0, 7)})`);
}

if (release && problems.length) {
  console.error(`\n${problems.length} Problem(e) — Veroeffentlichung abgebrochen.`);
  process.exit(1);
}
