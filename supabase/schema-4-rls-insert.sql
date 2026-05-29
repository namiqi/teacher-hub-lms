-- Part 4 — Allow signed-in users to create their own profile rows (signup backfill).
-- Run in Supabase SQL Editor if student sign-up shows "Student profile not found".

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "student_profiles_insert_own" on public.student_profiles;
create policy "student_profiles_insert_own" on public.student_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "student_profiles_update_own" on public.student_profiles;
create policy "student_profiles_update_own" on public.student_profiles
  for update using (auth.uid() = user_id);
