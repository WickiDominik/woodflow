CREATE TABLE public.ablage_pruefungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id uuid NOT NULL REFERENCES public.projekte(id) ON DELETE CASCADE,
  bereich text NOT NULL CHECK (bereich IN ('produktion','montage')),
  status text NOT NULL,
  anzahl_ok int NOT NULL DEFAULT 0,
  anzahl_offen int NOT NULL DEFAULT 0,
  punkte jsonb NOT NULL DEFAULT '[]'::jsonb,
  modell text,
  benutzer text,
  version text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ablage_pruefungen_projekt_bereich_idx ON public.ablage_pruefungen (projekt_id, bereich, created_at DESC);
GRANT SELECT ON public.ablage_pruefungen TO authenticated;
GRANT ALL ON public.ablage_pruefungen TO service_role;
ALTER TABLE public.ablage_pruefungen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ablage pruefungen lesen" ON public.ablage_pruefungen FOR SELECT TO authenticated USING (true);