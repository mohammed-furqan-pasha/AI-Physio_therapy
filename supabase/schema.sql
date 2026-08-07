-- Run this once in the Supabase SQL editor for your project.
-- Stores only session SUMMARIES (per spec: no live writes during a session,
-- a single row is inserted when the user clicks "Finish Session").

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  total_reps integer not null default 0,
  duration_seconds integer not null default 0,
  max_angle numeric not null default 0,
  form_warnings_encountered text[] not null default '{}',
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

-- Users can only read their own session history.
create policy "Users can read own sessions"
  on public.sessions
  for select
  using (auth.uid() = user_id);

-- Users can only insert session rows for themselves.
create policy "Users can insert own sessions"
  on public.sessions
  for insert
  with check (auth.uid() = user_id);

create index if not exists sessions_user_id_idx on public.sessions (user_id);

alter table public.exercises
  add column if not exists tutorial_media_url text,
  add column if not exists tutorial_media_type text
    check (tutorial_media_type in ('image', 'gif', 'video'));
