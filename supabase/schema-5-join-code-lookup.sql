-- Part 5 — Let students resolve a join code before they are enrolled.
-- Without this, RLS blocks reading teacher_workspaces until after approval.

create or replace function public.lookup_class_by_join_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text;
  tid uuid;
  ck text;
  ws jsonb;
  cls jsonb;
begin
  norm := upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'));
  if norm = '' then
    return null;
  end if;

  select cjc.teacher_id, cjc.class_key
  into tid, ck
  from public.class_join_codes cjc
  where cjc.join_code = norm
  limit 1;

  if tid is null then
    return null;
  end if;

  select tw.workspace into ws
  from public.teacher_workspaces tw
  where tw.teacher_id = tid;

  if ws is null then
    return null;
  end if;

  select elem into cls
  from jsonb_array_elements(coalesce(ws->'classes', '[]'::jsonb)) as elem
  where elem->>'classKey' = ck
    and coalesce(elem->>'status', 'active') = 'active'
  limit 1;

  if cls is null then
    return null;
  end if;

  return jsonb_build_object(
    'teacher_id', tid,
    'class_key', ck,
    'class', cls
  );
end;
$$;

revoke all on function public.lookup_class_by_join_code(text) from public;
grant execute on function public.lookup_class_by_join_code(text) to authenticated;
