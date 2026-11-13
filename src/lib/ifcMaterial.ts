// Materialkategorien für die Darstellung im 3D-Viewer (Textur + Grundfarbe).
// Die Zuordnung erfolgt über den Materialnamen aus cadwork/IFC, ersatzweise über den IFC-Typ.

export type MaterialKategorie =
  | "holz"
  | "platte"
  | "osb"
  | "holzfaser"
  | "mineralwolle"
  | "daemmung"
  | "gips"
  | "beton"
  | "metall"
  | "folie"
  | "sonstiges";

export interface KategorieInfo {
  label: string;
  /** Grundfarbe (ohne Textur und für die Legende). */
  farbe: string;
  /** Grösse einer Texturkachel in Metern. */
  kachel: number;
}

export const KATEGORIEN: Record<MaterialKategorie, KategorieInfo> = {
  holz: { label: "Holz (KVH/BSH)", farbe: "#d9b77e", kachel: 0.6 },
  platte: { label: "Holzwerkstoffplatte", farbe: "#e6c994", kachel: 0.8 },
  osb: { label: "OSB", farbe: "#c99a5b", kachel: 0.5 },
  holzfaser: { label: "Holzfaser", farbe: "#9c6b3f", kachel: 0.4 },
  mineralwolle: { label: "Mineralwolle", farbe: "#e3cf62", kachel: 0.4 },
  daemmung: { label: "Dämmung", farbe: "#f0d9a8", kachel: 0.4 },
  gips: { label: "Gips / Gipsfaser", farbe: "#e7e5e0", kachel: 0.6 },
  beton: { label: "Beton", farbe: "#a3a3a3", kachel: 0.8 },
  metall: { label: "Stahl / Metall", farbe: "#7c8a99", kachel: 0.3 },
  folie: { label: "Folie / Bahn", farbe: "#4b5563", kachel: 0.5 },
  sonstiges: { label: "Sonstiges", farbe: "#c8c8c8", kachel: 1 },
};

export const KATEGORIE_REIHENFOLGE = Object.keys(KATEGORIEN) as MaterialKategorie[];

// Reihenfolge ist wichtig: spezifische Begriffe vor allgemeinen (z.B. "Holzfaser" vor "Holz").
const REGELN: [MaterialKategorie, RegExp][] = [
  ["osb", /\bosb/],
  ["holzfaser", /holzfaser|weichfaser|pavatex|gutex|steico|diffutherm|isolair|agepan|\bdwd\b|\bmdf\b|\bhfd\b|\bwf\b/],
  ["mineralwolle", /mineralwolle|steinwolle|glaswolle|flumroc|isover|rockwool|\bursa|\bmw\b|\bsw\b|\bgw\b/],
  ["daemmung", /d(ä|ae)mm|isolation|insulation|\beps\b|\bxps\b|\bpir\b|\bpur\b|zellulose|isofloc|hanf|schafwolle|polystyrol|swisspor/],
  ["gips", /gips|fermacell|\bgk[bfi]?\b|\bgf\b|rigips|knauf|lafarge/],
  ["beton", /beton|zement|estrich|\bmauerwerk|backstein|kalksand/],
  ["metall", /stahl|metall|\balu|edelstahl|\bverz|schraube|winkel|blech|\bs235|\bs355|anker|bolzen|nagel/],
  ["folie", /folie|bahn|dampf|vlies|membran|\bdb\b|\bdbr\b|unterdach|windpapier|bitumen/],
  [
    "platte",
    /\b3[- ]?s\b|dreischicht|mehrschicht|sperrholz|\blvl\b|kerto|furnierschicht|\bbsp\b|\bclt\b|brettsperr|spanplatte|massivholzplatte|\bplatte/,
  ],
  [
    "holz",
    /holz|\bkvh\b|\bbsh\b|glulam|\bc\d{2}\b|\bgl\s?\d{2}|fichte|tanne|l(ä|ae)rche|douglas|eiche|buche|kiefer|\bfi\b|fi\s?\/\s?ta|nadel|latte|lattung|balken|schwelle|rahmen|sparren|pfette|rippe|st(ä|ae)nder|riegel|kantholz|brett/,
  ],
];

/** IFC-Typen, die ohne Materialangabe als Holz bzw. Platte gelten (Holzbau-Standard). */
const TYP_STANDARD: Record<string, MaterialKategorie> = {
  IFCBEAM: "holz",
  IFCMEMBER: "holz",
  IFCCOLUMN: "holz",
  IFCPLATE: "platte",
  IFCMECHANICALFASTENER: "metall",
  IFCFASTENER: "metall",
  IFCDISCRETEACCESSORY: "metall",
};

export function kategorieVon(material: string | null | undefined, ifcTyp?: string | null): MaterialKategorie {
  const m = (material ?? "").toLowerCase();
  if (m) for (const [k, re] of REGELN) if (re.test(m)) return k;
  return (ifcTyp && TYP_STANDARD[ifcTyp.toUpperCase()]) || "sonstiges";
}
