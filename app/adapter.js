/* ══════════════════════════════════════════════════════════════════
   TEIL 1 — SIMULATIONSKERN
   Adapter auf @nebel/engine (ExtHovorka, 16 Zustaende).

   Die Oberflaeche in TEIL 2 wurde nicht umgeschrieben. Sie spricht
   weiterhin dieselbe Schnittstelle wie mit der alten Prototyp-Engine:
   eng.s.t, eng.lastSensor, eng.trace, eng.step(), eng.iob() und so fort.
   Dieser Adapter erfuellt genau diese Schnittstelle und rechnet dahinter
   mit der geprueften Engine.

   Einheiten: die Oberflaeche denkt in mg/dL, die Engine rechnet in
   mmol/L. Umgerechnet wird ausschliesslich hier.

   Was es im Vergleich zum alten Prototyp NICHT mehr gibt: Stress,
   Schlafmangel, Krankheit, Alkohol, Hypo-Gedaechtnis und die daraus
   gebildeten Kombinationen. Alles unbelegte Multiplikatoren, siehe
   docs/10_Engine_Spec_V2_ExtHovorka.md Abschnitt 13. Sie fehlen sichtbar
   statt heimlich weiterzulaufen. Fett und Eiweiss sind zurueck — diesmal
   an Studien kalibriert, in der Engine (docs/11_Fett_und_Eiweiss.md).
   Sensoralterung und Druck auf den Sensor sind zurueck — diesmal
   belegt, im Sensormodell V2 (docs/20_Parameter_Registry.md, Abschnitt 5).
   ══════════════════════════════════════════════════════════════════ */

const N = window.Nebel;
const MGDL = N.MGDL_PER_MMOLL;

/* ── Nebel-Kalibrierung ──────────────────────────────────────────────
   Wo Quellwerte nachweislich nicht zur Wirklichkeit passen, korrigiert die
   Engine sie an genau einer Stelle: engine/src/calibration.ts. Derzeit die
   Sensorverzoegerung tsub (15 -> 5 min) und die Insulinaufnahme tmaxI
   (58–131 -> 50 min). Beleg und Begruendung stehen dort. */
const toMgdl = (mmol) => mmol * MGDL;

/* Mahlzeitentypen. slow ist der Anteil langsamer Kohlenhydrate; er trifft
   die Absorptionskonstanten der Engine (20 min schnell, 40 min langsam).
   fat und protein sind die Voreinstellung fuer Fett und Eiweiss in Gramm pro
   Gramm Kohlenhydrate — die Nutzerin kann sie im Blatt aendern. Grobe
   Richtwerte fuer typische Gerichte, keine Naehrwerttabelle:
     schnell   Traubenzucker, Saft, Gummibaerchen — kein Fett, kein Eiweiss
     gemischt  Brot mit Belag, Nudeln mit Tomatensosse — 0,25 g Fett, 0,3 g Eiweiss
     fettig    Pizza, Burger mit Pommes — 0,45 g Fett, 0,4 g Eiweiss
   Was Fett und Eiweiss im Koerper tun, rechnet die Engine
   (engine/src/nutrition.ts, docs/11_Fett_und_Eiweiss.md). */
const MEAL_TYPES = {
  fast:  { label:"schnell",  cv:0.15, slow:0,    fat:0,    protein:0   },
  mixed: { label:"gemischt", cv:0.25, slow:0.65, fat:0.25, protein:0.3 },
  fatty: { label:"fettig",   cv:0.36, slow:0.65, fat:0.45, protein:0.4 },
};

const ALLTAG = [
  {n:"Zur Uni gelaufen",    i:0.30, d:[18,32]},
  {n:"Einkaufen",           i:0.25, d:[25,45]},
  {n:"Rad zum Bahnhof",     i:0.42, d:[10,18]},
  {n:"Treppenhaus",         i:0.45, d:[4,7],   s:1},   // s: passiert einfach, steht in keinem Tagesplan
  {n:"Wohnung geputzt",     i:0.28, d:[25,45]},
  {n:"Bus verpasst",        i:0.68, d:[4,8],   s:1},
  {n:"Spaziergang",         i:0.22, d:[30,55]},
];
/* Unter oder ueber diesem Sensorwert startet niemand ein geplantes Training.
   Die Bewegungskarte warnt mit denselben Grenzen. */
const TRAIN_LOW = 80, TRAIN_HIGH = 280;
/* Nachwirkung (engine/src/afterEffect.ts): ab 3 % staerkerer Insulinwirkung
   zeigt die Karte sie an, ab 6 % sagen die Reserven „nachtanken". 45 min
   Dauerlauf: rund 12 h sichtbar, davon gut 5 h nachtanken. */
const AFTER_SHOW = 0.03, AFTER_REFUEL = 0.06;
/* ── Achterbahn (nur im ganzen Alltag, eng.variability) ──────────────
   Insulinempfindlichkeit wandert ueber den Tag: glatter Zufallsverlauf mit
   Stuetzstellen alle 4 h, log-normal mit sd 0,25 (rund 25 %). Laut Ruan 2017
   schwankt sie von Tag zu Tag um 38–79 % (doi:10.1109/TBME.2016.2590498),
   laut Visentin 2016 und Hinshaw 2013 ohne festes Tagesmuster, je Person
   anders (doi:10.1109/TBME.2016.2535241, doi:10.2337/db12-1759). Innerhalb
   eines Tages bewusst darunter (NEBEL-ANNAHME): Mit fehlerfreien Boli zu
   3 × 60 g sinkt die Zeit im Ziel ueber 60 Tage so von 93 auf 65 %
   (sd 0,35: 52 %, sd 0,2: 73 %).
   Katheter: Laut Kanapka 2022 scheitern 3,3 % der Sets mit stundenlang hohen
   Werten, im Mittel 5,1 h ueber 250 bis zum Wechsel (doi:10.1089/dia.2021.0548);
   laut Hughes 2023 erleben 41 % mindestens einen Ausfall im Monat und merken
   ihn meist erst am hohen Wert (doi:10.1089/dia.2023.0005). Hier 10 % je
   Tag, damit es in einem gespielten Tag ueberhaupt vorkommt (NEBEL-ANNAHME,
   deutlich haeufiger als in echt). Gewechselt wird nach Kanapkas Kriterium:
   2 h am Stueck ueber 250. */
const SI_SD = 0.25, SI_KNOT = 240, OCC_PER_DAY = 0.10, OCC_LEFT = 0.1;
/* ── Pen statt Pumpe (MDI) ──────────────────────────────────────────
   Langzeitinsulin einmal am Tag. Laut Lepore 2000 ist Glargin spitzenlos,
   wirkt fast 24 h (Ende 22 ± 4 h) und gleicht der Pumpe mit fester Basalrate
   (doi:10.2337/diabetes.49.12.2142). Hier darum: dieselbe Tagesmenge wie die
   Basalrate, gleichmaessig ueber genau 24 h ins Unterhautgewebe (NEBEL-ANNAHME,
   ohne den spaeteren Wirkbeginn). Wer zu spaet spritzt, hat dazwischen kein
   Basal; wer doppelt spritzt, hat doppelt. Die letzte Spritze vor dem Start
   war um 21 Uhr am Vorabend. */
const LONG_MIN = 1440, LONG_FIRST = -180;
/* Basal-IQ (nur Pumpe, abschaltbar): schaltet die Basalrate ab, wenn in
   30 min ein Wert unter 80 mg/dL vorhergesagt wird oder der Sensor unter 70
   zeigt. Weiter, sobald der Sensorwert steigt oder die Vorhersage wieder ab
   80 liegt, spaetestens nach 2 h Pause innerhalb von 2,5 h (FDA-510(k)
   K193483; PROLOG-Studie, doi:10.2337/dc18-0771). Gibt nie mehr Insulin,
   Boli laufen weiter. NEBEL-ANNAHME: Vorhersage als Regressionsgerade durch
   die letzten 4 Sensorwerte (Tandem: 3 der letzten 4, gegen Aussetzer). */
const IQ_PRED = 80, IQ_LOW = 70, IQ_AHEAD = 30, IQ_MAX = 120, IQ_WIN = 150;

/* ── Tagesmodi: ganztaegige Zustaende, nur mit Literatur kalibriert
   (Werte, Quellen und Annahmen in docs/12_Tagesmodi.md).
   Die festen Modi aendern beim Start Parameter, damit Lauf, Vorhersage und
   Rueckblick dieselben Werte rechnen. „Morgen nach Alkohol“ wirkt nur am
   ersten Vormittag und geht darum ueber die Empfindlichkeit in _u.
   Ein Modus gilt fuer die ganze Sitzung; ein Wechsel beginnt neu. */
const DAY_MODES = ["normal", "schwanger", "luteal", "kurznacht", "hitze", "alkohol"];
/* Schwangerschaft: Insulinbedarf relativ zu vorher, Stuetzstellen [Woche, Bedarf].
   Garcia-Patterson 2010 (doi:10.1007/s00125-009-1633-z, 65 Frauen): Spitze in
   Woche 9, Tiefpunkt Woche 16, Spitze Woche 37, dazwischen +4,08 %/Woche.
   Dori-Dayan 2024 (doi:10.1002/dmrr.3771, 185 Schwangerschaften mit Pumpe):
   +42,1 % bis zur Geburt -> Woche 37 = 1,42, Woche 16 = 1,42 / (1 + 21 * 4,08 %).
   NEBEL-ANNAHME: Woche 9 = 1,05 (Hoehe der ersten Spitze nicht berichtet);
   Bedarf wirkt als Empfindlichkeit 1/Bedarf auf alle drei Insulinpfade. */
const PREG = [[0, 1], [9, 1.05], [16, 1.42 / (1 + 21 * 0.0408)], [37, 1.42], [42, 1.42]];
const pregNeed = (w) => {
  for (let i = 1; i < PREG.length; i++){
    const [w1, r1] = PREG[i - 1], [w2, r2] = PREG[i];
    if (w <= w2) return r1 + (r2 - r1) * (w - w1) / (w2 - w1);
  }
  return PREG[PREG.length - 1][1];
};
/* Lutealphase: Empfindlichkeit -2,6 % gegenueber dem Zyklusmittel (Hossmann 2026,
   doi:10.2337/dc26-0692, 77 Personen, 380 Zyklen). */
const LUTEAL_SI = 0.974;
/* Nacht mit 4 h Schlaf: Glukoseinfusion in der Klemme -21 %, nur periphere
   Aufnahme, Leber unveraendert (Donga 2010, doi:10.2337/dc09-2317, 7 Personen).
   Darum nur kb2. NEBEL-ANNAHME: gilt den ganzen Tag (gemessen am Morgen). */
const SLEEP_KB2 = 0.79;
/* Hitzetag: bei 35 statt 20 °C 50-60 % schnellere Aufnahme von Normalinsulin
   (Koivisto 1981, doi:10.1016/0026-0495(81)90122-0, 6 Personen). tmaxI / 1,55.
   NEBEL-ANNAHME: gilt fuer Analoginsulin und den ganzen Tag. */
const HEAT_ABS = 1.55;
/* Morgen nach Alkohol: 0,75 g/kg Wein am Vorabend; nachts kein Unterschied,
   nach dem Fruehstueck Spitze 8,9 statt 15 mmol/L, ab 10 Uhr bei 5 von 6
   Unterzuckerung (Turner 2001, doi:10.2337/diacare.24.11.1888, 6 Personen).
   ALC_SI so kalibriert, dass nach 60 g Fruehstueck mit passendem Bolus um
   8 Uhr 8 der 9 Figuren unter 3,5 mmol/L fallen (5 von 6 bei Turner).
   Die Spitze sinkt damit nur um 13 % statt um 41 %: Fuer die volle Senkung
   braeuchte das Modell x2,15 und alle Figuren fielen bis 18 mg/dL. Die
   Unterzuckerung ist der klinisch wichtige Befund, darum gilt er.
   NEBEL-ANNAHME: Wirkung als Empfindlichkeit, nur 7 bis 13 Uhr. */
const ALC_SI = 1.26, ALC_FROM = 7*60, ALC_TO = 13*60;
const cleanMode = (m) => {
  const id = m && DAY_MODES.includes(m.id) ? m.id : "normal";
  const week = Math.max(6, Math.min(40, Math.round(+(m && m.week) || 24)));
  return id === "schwanger" ? { id, week } : { id };
};

/* p: Belastungsmuster [Minuten, Anteil der HF-Reserve], wiederholt bis zum Ende.
   Fehlt es, bleibt die Belastung gleichmaessig bei i. Mit Muster ist i nur
   die gefuehlte Belastung fuer die Anzeige.
   Kalibriert ueber alle 20 Subjekte gegen 45 min Dauerlauf (-39 mg/dL):
   Wechsel aus kurzen harten und lockeren Phasen senken weniger, Guelfi 2005
   (doi 10.2337/diacare.28.6.1289): -2,9 statt -4,4 mmol/L. Kraft in Saetzen
   senkt etwa halb so stark, Yardley 2013 (doi 10.2337/dc12-0963): -1,6 statt
   -3,4 mmol/L. Eine gleichmaessig harte Linie hob den Wert dagegen an. */
const TRAINING = [
  {n:"Basketballtraining",  i:0.75, d:[80,100], w:[35,50], p:[[1,0.9],[3,0.6]]},
  {n:"Krafttraining",       i:0.58, d:[45,60],  w:[30,45], p:[[1,0.8],[2,0.2]]},
  {n:"Dauerlauf",           i:0.55, d:[40,55],  w:[25,40]},
  {n:"Intervalltraining",   i:0.92, d:[28,38],  w:[25,40], p:[[1,0.9],[2,0.5]]},
  {n:"Punktspiel",          i:0.85, d:[70,90],  w:[40,60], p:[[1,0.92],[3,0.65]]},
];

/* Bleibt fuer die Oberflaeche bestehen, wird aber nicht mehr gefuellt:
   die Faktoren, aus denen Kombinationen entstanden, sind gestrichen. */
const KOMBIS = {};

/* Was die Oberflaeche aus dem alten Parametersatz noch liest.
   tau_sens ist die Sensorverzoegerung — daraus zeichnet die Oberflaeche die
   Nebelzone. Sie kommt aus der Engine (tsub), damit Bild und Rechnung nicht
   auseinanderlaufen koennen. Fehlt sie, wird die Zeichnung NaN und die
   gesamte Anzeige friert ein. */
const P = {
  tau_i:    N.POPULATION_CONSTANTS.tmaxG,
  tau_sens: N.NEBEL_CALIBRATION.tsub,
};

class Engine {
  /* Ohne Seed wuerfelt jede neue Sitzung ihren eigenen: anderer Tagesplan,
     anderer Sensor. Der Zufall ist zaehlerbasiert — mit festem Seed saehe
     jede Sitzung gleich aus, und Variabilitaet (Lernziel 4) waere
     auswendig lernbar. Gespeicherte Sitzungen bringen ihren Seed mit. */
  constructor(seed, subjectIndex = 0, pen = false, mode){
    if (seed === undefined) seed = (typeof crypto !== "undefined" && crypto.getRandomValues)
      ? crypto.getRandomValues(new Uint32Array(1))[0] >>> 1
      : Math.floor(Math.random() * 2147483647);
    const sub = window.SUBJECTS[subjectIndex];
    this.subjectId = sub.id;
    /* Quellparameter, danach die eine bewusste Nebel-Kalibrierung. */
    this.p = N.nebelParameters(sub.subject);
    this.mode = cleanMode(mode);
    { const sc = (k, f) => { this.p = { ...this.p, [k]: this.p[k] * f }; }, id = this.mode.id;
      if (id === "schwanger"){ const f = 1 / pregNeed(this.mode.week); sc("kb1", f); sc("kb2", f); sc("kb3", f); }
      if (id === "luteal"){ sc("kb1", LUTEAL_SI); sc("kb2", LUTEAL_SI); sc("kb3", LUTEAL_SI); }
      if (id === "kurznacht") sc("kb2", SLEEP_KB2);
      if (id === "hitze") sc("tmaxI", 1 / HEAT_ABS); }
    this.therapy = sub.therapy;
    /* Im Modell kippt der Nuechternwert schon bei wenigen Prozent Empfindlichkeit
       (-2,6 % hebt das Tagesmittel um 60 mg/dL). Darum gilt die Basalrate als
       eingestellt: so, dass der Nuechternwert der von vorher bleibt (wie titriertes
       Basal oder AID). KE- und Korrekturfaktor bleiben die alten; der Modus zeigt
       sich rund ums Essen. NEBEL-ANNAHME, docs/12_Tagesmodi.md. */
    if (this.mode.id === "schwanger" || this.mode.id === "luteal" || this.mode.id === "kurznacht"){
      const ig = (p, b) => N.get(N.initialState(p, N.basalRateToMUPerMin(b)), "IG"), b0 = sub.therapy.basalRateUPerH;
      const goal = ig(N.nebelParameters(sub.subject), b0);
      let lo = b0 * 0.3, hi = b0 * 3;
      for (let k = 0; k < 40; k++){ const m = (lo + hi) / 2; if (ig(this.p, m) > goal) lo = m; else hi = m; }
      this.therapy = { ...sub.therapy, basalRateUPerH: (lo + hi) / 2 };
    }
    this.seed = seed;
    this.tick = 0;

    const basalMU = N.basalRateToMUPerMin(this.therapy.basalRateUPerH);
    this.z = N.initialState(this.p, basalMU);

    /* ZWEI Listen, bewusst getrennt:
       input  — Eingaben fuer die Engine (Mahlzeit, Bolus, Herzfrequenz)
       events — Protokoll fuer die Oberflaeche, in deren Format
       Die alte Engine hatte nur eine. Das zu vermischen kostet Anzeige. */
    this.input = [];
    this.events = [];
    this.meals = [];       // Protokoll fuer die Oberflaeche
    this.acts = [];        // geplante und gelaufene Bewegung
    this._boluses = [];
    this.trace = [];
    this.kombi = {};
    this.reality = false;
    this.lastSensor = Math.round(toMgdl(N.get(this.z, "IG")));

    /* Von der Oberflaeche gelesen, hier bewusst leer: die zugehoerigen
       Mechanismen sind nicht Teil von V1. */
    this._seen = {}; this._planned = new Set(); this._illUntil = -1;
    this._ext = []; this._comp = null; this._alcDone = false; this._alcAt = -1;
    this._act = null;
    /* Sensorfehler mit Ursache (Druck im Schlaf). Bewusst NICHT in events:
       live soll die Nutzerin selbst einschaetzen, ob der Abfall echt ist.
       Erst der Rueckblick zeigt diese Liste. */
    this.sensorFaults = [];
    this._fault = null;
    /* Morgens ist der Speicher am tiefsten: unter 70 % zeigt die Karte „hungrig aufgewacht". */
    this._reserve = 0.55;
    /* Achterbahn: aus, bis die Oberflaeche „ganzer Alltag“ setzt. Geplant
       wird trotzdem immer, damit derselbe Seed dieselben Ereignisse hat. */
    this.variability = false;
    this._occ = []; this._highSince = null;
    this.basalIQ = false; this._susp = null;   // laufende Pause: das tempBasal-Ereignis

    this.s = {
      t: 7*60, G: 0, Gi: 0,
      basalSet: this.therapy.basalRateUPerH,
      basalEff: this.therapy.basalRateUPerH,
      asleep: false, gly: 0.55, Z: 0, emg: null,
    };
    /* Pen: keine Pumpe, das Basal kommt aus der Langzeitspritze. */
    this.pen = !!pen;
    this.pump = N.flatBasalProfile(this.pen ? 0 : this.therapy.basalRateUPerH);
    if (this.pen) this.input.push({ kind:"bolus", t:LONG_FIRST, units:this.longDose(), durationMin:LONG_MIN, long:true });
    /* Zustand alle 30 min, damit die Vorhersage die letzten Stunden mit und
       ohne einzelne Entscheidungen nachrechnen kann. */
    this._snaps = [{ t:this.s.t, z:Array.from(this.z) }];
    this.rng = {
      state: () => this.tick,
      setState: (v) => { this.tick = v|0; },
    };
    this._planDay(0);
    this._sync();
    this._sample();
  }

  /* ── Tagesplan: nur Bewegung. Mahlzeiten entstehen aus dem Beduerfnis,
        nicht aus einem Drehbuch. ── */
  _planDay(day){
    const base = day*1440;
    const u = (k) => N.uniformAt(this.seed + day*7919, k);
    const pick = (arr, k) => arr[Math.floor(u(k)*arr.length) % arr.length];
    const span = (r, k) => r[0] + u(k)*(r[1]-r[0]);

    for (let i = 0; i < 2; i++){
      const a = pick(ALLTAG, 100+i);
      this.acts.push({ name:a.n, inten:a.i, start: base + 9*60 + Math.floor(u(110+i)*600),
                       dur: Math.round(span(a.d, 120+i)), warn: 0, spont: !!a.s });
    }
    /* Im Reality-Modus plant die Nutzerin ihr Training selbst.
       Alltagsbewegung laeuft weiter — die plant niemand. */
    if (!this.reality){
      const tr = pick(TRAINING, 200);
      this.acts.push({ name:tr.n, inten:tr.i, pat:tr.p, start: base + 16*60 + Math.floor(u(210)*240),
                       dur: Math.round(span(tr.d, 220)), warn: Math.round(span(tr.w, 230)) });
    }
    this.acts.sort((a,b) => a.start - b.start);
    if (u(300) < OCC_PER_DAY) this._occ.push({ start: base + 8*60 + Math.floor(u(301)*720), end: null });
  }

  /* ── Eingaben der Nutzerin ── */
  /* fatEst/protEst: geschaetztes Fett und Eiweiss [g]. Fehlen sie, gilt die
     Voreinstellung des Mahlzeitentyps. Der Schaetzfehler trifft alles gleich:
     eine groessere Portion hat von allem mehr. */
  /* name: fuer Essen, das andere gemacht haben (Einladung) — die Menge kennt
     dann niemand, die Oberflaeche zeigt nur den Namen. */
  logMeal(gEst, type = "fast", dur = 0, fatEst, protEst, name){
    const mt = MEAL_TYPES[type] ?? MEAL_TYPES.fast;
    /* Die geschaetzte Menge ist nicht die gegessene. Genau darum geht es. */
    const err = Math.max(0, 1 + mt.cv * N.normalAt(this.seed + 31, this.tick));
    const fEst = fatEst ?? gEst * mt.fat, pEst = protEst ?? gEst * mt.protein;
    const gReal = gEst * err, fReal = fEst * err, pReal = pEst * err;
    const slowG = gReal * mt.slow, fastG = gReal - slowG;
    /* Reserven fuellt, was wirklich gegessen wurde, nicht die Schaetzung. */
    this._reserve = this.s.gly = N.eat(this._reserve, N.gCarbsToMmol(gReal));
    const t = this.s.t, eat = Math.max(1, Math.round(dur) || 1);
    this.input.push({ kind:"meal", t, fastCarbsG: fastG, slowCarbsG: slowG,
                      fatG: fReal, proteinG: pReal, durationMin: eat });
    /* truth ist die tatsaechlich gegessene Menge. Der Rueckblick stellt sie
       der Schaetzung gegenueber — das ist die Lehre der Mahlzeit. */
    this.events.push({ kind:"meal", t, est: Math.round(gEst), truth: gReal,
                       fat: Math.round(fEst), protein: Math.round(pEst),
                       fatTruth: fReal, proteinTruth: pReal, type, dur: eat, ...(name ? { name } : {}) });
    this.meals.push({ t, gEst, gReal, type, label: name ?? mt.label });
    return gReal;
  }

  injectBolus(U, share = 1, over = 0){
    const t = this.s.t;
    const now = U * share, ext = U - now;
    if (now > 0) this.input.push({ kind:"bolus", t, units: now });
    if (ext > 0 && over > 0) this.input.push({ kind:"bolus", t, units: ext, durationMin: over });
    /* effective: ExtHovorka kennt keinen Abgabeverlust, aufgenommen ist
       gleich gespritzt. Das Feld bleibt, damit der Rueckblick rechnet. */
    this.events.push({ kind:"bolus", t, units: U, share, over, effective: U });
    this._boluses.push({ t, U, share, over });
  }

  /* Langzeitinsulin (nur Pen): die Tagesmenge, die der Basalrate entspricht. */
  longDose(){ return Math.round(this.therapy.basalRateUPerH * 24); }
  injectLong(U){
    const t = this.s.t;
    this.input.push({ kind:"bolus", t, units:U, durationMin:LONG_MIN, long:true });
    this.events.push({ kind:"long", t, units:U });
  }
  /* Wann die letzte Langzeitspritze war und wann sie aufhoert zu wirken. */
  lastLong(){
    let t = -Infinity;
    for (const e of this.input) if (e.long && e.t > t) t = e.t;
    return t;
  }

  /* Basalaenderung als Ereignis in der Eingabeliste, nicht als neues
     Pumpenprogramm. So bleibt die ganze Basalgeschichte erhalten — die
     Vorhersage muss die Vergangenheit nachrechnen koennen. Zwei Aenderungen
     in derselben Minute: die letzte gilt. */
  setBasal(rate){
    const t = this.s.t;
    this.events.push({ kind:"basal", t, from:this.s.basalSet, to:rate });
    this.s.basalSet = rate;
    for (let i = this.input.length - 1; i >= 0; i--)
      if (this.input[i].kind === "basal" && this.input[i].t === t) this.input.splice(i, 1);
    this.input.push({ kind:"basal", t, rateUPerH: rate });
  }

  startActivity(inten, dur){
    this._beginActivity(`Bewegung ${Math.round(inten*100)} %`, inten, dur);
  }

  /* Eine Einheit beginnt JETZT — selbst gestartet oder aus dem Tagesplan. */
  _beginActivity(name, inten, dur, pat){
    const t = this.s.t, d = Math.max(2, Math.round(dur));
    const hr = f => this.p.HRrest + f*(this.p.HRmax - this.p.HRrest);
    const pts = [];
    if (pat) for (let m = 0; m < d; ) for (const [len, f] of pat)
      for (let k = 0; k < len && m < d; k++, m++) pts.push({ t: t + m, bpm: hr(f) });
    else pts.push({ t, bpm: hr(inten) }, { t: t + d - 1, bpm: hr(inten) });
    pts.push({ t: t + d, bpm: this.p.HRrest });
    this._setHeartRate(pts);
    this.events.push({ kind:"move", t, name, dur: d, inten });
    this._act = { name, inten, start:t, dur:d };
  }

  /* Herzfrequenz ab jetzt neu setzen, ohne die Vergangenheit anzufassen.
     Die Spur ist linear zwischen Stuetzstellen interpoliert. Ein neuer Punkt
     veraendert deshalb auch die Minuten VOR ihm, bis zur vorigen Stuetzstelle.
     Laeuft gerade eine Einheit, wuerde der Rueckblick eine andere Herzfrequenz
     sehen, als live gerechnet wurde. Darum: den Wert der letzten gerechneten
     Minute als Anker festhalten, alles Spaetere verwerfen, dann neu setzen.
     Der Anker liegt auf der alten Strecke, die Vergangenheit bleibt bitgleich. */
  _setHeartRate(points){
    const anchorT = this.s.t - 1;
    const keep = N.heartRateAt(anchorT, this.input, this.p.HRrest);
    for (let i = this.input.length - 1; i >= 0; i--){
      const e = this.input[i];
      if (e.kind === "heartRate" && e.t >= anchorT) this.input.splice(i, 1);
    }
    if (anchorT >= 0) this.input.push({ kind:"heartRate", t:anchorT, bpm:keep });
    for (const p of points) this.input.push({ kind:"heartRate", t:p.t, bpm:p.bpm });
  }

  /* Tagesplan abarbeiten. Training wird angekuendigt; niemand startet es bei
     einem Wert unter 80 oder ueber 280 — es wird verschoben und irgendwann
     abgesagt. Alltagsbewegung findet statt, egal wie der Wert steht: zur Uni
     muss man auch bei 60, und der Bus wartet nicht. Entschieden wird am
     Sensorwert — den sieht die Person, nicht ihren Blutzucker. */
  _runPlan(t){
    for (const a of this.acts){
      if (a.dead || a.logged) continue;
      if (a.warn && !a.announced && t >= a.start - a.warn && t < a.start){
        a.announced = true;
        this.events.push({ kind:"warn", t, name:a.name, inMin:a.start - t });
      }
      if (t !== a.start) continue;
      const busy = !!this._act;
      const v = this.lastSensor, tief = v < TRAIN_LOW, hoch = v > TRAIN_HIGH;
      if (busy && !a.warn){ a.dead = true; continue; }
      if (busy || (a.warn && (tief || hoch))){
        a.tries = (a.tries || 0) + 1;
        if (a.tries <= 3){
          a.start = busy ? this._act.start + this._act.dur + 5 : t + 25;
          a.announced = false;
          this.events.push({ kind:"state", t, sev:"warn",
            name:`${a.name} verschoben — ${busy ? "noch in Bewegung" : `Wert zu ${tief ? "tief" : "hoch"}`}` });
        } else {
          a.dead = true;
          this.events.push({ kind:"state", t, sev:"warn", name:`${a.name} abgesagt` });
        }
        continue;
      }
      a.logged = true;
      this._beginActivity(a.name, a.inten, a.dur, a.pat);
    }
  }

  /* Das angekuendigte Training absagen: weil der Wert nicht passt oder man
     sich heute nicht traut. Auch das gehoert zum Alltag mit Diabetes. */
  cancelPlanned(){
    const a = this._nextPlanned();
    if (!a) return null;
    a.dead = true;
    this.events.push({ kind:"state", t:this.s.t, sev:"ok", name:`${a.name} abgesagt — deine Entscheidung` });
    return a.name;
  }
  _nextPlanned(){
    const t = this.s.t; let next = null;
    for (const a of this.acts)
      if (a.warn && !a.dead && !a.logged && t < a.start && t >= a.start - a.warn && (!next || a.start < next.start)) next = a;
    return next;
  }

  sleepAlarm(kind, value, snoozed){
    if (kind === "alarm")
      this.events.push({ kind:"alarm", t:this.s.t, low: value < 90, value, snoozed:!!snoozed });
    if (kind === "sleep") this.s.asleep = !!value;
    if (kind === "wake")  this.s.asleep = false;
    return { kind, value, snoozed };
  }

  setReality(on){
    this.reality = !!on;
    /* Bereits geplante, noch nicht begonnene Trainings entfallen. */
    if (this.reality) for (const a of this.acts) if (a.warn && !a.logged) a.dead = true;
    this.events.push({ kind:"state", t:this.s.t, sev:"ok",
      name: this.reality ? "Reality-Modus — du planst selbst" : "Reality-Modus beendet" });
  }

  /* ── Speichern und Fortsetzen ──
     Die Oberflaeche speichert ihre Anzeige selbst. Ohne diesen Kern kaeme
     nach dem Neuladen die Physiologie frisch aus dem Gleichgewicht, waehrend
     die Kurve den alten Tag zeigt — und der Echtzeitmodus rechnet die
     verpasste Zeit von einem falschen Zustand aus nach. */
  snapshot(){
    return { v:1, subjectId:this.subjectId, seed:this.seed, pen:this.pen, mode:this.mode,
             z:N.serializeState(this.z), input:this.input,
             reserve:this._reserve, act:this._act, sensorIndex:this._sensorIndex,
             faults:this.sensorFaults, snaps:this._snaps, occ:this._occ };
  }
  canRestore(core){
    return !!core && core.v === 1 && core.subjectId === this.subjectId && Number.isInteger(core.seed)
      && !!core.pen === this.pen          // Pumpe und Pen haben verschiedene Vergangenheiten
      && JSON.stringify(cleanMode(core.mode)) === JSON.stringify(this.mode);   // ebenso die Tagesmodi
  }
  restore(core){
    if (!this.canRestore(core)) return false;
    this.seed = core.seed;
    this.z = N.deserializeState(core.z);
    this.input = core.input || [];
    this._reserve = core.reserve ?? 1;
    this._act = core.act || null;
    this._sensorIndex = core.sensorIndex;
    this.sensorFaults = core.faults || [];
    this._occ = core.occ || [];
    this._fault = this.sensorFaults.find(f => f.open) || null;
    this._susp = this.input.find(e => e.iq && e.t + e.durationMin > this.s.t) || null;
    this._snaps = core.snaps && core.snaps.length ? core.snaps : [{ t:this.s.t, z:Array.from(this.z) }];
    /* Aeltere Staende kannten Basalaenderungen nur als Pumpenprogramm. */
    this.pump = N.flatBasalProfile(this.pen ? 0 : this.therapy.basalRateUPerH);
    if (!this.pen && !this.input.some(e => e.kind === "basal") && Math.abs(this.s.basalSet - this.therapy.basalRateUPerH) > 1e-9)
      this.input.push({ kind:"basal", t:this.s.t, rateUPerH:this.s.basalSet });
    this._sync();
    return true;
  }

  /* ── Ein Simulationsschritt, eine Minute ── */
  /* Eingaben der Engine fuer die Minute [t, t+1) aus einer Ereignisliste.
     Dieselbe Funktion fuer den Lauf und fuer die Vorhersage — sonst rechnet
     die Vorhersage eine andere Vergangenheit nach, als gelaufen ist. */
  /* Faktor auf die Insulinempfindlichkeit, rein aus t und Seed, damit Lauf
     und Vorhersage dieselbe Kurve sehen. Mittel 1, begrenzt auf 0,5–2. */
  _drift(t){
    if (!this.variability) return 1;
    const k = Math.floor(t / SI_KNOT), f = (t - k*SI_KNOT) / SI_KNOT, sm = f*f*(3 - 2*f);
    const a = N.normalAt(this.seed + 501, k), b = N.normalAt(this.seed + 501, k + 1);
    return Math.min(2, Math.max(0.5, Math.exp(SI_SD*(a + (b - a)*sm) - SI_SD*SI_SD/2)));
  }
  /* Tagesmodus mit Zeitfenster: nur „Morgen nach Alkohol“, nur am ersten Vormittag. */
  _modeSI(t){ return this.mode.id === "alkohol" && t >= ALC_FROM && t < ALC_TO ? ALC_SI : 1; }
  /* Anteil des Insulins, der ankommt: 0,1 bei geknicktem Katheter. */
  _deliv(t){
    if (!this.variability || this.pen) return 1;       // ein Pen hat keinen Katheter
    for (const o of this._occ) if (t >= o.start && (o.end == null || t < o.end)) return OCC_LEFT;
    return 1;
  }
  _u(t, ev){
    const m = N.mealInputsAt(t, 1, ev), dr = this._drift(t) * this._modeSI(t);
    /* Insulinsensitivitaet: Fett senkt sie, Bewegung hebt sie fuer Stunden.
       siFat bleibt fuer die Zerlegung der Vorhersage getrennt. */
    return {
      uFastCarbs: m.uFastCarbs, uSlowCarbs: m.uSlowCarbs,
      uProteinGlucose: m.uProteinGlucose, siFat: m.siFactor, siDrift: dr,
      siFactor: m.siFactor * N.afterEffectFactor(t, ev, this.p) * dr,
      uHR: N.heartRateAt(t, ev, this.p.HRrest),
      uInsulin: N.insulinInputAt(t, 1, this.pump, ev) * this._deliv(t),
    };
  }

  step(){
    const t = this.s.t;
    this._runPlan(t);
    this.z = N.rk4Step(N.derivatives, this.z, t, 1, this.p, this._u(t, this.input));
    this.tick++;
    this.s.t = t + 1;
    if (this.s.t % 30 === 0){
      this._snaps.push({ t:this.s.t, z:Array.from(this.z) });
      if (this._snaps.length > 50) this._snaps.shift();     // gut 24 Stunden
    }

    /* Beduerfnisschicht: Reserven, rein Erlebnisebene, keine Physiologie. */
    this._reserve = N.advanceReserve(this._reserve, 1,
      N.get(this.z, "EEfast"), N.get(this.z, "EElong"));

    if (this._act && this.s.t >= this._act.start + this._act.dur) this._act = null;
    if (this.s.t % 1440 === 0) this._planDay(Math.floor(this.s.t/1440));

    this._sync();
    if (this.s.t % 5 === 0) this._sample();
  }

  _sync(){
    const G = N.glucoseFrom(N.get(this.z, "Q1"), this.p.VG);
    this.s.G = toMgdl(G);
    this.s.Gi = toMgdl(N.get(this.z, "IG"));
    this.s.gly = this._reserve;
    /* Nachwirkung: um wie viel Insulin gerade staerker wirkt (0,1 = 10 %). */
    this.s.Z = N.afterEffectFactor(this.s.t, this.input, this.p) - 1;
    this.s.basalEff = this.s.basalSet;
    this.kombi = {};
  }

  /* CGM-Abtastung alle fuenf Minuten, Sensormodell V2: je Sensor ein fester
     Kalibriercharakter, langsame Drift, kleines Zittern. Druck auf den Sensor
     nur, wenn die Person schlaeft — wach liegt niemand auf seinem Arm. */
  _sample(){
    const raw = N.cgmReadingV2(N.NEBEL_SENSOR_V2, this.s.Gi, this.s.t, this.seed + 77, {
      eeFast: N.get(this.z, "EEfast"),
      compression: this.s.asleep,
    });
    const v = Math.max(40, Math.min(400, Math.round(raw)));
    this.lastSensor = v;
    this._highSince = v > 250 ? (this._highSince ?? this.s.t) : null;
    const occ = this.pen ? null : this._occ.find(o => o.end == null && this.s.t >= o.start);
    if (occ && this.variability && this._highSince != null && this.s.t - this._highSince >= 120){
      occ.end = this.s.t;
      this.events.push({ kind:"state", t:this.s.t, name:"Seit 2 Stunden sehr hoch · Katheter gewechselt, er war geknickt" });
    } else if (occ && this.variability && this.s.t - occ.start >= 12*60){
      occ.end = this.s.t;                                    // spaetestens beim naechsten Wechsel
      this.events.push({ kind:"state", t:this.s.t, name:"Katheter gewechselt · er war seit Stunden geknickt" });
    }
    this._trackFault(v);
    this.trace.push({ t:this.s.t, G:this.s.G, gi:this.s.Gi, sensor:v, born:performance.now() });
    if (this.trace.length > 4032) this.trace.shift();   // 14 Tage
    this._basalIQ(v);

    /* Sensorwechsel ins Protokoll — im echten Leben weiss man, wann man ihn
       gesetzt hat. Druck auf den Sensor dagegen NICHT: den muss die Nutzerin
       selbst erkennen. Der Rueckblick deckt ihn auf. */
    const idx = N.sensorAgeAt(N.NEBEL_SENSOR_V2, this.seed + 77, this.s.t).index;
    if (this._sensorIndex === undefined) this._sensorIndex = idx;
    else if (idx !== this._sensorIndex){
      this._sensorIndex = idx;
      this.events.push({ kind:"state", t:this.s.t, name:"Sensor gewechselt — die ersten Stunden rauscht er mehr" });
    }
  }

  /* Basal-IQ: Die Pause ist ein tempBasal mit Faktor 0 in der Eingabeliste,
     zunaechst so lang, wie das 2-h-Limit noch erlaubt. Endet sie frueher,
     wird sie auf die gelaufene Dauer gekuerzt. So rechnen Rueckblick und
     Vorhersage dieselbe Vergangenheit nach. */
  iqPred(){
    const n = this.trace.length;
    if (n < 4) return null;
    const r = this.trace.slice(n - 4).map(p => p.sensor);
    const slope = (-3*r[0] - r[1] + r[2] + 3*r[3]) / 50;       // mg/dL je min, Kleinste Quadrate, 5-min-Abstand
    return (r[0] + r[1] + r[2] + r[3]) / 4 + slope * (7.5 + IQ_AHEAD);
  }
  _iqUsed(t){
    let m = 0;
    for (const e of this.input) if (e.iq) m += Math.max(0, Math.min(t, e.t + e.durationMin) - Math.max(t - IQ_WIN, e.t));
    return m;
  }
  _iqEnd(t){
    const s = this._susp; this._susp = null;
    if (t < s.t + s.durationMin) s.durationMin = t - s.t;
    this.events.push({ kind:"state", t, name:`Basal-IQ · Basal läuft wieder nach ${s.durationMin} min` });
  }
  _basalIQ(v){
    const t = this.s.t, s = this._susp;
    if (s && t >= s.t + s.durationMin) this._iqEnd(t);       // 2-h-Limit erreicht
    if (this.pen || !this.basalIQ){ if (this._susp) this._iqEnd(t); return; }
    const pred = this.iqPred();
    if (pred == null) return;
    if (this._susp){
      const prev = this.trace[this.trace.length - 2].sensor;
      if (v > prev || pred >= IQ_PRED) this._iqEnd(t);
    } else if (pred < IQ_PRED || v < IQ_LOW){
      const left = IQ_MAX - this._iqUsed(t);
      if (left < 5) return;
      this._susp = { kind:"tempBasal", t, durationMin:left, factor:0, iq:true };
      this.input.push(this._susp);
      this.events.push({ kind:"state", t, sev:"warn", name:"Basal-IQ · Basal pausiert, ein Tief droht" });
    }
  }

  /* Druckereignis mitschreiben: Beginn, Ende, tiefster angezeigter Wert und
     was das Blut in diesem Moment tatsaechlich hatte. */
  _trackFault(v){
    const comp = this.s.asleep
      ? N.compressionAt(N.NEBEL_SENSOR_V2, this.seed + 77, this.s.t) : 0;
    const t = this.s.t, G = Math.round(this.s.G);
    if (comp > 0){
      if (!this._fault){
        this._fault = { kind:"druck", t, end:t, open:true, sensorLow:v, bloodAtLow:G, drop:Math.round(comp) };
        this.sensorFaults.push(this._fault);
      } else {
        const f = this._fault;
        f.end = t; f.drop = Math.max(f.drop, Math.round(comp));
        if (v < f.sensorLow){ f.sensorLow = v; f.bloodAtLow = G; }
      }
    } else if (this._fault){
      this._fault.end = t; delete this._fault.open; this._fault = null;
    }
  }

  /* ── Vorhersage ─────────────────────────────────────────────────────
     Was die bisherigen Entscheidungen noch bewirken, wenn ab jetzt keine
     weiteren dazukommen: keine neue Mahlzeit, kein Bolus, kein geplantes
     Training. Was schon laeuft (verzoegerter Bolus, laufende Bewegung,
     geaenderte Basalrate), laeuft weiter.

     blood — Blutzucker ab jetzt, aus dem exakten aktuellen Zustand [mg/dL].
     full  — Blutzucker ab dem Schnappschuss vor pastMin, mit allen
             Entscheidungen nachgerechnet [mg/dL]. Trifft die gelaufene
             Vergangenheit.
     Wirkungen als Raten [mg/dL pro Stunde], gemessen am Blut:
       food, fast, slow — Aufnahme aus dem Darm (D2/tmax), schnell und
             langsam getrennt; die beiden ergeben genau food.
       insulin — wie viel Zucker das Insulin aus deinen Entscheidungen
             gerade aus dem Koerper nimmt: Bolus und Abweichung vom
             Therapie-Basal. Positiv = senkt. Gerechnet ueber eine Kopie
             der Insulinkette (S1, S2, I, x2, x3), die nur diesen Anteil
             traegt — die Kette ist linear im Insulin, der Anteil laesst
             sich deshalb sauber abtrennen.
             Gewertet: Verbrauch im Gewebe (x2·Q2) und gebremste Leber
             (EGP0·x3). Nicht der Transport x1·Q1 — der verschiebt Zucker
             nur zwischen Blut und Gewebe, ein Teil kommt zurueck.
       protein — Glukose aus Eiweiss, die die Leber spaet nachliefert.
       fat  — Zucker, den das Insulin wegen der fettbedingten Resistenz
             NICHT herausnimmt (Wirkung ohne minus mit Resistenz).
       food ist die Summe aus fast, slow, protein und fat.
     Beide Raten sind Bruttofluesse: Essen bringt, Insulin nimmt. Der
     Blutzucker bewegt sich nur um die Differenz (plus Leber, Niere,
     Grundverbrauch).
     Werte alle `stride` Minuten. */
  forecast(pastMin = 360, horizonMin = 720, stride = 5){
    const now = this.s.t, end = now + horizonMin, p = this.p;
    let snap = this._snaps[0];
    for (const sn of this._snaps) if (sn.t <= now - pastMin) snap = sn;
    const perH = MGDL * 60 / p.VG;                       // mmol/min -> mg/dL pro Stunde
    const basalMU = N.basalRateToMUPerMin(this.therapy.basalRateUPerH);
    const ev = this.input;

    const blood = [];
    { let z = Float64Array.from(this.z);
      for (let t = now; ; t++){
        if ((t - now) % stride === 0) blood.push(toMgdl(N.glucoseFrom(N.get(z, "Q1"), p.VG)));
        if (t >= end) break;
        z = N.rk4Step(N.derivatives, z, t, 1, p, this._u(t, ev));
      } }

    /* Insulinkette nur fuer den Anteil aus Entscheidungen */
    const dk = (d, u, si) => [
      u - d[0]/p.tmaxI,
      (d[0] - d[1])/p.tmaxI,
      d[1]/(p.VI*p.tmaxI) - p.ke*d[2],
      p.kb2*si*d[2] - p.ka2*d[3],
      p.kb3*si*d[2] - p.ka3*d[4],
    ];
    const rk = (d, u, si) => {
      const k1 = dk(d, u, si), k2 = dk(d.map((v,i) => v + k1[i]/2), u, si),
            k3 = dk(d.map((v,i) => v + k2[i]/2), u, si), k4 = dk(d.map((v,i) => v + k3[i]), u, si);
      return d.map((v,i) => v + (k1[i] + 2*k2[i] + 2*k3[i] + k4[i])/6);
    };

    const full = [], insulin = [], food = [], fast = [], slow = [], protein = [], fat = [], move = [];
    let z = Float64Array.from(snap.z), d = [0,0,0,0,0];
    /* Fett: die Insulinwirkung, die wegen der fettbedingten Resistenz fehlt.
       Gerechnet wird direkt die Luecke dx = x(ohne Resistenz) − x(echt) fuer
       x2 und x3. Sie gehorcht dx' = kb·si·I·(1 − siFactor) − ka·dx, getrieben
       vom tatsaechlichen Plasmainsulin — ohne Fett bleibt sie exakt null.
       Start aus dem Snapshot: dx = x·(1/siFactor − 1), im Gleichgewicht exakt,
       sonst klingt der Fehler mit 1/ka2 und 1/ka3 in unter einer Stunde ab. */
    const sf0 = N.mealInputsAt(snap.t, 1, ev).siFactor;
    let dx2 = N.get(z, "x2") * (1/sf0 - 1), dx3 = N.get(z, "x3") * (1/sf0 - 1);
    const e2 = Math.exp(-p.ka2), e3 = Math.exp(-p.ka3);
    for (let t = snap.t; ; t++){
      const u = this._u(t, ev);
      const G = N.glucoseFrom(N.get(z, "Q1"), p.VG), Q2 = N.get(z, "Q2");
      if ((t - snap.t) % stride === 0){
        full.push(toMgdl(G));
        const f = N.get(z, "D2Fast")/p.tmaxGFast * perH, sl = N.get(z, "D2Slow")/p.tmaxG * perH;
        const pr = u.uProteinGlucose * perH;
        const ft = Math.max(0, (dx2*Q2 + p.EGP0*dx3) * perH);
        fast.push(f); slow.push(sl); protein.push(pr); fat.push(ft); food.push(f + sl + pr + ft);
        insulin.push((d[3]*Q2 + p.EGP0*d[4]) * perH);
        /* Bewegung, mit Vorzeichen: Leber gibt mehr ab (hart: Stresshormone),
           Muskeln nehmen auf, und die Nachwirkung laesst alles Insulin staerker
           wirken. Die Nachwirkung steht deshalb hier und nicht beim Insulin. */
        const EEf = N.get(z, "EEfast"), EEh = N.get(z, "EEhigh"), EEl = N.get(z, "EElong");
        const x2 = N.get(z, "x2"), x3 = N.get(z, "x3"), ae = u.siFactor / (u.siFat * u.siDrift);
        const liver = p.EGP0 * (1 - x3) * (p.p1*EEf + p.p2*EEh);
        const muscle = p.p4*EEf + p.p5*x2*EEl;
        const after = (x2*Q2 + p.EGP0*x3) * (1 - 1/ae);
        move.push((liver - muscle - after) * perH);
      }
      if (t >= end) break;
      const si = N.sensitivityFactor(G, p), I = N.get(z, "I");
      d = rk(d, u.uInsulin - basalMU, si * u.siFat * u.siDrift);
      const gap = si * I * (u.siFactor / u.siFat) * (1 - u.siFat);   // nur der Fettanteil
      dx2 = dx2*e2 + p.kb2*gap/p.ka2*(1 - e2);
      dx3 = dx3*e3 + p.kb3*gap/p.ka3*(1 - e3);
      z = N.rk4Step(N.derivatives, z, t, 1, p, u);
    }
    return { from: snap.t, now, end, stride, blood, full, insulin, food, fast, slow, protein, fat, move };
  }

  /* ── Anzeigezustaende ── */
  activity(){
    const t = this.s.t;
    if (this._act){ const a = this._act;
      return { mode:"live", name:a.name, inten:a.inten,
               left:a.start + a.dur - t, done:(t - a.start)/a.dur }; }
    const next = this._nextPlanned();      // abgesagte nicht mehr ankuendigen
    if (next) return { mode:"soon", name:next.name, inten:next.inten,
                       inMin:next.start - t, dur:next.dur,
                       done:1 - (next.start - t)/next.warn };
    if (this.s.Z >= AFTER_SHOW) return { mode:"after", pct: Math.round(this.s.Z*100) };
    return { mode:"idle" };
  }

  states(){
    const h = (this.s.t/60) % 24, out = [];
    if (this.reality) out.push({ k:"reality", v:1, txt:"Echtzeit", kombi:true });
    { const m = this.mode.id;
      if (m === "schwanger") out.push({ k:"tag", v:1, txt:`Woche ${this.mode.week}`, kombi:true });
      if (m === "luteal") out.push({ k:"tag", v:1, txt:"Zweite Zyklushälfte", kombi:true });
      if (m === "kurznacht") out.push({ k:"tag", v:1, txt:"4 h geschlafen", kombi:true });
      if (m === "hitze") out.push({ k:"tag", v:1, txt:"Hitze", kombi:true });
      if (m === "alkohol" && this.s.t < ALC_TO) out.push({ k:"tag", v:1, txt:"Nach Alkohol", kombi:true }); }
    if (this.s.asleep) out.push({ k:"schlaf2", v:1, txt:"Schlaf" });
    if (h >= 23 || h < 6) out.push({ k:"nacht", v:1, txt:"Nacht" });
    if (!this._act && this.s.Z >= AFTER_SHOW)
      out.push({ k:"nach1", v:Math.min(1, this.s.Z/0.15), txt:"Nachwirkung" });
    if (N.get(this.z, "EEhigh") > 0.15)
      out.push({ k:"nach2", v:Math.min(1, N.get(this.z, "EEhigh")), txt:"Harte Belastung" });
    /* Nur Anzeige, keine Physiologie (docs/08_Beduerfnisse_und_Hunger.md). */
    if (N.isHeisshunger(this._reserve, N.get(this.z, "EEfast")))
      out.push({ k:"hunger", v:1, txt:"Heißhunger" });
    return out;
  }

  iob(){ return N.insulinOnBoardUnits(this.s.t, this.pen ? this.input.filter(e => !e.long) : this.input); }
  /* Kohlenhydrate aktiv: im Darm (D1, D2) plus, was nach fettem Essen noch
     im Magen liegt. Eiweiss zaehlt nicht mit — es ist kein Kohlenhydrat. */
  cob(){
    const mmol = N.get(this.z,"D1Slow") + N.get(this.z,"D2Slow")
               + N.get(this.z,"D1Fast") + N.get(this.z,"D2Fast");
    return Math.max(0, N.mmolToGCarbs(mmol) + N.carbsInStomachG(this.s.t, this.input));
  }
  trend(){ const n=this.trace.length; return n<4?0:(this.trace[n-1].sensor-this.trace[n-4].sensor)/15; }
  tir(){ if(!this.trace.length) return null;
    return this.trace.filter(p=>p.sensor>=70&&p.sensor<=180).length/this.trace.length; }
}
