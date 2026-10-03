import { expect, test } from "bun:test";
import { resolve } from "node:path";

const migrationPath = resolve(
  import.meta.dir,
  "../supabase/migrations/202607280001_automaticity_foundation.sql",
);
const seedPath = resolve(import.meta.dir, "../supabase/seed.sql");
const migration = await Bun.file(migrationPath).text();
const seed = await Bun.file(seedPath).text();

const learnerTables = [
  "profiles",
  "user_topic_status",
  "attempts",
  "audio_assets",
  "attempt_errors",
  "error_items",
  "review_queue",
  "review_events",
  "daily_path",
  "daily_path_items",
] as const;

test("enables RLS for every learner-owned table", () => {
  for (const table of learnerTables) {
    expect(migration).toContain(
      `alter table public.${table} enable row level security;`,
    );
  }

  expect(migration).toContain("from public, anon, authenticated;");
  expect(migration).toContain(
    "grant select, insert on table public.attempts, public.attempt_errors to authenticated;",
  );
});

test("keeps offline event writes and review retries idempotent", () => {
  expect(migration).toContain("unique (user_id, client_event_id)");
  expect(migration).toContain(
    "create unique index uq_review_queue_pending_source",
  );
  expect(migration).toContain(
    "on conflict (user_id, client_event_id) do nothing",
  );
  expect(migration).toContain("for update;");
});

test("keeps the complete automaticity and review gates in SQL", () => {
  for (const threshold of [
    "v_recognition >= 85",
    "v_writing >= 80",
    "v_speaking >= 80",
    "v_repair >= 80",
    "v_transfer >= 75",
    "v_successful_reviews >= 2",
    "v_active_critical_errors = 0",
    "v_median_latency <= 8000",
  ]) {
    expect(migration).toContain(threshold);
  }

  expect(migration).toContain(
    "interval_days integer not null check (interval_days in (1, 3, 7, 14, 30))",
  );
});

test("seeds the preserved curriculum exactly once per catalog item", () => {
  expect(seed.match(/^insert into public\.grammar_topics/gm)?.length).toBe(144);
  expect(seed.match(/^insert into public\.speaking_topics/gm)?.length).toBe(79);
});
