-- Saler til egentrening: admin/trener legger ut ledige 30-min-blokker per sal,
-- dansere/foreldre booker. Gratis, helt adskilt fra privattime-systemet
-- (egne tabeller, rører ikke availability_slots/bookings).
-- Kjør i Supabase SQL Editor.

create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references clubs(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table rooms enable row level security;

create policy "Everyone can view rooms" on rooms
  for select using (true);

create table if not exists room_slots (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_booked boolean default false,
  created_at timestamptz default now()
);

alter table room_slots enable row level security;

create policy "Everyone can view room slots" on room_slots
  for select using (true);

create policy "Trainers can manage room slots in their club" on room_slots
  for all using (
    exists (
      select 1 from profiles p
      join rooms r on r.id = room_slots.room_id
      where p.id = auth.uid() and p.role = 'trainer' and p.club_id = r.club_id
    )
  );

create table if not exists room_bookings (
  id uuid default gen_random_uuid() primary key,
  slot_id uuid references room_slots(id) on delete cascade not null,
  booker_id uuid references profiles(id) on delete cascade not null,
  dancer_name text not null,
  status text not null default 'confirmed',
  created_at timestamptz default now()
);

alter table room_bookings enable row level security;

create policy "Bookers can see their own room bookings" on room_bookings
  for select using (auth.uid() = booker_id);

create policy "Trainers can see room bookings in their club" on room_bookings
  for select using (
    exists (
      select 1 from profiles p
      join room_slots rs on rs.id = room_bookings.slot_id
      join rooms r on r.id = rs.room_id
      where p.id = auth.uid() and p.role = 'trainer' and p.club_id = r.club_id
    )
  );

create policy "Authenticated users can create room bookings" on room_bookings
  for insert with check (auth.uid() = booker_id);

create policy "Bookers can cancel their own room bookings" on room_bookings
  for update using (auth.uid() = booker_id);

-- Hindrer dobbeltbooking av samme blokk (race condition ved samtidige klikk)
create unique index if not exists room_bookings_one_confirmed_per_slot
  on room_bookings (slot_id) where status = 'confirmed';

-- is_booked settes/fjernes automatisk, samme mønster som availability_slots
create or replace function handle_new_room_booking()
returns trigger language plpgsql security definer as $$
begin
  update room_slots set is_booked = true where id = new.slot_id;
  return new;
end;
$$;

drop trigger if exists on_room_booking_created on room_bookings;
create trigger on_room_booking_created
  after insert on room_bookings
  for each row execute function handle_new_room_booking();

create or replace function handle_cancelled_room_booking()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update room_slots set is_booked = false where id = new.slot_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_room_booking_cancelled on room_bookings;
create trigger on_room_booking_cancelled
  after update on room_bookings
  for each row execute function handle_cancelled_room_booking();

-- Moveons tre saler. Andre klubber får saler kun ved å sette inn rader her
-- (funksjonen er generisk, bare uten egen admin-UI for å opprette saler ennå).
insert into rooms (club_id, name, sort_order)
select id, 'Sal 1', 1 from clubs where invite_code = 'MOVEON'
union all
select id, 'Sal 2', 2 from clubs where invite_code = 'MOVEON'
union all
select id, 'Sal 3', 3 from clubs where invite_code = 'MOVEON';
