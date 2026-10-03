create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  external_subject text not null unique,
  display_name text,
  native_language text,
  target_language text not null default 'en',
  current_level text check (current_level in ('A1','A2','B1','B2','C1','C2')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grammar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  category text not null,
  short_rule text not null,
  long_rule text,
  examples jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  difficulty_score integer not null default 1 check (difficulty_score between 1 and 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speaking_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  track text not null,
  skill text not null,
  category text not null,
  prompt_text text not null,
  followup_prompts jsonb not null default '[]'::jsonb,
  target_grammar text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_topic_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  grammar_topic_id uuid not null references grammar_topics(id) on delete cascade,
  mastery_status text not null default 'new'
    check (mastery_status in ('new','learning','usable','stable','automatic')),
  recognition_score numeric(5,2) not null default 0 check (recognition_score between 0 and 100),
  writing_score numeric(5,2) not null default 0 check (writing_score between 0 and 100),
  speaking_score numeric(5,2) not null default 0 check (speaking_score between 0 and 100),
  repair_score numeric(5,2) not null default 0 check (repair_score between 0 and 100),
  transfer_score numeric(5,2) not null default 0 check (transfer_score between 0 and 100),
  automaticity_score numeric(5,2) not null default 0 check (automaticity_score between 0 and 100),
  active_error_count integer not null default 0,
  times_seen integer not null default 0,
  successful_reviews integer not null default 0,
  median_latency_ms integer,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, grammar_topic_id)
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  grammar_topic_id uuid references grammar_topics(id) on delete set null,
  speaking_topic_id uuid references speaking_topics(id) on delete set null,
  mode text not null
    check (mode in ('recognition','writing','speaking','repair','transfer','timed')),
  prompt_text text,
  input_text text not null,
  corrected_text text,
  target_hit boolean not null default false,
  accuracy_score numeric(5,2) not null default 0 check (accuracy_score between 0 and 100),
  fluency_score numeric(5,2) not null default 0 check (fluency_score between 0 and 100),
  latency_ms integer,
  assessment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists attempt_errors (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  grammar_topic_id uuid references grammar_topics(id) on delete set null,
  error_class text not null
    check (error_class in ('word_order','case','article','auxiliary','ending','tense','agreement','spelling','other')),
  original_fragment text not null,
  corrected_fragment text not null,
  explanation_text text,
  severity integer not null default 1 check (severity between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists error_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  grammar_topic_id uuid references grammar_topics(id) on delete set null,
  error_class text not null
    check (error_class in ('word_order','case','article','auxiliary','ending','tense','agreement','spelling','other')),
  canonical_original text not null,
  canonical_corrected text not null,
  explanation_text text,
  occurrence_count integer not null default 1,
  repair_status text not null default 'new'
    check (repair_status in ('new','scheduled','improving','fixed')),
  repair_stage integer not null default 0 check (repair_stage between 0 and 6),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  next_repair_at timestamptz,
  unique (
    user_id,
    grammar_topic_id,
    error_class,
    canonical_original,
    canonical_corrected
  )
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  source_type text not null check (source_type in ('grammar_topic','error_item')),
  source_id uuid not null,
  review_mode text not null check (review_mode in ('mixed','repair','production','timed')),
  interval_days integer not null check (interval_days in (1,3,7,14,30)),
  due_at timestamptz not null,
  success_streak integer not null default 0,
  stability_score numeric(5,2) not null default 0 check (stability_score between 0 and 100),
  last_reviewed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','done','missed','rescheduled')),
  created_at timestamptz not null default now()
);

create table if not exists audio_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  attempt_id uuid not null references attempts(id) on delete cascade,
  storage_key text not null,
  duration_seconds numeric(8,2),
  transcript_text text,
  corrected_transcript_text text,
  repetition_status text not null default 'new'
    check (repetition_status in ('new','listened','repeated')),
  keep_local_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists daily_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  path_date date not null,
  status text not null default 'open'
    check (status in ('open','in_progress','completed','skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, path_date)
);

create table if not exists daily_path_items (
  id uuid primary key default gen_random_uuid(),
  daily_path_id uuid not null references daily_paths(id) on delete cascade,
  item_order integer not null,
  item_type text not null
    check (item_type in ('warmup','recall','writing','speaking','repair','transfer','review','coach','timed')),
  grammar_topic_id uuid references grammar_topics(id) on delete set null,
  speaking_topic_id uuid references speaking_topics(id) on delete set null,
  review_queue_id uuid references review_queue(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','done','locked','skipped')),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (daily_path_id, item_order)
);

create index if not exists idx_user_topic_status_user
  on user_topic_status(user_id);
create index if not exists idx_user_topic_status_next_review
  on user_topic_status(user_id, next_review_at);
create index if not exists idx_attempts_user_created
  on attempts(user_id, created_at desc);
create index if not exists idx_attempts_topic
  on attempts(grammar_topic_id);
create index if not exists idx_attempt_errors_attempt
  on attempt_errors(attempt_id);
create index if not exists idx_error_items_user_status
  on error_items(user_id, repair_status, next_repair_at);
create index if not exists idx_review_queue_user_due
  on review_queue(user_id, due_at, status);
create index if not exists idx_daily_paths_user_date
  on daily_paths(user_id, path_date);
create index if not exists idx_daily_path_items_path_order
  on daily_path_items(daily_path_id, item_order);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on app_users;
create trigger app_users_set_updated_at
before update on app_users
for each row execute function set_updated_at();

drop trigger if exists grammar_topics_set_updated_at on grammar_topics;
create trigger grammar_topics_set_updated_at
before update on grammar_topics
for each row execute function set_updated_at();

drop trigger if exists speaking_topics_set_updated_at on speaking_topics;
create trigger speaking_topics_set_updated_at
before update on speaking_topics
for each row execute function set_updated_at();

drop trigger if exists user_topic_status_set_updated_at on user_topic_status;
create trigger user_topic_status_set_updated_at
before update on user_topic_status
for each row execute function set_updated_at();
