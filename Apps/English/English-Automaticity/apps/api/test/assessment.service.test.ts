import { afterEach, describe, expect, test } from "bun:test";
import {
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  applyCorrections,
  AssessmentService,
} from "../src/assessment/assessment.service";
import type { LanguageToolMatch } from "../src/assessment/assessment.contract";
import { assessmentRequestSchema } from "../src/assessment/assessment.contract";

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

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
});

function upstream(payload: unknown) {
  globalThis.fetch = (async () =>
    Response.json(payload)) as unknown as typeof fetch;
}

describe("assessment provider boundary", () => {
  const text = "I can explain it.";
  const input = { text, language: "en-US" as const };

  test("preserves submitted whitespace and its correction offsets", async () => {
    const original = "  I can explain it.  ";
    const request = assessmentRequestSchema.parse({ text: original });
    upstream({ matches: [match(2, 1, "We")] });
    const result = await new AssessmentService().assess(request);
    expect(result.original).toBe(original);
    expect(result.corrected).toBe("  We can explain it.  ");
    expect(assessmentRequestSchema.safeParse({ text: " \n " }).success).toBe(
      false,
    );
  });

  test("accepts a valid empty result", async () => {
    upstream({ matches: [], language: { code: "en-US" } });
    expect(await new AssessmentService().assess(input)).toEqual({
      original: text,
      corrected: text,
      changed: false,
      online: true,
      matches: [],
    });
  });

  test("accepts optional LanguageTool metadata and preserves diagnostics without replacement values", async () => {
    upstream({
      matches: [
        {
          message: "Review this wording.",
          offset: 0,
          length: 1,
          replacements: [{}],
        },
      ],
    });
    const result = await new AssessmentService().assess(input);
    expect(result.corrected).toBe(text);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.replacements).toEqual([]);
  });

  test("accepts documented rule/context fields and ignores additional provider metadata", async () => {
    upstream({
      software: { name: "LanguageTool", apiVersion: 1 },
      matches: [
        {
          ...match(0, 1, "We"),
          shortMessage: "",
          sentence: text,
          context: { text, offset: 0, length: 1 },
          rule: {
            id: "TEST",
            subId: "1",
            description: "Test rule",
            urls: [],
            issueType: "grammar",
            category: {},
          },
        },
      ],
    });
    const result = await new AssessmentService().assess(input);
    expect(result.corrected).toBe("We can explain it.");
    expect(result.matches[0]?.context?.text).toBe(text);
    expect(result.matches[0]?.rule?.category).toEqual({});
  });

  const malformed: Array<[string, unknown]> = [
    ["missing matches", {}],
    ["null matches", { matches: null }],
    ["non-array matches", { matches: {} }],
    ["null match", { matches: [null] }],
    [
      "missing replacements",
      { matches: [{ message: "test", offset: 0, length: 1 }] },
    ],
    [
      "non-string replacement",
      { matches: [{ ...match(0, 1, "We"), replacements: [{ value: 5 }] }] },
    ],
    [
      "null replacement",
      { matches: [{ ...match(0, 1, "We"), replacements: [null] }] },
    ],
    ["negative offset", { matches: [match(-1, 1, "We")] }],
    ["fractional offset", { matches: [match(0.5, 1, "We")] }],
    ["negative length", { matches: [match(0, -1, "We")] }],
    ["fractional length", { matches: [match(0, 0.5, "We")] }],
    ["offset after source", { matches: [match(text.length + 1, 0, "!")] }],
    ["span after source", { matches: [match(text.length - 1, 2, "!")] }],
    [
      "invalid diagnostic span",
      { matches: [{ ...match(-1, 1, ""), replacements: [] }] },
    ],
    ["overlapping edits", { matches: [match(0, 5, "We"), match(2, 3, "may")] }],
    [
      "duplicate insertion positions",
      { matches: [match(0, 0, "Yes, "), match(0, 0, "Well, ")] },
    ],
    ["invalid rule", { matches: [{ ...match(0, 1, "We"), rule: { id: 3 } }] }],
    [
      "invalid context bounds",
      {
        matches: [
          {
            ...match(0, 1, "We"),
            context: { text: "I", offset: 1, length: 2 },
          },
        ],
      },
    ],
  ];
  for (const [name, payload] of malformed) {
    test(`rejects ${name} instead of reporting a clean assessment`, async () => {
      upstream(payload);
      await expect(
        new AssessmentService().assess(input),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  }

  test("supports deletion, boundary insertion and adjacent edits", async () => {
    upstream({
      matches: [match(0, 1, "We"), match(1, 1, ""), match(text.length, 0, "!")],
    });
    const result = await new AssessmentService().assess(input);
    expect(result.corrected).toBe("Wecan explain it.!");
    expect(result.changed).toBe(true);
  });

  test("retains overlapping diagnostics with no automatic replacement", async () => {
    const diagnostic = { ...match(0, 5, ""), replacements: [] };
    upstream({ matches: [diagnostic, match(0, 1, "We")] });
    const result = await new AssessmentService().assess(input);
    expect(result.matches).toHaveLength(2);
    expect(result.corrected).toBe("We can explain it.");
  });

  test("rejects invalid JSON as an invalid upstream response", async () => {
    globalThis.fetch = (async () =>
      new Response("{broken")) as unknown as typeof fetch;
    await expect(new AssessmentService().assess(input)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  test("keeps HTTP upstream failures distinct from a valid result", async () => {
    globalThis.fetch = (async () =>
      new Response("unavailable", { status: 500 })) as unknown as typeof fetch;
    await expect(new AssessmentService().assess(input)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  test("aborts timed-out requests and reports unavailable assessment", async () => {
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
    await expect(new AssessmentService().assess(input)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(requestedTimeout).toBe(12_000);
  });
});
