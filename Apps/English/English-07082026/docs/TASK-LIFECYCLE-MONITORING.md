# Task Lifecycle Monitoring

Status: Phase 1 database contract  
Migration: `apps/api/database/migrations/002_task_definition_versioning.sql`

## What the dashboard measures

The lifecycle ledger is the audit source. `task_versions.lifecycle_state` is the fast current-state projection; monitoring durations are reconstructed from ordered `task_lifecycle_events`.

| Dashboard surface | SQL source | Meaning |
|---|---|---|
| Average time by State | `task_state_duration_metrics_v` | Average and median of completed visits, plus current count and maximum observed duration |
| Stuck count by State | `stuck_task_summary_v` | Number over the configured State threshold and the oldest stuck duration |
| Stuck Task detail | `stuck_task_versions_v` | Exact Task Version, State entry time, duration, threshold, severity, and actor |
| Task history | `task_state_history_v` | Every State visit with entered/exited time, duration, reason, user/service identity, and release metadata |
| Ledger integrity | `task_state_monitoring_data_quality_v` | Current Task states that are missing from or disagree with the append-only ledger; this View must be empty |

The official Task lifecycle has no `processing` State. Long-running authoring/release work is monitored through `in_review`, `approved`, `scheduled`, and `blocked`. If asynchronous assessment processing is introduced, it should receive a separate attempt/assessment processing state machine rather than overloading Task publication states.

## Dashboard queries

### 1. Average time in each State

```sql
select
  lifecycle_state,
  completed_state_visits,
  currently_in_state,
  average_completed_duration,
  median_completed_duration,
  maximum_observed_duration
from task_state_duration_metrics_v
order by lifecycle_state;
```

The average and median use only completed State visits. The maximum includes current visits, so an active stuck Task remains visible.

### 2. Stuck counters

```sql
select
  lifecycle_state,
  severity,
  stuck_task_count,
  oldest_stuck_duration
from stuck_task_summary_v
order by
  case severity when 'critical' then 0 else 1 end,
  stuck_task_count desc;
```

### 3. Stuck Task drill-down

```sql
select
  task_id,
  task_version,
  lifecycle_state,
  state_entered_at,
  stuck_for,
  max_duration,
  severity,
  entered_by_name,
  entered_by_kind,
  entered_by_role,
  reason_code,
  notes
from stuck_task_versions_v
order by
  case severity when 'critical' then 0 else 1 end,
  stuck_for desc;
```

### 4. Full history for one Task Version

```sql
select
  sequence_number,
  previous_state,
  lifecycle_state,
  entered_at,
  exited_at,
  time_in_state,
  is_current,
  actor_display_name,
  actor_kind,
  actor_role,
  reason_code,
  notes,
  app_version,
  task_schema_version,
  definition_checksum
from task_state_history_v
where task_id = $1 and task_version = $2
order by sequence_number;
```

`actor_display_name` is snapshotted into the event at transition time. It can therefore show either a person's name or a stable service label such as `task-publisher-prod`, even if an identity directory changes later.

## Threshold administration

Defaults are seeded conservatively and must be calibrated from actual workflow data:

```sql
select *
from task_state_monitoring_thresholds
order by lifecycle_state;
```

Change a threshold through an admin migration or controlled admin API and record who changed it:

```sql
update task_state_monitoring_thresholds
set
  max_duration = interval '72 hours',
  severity = 'warning',
  updated_at = now(),
  updated_by = 'user:release-manager-id'
where lifecycle_state = 'in_review';
```

## Alert rules

- Critical: any row in `stuck_task_summary_v` with `severity = 'critical'`.
- Warning: an increasing `stuck_task_count` for two consecutive observation windows.
- Data-quality alert: a `task_versions` current State with no matching current row in `task_state_history_v`.
- Data-quality check: `select * from task_state_monitoring_data_quality_v;` must return zero rows.
- Concurrency alert: repeated SQLSTATE `40001` from `transition_task_version`; the caller must reload and retry from the new State, never blindly repeat stale input.

## Operational safety

- Application roles receive `EXECUTE` on the transition RPC, not direct `UPDATE` on lifecycle tables.
- The transition function uses both `FOR UPDATE` and `row_version`.
- Event rows are append-only and store actor, reason, app version, schema version, and definition checksum.
- Monitoring views are read-only derivations; deleting or editing events to improve dashboard numbers is forbidden.
- Legacy Attempts keep `task_version = NULL` unless exact provenance is known. Monitoring does not backfill or reinterpret learner Evidence.
