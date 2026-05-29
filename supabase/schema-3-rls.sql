-- Part 3 of 3 — Row Level Security. Run after schema-2-trigger.sql.

alter table public.profiles enable row level security;
alter table public.teacher_workspaces enable row level security;
alter table public.class_join_codes enable row level security;
alter table public.join_requests enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_enrollments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "workspace_teacher_all" on public.teacher_workspaces;
create policy "workspace_teacher_all" on public.teacher_workspaces
  for all using (auth.uid() = teacher_id);

drop policy if exists "workspace_student_read_enrolled" on public.teacher_workspaces;
create policy "workspace_student_read_enrolled" on public.teacher_workspaces
  for select using (
    exists (
      select 1 from public.student_enrollments se
      where se.student_user_id = auth.uid()
        and se.teacher_id = teacher_workspaces.teacher_id
    )
  );

drop policy if exists "join_codes_select_authenticated" on public.class_join_codes;
create policy "join_codes_select_authenticated" on public.class_join_codes
  for select to authenticated using (true);

drop policy if exists "join_codes_teacher_manage" on public.class_join_codes;
create policy "join_codes_teacher_manage" on public.class_join_codes
  for all using (auth.uid() = teacher_id);

drop policy if exists "join_requests_teacher_select" on public.join_requests;
create policy "join_requests_teacher_select" on public.join_requests
  for select using (auth.uid() = teacher_id);

drop policy if exists "join_requests_teacher_update" on public.join_requests;
create policy "join_requests_teacher_update" on public.join_requests
  for update using (auth.uid() = teacher_id);

drop policy if exists "join_requests_student_select" on public.join_requests;
create policy "join_requests_student_select" on public.join_requests
  for select using (auth.uid() = student_user_id);

drop policy if exists "join_requests_student_insert" on public.join_requests;
create policy "join_requests_student_insert" on public.join_requests
  for insert with check (auth.uid() = student_user_id);

drop policy if exists "student_profiles_own" on public.student_profiles;
create policy "student_profiles_own" on public.student_profiles
  for all using (auth.uid() = user_id);

drop policy if exists "enrollments_student_select" on public.student_enrollments;
create policy "enrollments_student_select" on public.student_enrollments
  for select using (auth.uid() = student_user_id);

drop policy if exists "enrollments_teacher_manage" on public.student_enrollments;
create policy "enrollments_teacher_manage" on public.student_enrollments
  for all using (auth.uid() = teacher_id);
