import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FristBadge } from "@/components/FristBadge";
import { useAktivesProjekt } from "@/context/ProjektContext";
import { useFristen } from "@/data/repository";
import { filtereFristen, tageBis, type FristFilter } from "@/lib/fristen";
import { MEILENSTEIN_LABEL, heuteIso } from "@/lib/meilensteine";
import { formatDatum } from "@/lib/terminprogramm";

export default function Fristen() {
  const navigate = useNavigate();
  const { projekte, setProjektId } = useAktivesProjekt();
  const { data = [], isLoading } = useFristen();
  const [filter, setFilter] = useState<FristFilter>("drei_wochen");
  const heute = heuteIso();
  const liste = filtereFristen(data, filter, heute);
  const ohneStart = projekte.filter((p) => !p.produktionsstart);
  const oeffnen = (id: string) => { setProjektId(id); navigate("/dashboard"); };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Fristen</h1>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FristFilter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="ueberfaellig">Überfällig</TabsTrigger>
          <TabsTrigger value="drei_wochen">Nächste 3 Wochen</TabsTrigger>
          <TabsTrigger value="alle">Alle offenen</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="mb-6">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projekt</TableHead><TableHead>Meilenstein</TableHead><TableHead>Soll-Datum</TableHead>
                <TableHead className="text-right">Tage bis Frist</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Lade Fristen …</TableCell></TableRow>}
              {!isLoading && liste.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Keine Fristen in dieser Ansicht.</TableCell></TableRow>}
              {liste.map((f) => {
                const t = tageBis(f.soll_datum, heute);
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <button className="text-left font-medium text-primary hover:underline" onClick={() => oeffnen(f.projekt_id)}>
                        {f.projekt_nummer} – {f.projekt_name}
                      </button>
                    </TableCell>
                    <TableCell>{MEILENSTEIN_LABEL[f.typ]}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDatum(f.soll_datum)}</TableCell>
                    <TableCell className={t < 0 ? "text-right font-medium text-status-red" : "text-right"}>{t}</TableCell>
                    <TableCell><FristBadge datum={f.soll_datum} heute={heute} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="max-w-xl">
        <CardHeader className="pb-2"><CardTitle className="text-base">Projekte ohne Produktionsstart</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {ohneStart.length === 0 ? <p className="text-muted-foreground">Alle Projekte haben einen Produktionsstart.</p> : (
            <>
              <ul className="mb-2 space-y-1">
                {ohneStart.map((p) => (
                  <li key={p.id}><button className="text-primary hover:underline" onClick={() => oeffnen(p.id)}>{p.nummer} – {p.name}</button></li>
                ))}
              </ul>
              <p className="text-muted-foreground">Terminprogramm im AVOR hochladen</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
