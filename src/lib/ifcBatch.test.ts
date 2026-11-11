import { describe, expect, it } from "vitest";
import { baueBatch, faerbe, istKlick, teileIndex, type TeilDaten } from "./ifcBatch";

const dreieck = (id: number, x: number): TeilDaten => ({
  id,
  position: new Float32Array([x, 0, 0, x + 1, 0, 0, x, 1, 0]),
  normal: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
  index: [0, 1, 2],
});

describe("ifcBatch", () => {
  const b = baueBatch([dreieck(10, 0), dreieck(20, 5), dreieck(30, 9)]);

  it("fasst Vertices und Index zusammen und verschiebt den Index", () => {
    expect(b.position.length).toBe(27);
    expect(Array.from(b.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(b.dreiecke).toBe(3);
    expect(b.position[9]).toBe(5);
  });

  it("merkt sich je Vertex das Bauteil (für die Klick-Auswahl)", () => {
    expect(Array.from(b.teilJeVertex)).toEqual([10, 10, 10, 20, 20, 20, 30, 30, 30]);
  });

  it("teilt den Index in zwei Gruppen", () => {
    const { a, b: rest } = teileIndex(b, (id) => id !== 20);
    expect(Array.from(a)).toEqual([0, 1, 2, 6, 7, 8]);
    expect(Array.from(rest)).toEqual([3, 4, 5]);
  });

  it("färbt je Bauteil", () => {
    const f = new Float32Array(27);
    faerbe(b, f, (id) => (id === 20 ? [1, 0, 0] : [0, 0, 1]));
    expect(Array.from(f.subarray(9, 12))).toEqual([1, 0, 0]);
    expect(Array.from(f.subarray(0, 3))).toEqual([0, 0, 1]);
  });

  it("unterscheidet Klick und Drehen", () => {
    expect(istKlick(3, 3)).toBe(true);
    expect(istKlick(6, 0)).toBe(false);
  });
});
