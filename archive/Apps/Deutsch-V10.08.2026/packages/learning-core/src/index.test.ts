import { describe, expect, test } from "bun:test";
import {
  appendEvidenceInvalidationToStorage,
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  buildDailyAutomaticityProgram,
  buildLearningDataExport,
  emptyLearningEvidenceLedger,
  LEARNING_DATA_EXPORT_KIND,
  isEvidenceActive,
  mergeLearningEvidenceBundle,
  normalizeDailySessionMinutes,
  parseLearningDataExport,
  readLearningEvidenceLedger,
  validateContentUnit,
  writeLearningEvidenceLedger,
} from "./index";

describe("shared automaticity vertical slice", () => {
  test.each([
    [15, 15],
    [30, 30],
    [45, 45],
    [60, 45],
  ] as const)("normalizes %i legacy minutes to %i", (input, expected) => {
    expect(normalizeDailySessionMinutes(input)).toBe(expected);
  });

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
    expect(bundle.contentUnit.provenance.humanReviewed).toBe(false);
  });

  test("records human review only when explicit provenance is supplied", () => {
    const bundle = buildAttemptVerticalSlice({
      attemptId: "attempt-reviewed-mediation-1",
      occurredAt: "2026-08-22T08:00:00.000Z",
      language: "en",
      cefrLevel: "B1",
      contentVersion: "1.0.0",
      topic: "Relay a timetable change",
      mode: "mediation",
      inputText: "The class starts later, so we should arrive at ten.",
      correctedText: "The class starts later, so we should arrive at ten.",
      targetHit: true,
      accuracyScore: 95,
      attemptVerified: true,
      assessedBy: "deterministic",
      sessionMinutes: 15,
      provenance: {
        kind: "authored",
        sourceId: "reviewed-mediation-en-b1",
        license: "proprietary-authored",
        humanReviewed: true,
      },
    });

    expect(bundle.contentUnit.modes).toEqual(["mediation"]);
    expect(bundle.contentUnit.provenance.humanReviewed).toBe(true);
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

  test("completion and a 60-second timer never claim automaticity", () => {
    const completedProgram = buildDailyAutomaticityProgram(15);
    expect(completedProgram.blocks.every((block) => block.minutes > 0)).toBe(
      true,
    );
    expect("automaticityClaim" in completedProgram).toBe(false);

    const timedAttempt = buildAttemptVerticalSlice({
      attemptId: "attempt-speaking-60-seconds",
      occurredAt: "2026-08-21T08:00:00.000Z",
      language: "en",
      cefrLevel: "B1",
      contentVersion: "27.3.13",
      topic: "Present perfect",
      mode: "speaking",
      inputText: "I have completed a full minute of independent speaking.",
      correctedText: "I have completed a full minute of independent speaking.",
      targetHit: true,
      accuracyScore: 100,
      fluencyScore: 80,
      latencyMs: 60_000,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 15,
      audioCaptured: true,
      audioReferenceId: "audio-60-seconds",
    });

    expect(timedAttempt.evidence.masteryEligible).toBe(true);
    expect(timedAttempt.evidence.automaticityClaim).toBe(
      "insufficient-longitudinal-evidence",
    );
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
    expect(bundle.events.map((event) => event.type)).toContain(
      "learning.delayed-recall.recorded.v1",
    );
    expect(bundle.events.map((event) => event.type)).toContain(
      "learning.novel-transfer.recorded.v1",
    );
    expect(JSON.stringify(ledger.events)).not.toContain("Wenn ich Zeit");
    expect(ledger.responses).toHaveLength(1);
    expect(validateContentUnit(bundle.contentUnit)).toEqual([]);
  });

  test("re-recording invalidates the superseded speaking evidence", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const bundle = buildAttemptVerticalSlice({
      attemptId: "speaking-first",
      occurredAt: "2026-08-21T09:00:00.000Z",
      language: "en",
      cefrLevel: "B1",
      contentVersion: "27.3.13",
      topic: "Present perfect",
      mode: "speaking",
      inputText: "I have completed the first recording.",
      correctedText: "I have completed the first recording.",
      targetHit: true,
      accuracyScore: 100,
      fluencyScore: 80,
      attemptVerified: true,
      assessedBy: "online",
      sessionMinutes: 30,
      audioCaptured: true,
      audioReferenceId: "audio-first",
    });
    const first = appendLearningEvidenceBundleToStorage(storage, bundle);
    expect(isEvidenceActive(first, bundle.evidence.id)).toBe(true);

    const invalidated = appendEvidenceInvalidationToStorage(storage, {
      evidenceId: bundle.evidence.id,
      occurredAt: "2026-08-21T09:02:00.000Z",
      supersedingResponseId: "speaking-second:response",
    });

    expect(isEvidenceActive(invalidated, bundle.evidence.id)).toBe(false);
    expect(invalidated.events.at(-1)).toMatchObject({
      type: "learning.evidence.invalidated.v1",
      payload: {
        evidenceId: "speaking-first:evidence",
        supersedingResponseId: "speaking-second:response",
      },
    });
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
    expect(exported.learningEvidence.contentUnits[0]?.version).toBe("27.3.13");
    expect(exported.learningEvidence.events.map((event) => event.type)).toEqual(
      ["learning.response.submitted.v1", "learning.evidence.recorded.v1"],
    );

    const imported = parseLearningDataExport<{ selectedLevel: string }>(
      JSON.parse(JSON.stringify(exported)),
      "en",
    );
    expect(imported?.learnerState.selectedLevel).toBe("B1");

    writeLearningEvidenceLedger(storage, imported!.learningEvidence);
    expect(readLearningEvidenceLedger(storage).responses).toHaveLength(1);
  });

  test("a local import rejects another language or an incomplete file", () => {
    const valid = buildLearningDataExport({
      language: "de",
      exportedAt: "2026-08-30T08:00:00.000Z",
      learnerState: { version: 11 },
      storage: {
        getItem: () => null,
        setItem: () => undefined,
      },
    });

    expect(parseLearningDataExport(valid, "en")).toBeNull();
    expect(
      parseLearningDataExport({ ...valid, exportedAt: "not-a-date" }, "de"),
    ).toBeNull();
    expect(
      parseLearningDataExport(
        { ...valid, learningEvidence: { schemaVersion: "1.0.0" } },
        "de",
      ),
    ).toBeNull();
  });
});
