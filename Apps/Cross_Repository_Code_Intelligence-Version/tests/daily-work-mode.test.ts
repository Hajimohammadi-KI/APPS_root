import { describe, expect, test } from "bun:test";

import {
  DAILY_WORK_MODES,
  effectivePlanHours,
  isTaskRequiredForMode,
  normalizeDailyWorkMode,
  workModeRequiredTaskIndexes,
  workModeTaskMinutes,
} from "../lib/daily-work-mode";

describe("daily work modes", () => {
  test("limits the real daily target while keeping optional guidance available", () => {
    expect(DAILY_WORK_MODES.rescue.taskMinutes).toEqual([0, 0, 12]);
    expect(DAILY_WORK_MODES.light.taskMinutes).toEqual([25, 0, 45]);
    expect(DAILY_WORK_MODES.full.taskMinutes).toEqual([70, 90, 50]);
    expect(Object.values(DAILY_WORK_MODES).map((mode) => mode.taskMinutes.length)).toEqual([3, 3, 3]);
    expect(workModeRequiredTaskIndexes("rescue")).toEqual([2]);
    expect(workModeRequiredTaskIndexes("light")).toEqual([0, 2]);
    expect(workModeRequiredTaskIndexes("full")).toEqual([0, 1, 2]);
    expect(isTaskRequiredForMode("light", 1)).toBeFalse();
    expect(isTaskRequiredForMode("light", 2)).toBeTrue();
  });

  test("uses the light mode for missing or invalid saved settings", () => {
    expect(normalizeDailyWorkMode(undefined)).toBe("light");
    expect(normalizeDailyWorkMode("invalid")).toBe("light");
    expect(normalizeDailyWorkMode("rescue")).toBe("rescue");
  });

  test("returns the matching task time", () => {
    expect(workModeTaskMinutes("full", 1)).toBe(90);
    expect(workModeTaskMinutes("rescue", 2)).toBe(12);
    expect(workModeTaskMinutes("light", 1)).toBe(0);
  });

  test("calculates a transparent whole-plan time budget", () => {
    expect(effectivePlanHours("rescue", 146)).toBe(29.2);
    expect(effectivePlanHours("light", 146)).toBe(170.3);
    expect(effectivePlanHours("full", 146)).toBe(511);
  });
});
