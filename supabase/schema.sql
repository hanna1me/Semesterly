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
