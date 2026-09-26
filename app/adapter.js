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
  {n:"Treppenhaus",         i:0.45, d:[4,7]},
  {n:"Wohnung geputzt",     i:0.28, d:[25,45]},
  {n:"Bus verpasst",        i:0.68, d:[4,8]},
  {n:"Spaziergang",         i:0.22, d:[30,55]},
];
const TRAINING = [
  {n:"Basketballtraining",  i:0.75, d:[80,100], w:[35,50]},
  {n:"Krafttraining",       i:0.58, d:[55,75],  w:[30,45]},
  {n:"Dauerlauf",           i:0.55, d:[40,55],  w:[25,40]},
  {n:"Intervalltraining",   i:0.92, d:[28,38],  w:[25,40]},
  {n:"Punktspiel",          i:0.85, d:[70,90],  w:[40,60]},
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
  constructor(seed, subjectIndex = 0){
    if (seed === undefined) seed = (typeof crypto !== "undefined" && crypto.getRandomValues)
      ? crypto.getRandomValues(new Uint32Array(1))[0] >>> 1
      : Math.floor(Math.random() * 2147483647);
    const sub = window.SUBJECTS[subjectIndex];
    this.subjectId = sub.id;
    /* Quellparameter, danach die eine bewusste Nebel-Kalibrierung. */
    this.p = N.nebelParameters(sub.subject);
    this.therapy = sub.therapy;
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
    this._reserve = 1;

    this.s = {
      t: 7*60, G: 0, Gi: 0,
      basalSet: this.therapy.basalRateUPerH,
      basalEff: this.therapy.basalRateUPerH,
      asleep: false, gly: 1, Z: 0, emg: null,
    };
    this.pump = N.flatBasalProfile(this.therapy.basalRateUPerH);
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
                       dur: Math.round(span(a.d, 120+i)), warn: 0 });
    }
    /* Im Reality-Modus plant die Nutzerin ihr Training selbst.
       Alltagsbewegung laeuft weiter — die plant niemand. */
    if (!this.reality){
      const tr = pick(TRAINING, 200);
      this.acts.push({ name:tr.n, inten:tr.i, start: base + 16*60 + Math.floor(u(210)*240),
                       dur: Math.round(span(tr.d, 220)), warn: Math.round(span(tr.w, 230)) });
    }
    this.acts.sort((a,b) => a.start - b.start);
  }

  /* ── Eingaben der Nutzerin ── */
  /* fatEst/protEst: geschaetztes Fett und Eiweiss [g]. Fehlen sie, gilt die
     Voreinstellung des Mahlzeitentyps. Der Schaetzfehler trifft alles gleich:
     eine groessere Portion hat von allem mehr. */
  logMeal(gEst, type = "fast", dur = 0, fatEst, protEst){
    const mt = MEAL_TYPES[type] ?? MEAL_TYPES.fast;
    /* Die geschaetzte Menge ist nicht die gegessene. Genau darum geht es. */
    const err = Math.max(0, 1 + mt.cv * N.normalAt(this.seed + 31, this.tick));
    const fEst = fatEst ?? gEst * mt.fat, pEst = protEst ?? gEst * mt.protein;
    const gReal = gEst * err, fReal = fEst * err, pReal = pEst * err;
    const slowG = gReal * mt.slow, fastG = gReal - slowG;
    const t = this.s.t, eat = Math.max(1, Math.round(dur) || 1);
    this.input.push({ kind:"meal", t, fastCarbsG: fastG, slowCarbsG: slowG,
                      fatG: fReal, proteinG: pReal, durationMin: eat });
    /* truth ist die tatsaechlich gegessene Menge. Der Rueckblick stellt sie
       der Schaetzung gegenueber — das ist die Lehre der Mahlzeit. */
    this.events.push({ kind:"meal", t, est: Math.round(gEst), truth: gReal,
                       fat: Math.round(fEst), protein: Math.round(pEst),
                       fatTruth: fReal, proteinTruth: pReal, type, dur: eat });
    this.meals.push({ t, gEst, gReal, type, label: mt.label });
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
  _beginActivity(name, inten, dur){
    const t = this.s.t, d = Math.max(2, Math.round(dur));
    const bpm = this.p.HRrest + inten*(this.p.HRmax - this.p.HRrest);
    this._setHeartRate([
      { t, bpm }, { t: t + d - 1, bpm }, { t: t + d, bpm: this.p.HRrest },
    ]);
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
      const v = this.lastSensor, tief = v < 80, hoch = v > 280;
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
      this._beginActivity(a.name, a.inten, a.dur);
    }
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
    return { v:1, subjectId:this.subjectId, seed:this.seed,
             z:N.serializeState(this.z), input:this.input,
             reserve:this._reserve, act:this._act, sensorIndex:this._sensorIndex,
             faults:this.sensorFaults, snaps:this._snaps };
  }
  canRestore(core){
    return !!core && core.v === 1 && core.subjectId === this.subjectId && Number.isInteger(core.seed);
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
    this._fault = this.sensorFaults.find(f => f.open) || null;
    this._snaps = core.snaps && core.snaps.length ? core.snaps : [{ t:this.s.t, z:Array.from(this.z) }];
    /* Aeltere Staende kannten Basalaenderungen nur als Pumpenprogramm. */
    this.pump = N.flatBasalProfile(this.therapy.basalRateUPerH);
    if (!this.input.some(e => e.kind === "basal") && Math.abs(this.s.basalSet - this.therapy.basalRateUPerH) > 1e-9)
      this.input.push({ kind:"basal", t:this.s.t, rateUPerH:this.s.basalSet });
    this._sync();
    return true;
  }

  /* ── Ein Simulationsschritt, eine Minute ── */
  /* Eingaben der Engine fuer die Minute [t, t+1) aus einer Ereignisliste.
     Dieselbe Funktion fuer den Lauf und fuer die Vorhersage — sonst rechnet
     die Vorhersage eine andere Vergangenheit nach, als gelaufen ist. */
  _u(t, ev){
    const m = N.mealInputsAt(t, 1, ev);
    return {
      uFastCarbs: m.uFastCarbs, uSlowCarbs: m.uSlowCarbs,
      uProteinGlucose: m.uProteinGlucose, siFactor: m.siFactor,
      uHR: N.heartRateAt(t, ev, this.p.HRrest),
      uInsulin: N.insulinInputAt(t, 1, this.pump, ev),
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
    this.s.Z = N.get(this.z, "EElong");
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
    this._trackFault(v);
    this.trace.push({ t:this.s.t, G:this.s.G, gi:this.s.Gi, sensor:v, born:performance.now() });
    if (this.trace.length > 4032) this.trace.shift();   // 14 Tage

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

    const full = [], insulin = [], food = [], fast = [], slow = [], protein = [], fat = [];
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
      }
      if (t >= end) break;
      const si = N.sensitivityFactor(G, p), I = N.get(z, "I");
      d = rk(d, u.uInsulin - basalMU, si * u.siFactor);
      const gap = si * I * (1 - u.siFactor);
      dx2 = dx2*e2 + p.kb2*gap/p.ka2*(1 - e2);
      dx3 = dx3*e3 + p.kb3*gap/p.ka3*(1 - e3);
      z = N.rk4Step(N.derivatives, z, t, 1, p, u);
    }
    return { from: snap.t, now, end, stride, blood, full, insulin, food, fast, slow, protein, fat };
  }

  /* ── Anzeigezustaende ── */
  activity(){
    const t = this.s.t;
    if (this._act){ const a = this._act;
      return { mode:"live", name:a.name, inten:a.inten,
               left:a.start + a.dur - t, done:(t - a.start)/a.dur }; }
    let next = null;
    for (const a of this.acts)
      if (a.warn && t < a.start && t >= a.start - a.warn && (!next || a.start < next.start)) next = a;
    if (next) return { mode:"soon", name:next.name, inten:next.inten,
                       inMin:next.start - t, dur:next.dur,
                       done:1 - (next.start - t)/next.warn };
    if (this.s.Z > 0.10) return { mode:"after" };
    return { mode:"idle" };
  }

  states(){
    const h = (this.s.t/60) % 24, out = [];
    if (this.reality) out.push({ k:"reality", v:1, txt:"Echtzeit", kombi:true });
    if (this.s.asleep) out.push({ k:"schlaf2", v:1, txt:"Schlaf" });
    if (h >= 23 || h < 6) out.push({ k:"nacht", v:1, txt:"Nacht" });
    if (this.s.Z > 0.10) out.push({ k:"nach1", v:Math.min(1, this.s.Z), txt:"Nachwirkung" });
    if (N.get(this.z, "EEhigh") > 0.15)
      out.push({ k:"nach2", v:Math.min(1, N.get(this.z, "EEhigh")), txt:"Harte Belastung" });
    return out;
  }

  iob(){ return N.insulinOnBoardUnits(this.s.t, this.input); }
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
