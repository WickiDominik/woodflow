import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIfcHochladen, type Element, type Projekt } from "@/data/repository";
import { darfProjektBearbeiten } from "@/lib/projektBearbeitung";
import ModelViewer3D from "@/components/ModelViewer3D";
import IfcViewer from "@/components/IfcViewer";

const datumZeit = (s: string) =>
  new Date(s).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ProduktionModell({ projekt, elemente }: { projekt: Projekt | undefined; elemente: Element[] }) {
  const { rollen } = useAuth();
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const hochladen = useIfcHochladen(projekt?.id);
  const darf = darfProjektBearbeiten(rollen) && !!supabase && !!projekt;

  const waehlen = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".ifc")) {
      toast({ title: "Bitte eine .ifc-Datei wählen", variant: "destructive" });
      return;
    }
    try {
      await hochladen.mutateAsync(f);
      toast({ title: "IFC-Modell hochgeladen" });
    } catch (e) {
      toast({ title: "Hochladen fehlgeschlagen", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const zeigeIfc = !!supabase && !!projekt?.ifc_pfad;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {darf && (
          <>
            <input ref={input} type="file" accept=".ifc" className="hidden" onChange={(e) => waehlen(e.target.files?.[0])} />
            <Button size="sm" onClick={() => input.current?.click()} disabled={hochladen.isPending}>
              <Upload className="mr-1 h-4 w-4" />
              {hochladen.isPending ? "Wird hochgeladen …" : "IFC-Modell hochladen"}
            </Button>
          </>
        )}
        <span className="text-xs text-muted-foreground">
          {projekt?.ifc_hochgeladen_am ? `IFC-Modell vom ${datumZeit(projekt.ifc_hochgeladen_am)}` : "Noch kein IFC-Modell – Beispielansicht"}
        </span>
      </div>
      {zeigeIfc ? <IfcViewer pfad={projekt!.ifc_pfad!} elemente={elemente} /> : <ModelViewer3D />}
    </div>
  );
}
