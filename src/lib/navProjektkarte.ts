// NAV 2018 «Projektkarte» (Excel-Export) einlesen.
import * as XLSX from "xlsx";

export interface NavProjektdaten {
  nummer: string;
  name: string | null;
  bauherr: string | null;
  architekt: string | null;
  architekt_telefon: string | null;
  architekt_email: string | null;
  baustelle: string | null;
  ort: string | null;
  projektleiter: string | null;
  verkaeufer: string | null;
  nav_status: string | null;
}

export const NUMMER_REGEX = /^\d{2}\.\d{4}$/;

function wert(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return String(v);
  const s = String(v).trim();
  return s ? s : null;
}

export function labelMap(wb: XLSX.WorkBook): Map<string, string> {
  const map = new Map<string, string>();
  for (const name of wb.SheetNames) {
    const zeilen = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: null });
    for (const r of zeilen.slice(2)) {
      const label = wert(r?.[0]);
      const v = wert(r?.[1]);
      if (label && v !== null && !map.has(label)) map.set(label, v);
    }
  }
  return map;
}

const verbinden = (teile: (string | null | undefined)[], sep: string) => {
  const t = teile.filter((x): x is string => !!x);
  return t.length ? t.join(sep) : null;
};

export function parseNavProjektkarte(wb: XLSX.WorkBook): NavProjektdaten {
  const m = labelMap(wb);
  const g = (l: string) => m.get(l) ?? null;
  const nummer = g("Nr.");
  if (!nummer || !NUMMER_REGEX.test(nummer)) {
    throw new Error(`Projektnummer ${nummer ?? "(leer)"} hat nicht das Format JJ.NNNN.`);
  }
  return {
    nummer,
    name: g("Beschreibung"),
    bauherr: verbinden([g("Bauherr Name"), g("Bauherr Ort")], ", "),
    architekt: g("Architekt Name"),
    architekt_telefon: g("Architekt Telefon"),
    architekt_email: g("Architekt E-Mail"),
    baustelle: verbinden([g("Lief. an Adresse"), g("Lief. an PLZ Code/Ort")], ", "),
    ort: g("Lief. an Ort"),
    projektleiter: g("Projektleitername"),
    verkaeufer: g("Name verantw. Verkäufer"),
    nav_status: g("Status"),
  };
}
