import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FristBadge } from "@/components/FristBadge";
import { useFristen } from "@/data/repository";
import { filtereFristen } from "@/lib/fristen";
import { MEILENSTEIN_LABEL, heuteIso } from "@/lib/meilensteine";
import { formatDatum } from "@/lib/terminprogramm";

export function NaechsteFristenKarte({ projektId }: { projektId: string }) {
  const { data = [] } = useFristen();
  const heute = heuteIso();
  const naechste = filtereFristen(data.filter((f) => f.projekt_id === projektId), "alle", heute).slice(0, 3);
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Nächste Fristen</CardTitle>
        <Link to="/fristen" className="text-sm text-primary hover:underline">Alle Fristen</Link>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {naechste.length === 0 && <p className="text-muted-foreground">Keine offenen Fristen mit Datum.</p>}
        {naechste.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3">
            <span>{MEILENSTEIN_LABEL[f.typ]}</span>
            <span className="flex items-center gap-2"><span className="text-muted-foreground">{formatDatum(f.soll_datum)}</span><FristBadge datum={f.soll_datum} heute={heute} /></span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
