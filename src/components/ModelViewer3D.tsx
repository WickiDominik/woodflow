import { useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import type { QmStatus } from "@/data/mockData";
import { qmPunkte } from "@/data/mockData";
import { QmStatusBadge } from "./StatusBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Eye, EyeOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import * as THREE from "three";

type Geschoss = "EG" | "OG1" | "Dach";

interface BuildingElement {
  id: string;
  label: string;
  position: [number, number, number];
  size: [number, number, number];
  status: QmStatus;
  geschoss: Geschoss;
}

const elements: BuildingElement[] = [
  // === EG (Erdgeschoss) ===
  { id: "AW_EG_01", label: "AW_EG_01", position: [-2.5, 1.4, 3], size: [4, 2.8, 0.2], status: "Freigegeben", geschoss: "EG" },
  { id: "AW_EG_02", label: "AW_EG_02", position: [2.5, 1.4, 3], size: [4, 2.8, 0.2], status: "In Bearbeitung", geschoss: "EG" },
  { id: "AW_EG_03", label: "AW_EG_03", position: [-2.5, 1.4, -3], size: [4, 2.8, 0.2], status: "Freigegeben", geschoss: "EG" },
  { id: "AW_EG_04", label: "AW_EG_04", position: [2.5, 1.4, -3], size: [4, 2.8, 0.2], status: "Offen", geschoss: "EG" },
  { id: "AW_EG_05", label: "AW_EG_05", position: [-4.5, 1.4, 0], size: [0.2, 2.8, 6], status: "Freigegeben", geschoss: "EG" },
  { id: "AW_EG_06", label: "AW_EG_06", position: [4.5, 1.4, 0], size: [0.2, 2.8, 6], status: "Offen", geschoss: "EG" },
  { id: "IW_EG_01", label: "IW_EG_01", position: [0, 1.4, 0], size: [0.16, 2.8, 5.6], status: "Freigegeben", geschoss: "EG" },
  { id: "DE_EG_01", label: "DE_EG_01", position: [0, 2.85, 0], size: [9, 0.2, 6], status: "In Bearbeitung", geschoss: "EG" },

  // === OG1 (Obergeschoss 1) ===
  { id: "AW_OG1_01", label: "AW_OG1_01", position: [-2.5, 4.25, 3], size: [4, 2.6, 0.2], status: "Offen", geschoss: "OG1" },
  { id: "AW_OG1_02", label: "AW_OG1_02", position: [2.5, 4.25, 3], size: [4, 2.6, 0.2], status: "In Bearbeitung", geschoss: "OG1" },
  { id: "AW_OG1_03", label: "AW_OG1_03", position: [-2.5, 4.25, -3], size: [4, 2.6, 0.2], status: "In Bearbeitung", geschoss: "OG1" },
  { id: "AW_OG1_04", label: "AW_OG1_04", position: [2.5, 4.25, -3], size: [4, 2.6, 0.2], status: "Freigegeben", geschoss: "OG1" },
  { id: "AW_OG1_05", label: "AW_OG1_05", position: [-4.5, 4.25, 0], size: [0.2, 2.6, 6], status: "Offen", geschoss: "OG1" },
  { id: "AW_OG1_06", label: "AW_OG1_06", position: [4.5, 4.25, 0], size: [0.2, 2.6, 6], status: "Freigegeben", geschoss: "OG1" },

  // === Dach (4 Dachflächen) ===
  { id: "DA_01", label: "DA_01 (Vorne)", position: [0, 6.1, 2.1], size: [9.6, 0.15, 3.2], status: "Offen", geschoss: "Dach" },
  { id: "DA_02", label: "DA_02 (Hinten)", position: [0, 6.1, -2.1], size: [9.6, 0.15, 3.2], status: "Freigegeben", geschoss: "Dach" },
  { id: "DA_03", label: "DA_03 (Links)", position: [-4.3, 5.85, 0], size: [0.8, 0.15, 6.4], status: "In Bearbeitung", geschoss: "Dach" },
  { id: "DA_04", label: "DA_04 (Rechts)", position: [4.3, 5.85, 0], size: [0.8, 0.15, 6.4], status: "Offen", geschoss: "Dach" },
];

const statusColor = (s: QmStatus): string =>
  s === "Freigegeben" ? "#4ade80" : s === "In Bearbeitung" ? "#fbbf24" : "#f87171";

const statusColorHover = (s: QmStatus): string =>
  s === "Freigegeben" ? "#22c55e" : s === "In Bearbeitung" ? "#f59e0b" : "#ef4444";

function BuildingElement3D({
  el,
  selected,
  onSelect,
}: {
  el: BuildingElement;
  selected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Tilt roof panels for a pitched roof effect
  const rotation: [number, number, number] | undefined = useMemo(() => {
    if (el.id === "DA_01") return [0.25, 0, 0]; // front tilted forward
    if (el.id === "DA_02") return [-0.25, 0, 0]; // back tilted backward
    return undefined;
  }, [el.id]);

  return (
    <mesh
      ref={meshRef}
      position={el.position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry args={el.size} />
      <meshStandardMaterial
        color={el.geschoss === "Dach" && !hovered && !selected ? "#8B7355" : (hovered ? statusColorHover(el.status) : statusColor(el.status))}
        transparent
        opacity={selected ? 0.95 : hovered ? 0.85 : el.geschoss === "Dach" ? 0.75 : 0.6}
      />
      {(hovered || selected) && (
        <Text
          position={[0, el.size[1] / 2 + 0.3, 0]}
          fontSize={0.3}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {el.label}
        </Text>
      )}
    </mesh>
  );
}

function Building({
  selected,
  onSelect,
  visibleGeschosse,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  visibleGeschosse: Set<Geschoss>;
}) {
  const filteredElements = elements.filter((el) => visibleGeschosse.has(el.geschoss));

  return (
    <group>
      {/* Foundation - always visible */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[10, 0.3, 7]} />
        <meshStandardMaterial color="#a8a29e" />
      </mesh>

      {/* Floor EG */}
      {visibleGeschosse.has("EG") && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[9.4, 0.1, 6.4]} />
          <meshStandardMaterial color="#d6cfc7" />
        </mesh>
      )}

      {/* Dach Ridge beam (Firstbalken) */}
      {visibleGeschosse.has("Dach") && (
        <mesh position={[0, 6.5, 0]}>
          <boxGeometry args={[9.6, 0.2, 0.2]} />
          <meshStandardMaterial color="#6B5B3E" />
        </mesh>
      )}

      {/* Elements */}
      {filteredElements.map((el) => (
        <BuildingElement3D
          key={el.id}
          el={el}
          selected={selected === el.id}
          onSelect={() => onSelect(el.id === selected ? null : el.id)}
        />
      ))}
    </group>
  );
}

function DetailPanel({
  selected,
  relatedQm,
  onClose,
}: {
  selected: string;
  relatedQm: typeof qmPunkte;
  onClose: () => void;
}) {
  return (
    <div className="space-y-2">
      {relatedQm.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine QM-Einträge für dieses Element.
        </p>
      ) : (
        relatedQm.map((q) => (
          <div key={q.id} className="rounded border p-2 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{q.id}</span>
              <QmStatusBadge status={q.status} />
            </div>
            <p className="text-xs text-muted-foreground">{q.beschreibung}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bereich: {q.bereich} · Priorität: {q.prioritaet}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

const geschossLabels: Record<Geschoss, string> = {
  EG: "Erdgeschoss",
  OG1: "Obergeschoss 1",
  Dach: "Dachgeschoss",
};

export default function ModelViewer3D() {
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleGeschosse, setVisibleGeschosse] = useState<Set<Geschoss>>(
    new Set(["EG", "OG1", "Dach"])
  );
  const isMobile = useIsMobile();
  const relatedQm = selected
    ? qmPunkte.filter((q) => q.element === selected)
    : [];

  const toggleGeschoss = (g: Geschoss) => {
    setVisibleGeschosse((prev) => {
      const next = new Set(prev);
      if (next.has(g)) {
        next.delete(g);
      } else {
        next.add(g);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1 rounded-lg border bg-card p-2 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            3D-Gebäudeansicht – Drehen, Zoomen & Elemente anklicken
          </p>
          {/* Geschossfilter */}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(geschossLabels) as Geschoss[]).map((g) => {
              const active = visibleGeschosse.has(g);
              return (
                <Button
                  key={g}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => toggleGeschoss(g)}
                >
                  {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {g}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="h-[300px] sm:h-[400px] w-full">
          <Canvas
            camera={{ position: [12, 8, 12], fov: 45 }}
            onPointerMissed={() => setSelected(null)}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
            <Building
              selected={selected}
              onSelect={setSelected}
              visibleGeschosse={visibleGeschosse}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={30}
            />
            <gridHelper args={[20, 20, "#d4d4d4", "#e5e5e5"]} />
          </Canvas>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Freigegeben
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> In Bearbeitung
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Offen
          </span>
        </div>
      </div>

      {/* Mobile: Sheet/Drawer */}
      {isMobile && (
        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selected}</SheetTitle>
              <SheetDescription>QM-Einträge für dieses Element</SheetDescription>
            </SheetHeader>
            <div className="p-4">
              {selected && (
                <DetailPanel
                  selected={selected}
                  relatedQm={relatedQm}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop: Side panel */}
      {!isMobile && selected && (
        <div className="w-80 rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{selected}</h3>
            <button
              onClick={() => setSelected(null)}
              className="rounded p-1 hover:bg-muted"
            >
              <X size={16} />
            </button>
          </div>
          <DetailPanel
            selected={selected}
            relatedQm={relatedQm}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
