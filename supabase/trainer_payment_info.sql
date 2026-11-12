-- Betalingsinfo per trener (Vipps-nummer eller kontonummer) – noen klubber
-- (som Moveon) har ulik betalingsmåte per trener, ikke én felles for klubben.
-- Faller tilbake til klubbens generelle betalingstekst når disse er tomme.
-- Kjør i Supabase SQL Editor.

alter table trainers add column if not exists payment_method text; -- 'vipps' | 'bank'
alter table trainers add column if not exists payment_value text;  -- Vipps-nummer eller kontonummer
