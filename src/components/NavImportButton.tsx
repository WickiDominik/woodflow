import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseNavProjektkarte, type NavProjektdaten } from "@/lib/navProjektkarte";

// Nur diese Felder werden übernommen – keine Beträge (Auftragssumme, Budget usw.).
const FELDER: { key: keyof NavProjektdaten; label: string }[] = [
  { key: "bauherr", label: "Bauherr" },
  { key: "architekt", label: "Architekt" },
  { key: "architekt_telefon", label: "Architekt Telefon" },
  { key: "architekt_email", label: "Architekt E-Mail" },
  { key: "baustelle", label: "Baustelle" },
  { key: "projektleiter", label: "Projektleiter" },
  { key: "verkaeufer", label: "Verkäufer" },
  { key: "nav_status", label: "NAV-Status" },
];

export function NavImportButton({ onFertig }: { onFertig: (id: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const gewaehlt = async (f: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!f) return;
    if (!supabase) return toast({ title: "Im Demo-Modus wird nichts gespeichert.", variant: "destructive" });
    setLaeuft(true);
    try {
      const d = parseNavProjektkarte(XLSX.read(await f.arrayBuffer(), { type: "array" }));
      const update: Partial<Record<keyof NavProjektdaten | "nav_import_am", string>> = {};
      const labels: string[] = [];
      for (const { key, label } of FELDER) {
        const v = d[key];
        if (v) { update[key] = v; labels.push(label); }
      }
      update.nav_import_am = new Date().toISOString();

      const { data: vorhanden, error: e1 } = await supabase.from("projekte").select("id").eq("nummer", d.nummer).maybeSingle();
      if (e1) throw e1;
      let id = vorhanden?.id as string | undefined;
      const neu = !id;
      if (!id) {
        const { data, error } = await supabase
          .from("projekte")
          .insert({ nummer: d.nummer, name: d.name ?? d.nummer, ort: d.ort, ...update })
          .select("id").single();
        if (error) throw error;
        id = data.id;
      } else {
        const { error } = await supabase.from("projekte").update(update).eq("id", id);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["projekte"] });
      onFertig(id!);
      toast({
        title: `Projekt ${d.nummer} ${neu ? "angelegt" : "aus NAV übernommen"}`,
        description: labels.length ? `Aktualisiert: ${labels.join(", ")}` : "Keine Felder in der Datei ausgefüllt.",
      });
    } catch (e) {
      toast({ title: "NAV-Import fehlgeschlagen", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <>
      <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => gewaehlt(e.target.files?.[0])} />
      <Button variant="outline" disabled={laeuft} onClick={() => input.current?.click()}>
        <FileSpreadsheet className="mr-1 h-4 w-4" />{laeuft ? "Liest …" : "NAV-Projektkarte hochladen"}
      </Button>
    </>
  );
}
