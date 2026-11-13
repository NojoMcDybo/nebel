// Gemeinsame Teile für Bau und Tests: Engine-Bündel, Adapter, Personen, Parametersätze.
// Geteilt mit der Website wird nur Logik: engine/src, app/adapter.js, app/personas.js.
// Parametersätze (GPL-3.0), Schriften und Lizenztexte kommen aus engine/dist/site,
// das 'npm run viewer' in engine/ erzeugt.
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
export const engineDir = resolve(root, "../engine");
export const site = resolve(engineDir, "dist/site");

export async function loadParts() {
  const dataFile = resolve(site, "personen-daten.js");
  if (!existsSync(dataFile)) {
    throw new Error("engine/dist/site fehlt. Erst in engine/ 'npm run oracle:fetch' und 'npm run viewer' ausfuehren.");
  }
  const engine = (await build({
    entryPoints: [resolve(engineDir, "src/index.ts")],
    bundle: true, format: "iife", globalName: "Nebel", target: "es2022", minify: true, write: false,
  })).outputFiles[0].text;
  const adapter = readFileSync(resolve(root, "../app/adapter.js"), "utf8");
  const personas = readFileSync(resolve(root, "../app/personas.js"), "utf8");
  // BeltEngine (Phase 3), Alarmplanung (Phase 4) und Nachtragen (Phase 5) erweitern den Adapter, ohne ihn anzufassen.
  const beltEngine = readFileSync(resolve(root, "src/belt-engine.js"), "utf8") + "\n" +
    readFileSync(resolve(root, "src/alarm-plan.js"), "utf8") + "\n" +
    readFileSync(resolve(root, "src/rewind.js"), "utf8");
  const data = readFileSync(dataFile, "utf8");

  /* Ein Skriptkontext wie in der WebView: window.Nebel, window.SUBJECTS, dann Adapter und BeltEngine. */
  const ctx = vm.createContext({ window: {}, performance, crypto });
  vm.runInContext(engine, ctx);
  vm.runInContext(data, ctx);
  ctx.window.Nebel = ctx.Nebel;
  vm.runInContext(
    personas + "\n" + adapter + "\n" + beltEngine +
    "\nglobalThis.__CORE = { PERSONAS, Engine, BeltEngine, planAlarms, TRAIN_LOW, TRAIN_HIGH, dumpEngine, loadEngine, journalInputs, openGap, fillGap };", ctx);
  return { engine, adapter, personas, beltEngine, data, ctx, core: ctx.__CORE };
}
