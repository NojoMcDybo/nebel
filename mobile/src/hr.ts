// Pulsgurt-Messung (Bluetooth 0x2A37) und Minutenmittel. Keine Abhängigkeit von Capacitor.

/** Flags-Byte Bit 0: 0 = BPM als uint8 in Byte 1, 1 = uint16 little-endian in Byte 1–2. Rest wird ignoriert. */
export function parseHeartRate(data: DataView): number | null {
  if (data.byteLength < 2) return null;
  const wide = (data.getUint8(0) & 1) === 1;
  if (wide) return data.byteLength < 3 ? null : data.getUint16(1, true);
  return data.getUint8(1);
}

export interface MinuteMean {
  /** Beginn der Minute, ms seit Epoche */
  minute: number;
  bpm: number;
}

/** Sammelt Sekundenwerte; beim ersten Wert einer neuen Minute kommt das Mittel der vorigen zurück. Rohwerte werden nicht aufbewahrt. */
export class MinuteAverager {
  private minute: number | null = null;
  private sum = 0;
  private n = 0;

  add(ts: number, bpm: number): MinuteMean | null {
    const m = Math.floor(ts / 60000) * 60000;
    let done: MinuteMean | null = null;
    if (this.minute !== null && m !== this.minute) done = this.flush();
    this.minute = m;
    this.sum += bpm;
    this.n += 1;
    return done;
  }

  flush(): MinuteMean | null {
    if (this.minute === null || this.n === 0) return null;
    const out = { minute: this.minute, bpm: Math.round(this.sum / this.n) };
    this.minute = null;
    this.sum = 0;
    this.n = 0;
    return out;
  }
}
