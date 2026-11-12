-- Lar en klubb bytte ut hvilke to dansestiler "Mine sesongmål"-fanene
-- gjelder for (standard er Freestyle/Slow). Rører ikke dataene som
-- allerede er lagret (goals_freestyle/goals_slow-kolonnene er uendret,
-- dette endrer kun visningsnavnet) – Evolution og Trondheim påvirkes
-- ikke med mindre noen aktivt setter disse feltene for dem.
-- Kjør i Supabase SQL Editor.

alter table clubs add column if not exists goal_style_1 text;
alter table clubs add column if not exists goal_style_2 text;

-- Kolonne-nivå grant kreves (se docs/DECISIONS.md "Fase 3") — uten denne
-- feiler enhver select mot clubs som ber om disse kolonnene.
grant select (goal_style_1, goal_style_2) on public.clubs to anon, authenticated;
