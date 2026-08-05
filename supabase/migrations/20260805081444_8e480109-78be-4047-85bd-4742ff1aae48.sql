-- ===== roles =====
create type public.app_role as enum ('teacher','student','assistant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  grade text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('teacher','assistant'))
$$;

create or replace function public.my_grade()
returns text language sql stable security definer set search_path = public as $$
  select grade from public.profiles where id = auth.uid()
$$;

create policy "profiles_select_own_or_teacher" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher());
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "user_roles_select_own_or_teacher" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_teacher());

-- first signup becomes the teacher, everyone else a student
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _role public.app_role;
begin
  insert into public.profiles (id, full_name, phone, grade)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade'
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
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== teacher grades =====
create table public.teacher_grades (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  grade text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (teacher_id, grade)
);
grant select on public.teacher_grades to anon;
grant select, insert, update, delete on public.teacher_grades to authenticated;
grant all on public.teacher_grades to service_role;
alter table public.teacher_grades enable row level security;
create policy "teacher_grades_public_read" on public.teacher_grades for select to anon, authenticated using (true);
create policy "teacher_grades_teacher_write" on public.teacher_grades for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

-- ===== course tree =====
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  cover_url text default '',
  is_paid boolean not null default false,
  price integer,
  grade_level text not null default '',
  students_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0
);
grant select, insert, update, delete on public.units to authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0
);
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  url text not null,
  duration_sec integer,
  sort_order integer not null default 0
);
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

create table public.lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  name text not null,
  kind text default 'pdf',
  size integer,
  storage_path text,
  public_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lesson_files to authenticated;
grant all on public.lesson_files to service_role;
alter table public.lesson_files enable row level security;

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  duration_min integer not null default 30,
  passing_pct integer not null default 60,
  shuffle_questions boolean not null default false,
  shuffle_answers boolean not null default false,
  questions jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  score_pct integer,
  earned integer,
  total integer,
  time_sec integer,
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
grant select, insert on public.exam_attempts to authenticated;
grant all on public.exam_attempts to service_role;
alter table public.exam_attempts enable row level security;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'direct',
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);
grant select, insert, delete on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
alter table public.enrollments enable row level security;

create or replace function public.is_enrolled(_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments where course_id = _course_id and student_id = auth.uid())
$$;

create or replace function public.can_view_course(_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.courses c
    where c.id = _course_id
      and (
        public.is_teacher()
        or (c.is_published and (c.grade_level = '' or c.grade_level = public.my_grade()))
      )
  )
$$;

create or replace function public.can_view_lesson(_lesson_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lessons l
    join public.units u on u.id = l.unit_id
    where l.id = _lesson_id and public.can_view_course(u.course_id)
  )
$$;

create policy "courses_select" on public.courses for select to authenticated
  using (public.is_teacher() or (is_published and (grade_level = '' or grade_level = public.my_grade())));
create policy "courses_write" on public.courses for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "units_select" on public.units for select to authenticated
  using (public.can_view_course(course_id));
create policy "units_write" on public.units for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "lessons_select" on public.lessons for select to authenticated
  using (public.can_view_lesson(id));
create policy "lessons_write" on public.lessons for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "videos_select" on public.videos for select to authenticated
  using (public.can_view_lesson(lesson_id));
create policy "videos_write" on public.videos for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "lesson_files_select" on public.lesson_files for select to authenticated
  using (public.can_view_lesson(lesson_id));
create policy "lesson_files_write" on public.lesson_files for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "exams_select" on public.exams for select to authenticated
  using (public.can_view_lesson(lesson_id));
create policy "exams_write" on public.exams for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "exam_attempts_select" on public.exam_attempts for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());
create policy "exam_attempts_insert" on public.exam_attempts for insert to authenticated
  with check (student_id = auth.uid());

create policy "enrollments_select" on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());
create policy "enrollments_insert" on public.enrollments for insert to authenticated
  with check (student_id = auth.uid() or public.is_teacher());
create policy "enrollments_delete" on public.enrollments for delete to authenticated
  using (public.is_teacher());

-- ===== subscription codes =====
create table public.subscription_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  duration_days integer not null default 30,
  expires_at timestamptz,
  used boolean not null default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.subscription_codes to authenticated;
grant all on public.subscription_codes to service_role;
alter table public.subscription_codes enable row level security;
create policy "codes_select_teacher" on public.subscription_codes for select to authenticated
  using (public.is_teacher() or used_by = auth.uid());
create policy "codes_write_teacher" on public.subscription_codes for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create or replace function public.redeem_code(_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _row public.subscription_codes;
begin
  select * into _row from public.subscription_codes where code = _code for update;
  if _row.id is null then raise exception 'كود غير موجود'; end if;
  if _row.disabled then raise exception 'الكود معطّل'; end if;
  if _row.used then raise exception 'الكود مستخدم بالفعل'; end if;
  if _row.expires_at is not null and _row.expires_at < now() then raise exception 'انتهت صلاحية الكود'; end if;

  update public.subscription_codes
    set used = true, used_by = auth.uid(), used_at = now()
    where id = _row.id;

  insert into public.enrollments (course_id, student_id, source)
  values (_row.course_id, auth.uid(), 'code')
  on conflict (course_id, student_id) do nothing;

  update public.courses set students_count = students_count + 1 where id = _row.course_id;
  return _row.course_id;
end $$;
revoke all on function public.redeem_code(text) from public;
grant execute on function public.redeem_code(text) to authenticated;

-- ===== announcements / messages / notifications =====
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  grade text,
  kind text not null default 'info',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "announcements_select" on public.announcements for select to authenticated
  using (public.is_teacher() or grade is null or grade = public.my_grade());
create policy "announcements_write" on public.announcements for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  grade text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "messages_select" on public.messages for select to authenticated
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_teacher()
    or (recipient_id is null and (grade is null or grade = public.my_grade()))
  );
create policy "messages_insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid());
create policy "messages_update_own" on public.messages for update to authenticated
  using (recipient_id = auth.uid() or public.is_teacher())
  with check (recipient_id = auth.uid() or public.is_teacher());

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert to authenticated
  with check (public.is_teacher() or user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== comments / reactions =====
create table public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  timestamp_sec integer,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.video_comments to authenticated;
grant all on public.video_comments to service_role;
alter table public.video_comments enable row level security;
create policy "video_comments_select" on public.video_comments for select to authenticated using (true);
create policy "video_comments_insert" on public.video_comments for insert to authenticated
  with check (author_id = auth.uid());
create policy "video_comments_delete" on public.video_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_teacher());

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  unique (target_id, user_id)
);
grant select, insert, update, delete on public.reactions to authenticated;
grant all on public.reactions to service_role;
alter table public.reactions enable row level security;
create policy "reactions_select" on public.reactions for select to authenticated using (true);
create policy "reactions_write_own" on public.reactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());