-- Flerspråklighet (norsk/engelsk). Se docs/DECISIONS.md "Flerspråklighet".
-- Kjør i Supabase SQL Editor.

alter table profiles
  add column if not exists language text,          -- 'no' | 'en' | null (null = ikke registrert ennå)
  add column if not exists language_source text;    -- 'auto' | 'manual' | null

-- Ingen ny RLS-policy nødvendig: "Users can update their own profile" dekker allerede
-- disse to nye kolonnene (policyen er ikke kolonne-scopet).
