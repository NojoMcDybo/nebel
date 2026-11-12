import { describe, expect, it } from "vitest";
import { MinuteAverager, parseHeartRate } from "../src/hr";

const view = (...b: number[]) => new DataView(new Uint8Array(b).buffer);

describe("parseHeartRate", () => {
  it("liefert jeden 8-Bit-Wert unverändert (Flags 0, Rest ignoriert)", () => {
    for (let v = 0; v <= 255; v++) {
      expect(parseHeartRate(view(0x00, v))).toBe(v);
      expect(parseHeartRate(view(0x16, v, 0xaa, 0xbb, 0xcc))).toBe(v);
    }
  });

  it("liefert jeden 16-Bit-Wert unverändert (little-endian)", () => {
    for (let v = 0; v <= 0xffff; v++) {
      expect(parseHeartRate(view(0x01, v & 0xff, v >> 8))).toBe(v);
    }
  });

  it("gibt bei zu kurzen Daten null zurück statt abzustürzen", () => {
    expect(parseHeartRate(view())).toBeNull();
    expect(parseHeartRate(view(0x00))).toBeNull();
    expect(parseHeartRate(view(0x01))).toBeNull();
    expect(parseHeartRate(view(0x01, 0x40))).toBeNull();
  });
});

describe("MinuteAverager", () => {
  it("gibt das Mittel erst beim Wechsel in die nächste Minute zurück", () => {
    const a = new MinuteAverager();
    expect(a.add(0, 60)).toBeNull();
    expect(a.add(30_000, 61)).toBeNull();
    expect(a.add(59_999, 62)).toBeNull();
    expect(a.add(60_000, 100)).toEqual({ minute: 0, bpm: 61 });
    expect(a.flush()).toEqual({ minute: 60_000, bpm: 100 });
    expect(a.flush()).toBeNull();
  });

  it("überspringt leere Minuten ohne Ereignis", () => {
    const a = new MinuteAverager();
    a.add(10_000, 80);
    expect(a.add(300_000, 90)).toEqual({ minute: 0, bpm: 80 });
  });
});
