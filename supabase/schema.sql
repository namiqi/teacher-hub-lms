-- Teacher Hub LMS — run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null,
  email text not null,
  initials text not null default '',
  created_at timestamptz not null default now()
);

-- Teacher workspace (JSON blob matching app state minus join_requests)
create table if not exists public.teacher_workspaces (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Join code lookup (students search across all teachers)
create table if not exists public.class_join_codes (
  join_code text primary key,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  unique (teacher_id, class_key)
);

-- Join requests (cross-user)
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

-- Student profile (links auth user to legacy student account id)
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

-- Which classes a student is enrolled in (updated when teacher approves)
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  student_id integer not null,
  unique (student_user_id, teacher_id, class_key)
);

create index if not exists student_enrollments_user_idx on public.student_enrollments (student_user_id);

-- Auto-create profile on signup (reads role from raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  user_name text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'teacher');
  user_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, role, display_name, email, initials)
  values (
    new.id,
    user_role,
    user_name,
    new.email,
    upper(left(user_name, 1)) || coalesce(upper(substring(user_name from position(' ' in user_name) + 1 for 1)), '')
  );

  if user_role = 'teacher' then
    insert into public.teacher_workspaces (teacher_id, workspace)
    values (
      new.id,
      jsonb_build_object(
        'classes', '[]'::jsonb,
        'students', '[]'::jsonb,
        'attendance', jsonb_build_object('columns', '[]'::jsonb, 'recordsByClass', '{}'::jsonb),
        'payments', '[]'::jsonb,
        'assignments', '[]'::jsonb
      )
    );
  elsif user_role = 'student' then
    insert into public.student_profiles (user_id, display_name, email, initials)
    values (
      new.id,
      user_name,
      new.email,
      upper(left(user_name, 1)) || coalesce(upper(substring(user_name from position(' ' in user_name) + 1 for 1)), '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.teacher_workspaces enable row level security;
alter table public.class_join_codes enable row level security;
alter table public.join_requests enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_enrollments enable row level security;

-- Profiles: read own
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Teacher workspace: owner full access
create policy "workspace_teacher_all" on public.teacher_workspaces
  for all using (auth.uid() = teacher_id);

-- Students enrolled may read teacher workspace (for portal)
create policy "workspace_student_read_enrolled" on public.teacher_workspaces
  for select using (
    exists (
      select 1 from public.student_enrollments se
      where se.student_user_id = auth.uid()
        and se.teacher_id = teacher_workspaces.teacher_id
    )
  );

-- Join codes: authenticated users can read (for join flow)
create policy "join_codes_select_authenticated" on public.class_join_codes
  for select to authenticated using (true);

create policy "join_codes_teacher_manage" on public.class_join_codes
  for all using (auth.uid() = teacher_id);

-- Join requests
create policy "join_requests_teacher_select" on public.join_requests
  for select using (auth.uid() = teacher_id);

create policy "join_requests_teacher_update" on public.join_requests
  for update using (auth.uid() = teacher_id);

create policy "join_requests_student_select" on public.join_requests
  for select using (auth.uid() = student_user_id);

create policy "join_requests_student_insert" on public.join_requests
  for insert with check (auth.uid() = student_user_id);

-- Student profiles
create policy "student_profiles_own" on public.student_profiles
  for all using (auth.uid() = user_id);

-- Enrollments
create policy "enrollments_student_select" on public.student_enrollments
  for select using (auth.uid() = student_user_id);

create policy "enrollments_teacher_manage" on public.student_enrollments
  for all using (auth.uid() = teacher_id);
