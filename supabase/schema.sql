-- Strand database schema
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).

-- ============================================================
-- GOALS (daily checklist, resets each day by date)
-- ============================================================
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  completed_at timestamptz,
  for_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_date_idx on goals (user_id, for_date);

alter table goals enable row level security;

create policy "Users manage their own goals"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- HABITS (user-defined, streak derived from habit_logs)
-- ============================================================
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table habits enable row level security;

create policy "Users manage their own habits"
  on habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  for_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, for_date)
);

create index if not exists habit_logs_user_date_idx on habit_logs (user_id, for_date);

alter table habit_logs enable row level security;

create policy "Users manage their own habit logs"
  on habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- JOURNAL (one entry per day, three prompts)
-- ============================================================
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  for_date date not null default current_date,
  wins text default '',
  mistakes text default '',
  tomorrow text default '',
  updated_at timestamptz not null default now(),
  unique (user_id, for_date)
);

alter table journal_entries enable row level security;

create policy "Users manage their own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- STRANDS registry (which modules are active — powers the
-- "add/remove strands" modularity described in the product brief)
-- ============================================================
create table if not exists strands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,              -- e.g. 'goals', 'habits', 'journal'
  enabled boolean not null default true,
  sort_order int not null default 0,
  unique (user_id, key)
);

alter table strands enable row level security;

create policy "Users manage their own strands"
  on strands for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed the three v1 strands for a new user automatically.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.strands (user_id, key, sort_order) values
    (new.id, 'goals', 0),
    (new.id, 'habits', 1),
    (new.id, 'journal', 2);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- MIGRATION — run this if you already executed the schema above
-- (e.g. you set up Atlas before this file was updated). Safe to
-- run even on a fresh database — it's a no-op if the column
-- already exists.
-- ============================================================
alter table goals add column if not exists completed_at timestamptz;

-- Second migration — run this too if you're on an existing database
-- (adds drag-reorder support for habits). Safe no-op if already applied.
alter table habits add column if not exists sort_order int not null default 0;

-- One-time backfill so existing habits get a stable initial order
-- based on when they were created (only affects rows still at the
-- default 0, so safe to re-run).
with ordered as (
  select id, row_number() over (partition by user_id order by created_at) as rn
  from habits
  where sort_order = 0
)
update habits
set sort_order = ordered.rn
from ordered
where habits.id = ordered.id;
