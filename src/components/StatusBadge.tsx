import { cn } from "@/lib/utils";
import type { QmStatus, StatusAmpel } from "@/data/mockData";

export function StatusAmpelDot({ status, size = "md" }: { status: StatusAmpel; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span
      className={cn("inline-block rounded-full", sizeClass, {
        "bg-status-green": status === "green",
        "bg-status-yellow": status === "yellow",
        "bg-status-red": status === "red",
      })}
    />
  );
}

export function QmStatusBadge({ status }: { status: QmStatus }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
        "bg-red-100 text-red-700": status === "Offen",
        "bg-amber-100 text-amber-700": status === "In Bearbeitung",
        "bg-emerald-100 text-emerald-700": status === "Freigegeben",
      })}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-red-500": status === "Offen",
          "bg-amber-500": status === "In Bearbeitung",
          "bg-emerald-500": status === "Freigegeben",
        })}
      />
      {status}
    </span>
  );
}
