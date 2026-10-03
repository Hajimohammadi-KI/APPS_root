import { describe, expect, it } from "bun:test";

import {
  analyzeWeilClause,
  countWeilClauses,
  practiceAnswerMatches,
} from "./automaticity-analysis";

describe("weil-Nebensatz Offline-Analyse", () => {
  it("zählt weil-Nebensätze", () => {
    expect(
      countWeilClauses(
        "Ich lerne, weil ich sicherer sprechen möchte. Ich schreibe, weil das hilft.",
      ),
    ).toBe(2);
  });

  it("akzeptiert sechs Sätze mit vier korrekten Zielstrukturen", () => {
    const result = analyzeWeilClause(
      "Ich übe heute, weil ich sicherer sprechen möchte. Ich schreibe Beispiele, weil ich die Regel behalten will. Ich höre zu, weil gute Aussprache wichtig ist. Ich wiederhole den Text, weil mir das Rhythmus gibt. Danach spreche ich frei. Morgen mache ich weiter.",
    );

    expect(result.sentenceCount).toBe(6);
    expect(result.targetUses).toBe(4);
    expect(result.targetHit).toBe(true);
  });

  it("erkennt die typische falsche Verbstellung", () => {
    const result = analyzeWeilClause(
      "Ich bleibe zu Hause, weil ich bin krank.",
    );

    expect(result.issues.some((issue) => issue.code === "word_order")).toBe(
      true,
    );
  });

  it("erkennt ein fehlendes Komma", () => {
    const result = analyzeWeilClause("Ich lerne weil ich morgen Zeit habe.");

    expect(result.issues.some((issue) => issue.code === "missing_comma")).toBe(
      true,
    );
  });

  it("normalisiert Satzzeichen in kontrollierten Antworten", () => {
    expect(
      practiceAnswerMatches(
        "Ich bleibe zu Hause, weil ich krank bin.",
        "ich bleibe zu hause, weil ich krank bin",
      ),
    ).toBe(true);
  });
});
