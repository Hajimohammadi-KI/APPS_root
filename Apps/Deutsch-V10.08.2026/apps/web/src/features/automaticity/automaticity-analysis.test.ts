import { describe, expect, it } from "bun:test";

import {
  analyzeWeilClause,
  computeRestoredDraft,
  countWeilClauses,
  evaluatePracticeAnswer,
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

// Regression coverage for a confirmed, directly-executed exploit: the
// overlap-ratio check used to accept an answer sharing only the one marker
// word, ignoring the rest of the expected sentence -- including, in the
// worst case, the grammatical subject itself.
describe("evaluatePracticeAnswer lehnt eine falsche, unabhaengige Antwort ab", () => {
  it("lehnt eine falsche Person ab, die das einzige Inhaltswort trifft", () => {
    // Echter Übungsinhalt (packages/content/src/data/grammar.json:11-16):
    // Prompt "Korrigiere den Satz: Ich sein müde.", erwartet "Ich bin
    // müde." -- vor dem Fix reduzierte sich der Markerwort-Satz auf
    // {müde}, weil "ich"/"sein"/"bin" alle als Stoppwoerter galten. Diese
    // exakte Antwort wurde gegen die alte Funktion ausgefuehrt und ergab
    // true.
    const exercise = {
      prompt: "Korrigiere den Satz: Ich sein müde.",
      expected: "Ich bin müde.",
    };
    expect(evaluatePracticeAnswer("Du bist müde.", exercise)).toBe(false);
    expect(evaluatePracticeAnswer("Er ist müde.", exercise)).toBe(false);
  });

  it("akzeptiert weiterhin die tatsaechlich korrekte Antwort", () => {
    const exercise = {
      prompt: "Korrigiere den Satz: Ich sein müde.",
      expected: "Ich bin müde.",
    };
    expect(evaluatePracticeAnswer("Ich bin müde.", exercise)).toBe(true);
    expect(evaluatePracticeAnswer("ich bin müde", exercise)).toBe(true);
  });
});

describe("computeRestoredDraft", () => {
  // Regression coverage for a real bug: a once-only boolean guard
  // (`restoredRef`) on automaticity-lab.tsx's restore effect meant switching
  // Grammatik-Labor topic while the component stayed mounted never re-synced
  // journal/transcript to the new topic -- the previous topic's draft text
  // stayed in state and saveWriting() recorded it under the wrong topic.
  it("restauriert vor der Hydration nicht", () => {
    const draft = computeRestoredDraft(false, "a1-einheit", null, {
      "a1-einheit:journal": "gespeichertes journal",
    });
    expect(draft.shouldRestore).toBe(false);
  });

  it("stellt das gespeicherte Journal beim ersten Hydration-Zyklus wieder her", () => {
    const draft = computeRestoredDraft(true, "a1-einheit", null, {
      "a1-einheit:journal": "gespeichertes journal",
      "a1-einheit:transcript": "gespeichertes transkript",
    });
    expect(draft).toEqual({
      shouldRestore: true,
      journal: "gespeichertes journal",
      transcript: "gespeichertes transkript",
    });
  });

  it("stellt dasselbe Thema nicht bei jedem Render erneut wieder her", () => {
    const draft = computeRestoredDraft(true, "a1-einheit", "a1-einheit", {
      "a1-einheit:journal": "gespeichertes journal",
    });
    expect(draft.shouldRestore).toBe(false);
  });

  it("synchronisiert beim Themenwechsel auf den Entwurf des neuen Themas", () => {
    // Genau der Fall, den die boolesche Guard-Version falsch behandelte: sie
    // hätte hier shouldRestore: false zurückgegeben, weil *irgendeine*
    // Wiederherstellung bereits einmal stattgefunden hatte -- der Resttext von
    // "a1-einheit" wäre unter dem neuen Thema "a2-einheit" sichtbar geblieben.
    const draft = computeRestoredDraft(true, "a2-einheit", "a1-einheit", {
      "a1-einheit:journal": "rest vom vorherigen thema",
      "a2-einheit:journal": "eigener gespeicherter entwurf des neuen themas",
    });
    expect(draft.shouldRestore).toBe(true);
    expect(draft.journal).toBe(
      "eigener gespeicherter entwurf des neuen themas",
    );
  });

  it("setzt auf leer zurück, wenn das neue Thema noch keinen gespeicherten Entwurf hat", () => {
    const draft = computeRestoredDraft(true, "a2-einheit", "a1-einheit", {
      "a1-einheit:journal": "rest vom vorherigen thema",
      "a1-einheit:transcript": "rest-transkript",
    });
    expect(draft).toEqual({ shouldRestore: true, journal: "", transcript: "" });
  });
});
