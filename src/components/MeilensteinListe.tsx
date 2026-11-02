import { useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { istDemoModus } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useMeilensteinErledigt, useMeilensteine, useProduktionsstartSetzen, type Projekt } from "@/data/repository";
import {
  FRIST_WOCHEN_VOR_PRODUKTION,
  MEILENSTEIN_LABEL,
  faelligAm,
  fristStatus,
  heuteIso,
  type FristStatus,
} from "@/lib/meilensteine";

const datumCh = (iso: string | null) => (iso ? iso.split("-").reverse().join(".") : "–");

const STATUS_STIL: Record<FristStatus, { icon: typeof Circle; klasse: string; text: string }> = {
  erledigt: { icon: CheckCircle2, klasse: "text-status-green", text: "erledigt" },
  ueberfaellig: { icon: AlertTriangle, klasse: "text-status-red", text: "überfällig" },
  bald: { icon: Clock, klasse: "text-status-yellow", text: "diese Woche fällig" },
  offen: { icon: Circle, klasse: "text-muted-foreground", text: "offen" },
  ohne_datum: { icon: Circle, klasse: "text-muted-foreground", text: "kein Termin" },
};

export function MeilensteinListe({ projekt }: { projekt: Projekt }) {
  const { data: meilensteine = [], isLoading } = useMeilensteine(projekt.id);
  const erledigt = useMeilensteinErledigt(projekt.id);
  const startSetzen = useProduktionsstartSetzen(projekt.id);
  const { rollen } = useAuth();
  const { toast } = useToast();
  const [start, setStart] = useState(projekt.produktionsstart ?? "");
  const heute = heuteIso();

  const darfAendern = !istDemoModus && rollen.some((r) => r === "admin" || r === "projektleitung" || r === "avor");
  const fehler = (e: unknown) =>
    toast({ title: "Nicht gespeichert", description: e instanceof Error ? e.message : String(e), variant: "destructive" });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <p className="text-sm font-medium">Produktionsstart</p>
          <p className="text-xs text-muted-foreground">Fristen nach Arbeitsanweisung Kap. 1.1 werden daraus berechnet.</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-[170px]" disabled={!darfAendern} />
          <Button
            variant="outline"
            disabled={!darfAendern || start === (projekt.produktionsstart ?? "")}
            onClick={() => startSetzen.mutate(start || null, { onError: fehler })}
          >
            Speichern
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lade Meilensteine …</p>
      ) : (
        <ul className="divide-y">
          {meilensteine.map((m) => {
            const status = fristStatus(m, projekt.produktionsstart, heute);
            const stil = STATUS_STIL[status];
            const Icon = stil.icon;
            const wochen = FRIST_WOCHEN_VOR_PRODUKTION[m.typ];
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Icon className={cn("h-4 w-4 shrink-0", stil.klasse)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{MEILENSTEIN_LABEL[m.typ]}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.erledigt_am
                      ? `Erledigt am ${datumCh(m.erledigt_am)}`
                      : `Fällig: ${datumCh(faelligAm(m, projekt.produktionsstart))}`}
                    {wochen !== undefined && ` · spätestens ${wochen} Wochen vor Produktionsstart`}
                  </p>
                </div>
                <span className={cn("text-xs", stil.klasse)}>{stil.text}</span>
                {darfAendern && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      erledigt.mutate({ id: m.id, erledigt_am: m.erledigt_am ? null : heute }, { onError: fehler })
                    }
                  >
                    {m.erledigt_am ? "Wieder öffnen" : "Erledigt"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
