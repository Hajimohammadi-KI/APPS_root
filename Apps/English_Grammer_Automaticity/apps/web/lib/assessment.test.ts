import { describe, expect, test } from "bun:test";
import { normalizeAppState } from "@/features/store/app-store";
import { evaluateResponse } from "@/lib/assessment";

const modalGrammar = {
  title: "Modal verbs",
  rule: "Use a modal verb before the base form.",
  examples: ["I can explain the result."],
};

describe("practice and mastery assessment", () => {
  test("allows sound offline practice without granting mastery evidence", async () => {
    const settings = normalizeAppState(null).settings;
    const result = await evaluateResponse(
      "I can explain the result clearly.",
      {
        grammar: modalGrammar,
        minWords: 5,
        requiredTargetUses: 1,
        taskPrompt: "Explain the result with a modal verb.",
      },
      { ...settings, onlineFeedback: false },
    );

    expect(result.pass).toBe(true);
    expect(result.masteryEligible).toBe(false);
    expect(result.relevant).toBe(true);
  });

  test("rejects repeated filler even when it contains the target form", async () => {
    const settings = normalizeAppState(null).settings;
    const result = await evaluateResponse(
      "can can can can can can",
      {
        grammar: modalGrammar,
        minWords: 5,
        requiredTargetUses: 1,
        taskPrompt: "Explain the result with a modal verb.",
      },
      { ...settings, onlineFeedback: false },
    );

    expect(result.pass).toBe(false);
    expect(result.relevant).toBe(false);
  });
});
