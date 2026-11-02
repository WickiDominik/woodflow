-- Woodflow Phase 1: Fundament
-- Datenmodell nach "Arbeitsanweisung Werkplanung schaerholzbau" (Stand 08.10.2026):
--   * Projekt mit Projektnummer gem. Auftragsdatenblatt (Kap. 1.2)
--   * Meilensteine des Projektablaufs (Kap. 1.1)
--   * Elemente mit Bauuntergruppe (z.B. AW_EG) und Baugruppe (z.B. AW_EG_01) (Kap. 2.1)
--   * Element-Status entlang der Timbar-QM-Abschnitte (Kap. 14.4.4)
--   * QM-Punkte pro Projekt / Element
-- Rollen: Projektleitung, AVOR, Produktion, Montage, Admin.

-- ---------------------------------------------------------------- Typen
create type public.app_rolle as enum ('admin', 'projektleitung', 'avor', 'produktion', 'montage');

create type public.status_ampel as enum ('green', 'yellow', 'red');

create type public.meilenstein_typ as enum (
  'bta',                    -- Bauteilaufbauten definiert und unterschrieben
  'details',                -- Detailpläne kontrolliert und unterschrieben
  'kontrollplaene',         -- Kontrollpläne kontrolliert und unterschrieben
  'ausfuehrungsplaene',     -- ca. 9-12 Wochen vor Produktionsstart
  'material_bestellt',      -- min. 6 Wochen vor Produktionsstart
  'planung_abgeschlossen',  -- min. 2 Wochen vor Produktionsstart
  'produktionsstart',
  'aufrichte',
  'abnahme'
);

create type public.element_status as enum (
  'geplant',
  'freigegeben',            -- Planung / Elementplan freigegeben
  'abbund',                 -- Timbar-Abschnitt Abbund
  'zusammenbau',            -- Timbar-Abschnitt Zusammenbau
  'weinmann',               -- Timbar-Abschnitt Weinmann (MFB)
  'verladen',               -- Timbar-Abschnitt Endkontrolle & Verlad
  'montiert',
  'abgenommen'
);

create type public.qm_status as enum ('Offen', 'In Bearbeitung', 'Freigegeben');
create type public.qm_prioritaet as enum ('Hoch', 'Mittel', 'Niedrig');
create type public.bereich as enum ('AVOR', 'Produktion', 'Montage', 'Fertigstellung');

-- ---------------------------------------------------------------- Benutzer und Rollen
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

-- Rollen in eigener Tabelle (nie im Profil), damit Benutzer sich keine Rechte selbst geben können.
create table public.user_rollen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rolle public.app_rolle not null,
  unique (user_id, rolle)
);

create or replace function public.has_rolle(_user_id uuid, _rolle public.app_rolle)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_rollen where user_id = _user_id and rolle = _rolle)
$$;

create or replace function public.has_any_rolle(_user_id uuid, _rollen public.app_rolle[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_rollen where user_id = _user_id and rolle = any (_rollen))
$$;

-- Profil automatisch anlegen, wenn sich jemand das erste Mal anmeldet (Microsoft oder E-Mail).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- Projekte
create table public.projekte (
  id uuid primary key default gen_random_uuid(),
  nummer text not null unique,          -- z.B. 26.0138
  name text not null,
  beschreibung text,
  ort text,
  status public.status_ampel not null default 'green',
  produktionsstart date,                -- Basis für die Meilenstein-Fristen
  windream_pfad text,                   -- Link statt eigener Dateiablage
  nextcloud_pfad text,                  -- Werkordner Montage
  timbar_url text,                      -- Projekt in der Timbar-QM-Plattform
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meilensteine (
  id uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references public.projekte (id) on delete cascade,
  typ public.meilenstein_typ not null,
  soll_datum date,
  erledigt_am date,
  erledigt_von uuid references auth.users (id),
  bemerkung text,
  unique (projekt_id, typ)
);

-- ---------------------------------------------------------------- Elemente
create table public.elemente (
  id uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references public.projekte (id) on delete cascade,
  bauuntergruppe text not null,         -- z.B. AW_EG
  baugruppe text not null,              -- z.B. AW_EG_01 (eindeutig im Projekt)
  typ text,                             -- Aussenwand, Innenwand, Decke, Dach ...
  geschoss text,                        -- EG, 1.OG ...
  laenge_mm integer,
  hoehe_mm integer,
  breite_mm integer,
  status public.element_status not null default 'geplant',
  cadwork_guid text,                    -- für Abgleich mit Toolcenter / Timbar
  quelle text not null default 'manuell', -- manuell | toolcenter
  updated_at timestamptz not null default now(),
  unique (projekt_id, baugruppe)
);

create index elemente_projekt_idx on public.elemente (projekt_id);

-- Verlauf: wer hat wann welchen Status gesetzt
create table public.element_status_verlauf (
  id bigint generated always as identity primary key,
  element_id uuid not null references public.elemente (id) on delete cascade,
  status public.element_status not null,
  geaendert_von uuid references auth.users (id),
  geaendert_am timestamptz not null default now()
);

create or replace function public.log_element_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.element_status_verlauf (element_id, status, geaendert_von)
    values (new.id, new.status, auth.uid());
  end if;
  return null;
end;
$$;

-- AFTER-Trigger: das Element muss schon existieren, sonst schlägt der Fremdschlüssel im Verlauf fehl.
create trigger elemente_status_log
  after insert or update of status on public.elemente
  for each row execute function public.log_element_status();

-- ---------------------------------------------------------------- QM-Punkte
create table public.qm_punkte (
  id uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references public.projekte (id) on delete cascade,
  element_id uuid references public.elemente (id) on delete set null,
  bereich public.bereich not null,
  status public.qm_status not null default 'Offen',
  prioritaet public.qm_prioritaet not null default 'Mittel',
  beschreibung text not null,
  datum date not null default current_date,
  erstellt_von uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index qm_punkte_projekt_idx on public.qm_punkte (projekt_id);

-- ---------------------------------------------------------------- updated_at Projekte
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projekte_touch before update on public.projekte
  for each row execute function public.touch_updated_at();

create trigger elemente_touch before update on public.elemente
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- Zugriffsrechte (RLS)
alter table public.profiles enable row level security;
alter table public.user_rollen enable row level security;
alter table public.projekte enable row level security;
alter table public.meilensteine enable row level security;
alter table public.elemente enable row level security;
alter table public.element_status_verlauf enable row level security;
alter table public.qm_punkte enable row level security;

-- Lesen: alle angemeldeten Mitarbeitenden
create policy "profiles lesen" on public.profiles for select to authenticated using (true);
create policy "eigenes profil ändern" on public.profiles for update to authenticated using (id = auth.uid());

create policy "eigene rollen lesen" on public.user_rollen for select to authenticated
  using (user_id = auth.uid() or public.has_rolle(auth.uid(), 'admin'));
create policy "rollen verwalten (admin)" on public.user_rollen for all to authenticated
  using (public.has_rolle(auth.uid(), 'admin'))
  with check (public.has_rolle(auth.uid(), 'admin'));

create policy "projekte lesen" on public.projekte for select to authenticated using (true);
create policy "projekte schreiben (PL, AVOR, Admin)" on public.projekte for all to authenticated
  using (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]))
  with check (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]));

create policy "meilensteine lesen" on public.meilensteine for select to authenticated using (true);
create policy "meilensteine schreiben (PL, AVOR, Admin)" on public.meilensteine for all to authenticated
  using (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]))
  with check (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]));

create policy "elemente lesen" on public.elemente for select to authenticated using (true);
create policy "elemente anlegen/löschen (PL, AVOR, Admin)" on public.elemente for insert to authenticated
  with check (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]));
create policy "elemente löschen (PL, AVOR, Admin)" on public.elemente for delete to authenticated
  using (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor']::public.app_rolle[]));
-- Status melden dürfen auch Produktion und Montage
create policy "elemente ändern (alle Rollen)" on public.elemente for update to authenticated
  using (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor', 'produktion', 'montage']::public.app_rolle[]))
  with check (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor', 'produktion', 'montage']::public.app_rolle[]));

create policy "verlauf lesen" on public.element_status_verlauf for select to authenticated using (true);

create policy "qm lesen" on public.qm_punkte for select to authenticated using (true);
create policy "qm schreiben (alle Rollen)" on public.qm_punkte for all to authenticated
  using (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor', 'produktion', 'montage']::public.app_rolle[]))
  with check (public.has_any_rolle(auth.uid(), array['admin', 'projektleitung', 'avor', 'produktion', 'montage']::public.app_rolle[]));

-- ---------------------------------------------------------------- Pilotprojekt
-- Elemente kommen in Phase 2 über das Toolcenter; hier nur Projekt und Meilensteine.
insert into public.projekte (nummer, name, beschreibung, ort, status)
values ('26.0138', 'MFH Rickli Jordy', 'Pilotprojekt Woodflow', 'Tunstetten', 'green');

insert into public.meilensteine (projekt_id, typ)
select p.id, t.typ
from public.projekte p
cross join unnest(enum_range(null::public.meilenstein_typ)) as t (typ)
where p.nummer = '26.0138';
