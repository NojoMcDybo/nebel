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
  <p class="hint">Leg das Handy weg und sperr es. nebel. rechnet weiter, auch wenn die App zu ist. Hast du den Wecker erlaubt, klingelt es wie der iPhone-Wecker, auch im Lautlos-Modus. Sonst kommt eine Mitteilung, und Lautlos oder ein Fokus können sie stumm schalten.</p>
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
  paintLive();
}
function appReality(){
  if (alarmPref() === null) askAlarms(); else alarmDirty = true;
  if (belt.remembered()) belt.connect(false);
}

/* Pulsgurt: jede Sekunde ein Wert, die Engine bekommt ein Mittel pro Minute als
   heartRate-Ereignis (BeltEngine). Rohwerte bleiben nicht erhalten.
   Bei gesperrtem iPhone laufen die Gurtwerte weiter ins JavaScript (Test 13.11.2026:
   60 je Minute), die Bildschleife aber nicht. Deshalb rechnet jeder Wert die
   Simulation selbst bis jetzt nach, plant die Alarme neu und sichert den Stand. */
var beltState = "aus", beltMsg = "", beltBpmNow = 0;
const beltAvg = new NebelBelt.MinuteAverager();

/* Eigener Ruhepuls: Der Gurt misst dich, nicht die simulierte Person. Ins Modell geht
   dein Puls um den Unterschied der Ruhepulse verschoben (eng.beltToBody). Quelle:
   Apple Health (Mittel der letzten 7 Tage, meist von der Watch), sonst eigene Messung
   aus den Gurtminuten (BeltEngine.restFrom). Nur auf dem Geraet, unter REST_KEY.
   Vorrang: eigene Messung per Knopf, dann Health, dann die Gurtminuten (ab 30).
   setOwnRest schreibt rewind.js mit, ein neuer Wert darf also sofort gelten. */
const REST_KEY = "nebel.ruhepuls.v1";     // { measured, measuredAt, health: bpm|null, healthDay, mins: [Gurt-Minutenmittel] }
var rest = (() => { try { return JSON.parse(localStorage.getItem(REST_KEY)) || {}; } catch(e){ return {}; } })();
rest.mins = Array.isArray(rest.mins) ? rest.mins : [];
var restNow = null;                       // { bpm, src: "gemessen" | "Health" | "Gurt" }
function saveRest(){ try { localStorage.setItem(REST_KEY, JSON.stringify(rest)); } catch(e){} }
function applyRest(){
  const m = BeltEngine.restFrom(rest.mins, 30);
  restNow = rest.measured ? { bpm: rest.measured, src: "gemessen" }
    : rest.health ? { bpm: Math.round(rest.health), src: "Health" }
    : m != null ? { bpm: m, src: "Gurt" } : null;
  BeltEngine.ownRest = restNow ? restNow.bpm : null;
  eng.setOwnRest(BeltEngine.ownRest);
}
async function restFromHealth(){
  if (rest.healthDay === new Date().toDateString()) return;   // einmal am Tag reicht
  try {
    if (!healthAsked){ healthAsked = true; await health.ask(); }
    const r = await health.restingHeartRate({ days: 7 });
    rest.health = r.bpm >= 35 && r.bpm <= 110 ? r.bpm : null;
    rest.healthDay = new Date().toDateString(); saveRest();
    if (rest.health && !rest.measured && (!restNow || restNow.src !== "Health")){ applyRest(); lastMoveHTML = ""; paintMove(); }
  } catch(e){ /* Health nicht erlaubt: eigene Messung */ }
}
function onBeltReady(){ restFromHealth(); }

/* Ruhepulsmessung per Knopf neben „Pulsgurt verbinden“: zwei Minuten still sitzen, der
   Gurt liefert jede Sekunde einen Wert. Ergebnis ist das niedrigere der beiden
   Minutenmittel (die erste Minute ist oft noch unruhig). Gilt sofort. */
const REST_SECS = 120;
var restRun = null;                       // { t0, samples: [{ t, bpm }], iv }
function restBtnPaint(){
  const b = $("btnRest");
  if (restRun){
    const left = Math.max(0, REST_SECS - Math.floor((Date.now() - restRun.t0) / 1000));
    b.textContent = \`Abbrechen · \${Math.floor(left / 60)}:\${String(left % 60).padStart(2, "0")} · \${beltBpmNow} bpm\`;
  } else b.textContent = !restNow ? "Ruhepuls messen"          // ohne Gurt steht „Pulsgurt verbinden“ daneben: kurz halten
    : beltState === "verbunden" ? \`Ruhepuls \${restNow.bpm} · neu messen\` : \`Ruhepuls \${restNow.bpm}\`;
  b.disabled = !restRun && beltState !== "verbunden";
}
function restStop(msg){
  clearInterval(restRun.iv); restRun = null; restBtnPaint();
  if (msg) toast("move", msg, $("moveCard"));
}
function restTick(){
  if (!restRun) return;
  if (beltState !== "verbunden") return restStop("Messung abgebrochen: Gurt getrennt");
  if (Date.now() - restRun.t0 < REST_SECS * 1000) return restBtnPaint();
  const t0 = restRun.t0, s = restRun.samples, mean = a => a.reduce((q, x) => q + x.bpm, 0) / a.length;
  const a = s.filter(x => x.t - t0 < 60000), b = s.filter(x => x.t - t0 >= 60000);
  if (a.length < 30 || b.length < 30) return restStop("Messung ungültig: zu wenig Werte vom Gurt");
  const bpm = Math.round(Math.min(mean(a), mean(b)));
  if (bpm < 35 || bpm > 110) return restStop(\`Messung ungültig: \${bpm} bpm\`);
  rest.measured = bpm; rest.measuredAt = Date.now(); saveRest(); applyRest();
  restStop(\`Ruhepuls gemessen: \${bpm} bpm\`);
  lastMoveHTML = ""; paintMove();
}
$("btnRest").onclick = () => {
  if (restRun) return restStop("Messung abgebrochen");
  if (beltState !== "verbunden") return toast("move", "Erst den Pulsgurt verbinden", $("moveCard"));
  restRun = { t0: Date.now(), samples: [], iv: setInterval(restTick, 1000) };
  toast("move", "Zwei Minuten ruhig sitzen", $("moveCard"));
  restBtnPaint();
};
function catchUp(){
  if (!eng.reality || !anchor) return;
  let n = Math.min(4320, Math.floor(anchor.simT + (Date.now() - anchor.wall)/60000 - eng.s.t));
  while (n-- > 0) eng.step();
}
function onBeltBpm(bpm){
  beltBpmNow = bpm;
  if (restRun) restRun.samples.push({ t: Date.now(), bpm });
  liveBpm(bpm);
  if (!eng.reality) return;
  catchUp();                                               // Puls zur richtigen Minute, auch im Hintergrund
  const now = Date.now();
  if (eng.beltT == null) eng.beltBpm(bpm);                 // erster Wert gilt sofort
  const m = beltAvg.add(now, bpm);
  if (!m) return;
  if (now - m.minute < 120000){                            // veraltete Reste nach einer Pause nicht nehmen
    eng.beltBpm(m.bpm);
    rest.mins.push(m.bpm); if (rest.mins.length > 3000) rest.mins.splice(0, rest.mins.length - 3000);
    saveRest();
  }
  if (document.visibilityState === "hidden"){              // einmal pro Minute: Alarme und Stand
    if (eng.s.t - alarmT >= 5) scheduleAlarms();
    paintLive();
    saveState();
  }
}
const belt = NebelBelt.createBelt({
  onBpm: onBeltBpm,
  onStatus(state, name, msg){
    if (state === "getrennt") beltLost();
    if (state === "verbunden"){ tryFillGap(); onBeltReady(); }
    beltState = state; beltMsg = msg; if (state === "aus") beltBpmNow = 0; lastMoveHTML = ""; paintMove();
  },
});
$("btnBelt").onclick = () => belt.connect(true);

/* Luecken aus Apple Health (rewind.js): Reisst der Gurt ab, wird der ganze Zustand
   gesichert und jede Eingabe mitgeschrieben. Beim Oeffnen der App und beim
   Wiederverbinden holt sie den Puls der Luecke aus Health und rechnet ab dort neu. */
const GAP_KEY = "nebel.gap.v1";
var gap = null, filling = false, healthAsked = false, health = NebelBelt.health;
try { gap = JSON.parse(localStorage.getItem(GAP_KEY)); } catch(e){}
function saveGap(){ try { gap ? localStorage.setItem(GAP_KEY, JSON.stringify(gap)) : localStorage.removeItem(GAP_KEY); } catch(e){} }
const rewindJ = journalInputs(eng, () => gap, saveGap);
function beltLost(){
  if (!eng.reality || !anchor || gap || eng.beltT == null) return;
  catchUp(); gap = openGap(eng, Date.now()); saveGap();
}
async function tryFillGap(){
  if (!gap || filling || !eng.reality || !anchor || document.visibilityState !== "visible") return;
  if (Date.now() - gap.wall > 3*864e5){ gap = null; saveGap(); return; }   // shortcut: nach drei Tagen aufgeben
  filling = true;
  try {
    if (!healthAsked){ healthAsked = true; await health.ask(); }
    const { samples } = await health.heartRate({ from: gap.wall - 120000, to: Date.now() });
    if (!samples.length) return;
    catchUp();
    const a = anchor, r = fillGap(eng, gap, samples.map(s => ({ t: a.simT + (s.t - a.wall)/60000, bpm: s.bpm })), rewindJ);
    if (!r) return;
    gap = null; saveGap();
    lastCount = -1; lastMoveHTML = ""; renderLog(); saveState();
    toast("move", \`Puls aus Health nachgetragen: \${fmtT(r.first)}–\${fmtT(r.last + 1)}\`, $("moveCard"));
  } catch(e){ /* Health nicht erlaubt oder keine App: Luecke bleibt offen */ }
  finally { filling = false; }
}
setInterval(tryFillGap, 120000);          // Zepp schreibt das Training oft erst nach ein paar Minuten

/* Live-Aktivitaet auf dem Sperrbildschirm: in Reality mit jedem neuen Sensorwert
   (alle 5 min), auch bei gesperrtem iPhone ueber die Gurtwerte. Starten kann sie
   nur die geoeffnete App; beim Oeffnen wird deshalb neu angestossen (liveN = -1).
   liveN 0 beim Start: ein Rest aus einer frueheren Reality-Sitzung wird beendet.
   Der Puls laeuft live mit: jeder neue Gurtwert (1 pro Sekunde) aendert nur bpm. */
var liveN = 0, liveAct = NebelBelt.live, liveLast = null;
function liveBpm(bpm){
  if (!liveAct || !liveLast || liveN === null || bpm === liveLast.bpm) return;
  liveLast.bpm = bpm; liveLast.hard = liveHard(eng.beltToBody(bpm));
  liveAct.update(liveLast).catch(() => {});
}
/* Zone wie in der Engine (heartRateReserve): ueber der ventilatorischen Schwelle = anaerob.
   bpm im Massstab der Person, Gurtwerte also vorher durch eng.beltToBody. */
const liveHard = bpm => (bpm - eng.p.HRrest) / (eng.p.HRmax - eng.p.HRrest) > eng.p.VT_HRR;
const LIVE_ARROW = { 3:"⇈", 2:"↑", 1:"↗", 0:"→", [-1]:"↘", [-2]:"↓", [-3]:"⇊" };
function paintLive(){
  if (!liveAct) return;                   // paintApp kann vor dieser Stelle laufen
  if (!eng.reality || !anchor){
    if (liveN !== null){ liveN = null; liveLast = null; liveAct.end().catch(() => {}); }
    return;
  }
  const trc = eng.trace, last = trc[trc.length - 1];
  if (!last || trc.length === liveN) return;
  liveN = trc.length;
  const v = eng.lastSensor, dlt = trc.length >= 2 ? v - trc[trc.length - 2].sensor : 0;
  const bpm = eng.beltT != null ? beltBpmNow : Math.round(N.heartRateAt(last.t, eng.input, eng.p.HRrest));
  liveAct.update(liveLast = {
    value: bgv(v), unit: UL(), arrow: LIVE_ARROW[trendClass(eng.trend())],
    tone: v < 70 ? "low" : v > 180 ? "high" : "ok", name: PERSON.name,
    delta: dlt === 0 ? "0" : (dlt > 0 ? "+" : "−") + bgd(Math.abs(dlt)),   // wie bgDelta in der App
    bpm, hard: liveHard(eng.beltT != null ? eng.beltToBody(bpm) : bpm), dark: document.documentElement.dataset.theme === "dark",
    at: anchor.wall + (last.t - anchor.simT)*60000,
    points: trc.slice(-13).map(p => p.sensor),
  }).catch(() => {});
}

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
    short: \`\${a.kind === "low" ? "Tief" : "Hoch"} · \${who} \${bgv(a.v)} \${UL()} · simuliert\`,
  })));
}

/* Daily Dose (intern ks*, frueher Klarsicht) in der App: Teilen ueber das iOS-Blatt (Bild
   und Text) und eine Mitteilung um 8 Uhr fuer jeden noch nicht gespielten Tag der naechsten
   Woche. Ein Tipp darauf oeffnet den Tag (#daily). */
if (window.Capacitor && Capacitor.isNativePlatform()) $("ksShare").onclick = async () => {
  const e = ksCur; if (!e) return;
  try { await NebelBelt.share.share({ text: ksText(e), png: ksCanvas(e).toDataURL("image/png").split(",")[1] }); }
  catch(err){ toast("basal", "Teilen ging nicht", null); }
};
var ksMornKey = null;
function ksMorning(){
  const out = [];
  if (KSD.consent === true) for (let i = 0; i < 8; i++){
    const at = new Date(); at.setDate(at.getDate() + i); at.setHours(8, 0, 0, 0);
    const d = ksDay(ksDate(at)), p = PERSONAS.find(x => x.id === d.person);
    if (at.getTime() > Date.now() && !ksPlayed(d.date))
      out.push({ at: at.getTime(), title: \`Daily Dose of T1D #\${d.nr} ist da\`, body: \`Heute: \${p ? p.name : "neue Person"}, \${ksModeTxt(d.mode)}. Ein Tag, ein Versuch.\` });
  }
  const key = JSON.stringify(out);
  if (key === ksMornKey) return;
  ksMornKey = key; NebelAlarms.morning(out);
}
NebelAlarms.onOpen(h => { if (!location.hash.includes(h)){ saveState(); location.hash = h; location.reload(); } });

`;

/** [Anker, Ersatz, Anzahl (Standard 1)] */
export const PATCHES = [
  // Design umgeschaltet: Live-Aktivitaet gleich mitziehen
  ['try { localStorage.setItem("nebel.theme", root.dataset.theme); } catch (e) {}', (m) => m + " liveN = -1; paintLive();"],

  // Abstaende: Seiteninhalt unter der Statusleiste, Website-Teile ohne Ziel in der App ausblenden
  [".page > .inner{width:100%; max-width:460px; padding:0 20px 1px; align-self:flex-start; min-height:100%}",
   (m) => m + CSS],
  ['<p class="legal"><a href="rechtliches.html">Impressum · Datenschutz · Lizenzen</a> · <a href="en/" lang="en" hreflang="en">English</a></p>',
   '<p class="legal"><a href="rechtliches.html">Impressum · Datenschutz · Lizenzen</a> · <a href="puls.html">Pulsgurt-Test</a></p>', 2],

  // Oberflaeche: Alarmknopf, Gurtzeile in der Bewegungskarte, Nachtblatt, Hinweis im Reality-Blatt
  ['<button class="btn soft wide" id="btnSleep">Schlafen gehen</button>',
   (m) => m + '\n      <button class="btn line wide" id="btnAlarm" style="display:none">Alarme: an</button>'],
  ['<button class="mvx" id="mvCancel" type="button" hidden>Training absagen</button>',
   (m) => m + '\n      <div class="sub" id="mvSrc" style="margin-top:12px;display:none"></div>' +
              '\n      <div style="display:flex;gap:10px;flex-wrap:wrap">' +
              '<button class="mvx" id="btnBelt" type="button" style="display:none;flex:1 1 0;white-space:nowrap">Pulsgurt verbinden</button>' +
              '<button class="mvx" id="btnRest" type="button" style="display:none;flex:1 1 0;white-space:nowrap">Ruhepuls messen</button></div>'],
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
  if (eng.reality) put("mvSrc", belted ? \`Quelle: Pulsgurt · \${beltBpmNow} bpm · \${restNow ? \`Ruhepuls \${restNow.bpm} (\${restNow.src})\` : "Ruhepuls unbekannt"}\`
    : beltState === "suche" ? "Quelle: simuliert · suche Pulsgurt …"
    : beltState === "getrennt" ? "Quelle: simuliert · " + (beltMsg || "Gurt getrennt, verbinde neu …")
    : "Quelle: simuliert" + (beltMsg ? " · " + beltMsg : ""));
  $("mvSrc").style.display = eng.reality ? "" : "none";
  $("btnBelt").style.display = eng.reality && !belted ? "" : "none";
  $("btnRest").style.display = eng.reality ? "" : "none"; restBtnPaint();`],
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
  ["asleep = false; eng.s.asleep = false; alarmOn = false;", "asleep = false; eng.setAsleep(false); alarmOn = false; alarmDirty = true;"],
  ["asleep = true; eng.s.asleep = true;", "asleep = true; eng.setAsleep(true);   // App: Methode, damit rewind.js sie mitschreibt"],
  ['$("btnSleep").onclick = guarded(goSleep);',
   `$("btnSleep").onclick = guarded(() => {
  if (!eng.reality) return goSleep();
  $("nightTxt").textContent = alarmsOn
    ? \`Fällt der Wert von \${PERSON.name} unter \${bgv(TRAIN_LOW)} oder steigt über \${bgv(TRAIN_HIGH)} \${UL()}, klingelt dein iPhone. Auch um drei Uhr nachts. Die Alarme kannst du jederzeit abschalten.\`
    : "Die Alarme sind aus. Du wirst heute Nacht nicht geweckt, und nebel. rechnet trotzdem weiter.";
  openSheet("sheetNight");
});
$("nightOK").onclick = () => { closeSheets(); goSleep(); };`],

  // Klarsicht: jede Aenderung (Zustimmung, gespielter Tag) plant die Morgen-Mitteilungen neu
  ["const ksSave = () => { try { localStorage.setItem(KS_KEY, JSON.stringify(KSD)); } catch(e){} };",
   "const ksSave = () => { try { localStorage.setItem(KS_KEY, JSON.stringify(KSD)); } catch(e){} setTimeout(ksMorning, 0); };"],

  // Start
  ["/* ─── Start ───", (m) => APP_JS + m],
  ["if (eng.reality) setAnchor();",
   `if (eng.reality && !anchor) setAnchor();
if (eng.reality){ speed = 1; [...$("speed").children].forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.x === 1))); }`],
  ['if (document.visibilityState === "visible" && asleep) holdScreen(true);',
   'if (document.visibilityState === "visible" && asleep && !eng.reality) holdScreen(true);'],
  ['if (document.visibilityState === "hidden") saveState();',
   'if (document.visibilityState === "hidden"){ scheduleAlarms(); saveState(); } else { tryFillGap(); liveN = -1; paintLive(); }'],
  ["requestAnimationFrame(loop);\n</script>",
   `requestAnimationFrame(loop);
paintAlarmBtn();
applyRest();
ksMorning();
tryFillGap();
paintLive();
if (eng.reality && belt.remembered()) belt.connect(false);   // gemerkter Gurt: still verbinden, nie die Auswahl oeffnen
if (eng.s.asleep) goSleep();                                  // nachts geschlossen, morgens geoeffnet: die Nacht laeuft noch
try { if (eng.reality && localStorage.getItem(GATE_KEY) === "1" && (alarmPref() === null || alarmsOn)) askAlarms(); } catch(e){}   // alarmsOn: einmal nach dem Wecker fragen (AlarmKit), sonst still
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
