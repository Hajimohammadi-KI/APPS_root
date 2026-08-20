import { describe, expect, it } from "bun:test";
import {
  allocateCoreMissionMinutes,
  buildDailyAutomaticityProgram,
  buildAdaptiveDailyPlan,
  calculateDailyProgress,
} from "./adaptive-daily-plan";

describe("adaptive daily plan", () => {
  it("verteilt sechs Kernaktivitäten exakt auf die gewählte Lernzeit", () => {
    for (const minutes of [15, 30, 45] as const) {
      expect(
        allocateCoreMissionMinutes(minutes).reduce(
          (total, activityMinutes) => total + activityMinutes,
          0,
        ),
      ).toBe(minutes);
    }
  });
  it("prioritizes recall and due review in the fifteen-minute route", () => {
    const plan = buildAdaptiveDailyPlan({
      sessionMinutes: 15,
      hasPreviousLesson: true,
      previousLessonRecalled: false,
      dueReviewCount: 2,
      activeErrorCount: 1,
      hasIncompleteLesson: true,
      masteryScore: 90,
      automaticityScore: 90,
    });
    expect(plan.mission).toBe("recall");
    expect(plan.blocks.map((block) => block.id).slice(0, 2)).toEqual([
      "recall",
      "review",
    ]);
    expect(plan.blocks.map((block) => block.minutes)).toEqual([3, 3, 3, 4, 2]);
  });

  it("resumes unfinished learning before unlocking a new lesson", () => {
    const plan = buildAdaptiveDailyPlan({
      sessionMinutes: 45,
      hasPreviousLesson: true,
      previousLessonRecalled: true,
      dueReviewCount: 0,
      activeErrorCount: 0,
      hasIncompleteLesson: true,
      masteryScore: 95,
      automaticityScore: 95,
    });
    expect(plan.mission).toBe("resume");
    expect(plan.canAdvance).toBeFalse();
    expect(plan.blocks[1]?.id).toBe("resume");
  });

  it("unlocks a new lesson only after the quality gate", () => {
    const plan = buildAdaptiveDailyPlan({
      sessionMinutes: 45,
      hasPreviousLesson: true,
      previousLessonRecalled: true,
      dueReviewCount: 0,
      activeErrorCount: 0,
      hasIncompleteLesson: false,
      masteryScore: 80,
      automaticityScore: 70,
    });
    expect(plan.canAdvance).toBeTrue();
    expect(plan.blocks[1]?.id).toBe("new_lesson");
    expect(plan.blocks.map((block) => block.minutes)).toEqual([8, 8, 8, 10, 3]);
  });

  it("hält jede wählbare Einheit in der versprochenen Gesamtdauer", () => {
    for (const sessionMinutes of [15, 30, 45] as const) {
      const plan = buildAdaptiveDailyPlan({
        sessionMinutes,
        hasPreviousLesson: false,
        previousLessonRecalled: true,
        dueReviewCount: 0,
        activeErrorCount: 0,
        hasIncompleteLesson: false,
        masteryScore: 80,
        automaticityScore: 70,
      });
      const total = plan.blocks.reduce(
        (sum, block) => sum + block.minutes + block.breakAfterMinutes,
        0,
      );
      expect(total).toBe(sessionMinutes);
    }
  });

  it("nimmt alle Automatik-Aktivitäten in jede Tagesdauer auf", () => {
    for (const sessionMinutes of [15, 30, 45] as const) {
      const program = buildDailyAutomaticityProgram(sessionMinutes);
      expect(program.blocks.map((block) => block.id)).toEqual([
        "grammar",
        "mixed_practice",
        "conversation_studio",
        "review",
        "automatization",
      ]);
      expect(
        program.blocks.reduce((sum, block) => sum + block.minutes, 0),
      ).toBe(sessionMinutes);
      expect(
        program.blocks.reduce((sum, block) => sum + block.practiceUnits, 0),
      ).toBe(8 * program.volumeMultiplier);
    }
  });

  it("reports the three progress dimensions independently", () => {
    expect(
      calculateDailyProgress({
        levelTopicCount: 20,
        coveredTopicCount: 5,
        masteryScores: [90, 70],
        automaticityScore: 50,
      }),
    ).toEqual({ coverage: 25, mastery: 80, automaticity: 50 });
  });
});
