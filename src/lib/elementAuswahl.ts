// Filter- und Auswahllogik für die Elementtabelle (Produktion › Details).
import type { ElementStatus } from "@/lib/kennzahlen";

export interface FilterbaresElement {
  id: string;
  baugruppe: string;
  bauuntergruppe: string | null;
  typ: string | null;
  geschoss: string | null;
  status: ElementStatus;
}

export interface ElementFilter {
  typ: string; // "" = alle
  status: string;
  bauuntergruppe: string;
  geschoss: string;
  suche: string;
}

export const LEERER_FILTER: ElementFilter = { typ: "", status: "", bauuntergruppe: "", geschoss: "", suche: "" };

export function filtereElemente<T extends FilterbaresElement>(elemente: T[], f: ElementFilter): T[] {
  const suche = f.suche.trim().toLowerCase();
  return elemente.filter(
    (e) =>
      (!f.typ || e.typ === f.typ) &&
      (!f.status || e.status === f.status) &&
      (!f.bauuntergruppe || e.bauuntergruppe === f.bauuntergruppe) &&
      (!f.geschoss || e.geschoss === f.geschoss) &&
      (!suche || e.baugruppe.toLowerCase().includes(suche)),
  );
}

/** Sortierte, eindeutige, nicht-leere Werte eines Feldes (für Filter-Auswahl). */
export function filterOptionen<T>(elemente: T[], feld: keyof T): string[] {
  const s = new Set<string>();
  for (const e of elemente) {
    const v = e[feld];
    if (typeof v === "string" && v.trim()) s.add(v);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "de"));
}

export function alleSichtbarenAusgewaehlt(sichtbar: { id: string }[], auswahl: Set<string>): boolean {
  return sichtbar.length > 0 && sichtbar.every((e) => auswahl.has(e.id));
}

/** Header-Checkbox: sind alle sichtbaren gewählt, werden sie abgewählt, sonst alle sichtbaren hinzugefügt. */
export function umschaltenAlleSichtbaren(sichtbar: { id: string }[], auswahl: Set<string>): Set<string> {
  const neu = new Set(auswahl);
  if (alleSichtbarenAusgewaehlt(sichtbar, auswahl)) sichtbar.forEach((e) => neu.delete(e.id));
  else sichtbar.forEach((e) => neu.add(e.id));
  return neu;
}

export function umschalten(auswahl: Set<string>, id: string): Set<string> {
  const neu = new Set(auswahl);
  if (neu.has(id)) neu.delete(id);
  else neu.add(id);
  return neu;
}

/** Nur Auswahl behalten, die noch sichtbar ist (nach Filterwechsel). */
export function nurSichtbare(sichtbar: { id: string }[], auswahl: Set<string>): Set<string> {
  const ids = new Set(sichtbar.map((e) => e.id));
  return new Set([...auswahl].filter((id) => ids.has(id)));
}

/** Verlauf (neueste zuerst, nur "neuer Status") in Übergänge von → nach umwandeln. */
export function verlaufUebergaenge<T extends { status: ElementStatus; geaendert_am: string }>(
  eintraege: T[],
): (T & { von: ElementStatus | null })[] {
  const sortiert = [...eintraege].sort((a, b) => b.geaendert_am.localeCompare(a.geaendert_am));
  return sortiert.map((e, i) => ({ ...e, von: sortiert[i + 1]?.status ?? null }));
}
