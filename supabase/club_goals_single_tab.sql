-- Lar en klubb vise kun "Sesong"-fanen i "Mine sesongmål" (ingen
-- stil-underfaner). Standard er false, så Evolution og Trondheim er
-- upåvirket. Kjør i Supabase SQL Editor.

alter table clubs add column if not exists goals_single_tab boolean default false;

grant select (goals_single_tab) on public.clubs to anon, authenticated;
