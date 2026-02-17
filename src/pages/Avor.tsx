import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModelViewer from "@/components/ModelViewer";

export default function Avor() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">AVOR</h1>
      <Tabs defaultValue="modell">
        <TabsList>
          <TabsTrigger value="modell">Modell</TabsTrigger>
          <TabsTrigger value="terminprogramm">Terminprogramm</TabsTrigger>
          <TabsTrigger value="listen">Listen</TabsTrigger>
          <TabsTrigger value="plaene">Pläne</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dateiablage">Dateiablage</TabsTrigger>
          <TabsTrigger value="bestellungen">Bestellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="modell" className="mt-4">
          <ModelViewer />
        </TabsContent>

        <TabsContent value="terminprogramm" className="mt-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Terminprogramm (Gantt-Ansicht)</p>
            <div className="space-y-2">
              {[
                { label: "Planung & AVOR", start: 0, width: 30, color: "bg-primary" },
                { label: "Elementproduktion", start: 20, width: 35, color: "bg-primary/70" },
                { label: "Transport", start: 50, width: 10, color: "bg-muted-foreground/40" },
                { label: "Montage", start: 55, width: 25, color: "bg-primary/50" },
                { label: "Fertigstellung", start: 75, width: 20, color: "bg-muted-foreground/30" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-muted-foreground">{bar.label}</span>
                  <div className="relative h-6 flex-1 rounded bg-muted">
                    <div
                      className={`absolute h-full rounded ${bar.color}`}
                      style={{ left: `${bar.start}%`, width: `${bar.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>KW 01</span><span>KW 10</span><span>KW 20</span><span>KW 30</span><span>KW 40</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="listen" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Element</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Geschoss</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["AW_EG_01", "AW_EG_02", "AW_EG_03", "DE_EG_01", "IW_EG_01"].map((el) => (
                <TableRow key={el}>
                  <TableCell className="font-medium">{el}</TableCell>
                  <TableCell>{el.startsWith("AW") ? "Aussenwand" : el.startsWith("DE") ? "Decke" : "Innenwand"}</TableCell>
                  <TableCell>EG</TableCell>
                  <TableCell className="text-sm text-muted-foreground">Bereit</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="plaene" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            {["Grundriss EG", "Grundriss OG1", "Schnitt A-A", "Fassade Nord", "Fassade Süd"].map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
                <div>
                  <p className="text-sm font-medium">{p}</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
