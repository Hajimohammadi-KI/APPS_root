import { describe, expect, test } from "bun:test";
import {
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  buildDailyAutomaticityProgram,
  buildLearningDataExport,
  emptyLearningEvidenceLedger,
  LEARNING_DATA_EXPORT_KIND,
  mergeLearningEvidenceBundle,
  validateContentUnit,
} from "./index";

describe("shared automaticity vertical slice", () => {
  test.each([15, 30, 45] as const)(
    "%i-minute plans allocate the exact selected time",
    (sessionMinutes) => {
      const program = buildDailyAutomaticityProgram(sessionMinutes);
      expect(
        program.blocks.reduce((sum, block) => sum + block.minutes, 0),
      ).toBe(sessionMinutes);
      expect(program.volumeMultiplier).toBe((sessionMinutes / 15) as 1 | 2 | 3);
    },
  );

  test("a provider-checked writing failure remains verified but cannot grant mastery", () => {
    const bundle = buildAttemptVerticalSlice({
      attemptId: "attempt-writing-1",
      occurredAt: "2026-08-21T08:00:00.000Z",
      language: "en",
      cefrLevel: "B1",
      contentVersion: "27.3.13",
      topic: "Present perfect",
      mode: "writing",
      inputText: "I have went home.",
      correctedText: "I have gone home.",
      targetHit: false,
      accuracyScore: 55,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 30,
    });

    expect(bundle.evidence.verification.status).toBe("verified");
    expect(bundle.evidence.masteryEligible).toBe(false);
    expect(bundle.evidence.automaticityClaim).toBe(
      "insufficient-longitudinal-evidence",
    );
  });

  test("speaking cannot be verified without captured audio", () => {
    const bundle = buildAttemptVerticalSlice({
      attemptId: "attempt-speaking-1",
      occurredAt: "2026-08-21T08:00:00.000Z",
      language: "de",
      contentVersion: "20.8.23",
      topic: "Nebensatz mit weil",
      mode: "speaking",
      inputText: "Ich lerne, weil ich die Sprache brauche.",
      correctedText: "Ich lerne, weil ich die Sprache brauche.",
      targetHit: true,
      accuracyScore: 92,
      fluencyScore: 78,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 45,
      audioCaptured: false,
    });

    expect(bundle.evidence.verification).toEqual({
      status: "unverified",
      provider: "online",
      reason: "missing-audio",
    });
    expect(bundle.evidence.masteryEligible).toBe(false);
  });

  test("events remain identifier-only while responses stay in the local ledger", () => {
    const bundle = buildAttemptVerticalSlice({
      attemptId: "attempt-transfer-1",
      occurredAt: "2026-08-21T08:00:00.000Z",
      language: "de",
      contentVersion: "20.8.23",
      topic: "Konjunktiv II",
      mode: "transfer",
      inputText: "Wenn ich Zeit hätte, würde ich mehr lesen.",
      correctedText: "Wenn ich Zeit hätte, würde ich mehr lesen.",
      targetHit: true,
      accuracyScore: 95,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 15,
      fromDueReview: true,
    });
    const ledger = mergeLearningEvidenceBundle(
      emptyLearningEvidenceLedger(),
      bundle,
    );

    expect(bundle.evidence.gates.novelTransfer).toBe(true);
    expect(JSON.stringify(ledger.events)).not.toContain("Wenn ich Zeit");
    expect(ledger.responses).toHaveLength(1);
    expect(validateContentUnit(bundle.contentUnit)).toEqual([]);
  });

  test("a local export includes learner state and the normalized evidence ledger", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const bundle = buildAttemptVerticalSlice({
      attemptId: "attempt-export-1",
      occurredAt: "2026-08-21T09:00:00.000Z",
      language: "en",
      cefrLevel: "B1",
      contentVersion: "27.3.13",
      topic: "Present perfect",
      mode: "writing",
      inputText: "I have completed the task.",
      correctedText: "I have completed the task.",
      targetHit: true,
      accuracyScore: 100,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 30,
    });
    appendLearningEvidenceBundleToStorage(storage, bundle);

    const exported = buildLearningDataExport({
      language: "en",
      exportedAt: "2026-08-21T09:05:00.000Z",
      learnerState: { version: 27, selectedLevel: "B1" },
      storage,
    });

    expect(exported.kind).toBe(LEARNING_DATA_EXPORT_KIND);
    expect(exported.schemaVersion).toBe("1.0.0");
    expect(exported.learnerState).toEqual({
      version: 27,
      selectedLevel: "B1",
    });
    expect(exported.learningEvidence.responses).toHaveLength(1);
    expect(exported.learningEvidence.evidence[0]?.masteryEligible).toBe(true);
  });
});
