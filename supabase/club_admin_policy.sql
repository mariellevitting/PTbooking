-- Lar admin (Mie) redigere klubb-innstillinger fra /admin/klubb-siden i appen.
-- Kjør i Supabase SQL-editor.

drop policy if exists "Admin can update clubs" on clubs;
create policy "Admin can update clubs"
  on clubs for update
  using ((auth.jwt() ->> 'email') = 'miemarielle@live.no')
  with check ((auth.jwt() ->> 'email') = 'miemarielle@live.no');
