import { cn } from "@/lib/utils";
import { fristZustand } from "@/lib/fristen";

const STIL = {
  ueberfaellig: ["Überfällig", "bg-status-red/15 text-status-red"],
  diese_woche: ["Diese Woche", "bg-status-yellow/20 text-status-yellow"],
  spaeter: ["Später", "bg-muted text-muted-foreground"],
} as const;

export function FristBadge({ datum, heute }: { datum: string; heute: string }) {
  const [label, c] = STIL[fristZustand(datum, heute)];
  return <span className={cn("whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium", c)}>{label}</span>;
}
