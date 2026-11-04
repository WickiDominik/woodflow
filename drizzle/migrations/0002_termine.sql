CREATE TABLE public.termine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id uuid NOT NULL REFERENCES public.projekte(id) ON DELETE CASCADE,
  reihenfolge integer NOT NULL,
  aufgabe text NOT NULL,
  zustaendig text,
  start date NOT NULL,
  ende date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.termine TO authenticated;
GRANT ALL ON public.termine TO service_role;
ALTER TABLE public.termine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "termine lesen" ON public.termine FOR SELECT TO authenticated USING (true);
CREATE POLICY "termine anlegen (PL, AVOR, Admin)" ON public.termine FOR INSERT TO authenticated WITH CHECK (public.has_any_rolle(auth.uid(), ARRAY['admin','projektleitung','avor']::public.app_rolle[]));
CREATE POLICY "termine löschen (PL, AVOR, Admin)" ON public.termine FOR DELETE TO authenticated USING (public.has_any_rolle(auth.uid(), ARRAY['admin','projektleitung','avor']::public.app_rolle[]));
CREATE INDEX termine_projekt_start_idx ON public.termine (projekt_id, start);