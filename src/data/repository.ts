// Datenzugriff für Woodflow. Mit Lovable Cloud (Supabase) kommen die Daten aus der Datenbank,
// ohne Konfiguration aus den Beispieldaten (Demo-Modus).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  dateiablage as mockDateiablage,
  produktionsElemente as mockElemente,
  projekte as mockProjekte,
  qmPunkte as mockQm,
  type Bereich,
  type QmStatus,
  type StatusAmpel,
} from "@/data/mockData";
import { berechneFortschritt, berechneQm, type ElementStatus, type Fortschritt, type QmKennzahlen } from "@/lib/kennzahlen";
import { MEILENSTEIN_REIHENFOLGE, sortiereMeilensteine, type Meilenstein } from "@/lib/meilensteine";

export interface Projekt {
  id: string;
  nummer: string;
  name: string;
  beschreibung: string;
  ort: string | null;
  status: StatusAmpel;
  produktionsstart: string | null;
  windream_pfad: string | null;
  nextcloud_pfad: string | null;
  timbar_url: string | null;
  bauherr?: string | null;
  architekt?: string | null;
  architekt_telefon?: string | null;
  architekt_email?: string | null;
  baustelle?: string | null;
  projektleiter?: string | null;
  verkaeufer?: string | null;
  nav_status?: string | null;
  nav_import_am?: string | null;
  fortschritt: Fortschritt;
  qm: QmKennzahlen;
}

export interface Element {
  id: string;
  baugruppe: string;
  bauuntergruppe: string;
  typ: string | null;
  geschoss: string | null;
  laenge_mm: number | null;
  hoehe_mm: number | null;
  status: ElementStatus;
}

export interface QmPunkt {
  id: string;
  element: string; // Baugruppe, leer wenn projektweit
  bereich: Bereich;
  status: QmStatus;
  beschreibung: string;
  prioritaet: "Hoch" | "Mittel" | "Niedrig";
  datum: string;
}

// ------------------------------------------------------------------ Demo-Daten

const mmAusMeter = (s: string) => Math.round(parseFloat(s) * 1000);

const demoMeilensteine = (projektId: string): Meilenstein[] =>
  MEILENSTEIN_REIHENFOLGE.map((typ, i) => ({
    id: `${projektId}-${typ}`,
    typ,
    soll_datum: null,
    erledigt_am: projektId === "1" && i < 4 ? "2026-09-15" : null,
  }));

const demoProjekte = (): Projekt[] =>
  mockProjekte.map((p) => ({
    id: p.id,
    nummer: p.nummer,
    name: p.name,
    beschreibung: p.beschreibung,
    ort: null,
    status: p.status,
    produktionsstart: p.id === "1" ? "2027-01-11" : null,
    windream_pfad: null,
    nextcloud_pfad: null,
    timbar_url: null,
    fortschritt: p.fortschritt,
    qm: p.qm,
  }));

const demoElemente = (): Element[] =>
  mockElemente.map((e) => ({
    id: e.id,
    baugruppe: e.bezeichnung,
    bauuntergruppe: e.bezeichnung.split("_").slice(0, 2).join("_"),
    typ: e.typ,
    geschoss: e.geschoss,
    laenge_mm: mmAusMeter(e.laenge),
    hoehe_mm: mmAusMeter(e.hoehe),
    status: e.status === "Freigegeben" ? "freigegeben" : "geplant",
  }));

const demoQm = (): QmPunkt[] => mockQm.map((q) => ({ ...q }));

// ------------------------------------------------------------------ Datenbank

function pruefe<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

interface ProjektRow {
  id: string;
  nummer: string;
  name: string;
  beschreibung: string | null;
  ort: string | null;
  status: StatusAmpel;
  produktionsstart: string | null;
  windream_pfad: string | null;
  nextcloud_pfad: string | null;
  timbar_url: string | null;
  bauherr: string | null;
  architekt: string | null;
  architekt_telefon: string | null;
  architekt_email: string | null;
  baustelle: string | null;
  projektleiter: string | null;
  verkaeufer: string | null;
  nav_status: string | null;
  nav_import_am: string | null;
  elemente: { status: ElementStatus }[];
  qm_punkte: { status: QmStatus; prioritaet: "Hoch" | "Mittel" | "Niedrig" }[];
}

const PROJEKT_SELECT =
  "id, nummer, name, beschreibung, ort, status, produktionsstart, windream_pfad, nextcloud_pfad, timbar_url, bauherr, architekt, architekt_telefon, architekt_email, baustelle, projektleiter, verkaeufer, nav_status, nav_import_am, elemente(status), qm_punkte(status, prioritaet)";

function zuProjekt(r: ProjektRow): Projekt {
  return {
    id: r.id,
    nummer: r.nummer,
    name: r.name,
    beschreibung: r.beschreibung ?? "",
    ort: r.ort,
    status: r.status,
    produktionsstart: r.produktionsstart,
    windream_pfad: r.windream_pfad,
    nextcloud_pfad: r.nextcloud_pfad,
    timbar_url: r.timbar_url,
    bauherr: r.bauherr,
    architekt: r.architekt,
    architekt_telefon: r.architekt_telefon,
    architekt_email: r.architekt_email,
    baustelle: r.baustelle,
    projektleiter: r.projektleiter,
    verkaeufer: r.verkaeufer,
    nav_status: r.nav_status,
    nav_import_am: r.nav_import_am,
    fortschritt: berechneFortschritt(r.elemente.map((e) => e.status)),
    qm: berechneQm(r.qm_punkte),
  };
}

// ------------------------------------------------------------------ Hooks

export function useProjekte() {
  return useQuery({
    queryKey: ["projekte"],
    queryFn: async (): Promise<Projekt[]> => {
      if (!supabase) return demoProjekte();
      const rows = pruefe<ProjektRow[]>(await supabase.from("projekte").select(PROJEKT_SELECT).order("nummer", { ascending: false }));
      return rows.map(zuProjekt);
    },
  });
}

export function useElemente(projektId: string | undefined) {
  return useQuery({
    queryKey: ["elemente", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<Element[]> => {
      if (!supabase) return projektId === "1" ? demoElemente() : [];
      return pruefe<Element[]>(
        await supabase
          .from("elemente")
          .select("id, baugruppe, bauuntergruppe, typ, geschoss, laenge_mm, hoehe_mm, status")
          .eq("projekt_id", projektId!)
          .order("baugruppe"),
      );
    },
  });
}

export function useQmPunkte(projektId: string | undefined) {
  return useQuery({
    queryKey: ["qm", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<QmPunkt[]> => {
      if (!supabase) return projektId === "1" ? demoQm() : [];
      type Row = Omit<QmPunkt, "element"> & { elemente: { baugruppe: string } | { baugruppe: string }[] | null };
      const res = await supabase
          .from("qm_punkte")
          .select("id, bereich, status, beschreibung, prioritaet, datum, elemente(baugruppe)")
          .eq("projekt_id", projektId!)
          .order("datum", { ascending: false });
      const rows = pruefe<Row[]>(res as { data: Row[] | null; error: { message: string } | null });
      // PostgREST liefert die Beziehung als Objekt (n:1); der Typ-Generator kennt das Schema hier nicht.
      return rows.map(({ elemente, ...q }) => {
        const el = Array.isArray(elemente) ? elemente[0] : elemente;
        return { ...q, element: el?.baugruppe ?? "" };
      });
    },
  });
}

export function useMeilensteine(projektId: string | undefined) {
  return useQuery({
    queryKey: ["meilensteine", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<Meilenstein[]> => {
      if (!supabase) return demoMeilensteine(projektId!);
      const rows = pruefe<Meilenstein[]>(
        await supabase
          .from("meilensteine")
          .select("id, typ, soll_datum, erledigt_am, bemerkung")
          .eq("projekt_id", projektId!),
      );
      return sortiereMeilensteine(rows);
    },
  });
}

/** Meilenstein als erledigt markieren (Datum) oder wieder öffnen (null). */
export function useMeilensteinErledigt(projektId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, erledigt_am }: { id: string; erledigt_am: string | null }) => {
      if (!supabase) throw new Error("Im Demo-Modus wird nichts gespeichert.");
      const { data: user } = await supabase.auth.getUser();
      pruefe(
        await supabase
          .from("meilensteine")
          .update({ erledigt_am, erledigt_von: erledigt_am ? user.user?.id ?? null : null })
          .eq("id", id),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meilensteine", projektId] }),
  });
}

export function useProduktionsstartSetzen(projektId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datum: string | null) => {
      if (!supabase) throw new Error("Im Demo-Modus wird nichts gespeichert.");
      pruefe(await supabase.from("projekte").update({ produktionsstart: datum }).eq("id", projektId!));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projekte"] }),
  });
}

/** Dateiablage bleibt bis zur Anbindung von Windream/Nextcloud bei den Beispieldaten. */
export const dateiablage = mockDateiablage;

// ------------------------------------------------------------------ Ablage-Prüfungen (Toolcenter)

export interface AblagePunkt {
  gruppe: string | null;
  pruefung: string | null;
  status: string | null;
  hinweis: string | null;
}

export interface AblagePruefung {
  id: string;
  bereich: "produktion" | "montage";
  status: string;
  anzahl_ok: number;
  anzahl_offen: number;
  punkte: AblagePunkt[];
  benutzer: string | null;
  created_at: string;
}

/** Neueste Toolcenter-Prüfung je Bereich. */
export function useAblagePruefungen(projektId: string | undefined) {
  return useQuery({
    queryKey: ["ablage_pruefungen", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<{ produktion: AblagePruefung | null; montage: AblagePruefung | null }> => {
      if (!supabase) return { produktion: null, montage: null };
      const holen = async (bereich: "produktion" | "montage") => {
        const rows = pruefe(
          await supabase
            .from("ablage_pruefungen")
            .select("id, bereich, status, anzahl_ok, anzahl_offen, punkte, benutzer, created_at")
            .eq("projekt_id", projektId!)
            .eq("bereich", bereich)
            .order("created_at", { ascending: false })
            .limit(1),
        ) as unknown as AblagePruefung[];
        return rows[0] ?? null;
      };
      const [produktion, montage] = await Promise.all([holen("produktion"), holen("montage")]);
      return { produktion, montage };
    },
  });
}

// ------------------------------------------------------------------ Terminprogramm

export interface TerminZeile {
  id: string;
  reihenfolge: number;
  aufgabe: string;
  zustaendig: string | null;
  start: string;
  ende: string | null;
  created_at: string;
}

export function useTermine(projektId: string | undefined) {
  return useQuery({
    queryKey: ["termine", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<TerminZeile[]> => {
      if (!supabase) return [];
      return pruefe<TerminZeile[]>(
        await supabase
          .from("termine")
          .select("id, reihenfolge, aufgabe, zustaendig, start, ende, created_at")
          .eq("projekt_id", projektId!)
          .order("reihenfolge"),
      );
    },
  });
}

/** Ersetzt alle Termine des Projekts und setzt die Soll-Daten der gefundenen Meilensteine. */
export function useTerminprogrammImport(projektId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      termine,
      meilensteinDaten,
    }: {
      termine: { reihenfolge: number; aufgabe: string; zustaendig: string | null; start: string; ende: string | null }[];
      meilensteinDaten: Partial<Record<string, string>>;
    }) => {
      if (!supabase) throw new Error("Im Demo-Modus wird nichts gespeichert.");
      pruefe(await supabase.from("termine").delete().eq("projekt_id", projektId!));
      if (termine.length) pruefe(await supabase.from("termine").insert(termine.map((t) => ({ ...t, projekt_id: projektId! }))));
      let gesetzt = 0;
      for (const [typ, datum] of Object.entries(meilensteinDaten)) {
        if (!datum) continue;
        pruefe(
          await supabase
            .from("meilensteine")
            .update({ soll_datum: datum })
            .eq("projekt_id", projektId!)
            .eq("typ", typ as never),
        );
        gesetzt++;
      }
      if (meilensteinDaten.produktionsstart) {
        pruefe(await supabase.from("projekte").update({ produktionsstart: meilensteinDaten.produktionsstart }).eq("id", projektId!));
      }
      return { termine: termine.length, meilensteine: gesetzt };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["termine", projektId] });
      qc.invalidateQueries({ queryKey: ["meilensteine", projektId] });
      qc.invalidateQueries({ queryKey: ["projekte"] });
    },
  });
}
