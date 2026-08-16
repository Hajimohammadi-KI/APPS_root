import { describe, expect, it } from "bun:test";

import { caseAutomaticityChallenges } from "./case-automaticity-trainer";

describe("case automaticity training catalog", () => {
  it("practises every German case more than once", () => {
    for (const grammaticalCase of [
      "Nominativ",
      "Akkusativ",
      "Dativ",
      "Genitiv",
    ]) {
      expect(
        caseAutomaticityChallenges.filter(
          (challenge) => challenge.caseAnswer === grammaticalCase,
        ).length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps every answer reachable and every exercise identifiable", () => {
    const ids = new Set<string>();
    for (const challenge of caseAutomaticityChallenges) {
      expect(ids.has(challenge.id)).toBe(false);
      ids.add(challenge.id);
      expect(challenge.articleOptions).toContain(challenge.articleAnswer);
      expect(challenge.endingOptions).toContain(challenge.endingAnswer);
      expect(challenge.completed).not.toContain("___");
      expect(challenge.pattern).toContain("___");
    }
  });
});
