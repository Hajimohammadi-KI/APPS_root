import { describe, expect, test } from "bun:test";
import { grammarUnits } from "@grammar/content";

import {
  defaultGrammar,
  lessonExercises,
  lessonKey,
  lessonModel,
  shadowingStages,
} from "./lesson-content";

describe("automaticity lesson content", () => {
  test("present perfect keeps its authored key, exercises and model", () => {
    expect(defaultGrammar.title.toLowerCase()).toBe("present perfect");
    expect(lessonKey(defaultGrammar)).toBe("automaticity:present-perfect");
    expect(lessonExercises(defaultGrammar)).toHaveLength(3);
    expect(lessonModel(defaultGrammar)).toContain("I have worked");
  });

  test("other units derive a stable key and three exercises from the catalog", () => {
    const other = grammarUnits.find((unit) => unit !== defaultGrammar);
    if (!other) throw new Error("catalog has one unit");
    expect(lessonKey(other)).toMatch(/^automaticity:[a-z0-9-]+$/);
    expect(lessonKey(other).endsWith("-")).toBe(false);
    expect(lessonExercises(other).length).toBeLessThanOrEqual(3);
    for (const item of lessonExercises(other)) {
      expect(typeof item.prompt).toBe("string");
      expect(typeof item.expected).toBe("string");
    }
    expect(lessonModel(other).length).toBeGreaterThan(0);
  });

  test("shadowing has five stages", () => {
    expect(shadowingStages).toHaveLength(5);
  });
});
