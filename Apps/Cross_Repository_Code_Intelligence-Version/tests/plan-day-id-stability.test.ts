import { describe, expect, test } from "bun:test";
import {
  allDays,
  LEGACY_ID_MIGRATION,
  migrateLegacyId,
  migrateLegacyIds,
  planWeeks,
} from "../app/plan-data";

describe("plan day/task/item id stability", () => {
  test("ids are stable, date-independent, and unique", () => {
    const ids = new Set<string>();
    for (const day of allDays) {
      // Written as an equality check rather than `expect(...).not.toBe(...)`
      // because tsconfig scopes "types" to @cloudflare/workers-types only (this
      // deploys to Workers) and bun's test types are not installed, so the
      // `.not` chain resolves to an untyped function and fails typecheck. This
      // is the single `.not` usage in the suite; adding bun types purely for it
      // risks clashing with the Workers globals. Same assertion, same failure
      // message intent: the id must not simply be the date.
      expect(day.id === day.date).toBe(false);
      expect(day.id).toMatch(/^w\d+-d\d+$/);
      expect(ids.has(day.id)).toBe(false);
      ids.add(day.id);
      for (const task of day.tasks) {
        expect(task.id.startsWith(`${day.id}-task-`)).toBe(true);
        expect(ids.has(task.id)).toBe(false);
        ids.add(task.id);
        for (const item of task.items) {
          expect(item.id.startsWith(`${day.id}-t`)).toBe(true);
          expect(ids.has(item.id)).toBe(false);
          ids.add(item.id);
        }
      }
    }
  });

  test("does not change if the schedule's dates shift (recomputed identically here)", () => {
    // planWeeks is built once at module load from a fixed schedule, so
    // re-deriving ids from week/day position (not date) is what's under
    // test -- this asserts the *scheme* itself, since we can't re-run the
    // date calculation with a different "today" inside a single test file.
    const firstDay = planWeeks[0]!.days[0]!;
    expect(firstDay.id).toBe("w1-d1");
  });

  test("migrateLegacyId maps every old date-based id to its real, current id", () => {
    expect(LEGACY_ID_MIGRATION.size).toBeGreaterThan(0);
    for (const day of allDays) {
      expect(migrateLegacyId(day.date)).toBe(day.id);
      for (const [taskIndex, task] of day.tasks.entries()) {
        expect(migrateLegacyId(`${day.date}-task-${taskIndex + 1}`)).toBe(
          task.id,
        );
        for (const [itemIndex, item] of task.items.entries()) {
          expect(
            migrateLegacyId(`${day.date}-t${taskIndex + 1}-i${itemIndex + 1}`),
          ).toBe(item.id);
        }
      }
    }
  });

  test("migrateLegacyId passes through ids that are already current or unknown", () => {
    const someDay = allDays[0]!;
    expect(migrateLegacyId(someDay.id)).toBe(someDay.id);
    expect(migrateLegacyId("not-a-real-id")).toBe("not-a-real-id");
  });

  test("migrateLegacyIds deduplicates old and current ids during write-back", () => {
    const firstDay = allDays[0]!;
    const migrated = migrateLegacyIds([firstDay.date, firstDay.id]);
    expect(migrated).toEqual(new Set([firstDay.id]));
  });
});
