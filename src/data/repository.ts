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
  breite_mm?: number | null;
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

// Demo-Modus: Statusänderungen nur im Speicher.
let demoElementeSpeicher: Element[] | null = null;
const demoVerlauf: VerlaufEintrag[] = [];
const holeDemoElemente = () => (demoElementeSpeicher ??= demoElemente());

export interface VerlaufEintrag {
  id: string;
  status: ElementStatus;
  geaendert_am: string;
  benutzer: string | null;
}

export function useElemente(projektId: string | undefined) {
  return useQuery({
    queryKey: ["elemente", projektId],
    enabled: !!projektId,
    queryFn: async (): Promise<Element[]> => {
      if (!supabase) return projektId === "1" ? holeDemoElemente().map((e) => ({ ...e })) : [];
      return pruefe<Element[]>(
        await supabase
          .from("elemente")
          .select("id, baugruppe, bauuntergruppe, typ, geschoss, laenge_mm, hoehe_mm, breite_mm, status")
          .eq("projekt_id", projektId!)
          .order("baugruppe"),
      );
    },
  });
}

/** Status mehrerer Elemente setzen. Der Verlauf wird vom DB-Trigger elemente_status_log geschrieben. */
export function useElementStatusSetzen(projektId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ElementStatus }) => {
      if (!supabase) {
        const jetzt = new Date().toISOString();
        for (const e of holeDemoElemente()) {
          if (ids.includes(e.id) && e.status !== status) {
            e.status = status;
            demoVerlauf.push({ id: `${e.id}-${jetzt}`, status, geaendert_am: jetzt, benutzer: "Demo", element_id: e.id } as VerlaufEintrag);
          }
        }
        return ids.length;
      }
      const rows = pruefe(await supabase.from("elemente").update({ status }).in("id", ids).select("id"));
      if ((rows as unknown[]).length !== ids.length) throw new Error("Nicht alle Elemente konnten geändert werden (fehlende Berechtigung?).");
      return ids.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elemente", projektId] });
      qc.invalidateQueries({ queryKey: ["element_verlauf"] });
      qc.invalidateQueries({ queryKey: ["projekte"] });
    },
  });
}

export function useElementVerlauf(elementId: string | undefined) {
  return useQuery({
    queryKey: ["element_verlauf", elementId],
    enabled: !!elementId,
    queryFn: async (): Promise<VerlaufEintrag[]> => {
      if (!supabase)
        return demoVerlauf.filter((v) => (v as VerlaufEintrag & { element_id: string }).element_id === elementId).reverse();
      const rows = pruefe(
        await supabase
          .from("element_status_verlauf")
          .select("id, status, geaendert_am, geaendert_von")
          .eq("element_id", elementId!)
          .order("geaendert_am", { ascending: false })
          .limit(11),
      ) as { id: number; status: ElementStatus; geaendert_am: string; geaendert_von: string | null }[];
      const uids = [...new Set(rows.map((r) => r.geaendert_von).filter(Boolean))] as string[];
      const namen = new Map<string, string>();
      if (uids.length) {
        const p = pruefe(await supabase.from("profiles").select("id, name, email").in("id", uids)) as { id: string; name: string | null; email: string | null }[];
        p.forEach((x) => namen.set(x.id, x.name || x.email || "–"));
      }
      return rows.map((r) => ({ id: String(r.id), status: r.status, geaendert_am: r.geaendert_am, benutzer: r.geaendert_von ? namen.get(r.geaendert_von) ?? null : null }));
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

// ------------------------------------------------------------------ Fristen

import type { Frist } from "@/lib/fristen";

const demoFristen = (): Frist[] => {
  const plus = (t: number) => new Date(Date.now() + t * 86_400_000).toISOString().slice(0, 10);
  const versatz = [-3, 4, 12, 30, 60];
  return mockProjekte.flatMap((p, pi) =>
    MEILENSTEIN_REIHENFOLGE.slice(3, 8).map((typ, i) => ({
      id: `${p.id}-${typ}`, projekt_id: p.id, projekt_nummer: p.nummer, projekt_name: p.name,
      typ, soll_datum: plus(versatz[i] + pi * 5), erledigt_am: null,
    })),
  );
};

/** Alle offenen Meilensteine mit Soll-Datum über alle Projekte. */
export function useFristen() {
  return useQuery({
    queryKey: ["fristen"],
    queryFn: async (): Promise<Frist[]> => {
      if (!supabase) return demoFristen();
      type Row = { id: string; projekt_id: string; typ: Frist["typ"]; soll_datum: string; erledigt_am: string | null;
        projekte: { nummer: string; name: string } | { nummer: string; name: string }[] | null };
      const rows = pruefe<Row[]>(
        (await supabase
          .from("meilensteine")
          .select("id, projekt_id, typ, soll_datum, erledigt_am, projekte(nummer, name)")
          .not("soll_datum", "is", null)
          .is("erledigt_am", null)
          .order("soll_datum")) as unknown as { data: Row[] | null; error: { message: string } | null },
      );
      return rows.map(({ projekte, ...m }) => {
        const p = Array.isArray(projekte) ? projekte[0] : projekte;
        return { ...m, projekt_nummer: p?.nummer ?? "", projekt_name: p?.name ?? "" };
      });
    },
  });
}
