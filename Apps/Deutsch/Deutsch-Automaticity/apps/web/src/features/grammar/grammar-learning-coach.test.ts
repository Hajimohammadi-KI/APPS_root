import { describe, expect, it } from "bun:test";

import {
  grammarCoachFor,
  isGrammarSupportLanguage,
} from "./grammar-learning-coach";

describe("grammar learning coach", () => {
  it("gives the case algorithm in German", () => {
    const coach = grammarCoachFor(
      { title: "Akkusativ mit bestimmten Artikeln", rule: "sehen + Akkusativ" },
      "de",
    );

    expect(coach.languageLabel).toBe("Deutsch");
    expect(coach.steps).toHaveLength(4);
    expect(coach.steps.join(" ")).toContain("Wer? Wen? Wem? Wessen?");
  });

  it("changes the learning algorithm for word order and tenses", () => {
    const wordOrder = grammarCoachFor(
      { title: "Nebensätze mit weil", rule: "Das Verb steht am Ende." },
      "de",
    );
    const tense = grammarCoachFor(
      { title: "Perfekt", rule: "haben oder sein + Partizip II" },
      "de",
    );

    expect(wordOrder.title).toContain("Satzbau");
    expect(tense.title).toContain("Zeiten");
  });

  it("supports German, English, and Persian HONOVR explanations", () => {
    expect(isGrammarSupportLanguage("fa")).toBe(true);
    expect(isGrammarSupportLanguage("en")).toBe(true);
    expect(isGrammarSupportLanguage("de")).toBe(true);
    expect(isGrammarSupportLanguage("fr")).toBe(false);

    const persian = grammarCoachFor(
      { title: "Akkusativ", rule: "sehen + Akkusativ" },
      "fa",
    );
    const english = grammarCoachFor(
      { title: "Nebensatz mit weil", rule: "Verb am Ende" },
      "en",
    );

    expect(persian.languageLabel).toBe("فارسی");
    expect(persian.steps.join(" ")).toContain("حالت");
    expect(english.languageLabel).toBe("English");
    expect(english.title).toContain("word-order");
  });
});
