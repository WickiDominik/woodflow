import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { istDemoModus } from "@/integrations/supabase/modus";
import { externerProjektLink } from "@/lib/projektBearbeitung";
import type { Projekt } from "@/data/repository";

const felder = [
  ["name", "Name *", "text"],
  ["ort", "Ort", "text"],
  ["produktionsstart", "Produktionsstart", "date"],
  ["windream_pfad", "Windream-Pfad", "text"],
  ["nextcloud_pfad", "Nextcloud-Link", "url"],
  ["timbar_url", "Timbar-Link", "url"],
] as const;
type Feld = typeof felder[number][0];
const projektWerte = (projekt: Projekt): Record<Feld, string> => ({
  name: projekt.name, ort: projekt.ort ?? "", produktionsstart: projekt.produktionsstart ?? "",
  windream_pfad: projekt.windream_pfad ?? "", nextcloud_pfad: projekt.nextcloud_pfad ?? "", timbar_url: projekt.timbar_url ?? "",
});

export function ProjektBearbeitenDialog({ projekt }: { projekt: Projekt }) {
  const [offen, setOffen] = useState(false);
  const [werte, setWerte] = useState(() => projektWerte(projekt));
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    if (!werte.name.trim()) return setFehler("Name fehlt.");
    for (const feld of ["nextcloud_pfad", "timbar_url"] as const) {
      if (werte[feld].trim() && !externerProjektLink(werte[feld])) {
        return setFehler("Bitte einen gültigen Link mit https:// oder http:// eingeben.");
      }
    }
    if (istDemoModus || !supabase) return setFehler("Im Demo-Modus wird nichts gespeichert.");
    setSpeichert(true);
    try {
      const { data, error } = await supabase.from("projekte").update({
        name: werte.name.trim(), ort: werte.ort.trim() || null,
        produktionsstart: werte.produktionsstart || null,
        windream_pfad: werte.windream_pfad.trim() || null,
        nextcloud_pfad: werte.nextcloud_pfad.trim() || null,
        timbar_url: werte.timbar_url.trim() || null,
      }).eq("id", projekt.id).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Projekt konnte nicht gespeichert werden.");
      await qc.invalidateQueries({ queryKey: ["projekte"] });
      toast({ title: `Projekt ${projekt.nummer} gespeichert` });
      setOffen(false);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Projekt konnte nicht gespeichert werden.");
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={(o) => {
      if (speichert) return;
      setOffen(o); setFehler(null);
      if (o) setWerte(projektWerte(projekt));
    }}>
      <DialogTrigger asChild><Button variant="outline"><Pencil />Projekt bearbeiten</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Projekt bearbeiten – {projekt.nummer}</DialogTitle></DialogHeader>
        <form onSubmit={speichern} className="space-y-3">
          {felder.map(([feld, label, typ]) => (
            <div key={feld} className="space-y-1">
              <Label htmlFor={`pb-${feld}`}>{label}</Label>
              <Input id={`pb-${feld}`} type={typ} required={feld === "name"} disabled={speichert}
                value={werte[feld]} onChange={(e) => setWerte((alt) => ({ ...alt, [feld]: e.target.value }))} />
            </div>
          ))}
          {fehler && <p role="alert" className="text-sm text-destructive">{fehler}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={speichert} onClick={() => setOffen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={speichert}>{speichert ? "Speichert …" : "Speichern"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}