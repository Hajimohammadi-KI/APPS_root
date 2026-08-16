import { describe, expect, it } from "bun:test";

import {
  evaluateAnswer,
  getTaskIssues,
  targetEvidencePresent,
} from "./evaluation";

const perfekt = {
  title: "Perfekt",
  rule: "haben oder sein + Partizip II",
  examples: ["Ich bin nach Berlin gefahren."],
} as const;

describe("legacy-compatible evaluator", () => {
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
