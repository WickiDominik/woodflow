// deno-lint-ignore-file no-explicit-any
export const NUMMER_RE = /^\d{2}\.\d{4}$/

/** Findet das Projekt per Nummer oder legt es an. Behandelt gleichzeitige Anlage (unique violation). */
export async function projektFindenOderAnlegen(
  supabase: any,
  nummer: string,
  name: string | null | undefined,
): Promise<{ id: string; neu: boolean }> {
  const suche = async () => {
    const { data, error } = await supabase.from('projekte').select('id').eq('nummer', nummer).maybeSingle()
    if (error) throw error
    return data as { id: string } | null
  }
  const p = await suche()
  if (p) return { id: p.id, neu: false }
  const { data, error } = await supabase
    .from('projekte').insert({ nummer, name: name?.trim() || nummer }).select('id').single()
  if (error) {
    if (error.code === '23505') {
      const again = await suche()
      if (again) return { id: again.id, neu: false }
    }
    throw error
  }
  return { id: data.id, neu: true }
}
