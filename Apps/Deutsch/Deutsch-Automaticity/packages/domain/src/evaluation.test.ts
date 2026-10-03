import { describe, expect, it } from "bun:test";

import {
  analyzeClosedAnswer,
  detectAnswerLanguage,
  evaluateAnswer,
  getTaskIssues,
  targetEvidencePresent,
} from "./evaluation";

const perfekt = {
  title: "Perfekt",
  rule: "haben oder sein + Partizip II",
  examples: ["Ich bin nach Berlin gefahren."],
} as const;

describe("answer language and orthography boundaries", () => {
  it.each([
    "Hello my friend",
    "Bonjour tout le monde",
    "Hola amigo",
    "Alex",
    "Hotel",
    "quux blorp",
    "A hat costs money.",
  ])("does not assume arbitrary Latin input is German: %s", (text) =>
    expect(detectAnswerLanguage(text)).not.toBe("de"),
  );

  it.each([
    "Ich arbeite mit einer erfahrenen Kollegin.",
    "Gestern hat er das Fenster geöffnet.",
    "Obwohl es regnet, gehen wir spazieren.",
    "Der Bericht muss geprüft werden.",
    "Könnten Sie mir bitte helfen?",
  ])("recognises German evidence across constructions: %s", (text) => {
    expect(detectAnswerLanguage(text)).toBe("de");
  });

  it("keeps mixed and unknown language unassessed even if the provider reports no errors", () => {
    for (const text of [
      "Hotel",
      "Bonjour tout le monde",
      "Ich have the book.",
      "A hat costs money.",
    ]) {
      const report = evaluateAnswer(text, perfekt, "free", {
        matches: [],
        online: true,
      });
      expect(report).toMatchObject({
        status: "language_uncertain",
        answerLanguage: "other",
        accuracyScore: null,
        verified: false,
        ok: false,
        targetHit: false,
      });
      expect(
        report.issues.some(
          (issue) => issue.category === "wrong_output_language",
        ),
      ).toBe(false);
    }
  });

  it("uses authored closed alternatives to assess short ambiguous forms", () => {
    for (const answer of ["Hotel", "Danke", "geöffnet", "Berlin"]) {
      expect(analyzeClosedAnswer(answer, answer)).toMatchObject({
        correct: true,
        status: "correct",
      });
    }
    expect(analyzeClosedAnswer("Morgen", "Heute", ["Morgen"]).correct).toBe(
      true,
    );
    expect(analyzeClosedAnswer("Hotel", "Bahnhof")).toMatchObject({
      correct: null,
      status: "language_uncertain",
    });
  });

  it.each([
    ["Ich lese ein buch.", "Ich lese ein Buch."],
    ["Wir helfen ihnen.", "Wir helfen Ihnen."],
    ["das Lernen macht Spaß.", "Das Lernen macht Spaß."],
    ["Sie kommt?", "Sie kommt."],
    ["Ich weiß dass er kommt.", "Ich weiß, dass er kommt."],
  ])("preserves meaningful orthography: %s", (answer, expected) => {
    expect(analyzeClosedAnswer(answer, expected).correct).toBe(false);
  });

  it("allows whitespace, canonical Unicode and an optional final full stop", () => {
    expect(
      analyzeClosedAnswer("  Die  Tu\u0308r ist offen  ", "Die Tür ist offen.")
        .correct,
    ).toBe(true);
  });
});

describe("legacy-compatible evaluator", () => {
  it("detects Persian before attempting German grammar evaluation", () => {
    expect(detectAnswerLanguage("یه سوپرمارکت سر خیابون ما هست")).toBe("fa");
    const result = analyzeClosedAnswer(
      "یه سوپرمارکت سر خیابون ما هست",
      "In meiner Straße gibt es einen Supermarkt.",
    );

    expect(result.status).toBe("wrong_language");
    expect(result.issues[0]?.category).toBe("wrong_output_language");
  });

  it("isolates the Dativ error in the es gibt example", () => {
    const result = analyzeClosedAnswer(
      "In meine Straße gibt es einen Supermarkt.",
      "In meiner Straße gibt es einen Supermarkt.",
    );

    expect(result.status).toBe("nearly_correct");
    expect(result.corrected).toBe("In meiner Straße gibt es einen Supermarkt.");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      category: "wrong_case",
      userText: "In meine Straße",
      correctedText: "In meiner Straße",
      hint: "die Straße → in meiner Straße",
    });
  });

  it("accepts canonical and valid reordered answers", () => {
    const expected = "In meiner Straße gibt es einen Supermarkt.";
    expect(analyzeClosedAnswer(expected, expected).correct).toBe(true);
    expect(
      analyzeClosedAnswer(
        "Es gibt einen Supermarkt in meiner Straße.",
        expected,
        ["Es gibt einen Supermarkt in meiner Straße."],
      ).correct,
    ).toBe(true);
  });

  it("explains the masculine Akkusativ article correction", () => {
    const result = analyzeClosedAnswer(
      "Ich sehe der Mann.",
      "Ich sehe den Mann.",
    );

    expect(result.status).toBe("nearly_correct");
    expect(result.corrected).toBe("Ich sehe den Mann.");
    expect(result.issues[0]).toMatchObject({
      category: "wrong_case",
      correctedText: "den Mann",
    });
  });

  it("explains geben as Dativ recipient plus Akkusativ object", () => {
    const result = analyzeClosedAnswer(
      "Ich gebe der Mann dem Buch.",
      "Ich gebe dem Mann das Buch.",
    );

    expect(result.status).toBe("nearly_correct");
    expect(result.issues[0]).toMatchObject({
      category: "wrong_case",
      userText: "der Mann dem Buch",
      correctedText: "dem Mann das Buch",
      hint: "der Mann → dem Mann; dem Buch → das Buch",
    });
  });

  it("akzeptiert eine kurze direkte Perfekt-Antwort ohne kopierte Aufgabenwörter", () => {
    const report = evaluateAnswer(
      "Ich habe heute gearbeitet.",
      {
        title: "Perfekt",
        rule: "Bilde das Perfekt mit haben oder sein und dem Partizip II.",
        examples: ["Ich habe heute gearbeitet."],
      },
      "sentences",
      { matches: [], online: false },
      "Berichte über eine abgeschlossene Handlung aus deinem Alltag.",
    );

    expect(report.practiceReady).toBe(true);
    expect(report.relevant).toBe(true);
  });
  it("detects target evidence for Perfekt", () => {
    expect(
      targetEvidencePresent("Ich bin nach Berlin gefahren.", perfekt),
    ).toBe(true);
    expect(targetEvidencePresent("Ich fahre nach Berlin.", perfekt)).toBe(
      false,
    );
  });

  it("rejects duplicate three-sentence production", () => {
    const issues = getTaskIssues(
      "Ich bin gefahren. Ich bin gefahren. Ich bin gefahren.",
      perfekt,
      "sentences",
    );

    expect(issues.some((issue) => issue.type === "Aufgabe")).toBe(true);
  });

  it("cannot pass when LanguageTool is unavailable", () => {
    const result = evaluateAnswer(
      "Ich bin nach Berlin gefahren.",
      perfekt,
      "free",
      {
        matches: [],
        online: false,
        networkError: "offline",
      },
    );

    expect(result.ok).toBe(false);
    expect(result.practiceReady).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.networkError).toBe("offline");
  });

  it("rejects repeated filler as unrelated production", () => {
    const result = evaluateAnswer(
      "bin bin bin bin bin bin gefahren",
      perfekt,
      "free",
      { matches: [], online: true },
      "Erkläre eine Reise nach Berlin.",
    );

    expect(result.relevant).toBe(false);
    expect(result.practiceReady).toBe(false);
    expect(result.issues.some((issue) => issue.type === "Aufgabenbezug")).toBe(
      true,
    );
  });

  it("repairs the wrong Perfekt auxiliary deterministically", () => {
    const result = evaluateAnswer(
      "Ich habe nach Berlin gegangen.",
      perfekt,
      "free",
      { matches: [], online: true },
    );

    expect(result.ok).toBe(false);
    expect(result.corrected).toBe("Ich bin nach Berlin gegangen.");
    expect(result.issues.some((issue) => issue.type === "Zielgrammatik")).toBe(
      true,
    );
    expect(result.issues[0]?.errorClass).toBe("auxiliary");
    expect(result.nextAction).toBe("repair");
    expect(result.accuracyScore).toBeLessThan(100);
  });
});
