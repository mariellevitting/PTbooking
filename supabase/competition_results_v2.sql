alter table competition_results
  add column if not exists placement_freestyle text,
  add column if not exists placement_slow text;
