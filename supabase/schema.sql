create type app_role as enum ('tutor', 'admin');
create type learning_status as enum (
  'not_started',
  'in_progress',
  'registered',
  'attended',
  'partially_attended',
  'no_show',
  'excused',
  'passed',
  'needs_revision'
);
create type readiness_status as enum ('not_started', 'in_progress', 'ready', 'needs_revision');
create type path_step_type as enum ('module', 'webinar');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role app_role not null default 'tutor',
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'tutor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create table training_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  body text not null default '',
  estimated_minutes integer not null default 15,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  passing_score integer not null default 80,
  created_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  prompt text not null,
  position integer not null default 1
);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null default 1
);

create table webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  trainer text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null,
  capacity integer not null,
  meeting_link text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint webinars_capacity_positive check (capacity > 0)
);

create table training_path_steps (
  id uuid primary key default gen_random_uuid(),
  training_path_id uuid not null references training_paths(id) on delete cascade,
  step_type path_step_type not null,
  module_id uuid references modules(id) on delete cascade,
  webinar_id uuid references webinars(id) on delete cascade,
  is_required boolean not null default true,
  position integer not null default 1,
  constraint one_step_target check (
    (step_type = 'module' and module_id is not null and webinar_id is null) or
    (step_type = 'webinar' and webinar_id is not null and module_id is null)
  )
);

create table path_assignments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  training_path_id uuid not null references training_paths(id) on delete cascade,
  readiness_status readiness_status not null default 'not_started',
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  unique (tutor_id, training_path_id)
);

create table module_progress (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  status learning_status not null default 'not_started',
  completed_at timestamptz,
  unique (tutor_id, module_id),
  constraint module_progress_status check (status in ('not_started', 'in_progress', 'passed', 'needs_revision'))
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score integer not null,
  status learning_status not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  constraint quiz_attempt_status check (status in ('passed', 'needs_revision'))
);

create table webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  webinar_id uuid not null references webinars(id) on delete cascade,
  status learning_status not null default 'registered',
  registered_at timestamptz not null default now(),
  attendance_marked_by uuid references profiles(id),
  attendance_marked_at timestamptz,
  unique (tutor_id, webinar_id),
  constraint webinar_registration_status check (
    status in ('registered', 'attended', 'partially_attended', 'no_show', 'excused')
  )
);

create function enforce_webinar_capacity()
returns trigger
language plpgsql
as $$
declare
  registered_count integer;
  webinar_capacity integer;
begin
  select capacity into webinar_capacity
  from webinars
  where id = new.webinar_id;

  select count(*) into registered_count
  from webinar_registrations
  where webinar_id = new.webinar_id;

  if registered_count >= webinar_capacity then
    raise exception 'webinar capacity reached';
  end if;

  return new;
end;
$$;

create trigger enforce_webinar_capacity_before_insert
before insert on webinar_registrations
for each row execute function enforce_webinar_capacity();

alter table profiles enable row level security;
alter table training_paths enable row level security;
alter table modules enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table webinars enable row level security;
alter table training_path_steps enable row level security;
alter table path_assignments enable row level security;
alter table module_progress enable row level security;
alter table quiz_attempts enable row level security;
alter table webinar_registrations enable row level security;

create function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create policy "Users can read own profile"
on profiles for select
using (id = auth.uid() or is_admin());

create policy "Admins manage profiles"
on profiles for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read training content"
on training_paths for select
to authenticated
using (true);

create policy "Admins manage training paths"
on training_paths for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read modules"
on modules for select
to authenticated
using (true);

create policy "Admins manage modules"
on modules for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read quizzes"
on quizzes for select
to authenticated
using (true);

create policy "Admins manage quizzes"
on quizzes for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read quiz questions"
on quiz_questions for select
to authenticated
using (true);

create policy "Admins manage quiz questions"
on quiz_questions for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read quiz options"
on quiz_options for select
to authenticated
using (true);

create policy "Admins manage quiz options"
on quiz_options for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read webinars"
on webinars for select
to authenticated
using (true);

create policy "Admins manage webinars"
on webinars for all
using (is_admin())
with check (is_admin());

create policy "Everyone authenticated can read path steps"
on training_path_steps for select
to authenticated
using (true);

create policy "Admins manage path steps"
on training_path_steps for all
using (is_admin())
with check (is_admin());

create policy "Tutors read own assignments"
on path_assignments for select
using (tutor_id = auth.uid() or is_admin());

create policy "Admins manage assignments"
on path_assignments for all
using (is_admin())
with check (is_admin());

create policy "Tutors manage own module progress"
on module_progress for all
using (tutor_id = auth.uid() or is_admin())
with check (tutor_id = auth.uid() or is_admin());

create policy "Tutors create own quiz attempts"
on quiz_attempts for insert
with check (tutor_id = auth.uid());

create policy "Tutors read own quiz attempts"
on quiz_attempts for select
using (tutor_id = auth.uid() or is_admin());

create policy "Tutors register and read own webinars"
on webinar_registrations for select
using (tutor_id = auth.uid() or is_admin());

create policy "Tutors register for webinars"
on webinar_registrations for insert
with check (tutor_id = auth.uid());

create policy "Admins manage webinar attendance"
on webinar_registrations for update
using (is_admin())
with check (is_admin());
