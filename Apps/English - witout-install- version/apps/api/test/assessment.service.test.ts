import { describe, expect, test } from "bun:test";
import {
  applyCorrections,
} from "../src/assessment/assessment.service";
import type { LanguageToolMatch } from "../src/assessment/assessment.contract";

function match(
  offset: number,
  length: number,
  replacement: string,
): LanguageToolMatch {
  return {
    length,
    message: "test",
    offset,
    replacements: [{ value: replacement }],
    rule: { id: "TEST" },
  };
}

describe("applyCorrections", () => {
  test("applies multiple LanguageTool replacements without offset drift", () => {
    const text = "She don't likes it.";
    const corrected = applyCorrections(text, [
      match(4, 5, "doesn't"),
      match(10, 5, "like"),
    ]);

    expect(corrected).toBe("She doesn't like it.");
  });

  test("ignores matches without a suggested replacement", () => {
    const text = "A sentence.";
    expect(
      applyCorrections(text, [
        {
          ...match(0, 1, ""),
          replacements: [],
        },
      ]),
    ).toBe(text);
  });
});
