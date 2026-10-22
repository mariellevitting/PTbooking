-- Egne mål for Freestyle og Slow. Dagens season_goals blir "Sesong"-fanen,
-- så eksisterende mål beholdes uendret. Kjør i Supabase SQL Editor.
alter table profiles
  add column if not exists goals_freestyle text,
  add column if not exists goals_slow text;

alter table children
  add column if not exists goals_freestyle text,
  add column if not exists goals_slow text;
