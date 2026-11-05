import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Projekt } from "@/data/repository";

const datum = (iso: string) => new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

export function ProjektdatenKarte({ projekt: p }: { projekt: Projekt }) {
  const architekt = p.architekt || p.architekt_telefon || p.architekt_email ? (
    <span className="flex flex-col">
      {p.architekt && <span>{p.architekt}</span>}
      {p.architekt_telefon && <a className="text-primary underline" href={`tel:${p.architekt_telefon.replace(/\s/g, "")}`}>{p.architekt_telefon}</a>}
      {p.architekt_email && <a className="text-primary underline" href={`mailto:${p.architekt_email}`}>{p.architekt_email}</a>}
    </span>
  ) : null;
  const zeilen: [string, ReactNode][] = [
    ["Bauherr", p.bauherr],
    ["Architekt", architekt],
    ["Baustelle", p.baustelle],
    ["Projektleiter", p.projektleiter],
    ["Verkäufer", p.verkaeufer],
    ["NAV-Status", p.nav_status],
    ["Importiert am", p.nav_import_am ? datum(p.nav_import_am) : null],
  ];
  const sichtbar = zeilen.filter(([, v]) => v);
  const nurDatum = sichtbar.length === 0 || (sichtbar.length === 1 && sichtbar[0][0] === "Importiert am");

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3"><CardTitle className="text-base">Projektdaten</CardTitle></CardHeader>
      <CardContent>
        {nurDatum ? (
          <p className="text-sm text-muted-foreground">Noch keine NAV-Daten – Projektkarte auf der Projektübersicht hochladen</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
            {sichtbar.map(([l, v]) => (
              <div key={l} className="contents">
                <dt className="text-muted-foreground">{l}</dt>
                <dd className="mb-2 sm:mb-0">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
