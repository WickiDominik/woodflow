import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAblagePruefungen, type AblagePruefung } from "@/data/repository";

const OFFEN = ["WARNUNG", "FEHLT", "FEHLER"];

function ton(status: string | null) {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "WARNUNG") return "bg-status-yellow/15 text-status-yellow border-status-yellow/40";
  if (s === "FEHLT" || s === "FEHLER") return "bg-status-red/15 text-status-red border-status-red/40";
  return "bg-status-green/15 text-status-green border-status-green/40";
}

function Badge({ status, klein }: { status: string | null; klein?: boolean }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border font-medium", klein ? "px-1.5 py-0 text-[10px]" : "px-2.5 py-0.5 text-xs", ton(status))}>
      {status || "–"}
    </span>
  );
}

const datum = (iso: string) => {
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(d.getDate())}.${z(d.getMonth() + 1)}.${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`;
};

function Block({ titel, p }: { titel: string; p: AblagePruefung | null }) {
  if (!p) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">{titel}</h3>
        <p className="text-sm text-muted-foreground">Noch nicht geprüft. Im Toolcenter den Produktions- bzw. Montage-Assistenten ausführen.</p>
      </div>
    );
  }
  const offen = (p.punkte ?? []).filter((x) => OFFEN.includes((x.status ?? "").trim().toUpperCase()));
  const gruppen = new Map<string, typeof offen>();
  for (const x of offen) {
    const g = x.gruppe || "Allgemein";
    gruppen.set(g, [...(gruppen.get(g) ?? []), x]);
  }
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{titel}</h3>
        <Badge status={p.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        geprüft am {datum(p.created_at)}{p.benutzer ? ` von ${p.benutzer}` : ""}
      </p>
      <p className="mt-1 text-sm font-medium">{p.anzahl_offen} offen</p>
      {offen.length > 0 && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="group flex items-center gap-1 text-sm text-primary">
            Offene Punkte <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            {[...gruppen.entries()].map(([g, liste]) => (
              <div key={g}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{g}</p>
                <ul className="mt-1 space-y-1">
                  {liste.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge status={x.status} klein />
                      <span>{x.pruefung}{x.hinweis ? ` – ${x.hinweis}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function AblageKarte({ projektId }: { projektId: string }) {
  const { data } = useAblagePruefungen(projektId);
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Ablage (Toolcenter)</CardTitle></CardHeader>
      <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Block titel="Produktion" p={data?.produktion ?? null} />
        <Block titel="Montage" p={data?.montage ?? null} />
      </CardContent>
    </Card>
  );
}
