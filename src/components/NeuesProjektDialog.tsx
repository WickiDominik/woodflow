import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { istGueltigeProjektnummer } from "@/lib/projektnummer";

export function NeuesProjektDialog({ onAngelegt }: { onAngelegt: (id: string) => void }) {
  const [offen, setOffen] = useState(false);
  const [nummer, setNummer] = useState("");
  const [name, setName] = useState("");
  const [ort, setOrt] = useState("");
  const [start, setStart] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    const n = nummer.trim();
    if (!istGueltigeProjektnummer(n)) return setFehler("Projektnummer im Format JJ.NNNN eingeben, z. B. 26.0138.");
    if (!name.trim()) return setFehler("Name fehlt.");
    if (!supabase) return setFehler("Im Demo-Modus wird nichts gespeichert.");
    setSpeichert(true);
    const { data, error } = await supabase
      .from("projekte")
      .insert({ nummer: n, name: name.trim(), ort: ort.trim() || null, produktionsstart: start || null })
      .select("id")
      .single();
    setSpeichert(false);
    if (error) {
      setFehler(error.code === "23505" ? "Projektnummer existiert bereits" : error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["projekte"] });
    onAngelegt(data.id);
    toast({ title: `Projekt ${n} angelegt` });
    setOffen(false);
    setNummer(""); setName(""); setOrt(""); setStart("");
  };

  return (
    <Dialog open={offen} onOpenChange={(o) => { setOffen(o); setFehler(null); }}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" />Neues Projekt</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Neues Projekt</DialogTitle></DialogHeader>
        <form onSubmit={speichern} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="np-nummer">Projektnummer *</Label>
            <Input id="np-nummer" placeholder="26.0138" value={nummer} onChange={(e) => setNummer(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="np-name">Name *</Label>
            <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="np-ort">Ort</Label>
            <Input id="np-ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="np-start">Produktionsstart</Label>
            <Input id="np-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
          <DialogFooter>
            <Button type="submit" disabled={speichert}>{speichert ? "Speichert …" : "Speichern"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
