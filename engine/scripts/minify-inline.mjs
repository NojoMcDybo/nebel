/* Inline-Skripte und -Stile einer Seite verkleinern (Website: build-viewer.mjs, App: mobile/scripts/build.mjs).
   Ohne eigene Imports: transformSync kommt aus dem esbuild des Aufrufers, denn im App-Bau
   gibt es engine/node_modules nicht. Klassische Skripte teilen sich ihre obersten Namen,
   esbuild benennt ohne format nur Lokales um. Erst nach i18n und vor den CSP-Hashes aufrufen. */
export const minifyInline = (html, transformSync) => html
  .replace(/<script>([\s\S]*?)<\/script>/g, (_, js) =>
    `<script>${transformSync(js, { loader: "js", minify: true, target: "es2022" }).code.trim()}</script>`)
  .replace(/<style>([\s\S]*?)<\/style>/g, (_, css) =>
    `<style>${transformSync(css, { loader: "css", minify: true }).code.trim()}</style>`);
