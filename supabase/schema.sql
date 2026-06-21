-- Semesterly Phase 1 schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  school_id text,        -- from Hipolabs API (stored as name string)
  school_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.semesters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  term text not null,        -- 'Fall', 'Spring', 'Summer', 'J-Term', 'Quarter'
  year integer not null,
  is_active boolean default false,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table public.courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  semester_id uuid references public.semesters(id) on delete cascade,
  name text not null,
  course_code text,          -- e.g. "COMP 221"
  credits numeric(3,1),
  instructor text,
  color text not null,       -- hex color string
  created_at timestamptz default now()
);

-- Row Level Security

alter table public.profiles enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles are deletable by owner"
  on public.profiles for delete
  using (auth.uid() = id);

create policy "Semesters are viewable by owner"
  on public.semesters for select
  using (auth.uid() = user_id);

create policy "Semesters are insertable by owner"
  on public.semesters for insert
  with check (auth.uid() = user_id);

create policy "Semesters are updatable by owner"
  on public.semesters for update
  using (auth.uid() = user_id);

create policy "Semesters are deletable by owner"
  on public.semesters for delete
  using (auth.uid() = user_id);

create policy "Courses are viewable by owner"
  on public.courses for select
  using (auth.uid() = user_id);

create policy "Courses are insertable by owner"
  on public.courses for insert
  with check (auth.uid() = user_id);

create policy "Courses are updatable by owner"
  on public.courses for update
  using (auth.uid() = user_id);

create policy "Courses are deletable by owner"
  on public.courses for delete
  using (auth.uid() = user_id);

-- Phase 2: study sessions (see supabase/migrations/002_sessions.sql)

create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,

  -- Timer
  timer_mode text not null check (timer_mode in ('stopwatch', 'countdown', 'pomodoro')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,         -- computed on save, not live

  -- Pre-session metadata
  work_type text not null check (work_type in (
    'homework', 'reading', 'exam_prep', 'writing', 'project', 'group_work', 'other'
  )),
  work_type_custom text,            -- populated if work_type = 'other'
  location text,                    -- user-defined freetext
  study_mode text check (study_mode in ('solo', 'with_friends', 'background_noise', 'focus_music')),

  -- Post-session
  focus_rating integer check (focus_rating between 1 and 5),
  notes text,

  -- Pomodoro specific
  pomodoro_work_minutes integer default 25,
  pomodoro_break_minutes integer default 5,
  pomodoro_cycles_completed integer default 0,

  -- Countdown specific
  countdown_target_seconds integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
