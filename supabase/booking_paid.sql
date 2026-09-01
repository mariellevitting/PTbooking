-- Trener kan markere en booking som betalt. Kjør i Supabase SQL-editor.
alter table bookings add column if not exists paid boolean not null default false;
alter table bookings add column if not exists paid_at timestamptz;

-- "Trainers can cancel bookings on their slots" tillater allerede UPDATE for
-- trenerens egne timer. Men "Bookers can cancel their own bookings" gir
-- danser/forelder full UPDATE på egen booking – så vi hindrer at de endrer
-- betalt-status via en trigger.
create or replace function public.enforce_paid_by_trainer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.paid is distinct from old.paid then
    if not exists (
      select 1 from public.availability_slots s
      where s.id = new.slot_id and s.trainer_id = auth.uid()
    ) then
      new.paid := old.paid;
      new.paid_at := old.paid_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_paid_by_trainer on bookings;
create trigger trg_paid_by_trainer
  before update on bookings
  for each row execute function public.enforce_paid_by_trainer();
