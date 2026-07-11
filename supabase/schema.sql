-- Minus Style Affiliate Dashboard - Supabase backend
-- Run this once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'manager', 'employee')),
  employee_id text,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists employee_id text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'manager', 'employee'));
  end if;
end $$;

create table if not exists public.employees (
  id text primary key,
  name text not null,
  salary numeric not null default 0,
  active boolean not null default true,
  shift text default 'morning',
  join_date date,
  phone text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees add column if not exists name text;
alter table public.employees add column if not exists salary numeric not null default 0;
alter table public.employees add column if not exists active boolean not null default true;
alter table public.employees add column if not exists shift text default 'morning';
alter table public.employees add column if not exists join_date date;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists emergency_contact text;
alter table public.employees add column if not exists created_at timestamptz not null default now();
alter table public.employees add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_employee_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_employee_id_fkey
      foreign key (employee_id) references public.employees(id) on delete set null;
  end if;
end $$;

create table if not exists public.daily_entries (
  id text primary key,
  entry_date date not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null default 0,
  note text,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixed_expenses (
  id text primary key,
  name text not null,
  category text not null,
  amount numeric not null default 0,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  work_date date not null,
  status text not null default 'present',
  shift text default 'morning',
  check_in text,
  check_out text,
  break_minutes numeric not null default 0,
  note text,
  marked_by text,
  source text default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.break_records (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  break_date date not null,
  type text not null,
  note text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  days numeric not null default 0,
  reason text,
  status text not null default 'pending',
  breakdown jsonb not null default '[]'::jsonb,
  requested_by text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advance_requests (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  salary_month text not null,
  amount numeric not null default 0,
  reason text,
  status text not null default 'pending',
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id text primary key,
  action text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  requested_by text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friday_work_requests (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  work_date date not null,
  request_type text not null check (request_type in ('extra_salary', 'compensatory_leave')),
  reason text,
  note text,
  status text not null default 'pending',
  approved_by text,
  attendance_id text,
  salary_added boolean not null default false,
  compensatory_leave_added boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salary_adjustments (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  salary_month text not null,
  type text not null,
  label text,
  amount numeric not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  salary_month text not null,
  base_salary numeric not null default 0,
  gross_salary numeric not null default 0,
  deduction numeric not null default 0,
  advance numeric not null default 0,
  weekend_pay numeric not null default 0,
  payable numeric not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id text primary key default 'main',
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_backups (
  id uuid primary key default gen_random_uuid(),
  label text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, display_name, active)
  values (
    new.id,
    new.email,
    case
      when lower(new.email) = 'asifat553@gmail.com' then 'admin'
      else 'employee'
    end,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    true
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.current_profile()
returns public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select * from public.profiles where id = auth.uid() and active = true limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and active = true limit 1;
$$;

create or replace function public.current_employee_id()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select employee_id from public.profiles where id = auth.uid() and active = true limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'manager';
$$;

create or replace function public.can_read_employee(target_employee_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or public.is_manager()
    or public.current_employee_id() = target_employee_id;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','employees','daily_entries','fixed_expenses','attendance_records',
    'break_records','leave_requests','advance_requests','approvals',
    'friday_work_requests','salary_adjustments','payroll_runs','app_state','app_backups'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (id = auth.uid());
drop policy if exists profiles_owner_bootstrap on public.profiles;
create policy profiles_owner_bootstrap on public.profiles for insert
  with check (
    id = auth.uid()
    and lower(email) = 'asifat553@gmail.com'
    and role = 'admin'
  );

drop policy if exists employees_admin_all on public.employees;
create policy employees_admin_all on public.employees for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists employees_manager_read on public.employees;
create policy employees_manager_read on public.employees for select using (public.is_manager());
drop policy if exists employees_self_read on public.employees;
create policy employees_self_read on public.employees for select using (id = public.current_employee_id());

drop policy if exists daily_entries_admin_manager on public.daily_entries;
create policy daily_entries_admin_manager on public.daily_entries for all using (public.is_admin() or public.is_manager()) with check (public.is_admin() or public.is_manager());

drop policy if exists fixed_expenses_admin_manager on public.fixed_expenses;
create policy fixed_expenses_admin_manager on public.fixed_expenses for all using (public.is_admin() or public.is_manager()) with check (public.is_admin() or public.is_manager());

drop policy if exists attendance_role_access on public.attendance_records;
create policy attendance_role_access on public.attendance_records for all
  using (public.can_read_employee(employee_id))
  with check (public.can_read_employee(employee_id));

drop policy if exists break_role_access on public.break_records;
create policy break_role_access on public.break_records for all
  using (public.can_read_employee(employee_id))
  with check (public.can_read_employee(employee_id));

drop policy if exists leave_role_access on public.leave_requests;
create policy leave_role_access on public.leave_requests for all
  using (public.can_read_employee(employee_id))
  with check (public.can_read_employee(employee_id));

drop policy if exists advance_role_access on public.advance_requests;
create policy advance_role_access on public.advance_requests for all
  using (public.can_read_employee(employee_id))
  with check (public.can_read_employee(employee_id));

drop policy if exists friday_role_access on public.friday_work_requests;
create policy friday_role_access on public.friday_work_requests for all
  using (public.can_read_employee(employee_id))
  with check (public.can_read_employee(employee_id));

drop policy if exists adjustment_role_access on public.salary_adjustments;
create policy adjustment_role_access on public.salary_adjustments for all
  using (public.can_read_employee(employee_id))
  with check (public.is_admin() or public.is_manager());

drop policy if exists payroll_role_read on public.payroll_runs;
create policy payroll_role_read on public.payroll_runs for select using (public.can_read_employee(employee_id));
drop policy if exists payroll_admin_manager_write on public.payroll_runs;
create policy payroll_admin_manager_write on public.payroll_runs for all using (public.is_admin() or public.is_manager()) with check (public.is_admin() or public.is_manager());

drop policy if exists approvals_role_access on public.approvals;
create policy approvals_role_access on public.approvals for all
  using (
    public.is_admin()
    or public.is_manager()
    or requested_by = auth.email()
    or (payload ? 'employeeId' and payload->>'employeeId' = public.current_employee_id())
  )
  with check (
    public.is_admin()
    or public.is_manager()
    or (payload ? 'employeeId' and payload->>'employeeId' = public.current_employee_id())
  );

drop policy if exists app_state_admin_all on public.app_state;
create policy app_state_admin_all on public.app_state for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists app_backups_admin_all on public.app_backups;
create policy app_backups_admin_all on public.app_backups for all using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.employees,
  public.daily_entries,
  public.fixed_expenses,
  public.attendance_records,
  public.break_records,
  public.leave_requests,
  public.advance_requests,
  public.approvals,
  public.friday_work_requests,
  public.salary_adjustments,
  public.payroll_runs,
  public.app_state,
  public.app_backups
to authenticated;

grant execute on all functions in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant execute on functions to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','employees','daily_entries','fixed_expenses','attendance_records',
    'break_records','leave_requests','advance_requests','approvals',
    'friday_work_requests','salary_adjustments','payroll_runs'
  ]
  loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
