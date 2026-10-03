import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { detectAnswerLanguage } from "./evaluation";

const runtimeSource = readFileSync(
  new URL(
    "../../../apps/web/public/replacements/de/grammar-runtime.js",
    import.meta.url,
  ),
  "utf8",
);

interface TestElement {
  value: string;
  innerHTML: string;
  textContent: string;
  className: string;
  querySelectorAll: () => readonly never[];
  focus: () => void;
}

function grammarPage(
  expected: string,
  options: { open?: boolean; alternatives?: string[] } = {},
) {
  const storage = new Map<string, string>();
  const elements = new Map<string, TestElement>();
  const element = (selector: string): TestElement => {
    if (!elements.has(selector))
      elements.set(selector, {
        value: "",
        innerHTML: "",
        textContent: "",
        className: "",
        querySelectorAll: () => [],
        focus: () => {},
      });
    return elements.get(selector)!;
  };
  const fixture = {
    level: "A2",
    title: "Grammatik im Kontext",
    rule: "Formuliere die Bedeutung.",
    examples: [expected],
    exercises: [
      [
        "Antworte auf Deutsch.",
        expected,
        {
          mode: options.open ? "open_production" : "closed_recall",
          acceptedAnswers: options.alternatives ?? [],
          minimumSentences: 1,
        },
      ],
    ],
  };
  const context = {
    draftState: {
      assisted: false,
      markAssisted() {
        this.assisted = true;
      },
    },
    window: { GERMAN_GRAMMAR_UNITS: [fixture], location: { search: "" } },
    URLSearchParams,
    document: {
      querySelector: element,
      readyState: "loading",
      addEventListener: () => {},
    },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    harness: {} as {
      checkAnswer: () => Promise<void>;
      detectAnswerLanguage: (text: string) => string;
    },
  };
  // Load the actual runtime and expose its handler without starting unrelated UI setup.
  const instrumented = runtimeSource.replace(
    /\n\}\)\(\);\s*$/u,
    "\n drafts = draftState; globalThis.harness = { checkAnswer, detectAnswerLanguage };\n})();",
  );
  runInNewContext(instrumented, context);
  return {
    detect: context.harness.detectAnswerLanguage,
    storage,
    draftState: context.draftState,
    feedback: element("#feedback"),
    async answer(text: string) {
      element("#answerInput").value = text;
      element("#intentInput").value = options.open ? "معنی دلخواه" : "";
      await context.harness.checkAnswer();
    },
  };
}

describe("active Grammar-Labor answer handler", () => {
  it.each([
    ["Ich lese ein buch.", "Ich lese ein Buch."],
    ["Wir helfen ihnen.", "Wir helfen Ihnen."],
    ["Sie kommt?", "Sie kommt."],
    ["Ich weiß dass er kommt.", "Ich weiß, dass er kommt."],
  ])(
    "does not complete a changed orthographic answer: %s",
    async (answer, expected) => {
      const page = grammarPage(expected);
      await page.answer(answer);
      expect(page.feedback.className).toContain("bad");
      expect(page.draftState.assisted).toBe(true);
      expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
        false,
      );
    },
  );

  it.each([
    ["Die Tür ist offen.", "  Die  Tu\u0308r ist offen  "],
    ["geöffnet", "geöffnet"],
    ["Hotel", "Hotel"],
  ])(
    "completes canonical German forms without relying on language clues: %s",
    async (expected, answer) => {
      const page = grammarPage(expected);
      await page.answer(answer);
      expect(page.feedback.className).toContain("good");
      expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
        true,
      );
    },
  );

  it("accepts reviewed alternatives with different word order", async () => {
    const page = grammarPage("Heute bleibt sie zu Hause.", {
      alternatives: ["Sie bleibt heute zu Hause."],
    });
    await page.answer("Sie bleibt heute zu Hause.");
    expect(page.feedback.className).toContain("good");
  });

  it.each([
    "Hotel",
    "Bonjour tout le monde",
    "Ich have the book.",
    "A hat costs money.",
  ])("leaves unknown or mixed answers unassessed: %s", async (answer) => {
    const page = grammarPage("Ich lese ein Buch.");
    await page.answer(answer);
    expect(page.feedback.className).toBe("feedback show");
    expect(page.feedback.innerHTML).toContain("noch nicht bewertet");
    expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
      false,
    );
    expect(
      JSON.parse(
        page.storage.get("deutsch-automaticity:grammar-open-responses:v1")!,
      )[0].response,
    ).toBe(answer);
  });

  it("does not use an open task's inspiration to disambiguate the learner's language", async () => {
    const page = grammarPage("Hotel", { open: true });
    await page.answer("Hotel");
    expect(page.feedback.innerHTML).toContain("noch nicht bewertet");
    expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
      false,
    );
    expect(
      JSON.parse(
        page.storage.get("deutsch-automaticity:grammar-open-responses:v1")!,
      )[0].response,
    ).toBe("Hotel");
  });

  it("checks language without a topic-specific hint or completion", async () => {
    const page = grammarPage("Der Bericht wird geprüft.");
    await page.answer("Hello my friend");
    expect(page.feedback.className).toContain("bad");
    expect(page.feedback.innerHTML).not.toContain("Supermarkt");
    expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
      false,
    );
    expect(
      JSON.parse(
        page.storage.get("deutsch-automaticity:grammar-open-responses:v1")!,
      )[0].response,
    ).toBe("Hello my friend");
  });

  it("keeps corrupt response history and the unsaved answer when storage fails", async () => {
    const page = grammarPage("Ich bin hier.");
    const key = "deutsch-automaticity:grammar-open-responses:v1";
    page.storage.set(key, "{incomplete");
    await page.answer("Ich bin hier.");
    expect(page.storage.get(key)).toBe("{incomplete");
    expect(page.feedback.textContent).toContain("nicht gespeichert");
    expect(page.storage.has("deutsch-automaticity:grammar-progress:v3")).toBe(
      false,
    );
  });

  it("keeps domain and browser language decisions aligned on boundary cases", () => {
    const page = grammarPage("Danke");
    for (const text of [
      "",
      "Ja",
      "Berlin",
      "Danke",
      "Ich bin hier.",
      "Die Tür ist offen.",
      "The book is here.",
      "Ich have the book.",
      "A hat costs money.",
      "سلام",
      "سلام Ich",
      "مرحبا",
      "Привет",
      "quux",
      "Sie kommt?",
      "Ich\nbin hier.",
    ]) {
      expect(page.detect(text)).toBe(detectAnswerLanguage(text));
    }
  });
});
