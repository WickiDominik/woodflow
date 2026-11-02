import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lovable Cloud setzt diese Werte automatisch, sobald die Datenbank aktiv ist.
// Fehlen sie, läuft Woodflow im Demo-Modus mit den Beispieldaten aus src/data/mockData.ts.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
      })
    : null;

export const istDemoModus = supabase === null;
