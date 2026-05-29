-- Part 2 of 3 — Sign-up trigger. Run after schema-1-tables.sql.

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
