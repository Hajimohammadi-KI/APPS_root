import { describe, expect, test } from "bun:test";
import { rescheduleAfterPause } from "../lib/project-schedule";

describe("resilient project schedule", () => {
  test("moves the plan by the exact pause duration and recalculates its end", () => {
    const result = rescheduleAfterPause({
      planStartDate: "2026-08-07",
      pausedAt: "2026-08-10",
      resumeDate: "2026-08-15",
      calculateEnd: (start) => start === "2026-08-12" ? "2027-02-18" : "wrong",
    });
    expect(result).toEqual({
      pauseDays: 5,
      planStartDate: "2026-08-12",
      planEndDate: "2027-02-18",
    });
  });

  test("never moves a plan backwards", () => {
    const result = rescheduleAfterPause({
      planStartDate: "2026-08-07",
      pausedAt: "2026-08-10",
      resumeDate: "2026-08-09",
      calculateEnd: () => "2027-02-13",
    });
    expect(result.pauseDays).toBe(0);
    expect(result.planStartDate).toBe("2026-08-07");
  });
});
