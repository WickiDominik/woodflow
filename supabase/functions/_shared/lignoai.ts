// Baut die Antwort der Lese-Schnittstelle für LignoAI (cadwork-Chat).
// Reine Funktionen ohne Deno-/npm-Abhängigkeit, damit sie mit vitest testbar sind.
// Bewusst nicht enthalten: Geldbeträge, Kontaktdaten (Bauherr, Architekt) und Benutzernamen.

export const ELEMENT_STATUS = [
  'geplant', 'freigegeben', 'abbund', 'zusammenbau', 'weinmann', 'verladen', 'montiert', 'abgenommen',
] as const

export const MEILENSTEIN_LABEL: Record<string, string> = {
  bta: 'Bauteilaufbauten (BTA)',
  details: 'Detailpläne',
  kontrollplaene: 'Kontrollpläne',
  ausfuehrungsplaene: 'Ausführungspläne',
  material_bestellt: 'Material bestellt',
  planung_abgeschlossen: 'Planung abgeschlossen',
  produktionsstart: 'Produktionsstart',
  aufrichte: 'Aufrichte',
  abnahme: 'Abnahme',
}

const OFFEN = new Set(['WARNUNG', 'FEHLT', 'FEHLER'])
const TAG_MS = 86_400_000
const ms = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`)

export interface ProjektZeile {
  nummer: string
  name: string
  ort: string | null
  status: string | null
  produktionsstart: string | null
  ifc_hochgeladen_am: string | null
}

export interface ElementZeile {
  baugruppe: string
  bauuntergruppe: string
  typ: string | null
  geschoss: string | null
  status: string
  cadwork_guid: string | null
  updated_at: string | null
}

export interface MeilensteinZeile {
  typ: string
  soll_datum: string | null
  erledigt_am: string | null
  bemerkung: string | null
}

export interface PruefungZeile {
  bereich: string
  status: string
  anzahl_ok: number
  anzahl_offen: number
  created_at: string
  modell: string | null
  punkte: unknown
}

export function zaehleStatus(elemente: Pick<ElementZeile, 'status'>[]): Record<string, number> {
  const aus: Record<string, number> = {}
  for (const s of ELEMENT_STATUS) aus[s] = 0
  for (const e of elemente) aus[e.status] = (aus[e.status] ?? 0) + 1
  return aus
}

/** Offene Meilensteine mit Soll-Datum, aufsteigend; tage_bis negativ = überfällig. */
export function offeneFristen(meilensteine: MeilensteinZeile[], heute: string) {
  return meilensteine
    .filter((m): m is MeilensteinZeile & { soll_datum: string } => !!m.soll_datum && !m.erledigt_am)
    .map((m) => {
      const tage_bis = Math.round((ms(m.soll_datum) - ms(heute)) / TAG_MS)
      return {
        typ: m.typ,
        bezeichnung: MEILENSTEIN_LABEL[m.typ] ?? m.typ,
        soll_datum: m.soll_datum,
        tage_bis,
        ueberfaellig: tage_bis < 0,
        bemerkung: m.bemerkung ?? null,
      }
    })
    .sort((a, b) => a.soll_datum.localeCompare(b.soll_datum))
}

/** Je Bereich nur die neueste Prüfung, mit ihren offenen Punkten (höchstens `maxPunkte`). */
export function letztePruefungen(pruefungen: PruefungZeile[], maxPunkte = 200) {
  const neueste = new Map<string, PruefungZeile>()
  for (const p of pruefungen) {
    const alt = neueste.get(p.bereich)
    if (!alt || p.created_at > alt.created_at) neueste.set(p.bereich, p)
  }
  return [...neueste.values()]
    .sort((a, b) => a.bereich.localeCompare(b.bereich))
    .map((p) => {
      const punkte = Array.isArray(p.punkte) ? (p.punkte as Record<string, unknown>[]) : []
      const offen = punkte
        .filter((x) => x && OFFEN.has(String(x.status ?? '').trim().toUpperCase()))
        .map((x) => ({
          gruppe: x.gruppe ?? null, pruefung: x.pruefung ?? null, status: x.status ?? null, hinweis: x.hinweis ?? null,
        }))
      return {
        bereich: p.bereich,
        status: p.status,
        geprueft_am: p.created_at,
        modell: p.modell,
        anzahl_ok: p.anzahl_ok,
        anzahl_offen: p.anzahl_offen,
        offene_punkte: offen.slice(0, maxPunkte),
        ...(offen.length > maxPunkte ? { weitere_offene_punkte: offen.length - maxPunkte } : {}),
      }
    })
}

export function baueAntwort(
  projekt: ProjektZeile,
  elemente: ElementZeile[],
  meilensteine: MeilensteinZeile[],
  pruefungen: PruefungZeile[],
  heute: string,
) {
  return {
    stand: heute,
    projekt: {
      nummer: projekt.nummer,
      name: projekt.name,
      ort: projekt.ort,
      ampel: projekt.status,
      produktionsstart: projekt.produktionsstart,
      ifc_hochgeladen_am: projekt.ifc_hochgeladen_am,
    },
    elemente: {
      anzahl: elemente.length,
      je_status: zaehleStatus(elemente),
      liste: elemente.map((e) => ({
        baugruppe: e.baugruppe,
        bauuntergruppe: e.bauuntergruppe,
        typ: e.typ,
        geschoss: e.geschoss,
        status: e.status,
        cadwork_guid: e.cadwork_guid,
        geaendert_am: e.updated_at,
      })),
    },
    fristen: offeneFristen(meilensteine, heute),
    pruefungen: letztePruefungen(pruefungen),
  }
}
