import { describe, expect, test } from "bun:test";
import { countCompletedItems, estimatedLearningHours, getDayStatus, percentComplete } from "../lib/study-progress";

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
