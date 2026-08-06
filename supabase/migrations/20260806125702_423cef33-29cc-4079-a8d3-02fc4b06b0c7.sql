-- 1) storage policies
create policy "covers_read_authenticated" on storage.objects for select to authenticated
  using (bucket_id in ('course-covers','lesson-files'));
create policy "covers_insert_teacher" on storage.objects for insert to authenticated
  with check (bucket_id in ('course-covers','lesson-files') and public.is_teacher());
create policy "covers_update_teacher" on storage.objects for update to authenticated
  using (bucket_id in ('course-covers','lesson-files') and public.is_teacher())
  with check (bucket_id in ('course-covers','lesson-files') and public.is_teacher());
create policy "covers_delete_teacher" on storage.objects for delete to authenticated
  using (bucket_id in ('course-covers','lesson-files') and public.is_teacher());

-- 2) profiles: email + unique student code
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists student_code text;
create sequence if not exists public.student_code_seq start 1;
create unique index if not exists profiles_student_code_key on public.profiles (student_code);

-- backfill
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

update public.profiles
set student_code = 'ST' || lpad(nextval('public.student_code_seq')::text, 5, '0')
where student_code is null;

-- 3) trigger update
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _role public.app_role;
begin
  insert into public.profiles (id, full_name, phone, grade, email, student_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade',
    new.email,
    'ST' || lpad(nextval('public.student_code_seq')::text, 5, '0')
  )
  on conflict (id) do nothing;

  if exists (select 1 from public.user_roles where role = 'teacher') then
    _role := 'student';
  else
    _role := 'teacher';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, _role)
  on conflict (user_id, role) do nothing;
  return new;
end $function$;

-- 4) teacher lookup for students
create or replace function public.platform_teacher()
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, coalesce(p.full_name, 'الأستاذ')
  from public.user_roles r
  join public.profiles p on p.id = r.user_id
  where r.role = 'teacher'
  order by p.created_at asc
  limit 1
$$;

grant execute on function public.platform_teacher() to authenticated;