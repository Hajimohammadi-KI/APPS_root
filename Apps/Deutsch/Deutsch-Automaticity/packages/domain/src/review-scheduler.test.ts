import { describe, expect, it } from "bun:test";

import {
  getNextReviewDate,
  getReviewProgressAfterResult,
  getReviewSchedule,
  REVIEW_INTERVAL_DAYS,
} from "./review-scheduler";

describe("review scheduler", () => {
  const completedAt = new Date("2026-07-27T08:00:00.000Z");

  it("uses the product's five review intervals", () => {
    expect(REVIEW_INTERVAL_DAYS).toEqual([1, 3, 7, 14, 30]);
    expect(
      getReviewSchedule(completedAt).map((date) => date.toISOString()),
    ).toEqual([
      "2026-07-28T08:00:00.000Z",
      "2026-07-30T08:00:00.000Z",
      "2026-08-03T08:00:00.000Z",
      "2026-08-10T08:00:00.000Z",
      "2026-08-26T08:00:00.000Z",
    ]);
  });

  it("returns no next review after the schedule is complete", () => {
    expect(getNextReviewDate(completedAt, 5)).toBeNull();
  });

  it("advances successful reviews and shortens failed intervals", () => {
    expect(
      getReviewProgressAfterResult(1, true, completedAt).dueAt?.toISOString(),
    ).toBe("2026-08-03T08:00:00.000Z");
    expect(
      getReviewProgressAfterResult(3, false, completedAt).dueAt?.toISOString(),
    ).toBe("2026-08-03T08:00:00.000Z");
  });

  it("adapts the next interval to retrieval confidence", () => {
    expect(
      getReviewProgressAfterResult(
        1,
        true,
        completedAt,
        "hard",
      ).dueAt?.toISOString(),
    ).toBe("2026-07-30T08:00:00.000Z");
    expect(
      getReviewProgressAfterResult(
        1,
        true,
        completedAt,
        "easy",
      ).dueAt?.toISOString(),
    ).toBe("2026-08-10T08:00:00.000Z");
  });
});
