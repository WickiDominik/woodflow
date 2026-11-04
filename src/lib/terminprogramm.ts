// Holzbau-Terminprogramm (.xlsm) einlesen, Blatt "Terminplan kompakt".
import * as XLSX from "xlsx";
import type { MeilensteinTyp } from "@/lib/meilensteine";

export const BLATT = "Terminplan kompakt";

export interface Termin {
  reihenfolge: number;
  aufgabe: string;
  zustaendig: string | null;
  start: string; // yyyy-mm-dd
  ende: string | null;
}

export interface Terminprogramm {
  nummer: string | null;
  termine: Termin[];
}

const z = (n: number) => String(n).padStart(2, "0");

export function zuIsoDatum(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    // SheetJS liefert lokale Mitternacht; kleine Zeitverschiebungen abfangen
    const d = new Date(v.getTime() + 12 * 3600 * 1000);
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  if (typeof v === "number") {
    const p = XLSX.SSF.parse_date_code(v);
    return p ? `${p.y}-${z(p.m)}-${z(p.d)}` : null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${z(+m[2])}-${z(+m[1])}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

export function nummerAusZelle(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v.toFixed(4);
  const s = String(v).trim();
  return s || null;
}

export function parseTerminprogramm(wb: XLSX.WorkBook): Terminprogramm {
  const ws = wb.Sheets[BLATT];
  if (!ws) throw new Error(`Blatt «${BLATT}» nicht gefunden.`);
  const zeilen = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null, blankrows: true });
  const nummer = nummerAusZelle(ws["A1"]?.v);
  const kopf = zeilen.findIndex((r) => String(r?.[1] ?? "").trim() === "Aufgabe / Ereignis");
  if (kopf < 0) throw new Error("Zeile «Aufgabe / Ereignis» nicht gefunden.");
  const termine: Termin[] = [];
  for (const r of zeilen.slice(kopf + 1)) {
    const aufgabe = String(r?.[1] ?? "").trim();
    const start = zuIsoDatum(r?.[3]);
    if (!aufgabe || !start) continue;
    const zust = String(r?.[2] ?? "").trim();
    termine.push({ reihenfolge: termine.length + 1, aufgabe, zustaendig: zust || null, start, ende: zuIsoDatum(r?.[4]) });
  }
  return { nummer, termine };
}

export function leseDatei(daten: ArrayBuffer): Terminprogramm {
  return parseTerminprogramm(XLSX.read(daten, { type: "array", cellDates: true }));
}

// ------------------------------------------------------------ Meilenstein-Zuordnung

export const MEILENSTEIN_AUFGABE: Record<MeilensteinTyp, { aufgabe: string; feld: "start" | "ende" }> = {
  bta: { aufgabe: "Freigabe Bauteilaufbauten", feld: "ende" },
  details: { aufgabe: "Freigabe Detailpläne", feld: "ende" },
  kontrollplaene: { aufgabe: "Freigabe Kontrollpläne Hüllenmodell", feld: "ende" },
  ausfuehrungsplaene: { aufgabe: "Freigabe Ausführungspläne HB", feld: "ende" },
  material_bestellt: { aufgabe: "Materialbestellung Produktion", feld: "ende" },
  planung_abgeschlossen: { aufgabe: "Produktionsbereit", feld: "ende" },
  produktionsstart: { aufgabe: "Abbund", feld: "start" },
  aufrichte: { aufgabe: "Montage Holzbau", feld: "start" },
  abnahme: { aufgabe: "Fertigstellung (abdichten/verankern)", feld: "ende" },
};

const norm = (s: string) => s.trim().toLowerCase();

export function meilensteinDaten(termine: Termin[]): {
  daten: Partial<Record<MeilensteinTyp, string>>;
  nichtGefunden: string[];
} {
  const daten: Partial<Record<MeilensteinTyp, string>> = {};
  const nichtGefunden: string[] = [];
  for (const [typ, { aufgabe, feld }] of Object.entries(MEILENSTEIN_AUFGABE) as [MeilensteinTyp, { aufgabe: string; feld: "start" | "ende" }][]) {
    const t = termine.find((x) => norm(x.aufgabe) === norm(aufgabe));
    const d = t ? t[feld] : null;
    if (d) daten[typ] = d;
    else nichtGefunden.push(aufgabe);
  }
  return { daten, nichtGefunden };
}

// ------------------------------------------------------------ Anzeige

export type TerminZustand = "vorbei" | "laeuft" | "diese_woche" | null;

const tageZwischen = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000;

export function terminZustand(t: Pick<Termin, "start" | "ende">, heute: string): TerminZustand {
  const ende = t.ende ?? t.start;
  if (ende < heute) return "vorbei";
  if (t.start <= heute) return "laeuft";
  if (tageZwischen(heute, t.start) <= 7) return "diese_woche";
  return null;
}

export type TerminFilter = "zwei_wochen" | "architekt" | "alle";

export function filtereTermine<T extends Pick<Termin, "start" | "ende" | "zustaendig">>(liste: T[], filter: TerminFilter, heute: string): T[] {
  return liste.filter((t) => {
    const z = terminZustand(t, heute);
    if (filter === "alle") return true;
    if (filter === "architekt") return norm(t.zustaendig ?? "") === "arch" && z !== "vorbei";
    return z === "laeuft" || (z !== "vorbei" && tageZwischen(heute, t.start) <= 14);
  });
}

export const formatDatum = (iso: string | null) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "–");
