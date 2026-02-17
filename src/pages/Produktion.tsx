import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { produktionsElemente } from "@/data/mockData";
import { QmStatusBadge } from "@/components/StatusBadge";
import ModelViewer from "@/components/ModelViewer";

export default function Produktion() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Produktion</h1>
      <Tabs defaultValue="modell">
        <TabsList>
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="elementplaene">Elementpläne</TabsTrigger>
          <TabsTrigger value="logistik">Logistikpläne</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
          <TabsTrigger value="ruestlisten">Rüstlisten</TabsTrigger>
          <TabsTrigger value="maschinen">Maschinendaten</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4"><ModelViewer /></TabsContent>

        <TabsContent value="details" className="mt-4">
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
              {produktionsElemente.map((el) => (
                <TableRow key={el.id}>
                  <TableCell className="font-medium">{el.bezeichnung}</TableCell>
                  <TableCell>{el.typ}</TableCell>
                  <TableCell>{el.geschoss}</TableCell>
                  <TableCell>{el.laenge}</TableCell>
                  <TableCell>{el.hoehe}</TableCell>
                  <TableCell><QmStatusBadge status={el.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="elementplaene" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            {produktionsElemente.slice(0, 6).map((el) => (
              <div key={el.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div>
                  <p className="text-sm font-medium">{el.bezeichnung}_Plan</p>
                  <p className="text-xs text-muted-foreground">{el.typ} · {el.geschoss}</p>
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
          <Table>
            <TableHeader><TableRow><TableHead>Position</TableHead><TableHead>Material</TableHead><TableHead>Menge</TableHead></TableRow></TableHeader>
            <TableBody>
              {[{ pos: "1", mat: "Schrauben 8x200", menge: "480 Stk" }, { pos: "2", mat: "Winkelverbinder", menge: "96 Stk" }, { pos: "3", mat: "Zuganker", menge: "24 Stk" }].map((r) => (
                <TableRow key={r.pos}><TableCell>{r.pos}</TableCell><TableCell>{r.mat}</TableCell><TableCell>{r.menge}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="maschinen" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">CNC- und Abbunddaten werden hier bereitgestellt.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
