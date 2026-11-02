// Meilensteine des Projektablaufs nach Arbeitsanweisung Werkplanung, Kap. 1.1.
// Fristen relativ zum Produktionsstart:
//   Ausführungspläne        ca. 9-12 Wochen vorher (spätestens 9 Wochen)
//   Material bestellt       min. 6 Wochen vorher
//   Planung abgeschlossen   min. 2 Wochen vorher

export type MeilensteinTyp =
  | "bta"
  | "details"
  | "kontrollplaene"
  | "ausfuehrungsplaene"
  | "material_bestellt"
  | "planung_abgeschlossen"
  | "produktionsstart"
  | "aufrichte"
  | "abnahme";

export interface Meilenstein {
  id: string;
  typ: MeilensteinTyp;
  soll_datum: string | null; // ISO yyyy-mm-dd
  erledigt_am: string | null;
  bemerkung?: string | null;
}

export const MEILENSTEIN_REIHENFOLGE: MeilensteinTyp[] = [
  "bta",
  "details",
  "kontrollplaene",
  "ausfuehrungsplaene",
  "material_bestellt",
  "planung_abgeschlossen",
  "produktionsstart",
  "aufrichte",
  "abnahme",
];

export const MEILENSTEIN_LABEL: Record<MeilensteinTyp, string> = {
  bta: "Bauteilaufbauten (BTA)",
  details: "Detailpläne",
  kontrollplaene: "Kontrollpläne",
  ausfuehrungsplaene: "Ausführungspläne",
  material_bestellt: "Material bestellt",
  planung_abgeschlossen: "Planung abgeschlossen",
  produktionsstart: "Produktionsstart",
  aufrichte: "Aufrichte",
  abnahme: "Abnahme",
};

/** Wochen vor Produktionsstart, bis wann der Meilenstein spätestens erreicht sein muss. */
export const FRIST_WOCHEN_VOR_PRODUKTION: Partial<Record<MeilensteinTyp, number>> = {
  ausfuehrungsplaene: 9,
  material_bestellt: 6,
  planung_abgeschlossen: 2,
};

/** Ab so vielen Tagen vor Ablauf einer Frist wird gewarnt. */
export const WARN_TAGE = 7;

export type FristStatus = "erledigt" | "ueberfaellig" | "bald" | "offen" | "ohne_datum";

const TAG_MS = 24 * 60 * 60 * 1000;

function parseIso(d: string): number {
  // als UTC-Mitternacht parsen, damit Zeitzonen keine Tage verschieben
  return Date.parse(`${d}T00:00:00Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Spätester Termin eines Meilensteins: gesetztes Soll-Datum, sonst aus dem Produktionsstart abgeleitet. */
export function faelligAm(m: Pick<Meilenstein, "typ" | "soll_datum">, produktionsstart: string | null): string | null {
  if (m.soll_datum) return m.soll_datum;
  if (m.typ === "produktionsstart") return produktionsstart;
  const wochen = FRIST_WOCHEN_VOR_PRODUKTION[m.typ];
  if (wochen === undefined || !produktionsstart) return null;
  return toIso(parseIso(produktionsstart) - wochen * 7 * TAG_MS);
}

export function fristStatus(
  m: Pick<Meilenstein, "typ" | "soll_datum" | "erledigt_am">,
  produktionsstart: string | null,
  heute: string,
): FristStatus {
  if (m.erledigt_am) return "erledigt";
  const faellig = faelligAm(m, produktionsstart);
  if (!faellig) return "ohne_datum";
  const tage = (parseIso(faellig) - parseIso(heute)) / TAG_MS;
  if (tage < 0) return "ueberfaellig";
  if (tage <= WARN_TAGE) return "bald";
  return "offen";
}

export function sortiereMeilensteine<T extends Pick<Meilenstein, "typ">>(liste: T[]): T[] {
  return [...liste].sort(
    (a, b) => MEILENSTEIN_REIHENFOLGE.indexOf(a.typ) - MEILENSTEIN_REIHENFOLGE.indexOf(b.typ),
  );
}

export function heuteIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
