import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { markdown, inline } from "../scripts/md.mjs";

describe("md.mjs", () => {
  it("Ueberschriften, Absaetze, Trennlinie", () => {
    expect(markdown("# A\n\nzwei\nZeilen\n\n---\n## B")).toBe("<h1>A</h1>\n<p>zwei Zeilen</p>\n<hr>\n<h2>B</h2>");
  });
  it("Listen, nummeriert mit Startwert", () => {
    expect(markdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(markdown("5. x\n6. y")).toBe('<ol start="5"><li>x</li><li>y</li></ol>');
  });
  it("Tabelle", () => {
    expect(markdown("| a | b |\n|---|---|\n| 1 | **2** |")).toBe(
      '<div class="tbl"><table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td><strong>2</strong></td></tr></tbody></table></div>');
  });
  it("Codeblock bleibt roh, aber maskiert", () => {
    expect(markdown("```\na < b *c*\n```")).toBe("<pre><code>a &lt; b *c*</code></pre>");
  });
  it("Inline: Code wird nicht weiter umgesetzt, HTML wird maskiert", () => {
    expect(inline("`*x*` und *y* <b>")).toBe("<code>*x*</code> und <em>y</em> &lt;b&gt;");
  });
  it("Links, nackte URLs und Abbildung der Ziele", () => {
    const href = (h) => (h === "40.md" ? "seite.html" : h);
    expect(inline("[lang](40.md)", href)).toBe('<a href="seite.html">lang</a>');
    expect(inline("siehe https://a.b/c.", href)).toBe('siehe <a href="https://a.b/c" target="_blank" rel="noopener">https://a.b/c</a>.');
    expect(inline("[DOI](https://doi.org/1)")).toBe('<a href="https://doi.org/1" target="_blank" rel="noopener">DOI</a>');
  });
  it("die echten Texte: keine Markdown-Reste", () => {
    for (const f of ["40_Entstehung_ausfuehrlich", "41_Entstehung_kompakt", "40_Entstehung_ausfuehrlich.en", "41_Entstehung_kompakt.en"]) {
      const html = markdown(readFileSync(new URL(`../../docs/${f}.md`, import.meta.url), "utf8"));
      const text = html.replace(/<pre>[\s\S]*?<\/pre>/g, "").replace(/<code>[\s\S]*?<\/code>/g, "");
      expect(text, f).not.toMatch(/\*\*|\]\(|^#|^\|/m);
    }
  });
});
