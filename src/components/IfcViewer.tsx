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
import { ELEMENT_STATUS_LABEL, ELEMENT_STATUS_REIHENFOLGE } from "@/lib/kennzahlen";

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function material(farbe: string, aktiv: boolean, zugeordnet: boolean) {
  const key = `${farbe}-${aktiv}-${zugeordnet}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: aktiv ? "#1d4ed8" : farbe,
      transparent: !zugeordnet,
      opacity: zugeordnet ? 1 : 0.35,
      depthWrite: zugeordnet,
      side: THREE.DoubleSide,
    });
    materialCache.set(key, m);
  }
  return m;
}

function KameraAnpassen({ modell }: { modell: IfcModell }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null };
  useEffect(() => {
    const box = new THREE.Box3();
    for (const t of modell.teile) {
      t.geometrie.computeBoundingBox();
      if (t.geometrie.boundingBox) box.union(t.geometrie.boundingBox);
    }
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
  }, [modell, camera, controls]);
  return null;
}

export default function IfcViewer({ pfad, elemente }: { pfad: string; elemente: Element[] }) {
  const [modell, setModell] = useState<IfcModell | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stand, setStand] = useState<{ phase: string; anteil: number | null }>({ phase: "download", anteil: 0 });
  const [auswahl, setAuswahl] = useState<number | null>(null);

  useEffect(() => {
    let aktiv = true;
    setModell(null);
    setFehler(null);
    setAuswahl(null);
    ladeIfcModell(pfad, () => ifcDownloadUrl(pfad), (phase, anteil) => aktiv && setStand({ phase, anteil }))
      .then((m) => aktiv && setModell(m))
      .catch((e) => aktiv && setFehler(e instanceof Error ? e.message : String(e)));
    return () => {
      aktiv = false;
    };
  }, [pfad]);

  const zuordnung = useMemo(() => (modell ? ordneZu(modell.baugruppen, elemente) : null), [modell, elemente]);
  const leg = useMemo(() => (modell && zuordnung ? legende(modell.baugruppen, zuordnung) : null), [modell, zuordnung]);
  const teilZuBaugruppe = useMemo(() => {
    const m = new Map<number, number>();
    modell?.baugruppen.forEach((b) => b.teile.forEach((t) => m.set(t, b.expressId)));
    return m;
  }, [modell]);

  const gewaehltesElement = auswahl != null ? zuordnung?.baugruppeZuElement.get(auswahl) : undefined;

  if (fehler) return <div className="rounded-lg border bg-card p-6 text-sm text-destructive">IFC-Modell konnte nicht geladen werden: {fehler}</div>;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1 rounded-lg border bg-card p-2 sm:p-4">
        <div className="relative h-[360px] w-full sm:h-[520px]" data-scene-ready={modell ? "" : undefined}>
          {!modell ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-sm text-muted-foreground">
              <p>{stand.phase === "download" ? "IFC-Modell wird heruntergeladen …" : "Modell wird aufbereitet …"}</p>
              <Progress value={stand.anteil == null ? 50 : Math.round(stand.anteil * 100)} className="w-full max-w-sm" />
              {stand.anteil != null && <p className="text-xs">{Math.round(stand.anteil * 100)} %</p>}
            </div>
          ) : (
            <Canvas camera={{ position: [20, 15, 20], fov: 45 }} onPointerMissed={() => setAuswahl(null)}>
              <color attach="background" args={["#f5f2ee"]} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[50, 80, 30]} intensity={0.9} />
              <directionalLight position={[-40, 30, -40]} intensity={0.35} />
              {modell.teile.map((t) => {
                const el = zuordnung?.teilZuElement.get(t.id);
                const bg = teilZuBaugruppe.get(t.id);
                const aktiv = bg != null && bg === auswahl;
                return (
                  <mesh
                    key={t.id}
                    geometry={t.geometrie}
                    material={material(el ? STATUS_FARBE[el.status] : NICHT_ZUGEORDNET_FARBE, aktiv, !!el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuswahl(bg ?? null);
                    }}
                  />
                );
              })}
              <OrbitControls makeDefault />
              <KameraAnpassen modell={modell} />
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
