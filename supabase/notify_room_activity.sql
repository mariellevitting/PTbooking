-- Trenere kan velge (i profilen sin) om de vil varsles når noen
-- booker eller avbestiller en sal til egentrening. Kjør i Supabase SQL Editor.

alter table profiles add column if not exists notify_room_activity boolean default true;
