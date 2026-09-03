-- 1) Drop old student/subscription/messaging world
drop table if exists public.video_comments cascade;
drop table if exists public.reactions cascade;
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.announcements cascade;
drop table if exists public.exam_attempts cascade;
drop table if exists public.subscription_codes cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.exams cascade;
drop table if exists public.lesson_files cascade;
drop table if exists public.videos cascade;
drop table if exists public.lessons cascade;
drop table if exists public.units cascade;
drop table if exists public.courses cascade;
drop table if exists public.teacher_grades cascade;

drop function if exists public.can_view_course(uuid) cascade;
drop function if exists public.can_view_lesson(uuid) cascade;
drop function if exists public.is_enrolled(uuid) cascade;
drop function if exists public.my_grade() cascade;
drop function if exists public.platform_teacher() cascade;
drop function if exists public.redeem_code(text) cascade;

-- 2) Admin check helper (the single owner account holds the 'teacher' role)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'teacher')
$$;

-- 3) Teachers
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  bio text not null default '',
  photo_url text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.teachers to anon;
grant select, insert, update, delete on public.teachers to authenticated;
grant all on public.teachers to service_role;
alter table public.teachers enable row level security;
create policy teachers_public_read on public.teachers for select to anon, authenticated using (is_published or public.is_admin());
create policy teachers_admin_write on public.teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4) Teacher grades (which of the 3 grades a teacher covers)
create table public.teacher_grades (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  grade text not null check (grade in ('sec1','sec2','sec3')),
  created_at timestamptz not null default now(),
  unique (teacher_id, grade)
);
grant select on public.teacher_grades to anon;
grant select, insert, update, delete on public.teacher_grades to authenticated;
grant all on public.teacher_grades to service_role;
alter table public.teacher_grades enable row level security;
create policy teacher_grades_public_read on public.teacher_grades for select to anon, authenticated using (true);
create policy teacher_grades_admin_write on public.teacher_grades for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5) Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  grade text not null check (grade in ('sec1','sec2','sec3')),
  title text not null,
  description text not null default '',
  cover_url text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_teacher_grade_idx on public.courses (teacher_id, grade);
grant select on public.courses to anon;
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy courses_public_read on public.courses for select to anon, authenticated using (is_published or public.is_admin());
create policy courses_admin_write on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6) Units
create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index units_course_idx on public.units (course_id);
grant select on public.units to anon;
grant select, insert, update, delete on public.units to authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;
create policy units_public_read on public.units for select to anon, authenticated using (true);
create policy units_admin_write on public.units for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 7) Lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index lessons_unit_idx on public.lessons (unit_id);
grant select on public.lessons to anon;
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy lessons_public_read on public.lessons for select to anon, authenticated using (true);
create policy lessons_admin_write on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8) Videos
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  url text not null,
  duration_sec integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index videos_lesson_idx on public.videos (lesson_id);
grant select on public.videos to anon;
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;
create policy videos_public_read on public.videos for select to anon, authenticated using (true);
create policy videos_admin_write on public.videos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 9) Lesson files (uploaded file url or external link)
create table public.lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  name text not null,
  url text not null,
  storage_path text,
  size integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index lesson_files_lesson_idx on public.lesson_files (lesson_id);
grant select on public.lesson_files to anon;
grant select, insert, update, delete on public.lesson_files to authenticated;
grant all on public.lesson_files to service_role;
alter table public.lesson_files enable row level security;
create policy lesson_files_public_read on public.lesson_files for select to anon, authenticated using (true);
create policy lesson_files_admin_write on public.lesson_files for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 10) Exams (questions + answers stored as jsonb; no student data)
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  duration_min integer not null default 30,
  passing_pct integer not null default 60,
  shuffle_questions boolean not null default false,
  questions jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exams_lesson_idx on public.exams (lesson_id);
grant select on public.exams to anon;
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;
create policy exams_public_read on public.exams for select to anon, authenticated using (is_published or public.is_admin());
create policy exams_admin_write on public.exams for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 11) updated_at triggers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

create trigger teachers_touch before update on public.teachers for each row execute function public.touch_updated_at();
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();
create trigger exams_touch before update on public.exams for each row execute function public.touch_updated_at();
