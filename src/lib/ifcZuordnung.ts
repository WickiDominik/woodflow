// IFC ↔ Woodflow: GUID-Umrechnung und Zuordnung von IFC-Baugruppen zu Woodflow-Elementen.
import type { ElementStatus } from "@/lib/kennzahlen";

const IFC_ZEICHEN = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

/** Standard-UUID (36 Zeichen, mit oder ohne Bindestriche) → komprimierte IFC-GlobalId (22 Zeichen). */
export function uuidZuGlobalId(uuid: string): string {
  const hex = uuid.replace(/[-{}]/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error(`Ungültige UUID: ${uuid}`);
  let n = BigInt("0x" + hex);
  const z: string[] = [];
  for (let i = 0; i < 22; i++) {
    z.push(IFC_ZEICHEN[Number(n & 63n)]);
    n >>= 6n;
  }
  return z.reverse().join("");
}

/** Komprimierte IFC-GlobalId (22 Zeichen) → UUID in Kleinbuchstaben mit Bindestrichen. */
export function globalIdZuUuid(gid: string): string {
  if (gid.length !== 22) throw new Error(`Ungültige GlobalId: ${gid}`);
  let n = 0n;
  for (const c of gid) {
    const v = IFC_ZEICHEN.indexOf(c);
    if (v < 0) throw new Error(`Ungültige GlobalId: ${gid}`);
    n = (n << 6n) | BigInt(v);
  }
  if (n >> 128n) throw new Error(`Ungültige GlobalId: ${gid}`);
  const h = n.toString(16).padStart(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Beliebige GUID-Schreibweise (UUID oder GlobalId) → normierte UUID in Kleinbuchstaben, sonst null. */
export function normiereGuid(g: string | null | undefined): string | null {
  if (!g) return null;
  const s = g.trim();
  try {
    if (s.length === 22) return globalIdZuUuid(s);
    const hex = s.replace(/[-{}]/g, "").toLowerCase();
    if (/^[0-9a-f]{32}$/.test(hex)) return globalIdZuUuid(uuidZuGlobalId(hex));
  } catch {
    return null;
  }
  return null;
}

export interface IfcBaugruppe {
  expressId: number;
  globalId: string;
  name: string | null;
  /** Wert der Eigenschaft "Baugruppe" aus einem Property-Set, falls vorhanden. */
  baugruppeProp: string | null;
  /** expressIDs aller zugehörigen Bauteile (inkl. der Baugruppe selbst). */
  teile: number[];
}

export interface ZuordbaresElement {
  id: string;
  baugruppe: string;
  cadwork_guid?: string | null;
  status: ElementStatus;
}

export interface Zuordnung<E> {
  /** expressID eines Bauteils → Woodflow-Element */
  teilZuElement: Map<number, E>;
  /** Baugruppen-expressID → Woodflow-Element */
  baugruppeZuElement: Map<number, E>;
}

/** Zuerst per GUID, dann per Name bzw. Property "Baugruppe" gegen elemente.baugruppe (Gross-/Kleinschreibung egal). */
export function ordneZu<E extends ZuordbaresElement>(baugruppen: IfcBaugruppe[], elemente: E[]): Zuordnung<E> {
  const perGuid = new Map<string, E>();
  const perName = new Map<string, E>();
  for (const e of elemente) {
    const g = normiereGuid(e.cadwork_guid);
    if (g) perGuid.set(g, e);
    perName.set(e.baugruppe.trim().toLowerCase(), e);
  }
  const teilZuElement = new Map<number, E>();
  const baugruppeZuElement = new Map<number, E>();
  for (const b of baugruppen) {
    const g = normiereGuid(b.globalId);
    const el =
      (g && perGuid.get(g)) ||
      (b.name && perName.get(b.name.trim().toLowerCase())) ||
      (b.baugruppeProp && perName.get(b.baugruppeProp.trim().toLowerCase())) ||
      undefined;
    if (!el) continue;
    baugruppeZuElement.set(b.expressId, el);
    for (const t of b.teile) teilZuElement.set(t, el);
  }
  return { teilZuElement, baugruppeZuElement };
}

/** Farben entsprechend den Element-Status-Badges. */
export const STATUS_FARBE: Record<ElementStatus, string> = {
  geplant: "#a8a29e",
  freigegeben: "#0ea5e9",
  abbund: "#f59e0b",
  zusammenbau: "#f59e0b",
  weinmann: "#f59e0b",
  verladen: "#8b5cf6",
  montiert: "#10b981",
  abgenommen: "#10b981",
};
export const NICHT_ZUGEORDNET_FARBE = "#d4d4d4";

/** Legende: Anzahl zugeordneter Woodflow-Elemente je Status, plus nicht zugeordnete IFC-Baugruppen. */
export function legende<E extends ZuordbaresElement>(baugruppen: IfcBaugruppe[], z: Zuordnung<E>) {
  const proStatus: Partial<Record<ElementStatus, number>> = {};
  const gesehen = new Set<string>();
  let nichtZugeordnet = 0;
  for (const b of baugruppen) {
    const el = z.baugruppeZuElement.get(b.expressId);
    if (!el) nichtZugeordnet++;
    else if (!gesehen.has(el.id)) {
      gesehen.add(el.id);
      proStatus[el.status] = (proStatus[el.status] ?? 0) + 1;
    }
  }
  return { proStatus, nichtZugeordnet };
}
