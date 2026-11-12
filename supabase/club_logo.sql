-- Klubb-logo (valgfritt), vises i sidemenyen mellom nav og footer for
-- trenere i den klubben. Kjør i Supabase SQL Editor.

alter table clubs add column if not exists logo_url text;

-- Kolonne-nivå grant kreves (se docs/DECISIONS.md "Fase 3") — uten denne
-- feiler enhver select mot clubs som ber om logo_url, selv for andre kolonner
-- i samme spørring.
grant select (logo_url) on public.clubs to anon, authenticated;

-- Moveons logo. Selve bildet ligger i public/clubs/moveon-logo.png i koden.
update clubs set logo_url = '/clubs/moveon-logo.png' where invite_code = 'MOVEON';
