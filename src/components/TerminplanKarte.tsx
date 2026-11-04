import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { useTermine, useTerminprogrammImport, type Projekt } from "@/data/repository";
import { heuteIso } from "@/lib/meilensteine";
import {
  filtereTermine, formatDatum, leseDatei, meilensteinDaten, terminZustand,
  type Terminprogramm, type TerminFilter,
} from "@/lib/terminprogramm";

const FILTER: { wert: TerminFilter; label: string }[] = [
  { wert: "zwei_wochen", label: "Nächste 2 Wochen" },
  { wert: "architekt", label: "Architekt" },
  { wert: "alle", label: "Alle" },
];

export function TerminplanKarte({ projekt }: { projekt: Projekt }) {
  const { rollen } = useAuth();
  const darf = rollen.some((r) => r === "admin" || r === "projektleitung" || r === "avor");
  const { data: termine = [] } = useTermine(projekt.id);
  const importieren = useTerminprogrammImport(projekt.id);
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<TerminFilter>("zwei_wochen");
  const [offen, setOffen] = useState<Terminprogramm | null>(null);
  const heute = heuteIso();

  const uebernehmen = async (tp: Terminprogramm) => {
    setOffen(null);
    const { daten, nichtGefunden } = meilensteinDaten(tp.termine);
    try {
      const r = await importieren.mutateAsync({ termine: tp.termine, meilensteinDaten: daten });
      toast({
        title: `${r.termine} Termine übernommen, ${r.meilensteine} Meilensteine gesetzt`,
        description: nichtGefunden.length ? `Nicht gefunden: ${nichtGefunden.join(", ")}` : undefined,
      });
    } catch (e) {
      toast({ title: "Import fehlgeschlagen", description: (e as Error).message, variant: "destructive" });
    }
  };

  const dateiGewaehlt = async (f: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!f) return;
    try {
      const tp = leseDatei(await f.arrayBuffer());
      if (tp.nummer && tp.nummer !== projekt.nummer) setOffen(tp);
      else await uebernehmen(tp);
    } catch (e) {
      toast({ title: "Datei konnte nicht gelesen werden", description: (e as Error).message, variant: "destructive" });
    }
  };

  const stand = termine.reduce<string | null>((m, t) => (!m || t.created_at > m ? t.created_at : m), null);
  const liste = filtereTermine(termine, filter, heute);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg">Terminplan</CardTitle>
          {stand && <p className="text-xs text-muted-foreground">Stand: {formatDatum(stand.slice(0, 10))}</p>}
        </div>
        {darf && (
          <>
            <input ref={input} type="file" accept=".xlsm,.xlsx,.xls" className="hidden" onChange={(e) => dateiGewaehlt(e.target.files?.[0])} />
            <Button size="sm" onClick={() => input.current?.click()} disabled={importieren.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              Terminprogramm hochladen
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {termine.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch kein Terminprogramm hochgeladen.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {FILTER.map((f) => (
                <button
                  key={f.wert}
                  onClick={() => setFilter(f.wert)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    filter === f.wert ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aufgabe</TableHead>
                    <TableHead>Zuständig</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Ende</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liste.map((t) => {
                    const z = terminZustand(t, heute);
                    return (
                      <TableRow key={t.id} className={cn(z === "vorbei" && "text-muted-foreground")}>
                        <TableCell className="font-medium">{t.aufgabe}</TableCell>
                        <TableCell>{t.zustaendig ?? "–"}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDatum(t.start)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDatum(t.ende)}</TableCell>
                        <TableCell>
                          {z && (
                            <span
                              className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", {
                                "bg-muted text-muted-foreground": z === "vorbei",
                                "bg-sky-100 text-sky-700": z === "laeuft",
                                "bg-amber-100 text-amber-700": z === "diese_woche",
                              })}
                            >
                              {z === "vorbei" ? "vorbei" : z === "laeuft" ? "läuft" : "diese Woche"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {liste.length === 0 && <p className="p-3 text-sm text-muted-foreground">Keine Termine für diesen Filter.</p>}
            </div>
          </>
        )}
      </CardContent>

      <AlertDialog open={!!offen} onOpenChange={(o) => !o && setOffen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anderes Projekt</AlertDialogTitle>
            <AlertDialogDescription>
              Datei gehört zu Projekt {offen?.nummer}, ausgewähltes Projekt ist {projekt.nummer}. Trotzdem übernehmen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => offen && uebernehmen(offen)}>Übernehmen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
