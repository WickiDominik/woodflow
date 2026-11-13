// Fasst alle IFC-Bauteile zu einer Geometrie zusammen (wenige Draw Calls statt eines pro Bauteil).
// Ohne three.js-Abhängigkeit, damit testbar.

export interface TeilDaten {
  id: number; // expressID
  position: Float32Array; // xyz je Vertex
  normal: Float32Array; // xyz je Vertex
  index: ArrayLike<number>; // Dreiecke, bezogen auf die Vertices dieses Teils
}

export interface Batch {
  position: Float32Array;
  normal: Float32Array;
  /** expressID je Vertex (für die Klick-Auswahl) */
  teilJeVertex: Uint32Array;
  /** Index aller Dreiecke, global */
  index: Uint32Array;
  /** expressID → [erster Vertex, Anzahl Vertices] */
  vertexBereich: Map<number, [number, number]>;
  /** expressID → [erster Index-Eintrag, Anzahl Index-Einträge] */
  indexBereich: Map<number, [number, number]>;
  teile: number[];
  dreiecke: number;
}

export function baueBatch(teile: TeilDaten[]): Batch {
  let nV = 0;
  let nI = 0;
  for (const t of teile) {
    nV += t.position.length / 3;
    nI += t.index.length;
  }
  const position = new Float32Array(nV * 3);
  const normal = new Float32Array(nV * 3);
  const teilJeVertex = new Uint32Array(nV);
  const index = new Uint32Array(nI);
  const vertexBereich = new Map<number, [number, number]>();
  const indexBereich = new Map<number, [number, number]>();
  let v = 0;
  let i = 0;
  for (const t of teile) {
    const n = t.position.length / 3;
    position.set(t.position, v * 3);
    normal.set(t.normal, v * 3);
    teilJeVertex.fill(t.id, v, v + n);
    for (let k = 0; k < t.index.length; k++) index[i + k] = t.index[k] + v;
    vertexBereich.set(t.id, [v, n]);
    indexBereich.set(t.id, [i, t.index.length]);
    v += n;
    i += t.index.length;
  }
  return { position, normal, teilJeVertex, index, vertexBereich, indexBereich, teile: teile.map((t) => t.id), dreiecke: nI / 3 };
}

/** Teilt den Index in zwei Gruppen (z.B. zugeordnet = undurchsichtig, nicht zugeordnet = durchsichtig). */
export function teileIndex(b: Batch, gehoertZuA: (id: number) => boolean): { a: Uint32Array; b: Uint32Array } {
  let lenA = 0;
  for (const id of b.teile) if (gehoertZuA(id)) lenA += b.indexBereich.get(id)![1];
  const a = new Uint32Array(lenA);
  const rest = new Uint32Array(b.index.length - lenA);
  let pa = 0;
  let pb = 0;
  for (const id of b.teile) {
    const [start, len] = b.indexBereich.get(id)!;
    const stueck = b.index.subarray(start, start + len);
    if (gehoertZuA(id)) {
      a.set(stueck, pa);
      pa += len;
    } else {
      rest.set(stueck, pb);
      pb += len;
    }
  }
  return { a, b: rest };
}

/** Schreibt die Farbe (r,g,b 0..1) je Teil in ein Vertex-Farb-Array. */
export function faerbe(b: Batch, farben: Float32Array, farbe: (id: number) => [number, number, number]) {
  for (const id of b.teile) {
    const [start, n] = b.vertexBereich.get(id)!;
    const [r, g, bl] = farbe(id);
    for (let k = start; k < start + n; k++) {
      farben[k * 3] = r;
      farben[k * 3 + 1] = g;
      farben[k * 3 + 2] = bl;
    }
  }
}

/** Ein Klick gilt nur als Auswahl, wenn sich der Zeiger kaum bewegt hat (sonst war es Drehen/Zoomen). */
export const istKlick = (dx: number, dy: number, toleranz = 5) => dx * dx + dy * dy <= toleranz * toleranz;

/**
 * Textur-Koordinaten (in Metern) per Box-Projektion: jede Fläche wird auf die Ebene ihrer
 * Hauptnormalen projiziert. Die längste Achse eines Bauteils läuft entlang u, damit die
 * Holzmaserung der Stablänge folgt.
 */
export function berechneUv(b: Batch): Float32Array {
  const uv = new Float32Array((b.position.length / 3) * 2);
  const p = b.position;
  const n = b.normal;
  for (const id of b.teile) {
    const [start, anzahl] = b.vertexBereich.get(id)!;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let k = start; k < start + anzahl; k++)
      for (let a = 0; a < 3; a++) {
        const v = p[k * 3 + a];
        if (v < min[a]) min[a] = v;
        if (v > max[a]) max[a] = v;
      }
    const ausdehnung = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const lang = ausdehnung.indexOf(Math.max(...ausdehnung));
    for (let k = start; k < start + anzahl; k++) {
      const ax = Math.abs(n[k * 3]);
      const ay = Math.abs(n[k * 3 + 1]);
      const az = Math.abs(n[k * 3 + 2]);
      const normalAchse = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
      const [a1, a2] = [0, 1, 2].filter((a) => a !== normalAchse);
      // Längsachse wenn möglich auf u
      const [ua, va] = a2 === lang ? [a2, a1] : [a1, a2];
      uv[k * 2] = p[k * 3 + ua] - min[ua];
      uv[k * 2 + 1] = p[k * 3 + va] - min[va];
    }
  }
  return uv;
}

/**
 * Baut einen Index mit Gruppen (eine Gruppe = ein Material = ein Draw Call).
 * `gruppeVon` liefert die Gruppennummer je Teil oder -1 für "nicht zeichnen".
 */
export function baueGruppenIndex(
  b: Batch,
  anzahlGruppen: number,
  gruppeVon: (id: number) => number,
): { index: Uint32Array; gruppen: { start: number; count: number; materialIndex: number }[] } {
  const laenge = new Array<number>(anzahlGruppen).fill(0);
  const zuordnung = new Int32Array(b.teile.length);
  b.teile.forEach((id, i) => {
    const g = gruppeVon(id);
    zuordnung[i] = g;
    if (g >= 0) laenge[g] += b.indexBereich.get(id)![1];
  });
  const offset: number[] = [];
  let summe = 0;
  for (const l of laenge) {
    offset.push(summe);
    summe += l;
  }
  const index = new Uint32Array(summe);
  const pos = [...offset];
  b.teile.forEach((id, i) => {
    const g = zuordnung[i];
    if (g < 0) return;
    const [start, len] = b.indexBereich.get(id)!;
    index.set(b.index.subarray(start, start + len), pos[g]);
    pos[g] += len;
  });
  const gruppen = laenge
    .map((count, materialIndex) => ({ start: offset[materialIndex], count, materialIndex }))
    .filter((g) => g.count > 0);
  return { index, gruppen };
}
