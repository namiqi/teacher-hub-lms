-- Part 6 — Assignment submissions + file storage
-- Run after schema-5. Create bucket in Dashboard if insert below fails.

insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-submissions', 'assignment-submissions', false, 10485760)
on conflict (id) do update set file_size_limit = 10485760;

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id text not null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_key text not null,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  student_id integer not null,
  note text,
  attempt_number integer not null default 1 check (attempt_number >= 1),
  is_late boolean not null default false,
  max_points integer not null default 10,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  score numeric(8, 2),
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (assignment_id, student_user_id)
);

create index if not exists assignment_submissions_teacher_assignment_idx
  on public.assignment_submissions (teacher_id, assignment_id);

create index if not exists assignment_submissions_student_idx
  on public.assignment_submissions (student_user_id);

create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.assignment_submissions (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists submission_files_submission_idx
  on public.submission_files (submission_id);

alter table public.assignment_submissions enable row level security;
alter table public.submission_files enable row level security;

drop policy if exists "assignment_submissions_student_select" on public.assignment_submissions;
create policy "assignment_submissions_student_select" on public.assignment_submissions
  for select using (auth.uid() = student_user_id);

drop policy if exists "assignment_submissions_student_insert" on public.assignment_submissions;
create policy "assignment_submissions_student_insert" on public.assignment_submissions
  for insert with check (auth.uid() = student_user_id);

drop policy if exists "assignment_submissions_student_update" on public.assignment_submissions;
create policy "assignment_submissions_student_update" on public.assignment_submissions
  for update using (auth.uid() = student_user_id);

drop policy if exists "assignment_submissions_teacher_all" on public.assignment_submissions;
create policy "assignment_submissions_teacher_all" on public.assignment_submissions
  for all using (auth.uid() = teacher_id);

drop policy if exists "submission_files_student_select" on public.submission_files;
create policy "submission_files_student_select" on public.submission_files
  for select using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.student_user_id = auth.uid()
    )
  );

drop policy if exists "submission_files_teacher_select" on public.submission_files;
create policy "submission_files_teacher_select" on public.submission_files
  for select using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.teacher_id = auth.uid()
    )
  );

drop policy if exists "submission_files_student_insert" on public.submission_files;
create policy "submission_files_student_insert" on public.submission_files
  for insert with check (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.student_user_id = auth.uid()
    )
  );

drop policy if exists "submission_files_student_delete" on public.submission_files;
create policy "submission_files_student_delete" on public.submission_files
  for delete using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.student_user_id = auth.uid()
    )
  );

drop policy if exists "submission_files_teacher_delete" on public.submission_files;
create policy "submission_files_teacher_delete" on public.submission_files
  for delete using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.teacher_id = auth.uid()
    )
  );

-- Storage: path = teacher_id / class_key / assignment_id / student_user_id / filename
drop policy if exists "submission_storage_student_insert" on storage.objects;
create policy "submission_storage_student_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[4] = auth.uid()::text
  );

drop policy if exists "submission_storage_student_select" on storage.objects;
create policy "submission_storage_student_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (
      (storage.foldername(name))[4] = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "submission_storage_student_delete" on storage.objects;
create policy "submission_storage_student_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[4] = auth.uid()::text
  );

drop policy if exists "submission_storage_teacher_select" on storage.objects;
create policy "submission_storage_teacher_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "submission_storage_teacher_delete" on storage.objects;
create policy "submission_storage_teacher_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
