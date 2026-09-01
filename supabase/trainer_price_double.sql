-- Egen pris for dobbeltimer (par). Kjør i Supabase SQL-editor.
alter table trainers add column if not exists price_double integer;

update clubs
set lesson_price_text = 'Privattime 150–200 kr, dobbel 200–250 kr – avhengig av trener'
where invite_code = 'TRONDHEIM';
