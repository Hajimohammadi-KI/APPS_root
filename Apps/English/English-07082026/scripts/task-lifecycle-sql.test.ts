import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  import.meta.dir,
  "../apps/api/database/migrations/002_task_definition_versioning.sql",
);
const sql = readFileSync(migrationPath, "utf8");

describe("Task Definition versioning SQL contract", () => {
  test("keeps legacy Attempt linkage nullable and explicitly forbids guessing", () => {
    expect(sql).toContain("alter table attempts add column if not exists task_version text");
    expect(sql).toContain("Never guess this value");
    expect(sql).not.toMatch(/alter table attempts\s+alter column task_version set not null/i);
  });

  test("uses a locked, optimistic, audited transition gateway", () => {
    expect(sql).toContain("create or replace function transition_task_version");
    expect(sql).toContain("for update;");
    expect(sql).toContain("p_expected_row_version");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = public, pg_temp");
    expect(sql).toContain("insert into task_lifecycle_events");
  });

  test("protects immutable definitions and append-only lifecycle events", () => {
    expect(sql).toContain("trg_prevent_published_task_mutation");
    expect(sql).toContain("trg_prevent_task_lifecycle_event_mutation");
    expect(sql).toContain("before update or delete on task_lifecycle_events");
    expect(sql).toContain("trg_record_initial_task_version_event");
  });

  test("provides history, duration, and stuck-task monitoring views", () => {
    expect(sql).toContain("create or replace view task_state_history_v");
    expect(sql).toContain("lead(occurred_at) over");
    expect(sql).toContain("create or replace view task_state_duration_metrics_v");
    expect(sql).toContain("average_completed_duration");
    expect(sql).toContain("create or replace view stuck_task_versions_v");
    expect(sql).toContain("create or replace view stuck_task_summary_v");
    expect(sql).toContain("create or replace view task_state_monitoring_data_quality_v");
    expect(sql).toContain("actor_display_name");
  });
});
