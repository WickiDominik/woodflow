import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModelViewer3D from "@/components/ModelViewer3D";
import { MeilensteinListe } from "@/components/MeilensteinListe";
import { ElementStatusBadge } from "@/components/StatusBadge";
import { useAktivesProjekt } from "@/context/ProjektContext";
import { useElemente } from "@/data/repository";

export default function Avor() {
  const { projekt } = useAktivesProjekt();
  const { data: elemente = [] } = useElemente(projekt?.id);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">AVOR</h1>
      <Tabs defaultValue="terminprogramm">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="terminprogramm">Meilensteine</TabsTrigger>
          <TabsTrigger value="listen">Listen</TabsTrigger>
          <TabsTrigger value="plaene">Pläne</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dateiablage">Dateiablage</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4">
          <ModelViewer3D />
        </TabsContent>

        <TabsContent value="terminprogramm" className="mt-4">
          {projekt ? <MeilensteinListe key={projekt.id} projekt={projekt} /> : null}
        </TabsContent>

        <TabsContent value="listen" className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead>Bauuntergruppe</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Geschoss</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elemente.map((el) => (
                  <TableRow key={el.id}>
                    <TableCell className="font-medium">{el.baugruppe}</TableCell>
                    <TableCell>{el.bauuntergruppe}</TableCell>
                    <TableCell>{el.typ ?? "–"}</TableCell>
                    <TableCell>{el.geschoss ?? "–"}</TableCell>
                    <TableCell><ElementStatusBadge status={el.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {elemente.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Noch keine Elemente. Sie werden in Phase 2 direkt aus dem Toolcenter übernommen.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plaene" className="mt-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {["Grundriss EG", "Grundriss OG1", "Schnitt A-A", "Fassade Nord", "Fassade Süd"].map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p}</p>
                  <p className="text-xs text-muted-foreground">Letzte Änderung: Jan 2025</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            <p>Projektdetails und technische Spezifikationen werden hier angezeigt.</p>
          </div>
        </TabsContent>

        <TabsContent value="dateiablage" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            <p>Bereichsspezifische Dateiablage für AVOR-Dokumente.</p>
          </div>
        </TabsContent>

        <TabsContent value="bestellungen" className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Best.-Nr.</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Menge</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { nr: "B-001", mat: "KVH 60x160", menge: "240 lfm", status: "Bestellt" },
                  { nr: "B-002", mat: "OSB 15mm", menge: "120 m²", status: "Geliefert" },
                  { nr: "B-003", mat: "Dämmung 160mm", menge: "95 m²", status: "Offen" },
                ].map((b) => (
                  <TableRow key={b.nr}>
                    <TableCell className="font-medium">{b.nr}</TableCell>
                    <TableCell>{b.mat}</TableCell>
                    <TableCell>{b.menge}</TableCell>
                    <TableCell className="text-sm">{b.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
