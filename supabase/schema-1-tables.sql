-- Part 1 of 3 — Tables only. Run first, then schema-2, then schema-3.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null,
  email text not null,
  initials text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_workspaces (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.class_join_codes (
  join_code text primary key,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  unique (teacher_id, class_key)
);

create table if not exists public.join_requests (
  id text primary key,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  student_account_id integer not null default 0,
  requested_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists join_requests_teacher_idx on public.join_requests (teacher_id);
create index if not exists join_requests_student_idx on public.join_requests (student_user_id);

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  legacy_account_id bigint generated always as identity,
  display_name text not null,
  email text not null unique,
  initials text not null,
  linked_student_id integer,
  primary_teacher_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  student_id integer not null,
  unique (student_user_id, teacher_id, class_key)
);

create index if not exists student_enrollments_user_idx on public.student_enrollments (student_user_id);
