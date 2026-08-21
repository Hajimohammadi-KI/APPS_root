import { describe, expect, it } from "bun:test";

import {
  discussionAudioMaterials,
  discussionGuideMaterials,
  errorRepairMaterials,
  grammarTrainingMaterials,
  idiomDailyMaterials,
} from "@grammar/content";

import {
  getMaterialPracticePlan,
  isPracticeAnswerCorrect,
  practiceMaterials,
} from "./material-practice";

describe("material practice catalog", () => {
  it("provides a complete correctable practice plan for every learner-facing source", () => {
    for (const material of practiceMaterials) {
      const plan = getMaterialPracticePlan(material.id);
      expect(plan).not.toBeNull();
      expect(plan?.exercises).toHaveLength(3);
      for (const exercise of plan?.exercises ?? []) {
        expect(exercise.prompt.length).toBeGreaterThan(8);
        expect(exercise.acceptedAnswers.length).toBeGreaterThan(0);
        expect(exercise.explanation.length).toBeGreaterThan(24);
      }
    }
  });

  it("covers every individual source shown in the four course sections", () => {
    const expected = [
      ...idiomDailyMaterials,
      ...discussionGuideMaterials,
      ...discussionAudioMaterials,
      ...grammarTrainingMaterials.filter((item) => item.format !== "Archiv"),
      ...errorRepairMaterials,
    ];
    for (const material of expected) {
      expect(getMaterialPracticePlan(material.id)?.material.id).toBe(
        material.id,
      );
    }
  });

  it("accepts harmless punctuation and capitalization differences", () => {
    expect(
      isPracticeAnswerCorrect("  WEIL sie heute länger arbeitet! ", [
        "weil sie heute länger arbeitet",
      ]),
    ).toBe(true);
  });
});
