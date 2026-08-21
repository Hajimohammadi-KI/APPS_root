-- German Grammar Automaticity
-- Supabase/PostgreSQL foundation for authenticated cross-device sync.
--
-- The PWA remains fully usable in anonymous local-first mode. These tables are
-- the server-side source of truth only after a learner explicitly signs in and
-- enables synchronization.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  native_language text,
  target_language text not null default 'de',
  current_level text check (current_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category text not null,
  short_rule text not null,
  long_rule text,
  common_error text,
  recall_prompt text,
  repair_prompt text,
  transfer_prompt text,
  difficulty_score integer not null default 1 check (difficulty_score between 1 and 10),
  content_version integer not null default 1 check (content_version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topic_examples (
  id uuid primary key default gen_random_uuid(),
  grammar_topic_id uuid not null references public.grammar_topics(id) on delete cascade,
  example_text text not null,
  translation_text text,
  example_type text not null default 'core'
    check (example_type in ('core', 'contrast', 'error', 'transfer')),
  sort_order integer not null default 0,
  unique (grammar_topic_id, example_text, example_type)
);

create table public.speaking_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  domain text not null,
  prompt_text text not null,
  followup_prompts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(followup_prompts) = 'array'),
  model_answer text,
  target_grammar text,
  content_version integer not null default 1 check (content_version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_topic_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  grammar_topic_id uuid not null references public.grammar_topics(id) on delete cascade,
  mastery_status text not null default 'new'
    check (mastery_status in ('new', 'learning', 'usable', 'stable', 'automatic')),
  recognition_score numeric(5, 2) not null default 0 check (recognition_score between 0 and 100),
  writing_score numeric(5, 2) not null default 0 check (writing_score between 0 and 100),
  speaking_score numeric(5, 2) not null default 0 check (speaking_score between 0 and 100),
  repair_score numeric(5, 2) not null default 0 check (repair_score between 0 and 100),
  transfer_score numeric(5, 2) not null default 0 check (transfer_score between 0 and 100),
  automaticity_score numeric(5, 2) not null default 0 check (automaticity_score between 0 and 100),
  median_latency_ms integer check (median_latency_ms is null or median_latency_ms >= 0),
  active_error_count integer not null default 0 check (active_error_count >= 0),
  active_critical_error_count integer not null default 0 check (active_critical_error_count >= 0),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_review_at timestamptz,
  times_seen integer not null default 0 check (times_seen >= 0),
  successful_reviews integer not null default 0 check (successful_reviews >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, grammar_topic_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  speaking_topic_id uuid references public.speaking_topics(id) on delete set null,
  mode text not null
    check (mode in ('recognition', 'writing', 'speaking', 'repair', 'transfer', 'timed_review')),
  prompt_text text,
  input_text text,
  corrected_text text,
  target_hit boolean not null default false,
  accuracy_score numeric(5, 2) not null default 0 check (accuracy_score between 0 and 100),
  fluency_score numeric(5, 2) not null default 0 check (fluency_score between 0 and 100),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  ai_feedback text,
  evaluation_version text,
  created_at timestamptz not null default now(),
  unique (user_id, client_event_id),
  check (grammar_topic_id is not null or speaking_topic_id is not null)
);

create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  storage_path text,
  duration_seconds numeric(8, 2)
    check (duration_seconds is null or duration_seconds >= 0),
  transcript_text text,
  corrected_transcript_text text,
  keep_local_only boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, client_event_id),
  check (
    (keep_local_only and storage_path is null)
    or (
      not keep_local_only
      and storage_path like user_id::text || '/%'
    )
  )
);

create table public.attempt_errors (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  error_class text not null
    check (
      error_class in (
        'word_order',
        'case',
        'article',
        'auxiliary',
        'ending',
        'tense',
        'agreement',
        'spelling',
        'target_grammar',
        'other'
      )
    ),
  original_fragment text not null,
  corrected_fragment text not null,
  explanation_text text,
  severity integer not null default 1 check (severity between 1 and 5),
  created_at timestamptz not null default now(),
  unique (attempt_id, client_event_id)
);

create table public.error_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  error_class text not null
    check (
      error_class in (
        'word_order',
        'case',
        'article',
        'auxiliary',
        'ending',
        'tense',
        'agreement',
        'spelling',
        'target_grammar',
        'other'
      )
    ),
  canonical_original text not null,
  canonical_corrected text not null,
  explanation_text text,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  successful_repairs integer not null default 0 check (successful_repairs >= 0),
  critical boolean not null default false,
  repair_status text not null default 'new'
    check (repair_status in ('new', 'scheduled', 'improving', 'fixed')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  next_repair_at timestamptz
);

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('grammar_topic', 'error_item')),
  source_id uuid not null,
  review_mode text not null check (review_mode in ('mixed', 'repair', 'production', 'timed')),
  interval_days integer not null check (interval_days in (1, 3, 7, 14, 30)),
  due_at timestamptz not null,
  success_streak integer not null default 0 check (success_streak >= 0),
  stability_score numeric(5, 2) not null default 0 check (stability_score between 0 and 100),
  last_reviewed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'missed', 'rescheduled')),
  created_at timestamptz not null default now()
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_queue_id uuid not null references public.review_queue(id) on delete cascade,
  successful boolean not null,
  accuracy_score numeric(5, 2) not null check (accuracy_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, client_event_id),
  unique (review_queue_id)
);

create table public.daily_path (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_date date not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, path_date)
);

create table public.daily_path_items (
  id uuid primary key default gen_random_uuid(),
  daily_path_id uuid not null references public.daily_path(id) on delete cascade,
  item_order integer not null check (item_order between 1 and 7),
  item_type text not null
    check (
      item_type in (
        'recall',
        'writing',
        'coach',
        'explanation',
        'repair',
        'transfer',
        'review'
      )
    ),
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  speaking_topic_id uuid references public.speaking_topics(id) on delete set null,
  review_queue_id uuid references public.review_queue(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'locked', 'skipped')),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_path_id, item_order)
);

create index idx_user_topic_status_user
  on public.user_topic_status (user_id);
create index idx_user_topic_status_next_review
  on public.user_topic_status (user_id, next_review_at);
create index idx_attempts_user_created
  on public.attempts (user_id, created_at desc);
create index idx_attempts_topic
  on public.attempts (user_id, grammar_topic_id, created_at desc);
create index idx_attempt_errors_attempt
  on public.attempt_errors (attempt_id);
create index idx_error_items_user_status
  on public.error_items (user_id, repair_status, next_repair_at);
create index idx_review_queue_user_due
  on public.review_queue (user_id, status, due_at);
create index idx_review_events_user_created
  on public.review_events (user_id, created_at desc);
create index idx_daily_path_user_date
  on public.daily_path (user_id, path_date);
create index idx_daily_path_items_path_order
  on public.daily_path_items (daily_path_id, item_order);

create unique index uq_error_items_signature
  on public.error_items (
    user_id,
    grammar_topic_id,
    error_class,
    canonical_original,
    canonical_corrected
  ) nulls not distinct;

create unique index uq_review_queue_pending_source
  on public.review_queue (user_id, source_type, source_id)
  where status = 'pending';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_grammar_topics_updated_at
before update on public.grammar_topics
for each row execute function public.set_updated_at();

create trigger trg_speaking_topics_updated_at
before update on public.speaking_topics
for each row execute function public.set_updated_at();

create trigger trg_user_topic_status_updated_at
before update on public.user_topic_status
for each row execute function public.set_updated_at();

create trigger trg_daily_path_updated_at
before update on public.daily_path
for each row execute function public.set_updated_at();

create trigger trg_daily_path_items_updated_at
before update on public.daily_path_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.ensure_user_topic_status(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_topic_status (user_id, grammar_topic_id)
  values (p_user_id, p_topic_id)
  on conflict (user_id, grammar_topic_id) do nothing;
$$;

create or replace function public.mastery_mode_score(
  p_user_id uuid,
  p_topic_id uuid,
  p_mode text
)
returns numeric
language sql
stable
set search_path = ''
as $$
  with recursive ordered as (
    select
      row_number() over (order by a.created_at, a.id) as sequence,
      (
        case
          when a.target_hit then a.accuracy_score
          else least(a.accuracy_score, 59)
        end
      )::numeric as attempted_score
    from public.attempts a
    where a.user_id = p_user_id
      and a.grammar_topic_id = p_topic_id
      and (
        a.mode = p_mode
        or (p_mode = 'recognition' and a.mode = 'timed_review')
      )
  ),
  rolling as (
    select o.sequence, o.attempted_score as score
    from ordered o
    where o.sequence = 1

    union all

    select
      o.sequence,
      round((r.score * 0.6) + (o.attempted_score * 0.4), 2) as score
    from rolling r
    join ordered o on o.sequence = r.sequence + 1
  )
  select coalesce(
    (select r.score from rolling r order by r.sequence desc limit 1),
    0
  );
$$;

create or replace function public.schedule_initial_review(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.review_queue (
    user_id,
    source_type,
    source_id,
    review_mode,
    interval_days,
    due_at,
    status
  )
  select
    p_user_id,
    'grammar_topic',
    p_topic_id,
    'production',
    1,
    now() + interval '1 day',
    'pending'
  where not exists (
    select 1
    from public.review_queue rq
    where rq.user_id = p_user_id
      and rq.source_type = 'grammar_topic'
      and rq.source_id = p_topic_id
      and rq.interval_days = 1
      and rq.status in ('pending', 'done')
  );
end;
$$;

create or replace function public.recalculate_user_topic_status(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recognition numeric := 0;
  v_writing numeric := 0;
  v_speaking numeric := 0;
  v_repair numeric := 0;
  v_transfer numeric := 0;
  v_automaticity numeric := 0;
  v_active_errors integer := 0;
  v_active_critical_errors integer := 0;
  v_successful_reviews integer := 0;
  v_median_latency integer;
  v_times_seen integer := 0;
  v_last_attempt_at timestamptz;
  v_last_success_at timestamptz;
  v_next_review_at timestamptz;
  v_status text := 'new';
begin
  perform public.ensure_user_topic_status(p_user_id, p_topic_id);

  v_recognition := public.mastery_mode_score(p_user_id, p_topic_id, 'recognition');
  v_writing := public.mastery_mode_score(p_user_id, p_topic_id, 'writing');
  v_speaking := public.mastery_mode_score(p_user_id, p_topic_id, 'speaking');
  v_repair := public.mastery_mode_score(p_user_id, p_topic_id, 'repair');
  v_transfer := public.mastery_mode_score(p_user_id, p_topic_id, 'transfer');

  select
    count(*),
    max(a.created_at),
    max(a.created_at) filter (where a.target_hit)
  into v_times_seen, v_last_attempt_at, v_last_success_at
  from public.attempts a
  where a.user_id = p_user_id
    and a.grammar_topic_id = p_topic_id;

  select round(percentile_cont(0.5) within group (order by recent.latency_ms))::integer
  into v_median_latency
  from (
    select a.latency_ms
    from public.attempts a
    where a.user_id = p_user_id
      and a.grammar_topic_id = p_topic_id
      and a.latency_ms is not null
    order by a.created_at desc
    limit 10
  ) recent;

  select
    count(*) filter (where ei.repair_status <> 'fixed'),
    count(*) filter (where ei.repair_status <> 'fixed' and ei.critical)
  into v_active_errors, v_active_critical_errors
  from public.error_items ei
  where ei.user_id = p_user_id
    and ei.grammar_topic_id = p_topic_id;

  select count(*)
  into v_successful_reviews
  from public.review_events re
  join public.review_queue rq on rq.id = re.review_queue_id
  where re.user_id = p_user_id
    and re.successful
    and rq.source_type = 'grammar_topic'
    and rq.source_id = p_topic_id;

  select min(rq.due_at)
  into v_next_review_at
  from public.review_queue rq
  where rq.user_id = p_user_id
    and rq.source_type = 'grammar_topic'
    and rq.source_id = p_topic_id
    and rq.status = 'pending';

  v_automaticity := greatest(
    0,
    least(
      100,
      round(
        (v_recognition * 0.15)
        + (v_writing * 0.25)
        + (v_speaking * 0.25)
        + (v_repair * 0.20)
        + (v_transfer * 0.15)
        + least(10, v_successful_reviews * 5)
        + case
            when v_median_latency is null then 0
            when v_median_latency <= 8000 then 5
            else -5
          end
        - least(25, v_active_critical_errors * 10),
        2
      )
    )
  );

  if
    v_recognition >= 85
    and v_writing >= 80
    and v_speaking >= 80
    and v_repair >= 80
    and v_transfer >= 75
    and v_successful_reviews >= 2
    and v_active_critical_errors = 0
    and v_median_latency is not null
    and v_median_latency <= 8000
  then
    v_status := 'automatic';
  elsif
    v_writing >= 80
    and v_speaking >= 80
    and v_transfer >= 75
    and v_successful_reviews >= 1
  then
    v_status := 'stable';
  elsif
    v_recognition >= 70
    and (v_writing >= 70 or v_speaking >= 70)
  then
    v_status := 'usable';
  elsif
    v_recognition > 0
    or v_writing > 0
    or v_speaking > 0
    or v_repair > 0
    or v_transfer > 0
  then
    v_status := 'learning';
  end if;

  update public.user_topic_status
  set
    recognition_score = v_recognition,
    writing_score = v_writing,
    speaking_score = v_speaking,
    repair_score = v_repair,
    transfer_score = v_transfer,
    automaticity_score = v_automaticity,
    median_latency_ms = v_median_latency,
    active_error_count = v_active_errors,
    active_critical_error_count = v_active_critical_errors,
    successful_reviews = v_successful_reviews,
    times_seen = v_times_seen,
    last_attempt_at = v_last_attempt_at,
    last_success_at = v_last_success_at,
    next_review_at = v_next_review_at,
    mastery_status = v_status
  where user_id = p_user_id
    and grammar_topic_id = p_topic_id;
end;
$$;

create or replace function public.handle_attempt_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.grammar_topic_id is not null then
    perform public.recalculate_user_topic_status(new.user_id, new.grammar_topic_id);

    if new.mode = 'transfer' and new.target_hit then
      perform public.schedule_initial_review(new.user_id, new.grammar_topic_id);
      perform public.recalculate_user_topic_status(new.user_id, new.grammar_topic_id);
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_attempt_after_insert
after insert on public.attempts
for each row execute function public.handle_attempt_after_insert();

create or replace function public.validate_audio_asset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.attempts a
    where a.id = new.attempt_id
      and a.user_id = new.user_id
  ) then
    raise exception 'Audio asset and attempt must belong to the same learner';
  end if;

  return new;
end;
$$;

create trigger trg_validate_audio_asset
before insert or update on public.audio_assets
for each row execute function public.validate_audio_asset();

create or replace function public.validate_attempt_error()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_attempt_topic_id uuid;
begin
  select a.grammar_topic_id
  into v_attempt_topic_id
  from public.attempts a
  where a.id = new.attempt_id;

  if not found then
    raise exception 'Attempt does not exist';
  end if;

  if
    new.grammar_topic_id is not null
    and v_attempt_topic_id is not null
    and new.grammar_topic_id <> v_attempt_topic_id
  then
    raise exception 'Attempt error topic must match the attempt topic';
  end if;

  return new;
end;
$$;

create trigger trg_validate_attempt_error
before insert or update on public.attempt_errors
for each row execute function public.validate_attempt_error();

create or replace function public.upsert_error_item_from_attempt_error()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attempt_topic_id uuid;
  v_topic_id uuid;
  v_error_item_id uuid;
begin
  select a.user_id, a.grammar_topic_id
  into v_user_id, v_attempt_topic_id
  from public.attempts a
  where a.id = new.attempt_id;

  v_topic_id := coalesce(new.grammar_topic_id, v_attempt_topic_id);

  insert into public.error_items (
    user_id,
    grammar_topic_id,
    error_class,
    canonical_original,
    canonical_corrected,
    explanation_text,
    occurrence_count,
    successful_repairs,
    critical,
    repair_status,
    first_seen_at,
    last_seen_at,
    next_repair_at
  )
  values (
    v_user_id,
    v_topic_id,
    new.error_class,
    new.original_fragment,
    new.corrected_fragment,
    new.explanation_text,
    1,
    0,
    new.severity >= 3,
    'scheduled',
    now(),
    now(),
    now() + interval '1 day'
  )
  on conflict (
    user_id,
    grammar_topic_id,
    error_class,
    canonical_original,
    canonical_corrected
  )
  do update set
    explanation_text = coalesce(excluded.explanation_text, public.error_items.explanation_text),
    occurrence_count = public.error_items.occurrence_count + 1,
    successful_repairs = 0,
    critical = public.error_items.critical or excluded.critical,
    repair_status = 'scheduled',
    last_seen_at = now(),
    next_repair_at = now() + interval '1 day'
  returning id into v_error_item_id;

  insert into public.review_queue (
    user_id,
    source_type,
    source_id,
    review_mode,
    interval_days,
    due_at,
    status
  )
  values (
    v_user_id,
    'error_item',
    v_error_item_id,
    'repair',
    1,
    now() + interval '1 day',
    'pending'
  )
  on conflict (user_id, source_type, source_id) where status = 'pending'
  do update set
    review_mode = 'repair',
    interval_days = 1,
    due_at = least(public.review_queue.due_at, excluded.due_at);

  if v_topic_id is not null then
    perform public.recalculate_user_topic_status(v_user_id, v_topic_id);
  end if;

  return new;
end;
$$;

create trigger trg_attempt_error_after_insert
after insert on public.attempt_errors
for each row execute function public.upsert_error_item_from_attempt_error();

create or replace function public.validate_review_source()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.source_type = 'grammar_topic' then
    if not exists (
      select 1 from public.grammar_topics gt where gt.id = new.source_id
    ) then
      raise exception 'Grammar topic review source does not exist';
    end if;
  elsif not exists (
    select 1
    from public.error_items ei
    where ei.id = new.source_id
      and ei.user_id = new.user_id
  ) then
    raise exception 'Error review source does not belong to the learner';
  end if;

  return new;
end;
$$;

create trigger trg_validate_review_source
before insert or update on public.review_queue
for each row execute function public.validate_review_source();

create or replace function public.complete_review(
  p_review_id uuid,
  p_client_event_id uuid,
  p_success boolean,
  p_accuracy numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_authenticated_user_id uuid := auth.uid();
  v_user_id uuid;
  v_source_type text;
  v_source_id uuid;
  v_review_mode text;
  v_interval integer;
  v_success_streak integer;
  v_status text;
  v_next_interval integer;
  v_next_mode text;
  v_event_id uuid;
  v_error_topic_id uuid;
begin
  if v_authenticated_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_accuracy < 0 or p_accuracy > 100 then
    raise exception 'Accuracy must be between 0 and 100';
  end if;

  select
    rq.user_id,
    rq.source_type,
    rq.source_id,
    rq.review_mode,
    rq.interval_days,
    rq.success_streak,
    rq.status
  into
    v_user_id,
    v_source_type,
    v_source_id,
    v_review_mode,
    v_interval,
    v_success_streak,
    v_status
  from public.review_queue rq
  where rq.id = p_review_id
  for update;

  if not found or v_user_id <> v_authenticated_user_id then
    raise exception 'Review not found';
  end if;

  insert into public.review_events (
    client_event_id,
    user_id,
    review_queue_id,
    successful,
    accuracy_score
  )
  values (
    p_client_event_id,
    v_user_id,
    p_review_id,
    p_success,
    p_accuracy
  )
  on conflict (user_id, client_event_id) do nothing
  returning id into v_event_id;

  -- A replay of an already accepted offline event is a successful no-op.
  if v_event_id is null then
    return;
  end if;

  if v_status <> 'pending' then
    raise exception 'Review is no longer pending';
  end if;

  update public.review_queue
  set
    status = case when p_success then 'done' else 'rescheduled' end,
    success_streak = case when p_success then success_streak + 1 else 0 end,
    stability_score = case
      when p_success then greatest(stability_score, p_accuracy)
      else least(stability_score, p_accuracy)
    end,
    last_reviewed_at = now()
  where id = p_review_id;

  if p_success and v_interval < 30 then
    v_next_interval := case v_interval
      when 1 then 3
      when 3 then 7
      when 7 then 14
      when 14 then 30
    end;
    v_next_mode := case v_next_interval
      when 3 then 'mixed'
      when 7 then 'production'
      when 14 then 'timed'
      else 'mixed'
    end;
  elsif not p_success then
    v_next_interval := case v_interval
      when 1 then 1
      when 3 then 1
      when 7 then 3
      when 14 then 7
      when 30 then 14
    end;
    v_next_mode := 'repair';
  end if;

  if v_next_interval is not null then
    insert into public.review_queue (
      user_id,
      source_type,
      source_id,
      review_mode,
      interval_days,
      due_at,
      success_streak,
      stability_score,
      status
    )
    values (
      v_user_id,
      v_source_type,
      v_source_id,
      v_next_mode,
      v_next_interval,
      now() + make_interval(days => v_next_interval),
      case when p_success then v_success_streak + 1 else 0 end,
      p_accuracy,
      'pending'
    );
  end if;

  if v_source_type = 'grammar_topic' then
    perform public.recalculate_user_topic_status(v_user_id, v_source_id);
  else
    update public.error_items
    set
      successful_repairs = case
        when p_success then successful_repairs + 1
        else 0
      end,
      repair_status = case
        when p_success and successful_repairs + 1 >= 2 then 'fixed'
        when p_success then 'improving'
        else 'scheduled'
      end,
      next_repair_at = case
        when p_success and successful_repairs + 1 >= 2 then null
        else now() + make_interval(days => coalesce(v_next_interval, 1))
      end
    where id = v_source_id
      and user_id = v_user_id
    returning grammar_topic_id into v_error_topic_id;

    if v_error_topic_id is not null then
      perform public.recalculate_user_topic_status(v_user_id, v_error_topic_id);
    end if;
  end if;
end;
$$;

create or replace function public.generate_daily_path(p_path_date date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_path_id uuid;
  v_focus_topic_id uuid;
  v_focus_level text;
  v_speaking_topic_id uuid;
  v_review_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.daily_path (user_id, path_date, status)
  values (v_user_id, p_path_date, 'open')
  on conflict (user_id, path_date)
  do update set updated_at = public.daily_path.updated_at
  returning id into v_path_id;

  if exists (
    select 1
    from public.daily_path_items dpi
    where dpi.daily_path_id = v_path_id
  ) then
    return v_path_id;
  end if;

  select uts.grammar_topic_id, gt.level
  into v_focus_topic_id, v_focus_level
  from public.user_topic_status uts
  join public.grammar_topics gt on gt.id = uts.grammar_topic_id
  where uts.user_id = v_user_id
    and uts.mastery_status <> 'automatic'
    and gt.is_active
  order by
    case uts.mastery_status
      when 'learning' then 1
      when 'usable' then 2
      when 'stable' then 3
      else 4
    end,
    uts.next_review_at nulls last,
    uts.automaticity_score,
    uts.updated_at
  limit 1;

  if v_focus_topic_id is null then
    select gt.id, gt.level
    into v_focus_topic_id, v_focus_level
    from public.grammar_topics gt
    where gt.is_active
    order by gt.level, gt.difficulty_score, gt.title
    limit 1;
  end if;

  select st.id
  into v_speaking_topic_id
  from public.speaking_topics st
  where st.is_active
    and st.level = v_focus_level
  order by md5(v_user_id::text || p_path_date::text || st.id::text)
  limit 1;

  select rq.id
  into v_review_id
  from public.review_queue rq
  where rq.user_id = v_user_id
    and rq.due_at <= now()
    and rq.status = 'pending'
  order by rq.due_at, rq.created_at
  limit 1;

  insert into public.daily_path_items (
    daily_path_id,
    item_order,
    item_type,
    grammar_topic_id,
    speaking_topic_id,
    review_queue_id,
    status,
    title,
    description
  )
  values
    (
      v_path_id, 1, 'recall', v_focus_topic_id, null, null, 'pending',
      'Regel aktiv abrufen',
      'Erkläre ohne nachzuschlagen, wann und wie diese Grammatik verwendet wird.'
    ),
    (
      v_path_id, 2, 'writing', v_focus_topic_id, null, null, 'locked',
      'Drei Sätze produzieren',
      'Bilde drei eigene vollständige Sätze mit der heutigen Zielgrammatik.'
    ),
    (
      v_path_id, 3, 'coach', v_focus_topic_id, v_speaking_topic_id, null, 'locked',
      'Coach-Gespräch',
      'Führe eine ausgewertete gesprochene Antwort mit der Zielgrammatik durch.'
    ),
    (
      v_path_id, 4, 'explanation', v_focus_topic_id, null, null, 'locked',
      'Korrektur verstehen',
      'Erkläre, was im korrigierten Satz verändert wurde und warum.'
    ),
    (
      v_path_id, 5, 'repair', v_focus_topic_id, null, null, 'locked',
      'Korrektur laut reparieren',
      'Sprich den korrigierten Satz zweimal laut, beim zweiten Mal ohne abzulesen.'
    ),
    (
      v_path_id, 6, 'transfer', v_focus_topic_id, v_speaking_topic_id, null, 'locked',
      'Transfer in neues Thema',
      'Verwende dieselbe Grammatik in einem neuen Thema oder einer neuen Situation.'
    ),
    (
      v_path_id, 7, 'review', v_focus_topic_id, null, v_review_id, 'locked',
      'Zeitversetzter Abruf',
      case
        when v_review_id is null
          then 'Rufe eine Übung der heutigen Grammatik unter Zeitdruck ab.'
        else 'Bearbeite die heute fällige Wiederholung.'
      end
    );

  return v_path_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.grammar_topics enable row level security;
alter table public.topic_examples enable row level security;
alter table public.speaking_topics enable row level security;
alter table public.user_topic_status enable row level security;
alter table public.attempts enable row level security;
alter table public.audio_assets enable row level security;
alter table public.attempt_errors enable row level security;
alter table public.error_items enable row level security;
alter table public.review_queue enable row level security;
alter table public.review_events enable row level security;
alter table public.daily_path enable row level security;
alter table public.daily_path_items enable row level security;

revoke all on table
  public.profiles,
  public.grammar_topics,
  public.topic_examples,
  public.speaking_topics,
  public.user_topic_status,
  public.attempts,
  public.audio_assets,
  public.attempt_errors,
  public.error_items,
  public.review_queue,
  public.review_events,
  public.daily_path,
  public.daily_path_items
from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (
  display_name,
  native_language,
  target_language,
  current_level
) on table public.profiles to authenticated;
grant select on table
  public.grammar_topics,
  public.topic_examples,
  public.speaking_topics,
  public.user_topic_status,
  public.error_items,
  public.review_queue,
  public.review_events
to authenticated;
grant select, insert on table public.attempts, public.attempt_errors to authenticated;
grant select, insert, update, delete on table public.audio_assets to authenticated;
grant select, insert on table public.daily_path to authenticated;
grant update (status) on table public.daily_path to authenticated;
grant select on table public.daily_path_items to authenticated;
grant update (status) on table public.daily_path_items to authenticated;

create policy profiles_select_own
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy grammar_topics_read_authenticated
on public.grammar_topics for select to authenticated
using (true);

create policy topic_examples_read_authenticated
on public.topic_examples for select to authenticated
using (true);

create policy speaking_topics_read_authenticated
on public.speaking_topics for select to authenticated
using (true);

create policy user_topic_status_select_own
on public.user_topic_status for select to authenticated
using (auth.uid() = user_id);

create policy attempts_select_own
on public.attempts for select to authenticated
using (auth.uid() = user_id);

create policy attempts_insert_own
on public.attempts for insert to authenticated
with check (auth.uid() = user_id);

create policy audio_assets_select_own
on public.audio_assets for select to authenticated
using (auth.uid() = user_id);

create policy audio_assets_insert_own
on public.audio_assets for insert to authenticated
with check (auth.uid() = user_id);

create policy audio_assets_update_own
on public.audio_assets for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy audio_assets_delete_own
on public.audio_assets for delete to authenticated
using (auth.uid() = user_id);

create policy attempt_errors_select_own
on public.attempt_errors for select to authenticated
using (
  exists (
    select 1
    from public.attempts a
    where a.id = attempt_errors.attempt_id
      and a.user_id = auth.uid()
  )
);

create policy attempt_errors_insert_own
on public.attempt_errors for insert to authenticated
with check (
  exists (
    select 1
    from public.attempts a
    where a.id = attempt_errors.attempt_id
      and a.user_id = auth.uid()
  )
);

create policy error_items_select_own
on public.error_items for select to authenticated
using (auth.uid() = user_id);

create policy review_queue_select_own
on public.review_queue for select to authenticated
using (auth.uid() = user_id);

create policy review_events_select_own
on public.review_events for select to authenticated
using (auth.uid() = user_id);

create policy daily_path_select_own
on public.daily_path for select to authenticated
using (auth.uid() = user_id);

create policy daily_path_insert_own
on public.daily_path for insert to authenticated
with check (auth.uid() = user_id);

create policy daily_path_update_own
on public.daily_path for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy daily_path_items_select_own
on public.daily_path_items for select to authenticated
using (
  exists (
    select 1
    from public.daily_path dp
    where dp.id = daily_path_items.daily_path_id
      and dp.user_id = auth.uid()
  )
);

create policy daily_path_items_update_own
on public.daily_path_items for update to authenticated
using (
  exists (
    select 1
    from public.daily_path dp
    where dp.id = daily_path_items.daily_path_id
      and dp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_path dp
    where dp.id = daily_path_items.daily_path_id
      and dp.user_id = auth.uid()
  )
);

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.ensure_user_topic_status(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mastery_mode_score(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.schedule_initial_review(uuid, uuid) from public, anon, authenticated;
revoke all on function public.recalculate_user_topic_status(uuid, uuid) from public, anon, authenticated;
revoke all on function public.handle_attempt_after_insert() from public, anon, authenticated;
revoke all on function public.validate_audio_asset() from public, anon, authenticated;
revoke all on function public.validate_attempt_error() from public, anon, authenticated;
revoke all on function public.upsert_error_item_from_attempt_error() from public, anon, authenticated;
revoke all on function public.validate_review_source() from public, anon, authenticated;
revoke all on function public.complete_review(uuid, uuid, boolean, numeric) from public, anon;
revoke all on function public.generate_daily_path(date) from public, anon;

grant execute on function public.complete_review(uuid, uuid, boolean, numeric) to authenticated;
grant execute on function public.generate_daily_path(date) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'automaticity-audio',
  'automaticity-audio',
  false,
  15728640,
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy automaticity_audio_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'automaticity-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy automaticity_audio_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'automaticity-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy automaticity_audio_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'automaticity-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'automaticity-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy automaticity_audio_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'automaticity-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

comment on table public.attempts is
  'Immutable learning attempts. client_event_id makes offline replays idempotent.';
comment on table public.review_events is
  'Immutable, idempotent review outcomes accepted only through complete_review().';
comment on function public.complete_review(uuid, uuid, boolean, numeric) is
  'Completes one owned review transactionally and schedules the next 1/3/7/14/30-day interval.';
