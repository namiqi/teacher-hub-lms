-- Part 8 — Teacher post attachments (assignments & announcements)
-- Run after schema-7.

insert into storage.buckets (id, name, public, file_size_limit)
values ('post-attachments', 'post-attachments', false, 10485760)
on conflict (id) do update set file_size_limit = 10485760;

drop policy if exists "post_attachment_storage_read" on storage.objects;
create policy "post_attachment_storage_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-attachments'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1 from public.student_enrollments e
        where e.student_user_id = auth.uid()
          and e.teacher_id::text = split_part(name, '/', 1)
          and e.class_key = split_part(name, '/', 2)
      )
    )
  );

drop policy if exists "post_attachment_storage_teacher_write" on storage.objects;
create policy "post_attachment_storage_teacher_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'post-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'post-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );
