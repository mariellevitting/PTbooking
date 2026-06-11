-- Opprett clubs-tabell
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  invite_code text unique not null,
  primary_color text default '#7c3aed',
  website text,
  created_at timestamptz default now()
);

-- Legg til Evolution som første klubb
insert into clubs (name, short_name, invite_code, primary_color, website)
values ('Evolution Danseklubb', 'Evolution', 'EVOLUTION', '#7c3aed', 'https://evolution-studio.no');

-- Legg til club_id på profiles
alter table profiles
  add column if not exists club_id uuid references clubs(id);

-- Koble alle eksisterende brukere til Evolution
update profiles
set club_id = (select id from clubs where invite_code = 'EVOLUTION')
where club_id is null;

-- RLS på clubs (alle kan lese)
alter table clubs enable row level security;
create policy "Anyone can read clubs"
  on clubs for select
  using (true);
