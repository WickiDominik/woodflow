// Meldungen an Microsoft Teams (Workflow «Beim Empfang einer Webhookanforderung in einem Kanal posten»).
// Die Bau-Funktionen sind rein (ohne Deno), damit sie mit vitest testbar sind.
// Die Webhook-Adresse ist ein Geheimnis (Secret TEAMS_WEBHOOK_URL) und wird nie geloggt.
import { MEILENSTEIN_LABEL } from './lignoai.ts'

const TAG_MS = 86_400_000
const ms = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`)
const OFFEN = new Set(['WARNUNG', 'FEHLT', 'FEHLER'])

export const datumCh = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

/** Heutiges Datum in der Schweiz (die Funktion läuft in UTC). */
export const heuteZuerich = (jetzt = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(jetzt)

export interface FristZeile {
  projekt_nummer: string
  projekt_name: string
  typ: string
  soll_datum: string | null
  erledigt_am: string | null
}

export interface FaelligeFrist {
  projekt_nummer: string
  projekt_name: string
  bezeichnung: string
  soll_datum: string
  tage_bis: number
}

/** Offene Fristen, die überfällig sind oder in den nächsten `tage` Tagen fällig werden. */
export function faelligeFristen(zeilen: FristZeile[], heute: string, tage = 7): FaelligeFrist[] {
  return zeilen
    .filter((z): z is FristZeile & { soll_datum: string } => !!z.soll_datum && !z.erledigt_am)
    .map((z) => ({
      projekt_nummer: z.projekt_nummer,
      projekt_name: z.projekt_name,
      bezeichnung: MEILENSTEIN_LABEL[z.typ] ?? z.typ,
      soll_datum: z.soll_datum,
      tage_bis: Math.round((ms(z.soll_datum) - ms(heute)) / TAG_MS),
    }))
    .filter((f) => f.tage_bis <= tage)
    .sort((a, b) => a.soll_datum.localeCompare(b.soll_datum) || a.projekt_nummer.localeCompare(b.projekt_nummer))
}

type Block = Record<string, unknown>

const text = (t: string, extra: Block = {}): Block => ({ type: 'TextBlock', text: t, wrap: true, ...extra })

function karte(body: Block[], appUrl?: string | null) {
  const url = (appUrl ?? '').trim()
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body,
        ...(url.startsWith('https://') ? { actions: [{ type: 'Action.OpenUrl', title: 'In Woodflow öffnen', url }] } : {}),
      },
    }],
  }
}

const fristZeile = (f: FaelligeFrist) => {
  const wann = f.tage_bis < 0
    ? `seit ${-f.tage_bis} ${f.tage_bis === -1 ? 'Tag' : 'Tagen'} überfällig`
    : f.tage_bis === 0 ? 'heute fällig' : `in ${f.tage_bis} ${f.tage_bis === 1 ? 'Tag' : 'Tagen'}`
  return `- **${f.projekt_nummer}** ${f.projekt_name}: ${f.bezeichnung}, ${datumCh(f.soll_datum)} (${wann})`
}

/** Tägliche Fristenmeldung. `null`, wenn nichts fällig ist (dann wird nichts gesendet). */
export function fristenKarte(fristen: FaelligeFrist[], heute: string, appUrl?: string | null, max = 30) {
  if (!fristen.length) return null
  const ueber = fristen.filter((f) => f.tage_bis < 0)
  const bald = fristen.filter((f) => f.tage_bis >= 0)
  const body: Block[] = [text(`Woodflow: Fristen am ${datumCh(heute)}`, { weight: 'Bolder', size: 'Medium' })]
  let frei = max
  const abschnitt = (titel: string, liste: FaelligeFrist[], farbe: string) => {
    if (!liste.length) return
    body.push(text(`${titel} (${liste.length})`, { weight: 'Bolder', color: farbe, spacing: 'Medium' }))
    const gezeigt = liste.slice(0, Math.max(frei, 0))
    frei -= gezeigt.length
    if (gezeigt.length) body.push(text(gezeigt.map(fristZeile).join('\n')))
    if (gezeigt.length < liste.length) body.push(text(`… und ${liste.length - gezeigt.length} weitere`, { isSubtle: true }))
  }
  abschnitt('Überfällig', ueber, 'Attention')
  abschnitt('In den nächsten 7 Tagen', bald, 'Default')
  return karte(body, appUrl ? `${appUrl.replace(/\/+$/, '')}/fristen` : null)
}

export interface PruefPunkt { gruppe?: string | null; pruefung?: string | null; status?: string | null; hinweis?: string | null }

/** Kennung der offenen Punkte. Gleiche Kennung wie bei der vorherigen Prüfung = nichts Neues, keine Meldung. */
export function offenSignatur(punkte: unknown): string {
  if (!Array.isArray(punkte)) return ''
  return (punkte as PruefPunkt[])
    .filter((x) => x && OFFEN.has(String(x.status ?? '').trim().toUpperCase()))
    .map((x) => [x.gruppe ?? '', x.pruefung ?? '', String(x.status ?? '').trim().toUpperCase(), x.hinweis ?? ''].join('\u001f'))
    .sort()
    .join('\u001e')
}

/** Meldung nach einer Ablage-Prüfung mit offenen Punkten. `null`, wenn nichts offen ist. */
export function pruefungKarte(
  p: { nummer: string; name?: string | null; bereich: string; status: string; punkte: PruefPunkt[] },
  appUrl?: string | null,
  max = 15,
) {
  const offen = p.punkte.filter((x) => OFFEN.has((x.status ?? '').trim().toUpperCase()))
  if (!offen.length) return null
  const bereich = p.bereich === 'montage' ? 'Montage' : 'Produktion'
  const zeilen = offen.slice(0, max).map((x) => {
    const was = [x.gruppe, x.pruefung].filter(Boolean).join(': ') || 'Punkt'
    return `- ${was} (${(x.status ?? '').trim().toUpperCase()})${x.hinweis ? `: ${x.hinweis}` : ''}`
  })
  const body: Block[] = [
    text(`Woodflow: Ablage ${bereich} ${p.nummer} hat offene Punkte`, { weight: 'Bolder', size: 'Medium' }),
    text(`${p.name?.trim() ? `${p.name.trim()}, ` : ''}Ergebnis ${p.status}, ${offen.length} von ${p.punkte.length} Punkten offen.`),
    text(zeilen.join('\n')),
  ]
  if (offen.length > max) body.push(text(`… und ${offen.length - max} weitere`, { isSubtle: true }))
  return karte(body, appUrl)
}

/** Sendet eine Karte. Wirft nie und gibt die Adresse nie preis; liefert nur ok/nicht ok. */
export async function sendeAnTeams(
  webhookUrl: string | undefined | null,
  karteJson: unknown,
  holen: typeof fetch = fetch,
): Promise<{ ok: boolean; grund?: string }> {
  const url = (webhookUrl ?? '').trim()
  if (!url) return { ok: false, grund: 'TEAMS_WEBHOOK_URL ist nicht gesetzt' }
  if (!url.startsWith('https://')) return { ok: false, grund: 'TEAMS_WEBHOOK_URL muss mit https:// beginnen' }
  const abbruch = new AbortController()
  const uhr = setTimeout(() => abbruch.abort(), 10_000)
  try {
    const r = await holen(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(karteJson),
      signal: abbruch.signal,
    })
    return r.ok ? { ok: true } : { ok: false, grund: `Teams antwortet mit ${r.status}` }
  } catch (err) {
    // Nur der Fehlername: die Meldung kann die Adresse enthalten.
    return { ok: false, grund: err instanceof Error ? err.name : 'Netzwerkfehler' }
  } finally {
    clearTimeout(uhr)
  }
}
