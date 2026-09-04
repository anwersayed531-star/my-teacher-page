-- storage read/write policies for the three content buckets
drop policy if exists "school_public_read" on storage.objects;
drop policy if exists "school_admin_write" on storage.objects;
drop policy if exists "school_admin_update" on storage.objects;
drop policy if exists "school_admin_delete" on storage.objects;

create policy "school_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('teacher-photos','course-covers','lesson-files'));

create policy "school_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('teacher-photos','course-covers','lesson-files') and public.is_admin());

create policy "school_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('teacher-photos','course-covers','lesson-files') and public.is_admin())
  with check (bucket_id in ('teacher-photos','course-covers','lesson-files') and public.is_admin());

create policy "school_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('teacher-photos','course-covers','lesson-files') and public.is_admin());

-- cleanup: unused helper + restrict trigger function execution
drop function if exists public.is_teacher() cascade;
revoke all on function public.handle_new_user() from anon, authenticated;
