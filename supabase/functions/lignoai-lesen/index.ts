// Lese-Schnittstelle für LignoAI (cadwork-Chat): Elemente mit Status, offene Fristen und die
// neuesten Ablage-Prüfungen eines Projekts. Nur lesend – diese Funktion schreibt nie.
// Schutz: eigener Schlüssel LIGNOAI_LESE_KEY im Kopf x-woodflow-key (getrennt vom Toolcenter-Schlüssel,
// der schreiben darf).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as baseCors } from 'npm:@supabase/supabase-js@2/cors'
import { createHash, timingSafeEqual } from 'node:crypto'
import { NUMMER_RE } from '../_shared/projekt.ts'
import { baueAntwort } from '../_shared/lignoai.ts'

const corsHeaders = {
  ...baseCors,
  'Access-Control-Allow-Headers': `${baseCors['Access-Control-Allow-Headers']}, x-woodflow-key`,
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function keyOk(provided: string | null): boolean {
  const secret = Deno.env.get('LIGNOAI_LESE_KEY')
  if (!secret || !provided) return false
  const d = (v: string) => createHash('sha256').update(v, 'utf8').digest()
  return timingSafeEqual(d(provided), d(secret))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return json({ error: 'Nur GET erlaubt' }, 405)

  if (!Deno.env.get('LIGNOAI_LESE_KEY')) {
    console.error('LIGNOAI_LESE_KEY ist nicht gesetzt')
    return json({ error: 'Server nicht konfiguriert' }, 500)
  }
  if (!keyOk(req.headers.get('x-woodflow-key'))) {
    return json({ error: 'Ungültiger oder fehlender API-Schlüssel' }, 401)
  }

  const nummer = (new URL(req.url).searchParams.get('projekt') ?? '').trim()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    // Ohne Projektnummer: nur die Projektliste (damit der Chat nachfragen kann).
    if (!nummer) {
      const { data, error } = await supabase
        .from('projekte').select('nummer, name, ort, produktionsstart').order('nummer').limit(500)
      if (error) throw error
      return json({ projekte: data ?? [] })
    }
    if (!NUMMER_RE.test(nummer)) {
      return json({ error: `Projektnummer ${nummer} hat nicht das Format JJ.NNNN.` }, 400)
    }

    const { data: p, error: pErr } = await supabase
      .from('projekte').select('id, nummer, name, ort, status, produktionsstart, ifc_hochgeladen_am')
      .eq('nummer', nummer).maybeSingle()
    if (pErr) throw pErr
    if (!p) return json({ error: `Projekt ${nummer} gibt es in Woodflow nicht.` }, 404)

    const [el, ms, pr] = await Promise.all([
      supabase.from('elemente')
        .select('baugruppe, bauuntergruppe, typ, geschoss, status, cadwork_guid, updated_at')
        .eq('projekt_id', p.id).order('baugruppe').order('bauuntergruppe').limit(5000),
      supabase.from('meilensteine')
        .select('typ, soll_datum, erledigt_am, bemerkung').eq('projekt_id', p.id),
      supabase.from('ablage_pruefungen')
        .select('bereich, status, anzahl_ok, anzahl_offen, created_at, modell, punkte')
        .eq('projekt_id', p.id).order('created_at', { ascending: false }).limit(10),
    ])
    if (el.error) throw el.error
    if (ms.error) throw ms.error
    if (pr.error) throw pr.error

    const heute = new Date().toISOString().slice(0, 10)
    return json(baueAntwort(p, el.data ?? [], ms.data ?? [], pr.data ?? [], heute))
  } catch (err) {
    console.error('lignoai-lesen Fehler:', err instanceof Error ? err.message : err)
    return json({ error: 'Interner Fehler beim Lesen' }, 500)
  }
})
