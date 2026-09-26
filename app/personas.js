/* ══════════════════════════════════════════════════════════════════
   PERSONEN — zehn erfundene Figuren auf zehn veroeffentlichten Koerpern.

   Echt (aus dem Datensatz, zur Laufzeit aus window.SUBJECTS gelesen):
   Groesse, Gewicht, Ruhepuls, Basalrate, KE-Faktor, Korrekturfaktor, HbA1c
   und alle Modellparameter.

   Erfunden (hier, und in der App als erfunden gekennzeichnet):
   Vorname, Alter, der Satz zum Alltag und das Aussehen. Das Alter ist grob
   an den Maximalpuls angelehnt (220 minus Alter), mindestens 19 — der
   Datensatz enthaelt weder Alter noch Geschlecht.

   Auswahl: die zehn Subjekte, die sich bei Insulin, Mahlzeit, moderatem und
   hartem Sport und Koerpergewicht am staerksten unterscheiden (Maximin-Auswahl,
   Start bei Patient 10 als typischster Person). Siehe docs/09_Personen.md.

   Keine dieser Figuren bildet einen realen Menschen nach.
   ══════════════════════════════════════════════════════════════════ */

const PERSONAS = [
  { id:"Patient_10", name:"Lena",   age:23, line:"studiert Grundschullehramt",
    look:{ skin:"#F1D0B8", hair:"#A57A45", style:"long",      shirt:"#3E6B8A" } },
  { id:"Patient_4",  name:"Jonas",  age:22, line:"macht eine Ausbildung zum Mechatroniker",
    look:{ skin:"#E7BD9B", hair:"#4A2F1E", style:"short",     shirt:"#6B7F5A" } },
  { id:"Patient_6",  name:"Mira",   age:30, line:"arbeitet als Architektin",
    look:{ skin:"#D39B78", hair:"#221915", style:"bun",       shirt:"#4B4F6B", glasses:true } },
  { id:"Patient_7",  name:"Aylin",  age:31, line:"ist Zahnärztin",
    look:{ skin:"#C68A62", hair:"#2A1A12", style:"ponytail",  shirt:"#8A4F3E" } },
  { id:"Patient_8",  name:"Malik",  age:25, line:"studiert Informatik",
    look:{ skin:"#8A5537", hair:"#16100E", style:"buzz",      shirt:"#5E7A7A", beard:true } },
  { id:"Patient_11", name:"Tobias", age:33, line:"fährt Linienbus",
    look:{ skin:"#EEC6AC", hair:"#9C4E27", style:"side",      shirt:"#2F4A5C", beard:true } },
  { id:"Patient_13", name:"Jana",   age:26, line:"arbeitet als Erzieherin",
    look:{ skin:"#F3D5C2", hair:"#6E3520", style:"bob",       shirt:"#7A5A7A" } },
  { id:"Patient_14", name:"Finn",   age:19, line:"hat gerade Abitur gemacht",
    look:{ skin:"#EFCDB3", hair:"#C9A05A", style:"curly",     shirt:"#9A7B3E" } },
  { id:"Patient_15", name:"Sofia",  age:24, line:"arbeitet im Buchhandel",
    look:{ skin:"#D8A785", hair:"#3A2417", style:"curlylong", shirt:"#A36A4F" } },
  { id:"Patient_18", name:"David",  age:20, line:"studiert BWL",
    look:{ skin:"#A56D48", hair:"#1B1411", style:"short",     shirt:"#556B55", glasses:true } },
];
const DEFAULT_PERSONA = "Patient_10";

/* ── Avatar ─────────────────────────────────────────────────────────
   Flaches Portrait als Inline-SVG. Eigene Zeichnung, keine Vorlage.
   Die Statur folgt dem BMI nur leicht — Schultern etwas breiter, sonst
   nichts. Kein Koerpermerkmal wird zur Aussage ueber die Person. */
let AVATAR_UID = 0;
function avatarSVG(persona, bmi = 23){
  const L = persona.look, uid = "av" + (++AVATAR_UID);
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * k));
    return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
  };
  const skin = L.skin, skinD = shade(L.skin, .86), hair = L.hair, hairD = shade(L.hair, .78);
  const ink = "#1E2426", lip = shade(L.skin, .62);
  const w = 25 * (0.92 + Math.max(0, Math.min(10, bmi - 21)) * 0.024);

  /* Haar hinter dem Kopf */
  const back = {
    long:      `<path d="M24.5 34 C23.5 20 31 15.5 40 15.5 C49 15.5 56.5 20 55.5 34 L57.5 60 C51 63 45 61.5 40 58 C35 61.5 29 63 22.5 60 Z" fill="${hair}"/>`,
    bob:       `<path d="M24.3 34 C23.5 20 31 15.5 40 15.5 C49 15.5 56.5 20 55.7 34 L56.3 49 C50 51.5 30 51.5 23.7 49 Z" fill="${hair}"/>`,
    ponytail:  `<path d="M50.5 24 C60.5 26 62.5 38 59.5 49 C58.3 54 55.8 57.5 53 58.5 C54.4 52 54.6 44.5 53.4 37.5 C52.8 32.5 51.8 28.5 50.5 26.5 Z" fill="${hair}"/><rect x="51.2" y="25.2" width="3.4" height="2.6" rx="1" transform="rotate(20 52.9 26.5)" fill="${L.shirt}"/>`,
    bun:       `<circle cx="40" cy="14.5" r="6.8" fill="${hair}"/>`,
    curlylong: [[25,40],[24,47],[25.5,54],[55,40],[56,47],[54.5,54],[27,33],[53,33]]
                 .map(([x,y]) => `<circle cx="${x}" cy="${y}" r="5.6" fill="${hair}"/>`).join(""),
  }[L.style] || "";

  /* Haar vorne */
  const capShort = `M26.3 33 C25.5 22 31 17.5 40 17.5 C49 17.5 54.5 22 53.7 33 C51 27 46 24.5 40 24.5 C34 24.5 29 27 26.3 33 Z`;
  const capLong  = `M26.3 37 C25 22 31 17 40 17 C49 17 55 22 53.7 37 C52.5 29 47.5 24 40.5 23 C39 26 34 29.5 26.3 37 Z`;
  const curls = (pts, r) => pts.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join("");
  const front = {
    short:    `<path d="${capShort}" fill="${hair}"/>`,
    side:     `<path d="M26.3 33 C25.5 21 32 16.5 41 17 C50 17.5 55 23 53.7 33 C52.5 28 50 25.5 46 24.5 C39 23 32 25.5 26.3 33 Z" fill="${hair}"/>
               <path d="M29 27 C34 21.5 44 20.5 51 24.5 C45 22.8 37 23.5 29 27 Z" fill="${hairD}"/>`,
    buzz:     `<path d="M26.8 31 C26.6 21 32 18.3 40 18.3 C48 18.3 53.4 21 53.2 31 C51 25.5 46 23.6 40 23.6 C34 23.6 29 25.5 26.8 31 Z" fill="${hair}" opacity=".9"/>`,
    long:     `<path d="${capLong}" fill="${hair}"/>`,
    bob:      `<path d="M26.4 33.5 C25.8 21 32 17 40 17 C48 17 54.2 21 53.6 33.5 C53 29.8 52 28 51 27.6 C44 26.4 36 26.4 29 27.6 C28 28 27 29.8 26.4 33.5 Z" fill="${hair}"/>`,
    bun:      `<path d="${capShort}" fill="${hair}"/>`,
    ponytail: `<path d="${capLong}" fill="${hair}"/>`,
    curly:    `<path d="${capShort}" fill="${hair}"/>` +
              curls([[27.5,30],[29,24.5],[32.5,20.3],[37.2,18],[42.8,18],[47.5,20.3],[51,24.5],[52.5,30]], 4.3),
    curlylong:`<path d="${capShort}" fill="${hair}"/>` +
              curls([[27.5,30.5],[29,24.5],[32.5,20.3],[37.2,18],[42.8,18],[47.5,20.3],[51,24.5],[52.5,30.5]], 4.5),
  }[L.style] || `<path d="${capShort}" fill="${hair}"/>`;

  const beard = L.beard
    ? `<path d="M27.6 37.5 C28 49 33 54.5 40 55 C47 54.5 52 49 52.4 37.5 C51 43.5 47 46.8 40 46.8 C33 46.8 29 43.5 27.6 37.5 Z" fill="${hair}" opacity=".92"/>
       <path d="M35.2 44.3 Q40 42.4 44.8 44.3 Q40 45.4 35.2 44.3 Z" fill="${hair}"/>`
    : "";
  const glasses = L.glasses
    ? `<g fill="none" stroke="${ink}" stroke-width="1.25"><circle cx="34.6" cy="36.6" r="4.3"/><circle cx="45.4" cy="36.6" r="4.3"/><path d="M38.9 36.4 L41.1 36.4"/></g>`
    : "";

  /* Lebendig: Kopf wiegt leicht, Oberkoerper atmet, Augen blinzeln. Jede
     Figur mit eigenem Takt (aus dem Namen), damit nicht alle synchron
     schaukeln. Die Animation selbst steht im CSS der App (.av-head …). */
  const h = [...persona.name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7);
  const tempo = `--d:${-(h % 60) / 10}s;--d2:${-(h % 47) / 10}s;--d3:${-(h % 53) / 10}s`;
  return `<svg viewBox="8 7 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${persona.name}" style="${tempo}">
  <defs><clipPath id="${uid}"><circle cx="40" cy="39" r="32"/></clipPath></defs>
  <g clip-path="url(#${uid})">
    <rect width="80" height="80" fill="var(--sink)"/>
    <g class="av-head">${back}</g>
    <g class="av-body">
      <path d="M${40 - w} 84 C${40 - w} 66 ${40 - w * .55} 58.5 40 58.5 C${40 + w * .55} 58.5 ${40 + w} 66 ${40 + w} 84 Z" fill="${L.shirt}"/>
      <path d="M34.6 46 L34.6 58.2 Q40 62.5 45.4 58.2 L45.4 46 Z" fill="${skinD}"/>
    </g>
    <g class="av-head">
      <ellipse cx="26.9" cy="37" rx="2.4" ry="3.4" fill="${skinD}"/>
      <ellipse cx="53.1" cy="37" rx="2.4" ry="3.4" fill="${skinD}"/>
      <ellipse cx="40" cy="35" rx="13.5" ry="16" fill="${skin}"/>
      ${front}
      <g stroke="${hairD}" stroke-width="1.3" stroke-linecap="round" fill="none">
        <path d="M31.6 31.4 Q34.5 30 37.3 31.1"/><path d="M42.7 31.1 Q45.5 30 48.4 31.4"/>
      </g>
      <g class="av-eyes">
        <circle cx="34.6" cy="36.6" r="1.35" fill="${ink}"/>
        <circle cx="45.4" cy="36.6" r="1.35" fill="${ink}"/>
      </g>
      <path d="M40 38.8 L39.1 42 L40.7 42.2" stroke="${skinD}" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${beard}
      <path d="M36.4 45.3 Q40 47.6 43.6 45.3" stroke="${L.beard ? skin : lip}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      ${glasses}
    </g>
  </g>
</svg>`;
}
