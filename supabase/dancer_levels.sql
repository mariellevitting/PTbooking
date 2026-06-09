alter table profiles
  add column if not exists level_freestyle int default 0,
  add column if not exists level_slow int default 0;
