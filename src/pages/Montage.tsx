import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QmStatusBadge } from "@/components/StatusBadge";
import ModelViewer from "@/components/ModelViewer";

const montageElemente = [
  { el: "AW_EG_01", seq: 1, status: "Freigegeben" as const, transport: "LKW-01", datum: "2025-02-10" },
  { el: "AW_EG_02", seq: 2, status: "Freigegeben" as const, transport: "LKW-01", datum: "2025-02-10" },
  { el: "AW_EG_03", seq: 3, status: "In Bearbeitung" as const, transport: "LKW-02", datum: "2025-02-12" },
  { el: "AW_EG_04", seq: 4, status: "Offen" as const, transport: "–", datum: "–" },
  { el: "AW_EG_05", seq: 5, status: "Freigegeben" as const, transport: "LKW-01", datum: "2025-02-10" },
  { el: "DE_EG_01", seq: 6, status: "Offen" as const, transport: "–", datum: "–" },
  { el: "AW_OG1_01", seq: 7, status: "Offen" as const, transport: "–", datum: "–" },
];

export default function Montage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Montage</h1>
      <Tabs defaultValue="modell">
        <TabsList>
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="montageplaene">Montagepläne</TabsTrigger>
          <TabsTrigger value="logistik">Logistikpläne</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
          <TabsTrigger value="tachymeter">Tachymeterdaten</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4"><ModelViewer /></TabsContent>

        <TabsContent value="details" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seq.</TableHead>
                <TableHead>Element</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {montageElemente.map((m) => (
                <TableRow key={m.el}>
                  <TableCell>{m.seq}</TableCell>
                  <TableCell className="font-medium">{m.el}</TableCell>
                  <TableCell>{m.transport}</TableCell>
                  <TableCell>{m.datum}</TableCell>
                  <TableCell><QmStatusBadge status={m.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="montageplaene" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            {["Montageplan_EG", "Montageplan_OG1", "Kranstellplan", "Montagesequenz"].map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div><p className="text-sm font-medium">{p}</p><p className="text-xs text-muted-foreground">Stand: Feb 2025</p></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logistik" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Logistik- und Transportplanung für die Montage.</div>
        </TabsContent>
        <TabsContent value="bestellungen" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Bestellungen für Montagematerial.</div>
        </TabsContent>
        <TabsContent value="tachymeter" className="mt-4">
          <Table>
            <TableHeader><TableRow><TableHead>Punkt</TableHead><TableHead>X</TableHead><TableHead>Y</TableHead><TableHead>Z</TableHead></TableRow></TableHeader>
            <TableBody>
              {[{ p: "P1", x: "2'600.123", y: "1'200.456", z: "432.100" }, { p: "P2", x: "2'603.789", y: "1'200.456", z: "432.105" }, { p: "P3", x: "2'603.789", y: "1'204.200", z: "432.098" }].map((t) => (
                <TableRow key={t.p}><TableCell>{t.p}</TableCell><TableCell>{t.x}</TableCell><TableCell>{t.y}</TableCell><TableCell>{t.z}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
