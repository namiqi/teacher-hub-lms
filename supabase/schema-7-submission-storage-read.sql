-- Part 7 — Fix teacher (and student) read access to submission files in Storage
-- Run if teachers see submissions but cannot open/download attached files.
-- Uses split_part (more reliable than storage.foldername in some projects).

drop policy if exists "submission_storage_student_select" on storage.objects;
drop policy if exists "submission_storage_teacher_select" on storage.objects;

create policy "submission_storage_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or split_part(name, '/', 4) = auth.uid()::text
    )
  );
