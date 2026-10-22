-- Bytte av privattimer mellom to brukere hos samme trener.
-- Kjør i Supabase SQL Editor.

create table if not exists swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_booking_id uuid not null references bookings(id) on delete cascade,
  target_booking_id uuid not null references bookings(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  target_user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table swap_requests enable row level security;

drop policy if exists "Swap parties can view" on swap_requests;
create policy "Swap parties can view" on swap_requests
  for select using (auth.uid() in (requester_id, target_user_id));
-- Opprettelse og svar skjer kun via funksjonene under.

-- Opptatte, kommende timer hos en trener, med navn. Kun for medlemmer i samme klubb.
create or replace function public.list_trainer_booked_slots(p_trainer_id uuid)
returns table (slot_id uuid, start_at timestamptz, end_at timestamptz, booking_id uuid,
               dancer_name text, owner_id uuid, booker_id uuid)
language sql stable security definer set search_path = public as $$
  select s.id, s.start_at, s.end_at, b.id, b.dancer_name,
         coalesce(b.linked_user_id, b.booker_id), b.booker_id
  from availability_slots s
  join bookings b on b.slot_id = s.id and b.status = 'confirmed'
  join profiles t on t.id = s.trainer_id
  join profiles me on me.id = auth.uid()
  where s.trainer_id = p_trainer_id
    and s.start_at > now()
    and t.club_id = me.club_id
  order by s.start_at;
$$;

-- Send bytteforespørsel: min booking mot en annens booking hos samme trener.
create or replace function public.request_swap(p_my_booking uuid, p_target_booking uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  mine bookings; theirs bookings; s_mine availability_slots; s_theirs availability_slots;
  target_owner uuid; new_id uuid;
begin
  select * into mine from bookings where id = p_my_booking and status = 'confirmed';
  select * into theirs from bookings where id = p_target_booking and status = 'confirmed';
  if mine.id is null or theirs.id is null then raise exception 'Timen finnes ikke lenger'; end if;
  if auth.uid() not in (mine.booker_id, coalesce(mine.linked_user_id, mine.booker_id)) then
    raise exception 'Du kan bare tilby dine egne timer';
  end if;

  select * into s_mine from availability_slots where id = mine.slot_id;
  select * into s_theirs from availability_slots where id = theirs.slot_id;
  if s_mine.trainer_id <> s_theirs.trainer_id then raise exception 'Timene må være hos samme trener'; end if;
  if s_mine.start_at <= now() or s_theirs.start_at <= now() then raise exception 'Timen har allerede startet'; end if;

  target_owner := coalesce(theirs.linked_user_id, theirs.booker_id);
  if target_owner = s_theirs.trainer_id then raise exception 'Denne timen kan ikke byttes'; end if;
  if target_owner = auth.uid() or theirs.booker_id = auth.uid() then raise exception 'Dette er din egen time'; end if;

  if exists (select 1 from swap_requests where status = 'pending'
             and requester_booking_id = p_my_booking and target_booking_id = p_target_booking) then
    raise exception 'Du har allerede sendt denne forespørselen';
  end if;

  insert into swap_requests (requester_booking_id, target_booking_id, requester_id, target_user_id)
  values (p_my_booking, p_target_booking, auth.uid(), target_owner)
  returning id into new_id;
  return new_id;
end;
$$;

-- Innkommende, ventende forespørsler for innlogget bruker (utløpte filtreres bort).
create or replace function public.get_incoming_swaps()
returns table (request_id uuid, requester_id uuid, requester_name text, requester_start timestamptz,
               my_name text, my_start timestamptz, trainer_id uuid, trainer_name text)
language sql stable security definer set search_path = public as $$
  select r.id, r.requester_id, rb.dancer_name, rs.start_at,
         tb.dancer_name, ts.start_at, ts.trainer_id, tp.name
  from swap_requests r
  join bookings rb on rb.id = r.requester_booking_id and rb.status = 'confirmed'
  join bookings tb on tb.id = r.target_booking_id and tb.status = 'confirmed'
  join availability_slots rs on rs.id = rb.slot_id
  join availability_slots ts on ts.id = tb.slot_id
  join profiles tp on tp.id = ts.trainer_id
  where r.target_user_id = auth.uid()
    and r.status = 'pending'
    and rs.start_at > now() and ts.start_at > now()
  order by r.created_at desc;
$$;

-- Godta eller avvis. Ved godkjenning byttes tidene på de to bookingene i én transaksjon.
-- Betaling, navn og dansestil følger personen (bookingen), bare tidspunktet byttes.
create or replace function public.respond_swap(p_request uuid, p_accept boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  r swap_requests; rb bookings; tb bookings; rs availability_slots; ts availability_slots;
  tmp_slot uuid; tmp_start timestamptz;
begin
  select * into r from swap_requests where id = p_request for update;
  if r.id is null or r.target_user_id <> auth.uid() then raise exception 'Fant ikke forespørselen'; end if;
  if r.status <> 'pending' then raise exception 'Forespørselen er allerede besvart'; end if;

  select * into rb from bookings where id = r.requester_booking_id for update;
  select * into tb from bookings where id = r.target_booking_id for update;
  select * into rs from availability_slots where id = rb.slot_id;
  select * into ts from availability_slots where id = tb.slot_id;

  if not p_accept then
    update swap_requests set status = 'rejected', responded_at = now() where id = r.id;
    return json_build_object('accepted', false, 'requester_id', r.requester_id, 'trainer_id', ts.trainer_id,
      'requester_name', rb.dancer_name, 'target_name', tb.dancer_name,
      'requester_start', rs.start_at, 'target_start', ts.start_at);
  end if;

  if rb.status <> 'confirmed' or tb.status <> 'confirmed' or rs.start_at <= now() or ts.start_at <= now() then
    update swap_requests set status = 'cancelled', responded_at = now() where id = r.id;
    raise exception 'En av timene er avbestilt eller har startet';
  end if;

  -- Midlertidig plassholder-tid så byttet fungerer selv med unik-sperre på slot_id
  tmp_start := timestamptz '1900-01-01' + (random() * interval '3650 days');
  insert into availability_slots (trainer_id, start_at, end_at, is_booked)
  values (rs.trainer_id, tmp_start, tmp_start + interval '30 minutes', true)
  returning id into tmp_slot;

  update bookings set slot_id = tmp_slot where id = rb.id;
  update bookings set slot_id = rs.id where id = tb.id;
  update bookings set slot_id = ts.id where id = rb.id;
  delete from availability_slots where id = tmp_slot;

  update swap_requests set status = 'accepted', responded_at = now() where id = r.id;
  -- Andre ventende forespørsler for disse to timene gjelder ikke lenger
  update swap_requests set status = 'cancelled', responded_at = now()
  where status = 'pending' and id <> r.id
    and (requester_booking_id in (rb.id, tb.id) or target_booking_id in (rb.id, tb.id));

  return json_build_object('accepted', true, 'requester_id', r.requester_id, 'trainer_id', ts.trainer_id,
    'requester_name', rb.dancer_name, 'target_name', tb.dancer_name,
    'requester_start', rs.start_at, 'target_start', ts.start_at);
end;
$$;

grant execute on function public.list_trainer_booked_slots(uuid) to authenticated;
grant execute on function public.request_swap(uuid, uuid) to authenticated;
grant execute on function public.get_incoming_swaps() to authenticated;
grant execute on function public.respond_swap(uuid, boolean) to authenticated;
