// Lädt eine IFC-Datei im Browser mit web-ifc und erzeugt three.js-Geometrien je Bauteil.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { IfcAPI, IFCELEMENTASSEMBLY, IFCRELAGGREGATES, IFCRELDEFINESBYPROPERTIES } from "web-ifc";
import wasmUrl from "web-ifc/web-ifc.wasm?url";
import type { IfcBaugruppe } from "@/lib/ifcZuordnung";

export interface IfcModell {
  teile: { id: number; geometrie: THREE.BufferGeometry }[];
  baugruppen: IfcBaugruppe[];
  namen: Map<number, string>;
}

export type Fortschritt = (phase: "download" | "verarbeitung", anteil: number | null) => void;

const cache = new Map<string, Promise<IfcModell>>();

async function lade(url: string, fortschritt: Fortschritt): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download fehlgeschlagen (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const teile: Uint8Array[] = [];
  let gelesen = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    teile.push(value);
    gelesen += value.length;
    fortschritt("download", total ? gelesen / total : null);
  }
  const daten = new Uint8Array(gelesen);
  let o = 0;
  for (const t of teile) {
    daten.set(t, o);
    o += t.length;
  }
  return daten;
}

const pause = () => new Promise((r) => setTimeout(r, 0));

async function verarbeite(daten: Uint8Array, fortschritt: Fortschritt): Promise<IfcModell> {
  const api = new IfcAPI();
  await api.Init(() => wasmUrl, true);
  fortschritt("verarbeitung", 0);
  await pause();
  const m = api.OpenModel(daten, { COORDINATE_TO_ORIGIN: true });
  try {
    // Aggregationen: Eltern → Kinder
    const kinder = new Map<number, number[]>();
    const rels = api.GetLineIDsWithType(m, IFCRELAGGREGATES);
    for (let i = 0; i < rels.size(); i++) {
      const r = api.GetLine(m, rels.get(i));
      const p = r.RelatingObject?.value;
      if (p == null) continue;
      const k = kinder.get(p) ?? [];
      for (const o of r.RelatedObjects ?? []) k.push(o.value);
      kinder.set(p, k);
    }
    const nachfahren = (id: number, out: number[] = [id]): number[] => {
      for (const k of kinder.get(id) ?? []) out.push(...nachfahren(k, [k]));
      return out;
    };

    // Baugruppen (IfcElementAssembly)
    const ids = api.GetLineIDsWithType(m, IFCELEMENTASSEMBLY, true);
    const baugruppen = new Map<number, IfcBaugruppe>();
    const namen = new Map<number, string>();
    for (let i = 0; i < ids.size(); i++) {
      const id = ids.get(i);
      const l = api.GetLine(m, id);
      const name = l.Name?.value ?? null;
      if (name) namen.set(id, name);
      baugruppen.set(id, { expressId: id, globalId: l.GlobalId?.value ?? "", name, baugruppeProp: null, teile: nachfahren(id) });
    }
    // Nur oberste Baugruppen behalten (verschachtelte gehören zur äusseren)
    const innere = new Set<number>();
    for (const b of baugruppen.values()) for (const t of b.teile) if (t !== b.expressId && baugruppen.has(t)) innere.add(t);

    // Property "Baugruppe"
    const prels = api.GetLineIDsWithType(m, IFCRELDEFINESBYPROPERTIES);
    for (let i = 0; i < prels.size(); i++) {
      const r = api.GetLine(m, prels.get(i));
      const betroffen = (r.RelatedObjects ?? []).map((o: { value: number }) => o.value).filter((v: number) => baugruppen.has(v));
      if (!betroffen.length) continue;
      const pset = api.GetLine(m, r.RelatingPropertyDefinition?.value);
      for (const ref of pset?.HasProperties ?? []) {
        const p = api.GetLine(m, ref.value);
        if (String(p?.Name?.value ?? "").toLowerCase() === "baugruppe" && p.NominalValue?.value != null) {
          for (const b of betroffen) baugruppen.get(b)!.baugruppeProp = String(p.NominalValue.value);
        }
      }
    }

    // Geometrie
    const teile: IfcModell["teile"] = [];
    const matrix = new THREE.Matrix4();
    let letzte = Date.now();
    const roh: { id: number; geos: THREE.BufferGeometry[] }[] = [];
    api.StreamAllMeshes(m, (mesh, index, total) => {
      const geos: THREE.BufferGeometry[] = [];
      const pg = mesh.geometries;
      for (let j = 0; j < pg.size(); j++) {
        const p = pg.get(j);
        const g = api.GetGeometry(m, p.geometryExpressID);
        const v = api.GetVertexArray(g.GetVertexData(), g.GetVertexDataSize());
        const idx = api.GetIndexArray(g.GetIndexData(), g.GetIndexDataSize());
        const pos = new Float32Array(v.length / 2);
        const nor = new Float32Array(v.length / 2);
        for (let k = 0, n = v.length / 6; k < n; k++) {
          pos[k * 3] = v[k * 6]; pos[k * 3 + 1] = v[k * 6 + 1]; pos[k * 3 + 2] = v[k * 6 + 2];
          nor[k * 3] = v[k * 6 + 3]; nor[k * 3 + 1] = v[k * 6 + 4]; nor[k * 3 + 2] = v[k * 6 + 5];
        }
        const bg = new THREE.BufferGeometry();
        bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
        bg.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
        bg.applyMatrix4(matrix.fromArray(p.flatTransformation));
        geos.push(bg);
        g.delete();
      }
      if (geos.length) roh.push({ id: mesh.expressID, geos });
      if (Date.now() - letzte > 200) {
        letzte = Date.now();
        fortschritt("verarbeitung", total ? (index + 1) / total : null);
      }
    });
    for (const r of roh) {
      const g = r.geos.length === 1 ? r.geos[0] : mergeGeometries(r.geos, false);
      if (g) teile.push({ id: r.id, geometrie: g });
    }
    fortschritt("verarbeitung", 1);
    return { teile, baugruppen: [...baugruppen.values()].filter((b) => !innere.has(b.expressId)), namen };
  } finally {
    api.CloseModel(m);
  }
}

/** Lädt und verarbeitet das Modell einmal pro Pfad (Ergebnis bleibt im Speicher). */
export function ladeIfcModell(pfad: string, url: () => Promise<string>, fortschritt: Fortschritt): Promise<IfcModell> {
  let p = cache.get(pfad);
  if (!p) {
    p = (async () => verarbeite(await lade(await url(), fortschritt), fortschritt))();
    p.catch(() => cache.delete(pfad));
    cache.set(pfad, p);
  }
  return p;
}
