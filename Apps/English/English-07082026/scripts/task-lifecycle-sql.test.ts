import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  import.meta.dir,
  "../apps/api/database/migrations/002_task_definition_versioning.sql",
);
const sql = readFileSync(migrationPath, "utf8");

// IMPORTANT LIMITATION: this suite parses the migration's SQL text with
// regexes. It has never executed against a real PostgreSQL instance, so it
// cannot catch anything that only manifests at runtime -- actual transition
// behavior, RLS/grant enforcement, trigger firing order, concurrency, or
// query correctness. A prior version of this file only asserted that
// certain substrings existed (e.g. `toContain("security definer")` passed
// even though that same function had no EXECUTE lockdown behind it) and
// that gave false confidence. The checks below at least cross-reference
// the transition registry against the validator functions' own state
// checks -- static consistency, not proof of runtime correctness -- which
// is what actually caught the deprecated->published bug this suite used to
// miss. A real integration suite against a live/ephemeral Postgres is still
// needed before this migration should be trusted in production; that is
// tracked separately and deliberately not faked here.

function parseTransitionRows(source: string): Array<{ from: string; to: string }> {
  const valuesBlock = source.match(
    /insert into task_state_transitions[\s\S]*?values\s*([\s\S]*?)\non conflict/,
  )?.[1];
  if (!valuesBlock) throw new Error("Could not locate task_state_transitions seed rows.");
  const rowPattern = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'/g;
  const rows: Array<{ from: string; to: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(valuesBlock))) {
    const [, from, to] = match;
    if (from && to) rows.push({ from, to });
  }
  return rows;
}

function parsePublishAllowedStates(source: string): string[] {
  const fn = source.match(
    /create or replace function validate_task_for_publish[\s\S]*?\$\$;/,
  )?.[0];
  if (!fn) throw new Error("Could not locate validate_task_for_publish.");
  const list = fn.match(/lifecycle_state not in \(([^)]+)\)/)?.[1];
  if (!list) throw new Error("Could not locate validate_task_for_publish's allowed-state list.");
  return list.split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
}

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

  test("every registered *->published transition is actually reachable through validate_task_for_publish", () => {
    const rows = parseTransitionRows(sql);
    const allowedFromStates = parsePublishAllowedStates(sql);
    const publishTransitions = rows.filter((row) => row.to === "published");
    expect(publishTransitions.length).toBeGreaterThan(0);
    for (const row of publishTransitions) {
      expect(
        allowedFromStates,
        `transition ${row.from} -> published is registered but validate_task_for_publish rejects current state '${row.from}'`,
      ).toContain(row.from);
    }
  });

  test("locks EXECUTE on transition_task_version down to a named role, not PUBLIC", () => {
    expect(sql).toMatch(/revoke execute on function transition_task_version\(/);
    expect(sql).toMatch(/grant execute on function transition_task_version\([\s\S]*?to task_lifecycle_service/);
  });

  test("rejects direct table writes from PUBLIC on both lifecycle tables", () => {
    expect(sql).toMatch(/revoke insert, update, delete on task_lifecycle_events from public/);
    expect(sql).toMatch(/revoke insert, update, delete on task_versions from public/);
  });

  test("verifies the claimed actor against a session-set identity instead of trusting caller-supplied role blindly", () => {
    expect(sql).toContain("current_setting('app.current_actor_id', true)");
    expect(sql).toContain("current_setting('app.current_actor_role', true)");
    expect(sql).toContain("does not match the session-verified actor");
  });
});
