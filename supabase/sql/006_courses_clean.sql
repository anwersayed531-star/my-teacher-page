-- ✅ الصق الملف ده كله في Supabase SQL Editor واضغط Run (مفيش علامات $ خالص)

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  is_paid boolean default false,
  price integer,
  grade_level text,
  students_count integer default 0,
  is_published boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer default 0
);
grant select, insert, update, delete on public.units to authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  sort_order integer default 0
);
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  url text not null,
  duration_sec integer,
  sort_order integer default 0
);
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

create table if not exists public.lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  name text not null,
  kind text,
  size integer,
  storage_path text,
  public_url text,
  created_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.lesson_files to authenticated;
grant all on public.lesson_files to service_role;
alter table public.lesson_files enable row level security;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  duration_min integer default 30,
  passing_pct integer default 60,
  shuffle_questions boolean default false,
  shuffle_answers boolean default false,
  questions jsonb default '[]'::jsonb,
  is_published boolean default true,
  created_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  score_pct integer,
  earned integer,
  total integer,
  time_sec integer,
  answers jsonb default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
grant select, insert, update, delete on public.exam_attempts to authenticated;
grant all on public.exam_attempts to service_role;
alter table public.exam_attempts enable row level security;

-- دوال مساعدة (بدون علامات دولار)
create or replace function public.is_course_teacher(_course_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.courses where id = _course_id and teacher_id = auth.uid())';

create or replace function public.is_unit_teacher(_unit_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.units u join public.courses c on c.id = u.course_id where u.id = _unit_id and c.teacher_id = auth.uid())';

create or replace function public.is_lesson_teacher(_lesson_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id join public.courses c on c.id = u.course_id where l.id = _lesson_id and c.teacher_id = auth.uid())';

create or replace function public.is_exam_teacher(_exam_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.exams e join public.lessons l on l.id = e.lesson_id join public.units u on u.id = l.unit_id join public.courses c on c.id = u.course_id where e.id = _exam_id and c.teacher_id = auth.uid())';

create or replace function public.can_view_lesson(_lesson_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id join public.courses c on c.id = u.course_id where l.id = _lesson_id and (c.is_published = true or c.teacher_id = auth.uid()))';

-- سياسات courses
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select to authenticated
  using (is_published = true or teacher_id = auth.uid());
drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses for insert to authenticated
  with check (teacher_id = auth.uid());
drop policy if exists "courses_update" on public.courses;
create policy "courses_update" on public.courses for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "courses_delete" on public.courses;
create policy "courses_delete" on public.courses for delete to authenticated
  using (teacher_id = auth.uid());

-- سياسات units
drop policy if exists "units_select" on public.units;
create policy "units_select" on public.units for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published = true or c.teacher_id = auth.uid())));
drop policy if exists "units_insert" on public.units;
create policy "units_insert" on public.units for insert to authenticated
  with check (public.is_course_teacher(course_id));
drop policy if exists "units_update" on public.units;
create policy "units_update" on public.units for update to authenticated
  using (public.is_course_teacher(course_id)) with check (public.is_course_teacher(course_id));
drop policy if exists "units_delete" on public.units;
create policy "units_delete" on public.units for delete to authenticated
  using (public.is_course_teacher(course_id));

-- سياسات lessons
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons for select to authenticated
  using (public.can_view_lesson(id));
drop policy if exists "lessons_insert" on public.lessons;
create policy "lessons_insert" on public.lessons for insert to authenticated
  with check (public.is_unit_teacher(unit_id));
drop policy if exists "lessons_update" on public.lessons;
create policy "lessons_update" on public.lessons for update to authenticated
  using (public.is_unit_teacher(unit_id)) with check (public.is_unit_teacher(unit_id));
drop policy if exists "lessons_delete" on public.lessons;
create policy "lessons_delete" on public.lessons for delete to authenticated
  using (public.is_unit_teacher(unit_id));

-- سياسات videos
drop policy if exists "videos_select" on public.videos;
create policy "videos_select" on public.videos for select to authenticated
  using (public.can_view_lesson(lesson_id));
drop policy if exists "videos_insert" on public.videos;
create policy "videos_insert" on public.videos for insert to authenticated
  with check (public.is_lesson_teacher(lesson_id));
drop policy if exists "videos_update" on public.videos;
create policy "videos_update" on public.videos for update to authenticated
  using (public.is_lesson_teacher(lesson_id)) with check (public.is_lesson_teacher(lesson_id));
drop policy if exists "videos_delete" on public.videos;
create policy "videos_delete" on public.videos for delete to authenticated
  using (public.is_lesson_teacher(lesson_id));

-- سياسات lesson_files
drop policy if exists "lesson_files_select" on public.lesson_files;
create policy "lesson_files_select" on public.lesson_files for select to authenticated
  using (public.can_view_lesson(lesson_id));
drop policy if exists "lesson_files_insert" on public.lesson_files;
create policy "lesson_files_insert" on public.lesson_files for insert to authenticated
  with check (public.is_lesson_teacher(lesson_id));
drop policy if exists "lesson_files_update" on public.lesson_files;
create policy "lesson_files_update" on public.lesson_files for update to authenticated
  using (public.is_lesson_teacher(lesson_id)) with check (public.is_lesson_teacher(lesson_id));
drop policy if exists "lesson_files_delete" on public.lesson_files;
create policy "lesson_files_delete" on public.lesson_files for delete to authenticated
  using (public.is_lesson_teacher(lesson_id));

-- سياسات exams
drop policy if exists "exams_select" on public.exams;
create policy "exams_select" on public.exams for select to authenticated
  using (public.can_view_lesson(lesson_id));
drop policy if exists "exams_insert" on public.exams;
create policy "exams_insert" on public.exams for insert to authenticated
  with check (public.is_lesson_teacher(lesson_id));
drop policy if exists "exams_update" on public.exams;
create policy "exams_update" on public.exams for update to authenticated
  using (public.is_exam_teacher(id)) with check (public.is_exam_teacher(id));
drop policy if exists "exams_delete" on public.exams;
create policy "exams_delete" on public.exams for delete to authenticated
  using (public.is_exam_teacher(id));

-- سياسات exam_attempts
drop policy if exists "exam_attempts_select" on public.exam_attempts;
create policy "exam_attempts_select" on public.exam_attempts for select to authenticated
  using (student_id = auth.uid() or public.is_exam_teacher(exam_id));
drop policy if exists "exam_attempts_insert" on public.exam_attempts;
create policy "exam_attempts_insert" on public.exam_attempts for insert to authenticated
  with check (student_id = auth.uid());

-- سياسات التخزين (المجلدات نفسها متعملة بالفعل)
drop policy if exists "storage_read_all" on storage.objects;
create policy "storage_read_all" on storage.objects for select to authenticated
  using (bucket_id in ('course-covers','lesson-files'));
drop policy if exists "storage_upload_auth" on storage.objects;
create policy "storage_upload_auth" on storage.objects for insert to authenticated
  with check (bucket_id in ('course-covers','lesson-files'));
drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id in ('course-covers','lesson-files') and owner = auth.uid());

notify pgrst, 'reload schema';
