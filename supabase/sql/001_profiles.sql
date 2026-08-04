-- شغّل الملف ده مرة واحدة في Supabase → SQL Editor

-- 1) الأدوار
do $$ begin
  create type public.app_role as enum ('teacher', 'student', 'assistant');
exception when duplicate_object then null; end $$;

-- 2) جدول البروفايل
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  grade text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- 3) جدول الأدوار (منفصل عن البروفايل لأسباب أمنية)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- 4) إنشاء البروفايل + الدور تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, grade)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'student')::public.app_role
  )
  on conflict (user_id, role) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) للحسابات اللي اتعملت قبل تشغيل السكربت
insert into public.profiles (id, full_name, phone, grade)
select u.id,
       u.raw_user_meta_data ->> 'full_name',
       u.raw_user_meta_data ->> 'phone',
       u.raw_user_meta_data ->> 'grade'
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'role', ''), 'student')::public.app_role
from auth.users u
on conflict (user_id, role) do nothing;