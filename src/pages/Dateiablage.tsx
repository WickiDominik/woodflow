import { dateiablage } from "@/data/mockData";
import { Folder, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Dateiablage() {
  const [openFolder, setOpenFolder] = useState<string | null>("Pläne");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Zentrale Dateiablage</h1>
      <div className="space-y-1">
        {dateiablage.map((ordner) => (
          <div key={ordner.name}>
            <button
              onClick={() => setOpenFolder(openFolder === ordner.name ? null : ordner.name)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                openFolder === ordner.name && "bg-muted"
              )}
            >
              <Folder className="h-4 w-4 text-primary" />
              {ordner.name}
              <span className="ml-auto text-xs text-muted-foreground">{ordner.dateien.length} Dateien</span>
            </button>
            {openFolder === ordner.name && (
              <div className="ml-6 space-y-0.5 py-1">
                {ordner.dateien.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 rounded px-3 py-1.5 text-sm hover:bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.groesse}</span>
                    <span className="text-xs text-muted-foreground">{d.datum}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
