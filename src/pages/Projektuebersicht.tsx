import { useNavigate } from "react-router-dom";
import { projekte } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusAmpelDot } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";

export default function Projektuebersicht() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projektübersicht</h1>
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {projekte.map((p) => (
          <Card key={p.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/dashboard")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.nummer} – {p.name}</CardTitle>
                <StatusAmpelDot status={p.status} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">{p.beschreibung}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(["avor", "produktion", "montage", "fertigstellung"] as const).map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <span className="w-24 sm:w-28 capitalize text-muted-foreground">{b === "avor" ? "AVOR" : b.charAt(0).toUpperCase() + b.slice(1)}</span>
                    <Progress value={p.fortschritt[b]} className="h-2 flex-1" />
                    <span className="w-10 text-right text-xs text-muted-foreground">{p.fortschritt[b]}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{p.qm.offen} offen</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">{p.qm.freigegeben} freigegeben</span>
                {p.qm.kritisch > 0 && <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">{p.qm.kritisch} kritisch</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
