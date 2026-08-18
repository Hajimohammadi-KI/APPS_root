import { describe, expect, it } from "bun:test";

import {
  calculateStreak,
  canCompleteDailyStep,
  createInitialLearnerState,
  migrateLegacyLearnerState,
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

// Regression coverage for a real gap: LearnerState had no version field and
// no dedicated migration entry point at all (unlike English's AppState.version
// / migrateLegacy()), so a future schema change would have had no version
// marker to detect old-shape data by. This locks in that every state --
// fresh, normalized from an unversioned blob, or migrated from the legacy
// key -- carries the new version marker, and that a realistic old blob's
// real data (attempts, reviews, mastery) survives the migration path.
describe("state versioning and legacy-key migration", () => {
  it("stamps version 1 on a fresh state", () => {
    expect(createInitialLearnerState().version).toBe(1);
  });

  it("stamps version 1 even when normalizing an old, unversioned blob", () => {
    expect(normalizeLearnerState({ settings: { minWords: 12 } }).version).toBe(
      1,
    );
    expect(normalizeLearnerState(null).version).toBe(1);
  });

  it("migrates a realistic legacy (GrammarAutomaticityV11_de) blob's real data forward", () => {
    const legacyBlob = {
      settings: { minWords: 18, saveAudio: false },
      learningLevel: "B1",
      attempts: [
        {
          id: "legacy-attempt-1",
          date: "2026-07-20T09:00:00.000Z",
          topic: "Perfekt",
          mode: "writing",
          inputText: "Ich habe das gemacht.",
          correctedText: "Ich habe das gemacht.",
          targetHit: true,
          verified: true,
          accuracyScore: 92,
        },
      ],
      reviews: [
        {
          id: "legacy-review-1",
          topic: "Perfekt",
          original: "Ich habe gegangen.",
          corrected: "Ich bin gegangen.",
          due: Date.now() + 86_400_000,
          stage: 1,
          successStreak: 1,
          mastered: false,
          reviewMode: "writing",
          sourceType: "grammar_topic",
        },
      ],
      mastery: {
        Perfekt: {
          scores: {
            recognition: 90,
            writing: 85,
            speaking: 80,
            repair: 80,
            transfer: 75,
          },
          successfulReviews: 1,
          controlled: true,
          free: true,
        },
      },
    };

    const migrated = migrateLegacyLearnerState(legacyBlob);

    expect(migrated.version).toBe(1);
    expect(migrated.settings.minWords).toBe(18);
    expect(migrated.learningLevel).toBe("B1");
    expect(migrated.attempts).toHaveLength(1);
    expect(migrated.attempts[0]?.topic).toBe("Perfekt");
    expect(migrated.attempts[0]?.accuracyScore).toBe(92);
    expect(migrated.reviews).toHaveLength(1);
    expect(migrated.reviews[0]?.corrected).toBe("Ich bin gegangen.");
    expect(migrated.mastery.Perfekt?.scores.writing).toBe(85);
    expect(migrated.mastery.Perfekt?.successfulReviews).toBe(1);
  });

  it("falls back to a clean initial state for a missing/unreadable legacy blob", () => {
    expect(migrateLegacyLearnerState(null)).toEqual(
      createInitialLearnerState(),
    );
  });
});
