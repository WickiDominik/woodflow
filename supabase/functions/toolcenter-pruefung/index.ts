import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as baseCors } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3'
import { createHash, timingSafeEqual } from 'node:crypto'
import { NUMMER_RE, projektFindenOderAnlegen } from '../_shared/projekt.ts'

const corsHeaders = {
  ...baseCors,
  'Access-Control-Allow-Headers': `${baseCors['Access-Control-Allow-Headers']}, x-woodflow-key`,
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const str = z.string({ invalid_type_error: 'Text erwartet' }).max(500, 'Text darf höchstens 500 Zeichen lang sein')
const optStr = str.nullish()

const PunktSchema = z.object({
  gruppe: optStr,
  pruefung: optStr,
  status: optStr,
  hinweis: optStr,
})

const BodySchema = z.object({
  projekt: z.object({ nummer: str.trim().min(1, 'Projektnummer fehlt'), name: optStr }),
  quelle: z.object({ tool: optStr, version: optStr, benutzer: optStr, modell: optStr }).partial().nullish(),
  bereich: z.enum(['produktion', 'montage'], { errorMap: () => ({ message: 'Bereich muss «produktion» oder «montage» sein' }) }),
  status: str.trim().min(1, 'Status fehlt'),
  punkte: z.array(PunktSchema, { required_error: 'Punkteliste fehlt', invalid_type_error: 'Punkte müssen eine Liste sein' })
    .max(1000, 'Maximal 1000 Punkte pro Prüfung'),
})

const OFFEN = new Set(['WARNUNG', 'FEHLT', 'FEHLER'])

function keyOk(provided: string | null): boolean {
  const secret = Deno.env.get('TOOLCENTER_API_KEY')
  if (!secret || !provided) return false
  const d = (v: string) => createHash('sha256').update(v, 'utf8').digest()
  return timingSafeEqual(d(provided), d(secret))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Nur POST erlaubt' }, 405)

  if (!Deno.env.get('TOOLCENTER_API_KEY')) {
    console.error('TOOLCENTER_API_KEY ist nicht gesetzt')
    return json({ error: 'Server nicht konfiguriert' }, 500)
  }
  if (!keyOk(req.headers.get('x-woodflow-key'))) {
    return json({ error: 'Ungültiger oder fehlender API-Schlüssel' }, 401)
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json({ error: 'Ungültiges JSON' }, 400)
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return json({ error: `${i.message} (${i.path.join('.') || 'Anfrage'})` }, 400)
  }
  const { projekt, quelle, bereich, status, punkte } = parsed.data

  if (!NUMMER_RE.test(projekt.nummer)) {
    return json({ error: `Projektnummer ${projekt.nummer} hat nicht das Format JJ.NNNN.` }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const p = await projektFindenOderAnlegen(supabase, projekt.nummer, projekt.name)

    const sauber = punkte.map((x) => ({
      gruppe: x.gruppe ?? null, pruefung: x.pruefung ?? null, status: x.status ?? null, hinweis: x.hinweis ?? null,
    }))
    const anzahl_offen = sauber.filter((x) => OFFEN.has((x.status ?? '').trim().toUpperCase())).length
    const anzahl_ok = sauber.length - anzahl_offen

    const { data: row, error: iErr } = await supabase.from('ablage_pruefungen').insert({
      projekt_id: p.id, bereich, status, anzahl_ok, anzahl_offen, punkte: sauber,
      modell: quelle?.modell ?? null, benutzer: quelle?.benutzer ?? null, version: quelle?.version ?? null,
    }).select('id').single()
    if (iErr) throw iErr

    const { data: alt, error: aErr } = await supabase
      .from('ablage_pruefungen').select('id')
      .eq('projekt_id', p.id).eq('bereich', bereich)
      .order('created_at', { ascending: false }).range(20, 10000)
    if (aErr) throw aErr
    if (alt && alt.length) {
      const { error: dErr } = await supabase.from('ablage_pruefungen').delete().in('id', alt.map((r) => r.id))
      if (dErr) throw dErr
    }

    return json({ id: row.id, anzahl_ok, anzahl_offen, projekt_neu: p.neu })
  } catch (err) {
    console.error('toolcenter-pruefung Fehler:', err instanceof Error ? err.message : err)
    return json({ error: 'Interner Fehler beim Speichern der Prüfung' }, 500)
  }
})
