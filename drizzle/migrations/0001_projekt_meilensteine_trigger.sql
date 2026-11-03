CREATE OR REPLACE FUNCTION public.projekt_meilensteine_anlegen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.meilensteine (projekt_id, typ)
  select new.id, t from unnest(enum_range(null::public.meilenstein_typ)) as t
  on conflict (projekt_id, typ) do nothing;
  return null;
end;
$$;
CREATE TRIGGER projekte_meilensteine_anlegen AFTER INSERT ON public.projekte
FOR EACH ROW EXECUTE FUNCTION public.projekt_meilensteine_anlegen();