/* Phase 4: Alarme vorausberechnen.
   Die Engine ist deterministisch. Eine Kopie des Laufs wird ohne weitere
   Eingaben bis zu ALARM_HORIZON Minuten weitergerechnet; wo der Sensorwert die
   Grenzen verlaesst, entsteht ein Alarm. Das Handy muss dafuer nicht rechnen,
   waehrend es gesperrt ist: iOS stellt die geplanten Mitteilungen selbst zu.
   Grenzen wie beim Training (TRAIN_LOW, TRAIN_HIGH im Adapter). Bleibt der Wert
   draussen, wiederholt sich der Alarm alle ALARM_REPEAT Minuten, wie bei einem
   echten Sensor. Kommt eine Eingabe dazu, wird neu geplant. */
const ALARM_HORIZON = 720, ALARM_REPEAT = 30;

const alarmSide = v => v < TRAIN_LOW ? "low" : v > TRAIN_HIGH ? "high" : null;

/* Kopie des Laufs: dieselben Teile, die app.html speichert und laedt. */
function cloneRun(eng){
  const idx = Math.max(0, window.SUBJECTS.findIndex(s => s.id === eng.subjectId));
  const c = new BeltEngine(eng.seed, idx);
  const d = JSON.parse(JSON.stringify({ s:eng.s, rng:eng.rng.state(), core:eng.snapshot(),
    acts:eng.acts, reality:eng.reality, lastSensor:eng.lastSensor }));
  Object.assign(c.s, d.s); c.rng.setState(d.rng); c.restore(d.core);
  c.acts = d.acts; c.reality = d.reality; c.lastSensor = d.lastSensor;
  c.variability = eng.variability; c._highSince = eng._highSince;   // „Ganzer Alltag“, nicht im snapshot
  c.trace = []; c.events = [];
  return c;
}

/* [{ t (Simulationsminute), kind "low"|"high", v (Sensor mg/dL) }] */
function planAlarms(eng, horizon = ALARM_HORIZON){
  const c = cloneRun(eng), end = c.s.t + horizon, out = [];
  let side = alarmSide(eng.lastSensor), last = c.s.t;   // laufende Episode: erste Wiederholung in 30 min
  while (c.s.t < end){
    c.step();
    if (c.s.t % 5) continue;                             // der Sensor misst alle fuenf Minuten
    const v = c.lastSensor, sd = alarmSide(v);
    if (sd && (sd !== side || c.s.t - last >= ALARM_REPEAT)){ out.push({ t:c.s.t, kind:sd, v }); last = c.s.t; }
    side = sd;
  }
  return out;
}
