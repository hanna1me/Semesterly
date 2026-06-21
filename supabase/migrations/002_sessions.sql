-- Semesterly Phase 2 migration: study sessions
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

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

-- RLS
alter table public.sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
