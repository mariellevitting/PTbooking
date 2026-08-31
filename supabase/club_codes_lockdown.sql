-- Fase 3: Skjul klubbenes registreringskoder fra det offentlige API-et.
-- Før: trainer_code/dancer_code/parent_code kunne leses av hvem som helst
-- via den offentlige nøkkelen. Nå kan bare serveren sjekke dem.
-- Kjør i Supabase SQL-editor.

-- 1) Funksjon som verifiserer en kode (brukes under registrering, før innlogging).
--    Kjører med utvidede rettigheter, så den kan lese kode-kolonnene.
create or replace function public.verify_club_code(p_code text, p_role text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.clubs
  where p_code is not null and p_code <> '' and (
    (p_role = 'trainer' and trainer_code = p_code) or
    (p_role = 'dancer'  and dancer_code  = p_code) or
    (p_role = 'parent'  and parent_code  = p_code)
  )
  limit 1;
$$;

revoke all on function public.verify_club_code(text, text) from public;
grant execute on function public.verify_club_code(text, text) to anon, authenticated;

-- 2) Admin-only: hele klubb-rader inkludert koder (til /admin-sidene).
create or replace function public.admin_list_clubs()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
  from public.clubs c
  where (auth.jwt() ->> 'email') = 'miemarielle@live.no';
$$;

revoke all on function public.admin_list_clubs() from public;
grant execute on function public.admin_list_clubs() to authenticated;

-- 3) Fjern direkte lese-tilgang til kode-kolonnene for vanlige brukere.
--    Alle andre kolonner er fortsatt lesbare (klubbnavn, farge, info osv.).
revoke select on public.clubs from anon, authenticated;
grant select (
  id, name, short_name, invite_code, primary_color, website, created_at,
  city, lesson_info, lesson_duration_min, lesson_price_text, default_price,
  payment_label, payment_info, payment_url, receipt_note, dance_styles
) on public.clubs to anon, authenticated;
