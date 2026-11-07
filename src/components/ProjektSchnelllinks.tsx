import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Projekt } from "@/data/repository";
import { externerProjektLink } from "@/lib/projektBearbeitung";

export function ProjektSchnelllinks({ projekt }: { projekt: Projekt }) {
  const { toast } = useToast();
  const windream = projekt.windream_pfad?.trim();
  const nextcloud = externerProjektLink(projekt.nextcloud_pfad);
  const timbar = externerProjektLink(projekt.timbar_url);
  if (!windream && !nextcloud && !timbar) return null;

  const kopieren = async () => {
    if (!windream) return;
    try {
      await navigator.clipboard.writeText(windream);
      toast({ title: "Windream-Pfad kopiert" });
    } catch {
      toast({ title: "Pfad konnte nicht kopiert werden", variant: "destructive" });
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {windream && <Button variant="outline" onClick={kopieren} title="Windream-Pfad kopieren"><Copy />Pfad kopieren</Button>}
      {nextcloud && <Button variant="outline" asChild><a href={nextcloud} target="_blank" rel="noopener noreferrer"><ExternalLink />Nextcloud</a></Button>}
      {timbar && <Button variant="outline" asChild><a href={timbar} target="_blank" rel="noopener noreferrer"><ExternalLink />Timbar</a></Button>}
    </div>
  );
}