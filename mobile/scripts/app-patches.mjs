// Die App-Oberflaeche ist app/template.html mit diesen Aenderungen. Gepatcht wird
// beim Bauen, damit Website-Updates von selbst in die App kommen. Jeder Anker muss
// genau so oft vorkommen wie angegeben, sonst bricht der Build ab: dann hat sich
// die Website an der Stelle geaendert und der Patch muss nachgezogen werden.
//
// Grundsatz: Zeitraffer und alles andere laufen wie auf der Website. Erst der
// Reality-Modus schaltet die App-Teile ein: Pulsgurt, Mitteilungen als Alarm,
// Nachtblatt ohne angehaltenen Bildschirm.

const CSS = `
/* ── nebel. App (mobile/scripts/app-patches.mjs) ── */
.page > .inner{padding-top:env(safe-area-inset-top); padding-bottom:calc(1px + env(safe-area-inset-bottom))}
#gate .glang, #gate .legal, .eyebrow:has(+ #story), #story, .row2:has(#btnCsv),
.field:has(#langSeg), .field:has(#langSeg) + .hint{display:none}`;

const NIGHT_SHEET = `<!-- ══════════ SHEET: NACHT (App) ══════════ -->
<div class="sheet" id="sheetNight"><div class="panel">
  <div class="grab"></div>
  <h3>Schlafen gehen</h3>
  <p style="font-size:15.5px;line-height:1.5;margin:0 0 16px" id="nightTxt"></p>
  <p class="hint">Leg das Handy weg und sperr es. nebel. rechnet weiter, auch wenn die App zu ist. Im Lautlos-Modus oder mit dem Fokus „Schlafen“ klingelt nichts.</p>
  <p class="hint">Im Schlaf liegt man manchmal auf dem Sensor. Dann misst er falsch tief, und der Alarm kommt trotzdem. Auch das gehört dazu.</p>
  <div class="row2">
    <button class="btn soft" data-close>Zurück</button>
    <button class="btn" id="nightOK">Gute Nacht</button>
  </div>
</div></div>

`;

const APP_JS = `/* ─── App: Reality-Teile ────────────────────────────────────────
   Pulsgurt und Alarme gibt es nur im Reality-Modus. Im Zeitraffer laeuft
   alles wie auf der Website. var und Funktionsdeklarationen, weil renderLog
   und paintMove diese Namen schon vor dieser Stelle brauchen koennen. */
function paintApp(){
  $("btnAlarm").style.display = eng.reality ? "" : "none";
  // Nachtalarm am Bildschirm mit denselben Grenzen wie die Mitteilungen (< 80, > 280).
  ALARM_LOW = eng.reality ? TRAIN_LOW - 1 : 70;
  ALARM_HIGH = eng.reality ? TRAIN_HIGH + 1 : 250;
}
function appReality(){
  if (alarmPref() === null) askAlarms(); else alarmDirty = true;
  if (belt.remembered()) belt.connect(false);
}

/* Pulsgurt: jede Sekunde ein Wert, die Engine bekommt ein Mittel pro Minute als
   heartRate-Ereignis (BeltEngine). Rohwerte bleiben nicht erhalten. */
var beltState = "aus", beltMsg = "", beltBpmNow = 0;
const beltAvg = new NebelBelt.MinuteAverager();
const belt = NebelBelt.createBelt({
  onBpm(bpm){
    beltBpmNow = bpm;
    if (!eng.reality) return;
    const now = Date.now();
    if (eng.beltT == null) eng.beltBpm(bpm);                 // erster Wert gilt sofort
    const m = beltAvg.add(now, bpm);
    if (m && now - m.minute < 120000) eng.beltBpm(m.bpm);    // veraltete Reste nach einer Pause nicht nehmen
  },
  onStatus(state, name, msg){ beltState = state; beltMsg = msg; if (state === "aus") beltBpmNow = 0; lastMoveHTML = ""; paintMove(); },
});
$("btnBelt").onclick = () => belt.connect(true);

/* Alarme: vorausberechnet (alarm-plan.js), als lokale Mitteilungen geplant. Neu
   geplant nach jeder Eingabe, alle fuenf Minuten und beim Verlassen der App.
   Ausserhalb von Reality wird alles Geplante geloescht. */
const ALARM_KEY = "nebel.alarme.v1";      // "an" | "aus"; fehlt = noch nie gefragt
function alarmPref(){ try { return localStorage.getItem(ALARM_KEY); } catch(e){ return null; } }
var alarmsOn = alarmPref() !== "aus", alarmT = -1e9, alarmDirty = true;
function paintAlarmBtn(){ $("btnAlarm").textContent = alarmsOn ? "Alarme: an" : "Alarme: aus"; }
async function askAlarms(){
  const ok = await NebelAlarms.ask();
  try { localStorage.setItem(ALARM_KEY, ok ? "an" : "aus"); } catch(e){}
  alarmsOn = ok; alarmDirty = true; paintAlarmBtn();
  if (!ok) toast("basal", "Mitteilungen in den iPhone-Einstellungen erlauben", null);
}
$("btnAlarm").onclick = () => {
  if (!alarmsOn) return askAlarms();
  alarmsOn = false; alarmDirty = true; paintAlarmBtn();
  try { localStorage.setItem(ALARM_KEY, "aus"); } catch(e){}
  toast("basal", "Alarme aus", null);
};
function scheduleAlarms(){
  alarmT = eng.s.t; alarmDirty = false;
  if (!alarmsOn || !anchor || !eng.reality) return NebelAlarms.replace([]);
  const a0 = anchor, who = PERSON.name;
  NebelAlarms.replace(planAlarms(eng).map(a => ({
    at: a0.wall + (a.t - a0.simT)*60000,
    title: a.kind === "low" ? "Tiefalarm · nebel." : "Hochalarm · nebel.",
    body: \`Sensor von \${who}: \${bgv(a.v)} \${UL()}. Simulierter Wert, kein echter Messwert.\`,
  })));
}

`;

/** [Anker, Ersatz, Anzahl (Standard 1)] */
export const PATCHES = [
  // Abstaende: Seiteninhalt unter der Statusleiste, Website-Teile ohne Ziel in der App ausblenden
  [".page > .inner{width:100%; max-width:460px; padding:0 20px 1px; align-self:flex-start; min-height:100%}",
   (m) => m + CSS],
  ['<p class="legal"><a href="rechtliches.html">Impressum · Datenschutz · Lizenzen</a> · <a href="en/" lang="en" hreflang="en">English</a></p>',
   '<p class="legal"><a href="puls.html">Pulsgurt-Test</a></p>', 2],

  // Oberflaeche: Alarmknopf, Gurtzeile in der Bewegungskarte, Nachtblatt, Hinweis im Reality-Blatt
  ['<button class="btn soft wide" id="btnSleep">Schlafen gehen</button>',
   (m) => m + '\n      <button class="btn line wide" id="btnAlarm" style="display:none">Alarme: an</button>'],
  ['<button class="mvx" id="mvCancel" type="button" hidden>Training absagen</button>',
   (m) => m + '\n      <div class="sub" id="mvSrc" style="margin-top:12px;display:none"></div>' +
              '\n      <button class="mvx" id="btnBelt" type="button" style="display:none">Pulsgurt verbinden</button>'],
  ["<!-- ══════════ SHEET: REALITY ══════════ -->", (m) => NIGHT_SHEET + m],
  ['<p class="hint">Alles andere läuft weiter: Alltagsbewegung und Sensorfehler. Die planst du ohnehin nicht.</p>',
   (m) => m + '\n  <p class="hint">In der App kommt dazu: Ein Pulsgurt bewegt die Person so, wie du dich bewegst. ' +
              'Fällt ihr Wert unter 80 oder steigt über 280, meldet sich nebel. mit einer Mitteilung, auch nachts bei gesperrtem iPhone.</p>'],

  // Skripte und Engine mit Gurt
  ['<script src="personen-daten.js"></script>',
   (m) => m + '\n<script src="belt.js"></script>\n<script src="alarms.js"></script>'],
  ["const eng = new Engine(", "const eng = new BeltEngine("],

  // Bewegungskarte: Puls vom Gurt statt Plan
  ['const stamp = key + "|"', 'const belted = eng.beltT != null;\n  const stamp = key + (belted ? "|B" : "") + "|"'],
  [`  } else {
    if (fresh){
      $("mvName").textContent = eng.reality ? "Du planst selbst" : "Nichts geplant";`,
   `  } else if (belted){
    if (fresh){
      $("mvName").textContent = "Puls vom Gurt";
      $("mvWhen").textContent = "";
      $("mvSub").textContent = "Die Person bewegt sich so, wie du dich bewegst. Alltagsbewegung und Training aus dem Plan ruhen.";
    }
  } else {
    if (fresh){
      $("mvName").textContent = eng.reality ? "Du planst selbst" : "Nichts geplant";`],
  ['$("mvCancel").hidden = a.mode !== "soon";',
   (m) => m + `
  if (eng.reality) put("mvSrc", belted ? \`Quelle: Pulsgurt · \${beltBpmNow} bpm\`
    : beltState === "suche" ? "Quelle: simuliert · suche Pulsgurt …"
    : beltState === "getrennt" ? "Quelle: simuliert · " + (beltMsg || "Gurt getrennt, verbinde neu …")
    : "Quelle: simuliert" + (beltMsg ? " · " + beltMsg : ""));
  $("mvSrc").style.display = eng.reality ? "" : "none";
  $("btnBelt").style.display = eng.reality && !belted ? "" : "none";`],
  ['$("btnMove").onclick = guarded(() => {',
   (m) => m + '\n  if (eng.beltT != null){ toast("move", "Der Gurt misst deine Bewegung", null); return; }'],

  // Jede Eingabe und jeder Moduswechsel laeuft ueber renderLog: Alarme neu planen
  ["function renderLog(){", (m) => m + "\n  alarmDirty = true; paintApp();"],
  ["  if (asleep) paintNight();\n",
   (m) => m + "  if (alarmDirty || (eng.reality && eng.s.t - alarmT >= 5)) scheduleAlarms();\n"],
  ["eng.setReality(true); setAnchor();", (m) => m + " appReality();"],

  // Echtzeit: Anker speichern und beim Oeffnen vom Anker aus nachrechnen
  ["v:1, wall:Date.now(), rng:eng.rng.state(),", "v:1, wall:Date.now(), anchor, rng:eng.rng.state(),"],
  ["    if (d.reality) miss = Math.max(0, Math.min(4320, Math.floor((Date.now() - d.wall)/60000)));\n    for (let i = 0; i < miss; i++) eng.step();",
   `    // App: vom gespeicherten Anker aus, damit beim Oeffnen keine Teilminute verloren geht.
    // Liegt die Pause laenger zurueck, laeuft die Uhr ab jetzt mit neuem Anker weiter.
    if (d.reality){
      const a = d.anchor || { simT:eng.s.t, wall:d.wall };
      const gap = Math.max(0, Math.floor(a.simT + (Date.now() - a.wall)/60000 - eng.s.t));
      miss = Math.min(4320, gap);
      for (let i = 0; i < miss; i++) eng.step();
      anchor = gap > 4320 ? { simT:eng.s.t, wall:Date.now() } : a;
    }`],

  // Nacht: in Reality weckt die Mitteilung, der Bildschirm darf ausgehen
  ["const ALARM_LOW = 70, ALARM_HIGH = 250;", "var ALARM_LOW = 70, ALARM_HIGH = 250;   // App: paintApp setzt in Reality 80/280"],
  ["  holdScreen(true);\n  $(\"night\").hidden = false;",
   "  if (!eng.reality) holdScreen(true);\n  alarmDirty = true;\n  $(\"night\").hidden = false;"],
  ["asleep = false; eng.s.asleep = false; alarmOn = false;", (m) => m + " alarmDirty = true;"],
  ['$("btnSleep").onclick = guarded(goSleep);',
   `$("btnSleep").onclick = guarded(() => {
  if (!eng.reality) return goSleep();
  $("nightTxt").textContent = alarmsOn
    ? \`Fällt der Wert von \${PERSON.name} unter \${bgv(TRAIN_LOW)} oder steigt über \${bgv(TRAIN_HIGH)} \${UL()}, klingelt dein iPhone. Auch um drei Uhr nachts. Die Alarme kannst du jederzeit abschalten.\`
    : "Die Alarme sind aus. Du wirst heute Nacht nicht geweckt, und nebel. rechnet trotzdem weiter.";
  openSheet("sheetNight");
});
$("nightOK").onclick = () => { closeSheets(); goSleep(); };`],

  // Start
  ["/* ─── Start ───", (m) => APP_JS + m],
  ["if (eng.reality) setAnchor();",
   `if (eng.reality && !anchor) setAnchor();
if (eng.reality){ speed = 1; [...$("speed").children].forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.x === 1))); }`],
  ['if (document.visibilityState === "visible" && asleep) holdScreen(true);',
   'if (document.visibilityState === "visible" && asleep && !eng.reality) holdScreen(true);'],
  ['if (document.visibilityState === "hidden") saveState();',
   'if (document.visibilityState === "hidden"){ scheduleAlarms(); saveState(); }'],
  ["requestAnimationFrame(loop);\n</script>",
   `requestAnimationFrame(loop);
paintAlarmBtn();
if (eng.reality && belt.remembered()) belt.connect(false);   // gemerkter Gurt: still verbinden, nie die Auswahl oeffnen
if (eng.s.asleep) goSleep();                                  // nachts geschlossen, morgens geoeffnet: die Nacht laeuft noch
try { if (eng.reality && localStorage.getItem(GATE_KEY) === "1" && alarmPref() === null) askAlarms(); } catch(e){}
</script>`],
];

export function applyPatches(src) {
  let html = src.replace(/\r\n/g, "\n");
  for (const [find, repl, count = 1] of PATCHES) {
    const n = html.split(find).length - 1;
    if (n !== count) throw new Error(`app-patches: Anker ${n}× statt ${count}× gefunden:\n  ${find.split("\n")[0]}`);
    html = html.split(find).join(typeof repl === "function" ? repl(find) : repl);
  }
  return html;
}
