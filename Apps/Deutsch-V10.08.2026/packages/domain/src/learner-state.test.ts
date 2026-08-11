import { describe, expect, it } from "bun:test";

import {
  calculateStreak,
  canCompleteDailyStep,
  normalizeLearnerState,
} from "./learner-state";

describe("legacy learner state", () => {
  it("preserves legacy values and fills missing collections", () => {
    const state = normalizeLearnerState({
      settings: { minWords: 22 },
      activity: { "2026-07-27": 3 },
    });

    expect(state.settings.minWords).toBe(22);
    expect(state.settings.saveAudio).toBe(true);
    expect(state.settings.dailyStudyMinutes).toBe(15);
    expect(state.activity["2026-07-27"]).toBe(3);
    expect(state.dailyPlans).toEqual({});
    expect(state.attempts).toEqual([]);
    expect(state.learningLevel).toBeNull();
  });

  it("accepts every CEFR start level and rejects unsupported values", () => {
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      expect(
        normalizeLearnerState({ learningLevel: level }).learningLevel,
      ).toBe(level);
    }

    expect(
      normalizeLearnerState({ learningLevel: "B2-C1" }).learningLevel,
    ).toBeNull();
  });

  it("keeps a self-declared level separate from a verified level", () => {
    const state = normalizeLearnerState({
      learner: {
        selfDeclaredLevel: "B1",
        placementMode: "manual",
        verifiedLevel: "D1",
      },
    });

    expect(state.learner.selfDeclaredLevel).toBe("B1");
    expect(state.learner.placementMode).toBe("manual");
    expect(state.learner.verifiedLevel).toBeNull();
    expect(state.learner.allowOnlineAI).toBe(false);
  });

  it("enforces ordered daily completion", () => {
    expect(canCompleteDailyStep([], 0)).toBe(true);
    expect(canCompleteDailyStep([0], 1)).toBe(true);
    expect(canCompleteDailyStep([0], 2)).toBe(false);
  });

  it("calculates a consecutive legacy activity streak", () => {
    expect(
      calculateStreak(
        {
          "2026-07-25": 1,
          "2026-07-26": 2,
          "2026-07-27": 1,
        },
        new Date("2026-07-27T12:00:00.000Z"),
      ),
    ).toBe(3);
  });

  it("drops malformed imported rows instead of breaking the application", () => {
    const state = normalizeLearnerState({
      errors: [{ topic: 42 }, null],
      reviews: [{ id: "bad", due: "tomorrow" }],
      sessions: ["bad"],
      activity: { "2026-07-27": "seven", "2026-07-26": 3.8 },
      dailyPlans: {
        "2026-07-27": {
          completed: [0, 0, 1, 99, "2"],
          answers: { recall: "Antwort", invalid: 42 },
        },
      },
    });

    expect(state.errors).toEqual([]);
    expect(state.reviews).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.activity).toEqual({ "2026-07-26": 3 });
    expect(state.dailyPlans["2026-07-27"]).toEqual({
      completed: [0, 1],
      answers: { recall: "Antwort" },
    });
  });

  it("upgrades legacy errors and mastery without granting automatic status", () => {
    const state = normalizeLearnerState({
      errors: [
        {
          date: "2026-07-27T08:00:00.000Z",
          topic: "Perfekt",
          original: "Ich habe gegangen.",
          corrected: "Ich bin gegangen.",
        },
      ],
      mastery: {
        Perfekt: {
          completedAt: 1,
          controlled: true,
          free: true,
          spoken: true,
        },
      },
    });

    expect(state.errors[0]?.errorClass).toBe("other");
    expect(state.errors[0]?.occurrenceCount).toBe(1);
    expect(state.mastery.Perfekt?.status).toBe("usable");
    expect(state.mastery.Perfekt?.successfulReviews).toBe(0);
  });
});
