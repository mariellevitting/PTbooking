-- Antall ganger treneren har purret på kvittering for en booking.
-- Kjør i Supabase SQL-editor.
alter table bookings add column if not exists receipt_reminders_sent int not null default 0;
