/* Phase 3: Der Puls des Gurts bewegt die simulierte Person.
   Erweitert den Adapter (app/adapter.js), ohne ihn anzufassen. Ein Minutenmittel
   wird zu einem heartRate-Ereignis ab jetzt (nie rueckwirkend). Kommt laenger als
   BELT_GRACE Minuten kein Wert, faellt die Spur auf Ruhe zurueck und die
   simulierte Bewegung (Alltag, Training) gilt wieder. Der Rueckfall steht im
   Schritt und nicht in der Oberflaeche, damit das Nachrechnen nach einer Pause
   dasselbe ergibt wie ein durchgehender Lauf. */
const BELT_GRACE = 2;

class BeltEngine extends Engine {
  constructor(seed, subjectIndex){ super(seed, subjectIndex); this.beltT = null; }

  /* Mittel der letzten Minute [bpm]. */
  beltBpm(bpm){
    this._setHeartRate([{ t:this.s.t, bpm }]);
    if (this.beltT === null)
      this.events.push({ kind:"state", t:this.s.t, sev:"ok", name:"Puls vom Gurt — du bewegst die Person" });
    this.beltT = this.s.t;
  }

  /* Solange der Gurt gilt, kommt die Bewegung von ihm: kein Alltag, kein Training aus dem Plan. */
  _beginActivity(name, inten, dur, pat){
    if (this.beltT != null) return;
    super._beginActivity(name, inten, dur, pat);
  }

  step(){
    if (this.beltT !== null && this.s.t - this.beltT > BELT_GRACE){
      this._setHeartRate([{ t:this.s.t, bpm:this.p.HRrest }]);
      this.beltT = null;
      this.events.push({ kind:"state", t:this.s.t, sev:"warn", name:"Kein Puls vom Gurt — Bewegung wieder simuliert" });
    }
    super.step();
  }

  snapshot(){ return { ...super.snapshot(), beltT:this.beltT }; }
  restore(core){
    const ok = super.restore(core);
    if (ok) this.beltT = core.beltT ?? null;
    return ok;
  }
}
