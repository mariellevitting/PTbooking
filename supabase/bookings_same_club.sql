-- Hindrer bookinger på tvers av klubber (også ved direkte API-kall).
-- Kjør i Supabase SQL-editor.

drop policy if exists "Authenticated users can create bookings" on bookings;

create policy "Bookings must stay within the club"
  on bookings for insert
  with check (
    auth.uid() = booker_id
    and exists (
      select 1
      from availability_slots s
      join profiles trainer on trainer.id = s.trainer_id
      join profiles booker  on booker.id  = auth.uid()
      where s.id = bookings.slot_id
        and trainer.club_id = booker.club_id
    )
    and (
      linked_user_id is null
      or exists (
        select 1
        from availability_slots s
        join profiles trainer on trainer.id = s.trainer_id
        join profiles linked  on linked.id  = bookings.linked_user_id
        where s.id = bookings.slot_id
          and trainer.club_id = linked.club_id
      )
    )
  );
