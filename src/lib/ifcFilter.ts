// BG / BUG / Material je IFC-Bauteil bestimmen und filtern (ähnlich wie in cadwork).
// Ohne three.js-Abhängigkeit, damit testbar.
import { kategorieVon, type MaterialKategorie } from "@/lib/ifcMaterial";

/** Rohdaten eines Bauteils aus der IFC-Datei. */
export interface IfcTeilRoh {
  name: string | null;
  ifcTyp: string | null;
  material: string | null;
  /** Werte aus Property-Sets ("Baugruppe"/"Gruppe"/"Group" bzw. "Bauuntergruppe"/"Untergruppe"/"Subgroup"). */
  bg: string | null;
  bug: string | null;
  /** Farbe aus cadwork (IfcStyledItem), r,g,b 0..1 */
  farbe: [number, number, number] | null;
}

export interface TeilAttribute {
  name: string | null;
  ifcTyp: string | null;
  material: string;
  kategorie: MaterialKategorie;
  bg: string;
  bug: string;
  farbe: [number, number, number] | null;
}

export const OHNE = "(ohne)";

const PROP_BG = new Set(["baugruppe", "gruppe", "group", "assembly", "baugruppenname"]);
const PROP_BUG = new Set(["bauuntergruppe", "unterbaugruppe", "untergruppe", "subgroup", "sub group", "sub-group"]);
const PROP_MATERIAL = new Set(["material", "materialname", "material name"]);

/** Ordnet einen Property-Namen (cadwork deutsch/englisch) einem Filter-Attribut zu. */
export function propArt(name: string): "bg" | "bug" | "material" | null {
  const n = name.trim().toLowerCase();
  if (PROP_BG.has(n)) return "bg";
  if (PROP_BUG.has(n)) return "bug";
  if (PROP_MATERIAL.has(n)) return "material";
  return null;
}

/** BUG aus der BG ableiten, wenn sie fehlt (Schär-Konvention: BG "AW_EG_01" → BUG "AW_EG"). */
export function bugAusBg(bg: string | null | undefined): string | null {
  if (!bg) return null;
  const m = bg.trim().match(/^(.+?)[_\s-]+\d+(?:\.\d+)*$/);
  return m ? m[1] : null;
}

const leer = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

/**
 * Endgültige Attribute je Bauteil: eigener Wert aus dem IFC → Wert der umgebenden Baugruppe
 * (IfcElementAssembly) → Woodflow-Element → abgeleitet.
 */
export function bestimmeAttribute(
  roh: IfcTeilRoh | undefined,
  baugruppe: { name: string | null; bg: string | null; bug: string | null } | undefined,
  element: { baugruppe: string; bauuntergruppe?: string | null } | undefined,
): TeilAttribute {
  const bg = leer(roh?.bg) ?? leer(baugruppe?.bg) ?? leer(element?.baugruppe) ?? leer(baugruppe?.name);
  const bug = leer(roh?.bug) ?? leer(baugruppe?.bug) ?? leer(element?.bauuntergruppe) ?? bugAusBg(bg);
  const material = leer(roh?.material);
  return {
    name: roh?.name ?? null,
    ifcTyp: roh?.ifcTyp ?? null,
    material: material ?? OHNE,
    kategorie: kategorieVon(material, roh?.ifcTyp),
    bg: bg ?? OHNE,
    bug: bug ?? OHNE,
    farbe: roh?.farbe ?? null,
  };
}

export type FilterArt = "bg" | "bug" | "material";

/** Ausgeblendete Werte je Filter-Art. Ein Bauteil ist sichtbar, wenn keiner seiner Werte ausgeblendet ist. */
export type Ausgeblendet = Record<FilterArt, Set<string>>;

export const keineAusgeblendet = (): Ausgeblendet => ({ bg: new Set(), bug: new Set(), material: new Set() });

export const istSichtbar = (a: TeilAttribute, aus: Ausgeblendet) =>
  !aus.bg.has(a.bg) && !aus.bug.has(a.bug) && !aus.material.has(a.material);

export interface FilterEintrag {
  wert: string;
  anzahl: number;
  /** Zusatzinfo: BUG bei BG, Kategorie bei Material */
  zusatz?: string;
  kategorie?: MaterialKategorie;
}

const sortiere = (a: string, b: string) =>
  a === OHNE ? 1 : b === OHNE ? -1 : a.localeCompare(b, "de-CH", { numeric: true, sensitivity: "base" });

/** Liste der Werte je Filter-Art mit Anzahl Bauteile, natürlich sortiert, "(ohne)" am Schluss. */
export function filterListe(attribute: Iterable<TeilAttribute>, art: FilterArt): FilterEintrag[] {
  const m = new Map<string, FilterEintrag>();
  for (const a of attribute) {
    const wert = a[art];
    const e = m.get(wert);
    if (e) e.anzahl++;
    else
      m.set(wert, {
        wert,
        anzahl: 1,
        zusatz: art === "bg" && a.bug !== OHNE ? a.bug : undefined,
        kategorie: art === "material" ? a.kategorie : undefined,
      });
  }
  return [...m.values()].sort((x, y) => sortiere(x.wert, y.wert));
}

/** "Nur diese anzeigen" (cadwork: nur aktive sichtbar): alle anderen Werte dieser Art ausblenden. */
export function isoliere(aus: Ausgeblendet, art: FilterArt, werte: string[], alle: string[]): Ausgeblendet {
  const behalten = new Set(werte);
  return { ...aus, [art]: new Set(alle.filter((w) => !behalten.has(w))) };
}

/** Einen Wert ein-/ausblenden. */
export function umschalten(aus: Ausgeblendet, art: FilterArt, wert: string): Ausgeblendet {
  const s = new Set(aus[art]);
  if (s.has(wert)) s.delete(wert);
  else s.add(wert);
  return { ...aus, [art]: s };
}

export const anzahlAusgeblendet = (aus: Ausgeblendet) => aus.bg.size + aus.bug.size + aus.material.size;
