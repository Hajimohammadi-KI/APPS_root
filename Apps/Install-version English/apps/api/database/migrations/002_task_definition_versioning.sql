-- Expand-only migration for immutable Task Definitions and lifecycle monitoring.
-- It does not rewrite legacy attempts or infer a task version for old evidence.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_lifecycle_state') then
    create type task_lifecycle_state as enum (
      'draft',
      'in_review',
      'approved',
      'scheduled',
      'published',
      'deprecated',
      'retired',
      'blocked',
      'archived'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_event_type') then
    create type task_event_type as enum (
      'task_created',
      'version_created',
      'submitted_for_review',
      'review_changes_requested',
      'review_approved',
      'publication_scheduled',
      'publication_cancelled',
      'published',
      'deprecated',
      'deprecated_reversed',
      'retired',
      'blocked',
      'archived',
      'replacement_linked'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_version_relationship') then
    create type task_version_relationship as enum (
      'initial',
      'patch_of',
      'compatible_successor_of',
      'semantic_successor_of',
      'split_from',
      'merged_from'
    );
  end if;
end
$$;

create table if not exists tasks (
  task_id uuid primary key default gen_random_uuid(),
  skill_id text not null,
  topic_id text not null,
  cefr_aligned_level text not null
    check (cefr_aligned_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  latest_version text not null default '0.1.0',
  latest_published_version text,
  replacement_task_id uuid references tasks(task_id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by text not null,
  updated_at timestamptz not null default now()
);

comment on table tasks is
  'Stable Task identity. Lifecycle truth belongs to task_versions; latest fields are projections.';

create table if not exists task_versions (
  task_id uuid not null references tasks(task_id) on delete restrict,
  task_version text not null
    check (task_version ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'),
  lifecycle_state task_lifecycle_state not null default 'draft',
  version_relationship task_version_relationship not null default 'initial',
  parent_task_id uuid,
  parent_task_version text,
  definition jsonb not null,
  content_version text not null,
  rubric_id text not null,
  rubric_version text not null,
  checksum text not null check (checksum ~ '^[0-9a-fA-F]{64}$'),
  created_at timestamptz not null default now(),
  created_by text not null,
  reviewed_at timestamptz,
  reviewed_by text,
  approved_at timestamptz,
  approved_by text,
  scheduled_for timestamptz,
  published_at timestamptz,
  deprecated_at timestamptz,
  retired_at timestamptz,
  blocked_at timestamptz,
  archived_at timestamptz,
  deprecation_reason text,
  replacement_task_id uuid,
  replacement_task_version text,
  row_version bigint not null default 0 check (row_version >= 0),
  primary key (task_id, task_version),
  foreign key (parent_task_id, parent_task_version)
    references task_versions(task_id, task_version) on delete restrict,
  foreign key (replacement_task_id, replacement_task_version)
    references task_versions(task_id, task_version) on delete restrict,
  check (lifecycle_state <> 'scheduled' or scheduled_for is not null),
  check (lifecycle_state <> 'published' or published_at is not null),
  check (lifecycle_state <> 'deprecated' or deprecated_at is not null),
  check (lifecycle_state <> 'retired' or retired_at is not null),
  check (lifecycle_state <> 'blocked' or blocked_at is not null),
  check (lifecycle_state <> 'archived' or archived_at is not null)
);

comment on table task_versions is
  'Immutable snapshots after publication. Attempts resolve by exact task_id and task_version.';

create table if not exists task_state_transitions (
  from_state task_lifecycle_state not null,
  to_state task_lifecycle_state not null,
  event_type task_event_type not null,
  requires_reason boolean not null default false,
  requires_replacement boolean not null default false,
  requires_approval boolean not null default false,
  primary key (from_state, to_state),
  check (from_state <> to_state)
);

insert into task_state_transitions (
  from_state,
  to_state,
  event_type,
  requires_reason,
  requires_replacement,
  requires_approval
)
values
  ('draft',      'in_review',  'submitted_for_review',     false, false, false),
  ('draft',      'archived',   'archived',                  true, false, false),
  ('in_review',  'draft',      'review_changes_requested',  true, false, false),
  ('in_review',  'approved',   'review_approved',           false, false, true),
  ('in_review',  'archived',   'archived',                   true, false, false),
  ('approved',   'draft',      'review_changes_requested',   true, false, false),
  ('approved',   'scheduled',  'publication_scheduled',     false, false, true),
  ('approved',   'published',  'published',                 false, false, true),
  ('scheduled',  'approved',   'publication_cancelled',      true, false, false),
  ('scheduled',  'published',  'published',                 false, false, true),
  ('scheduled',  'blocked',    'blocked',                    true, false, false),
  ('published',  'deprecated', 'deprecated',                 true,  true, false),
  ('published',  'retired',    'retired',                    true, false, false),
  ('published',  'blocked',    'blocked',                    true, false, false),
  ('deprecated', 'published',  'deprecated_reversed',        true, false, true),
  ('deprecated', 'retired',    'retired',                    true, false, false),
  ('deprecated', 'blocked',    'blocked',                    true, false, false),
  ('retired',    'archived',   'archived',                   true, false, false),
  ('blocked',    'retired',    'retired',                    true, false, false),
  ('blocked',    'archived',   'archived',                   true, false, false)
on conflict (from_state, to_state) do update
set
  event_type = excluded.event_type,
  requires_reason = excluded.requires_reason,
  requires_replacement = excluded.requires_replacement,
  requires_approval = excluded.requires_approval;

create table if not exists task_lifecycle_events (
  event_id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  task_version text not null,
  sequence_number bigint not null check (sequence_number > 0),
  event_type task_event_type not null,
  previous_state task_lifecycle_state,
  next_state task_lifecycle_state not null,
  reason_code text,
  notes text,
  replacement_task_id uuid,
  replacement_task_version text,
  actor_kind text not null check (actor_kind in ('user', 'service', 'migration')),
  actor_id text not null,
  actor_display_name text not null,
  actor_role text not null
    check (actor_role in ('author', 'reviewer', 'release_manager', 'system', 'migration')),
  expected_row_version bigint not null,
  resulting_row_version bigint not null,
  occurred_at timestamptz not null default clock_timestamp(),
  app_version text not null,
  task_schema_version text not null,
  definition_checksum text not null,
  metadata jsonb not null default '{}'::jsonb,
  foreign key (task_id, task_version)
    references task_versions(task_id, task_version) on delete restrict,
  foreign key (replacement_task_id, replacement_task_version)
    references task_versions(task_id, task_version) on delete restrict,
  unique (task_id, task_version, sequence_number),
  check (resulting_row_version >= expected_row_version)
);

comment on table task_lifecycle_events is
  'Append-only audit ledger. actor_display_name is captured at event time so history remains readable.';

create index if not exists idx_task_versions_state
  on task_versions(lifecycle_state, created_at);
create index if not exists idx_task_versions_task_published
  on task_versions(task_id, published_at desc)
  where lifecycle_state = 'published';
create index if not exists idx_task_lifecycle_events_history
  on task_lifecycle_events(task_id, task_version, sequence_number);
create index if not exists idx_task_lifecycle_events_state_time
  on task_lifecycle_events(next_state, occurred_at desc);

alter table attempts add column if not exists task_id uuid;
alter table attempts add column if not exists task_version text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attempts_task_version_pair_check'
      and conrelid = 'attempts'::regclass
  ) then
    alter table attempts
      add constraint attempts_task_version_pair_check
      check ((task_id is null) = (task_version is null));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attempts_task_version_fk'
      and conrelid = 'attempts'::regclass
  ) then
    alter table attempts
      add constraint attempts_task_version_fk
      foreign key (task_id, task_version)
      references task_versions(task_id, task_version)
      on delete restrict
      not valid;
  end if;
end
$$;

comment on column attempts.task_version is
  'Nullable only for legacy attempts whose exact Task Version cannot be proven. Never guess this value.';

create or replace function validate_task_for_publish(
  p_task_id uuid,
  p_task_version text
)
returns void
language plpgsql
as $$
declare
  v_task task_versions%rowtype;
begin
  select * into v_task
  from task_versions
  where task_id = p_task_id and task_version = p_task_version;

  if not found then
    raise exception 'Task version %/% not found', p_task_id, p_task_version;
  end if;
  if v_task.lifecycle_state not in ('approved', 'scheduled', 'deprecated') then
    raise exception 'Only approved, scheduled, or deprecated (reversal) tasks can be published; current state: %',
      v_task.lifecycle_state;
  end if;
  if v_task.definition = '{}'::jsonb or not (v_task.definition ? 'prompt') then
    raise exception 'Task definition must contain prompt';
  end if;
  if not (v_task.definition ? 'referencePolicy') then
    raise exception 'Task definition must contain referencePolicy';
  end if;
  if v_task.approved_at is null or v_task.approved_by is null then
    raise exception 'Task must have an approval before publication';
  end if;
end
$$;

create or replace function validate_task_for_deprecation(
  p_task_id uuid,
  p_task_version text,
  p_replacement_task_id uuid,
  p_replacement_task_version text
)
returns void
language plpgsql
as $$
declare
  v_replacement_state task_lifecycle_state;
begin
  if p_replacement_task_id is null or p_replacement_task_version is null then
    raise exception 'Deprecation requires a replacement task version';
  end if;
  if p_task_id = p_replacement_task_id and p_task_version = p_replacement_task_version then
    raise exception 'A Task Version cannot replace itself';
  end if;

  select lifecycle_state into v_replacement_state
  from task_versions
  where task_id = p_replacement_task_id
    and task_version = p_replacement_task_version;

  if not found or v_replacement_state <> 'published' then
    raise exception 'Replacement task version must exist and be published';
  end if;
end
$$;

create or replace function prevent_published_task_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.lifecycle_state in ('published', 'deprecated', 'retired', 'blocked', 'archived')
     and (
       new.definition is distinct from old.definition
       or new.content_version is distinct from old.content_version
       or new.rubric_id is distinct from old.rubric_id
       or new.rubric_version is distinct from old.rubric_version
       or new.checksum is distinct from old.checksum
       or new.task_version is distinct from old.task_version
     ) then
    raise exception 'Published or historical Task Versions are immutable; create a new version';
  end if;
  return new;
end
$$;

drop trigger if exists trg_prevent_published_task_mutation on task_versions;
create trigger trg_prevent_published_task_mutation
before update on task_versions
for each row execute function prevent_published_task_mutation();

create or replace function prevent_task_lifecycle_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Task lifecycle events are append-only and cannot be updated or deleted';
end
$$;

drop trigger if exists trg_prevent_task_lifecycle_event_mutation on task_lifecycle_events;
create trigger trg_prevent_task_lifecycle_event_mutation
before update or delete on task_lifecycle_events
for each row execute function prevent_task_lifecycle_event_mutation();

create or replace function record_initial_task_version_event()
returns trigger
language plpgsql
as $$
begin
  insert into task_lifecycle_events (
    task_id,
    task_version,
    sequence_number,
    event_type,
    previous_state,
    next_state,
    actor_kind,
    actor_id,
    actor_display_name,
    actor_role,
    expected_row_version,
    resulting_row_version,
    app_version,
    task_schema_version,
    definition_checksum,
    metadata
  )
  values (
    new.task_id,
    new.task_version,
    1,
    'version_created',
    null,
    new.lifecycle_state,
    case when new.created_by like 'service:%' then 'service' else 'user' end,
    new.created_by,
    new.created_by,
    'author',
    0,
    new.row_version,
    'unknown',
    '1.0.0',
    new.checksum,
    jsonb_build_object(
      'relationship', new.version_relationship,
      'parentTaskId', new.parent_task_id,
      'parentTaskVersion', new.parent_task_version
    )
  );
  return new;
end
$$;

drop trigger if exists trg_record_initial_task_version_event on task_versions;
create trigger trg_record_initial_task_version_event
after insert on task_versions
for each row execute function record_initial_task_version_event();

create or replace function transition_task_version(
  p_task_id uuid,
  p_task_version text,
  p_to_state task_lifecycle_state,
  p_actor_kind text,
  p_actor_id text,
  p_actor_display_name text,
  p_actor_role text,
  p_expected_row_version bigint,
  p_reason_code text default null,
  p_notes text default null,
  p_replacement_task_id uuid default null,
  p_replacement_task_version text default null,
  p_scheduled_for timestamptz default null,
  p_app_version text default 'unknown',
  p_task_schema_version text default '1.0.0'
)
returns task_versions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_task task_versions%rowtype;
  v_transition task_state_transitions%rowtype;
  v_next_sequence bigint;
  v_now timestamptz := clock_timestamp();
begin
  if p_actor_kind not in ('user', 'service', 'migration') then
    raise exception 'Invalid actor kind: %', p_actor_kind;
  end if;
  if p_actor_role not in ('author', 'reviewer', 'release_manager', 'system', 'migration') then
    raise exception 'Invalid actor role: %', p_actor_role;
  end if;
  if nullif(trim(p_actor_id), '') is null
     or nullif(trim(p_actor_display_name), '') is null then
    raise exception 'Actor id and display name are required';
  end if;

  -- p_actor_id/p_actor_role are caller-supplied and otherwise unverifiable --
  -- a caller could pass actor_role='release_manager' to satisfy the
  -- requires_approval check below with no real authorization behind it.
  -- Close that hole by requiring the calling connection to have already
  -- authenticated and recorded the verified identity as Postgres session
  -- variables (e.g. via `select set_config('app.current_actor_id', $1,
  -- true)` / `app.current_actor_role` issued by the API right after auth,
  -- within the same transaction). Fail closed if that hasn't happened, and
  -- reject any mismatch between the claimed and session-verified actor.
  if current_setting('app.current_actor_id', true) is null
     or current_setting('app.current_actor_role', true) is null then
    raise exception 'No authenticated actor identity set on this session (app.current_actor_id / app.current_actor_role)';
  end if;
  if current_setting('app.current_actor_id', true) <> p_actor_id
     or current_setting('app.current_actor_role', true) <> p_actor_role then
    raise exception 'Claimed actor (%/%) does not match the session-verified actor', p_actor_id, p_actor_role;
  end if;

  select * into v_task
  from task_versions
  where task_id = p_task_id and task_version = p_task_version
  for update;

  if not found then
    raise exception 'Task version %/% not found', p_task_id, p_task_version;
  end if;
  if v_task.row_version <> p_expected_row_version then
    raise exception 'Concurrency conflict: expected row version %, current row version %',
      p_expected_row_version, v_task.row_version
      using errcode = '40001';
  end if;

  select * into v_transition
  from task_state_transitions
  where from_state = v_task.lifecycle_state and to_state = p_to_state;

  if not found then
    raise exception 'Invalid Task lifecycle transition: % -> %',
      v_task.lifecycle_state, p_to_state;
  end if;
  if v_transition.requires_reason and nullif(trim(p_reason_code), '') is null then
    raise exception 'Transition % -> % requires a reason code',
      v_task.lifecycle_state, p_to_state;
  end if;
  if v_transition.requires_approval and p_actor_role not in ('reviewer', 'release_manager') then
    raise exception 'Transition % -> % requires reviewer or release_manager role',
      v_task.lifecycle_state, p_to_state;
  end if;
  if p_to_state = 'scheduled' and p_scheduled_for is null then
    raise exception 'Scheduling requires scheduled_for';
  end if;
  if v_transition.requires_replacement then
    perform validate_task_for_deprecation(
      p_task_id,
      p_task_version,
      p_replacement_task_id,
      p_replacement_task_version
    );
  end if;
  if p_to_state = 'published' then
    perform validate_task_for_publish(p_task_id, p_task_version);
  end if;

  select coalesce(max(sequence_number), 0) + 1 into v_next_sequence
  from task_lifecycle_events
  where task_id = p_task_id and task_version = p_task_version;

  update task_versions
  set
    lifecycle_state = p_to_state,
    reviewed_at = case when p_to_state = 'approved' then v_now else reviewed_at end,
    reviewed_by = case when p_to_state = 'approved' then p_actor_id else reviewed_by end,
    approved_at = case when p_to_state = 'approved' then v_now else approved_at end,
    approved_by = case when p_to_state = 'approved' then p_actor_id else approved_by end,
    scheduled_for = case when p_to_state = 'scheduled' then p_scheduled_for else scheduled_for end,
    published_at = case when p_to_state = 'published' then v_now else published_at end,
    deprecated_at = case when p_to_state = 'deprecated' then v_now else deprecated_at end,
    retired_at = case when p_to_state = 'retired' then v_now else retired_at end,
    blocked_at = case when p_to_state = 'blocked' then v_now else blocked_at end,
    archived_at = case when p_to_state = 'archived' then v_now else archived_at end,
    deprecation_reason = case
      when p_to_state in ('deprecated', 'blocked') then p_reason_code
      else deprecation_reason
    end,
    replacement_task_id = case
      when p_to_state = 'deprecated' then p_replacement_task_id
      else replacement_task_id
    end,
    replacement_task_version = case
      when p_to_state = 'deprecated' then p_replacement_task_version
      else replacement_task_version
    end,
    row_version = row_version + 1
  where task_id = p_task_id and task_version = p_task_version
  returning * into v_task;

  insert into task_lifecycle_events (
    task_id,
    task_version,
    sequence_number,
    event_type,
    previous_state,
    next_state,
    reason_code,
    notes,
    replacement_task_id,
    replacement_task_version,
    actor_kind,
    actor_id,
    actor_display_name,
    actor_role,
    expected_row_version,
    resulting_row_version,
    occurred_at,
    app_version,
    task_schema_version,
    definition_checksum
  )
  values (
    p_task_id,
    p_task_version,
    v_next_sequence,
    v_transition.event_type,
    v_transition.from_state,
    p_to_state,
    p_reason_code,
    p_notes,
    p_replacement_task_id,
    p_replacement_task_version,
    p_actor_kind,
    p_actor_id,
    p_actor_display_name,
    p_actor_role,
    p_expected_row_version,
    v_task.row_version,
    v_now,
    p_app_version,
    p_task_schema_version,
    v_task.checksum
  );

  update tasks
  set
    latest_published_version = case
      when p_to_state = 'published' then p_task_version
      else latest_published_version
    end,
    updated_at = v_now
  where task_id = p_task_id;

  return v_task;
end
$$;

-- Direct table writes are not an application API. PostgreSQL grants EXECUTE
-- on new functions to PUBLIC by default (and INSERT/UPDATE/DELETE on new
-- tables to their owner only, but not from other roles unless granted) --
-- revoke explicitly here rather than relying on that default, since a
-- SECURITY DEFINER function with PUBLIC execute lets any connected role act
-- with the function owner's privileges. The only sanctioned write path is
-- transition_task_version(); everything else must be read-only or nothing.
revoke insert, update, delete on task_lifecycle_events from public;
revoke insert, update, delete on task_versions from public;
revoke execute on function transition_task_version(
  uuid, text, task_lifecycle_state, text, text, text, text, bigint,
  text, text, uuid, text, timestamptz, text, text
) from public;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'task_lifecycle_service') then
    create role task_lifecycle_service nologin;
  end if;
end
$$;

comment on role task_lifecycle_service is
  'Role the API server authenticates as (or SET ROLEs into) to call transition_task_version. Grant this role, never PUBLIC, and never let application users connect directly as it.';

grant execute on function transition_task_version(
  uuid, text, task_lifecycle_state, text, text, text, text, bigint,
  text, text, uuid, text, timestamptz, text, text
) to task_lifecycle_service;
grant select on task_versions, task_lifecycle_events to task_lifecycle_service;

-- No row-level-security policy is added here: neither table has a
-- tenant/owner column to key a policy on (this product has no multi-tenant
-- or multi-user model yet), so an RLS policy today could only be USING
-- (true) -- a no-op that would look like protection without being any.
-- The real boundary right now is role-based: PUBLIC has no table privileges
-- and no function EXECUTE; only task_lifecycle_service can act, and only
-- through the audited, state-machine-checked function above. Add a real
-- tenant_id/owner_id column and a matching policy if/when this becomes
-- multi-user.

create table if not exists task_state_monitoring_thresholds (
  lifecycle_state task_lifecycle_state primary key,
  max_duration interval not null check (max_duration > interval '0 seconds'),
  severity text not null check (severity in ('warning', 'critical')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text not null
);

insert into task_state_monitoring_thresholds (
  lifecycle_state,
  max_duration,
  severity,
  updated_by
)
values
  ('draft', interval '14 days', 'warning', 'migration:002'),
  ('in_review', interval '48 hours', 'warning', 'migration:002'),
  ('approved', interval '7 days', 'warning', 'migration:002'),
  ('scheduled', interval '24 hours', 'critical', 'migration:002'),
  ('blocked', interval '4 hours', 'critical', 'migration:002')
on conflict (lifecycle_state) do nothing;

create or replace view task_state_history_v as
with ordered_events as (
  select
    event_id,
    task_id,
    task_version,
    sequence_number,
    event_type,
    previous_state,
    next_state,
    occurred_at as entered_at,
    lead(occurred_at) over (
      partition by task_id, task_version
      order by sequence_number
    ) as exited_at,
    actor_kind,
    actor_id,
    actor_display_name,
    actor_role,
    reason_code,
    notes,
    app_version,
    task_schema_version,
    definition_checksum
  from task_lifecycle_events
)
select
  event_id,
  task_id,
  task_version,
  sequence_number,
  event_type,
  previous_state,
  next_state as lifecycle_state,
  entered_at,
  exited_at,
  coalesce(exited_at, clock_timestamp()) - entered_at as time_in_state,
  exited_at is null as is_current,
  actor_kind,
  actor_id,
  actor_display_name,
  actor_role,
  reason_code,
  notes,
  app_version,
  task_schema_version,
  definition_checksum
from ordered_events;

comment on view task_state_history_v is
  'Human-readable Task Version state history, including duration and actor snapshot.';

create or replace view task_state_duration_metrics_v as
select
  lifecycle_state,
  count(*) filter (where exited_at is not null) as completed_state_visits,
  count(*) filter (where is_current) as currently_in_state,
  avg(exited_at - entered_at) filter (where exited_at is not null)
    as average_completed_duration,
  percentile_cont(0.5) within group (
    order by extract(epoch from (exited_at - entered_at))
  ) filter (where exited_at is not null) * interval '1 second'
    as median_completed_duration,
  max(coalesce(exited_at, clock_timestamp()) - entered_at)
    as maximum_observed_duration
from task_state_history_v
group by lifecycle_state;

comment on view task_state_duration_metrics_v is
  'Dashboard metric: average, median, and maximum time spent in each lifecycle state.';

create or replace view stuck_task_versions_v as
select
  tv.task_id,
  tv.task_version,
  tv.lifecycle_state,
  history.entered_at as state_entered_at,
  clock_timestamp() - history.entered_at as stuck_for,
  threshold.max_duration,
  threshold.severity,
  history.actor_kind as entered_by_kind,
  history.actor_id as entered_by_id,
  history.actor_display_name as entered_by_name,
  history.actor_role as entered_by_role,
  history.reason_code,
  history.notes
from task_versions tv
join task_state_history_v history
  on history.task_id = tv.task_id
 and history.task_version = tv.task_version
 and history.is_current
 and history.lifecycle_state = tv.lifecycle_state
join task_state_monitoring_thresholds threshold
  on threshold.lifecycle_state = tv.lifecycle_state
 and threshold.enabled
where clock_timestamp() - history.entered_at > threshold.max_duration;

comment on view stuck_task_versions_v is
  'Task Versions whose current state duration exceeds its configurable threshold.';

create or replace view stuck_task_summary_v as
select
  lifecycle_state,
  severity,
  count(*) as stuck_task_count,
  max(stuck_for) as oldest_stuck_duration
from stuck_task_versions_v
group by lifecycle_state, severity;

comment on view stuck_task_summary_v is
  'Dashboard card source: stuck Task count and oldest duration by state and severity.';

create or replace view task_state_monitoring_data_quality_v as
select
  tv.task_id,
  tv.task_version,
  tv.lifecycle_state,
  tv.row_version,
  'missing_or_mismatched_current_history'::text as issue
from task_versions tv
left join task_state_history_v history
  on history.task_id = tv.task_id
 and history.task_version = tv.task_version
 and history.is_current
 and history.lifecycle_state = tv.lifecycle_state
where history.event_id is null;

comment on view task_state_monitoring_data_quality_v is
  'Must remain empty; identifies current Task states that cannot be reconstructed from the ledger.';
