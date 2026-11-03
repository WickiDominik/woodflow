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

const str = z.string().max(200, 'Text darf höchstens 200 Zeichen lang sein')
const optStr = str.nullish()
const optInt = z
  .number({ invalid_type_error: 'Masse müssen Zahlen sein' })
  .int('Masse müssen ganze Zahlen sein')
  .min(0, 'Masse dürfen nicht negativ sein')
  .nullish()

const ElementSchema = z.object({
  baugruppe: str.trim().min(1, 'Baugruppe fehlt'),
  bauuntergruppe: optStr,
  typ: optStr,
  geschoss: optStr,
  laenge_mm: optInt,
  hoehe_mm: optInt,
  breite_mm: optInt,
  cadwork_guid: optStr,
})

const BodySchema = z.object({
  projekt: z.object({
    nummer: str.trim().min(1, 'Projektnummer fehlt'),
    name: optStr,
  }),
  quelle: z
    .object({ tool: optStr, version: optStr, benutzer: optStr, modell: optStr })
    .partial()
    .nullish(),
  elemente: z.array(ElementSchema, { required_error: 'Elementliste fehlt' })
    .max(2000, 'Maximal 2000 Elemente pro Import'),
})

const FIELDS = ['bauuntergruppe', 'typ', 'geschoss', 'laenge_mm', 'hoehe_mm', 'breite_mm', 'cadwork_guid'] as const

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
  const { projekt, elemente } = parsed.data

  const seen = new Set<string>()
  for (const e of elemente) {
    if (seen.has(e.baugruppe)) return json({ error: `Baugruppe ${e.baugruppe} kommt mehrfach vor` }, 400)
    seen.add(e.baugruppe)
  }

  if (!NUMMER_RE.test(projekt.nummer)) {
    return json({ error: `Projektnummer ${projekt.nummer} hat nicht das Format JJ.NNNN.` }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const p = await projektFindenOderAnlegen(supabase, projekt.nummer, projekt.name)

    const { data: existing, error: eErr } = await supabase
      .from('elemente').select('id, baugruppe, ' + FIELDS.join(', ')).eq('projekt_id', p.id)
    if (eErr) throw eErr
    const byBg = new Map<string, Record<string, unknown>>()
    for (const r of (existing ?? []) as Record<string, unknown>[]) byBg.set(r.baugruppe as string, r)

    const inserts: Record<string, unknown>[] = []
    const updates: Record<string, unknown>[] = []
    let unveraendert = 0

    for (const e of elemente) {
      const vals: Record<string, unknown> = {
        bauuntergruppe: e.bauuntergruppe ?? e.baugruppe.replace(/_\d+$/, ''),
        typ: e.typ ?? null,
        geschoss: e.geschoss ?? null,
        laenge_mm: e.laenge_mm ?? null,
        hoehe_mm: e.hoehe_mm ?? null,
        breite_mm: e.breite_mm ?? null,
        cadwork_guid: e.cadwork_guid ?? null,
      }
      const ex = byBg.get(e.baugruppe)
      if (!ex) {
        inserts.push({ projekt_id: p.id, baugruppe: e.baugruppe, quelle: 'toolcenter', ...vals })
      } else if (FIELDS.some((f) => (ex[f] ?? null) !== vals[f])) {
        updates.push({ id: ex.id, projekt_id: p.id, baugruppe: e.baugruppe, quelle: 'toolcenter', ...vals })
      } else {
        unveraendert++
      }
    }

    if (inserts.length) {
      const { error } = await supabase.from('elemente').insert(inserts)
      if (error) throw error
    }
    if (updates.length) {
      // Upsert by id; status is not included, so it stays untouched.
      const { error } = await supabase.from('elemente').upsert(updates, { onConflict: 'id' })
      if (error) throw error
    }

    const nicht_im_modell = [...byBg.keys()].filter((bg) => !seen.has(bg)).sort()

    return json({
      projekt_id: p.id,
      projekt_neu: p.neu,
      neu: inserts.length,
      aktualisiert: updates.length,
      unveraendert,
      nicht_im_modell,
    })
  } catch (err) {
    console.error('toolcenter-import Fehler:', err instanceof Error ? err.message : err)
    return json({ error: 'Interner Fehler beim Import' }, 500)
  }
})
