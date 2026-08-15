import { describe, expect, test } from "bun:test";
import { INTERVALS, addDays, computeNextInterval, isDueToday } from "../lib/recall/scheduler";

/** Local-midnight ISO string, matching what `addDays` produces. */
function localMidnight(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

describe("computeNextInterval", () => {
  test("promotes through the ladder on medium and good", () => {
    expect(computeNextInterval(1, "good")).toBe(3);
    expect(computeNextInterval(3, "good")).toBe(7);
    expect(computeNextInterval(7, "medium")).toBe(14);
    expect(computeNextInterval(14, "medium")).toBe(30);
  });

  test("stays at the top of the ladder", () => {
    expect(computeNextInterval(30, "good")).toBe(30);
  });

  test("resets to one day on weak recall", () => {
    for (const interval of INTERVALS) {
      expect(computeNextInterval(interval, "weak")).toBe(1);
    }
  });

  test("treats an unseeded entry as the first review", () => {
    // A new card has no reviews, so the hook passes 0.
    expect(computeNextInterval(0, "good")).toBe(1);
    expect(computeNextInterval(99, "good")).toBe(1);
  });
});

describe("addDays", () => {
  test("normalises to the start of the local day", () => {
    // Regression: an evening review must not fall due the next evening.
    const evening = new Date(2026, 7, 12, 21, 30).toISOString();
    const due = new Date(addDays(evening, 1));
    expect(due.getHours()).toBe(0);
    expect(due.getMinutes()).toBe(0);
    expect(due.getDate()).toBe(13);
  });

  test("crosses month boundaries", () => {
    const due = new Date(addDays(new Date(2026, 7, 25, 9).toISOString(), 14));
    expect(due.getMonth()).toBe(8); // September
    expect(due.getDate()).toBe(8);
  });
});

describe("isDueToday", () => {
  const now = new Date(2026, 7, 12, 8, 0); // 08:00 local, the morning check

  test("shows a card scheduled for today even before its original clock time", () => {
    expect(isDueToday(localMidnight(2026, 8, 12), now)).toBe(true);
  });

  test("shows overdue cards", () => {
    expect(isDueToday(localMidnight(2026, 8, 10), now)).toBe(true);
  });

  test("hides cards scheduled for a future day", () => {
    expect(isDueToday(localMidnight(2026, 8, 13), now)).toBe(false);
  });

  test("an evening review is due the next morning, not the next evening", () => {
    const reviewedAt = new Date(2026, 7, 11, 21, 30).toISOString();
    const nextDue = addDays(reviewedAt, 1);
    expect(isDueToday(nextDue, now)).toBe(true);
  });

  test("ignores an unparseable date instead of surfacing it", () => {
    expect(isDueToday("not-a-date", now)).toBe(false);
  });
});
