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
   Schlafmangel, Krankheit, Alkohol, Fett- und Proteinwelle,
   Sensoralterung, Druckartefakte, Hypo-Gedaechtnis und die daraus
   gebildeten Kombinationen. Alles unbelegte Multiplikatoren, siehe
   docs/10_Engine_Spec_V2_ExtHovorka.md Abschnitt 13. Sie fehlen
   sichtbar statt heimlich weiterzulaufen.
   ══════════════════════════════════════════════════════════════════ */

const N = window.Nebel;
const MGDL = N.MGDL_PER_MMOLL;
const toMgdl = (mmol) => mmol * MGDL;

/* Mahlzeitentypen. tau trifft die Absorptionskonstanten der Engine
   exakt: 20 min schnell, 40 min langsam. Fettig hat in ExtHovorka kein
   Gegenstueck — es laeuft als langsam und ist als Vereinfachung
   gekennzeichnet, keine Fettmodellierung. */
const MEAL_TYPES = {
  fast:  { tau:20, label:"schnell",  cv:0.15, slow:0 },
  mixed: { tau:40, label:"gemischt", cv:0.25, slow:0.65 },
  fatty: { tau:75, label:"fettig",   cv:0.36, slow:1, vereinfacht:true },
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

/* Einziger verbliebener Parameter, den die Oberflaeche liest. */
const P = { tau_i: 110 };

class Engine {
  constructor(seed = 20260812, subjectIndex = 0){
    const sub = window.SUBJECTS[subjectIndex];
    this.subjectId = sub.id;
    this.p = N.withPopulationConstants(sub.subject);
    this.therapy = sub.therapy;
    this.seed = seed;
    this.tick = 0;

    const basalMU = N.basalRateToMUPerMin(this.therapy.basalRateUPerH);
    this.z = N.initialState(this.p, basalMU);

    this.events = [];      // Engine-Ereignisse, append-only
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
    this._reserve = 1;

    this.s = {
      t: 7*60, G: 0, Gi: 0,
      basalSet: this.therapy.basalRateUPerH,
      basalEff: this.therapy.basalRateUPerH,
      asleep: false, gly: 1, Z: 0, emg: null,
    };
    this.pump = N.flatBasalProfile(this.therapy.basalRateUPerH);
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
    const tr = pick(TRAINING, 200);
    this.acts.push({ name:tr.n, inten:tr.i, start: base + 16*60 + Math.floor(u(210)*240),
                     dur: Math.round(span(tr.d, 220)), warn: Math.round(span(tr.w, 230)) });
    this.acts.sort((a,b) => a.start - b.start);
  }

  /* ── Eingaben der Nutzerin ── */
  logMeal(gEst, type = "fast", dur = 0){
    const mt = MEAL_TYPES[type] ?? MEAL_TYPES.fast;
    /* Die geschaetzte Menge ist nicht die gegessene. Genau darum geht es. */
    const err = 1 + mt.cv * N.normalAt(this.seed + 31, this.tick);
    const gReal = Math.max(0, gEst * err);
    const slowG = gReal * mt.slow, fastG = gReal - slowG;
    const t = this.s.t;
    this.events.push({ kind:"meal", t, fastCarbsG: fastG, slowCarbsG: slowG,
                       label: `${Math.round(gEst)} g ${mt.label}` });
    this.meals.push({ t, gEst, gReal, type, label: mt.label });
    return gReal;
  }

  injectBolus(U, share = 1, over = 0){
    const t = this.s.t;
    const now = U * share, ext = U - now;
    if (now > 0) this.events.push({ kind:"bolus", t, units: now, label:`${U.toFixed(1)} U` });
    if (ext > 0 && over > 0)
      this.events.push({ kind:"bolus", t, units: ext, durationMin: over, label:`${ext.toFixed(1)} U verzögert` });
    this._boluses.push({ t, U, share, over });
  }

  setBasal(rate){
    this.s.basalSet = rate;
    this.pump = N.flatBasalProfile(rate);
  }

  startActivity(inten, dur){
    const t = this.s.t;
    const bpm = this.p.HRrest + inten*(this.p.HRmax - this.p.HRrest);
    this.events.push(...N.exerciseBlock(t, Math.max(2, dur), bpm, this.p.HRrest)
      .map((e, i) => i === 0 ? { ...e, label:`Bewegung ${Math.round(inten*100)} %` } : e));
    this._act = { name:"Bewegung", inten, start:t, dur };
  }

  sleepAlarm(kind, value, snoozed){
    if (kind === "sleep") this.s.asleep = !!value;
    if (kind === "wake")  this.s.asleep = false;
    return { kind, value, snoozed };
  }

  setReality(on){ this.reality = !!on; }

  /* ── Ein Simulationsschritt, eine Minute ── */
  step(){
    const t = this.s.t;
    const u = {
      uFastCarbs: 0, uSlowCarbs: 0,
      uHR: N.heartRateAt(t, this.events, this.p.HRrest),
      uInsulin: N.insulinInputAt(t, 1, this.pump, this.events),
    };
    for (const e of this.events){
      if (e.kind !== "meal") continue;
      const overlap = Math.min(t+1, e.t+1) - Math.max(t, e.t);
      if (overlap <= 0) continue;
      u.uFastCarbs += N.gCarbsToMmol(e.fastCarbsG) * overlap;
      u.uSlowCarbs += N.gCarbsToMmol(e.slowCarbsG) * overlap;
    }

    this.z = N.rk4Step(N.derivatives, this.z, t, 1, this.p, u);
    this.tick++;
    this.s.t = t + 1;

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

  /* CGM-Abtastung alle fuenf Minuten. Das Rauschen ist eine
     Nebel-Annahme und steht bis zum Beleg klein. */
  _sample(){
    const noiseSd = 0.08;   // mmol/L — NEBEL-ANNAHME, nicht belegt
    const v = Math.max(40, Math.min(400, Math.round(
      this.s.Gi + toMgdl(noiseSd * N.normalAt(this.seed + 77, Math.floor(this.s.t/5))))));
    this.lastSensor = v;
    this.trace.push({ t:this.s.t, G:this.s.G, gi:this.s.Gi, sensor:v, born:performance.now() });
    if (this.trace.length > 4032) this.trace.shift();   // 14 Tage
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

  iob(){ return N.insulinOnBoardUnits(this.s.t, this.events); }
  cob(){
    const mmol = N.get(this.z,"D1Slow") + N.get(this.z,"D2Slow")
               + N.get(this.z,"D1Fast") + N.get(this.z,"D2Fast");
    return Math.max(0, N.mmolToGCarbs(mmol));
  }
  trend(){ const n=this.trace.length; return n<4?0:(this.trace[n-1].sensor-this.trace[n-4].sensor)/15; }
  tir(){ if(!this.trace.length) return null;
    return this.trace.filter(p=>p.sensor>=70&&p.sensor<=180).length/this.trace.length; }
}
