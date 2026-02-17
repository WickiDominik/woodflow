import { useState } from "react";
import type { QmStatus } from "@/data/mockData";
import { qmPunkte } from "@/data/mockData";
import { QmStatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Element {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  status: QmStatus;
}

const elements: Element[] = [
  { id: "AW_EG_01", label: "AW_EG_01", x: 20, y: 200, w: 60, h: 100, status: "Freigegeben" },
  { id: "AW_EG_02", label: "AW_EG_02", x: 80, y: 200, w: 70, h: 100, status: "Freigegeben" },
  { id: "AW_EG_03", label: "AW_EG_03", x: 150, y: 200, w: 65, h: 100, status: "In Bearbeitung" },
  { id: "AW_EG_04", label: "AW_EG_04", x: 215, y: 200, w: 80, h: 100, status: "Offen" },
  { id: "AW_EG_05", label: "AW_EG_05", x: 295, y: 200, w: 55, h: 100, status: "Freigegeben" },
  { id: "AW_EG_06", label: "AW_EG_06", x: 350, y: 200, w: 70, h: 100, status: "Offen" },
  { id: "DE_EG_01", label: "DE_EG_01", x: 20, y: 185, w: 200, h: 15, status: "Offen" },
  { id: "DE_EG_02", label: "DE_EG_02", x: 220, y: 185, w: 200, h: 15, status: "In Bearbeitung" },
  { id: "AW_OG1_01", label: "AW_OG1_01", x: 20, y: 85, w: 60, h: 100, status: "Offen" },
  { id: "AW_OG1_02", label: "AW_OG1_02", x: 80, y: 85, w: 70, h: 100, status: "In Bearbeitung" },
  { id: "AW_OG1_03", label: "AW_OG1_03", x: 150, y: 85, w: 65, h: 100, status: "Offen" },
  { id: "IW_EG_01", label: "IW_EG_01", x: 180, y: 210, w: 8, h: 80, status: "Freigegeben" },
];

const statusColor = (s: QmStatus) =>
  s === "Freigegeben" ? "fill-emerald-400/60 stroke-emerald-600" : s === "In Bearbeitung" ? "fill-amber-400/60 stroke-amber-600" : "fill-red-400/60 stroke-red-600";

export default function ModelViewer() {
  const [selected, setSelected] = useState<string | null>(null);
  const relatedQm = selected ? qmPunkte.filter((q) => q.element === selected) : [];

  return (
    <div className="flex gap-4">
      <div className="flex-1 rounded-lg border bg-card p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Schematische Gebäudeansicht – Klicken Sie auf ein Element</p>
        <svg viewBox="0 0 440 340" className="w-full" style={{ maxHeight: 400 }}>
          {/* Roof */}
          <polygon points="0,80 220,10 440,80" className="fill-muted stroke-border" strokeWidth="1.5" />
          {/* Building outline */}
          <rect x="18" y="80" width="404" height="225" className="fill-muted/40 stroke-border" strokeWidth="1" rx="2" />
          {/* Floor labels */}
          <text x="430" y="150" className="fill-muted-foreground text-[10px]" textAnchor="end">OG1</text>
          <text x="430" y="260" className="fill-muted-foreground text-[10px]" textAnchor="end">EG</text>
          <line x1="18" y1="185" x2="422" y2="185" className="stroke-border" strokeWidth="0.5" strokeDasharray="4" />
          {/* Elements */}
          {elements.map((el) => (
            <g key={el.id} className="cursor-pointer" onClick={() => setSelected(el.id === selected ? null : el.id)}>
              <rect
                x={el.x}
                y={el.y}
                width={el.w}
                height={el.h}
                className={cn(statusColor(el.status), "transition-all", el.id === selected && "stroke-[2.5]")}
                strokeWidth={el.id === selected ? 2.5 : 1}
                rx="1"
              />
              <text
                x={el.x + el.w / 2}
                y={el.y + el.h / 2 + 3}
                textAnchor="middle"
                className="fill-foreground text-[7px] font-medium pointer-events-none"
              >
                {el.label}
              </text>
            </g>
          ))}
          {/* Ground */}
          <rect x="0" y="305" width="440" height="35" className="fill-muted" rx="2" />
          <text x="220" y="327" textAnchor="middle" className="fill-muted-foreground text-[10px]">Fundament</text>
        </svg>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/60" /> Freigegeben</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400/60" /> In Bearbeitung</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-400/60" /> Offen</span>
        </div>
      </div>

      {selected && (
        <div className="w-80 rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{selected}</h3>
            <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-muted"><X size={16} /></button>
          </div>
          {relatedQm.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine QM-Einträge für dieses Element.</p>
          ) : (
            <div className="space-y-2">
              {relatedQm.map((q) => (
                <div key={q.id} className="rounded border p-2 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">{q.id}</span>
                    <QmStatusBadge status={q.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{q.beschreibung}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bereich: {q.bereich} · Priorität: {q.prioritaet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
