-- Legg til danserfelter på children-tabellen
alter table children
  add column if not exists season_goals text,
  add column if not exists points_freestyle int default 0,
  add column if not exists points_slow int default 0,
  add column if not exists level_freestyle int default 0,
  add column if not exists level_slow int default 0;

-- Legg til child_id på competition_results (valgfritt – for barn bookinger via forelder)
alter table competition_results
  add column if not exists child_id uuid references children(id) on delete cascade;
