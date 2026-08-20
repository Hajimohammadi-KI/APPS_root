import { describe, expect, test } from "bun:test";
import {
  countCompletedItems,
  countCompletedOutputs,
  countRequiredCompletedOutputs,
  estimatedLearningHours,
  getDayOutputStatus,
  getDayStatus,
  outputTotal,
  percentComplete,
  requiredOutputTotal,
} from "../lib/study-progress";

const day = { tasks: [{ items: [{ id: "a" }, { id: "b" }] }, { items: [{ id: "c" }] }] };

describe("study progress calculations", () => {
  test("counts only known completed items", () => {
    expect(countCompletedItems(day, new Set(["a", "missing"]))).toBe(1);
    expect(getDayStatus(day, new Set())).toBe("open");
    expect(getDayStatus(day, new Set(["a"]))).toBe("started");
    expect(getDayStatus(day, new Set(["a", "b", "c"]), 3)).toBe("done");
  });

  test("calculates bounded display values", () => {
    expect(percentComplete(3, 4)).toBe(75);
    expect(percentComplete(0, 0)).toBe(0);
    expect(estimatedLearningHours(9)).toBe(4);
    expect(estimatedLearningHours(-1)).toBe(0);
  });
});

describe("output-level progress", () => {
  const day = {
    tasks: [
      { items: [{ id: "a" }, { id: "b" }, { id: "c" }] },
      { items: [{ id: "d" }, { id: "e" }, { id: "f" }] },
      { items: [{ id: "g" }, { id: "h" }, { id: "i" }] },
    ],
  };

  test("counts at most three real outputs instead of nine checklist hints", () => {
    const completed = new Set(["a", "b", "c", "d"]);
    expect(outputTotal(day)).toBe(3);
    expect(countCompletedOutputs(day, completed)).toBe(1);
    expect(getDayOutputStatus(day, completed)).toBe("started");
  });

  test("keeps course-window work optional", () => {
    const optionalDay = { ...day, optionalDuringCourse: true };
    expect(requiredOutputTotal(optionalDay)).toBe(0);
    expect(countRequiredCompletedOutputs(optionalDay, new Set(["a", "b", "c"]))).toBe(0);
    expect(getDayOutputStatus(optionalDay, new Set(["a", "b", "c"]))).toBe("optional");
  });
});
