import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ElementStatusBadge } from "@/components/StatusBadge";
import { useAktivesProjekt } from "@/context/ProjektContext";
import { useElemente } from "@/data/repository";

const meter = (mm: number | null) => (mm == null ? "–" : `${(mm / 1000).toFixed(2)}m`);
import ModelViewer3D from "@/components/ModelViewer3D";

export default function Produktion() {
  const { projekt } = useAktivesProjekt();
  const { data: elemente = [], isLoading } = useElemente(projekt?.id);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Produktion</h1>
      <Tabs defaultValue="modell">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="elementplaene">Elementpläne</TabsTrigger>
          <TabsTrigger value="logistik">Logistikpläne</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
          <TabsTrigger value="ruestlisten">Rüstlisten</TabsTrigger>
          <TabsTrigger value="maschinen">Maschinendaten</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4"><ModelViewer3D /></TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Geschoss</TableHead>
                  <TableHead>Länge</TableHead>
                  <TableHead>Höhe</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elemente.map((el) => (
                  <TableRow key={el.id}>
                    <TableCell className="font-medium">{el.baugruppe}</TableCell>
                    <TableCell>{el.typ ?? "–"}</TableCell>
                    <TableCell>{el.geschoss ?? "–"}</TableCell>
                    <TableCell>{meter(el.laenge_mm)}</TableCell>
                    <TableCell>{meter(el.hoehe_mm)}</TableCell>
                    <TableCell><ElementStatusBadge status={el.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && elemente.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Noch keine Elemente. Sie werden in Phase 2 direkt aus dem Toolcenter übernommen.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="elementplaene" className="mt-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {elemente.slice(0, 6).map((el) => (
              <div key={el.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{el.baugruppe}_Plan</p>
                  <p className="text-xs text-muted-foreground">{el.typ ?? "–"} · {el.geschoss ?? "–"}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logistik" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Logistikpläne für Transport und Bereitstellung.</div>
        </TabsContent>

        <TabsContent value="bestellungen" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Bestellübersicht Produktion.</div>
        </TabsContent>

        <TabsContent value="ruestlisten" className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Position</TableHead><TableHead>Material</TableHead><TableHead>Menge</TableHead></TableRow></TableHeader>
              <TableBody>
                {[{ pos: "1", mat: "Schrauben 8x200", menge: "480 Stk" }, { pos: "2", mat: "Winkelverbinder", menge: "96 Stk" }, { pos: "3", mat: "Zuganker", menge: "24 Stk" }].map((r) => (
                  <TableRow key={r.pos}><TableCell>{r.pos}</TableCell><TableCell>{r.mat}</TableCell><TableCell>{r.menge}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="maschinen" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">CNC- und Abbunddaten werden hier bereitgestellt.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
