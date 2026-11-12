-- Trenere kan avbestille sal-bookinger i egen klubb (ikke bare danseren/
-- forelderen selv). Rammet av rooms.sql sin RLS, manglet UPDATE-policy for
-- trenere. Kjør i Supabase SQL Editor.

create policy "Trainers can cancel room bookings in their club" on room_bookings
  for update using (
    exists (
      select 1 from profiles p
      join room_slots rs on rs.id = room_bookings.slot_id
      join rooms r on r.id = rs.room_id
      where p.id = auth.uid() and p.role = 'trainer' and p.club_id = r.club_id
    )
  );
