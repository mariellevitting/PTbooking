-- Profiles table (extends Supabase auth.users)
create type user_role as enum ('dancer', 'parent', 'trainer');

create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role user_role not null,
  phone text,
  created_at timestamptz default now()
);

-- Children (linked to parent)
create table children (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  birthdate date,
  created_at timestamptz default now()
);

-- Trainer details
create table trainers (
  id uuid references profiles(id) on delete cascade primary key,
  bio text,
  dance_styles text[] default '{}',
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table children enable row level security;
alter table trainers enable row level security;

-- Profiles: users can read all profiles, only edit their own
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Children: only the parent can see/edit their children
create policy "Parents can manage their children" on children
  for all using (auth.uid() = parent_id);

-- Trainers: everyone can view, only the trainer can edit
create policy "Trainer profiles are viewable by everyone" on trainers
  for select using (true);

create policy "Trainers can manage their own record" on trainers
  for all using (auth.uid() = id);

-- Auto-create trainer record when a trainer registers
create or replace function handle_new_trainer()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'trainer' then
    insert into trainers (id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_trainer_created
  after insert on profiles
  for each row execute function handle_new_trainer();
