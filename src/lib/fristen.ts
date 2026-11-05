// Offene Meilenstein-Fristen über alle Projekte.
import type { MeilensteinTyp } from "@/lib/meilensteine";

export interface Frist {
  id: string;
  projekt_id: string;
  projekt_nummer: string;
  projekt_name: string;
  typ: MeilensteinTyp;
  soll_datum: string | null;
  erledigt_am: string | null;
}

export type FristFilter = "ueberfaellig" | "drei_wochen" | "alle";
export type FristZustand = "ueberfaellig" | "diese_woche" | "spaeter";

const TAG_MS = 86_400_000;
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Tage von heute bis zur Frist; negativ = überfällig. */
export const tageBis = (datum: string, heute: string) => Math.round((ms(datum) - ms(heute)) / TAG_MS);

export function fristZustand(datum: string, heute: string): FristZustand {
  const t = tageBis(datum, heute);
  if (t < 0) return "ueberfaellig";
  if (t <= 7) return "diese_woche";
  return "spaeter";
}

/** Nur offene Fristen mit Soll-Datum, gefiltert und aufsteigend nach Datum sortiert. */
export function filtereFristen<T extends Pick<Frist, "soll_datum" | "erledigt_am">>(
  liste: T[], filter: FristFilter, heute: string,
): (T & { soll_datum: string })[] {
  return liste
    .filter((f): f is T & { soll_datum: string } => !!f.soll_datum && !f.erledigt_am)
    .filter((f) => {
      const t = tageBis(f.soll_datum, heute);
      if (filter === "ueberfaellig") return t < 0;
      if (filter === "drei_wochen") return t <= 21;
      return true;
    })
    .sort((a, b) => a.soll_datum.localeCompare(b.soll_datum));
}
