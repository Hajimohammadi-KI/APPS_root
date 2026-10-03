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

  it("accepts spacing and one final period without erasing case or punctuation", () => {
    expect(
      isPracticeAnswerCorrect("  Weil sie heute länger arbeitet. ", [
        "Weil sie heute länger arbeitet",
      ]),
    ).toBe(true);
    expect(
      isPracticeAnswerCorrect("WEIL sie heute länger arbeitet!", [
        "weil sie heute länger arbeitet",
      ]),
    ).toBe(false);
    expect(
      isPracticeAnswerCorrect("Vor dem Schlafen. liest er zehn Minuten.", [
        "Vor dem Schlafen liest er zehn Minuten",
      ]),
    ).toBe(false);
  });

  it("rejects the actual wrong nominalization choice and unchanged repair prompt", () => {
    const plan = practiceMaterials
      .map((material) => getMaterialPracticePlan(material.id))
      .find((item) => item?.focusId === "nominalization");
    expect(plan).toBeDefined();
    const choice = plan!.exercises.find((item) => item.id.endsWith("-nom-1"))!;
    const repair = plan!.exercises.find((item) => item.id.endsWith("-nom-3"))!;
    expect(isPracticeAnswerCorrect("lesen", choice.acceptedAnswers)).toBe(
      false,
    );
    expect(isPracticeAnswerCorrect("Lesen", choice.acceptedAnswers)).toBe(true);
    expect(isPracticeAnswerCorrect(repair.prompt, repair.acceptedAnswers)).toBe(
      false,
    );
    expect(
      isPracticeAnswerCorrect(
        "Vor dem Schlafen liest er zehn Minuten.",
        repair.acceptedAnswers,
      ),
    ).toBe(true);
  });
});
