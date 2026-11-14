// Tägliche Fristenmeldung an Teams: überfällige und in den nächsten 7 Tagen fällige Meilensteine
// aller Projekte. Wird vom Zeitplan (Cron) aufgerufen, nicht von Benutzern. Ist nichts fällig,
// wird nichts gesendet. Mit ?probe=1 wird nur gezählt und nichts gesendet.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { authenticateCronRequest } from '../_shared/cron-auth.ts'
import { faelligeFristen, fristenKarte, heuteZuerich, sendeAnTeams, type FristZeile } from '../_shared/teams.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Nur POST erlaubt' }, 405)
  const abgelehnt = authenticateCronRequest(req)
  if (abgelehnt) return abgelehnt

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const { data, error } = await supabase
      .from('meilensteine')
      .select('typ, soll_datum, erledigt_am, projekte!inner(nummer, name)')
      .is('erledigt_am', null)
      .not('soll_datum', 'is', null)
      .limit(5000)
    if (error) throw error

    type Zeile = { typ: string; soll_datum: string | null; erledigt_am: string | null; projekte: { nummer: string; name: string } }
    const zeilen: FristZeile[] = ((data ?? []) as unknown as Zeile[]).map((m) => ({
      projekt_nummer: m.projekte.nummer,
      projekt_name: m.projekte.name,
      typ: m.typ,
      soll_datum: m.soll_datum,
      erledigt_am: m.erledigt_am,
    }))
    const heute = heuteZuerich()
    const faellig = faelligeFristen(zeilen, heute)
    const karte = fristenKarte(faellig, heute, Deno.env.get('WOODFLOW_APP_URL'))
    const zahlen = {
      ueberfaellig: faellig.filter((f) => f.tage_bis < 0).length,
      diese_woche: faellig.filter((f) => f.tage_bis >= 0).length,
    }
    if (!karte) return json({ gesendet: false, grund: 'nichts fällig', ...zahlen })
    if (new URL(req.url).searchParams.get('probe') === '1') return json({ gesendet: false, grund: 'Probe', ...zahlen })

    const r = await sendeAnTeams(Deno.env.get('TEAMS_WEBHOOK_URL'), karte)
    if (!r.ok) {
      console.error('teams-fristen: nicht gesendet:', r.grund)
      return json({ gesendet: false, grund: r.grund, ...zahlen }, 502)
    }
    return json({ gesendet: true, ...zahlen })
  } catch (err) {
    console.error('teams-fristen Fehler:', err instanceof Error ? err.message : err)
    return json({ error: 'Interner Fehler' }, 500)
  }
})
