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

-- Seed the strands for a new user automatically.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.strands (user_id, key, sort_order) values
    (new.id, 'goals', 0),
    (new.id, 'habits', 1),
    (new.id, 'targets', 2),
    (new.id, 'journal', 3);
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

-- ============================================================
-- TARGETS (cumulative counters toward a goal — e.g. "LeetCode
-- questions", target 500). New table — if you already ran the
-- rest of this file, you only need to run this block.
-- ============================================================
create table if not exists targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  unit text not null default '',
  current_count int not null default 0,
  target_count int not null default 0,
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists targets_user_idx on targets (user_id);

alter table targets enable row level security;

create policy "Users manage their own targets"
  on targets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Atomic increment for targets — fixes a race condition where rapid
-- clicks could overwrite each other because the client-side count
-- could go stale between clicks. This function reads and writes the
-- count in one atomic database operation, so it can't race.
create or replace function increment_target(target_id uuid, delta int)
returns void as $$
begin
  update targets
  set current_count = greatest(0, current_count + delta)
  where id = target_id and user_id = auth.uid();
end;
$$ language plpgsql;

-- ============================================================
-- GOAL TEMPLATES (saved titles for one-click quick-add to
-- today's goals — set once, reuse anytime). New table.
-- ============================================================
create table if not exists goal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists goal_templates_user_idx on goal_templates (user_id);

alter table goal_templates enable row level security;

create policy "Users manage their own goal templates"
  on goal_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Productivity rating for journal entries — optional 1-10 self-rating,
-- lower friction than writing on days you don't feel like journaling.
alter table journal_entries add column if not exists productivity int;

-- Backfill 'targets' into the strands registry for existing accounts
-- (the original trigger only had goals/habits/journal). Safe to re-run —
-- the unique(user_id, key) constraint means duplicates are just skipped.
insert into strands (user_id, key, sort_order)
select id, 'targets', 2 from auth.users
on conflict (user_id, key) do nothing;

-- Bump journal to sort_order 3 to make room, only if it's still at its
-- original seed value (won't touch it if you've already reordered).
update strands set sort_order = 3 where key = 'journal' and sort_order = 2;

-- ============================================================
-- OPPORTUNITIES (career/job/networking pipeline tracker)
-- ============================================================
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default '',
  status text not null default 'watching', -- watching | applied | interview | offer | rejected
  next_action text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_user_idx on opportunities (user_id);

alter table opportunities enable row level security;

create policy "Users manage their own opportunities"
  on opportunities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- CV STORAGE — private bucket, one file per user (folder = user id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users can upload their own documents"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own documents"
on storage.objects for select
using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own documents"
on storage.objects for update
using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own documents"
on storage.objects for delete
using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Richer opportunity fields — link, contact, location, deadline
alter table opportunities add column if not exists link text not null default '';
alter table opportunities add column if not exists contact text not null default '';
alter table opportunities add column if not exists location text not null default '';
alter table opportunities add column if not exists deadline date;

-- Habit frequency beyond daily. Existing habits default to 'daily',
-- so nothing changes for anything already tracked.
alter table habits add column if not exists frequency_type text not null default 'daily';
-- frequency_type: 'daily' | 'weekly_days' | 'weekly_count'
alter table habits add column if not exists frequency_days int[] not null default '{}';
-- frequency_days: weekday numbers due, 0=Sun..6=Sat (only used for 'weekly_days')
alter table habits add column if not exists frequency_count int;
-- frequency_count: target logs per week (only used for 'weekly_count')
