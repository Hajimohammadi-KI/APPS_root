import { describe, expect, test } from "bun:test";

import {
  DAILY_WORK_MODES,
  normalizeDailyWorkMode,
  workModeTaskMinutes,
} from "../lib/daily-work-mode";

describe("daily work modes", () => {
  test("keep all three research tasks while changing only the time budget", () => {
    expect(DAILY_WORK_MODES.rescue.taskMinutes).toEqual([4, 4, 4]);
    expect(DAILY_WORK_MODES.light.taskMinutes).toEqual([25, 25, 20]);
    expect(DAILY_WORK_MODES.full.taskMinutes).toEqual([70, 90, 50]);
    expect(Object.values(DAILY_WORK_MODES).map((mode) => mode.taskMinutes.length)).toEqual([3, 3, 3]);
  });

  test("uses the light mode for missing or invalid saved settings", () => {
    expect(normalizeDailyWorkMode(undefined)).toBe("light");
    expect(normalizeDailyWorkMode("invalid")).toBe("light");
    expect(normalizeDailyWorkMode("rescue")).toBe("rescue");
  });

  test("returns the matching task time", () => {
    expect(workModeTaskMinutes("full", 1)).toBe(90);
    expect(workModeTaskMinutes("rescue", 2)).toBe(4);
  });
});
