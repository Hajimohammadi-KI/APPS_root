import { describe, expect, test } from "bun:test";
import { normalizeAppState } from "@/features/store/app-store";
import { evaluateResponse } from "@/lib/assessment";
import { assessLessonOutput } from "@/lib/lesson-output-assessment";
import { buildAttemptVerticalSlice } from "@automaticity/learning-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssessmentSummary } from "@/features/components/assessment-summary";

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
        taskPrompt:
          "Write one complete sentence about a normal activity today.",
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
        taskPrompt:
          "Write one complete sentence about a normal activity today.",
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
      expect(result.conversationFeedback.partB.pronunciation_score).toBeNull();
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

describe("assessment API response validation", () => {
  const text = "I can explain the result clearly.";
  const valid = {
    original: text,
    corrected: text,
    changed: false,
    online: true,
    matches: [],
  };
  const invalidPayloads: Array<[string, unknown]> = [
    ["missing matches", { ...valid, matches: undefined }],
    ["null matches", { ...valid, matches: null }],
    ["non-array matches", { ...valid, matches: {} }],
    ["null match", { ...valid, matches: [null] }],
    [
      "invalid replacement",
      {
        ...valid,
        matches: [
          {
            message: "test",
            offset: 0,
            length: 1,
            replacements: [{ value: 5 }],
          },
        ],
      },
    ],
    [
      "out-of-bounds diagnostic",
      {
        ...valid,
        matches: [
          { message: "test", offset: 1000, length: 1, replacements: [] },
        ],
      },
    ],
    [
      "negative offset",
      {
        ...valid,
        matches: [{ message: "test", offset: -1, length: 1, replacements: [] }],
      },
    ],
    [
      "fractional length",
      {
        ...valid,
        matches: [
          { message: "test", offset: 0, length: 0.5, replacements: [] },
        ],
      },
    ],
    [
      "overlapping edits",
      {
        ...valid,
        matches: [
          {
            message: "test",
            offset: 0,
            length: 5,
            replacements: [{ value: "We" }],
          },
          {
            message: "test",
            offset: 2,
            length: 3,
            replacements: [{ value: "may" }],
          },
        ],
      },
    ],
    [
      "invalid context",
      {
        ...valid,
        matches: [
          {
            message: "test",
            offset: 0,
            length: 1,
            replacements: [],
            context: { text: "I", offset: 0, length: 2 },
          },
        ],
      },
    ],
    [
      "invalid category",
      {
        ...valid,
        matches: [
          {
            message: "test",
            offset: 0,
            length: 1,
            replacements: [],
            rule: { id: "TEST", category: { name: 5 } },
          },
        ],
      },
    ],
    ["non-boolean online", { ...valid, online: "true" }],
    ["different source", { ...valid, original: "Another response." }],
    [
      "inconsistent correction",
      { ...valid, corrected: "Another response.", changed: true },
    ],
    ["inconsistent change flag", { ...valid, changed: true }],
  ];

  for (const [name, payload] of [
    ["valid empty matches", valid],
    ...invalidPayloads,
  ] as Array<[string, unknown]>) {
    test(`${name} cannot silently change assessment trust`, async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () =>
        Response.json(payload)) as unknown as typeof fetch;
      try {
        const result = await evaluateResponse(
          text,
          { grammar: modalGrammar },
          {
            ...normalizeAppState(null).settings,
            onlineFeedback: true,
          },
        );
        expect(result.online).toBe(name === "valid empty matches");
        expect(result.masteryEligible).toBe(name === "valid empty matches");
        if (name !== "valid empty matches")
          expect(result.error).toContain("Invalid assessment API response");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  }

  test("accepts a valid correction and retains the original error evidence", async () => {
    const originalFetch = globalThis.fetch;
    const original = "  I can explains it.  ";
    globalThis.fetch = (async () =>
      Response.json({
        original,
        corrected: "  I can explain it.  ",
        changed: true,
        online: true,
        matches: [
          {
            message: "Use the base form after can.",
            offset: 8,
            length: 8,
            replacements: [{ value: "explain" }],
            rule: { id: "MODAL_BASE" },
          },
        ],
      })) as unknown as typeof fetch;
    try {
      const result = await evaluateResponse(
        original,
        { grammar: modalGrammar },
        {
          ...normalizeAppState(null).settings,
          onlineFeedback: true,
        },
      );
      expect(result.online).toBe(true);
      expect(result.corrected).toBe("  I can explain it.  ");
      expect(result.grammarIssues).toHaveLength(1);
      expect(result.masteryEligible).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("invalid JSON falls back to practice without mastery eligibility", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("{broken")) as unknown as typeof fetch;
    try {
      const result = await evaluateResponse(
        text,
        { grammar: modalGrammar },
        {
          ...normalizeAppState(null).settings,
          onlineFeedback: true,
        },
      );
      expect(result.online).toBe(false);
      expect(result.masteryEligible).toBe(false);
      expect(result.error).toContain("Online evaluation failed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("times out unavailable API requests without granting mastery", async () => {
    const originalFetch = globalThis.fetch;
    const originalSetTimeout = globalThis.setTimeout;
    let requestedTimeout = 0;
    globalThis.setTimeout = ((callback: () => void, delay: number) => {
      requestedTimeout = delay;
      return originalSetTimeout(callback, 1);
    }) as typeof setTimeout;
    globalThis.fetch = ((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      })) as typeof fetch;
    try {
      const result = await evaluateResponse(
        text,
        { grammar: modalGrammar },
        {
          ...normalizeAppState(null).settings,
          onlineFeedback: true,
        },
      );
      expect(result.online).toBe(false);
      expect(result.masteryEligible).toBe(false);
      expect(requestedTimeout).toBe(15_000);
    } finally {
      globalThis.fetch = originalFetch;
      globalThis.setTimeout = originalSetTimeout;
    }
  });
});

describe("lesson output caller integrity", () => {
  const examples = [
    {
      grammar: modalGrammar,
      text: "I can explain this choice today. I can describe the result clearly. We can practise our conversation together. She can discuss her plans tomorrow.",
    },
    {
      grammar: presentPerfectGrammar,
      text: "I have worked on this project today. I have finished the first report. She has given me useful feedback. We have written three clear examples. He has seen the final result. They have made a new plan.",
    },
  ];
  for (const example of examples) {
    for (const valid of [false, true]) {
      test(`${example.grammar.title} preserves ${valid ? "valid online" : "unassessed"} evidence through the lesson caller`, async () => {
        const originalFetch = globalThis.fetch;
        let requests = 0;
        globalThis.fetch = (async () => {
          requests += 1;
          return Response.json(
            valid
              ? {
                  original: example.text,
                  corrected: example.text,
                  changed: false,
                  online: true,
                  matches: [],
                }
              : {
                  original: example.text,
                  corrected: example.text,
                  changed: false,
                  online: true,
                },
          );
        }) as unknown as typeof fetch;
        try {
          const analysis = await assessLessonOutput(
            example.text,
            example.grammar,
            4,
            {
              ...normalizeAppState(null).settings,
              onlineFeedback: true,
            },
          );
          expect(requests).toBe(1);
          expect(analysis.verified).toBe(valid);
          expect(analysis.masteryEligible).toBe(valid);
          expect(analysis.corrected).toBe(example.text);
          const bundle = buildAttemptVerticalSlice({
            attemptId: "caller-regression",
            occurredAt: "2026-09-04T12:00:00.000Z",
            language: "en",
            contentVersion: "test",
            topic: example.grammar.title,
            mode: "writing",
            inputText: example.text,
            correctedText: analysis.corrected,
            targetHit: analysis.targetHit,
            accuracyScore: analysis.score,
            attemptVerified: analysis.verified,
            assessedBy: analysis.verified ? "online" : "offline",
            sessionMinutes: 15,
          });
          expect(bundle.evidence.verification.status).toBe(
            valid ? "verified" : "unverified",
          );
          // Provider validation establishes a checked response. This legacy
          // caller supplies no independent-attempt provenance.
          expect(bundle.evidence.masteryEligible).toBe(false);
        } finally {
          globalThis.fetch = originalFetch;
        }
      });
    }
  }

  test("an offline practice pass is labelled unassessed, without grammar or spelling checkmarks", async () => {
    const result = await evaluateResponse(
      "I can explain the result clearly.",
      { grammar: modalGrammar },
      {
        ...normalizeAppState(null).settings,
        onlineFeedback: false,
      },
    );
    expect(result.pass).toBe(true);
    const html = renderToStaticMarkup(
      createElement(AssessmentSummary, { result }),
    );
    expect(html).toContain('data-assessment="unassessed"');
    expect(html).toContain("Answer not assessed");
    expect(html).not.toContain("Answer accepted");
    expect(html).toContain("Not assessed:");
    expect(html).not.toContain("This task remains locked");
  });
});
