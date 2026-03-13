import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModelViewer3D from "@/components/ModelViewer3D";

export default function Fertigstellung() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Fertigstellung</h1>
      <Tabs defaultValue="modell">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="ruestlisten">Rüstlisten</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
          <TabsTrigger value="plaene">Pläne</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4"><ModelViewer3D /></TabsContent>

        <TabsContent value="ruestlisten" className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Pos.</TableHead><TableHead>Material</TableHead><TableHead>Menge</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {[
                  { pos: "1", mat: "Fassadenbekleidung Lärche", menge: "85 m²", status: "Bestellt" },
                  { pos: "2", mat: "Fensterbank Alu", menge: "12 Stk", status: "Geliefert" },
                  { pos: "3", mat: "Dichtband", menge: "120 lfm", status: "Offen" },
                ].map((r) => (
                  <TableRow key={r.pos}><TableCell>{r.pos}</TableCell><TableCell>{r.mat}</TableCell><TableCell>{r.menge}</TableCell><TableCell>{r.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="bestellungen" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Bestellungen für Fertigstellungsarbeiten.</div>
        </TabsContent>

        <TabsContent value="plaene" className="mt-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {["Abnahmeprotokoll", "Mängelliste", "Übergabeprotokoll"].map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{p}</p><p className="text-xs text-muted-foreground">Stand: Feb 2025</p></div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
