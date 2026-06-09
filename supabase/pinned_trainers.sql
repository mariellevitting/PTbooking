create table pinned_trainers (
  user_id uuid references profiles(id) on delete cascade,
  trainer_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, trainer_id)
);

-- Kun eier kan se og endre sine egne pins
alter table pinned_trainers enable row level security;

create policy "Users can manage their own pins"
  on pinned_trainers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
