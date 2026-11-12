// Bündelt src/main.ts und kopiert die Seite nach www/ (Capacitor-webDir).
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("www", { recursive: true, force: true });
mkdirSync("www", { recursive: true });
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  target: "es2022",
  minify: true,
  outfile: "www/app.js",
  logLevel: "error",
});
cpSync("src/index.html", "www/index.html");
