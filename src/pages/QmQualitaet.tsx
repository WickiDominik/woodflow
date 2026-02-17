import { useState } from "react";
import { qmPunkte } from "@/data/mockData";
import type { QmStatus, Bereich } from "@/data/mockData";
import { QmStatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function QmQualitaet() {
  const [bereichFilter, setBereichFilter] = useState<string>("alle");
  const [statusFilter, setStatusFilter] = useState<string>("alle");

  const filtered = qmPunkte.filter((q) => {
    if (bereichFilter !== "alle" && q.bereich !== bereichFilter) return false;
    if (statusFilter !== "alle" && q.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">QM / Qualität</h1>

      {/* Workflow */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Freigabe-Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-status-green" />
              <span className="text-sm font-medium">AVOR</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border bg-amber-50 px-4 py-2">
              <span className="text-sm font-medium">Produktion</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground">Montage</span>
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline">Freigabe erteilen</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <Select value={bereichFilter} onValueChange={setBereichFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Bereich" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Bereiche</SelectItem>
            <SelectItem value="AVOR">AVOR</SelectItem>
            <SelectItem value="Produktion">Produktion</SelectItem>
            <SelectItem value="Montage">Montage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            <SelectItem value="Offen">Offen</SelectItem>
            <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
            <SelectItem value="Freigegeben">Freigegeben</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Element</TableHead>
            <TableHead>Bereich</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Beschreibung</TableHead>
            <TableHead>Priorität</TableHead>
            <TableHead>Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="font-medium">{q.id}</TableCell>
              <TableCell>{q.element}</TableCell>
              <TableCell>{q.bereich}</TableCell>
              <TableCell><QmStatusBadge status={q.status} /></TableCell>
              <TableCell className="max-w-[250px] text-sm text-muted-foreground">{q.beschreibung}</TableCell>
              <TableCell>
                <span className={q.prioritaet === "Hoch" ? "font-medium text-status-red" : "text-muted-foreground"}>
                  {q.prioritaet}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{q.datum}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
