alter table profiles
  add column if not exists season_goals text,
  add column if not exists points_freestyle int default 0,
  add column if not exists points_slow int default 0;
