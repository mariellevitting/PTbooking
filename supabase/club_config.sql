-- Fase 1: Flytt klubb-spesifikt innhold fra kode til clubs-tabellen.
-- Kjør denne i Supabase SQL-editor.

-- 1) Nye kolonner på clubs
alter table clubs add column if not exists city text;
alter table clubs add column if not exists lesson_info text;
alter table clubs add column if not exists lesson_duration_min integer;
alter table clubs add column if not exists lesson_price_text text;
alter table clubs add column if not exists default_price integer not null default 150;
alter table clubs add column if not exists payment_label text;       -- f.eks. "Spond" / "Vipps"
alter table clubs add column if not exists payment_info text;        -- setning som vises til danser/forelder
alter table clubs add column if not exists payment_url text;         -- valgfri lenke (Spond e.l.)
alter table clubs add column if not exists receipt_note text;        -- "husk kvittering"-tekst
alter table clubs add column if not exists dance_styles text[] not null default '{}';

-- 2) Evolution – nøyaktig samme verdier som lå hardkodet i koden
update clubs set
  city = 'Sarpsborg',
  lesson_info = 'Evolutions instruktører tilbyr privattimer. Disse kan benyttes etter ønske – koreografi, teknikk, akrobatikk o.l. Dette er en flott mulighet for danserne til å utvikle seg og få tett oppfølging av trenerteamet.',
  lesson_duration_min = 30,
  lesson_price_text = '**250,-**, **200,-** eller **150,-** avhengig av trener',
  default_price = 150,
  payment_label = 'Spond',
  payment_info = 'Betaling er som før på **hjemmesiden til Spond**.',
  payment_url = 'https://club.spond.com/landing/courses/evolutsarpsdans/3A3FA8760C0A49B085117E051204FA8C/main_products?source=direct',
  receipt_note = 'Kvitteringen du mottar for betalt privattime må danseren ha med til timen! Du kan også sende bilde av kvitteringen til treneren i forkant.',
  dance_styles = ARRAY['Slow','Freestyle','Jazz','Moderne','Freestyle dobbel','Slow dobbel','Akro','Hiphop','Show']
where invite_code = 'EVOLUTION';

-- 3) Trondheim Danseklubb – midlertidige verdier, bekreft detaljene med klubben
update clubs set
  city = 'Trondheim',
  lesson_info = 'Trenerne tilbyr privattimer i freestyle og slow – individuelt eller i par. En fin mulighet til å jobbe med teknikk og utvikling med tett oppfølging.',
  lesson_duration_min = 30,
  lesson_price_text = 'Prisen settes av hver enkelt trener',
  default_price = 150,
  payment_label = 'Vipps',
  payment_info = 'Betal via Vipps direkte til treneren. Send skjermbilde av kvitteringen til treneren i forkant, eller ta den med til timen.',
  payment_url = null,
  receipt_note = 'Ta med kvittering for betalt privattime til timen, eller send bilde til treneren i forkant.',
  dance_styles = ARRAY['Freestyle','Slow','Freestyle dobbel','Slow dobbel']
where invite_code = 'TRONDHEIM';

-- 4) Testklubb – enkle testverdier
update clubs set
  city = 'Testby',
  lesson_info = 'Testklubbens trenere tilbyr privattimer.',
  lesson_duration_min = 30,
  lesson_price_text = 'Varierer per trener',
  default_price = 150,
  payment_label = 'Vipps',
  payment_info = 'Betal via Vipps direkte til treneren.',
  receipt_note = 'Husk kvittering til timen.',
  dance_styles = ARRAY['Freestyle','Slow','Freestyle dobbel','Slow dobbel']
where invite_code = 'TESTKLUBB';
