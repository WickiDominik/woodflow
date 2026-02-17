import { useNavigate } from "react-router-dom";
import { projekte } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusAmpelDot } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, Box } from "lucide-react";

const projekt = projekte[0];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <StatusAmpelDot status={projekt.status} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">{projekt.nummer} – {projekt.name}</h1>
          <p className="text-sm text-muted-foreground">{projekt.beschreibung}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {([
          { label: "AVOR", value: projekt.fortschritt.avor },
          { label: "Produktion", value: projekt.fortschritt.produktion },
          { label: "Montage", value: projekt.fortschritt.montage },
          { label: "Fertigstellung", value: projekt.fortschritt.fertigstellung },
        ] as const).map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">{item.label}</p>
              <div className="flex items-center gap-3">
                <Progress value={item.value} className="h-2.5 flex-1" />
                <span className="text-lg font-semibold">{item.value}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QM Status */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">QM-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-status-red">{projekt.qm.offen}</p>
              <p className="text-sm text-muted-foreground">Offene Punkte</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-status-green">{projekt.qm.freigegeben}</p>
              <p className="text-sm text-muted-foreground">Freigegeben</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-status-red">{projekt.qm.kritisch}</p>
              <p className="text-sm text-muted-foreground">Kritische Punkte</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate("/avor")} variant="outline"><Eye className="mr-2 h-4 w-4" />Projekt öffnen</Button>
        <Button onClick={() => navigate("/qm")} variant="outline"><ShieldCheck className="mr-2 h-4 w-4" />QM anzeigen</Button>
        <Button onClick={() => navigate("/avor")} variant="outline"><Box className="mr-2 h-4 w-4" />Zum Modell</Button>
      </div>
    </div>
  );
}
