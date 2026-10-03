import { describe, expect, test } from "bun:test";
import { normalizeAppState } from "@/features/store/app-store";
import { evaluateResponse } from "@/lib/assessment";

const modalGrammar = {
  title: "Modal verbs",
  rule: "Use a modal verb before the base form.",
  examples: ["I can explain the result."],
};

const presentPerfectGrammar = {
  title: "Present perfect",
  rule: "Use have or has with a past participle for a result connected to now.",
  examples: ["I have just finished the task."],
};

describe("practice and mastery assessment", () => {
  test("recognizes am, is, and are as the verb-be target", async () => {
    const settings = normalizeAppState(null).settings;
    const result = await evaluateResponse(
      "Today my normal activity with a friend is a long conversation.",
      {
        grammar: {
          title: "Verb be: am/is/are",
          rule: "Use be to identify, describe, locate, and state age or condition.",
          examples: ["I am a student.", "She is tired."],
        },
        minWords: 3,
        requiredTargetUses: 1,
        taskPrompt: "Write one complete sentence about a normal activity today.",
      },
      { ...settings, onlineFeedback: false },
    );

    expect(result.targetUses).toBe(1);
    expect(result.relevant).toBe(true);
  });

  test("accepts a short direct answer without copied prompt words", async () => {
    const settings = normalizeAppState(null).settings;
    const result = await evaluateResponse(
      "I am tired.",
      {
        grammar: {
          title: "Verb be: am/is/are",
          rule: "Use be to identify, describe, locate, and state age or condition.",
          examples: ["I am a student.", "She is tired."],
        },
        minWords: 3,
        requiredTargetUses: 1,
        taskPrompt: "Write one complete sentence about a normal activity today.",
      },
      { ...settings, onlineFeedback: false },
    );

    expect(result.pass).toBe(true);
    expect(result.relevant).toBe(true);
  });

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

  test("rejects and repairs malformed Present Perfect even when LanguageTool reports no matches", async () => {
    const settings = normalizeAppState(null).settings;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          original: "I have not still an activity same hiking tried.",
          corrected: "I have not still an activity same hiking tried.",
          changed: false,
          online: true,
          matches: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    try {
      const result = await evaluateResponse(
        "I have not still an activity same hiking tried.",
        {
          grammar: presentPerfectGrammar,
          minWords: 3,
          requiredTargetUses: 1,
          taskPrompt:
            "At home, explain a recent result that is visible now, such as finishing a task.",
          inputMode: "written",
        },
        { ...settings, onlineFeedback: true },
      );

      expect(result.online).toBe(true);
      expect(result.pass).toBe(false);
      expect(result.grammarIssues.length).toBeGreaterThan(0);
      expect(result.targetUses).toBe(0);
      expect(result.relevant).toBe(false);
      expect(result.corrected).toBe(
        "I still have not tried the same hiking activity.",
      );
      expect(result.checkReasons.target).toContain("have/has");
      expect(result.taskExample).toContain("have just finished");
      expect(
        result.conversationFeedback.partB.pronunciation_score,
      ).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("recognizes a valid negative Present Perfect form", async () => {
    const settings = normalizeAppState(null).settings;
    const result = await evaluateResponse(
      "I still have not finished the task, so no result is visible.",
      {
        grammar: presentPerfectGrammar,
        minWords: 3,
        requiredTargetUses: 1,
        taskPrompt: "Explain a recent result that is visible now.",
      },
      { ...settings, onlineFeedback: false },
    );

    expect(result.targetUses).toBe(1);
    expect(result.relevant).toBe(true);
  });
});
