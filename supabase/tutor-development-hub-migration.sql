do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'trainer'
    and enumtypid = 'app_role'::regtype
  ) then
    alter type app_role add value 'trainer';
  end if;
end $$;

do $$
begin
  alter type learning_status add value if not exists 'completed';
  alter type learning_status add value if not exists 'failed';
  alter type learning_status add value if not exists 'needs_review';
  alter type learning_status add value if not exists 'viewed';
  alter type learning_status add value if not exists 'submitted';
end $$;

do $$
begin
  create type tutor_type as enum ('new_tutor', 'existing_tutor');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type profile_status as enum ('active', 'inactive', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type module_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type module_block_type as enum (
    'simple_text',
    'heading',
    'video',
    'image',
    'callout',
    'summary',
    'interactive_image',
    'scenario',
    'good_bad_example',
    'common_mistake',
    'checklist',
    'open_answer',
    'quiz'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type open_answer_status as enum ('not_started', 'draft_saved', 'submitted', 'needs_revision', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

alter table profiles
add column if not exists tutor_type tutor_type,
add column if not exists region text,
add column if not exists language text,
add column if not exists tags text[] not null default '{}',
add column if not exists status profile_status not null default 'active',
add column if not exists updated_at timestamptz not null default now();

alter table modules
add column if not exists description text not null default '',
add column if not exists estimated_duration_minutes integer,
add column if not exists target_audience text,
add column if not exists status module_status not null default 'draft',
add column if not exists updated_at timestamptz not null default now();

update modules
set
  description = case when description = '' then summary else description end,
  estimated_duration_minutes = coalesce(estimated_duration_minutes, estimated_minutes);

create table if not exists tutor_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status profile_status not null default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tutor_group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tutor_groups(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete cascade,
  added_by uuid references profiles(id),
  added_at timestamptz not null default now(),
  unique (group_id, tutor_id)
);

create table if not exists module_blocks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  block_type module_block_type not null,
  order_index integer not null default 1,
  title text,
  content_json jsonb not null default '{}'::jsonb,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists module_blocks_order_idx
on module_blocks(module_id, order_index);

create table if not exists module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete cascade,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  due_date date,
  status learning_status not null default 'not_started',
  progress_percent integer not null default 0,
  score_percent integer,
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, tutor_id)
);

create table if not exists block_progress (
  id uuid primary key default gen_random_uuid(),
  module_assignment_id uuid not null references module_assignments(id) on delete cascade,
  module_block_id uuid not null references module_blocks(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete cascade,
  status learning_status not null default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_assignment_id, module_block_id)
);

create table if not exists open_answer_submissions (
  id uuid primary key default gen_random_uuid(),
  module_assignment_id uuid not null references module_assignments(id) on delete cascade,
  module_block_id uuid not null references module_blocks(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete cascade,
  answer_text text not null default '',
  status open_answer_status not null default 'not_started',
  trainer_feedback text,
  reviewed_by uuid references profiles(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quiz_attempts
add column if not exists module_assignment_id uuid references module_assignments(id) on delete cascade,
add column if not exists module_block_id uuid references module_blocks(id) on delete cascade,
add column if not exists attempt_number integer not null default 1,
add column if not exists score_percent integer,
add column if not exists passed boolean,
add column if not exists answers_json jsonb not null default '{}'::jsonb,
add column if not exists created_at timestamptz not null default now();

update quiz_attempts
set
  score_percent = coalesce(score_percent, score),
  passed = coalesce(passed, status = 'passed'),
  answers_json = case when answers_json = '{}'::jsonb then answers else answers_json end;

alter table tutor_groups enable row level security;
alter table tutor_group_memberships enable row level security;
alter table module_blocks enable row level security;
alter table module_assignments enable row level security;
alter table block_progress enable row level security;
alter table open_answer_submissions enable row level security;

drop policy if exists "Everyone authenticated can read groups" on tutor_groups;
create policy "Everyone authenticated can read groups"
on tutor_groups for select
to authenticated
using (true);

drop policy if exists "Admins manage groups" on tutor_groups;
create policy "Admins manage groups"
on tutor_groups for all
using (is_admin())
with check (is_admin());

drop policy if exists "Everyone authenticated can read group memberships" on tutor_group_memberships;
create policy "Everyone authenticated can read group memberships"
on tutor_group_memberships for select
to authenticated
using (true);

drop policy if exists "Admins manage group memberships" on tutor_group_memberships;
create policy "Admins manage group memberships"
on tutor_group_memberships for all
using (is_admin())
with check (is_admin());

drop policy if exists "Everyone authenticated can read module blocks" on module_blocks;
create policy "Everyone authenticated can read module blocks"
on module_blocks for select
to authenticated
using (true);

drop policy if exists "Admins manage module blocks" on module_blocks;
create policy "Admins manage module blocks"
on module_blocks for all
using (is_admin())
with check (is_admin());

drop policy if exists "Tutors read own module assignments" on module_assignments;
create policy "Tutors read own module assignments"
on module_assignments for select
using (tutor_id = auth.uid() or is_admin());

drop policy if exists "Admins manage module assignments" on module_assignments;
create policy "Admins manage module assignments"
on module_assignments for all
using (is_admin())
with check (is_admin());

drop policy if exists "Tutors manage own block progress" on block_progress;
create policy "Tutors manage own block progress"
on block_progress for all
using (tutor_id = auth.uid() or is_admin())
with check (tutor_id = auth.uid() or is_admin());

drop policy if exists "Tutors manage own open answers" on open_answer_submissions;
create policy "Tutors manage own open answers"
on open_answer_submissions for all
using (tutor_id = auth.uid() or is_admin())
with check (tutor_id = auth.uid() or is_admin());
