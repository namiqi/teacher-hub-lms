-- Part 9 — Student portal state (last visit, seen notifications)
-- Run after schema 8.

create table if not exists public.student_portal_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_visit_at timestamptz,
  seen_graded_submission_ids jsonb not null default '[]'::jsonb,
  seen_approved_request_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_portal_state enable row level security;

drop policy if exists "student_portal_state_own" on public.student_portal_state;
create policy "student_portal_state_own" on public.student_portal_state
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
