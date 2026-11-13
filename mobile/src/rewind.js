/* Phase 5: Pulsluecken rueckwirkend fuellen.
   Reisst der Gurt ab (Handy auf der Bank), merkt sich die App den ganzen
   Engine-Zustand und schreibt ab da jede Eingabe mit. Kommen die Pulswerte
   spaeter aus Apple Health, springt die Engine auf den gemerkten Zustand
   zurueck und rechnet bis jetzt neu: mit dem Puls aus Health fuer die Luecke
   und den mitgeschriebenen Eingaben zur selben Minute wie damals. Die Engine
   ist deterministisch, alles ausser der Luecke kommt also genau gleich heraus.

   Die Luecke wird gespeichert (openGap gibt sie zurueck), damit sie einen
   Neustart der App uebersteht. */

/* Eingaben der Oberflaeche an die Engine. Die Engine ruft keine davon selbst auf. */
const REWIND_INPUTS = ["logMeal", "injectBolus", "setBasal", "startActivity", "cancelPlanned",
  "sleepAlarm", "beltBpm", "setAsleep"];

/* Ganzer Engine-Zustand als JSON. Generisch, damit neue Felder der Website von
   selbst mitkommen. rng haelt nur Funktionen (der Stand ist tick), trace wird
   beim Zurueckspringen gekuerzt statt kopiert. */
function dumpEngine(eng){
  const o = {};
  for (const k of Object.keys(eng)){
    if (k === "rng" || k === "trace") continue;
    const v = eng[k];
    if (typeof v === "function") continue;
    o[k] = v instanceof Float64Array ? { __f64: Array.from(v) } : v instanceof Set ? { __set: [...v] } : v;
  }
  return JSON.stringify(o);
}
function loadEngine(eng, json){
  Object.assign(eng, JSON.parse(json, (_k, v) =>
    v && v.__f64 ? Float64Array.from(v.__f64) : v && v.__set ? new Set(v.__set) : v));
  eng._fault = (eng.sensorFaults || []).find(f => f.open) || null;   // Verweis, kein Abbild
}

/* Eingaben mitschreiben, solange getGap() eine offene Luecke liefert. */
function journalInputs(eng, getGap, onChange){
  let replaying = false;
  for (const n of REWIND_INPUTS){
    const orig = eng[n];
    if (typeof orig !== "function") continue;
    eng[n] = function(...a){
      const g = getGap();
      if (g && !replaying){ g.journal.push({ t:eng.s.t, n, a: JSON.parse(JSON.stringify(a)) }); onChange(); }
      return orig.apply(eng, a);
    };
  }
  return { set replaying(v){ replaying = v; } };
}

function openGap(eng, wall){
  return { t:eng.s.t, wall, state:dumpEngine(eng), journal:[] };
}

/* Minutenmittel aus Rohwerten [{t (Simulationsminute, auch gebrochen), bpm}]. */
function minuteMeans(samples){
  const acc = new Map();
  for (const s of samples){
    const m = Math.floor(s.t), a = acc.get(m) || [0, 0];
    a[0] += s.bpm; a[1]++; acc.set(m, a);
  }
  return [...acc].map(([t, [sum, n]]) => ({ t, bpm: Math.round(sum / n) })).sort((x, y) => x.t - y.t);
}

/* Luecke mit Pulswerten fuellen und bis jetzt neu rechnen. Genommen werden nur
   Minuten ab Beginn der Luecke, in denen der Gurt selbst nichts geliefert hat
   (auch spaetere Abbrueche, solange die Luecke offen ist).
   Gibt { minutes, first, last } zurueck oder null, wenn es nichts einzusetzen gab. */
function fillGap(eng, gap, samples, journal){
  const live = new Set(gap.journal.filter(j => j.n === "beltBpm").map(j => j.t));
  const now = eng.s.t;
  const fill = minuteMeans(samples).filter(m => m.t >= gap.t && m.t < now && !live.has(m.t));
  if (!fill.length) return null;

  const trace = eng.trace;
  loadEngine(eng, gap.state);
  eng.trace = trace.filter(p => p.t <= eng.s.t);
  const todo = fill.map(m => ({ t:m.t, n:"beltBpm", a:[m.bpm] }))
    .concat(gap.journal).sort((x, y) => x.t - y.t);       // stabil: Health vor Eingaben derselben Minute
  journal.replaying = true;
  try {
    let i = 0;
    for (;;){
      while (i < todo.length && todo[i].t <= eng.s.t){ const j = todo[i++]; eng[j.n](...j.a); }
      if (eng.s.t >= now) break;
      eng.step();
    }
  } finally { journal.replaying = false; }

  const first = fill[0].t, last = fill[fill.length - 1].t;
  const ev = { kind:"state", t:first, sev:"ok",
    name:`Puls aus Apple Health nachgetragen · ${fill.length} min` };
  const at = eng.events.findIndex(e => e.t > first);
  eng.events.splice(at < 0 ? eng.events.length : at, 0, ev);
  return { minutes: fill.length, first, last };
}
