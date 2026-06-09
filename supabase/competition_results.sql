create table competition_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  competition_name text not null,
  dance_style text not null, -- 'freestyle' | 'slow' | 'begge'
  placement text,            -- f.eks. "1", "2", "finalist", "semifinalist"
  notes text,
  created_at timestamptz default now()
);

alter table competition_results enable row level security;

create policy "Users can manage their own results"
  on competition_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
