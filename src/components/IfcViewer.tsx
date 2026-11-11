import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { VerlaufPopover } from "@/components/ElementTabelle";
import { ifcDownloadUrl, type Element } from "@/data/repository";
import { ladeIfcModell, type IfcModell } from "@/lib/ifcLaden";
import { legende, NICHT_ZUGEORDNET_FARBE, ordneZu, STATUS_FARBE } from "@/lib/ifcZuordnung";
import { baueBatch, faerbe, istKlick, teileIndex, type Batch } from "@/lib/ifcBatch";
import { ELEMENT_STATUS_LABEL, ELEMENT_STATUS_REIHENFOLGE } from "@/lib/kennzahlen";

const AUSWAHL_FARBE = "#1d4ed8";
const rgb = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

/** Alle Bauteile in einer Geometrie: höchstens 2 Draw Calls (zugeordnet / nicht zugeordnet). */
interface Szene {
  batch: Batch;
  farben: THREE.BufferAttribute;
  undurchsichtig: THREE.BufferGeometry;
  durchsichtig: THREE.BufferGeometry;
  /** Vollständige Geometrie nur für die Klick-Auswahl (wird nie gezeichnet). */
  auswahlMesh: THREE.Mesh;
  box: THREE.Box3;
}

function baueSzene(modell: IfcModell): Szene {
  const t0 = performance.now();
  const batch = baueBatch(
    modell.teile.map((t) => ({
      id: t.id,
      position: t.geometrie.getAttribute("position").array as Float32Array,
      normal: t.geometrie.getAttribute("normal").array as Float32Array,
      index: t.geometrie.getIndex()!.array,
    })),
  );
  const pos = new THREE.BufferAttribute(batch.position, 3);
  const nor = new THREE.BufferAttribute(batch.normal, 3);
  const farben = new THREE.BufferAttribute(new Float32Array(batch.position.length), 3);
  farben.setUsage(THREE.DynamicDrawUsage);
  const neu = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", pos);
    g.setAttribute("normal", nor);
    g.setAttribute("color", farben);
    // Leerer Index, bis die Aufteilung zugeordnet / nicht zugeordnet steht (sonst würde alles ohne Index gezeichnet).
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(0), 1));
    return g;
  };
  const undurchsichtig = neu();
  const durchsichtig = neu();
  const voll = new THREE.BufferGeometry();
  voll.setAttribute("position", pos);
  voll.setIndex(new THREE.BufferAttribute(batch.index, 1));
  voll.computeBoundingBox();
  voll.computeBoundingSphere();
  const auswahlMesh = new THREE.Mesh(voll, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  // Die Teilgeometrien nach dem Zusammenfassen freigeben, damit der Speicher nicht doppelt belegt ist.
  for (const t of modell.teile) t.geometrie.dispose();
  console.info(
    `[IFC] ${batch.teile.length} Bauteile, ${batch.dreiecke.toLocaleString("de-CH")} Dreiecke, zusammengefasst in ${Math.round(performance.now() - t0)} ms`,
  );
  return { batch, farben, undurchsichtig, durchsichtig, auswahlMesh, box: voll.boundingBox!.clone() };
}

function KameraAnpassen({ box }: { box: THREE.Box3 }) {
  const { camera, controls, invalidate } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | null;
    invalidate: () => void;
  };
  useEffect(() => {
    if (box.isEmpty()) return;
    const mitte = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    camera.position.copy(mitte).add(new THREE.Vector3(r, r * 0.8, r));
    camera.near = r / 100;
    camera.far = r * 20;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(mitte);
      controls.update();
    }
    invalidate();
  }, [box, camera, controls, invalidate]);
  return null;
}

/** Auswahl nur bei echtem Klick (kaum Zeigerbewegung), ein einziger Raycast gegen die Gesamtgeometrie. */
function KlickAuswahl({ mesh, teilJeVertex, onAuswahl }: { mesh: THREE.Mesh; teilJeVertex: Uint32Array; onAuswahl: (teil: number | null) => void }) {
  const { gl, camera } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    let start: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => (start = { x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => {
      if (!start || !istKlick(e.clientX - start.x, e.clientY - start.y)) return;
      start = null;
      const r = el.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = raycaster.intersectObject(mesh, false)[0];
      onAuswahl(hit?.face ? teilJeVertex[hit.face.a] : null);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [gl, camera, mesh, teilJeVertex, onAuswahl]);
  return null;
}

/** Nach Farb-/Auswahl-Änderung einmal neu zeichnen (frameloop="demand") und Kennzahlen loggen. */
function NeuZeichnen({ version }: { version: number }) {
  const { invalidate, gl } = useThree();
  useEffect(() => {
    invalidate();
    const id = requestAnimationFrame(() =>
      console.info(`[IFC] Draw Calls: ${gl.info.render.calls}, Dreiecke im Bild: ${gl.info.render.triangles.toLocaleString("de-CH")}`),
    );
    return () => cancelAnimationFrame(id);
  }, [version, invalidate, gl]);
  return null;
}

export default function IfcViewer({ pfad, elemente }: { pfad: string; elemente: Element[] }) {
  const [modell, setModell] = useState<IfcModell | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stand, setStand] = useState<{ phase: string; anteil: number | null }>({ phase: "download", anteil: 0 });
  const [auswahl, setAuswahl] = useState<number | null>(null);

  useEffect(() => {
    let aktiv = true;
    const t0 = performance.now();
    setModell(null);
    setFehler(null);
    setAuswahl(null);
    ladeIfcModell(pfad, () => ifcDownloadUrl(pfad), (phase, anteil) => aktiv && setStand({ phase, anteil }))
      .then((m) => {
        console.info(`[IFC] geladen in ${Math.round(performance.now() - t0)} ms`);
        if (aktiv) setModell(m);
      })
      .catch((e) => aktiv && setFehler(e instanceof Error ? e.message : String(e)));
    return () => {
      aktiv = false;
    };
  }, [pfad]);

  const szene = useMemo(() => (modell ? baueSzene(modell) : null), [modell]);
  useEffect(
    () => () => {
      szene?.undurchsichtig.dispose();
      szene?.durchsichtig.dispose();
      szene?.auswahlMesh.geometry.dispose();
    },
    [szene],
  );

  const zuordnung = useMemo(() => (modell ? ordneZu(modell.baugruppen, elemente) : null), [modell, elemente]);
  const leg = useMemo(() => (modell && zuordnung ? legende(modell.baugruppen, zuordnung) : null), [modell, zuordnung]);
  const teilZuBaugruppe = useMemo(() => {
    const m = new Map<number, number>();
    modell?.baugruppen.forEach((b) => b.teile.forEach((t) => m.set(t, b.expressId)));
    return m;
  }, [modell]);

  // Aufteilung zugeordnet / nicht zugeordnet (ändert sich nur mit der Zuordnung).
  useEffect(() => {
    if (!szene || !zuordnung) return;
    const { a, b } = teileIndex(szene.batch, (id) => zuordnung.teilZuElement.has(id));
    szene.undurchsichtig.setIndex(new THREE.BufferAttribute(a, 1));
    szene.durchsichtig.setIndex(new THREE.BufferAttribute(b, 1));
  }, [szene, zuordnung]);

  // Farben: Status, nicht zugeordnet, Auswahl. Nur ein Attribut-Update, keine neuen Meshes.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!szene || !zuordnung) return;
    const cache = new Map<string, [number, number, number]>();
    const farbe = (hex: string) => cache.get(hex) ?? (cache.set(hex, rgb(hex)), cache.get(hex)!);
    faerbe(szene.batch, szene.farben.array as Float32Array, (id) => {
      if (auswahl != null && teilZuBaugruppe.get(id) === auswahl) return farbe(AUSWAHL_FARBE);
      const el = zuordnung.teilZuElement.get(id);
      return farbe(el ? STATUS_FARBE[el.status] : NICHT_ZUGEORDNET_FARBE);
    });
    szene.farben.needsUpdate = true;
    setVersion((v) => v + 1);
  }, [szene, zuordnung, auswahl, teilZuBaugruppe]);

  const material = useMemo(
    () => ({
      undurchsichtig: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide }),
      durchsichtig: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthWrite: false }),
    }),
    [],
  );
  useEffect(() => () => Object.values(material).forEach((m) => m.dispose()), [material]);

  const gewaehltesElement = auswahl != null ? zuordnung?.baugruppeZuElement.get(auswahl) : undefined;
  const waehleTeil = useMemo(() => (teil: number | null) => setAuswahl(teil == null ? null : teilZuBaugruppe.get(teil) ?? null), [teilZuBaugruppe]);

  if (fehler) return <div className="rounded-lg border bg-card p-6 text-sm text-destructive">IFC-Modell konnte nicht geladen werden: {fehler}</div>;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="min-w-0 flex-1 rounded-lg border bg-card p-2 sm:p-4">
        <div className="relative h-[360px] w-full sm:h-[520px]" data-scene-ready={szene ? "" : undefined}>
          {!szene ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-sm text-muted-foreground">
              <p>{stand.phase === "download" ? "IFC-Modell wird heruntergeladen …" : "Modell wird aufbereitet …"}</p>
              <Progress value={stand.anteil == null ? 50 : Math.round(stand.anteil * 100)} className="w-full max-w-sm" />
              {stand.anteil != null && <p className="text-xs">{Math.round(stand.anteil * 100)} %</p>}
            </div>
          ) : (
            <Canvas frameloop="demand" dpr={[1, 1.5]} gl={{ antialias: true }} camera={{ position: [20, 15, 20], fov: 45 }}>
              <color attach="background" args={["#f5f2ee"]} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[50, 80, 30]} intensity={0.9} />
              <directionalLight position={[-40, 30, -40]} intensity={0.35} />
              <mesh geometry={szene.undurchsichtig} material={material.undurchsichtig} raycast={() => null} frustumCulled={false} />
              <mesh geometry={szene.durchsichtig} material={material.durchsichtig} raycast={() => null} frustumCulled={false} renderOrder={1} />
              <OrbitControls makeDefault />
              <KameraAnpassen box={szene.box} />
              <KlickAuswahl mesh={szene.auswahlMesh} teilJeVertex={szene.batch.teilJeVertex} onAuswahl={waehleTeil} />
              <NeuZeichnen version={version} />
            </Canvas>
          )}
        </div>
        {leg && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {ELEMENT_STATUS_REIHENFOLGE.filter((s) => leg.proStatus[s]).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_FARBE[s] }} />
                {ELEMENT_STATUS_LABEL[s]}: {leg.proStatus[s]}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm opacity-60" style={{ backgroundColor: NICHT_ZUGEORDNET_FARBE }} />
              nicht zugeordnet: {leg.nichtZugeordnet}
            </span>
          </div>
        )}
      </div>

      {auswahl != null && (
        <div className="w-full rounded-lg border bg-card p-4 md:w-72">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{gewaehltesElement?.baugruppe ?? modell?.namen.get(auswahl) ?? "Baugruppe"}</h3>
            <button onClick={() => setAuswahl(null)} className="rounded p-1 hover:bg-muted" aria-label="Schliessen">
              <X size={16} />
            </button>
          </div>
          {gewaehltesElement ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Baugruppe</dt><dd>{gewaehltesElement.baugruppe}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Typ</dt><dd>{gewaehltesElement.typ ?? "–"}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Status</dt><dd><VerlaufPopover element={gewaehltesElement} /></dd></div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Diese Baugruppe ist keinem Woodflow-Element zugeordnet.</p>
          )}
        </div>
      )}
    </div>
  );
}
