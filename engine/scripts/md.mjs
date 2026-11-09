/* Kleiner Markdown-Umwandler fuer die Texte zur Entstehung (docs/40, docs/41).
 * shortcut: nur die Teilmenge, die diese Texte nutzen (Ueberschriften, Absaetze,
 * Listen, Tabellen, Codebloecke, fett/kursiv/Code, Links, nackte URLs).
 * Braucht ein Text mehr, lieber eine Bibliothek nehmen als hier nachbauen. */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

/** Inline-Markdown. `href` bildet Linkziele ab (z. B. .md → .html). */
export function inline(text, href = (h) => h) {
  const keep = [];
  const hold = (html) => `\u0000${keep.push(html) - 1}\u0000`;
  const link = (label, to) => {
    const h = href(to);
    const ext = /^https?:\/\//.test(h) ? ' target="_blank" rel="noopener"' : "";
    return hold(`<a href="${attr(h)}"${ext}>${label}</a>`);
  };
  let s = esc(text)
    .replace(/`([^`]+)`/g, (_, c) => hold(`<code>${c}</code>`))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, l, to) => link(l, to.replace(/&amp;/g, "&")))
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, (u) => link(u, u.replace(/&amp;/g, "&")))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s][^*]*?)\*/g, "<em>$1</em>");
  while (s.includes("\u0000")) s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  return s;
}

const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const isRule = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

/** Block-Markdown zu HTML. */
export function markdown(src, { href } = {}) {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  const inl = (t) => inline(t, href);
  let para = [];
  const flush = () => { if (para.length) out.push(`<p>${inl(para.join(" "))}</p>`); para = []; };
  const isList = (l) => /^- /.test(l) || /^\d+\. /.test(l);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) {
      flush();
      const code = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    } else if (/^#{1,6} /.test(l)) {
      flush();
      const n = l.match(/^#+/)[0].length;
      out.push(`<h${n}>${inl(l.slice(n + 1).trim())}</h${n}>`);
    } else if (/^---+\s*$/.test(l)) {
      flush(); out.push("<hr>");
    } else if (/^\s*\|/.test(l) && i + 1 < lines.length && isRule(lines[i + 1])) {
      flush();
      const head = cells(l); i++;
      const rows = [];
      while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) rows.push(cells(lines[++i]));
      out.push(`<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${inl(c)}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    } else if (isList(l)) {
      flush();
      const ordered = /^\d/.test(l), start = ordered ? parseInt(l, 10) : 1;
      const items = [];
      for (; i < lines.length && isList(lines[i]) && /^\d/.test(lines[i]) === ordered; i++)
        items.push(lines[i].replace(/^(- |\d+\. )/, ""));
      i--;
      const tag = ordered ? "ol" : "ul", st = ordered && start !== 1 ? ` start="${start}"` : "";
      out.push(`<${tag}${st}>${items.map((t) => `<li>${inl(t)}</li>`).join("")}</${tag}>`);
    } else if (!l.trim()) {
      flush();
    } else {
      para.push(l.trim());
    }
  }
  flush();
  return out.join("\n");
}
