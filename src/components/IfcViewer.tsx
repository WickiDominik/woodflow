import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { EyeOff, Maximize, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VerlaufPopover } from "@/components/ElementTabelle";
import IfcFilterPanel from "@/components/IfcFilterPanel";
import { ifcDownloadUrl, type Element } from "@/data/repository";
import { ladeIfcModell, type IfcModell } from "@/lib/ifcLaden";
import { legende, NICHT_ZUGEORDNET_FARBE, ordneZu, STATUS_FARBE } from "@/lib/ifcZuordnung";
import { baueBatch, baueGruppenIndex, berechneUv, faerbe, istKlick, type Batch } from "@/lib/ifcBatch";
import {
  anzahlAusgeblendet,
  bestimmeAttribute,
  isoliere,
  istSichtbar,
  keineAusgeblendet,
  OHNE,
  umschalten,
  type Ausgeblendet,
  type FilterArt,
  type TeilAttribute,
} from "@/lib/ifcFilter";
import { KATEGORIE_REIHENFOLGE, KATEGORIEN } from "@/lib/ifcMaterial";
import { textur } from "@/lib/ifcTexturen";
import { ELEMENT_STATUS_LABEL, ELEMENT_STATUS_REIHENFOLGE } from "@/lib/kennzahlen";

const AUSWAHL_FARBE = "#1d4ed8";
/** Auf Texturen wird multipliziert: hellere Farbe, damit das Holz bläulich statt schwarz wirkt. */
const AUSWAHL_FARBE_TEXTUR = "#6fa8ff";
const rgb = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

type Darstellung = "material" | "status" | "cadwork" | "bg";
const DARSTELLUNG_LABEL: Record<Darstellung, string> = {
  material: "Material (Textur)",
  status: "Status",
  cadwork: "cadwork-Farbe",
  bg: "Baugruppe (BG)",
};

/** Materialreihenfolge im Mesh: 0 = einfarbig, 1 = Geist (durchsichtig), 2… = Textur je Kategorie. */
const MAT_EINFACH = 0;
const MAT_GEIST = 1;
const MAT_TEXTUR = 2;

/** Alle Bauteile in einer Geometrie; Gruppen je Material (wenige Draw Calls). */
interface Szene {
  batch: Batch;
  farben: THREE.BufferAttribute;
  geometrie: THREE.BufferGeometry;
  /** Geometrie nur für die Klick-Auswahl (wird nie gezeichnet), enthält nur sichtbare Teile. */
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
  const farben = new THREE.BufferAttribute(new Float32Array(batch.position.length), 3);
  farben.setUsage(THREE.DynamicDrawUsage);
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute("position", pos);
  geometrie.setAttribute("normal", new THREE.BufferAttribute(batch.normal, 3));
  geometrie.setAttribute("color", farben);
  geometrie.setAttribute("uv", new THREE.BufferAttribute(berechneUv(batch), 2));
  geometrie.setIndex(new THREE.BufferAttribute(new Uint32Array(0), 1));
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
  return { batch, farben, geometrie, auswahlMesh, box: voll.boundingBox!.clone() };
}

/** Bounding Box der angegebenen Teile (für "Einpassen" auf die sichtbaren Teile). */
function boxVon(b: Batch, ids: number[]): THREE.Box3 {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const id of ids) {
    const [start, n] = b.vertexBereich.get(id)!;
    for (let k = start; k < start + n; k++) box.expandByPoint(v.fromArray(b.position, k * 3));
  }
  return box;
}

/** Stabile, gut unterscheidbare Farbe je Text (für "Farbe nach BG"). */
function farbeAusText(s: string): [number, number, number] {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const c = new THREE.Color().setHSL(((h * 0.618033988749895) % 1 + 1) % 1, 0.55, 0.6);
  return [c.r, c.g, c.b];
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
    const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.5);
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

/** Auswahl nur bei echtem Klick (kaum Zeigerbewegung), ein einziger Raycast gegen die sichtbare Geometrie. */
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

/** Nach Farb-/Filter-/Auswahl-Änderung einmal neu zeichnen (frameloop="demand") und Kennzahlen loggen. */
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

function Zeile({ label, wert, aktionen }: { label: string; wert: string; aktionen?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-right">
        <span className="truncate">{wert}</span>
        {aktionen}
      </dd>
    </div>
  );
}

export default function IfcViewer({ pfad, elemente }: { pfad: string; elemente: Element[] }) {
  const [modell, setModell] = useState<IfcModell | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stand, setStand] = useState<{ phase: string; anteil: number | null }>({ phase: "download", anteil: 0 });
  /** Angeklicktes Bauteil (expressID); hervorgehoben wird die ganze Baugruppe. */
  const [auswahl, setAuswahl] = useState<number | null>(null);
  const [darstellung, setDarstellung] = useState<Darstellung>("material");
  const [texturen, setTexturen] = useState(true);
  const [geister, setGeister] = useState(false);
  const [ausgeblendet, setAusgeblendet] = useState<Ausgeblendet>(keineAusgeblendet);
  const [zoomBox, setZoomBox] = useState<THREE.Box3 | null>(null);

  useEffect(() => {
    let aktiv = true;
    const t0 = performance.now();
    setModell(null);
    setFehler(null);
    setAuswahl(null);
    setAusgeblendet(keineAusgeblendet());
    setZoomBox(null);
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
      szene?.geometrie.dispose();
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

  // BG / BUG / Material je Bauteil (IFC → umgebende Baugruppe → Woodflow-Element → abgeleitet).
  const attribute = useMemo(() => {
    const m = new Map<number, TeilAttribute>();
    if (!modell || !szene || !zuordnung) return m;
    const bgInfo = new Map(modell.baugruppen.map((b) => [b.expressId, { name: b.name, bg: b.baugruppeProp, bug: b.bauuntergruppeProp ?? null }]));
    for (const id of szene.batch.teile) {
      const bgId = teilZuBaugruppe.get(id);
      m.set(id, bestimmeAttribute(modell.roh.get(id), bgId != null ? bgInfo.get(bgId) : undefined, zuordnung.teilZuElement.get(id)));
    }
    return m;
  }, [modell, szene, zuordnung, teilZuBaugruppe]);
  const attributListe = useMemo(() => [...attribute.values()], [attribute]);

  const sichtbar = useCallback((id: number) => {
    const a = attribute.get(id);
    return !a || istSichtbar(a, ausgeblendet);
  }, [attribute, ausgeblendet]);

  const hervorgehoben = useMemo(() => {
    if (auswahl == null) return new Set<number>();
    const bgId = teilZuBaugruppe.get(auswahl);
    const teile = bgId != null ? modell?.baugruppen.find((b) => b.expressId === bgId)?.teile : undefined;
    return new Set(teile ?? [auswahl]);
  }, [auswahl, teilZuBaugruppe, modell]);

  // Index mit Gruppen je Material: ändert sich mit Filter, Darstellung und Zuordnung.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!szene || !zuordnung) return;
    const gruppe = (id: number) => {
      if (!sichtbar(id)) return geister ? MAT_GEIST : -1;
      if (darstellung === "status" && !zuordnung.teilZuElement.has(id)) return MAT_GEIST;
      if (darstellung === "material" && texturen) return MAT_TEXTUR + KATEGORIE_REIHENFOLGE.indexOf(attribute.get(id)?.kategorie ?? "sonstiges");
      return MAT_EINFACH;
    };
    const { index, gruppen } = baueGruppenIndex(szene.batch, MAT_TEXTUR + KATEGORIE_REIHENFOLGE.length, gruppe);
    szene.geometrie.setIndex(new THREE.BufferAttribute(index, 1));
    szene.geometrie.clearGroups();
    for (const g of gruppen) szene.geometrie.addGroup(g.start, g.count, g.materialIndex);
    const pick = baueGruppenIndex(szene.batch, 1, (id) => (sichtbar(id) ? 0 : -1));
    szene.auswahlMesh.geometry.setIndex(new THREE.BufferAttribute(pick.index, 1));
    setVersion((v) => v + 1);
  }, [szene, zuordnung, sichtbar, geister, darstellung, texturen, attribute]);

  // Farben je Darstellung (+ Auswahl). Nur ein Attribut-Update, keine neuen Meshes.
  useEffect(() => {
    if (!szene || !zuordnung) return;
    const cache = new Map<string, [number, number, number]>();
    const farbe = (hex: string) => cache.get(hex) ?? (cache.set(hex, rgb(hex)), cache.get(hex)!);
    const weiss: [number, number, number] = [1, 1, 1];
    faerbe(szene.batch, szene.farben.array as Float32Array, (id) => {
      if (hervorgehoben.has(id)) return farbe(darstellung === "material" && texturen ? AUSWAHL_FARBE_TEXTUR : AUSWAHL_FARBE);
      const a = attribute.get(id);
      const kat = KATEGORIEN[a?.kategorie ?? "sonstiges"];
      switch (darstellung) {
        case "material":
          return texturen ? weiss : farbe(kat.farbe);
        case "cadwork":
          return a?.farbe ?? farbe(kat.farbe);
        case "bg":
          return a && a.bg !== OHNE ? farbeAusText(a.bg) : farbe(NICHT_ZUGEORDNET_FARBE);
        default: {
          const el = zuordnung.teilZuElement.get(id);
          return farbe(el ? STATUS_FARBE[el.status] : NICHT_ZUGEORDNET_FARBE);
        }
      }
    });
    szene.farben.needsUpdate = true;
    setVersion((v) => v + 1);
  }, [szene, zuordnung, hervorgehoben, attribute, darstellung, texturen]);

  const materialien = useMemo(() => {
    const liste: THREE.Material[] = [
      new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.2, depthWrite: false }),
    ];
    for (const k of KATEGORIE_REIHENFOLGE) {
      liste.push(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          map: textur(k),
          roughness: k === "metall" ? 0.45 : 0.85,
          metalness: k === "metall" ? 0.4 : 0,
        }),
      );
    }
    return liste;
  }, []);
  useEffect(() => () => materialien.forEach((m) => m.dispose()), [materialien]);

  const waehleTeil = useCallback((teil: number | null) => setAuswahl(teil), []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAuswahl(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  // Ausgewähltes Teil ausgeblendet → Auswahl aufheben
  useEffect(() => {
    if (auswahl != null && !sichtbar(auswahl)) setAuswahl(null);
  }, [auswahl, sichtbar]);

  const einpassen = () => {
    if (!szene) return;
    const ids = szene.batch.teile.filter(sichtbar);
    setZoomBox(boxVon(szene.batch, ids.length ? ids : szene.batch.teile));
  };

  const alleWerte = (art: FilterArt) => [...new Set(attributListe.map((a) => a[art]))];
  const nurDiese = (art: FilterArt, wert: string) => setAusgeblendet((a) => isoliere(a, art, [wert], alleWerte(art)));
  const ausblenden = (art: FilterArt, wert: string) => setAusgeblendet((a) => (a[art].has(wert) ? a : umschalten(a, art, wert)));

  const materialLegende = useMemo(() => {
    const zaehler = new Map<string, number>();
    for (const a of attributListe) if (istSichtbar(a, ausgeblendet)) zaehler.set(a.kategorie, (zaehler.get(a.kategorie) ?? 0) + 1);
    return KATEGORIE_REIHENFOLGE.filter((k) => zaehler.has(k)).map((k) => ({ k, n: zaehler.get(k)! }));
  }, [attributListe, ausgeblendet]);

  if (fehler) return <div className="rounded-lg border bg-card p-6 text-sm text-destructive">IFC-Modell konnte nicht geladen werden: {fehler}</div>;

  const gewaehltBg = auswahl != null ? teilZuBaugruppe.get(auswahl) : undefined;
  const gewaehltesElement = gewaehltBg != null ? zuordnung?.baugruppeZuElement.get(gewaehltBg) : undefined;
  const gewaehltAttr = auswahl != null ? attribute.get(auswahl) : undefined;
  const nAus = anzahlAusgeblendet(ausgeblendet);
  const aktionKnopf = (titel: string, onClick: () => void, icon: ReactNode) => (
    <button type="button" onClick={onClick} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" title={titel} aria-label={titel}>
      {icon}
    </button>
  );
  const filterAktionen = (art: FilterArt, wert: string | undefined) =>
    wert && wert !== OHNE ? (
      <>
        {aktionKnopf(`Nur ${wert} anzeigen`, () => nurDiese(art, wert), <Maximize size={13} />)}
        {aktionKnopf(`${wert} ausblenden`, () => ausblenden(art, wert), <EyeOff size={13} />)}
      </>
    ) : null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {szene && (
        <div className="w-full rounded-lg border bg-card p-3 lg:h-[600px] lg:w-72 lg:shrink-0">
          <div className="h-[320px] lg:h-full">
            <IfcFilterPanel attribute={attributListe} ausgeblendet={ausgeblendet} onChange={setAusgeblendet} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 rounded-lg border bg-card p-2 sm:p-4">
        {szene && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Select value={darstellung} onValueChange={(v) => setDarstellung(v as Darstellung)}>
              <SelectTrigger className="h-8 w-[180px]" aria-label="Darstellung">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DARSTELLUNG_LABEL) as Darstellung[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {DARSTELLUNG_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {darstellung === "material" && (
              <div className="flex items-center gap-2">
                <Switch id="ifc-texturen" checked={texturen} onCheckedChange={setTexturen} />
                <Label htmlFor="ifc-texturen" className="font-normal">Texturen</Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch id="ifc-geister" checked={geister} onCheckedChange={setGeister} />
              <Label htmlFor="ifc-geister" className="font-normal">Ausgeblendete transparent</Label>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={einpassen} title="Ansicht auf sichtbare Bauteile einpassen">
                <Maximize className="mr-1 h-4 w-4" />
                Einpassen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAusgeblendet(keineAusgeblendet())} disabled={nAus === 0}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Alles einblenden{nAus > 0 && ` (${nAus})`}
              </Button>
            </div>
          </div>
        )}
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
              <hemisphereLight args={["#ffffff", "#d6cfc4", 0.6]} />
              <ambientLight intensity={0.45} />
              <directionalLight position={[50, 80, 30]} intensity={1} />
              <directionalLight position={[-40, 30, -40]} intensity={0.4} />
              <mesh geometry={szene.geometrie} material={materialien} raycast={() => null} frustumCulled={false} />
              <OrbitControls makeDefault />
              <KameraAnpassen box={zoomBox ?? szene.box} />
              <KlickAuswahl mesh={szene.auswahlMesh} teilJeVertex={szene.batch.teilJeVertex} onAuswahl={waehleTeil} />
              <NeuZeichnen version={version} />
            </Canvas>
          )}
        </div>
        {darstellung === "status" && leg && (
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
        {darstellung === "material" && szene && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {materialLegende.map(({ k, n }) => (
              <span key={k} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: KATEGORIEN[k].farbe }} />
                {KATEGORIEN[k].label}: {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {auswahl != null && (
        <div className="w-full rounded-lg border bg-card p-4 lg:w-72 lg:shrink-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">
              {gewaehltesElement?.baugruppe ?? gewaehltAttr?.bg ?? (gewaehltBg != null ? modell?.namen.get(gewaehltBg) : null) ?? "Bauteil"}
            </h3>
            <button onClick={() => setAuswahl(null)} className="rounded p-1 hover:bg-muted" aria-label="Schliessen">
              <X size={16} />
            </button>
          </div>
          {gewaehltAttr && (
            <dl className="mb-4 space-y-2 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Angeklicktes Bauteil</p>
              {gewaehltAttr.name && <Zeile label="Name" wert={gewaehltAttr.name} />}
              <Zeile label="Material" wert={gewaehltAttr.material} aktionen={filterAktionen("material", gewaehltAttr.material)} />
              <Zeile label="Kategorie" wert={KATEGORIEN[gewaehltAttr.kategorie].label} />
              <Zeile label="BG" wert={gewaehltAttr.bg} aktionen={filterAktionen("bg", gewaehltAttr.bg)} />
              <Zeile label="BUG" wert={gewaehltAttr.bug} aktionen={filterAktionen("bug", gewaehltAttr.bug)} />
            </dl>
          )}
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Woodflow-Element</p>
          {gewaehltesElement ? (
            <dl className="space-y-2 text-sm">
              <Zeile label="Baugruppe" wert={gewaehltesElement.baugruppe} />
              <Zeile label="Typ" wert={gewaehltesElement.typ ?? "–"} />
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
