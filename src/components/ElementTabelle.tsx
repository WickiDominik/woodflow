import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ElementStatusBadge } from "@/components/StatusBadge";
import { useAuth, type Rolle } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useElementStatusSetzen, useElementVerlauf, type Element } from "@/data/repository";
import { ELEMENT_STATUS_LABEL, ELEMENT_STATUS_REIHENFOLGE, type ElementStatus } from "@/lib/kennzahlen";
import {
  LEERER_FILTER, alleSichtbarenAusgewaehlt, filterOptionen, filtereElemente, nurSichtbare, umschalten, umschaltenAlleSichtbaren,
  verlaufUebergaenge, type ElementFilter,
} from "@/lib/elementAuswahl";

// Entspricht der RLS-Policy "elemente ändern (alle Rollen)"; der Verlauf schreibt der DB-Trigger.
const STATUS_ROLLEN: Rolle[] = ["admin", "projektleitung", "avor", "produktion", "montage"];
const ALLE = "__alle";
const meter = (mm: number | null | undefined) => (mm == null ? "–" : `${(mm / 1000).toFixed(2)}m`);
const datumZeit = (s: string) =>
  new Date(s).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function VerlaufPopover({ element }: { element: Element }) {
  const [offen, setOffen] = useState(false);
  const { data = [], isLoading } = useElementVerlauf(offen ? element.id : undefined);
  const zeilen = verlaufUebergaenge(data).slice(0, 10);
  return (
    <Popover open={offen} onOpenChange={setOffen}>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ElementStatusBadge status={element.status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="mb-2 text-sm font-semibold">Verlauf · {element.baugruppe}</p>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Lädt …</p>
        ) : zeilen.length === 0 ? (
          <p className="text-xs text-muted-foreground">Noch keine Statusänderungen.</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {zeilen.map((z) => (
              <li key={z.id} className="flex flex-col">
                <span className="text-muted-foreground">{datumZeit(z.geaendert_am)} · {z.benutzer ?? "System"}</span>
                <span>{z.von ? ELEMENT_STATUS_LABEL[z.von] : "–"} → <strong>{ELEMENT_STATUS_LABEL[z.status]}</strong></span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterSelect({ label, wert, optionen, onChange }: { label: string; wert: string; optionen: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <Select value={wert || ALLE} onValueChange={(v) => onChange(v === ALLE ? "" : v)}>
      <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALLE}>{label}: alle</SelectItem>
        {optionen.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function ElementTabelle({ projektId, elemente, isLoading }: { projektId: string | undefined; elemente: Element[]; isLoading: boolean }) {
  const { rollen } = useAuth();
  const { toast } = useToast();
  const darfAendern = !supabase || rollen.some((r) => STATUS_ROLLEN.includes(r));
  const [filter, setFilter] = useState<ElementFilter>(LEERER_FILTER);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [neuerStatus, setNeuerStatus] = useState<ElementStatus | "">("");
  const setzen = useElementStatusSetzen(projektId);

  const sichtbar = useMemo(() => filtereElemente(elemente, filter), [elemente, filter]);
  const typen = filterOptionen(elemente, "typ");
  const untergruppen = filterOptionen(elemente, "bauuntergruppe");
  const geschosse = filterOptionen(elemente, "geschoss");
  const hatStaerke = elemente.some((e) => e.breite_mm != null);
  const hatUntergruppe = untergruppen.length > 0;
  const gewaehlt = nurSichtbare(sichtbar, auswahl);

  const aendereFilter = (f: Partial<ElementFilter>) => {
    const neu = { ...filter, ...f };
    setFilter(neu);
    setAuswahl((a) => nurSichtbare(filtereElemente(elemente, neu), a));
  };

  const statusSetzen = () => {
    if (!neuerStatus || gewaehlt.size === 0) return;
    setzen.mutate(
      { ids: [...gewaehlt], status: neuerStatus },
      {
        onSuccess: (n) => {
          toast({ title: `${n} Elemente auf ${ELEMENT_STATUS_LABEL[neuerStatus]} gesetzt` });
          setAuswahl(new Set());
          setNeuerStatus("");
        },
        onError: (e) => toast({ title: "Status konnte nicht gesetzt werden", description: (e as Error).message, variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input placeholder="Element suchen …" value={filter.suche} onChange={(e) => aendereFilter({ suche: e.target.value })} className="sm:w-56" />
        <FilterSelect label="Typ" wert={filter.typ} optionen={typen.map((t) => ({ v: t, l: t }))} onChange={(v) => aendereFilter({ typ: v })} />
        <FilterSelect label="Status" wert={filter.status} optionen={ELEMENT_STATUS_REIHENFOLGE.map((s) => ({ v: s, l: ELEMENT_STATUS_LABEL[s] }))} onChange={(v) => aendereFilter({ status: v })} />
        {hatUntergruppe && <FilterSelect label="Bauuntergruppe" wert={filter.bauuntergruppe} optionen={untergruppen.map((t) => ({ v: t, l: t }))} onChange={(v) => aendereFilter({ bauuntergruppe: v })} />}
        {geschosse.length > 0 && <FilterSelect label="Geschoss" wert={filter.geschoss} optionen={geschosse.map((t) => ({ v: t, l: t }))} onChange={(v) => aendereFilter({ geschoss: v })} />}
      </div>

      {darfAendern && gewaehlt.size > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium">{gewaehlt.size} ausgewählt</span>
          <Select value={neuerStatus} onValueChange={(v) => setNeuerStatus(v as ElementStatus)}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Neuer Status" /></SelectTrigger>
            <SelectContent>
              {ELEMENT_STATUS_REIHENFOLGE.map((s) => <SelectItem key={s} value={s}>{ELEMENT_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={statusSetzen} disabled={!neuerStatus || setzen.isPending}>Status setzen</Button>
          <Button variant="ghost" onClick={() => setAuswahl(new Set())}>Auswahl aufheben</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {darfAendern && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="alle sichtbaren auswählen"
                    title="alle sichtbaren auswählen"
                    checked={alleSichtbarenAusgewaehlt(sichtbar, auswahl)}
                    onCheckedChange={() => setAuswahl((a) => umschaltenAlleSichtbaren(sichtbar, a))}
                  />
                </TableHead>
              )}
              <TableHead>Element</TableHead>
              {hatUntergruppe && <TableHead>Bauuntergruppe</TableHead>}
              <TableHead>Typ</TableHead>
              <TableHead>Geschoss</TableHead>
              <TableHead>Länge</TableHead>
              <TableHead>Höhe</TableHead>
              {hatStaerke && <TableHead>Stärke</TableHead>}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sichtbar.map((el) => (
              <TableRow key={el.id} data-state={auswahl.has(el.id) ? "selected" : undefined}>
                {darfAendern && (
                  <TableCell>
                    <Checkbox aria-label={`${el.baugruppe} auswählen`} checked={auswahl.has(el.id)} onCheckedChange={() => setAuswahl((a) => umschalten(a, el.id))} />
                  </TableCell>
                )}
                <TableCell className="font-medium">{el.baugruppe}</TableCell>
                {hatUntergruppe && <TableCell>{el.bauuntergruppe || "–"}</TableCell>}
                <TableCell>{el.typ ?? "–"}</TableCell>
                <TableCell>{el.geschoss ?? "–"}</TableCell>
                <TableCell>{meter(el.laenge_mm)}</TableCell>
                <TableCell>{meter(el.hoehe_mm)}</TableCell>
                {hatStaerke && <TableCell>{el.breite_mm == null ? "–" : `${el.breite_mm} mm`}</TableCell>}
                <TableCell><VerlaufPopover element={el} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && elemente.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Noch keine Elemente. Sie werden in Phase 2 direkt aus dem Toolcenter übernommen.</p>
        )}
        {elemente.length > 0 && sichtbar.length === 0 && <p className="p-4 text-sm text-muted-foreground">Keine Elemente für diesen Filter.</p>}
      </div>
    </div>
  );
}
