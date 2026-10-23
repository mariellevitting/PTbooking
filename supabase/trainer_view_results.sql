-- Trenere kan se konkurranseresultater for dansere (og barn) i egen klubb.
-- Dansere kan skru det av med "Vis resultatene mine for trenere". Kjør i Supabase SQL Editor.

alter table profiles
  add column if not exists results_visible_to_trainer boolean not null default true;

drop policy if exists "Trainers can view club results" on competition_results;
create policy "Trainers can view club results" on competition_results
  for select using (
    exists (
      select 1
      from profiles me
      join profiles owner on owner.id = competition_results.user_id
      where me.id = auth.uid()
        and me.role = 'trainer'
        and me.club_id = owner.club_id
        and (competition_results.child_id is not null or owner.results_visible_to_trainer)
    )
  );
