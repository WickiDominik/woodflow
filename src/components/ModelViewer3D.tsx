import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox } from "@react-three/drei";
import type { QmStatus } from "@/data/mockData";
import { qmPunkte } from "@/data/mockData";
import { QmStatusBadge } from "./StatusBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import * as THREE from "three";

interface BuildingElement {
  id: string;
  label: string;
  position: [number, number, number];
  size: [number, number, number];
  status: QmStatus;
}

const elements: BuildingElement[] = [
  // === EG (Erdgeschoss) ===
  // Front wall (Z+)
  { id: "AW_EG_01", label: "AW_EG_01", position: [-2.5, 1.4, 3], size: [4, 2.8, 0.2], status: "Freigegeben" },
  { id: "AW_EG_02", label: "AW_EG_02", position: [2.5, 1.4, 3], size: [4, 2.8, 0.2], status: "In Bearbeitung" },
  // Back wall (Z-)
  { id: "AW_EG_03", label: "AW_EG_03", position: [-2.5, 1.4, -3], size: [4, 2.8, 0.2], status: "Freigegeben" },
  { id: "AW_EG_04", label: "AW_EG_04", position: [2.5, 1.4, -3], size: [4, 2.8, 0.2], status: "Offen" },
  // Left wall (X-)
  { id: "AW_EG_05", label: "AW_EG_05", position: [-4.5, 1.4, 0], size: [0.2, 2.8, 6], status: "Freigegeben" },
  // Right wall (X+)
  { id: "AW_EG_06", label: "AW_EG_06", position: [4.5, 1.4, 0], size: [0.2, 2.8, 6], status: "Offen" },
  // Inner wall EG
  { id: "IW_EG_01", label: "IW_EG_01", position: [0, 1.4, 0], size: [0.16, 2.8, 5.6], status: "Freigegeben" },
  // EG Ceiling
  { id: "DE_EG_01", label: "DE_EG_01", position: [0, 2.85, 0], size: [9, 0.2, 6], status: "In Bearbeitung" },

  // === OG1 (Obergeschoss 1) ===
  // Front wall (Z+)
  { id: "AW_OG1_01", label: "AW_OG1_01", position: [-2.5, 4.25, 3], size: [4, 2.6, 0.2], status: "Offen" },
  { id: "AW_OG1_02", label: "AW_OG1_02", position: [2.5, 4.25, 3], size: [4, 2.6, 0.2], status: "In Bearbeitung" },
  // Back wall (Z-)
  { id: "AW_OG1_03", label: "AW_OG1_03", position: [-2.5, 4.25, -3], size: [4, 2.6, 0.2], status: "In Bearbeitung" },
  { id: "AW_OG1_04", label: "AW_OG1_04", position: [2.5, 4.25, -3], size: [4, 2.6, 0.2], status: "Freigegeben" },
  // Left wall (X-)
  { id: "AW_OG1_05", label: "AW_OG1_05", position: [-4.5, 4.25, 0], size: [0.2, 2.6, 6], status: "Offen" },
  // Right wall (X+)
  { id: "AW_OG1_06", label: "AW_OG1_06", position: [4.5, 4.25, 0], size: [0.2, 2.6, 6], status: "Freigegeben" },
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

  return (
    <mesh
      ref={meshRef}
      position={el.position}
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
        color={hovered ? statusColorHover(el.status) : statusColor(el.status)}
        transparent
        opacity={selected ? 0.95 : hovered ? 0.85 : 0.6}
        wireframe={false}
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
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <group>
      {/* Foundation */}
      <mesh position={[1, -0.15, 0]}>
        <boxGeometry args={[14, 0.3, 5.5]} />
        <meshStandardMaterial color="#a8a29e" />
      </mesh>

      {/* Floor EG */}
      <mesh position={[1, 0.05, 0]}>
        <boxGeometry args={[13.5, 0.1, 5]} />
        <meshStandardMaterial color="#d6cfc7" />
      </mesh>

      {/* Elements */}
      {elements.map((el) => (
        <BuildingElement3D
          key={el.id}
          el={el}
          selected={selected === el.id}
          onSelect={() => onSelect(el.id === selected ? null : el.id)}
        />
      ))}

      {/* Roof */}
      <mesh position={[1, 6.2, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[8, 1.5, 4]} />
        <meshStandardMaterial color="#8B7355" transparent opacity={0.5} />
      </mesh>
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

export default function ModelViewer3D() {
  const [selected, setSelected] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const relatedQm = selected
    ? qmPunkte.filter((q) => q.element === selected)
    : [];

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1 rounded-lg border bg-card p-2 sm:p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          3D-Gebäudeansicht – Drehen, Zoomen & Elemente anklicken
        </p>
        <div className="h-[300px] sm:h-[400px] w-full">
          <Canvas
            camera={{ position: [12, 8, 12], fov: 45 }}
            onPointerMissed={() => setSelected(null)}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
            <Building selected={selected} onSelect={setSelected} />
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
