/**
 * Baut den Engine-Viewer als EINE selbstenthaltene HTML-Datei.
 *
 * Grund fuer ein einziges File: Die Seite laeuft per Doppelklick ueber file://,
 * ohne Server. ES-Module und fetch() sind dort gesperrt, deshalb werden Engine
 * und Subjektparameter zur Bauzeit eingebettet.
 *
 * Die Ausgabe enthaelt die Parametersaetze aus vendor/ und landet deshalb in
 * dist/ — gitignored. Sie wird nicht weitergegeben.
 */
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

mkdirSync(resolve(root, "dist"), { recursive: true });

/* Beide Einzeldateien aus derselben Engine bauen. */
const targets = [
  { tpl: resolve(root, "viewer/template.html"),      out: "nebel-viewer.html" },
  { tpl: resolve(root, "../app/template.html"),      out: "nebel.html" },
];
for (const { tpl, out } of targets) {
  if (!existsSync(tpl)) { console.log(`uebersprungen: ${out} (keine Vorlage)`); continue; }
  /* Der Adapter wird bei JEDEM Bau frisch eingesetzt. Vorher lag eine Kopie
     in der Vorlage — Aenderungen an adapter.js liefen ins Leere. */
  const adapterPath = resolve(root, "../app/adapter.js");
  const adapter = existsSync(adapterPath) ? readFileSync(adapterPath, "utf8") : "";
  const html = readFileSync(tpl, "utf8")
    .replace("/*__ADAPTER__*/", () => adapter)
    .replace("/*__ENGINE__*/", () => engine)
    .replace("/*__SUBJECTS__*/", () => `window.SUBJECTS = ${JSON.stringify(subjects)};`);
  writeFileSync(resolve(root, "dist", out), html, "utf8");
  console.log(`geschrieben: dist/${out}  (${(html.length / 1024).toFixed(0)} KB)`);
}
console.log(`${subjects.length} Subjekte eingebettet.`);
