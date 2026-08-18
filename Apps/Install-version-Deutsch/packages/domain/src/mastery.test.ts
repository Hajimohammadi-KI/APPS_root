import { describe, expect, it } from "bun:test";

import {
  createEmptyMasteryRecord,
  MASTERY_MODES,
  nextPracticeStage,
  recordMasteryAttempt,
  recordMasteryReview,
  recordVerifiedMasteryAttempt,
} from "./mastery";

describe("mastery gates", () => {
  it("does not grant automatic status after production alone", () => {
    let record = createEmptyMasteryRecord();
    for (const mode of [
      "recognition",
      "writing",
      "speaking",
      "repair",
      "transfer",
    ] as const) {
      record = recordMasteryAttempt(record, {
        mode,
        accuracyScore: 100,
        targetHit: true,
        latencyMs: 4_000,
      });
    }

    expect(record.status).toBe("usable");
    expect(record.successfulReviews).toBe(0);
  });

  it("requires two delayed reviews and fast recall for automatic status", () => {
    let record = createEmptyMasteryRecord();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (const mode of [
        "recognition",
        "writing",
        "speaking",
        "repair",
        "transfer",
      ] as const) {
        record = recordMasteryAttempt(record, {
          mode,
          accuracyScore: 100,
          targetHit: true,
          ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
          // writing/transfer latency is gated separately (WRITING_LATENCY_THRESHOLD_MS,
          // 90s) from recognition/speaking recall speed -- both must be
          // demonstrated fast before "automatic" is reachable.
          ...(mode === "writing" || mode === "transfer"
            ? { latencyMs: 30_000 }
            : {}),
        });
      }
    }
    record = recordMasteryReview(record, true);
    expect(record.status).toBe("stable");

    // "stable" doesn't require delayed-transfer evidence, but "automatic"
    // does (see the dedicated hasDelayedTransferEvidence tests below) -- a
    // real due-review-originated transfer success has to exist before the
    // second delayed review can actually finish unlocking "automatic".
    record = recordMasteryAttempt(record, {
      mode: "transfer",
      accuracyScore: 100,
      targetHit: true,
      latencyMs: 30_000,
      fromDueReview: true,
    });
    record = recordMasteryReview(record, true);
    expect(record.status).toBe("automatic");
  });

  it("does not grant automatic status without a delayed-review-originated transfer attempt, even with every other threshold met", () => {
    // Regression test for the gap this pass fixed: review-center.tsx used to
    // never tag any attempt fromDueReview (it didn't even record
    // mode:"transfer" attempts at the transfer checkpoint at all), so
    // attemptCounts.transfer >= 3 could be satisfied purely by same-session
    // Grammatik-Labor transfer attempts, never by a real delayed, novel-
    // context success.
    let record = createEmptyMasteryRecord();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (const mode of [
        "recognition",
        "writing",
        "speaking",
        "repair",
        "transfer",
      ] as const) {
        record = recordMasteryAttempt(record, {
          mode,
          accuracyScore: 100,
          targetHit: true,
          ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
          ...(mode === "writing" || mode === "transfer"
            ? { latencyMs: 30_000 }
            : {}),
          // Deliberately omitted: fromDueReview.
        });
      }
    }
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, true);

    expect(record.hasDelayedTransferEvidence).toBe(false);
    expect(record.status).not.toBe("automatic");
    expect(record.status).toBe("stable");
  });

  it("does not grant automatic status when writing/transfer are accurate but slow", () => {
    // Regression test for the bug this pass fixed: before writingLatenciesMs
    // existed, a slow writing attempt's latencyMs polluted the same pooled
    // array as fast recognition/speaking recall, so this exact scenario
    // (accurate but slow composition) could still block automatic for the
    // wrong reason, or -- worse, once folded into one 8s-threshold median --
    // make automatic nearly unreachable for any topic with real writing
    // practice at all.
    let record = createEmptyMasteryRecord();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (const mode of [
        "recognition",
        "writing",
        "speaking",
        "repair",
        "transfer",
      ] as const) {
        record = recordMasteryAttempt(record, {
          mode,
          accuracyScore: 100,
          targetHit: true,
          ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
          // Well past WRITING_LATENCY_THRESHOLD_MS (90s) -- accurate, slow.
          ...(mode === "writing" || mode === "transfer"
            ? { latencyMs: 180_000 }
            : {}),
        });
      }
    }
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, true);

    expect(record.status).not.toBe("automatic");
    expect(record.status).toBe("stable");
  });

  it("downgrades review evidence after a failed delayed review", () => {
    let record = createEmptyMasteryRecord();
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, false);

    expect(record.successfulReviews).toBe(0);
  });

  it("does not grant automatic or stable status from a single lucky attempt per mode", () => {
    // Regression test for the gap this session closed: previously,
    // recordMasteryAttempt set a mode's score straight to the first
    // attempt's score (no averaging needed yet), so one perfect attempt per
    // mode plus two spaced reviews could reach "automatic" off a single
    // real practice event per mode. attemptCounts now blocks that.
    let record = createEmptyMasteryRecord();
    for (const mode of [
      "recognition",
      "writing",
      "speaking",
      "repair",
      "transfer",
    ] as const) {
      record = recordMasteryAttempt(record, {
        mode,
        accuracyScore: 100,
        targetHit: true,
        ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
      });
    }
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, true);

    expect(record.status).not.toBe("automatic");
    expect(record.status).not.toBe("stable");
    expect(record.attemptCounts.writing).toBe(1);
  });
});

describe("recordVerifiedMasteryAttempt", () => {
  it("leaves an unset record untouched when the attempt is unverified", () => {
    const record = recordVerifiedMasteryAttempt(undefined, {
      mode: "writing",
      accuracyScore: 100,
      targetHit: true,
      verified: false,
    });

    expect(record).toBeUndefined();
  });

  it("does not change scores when a verified record receives an unverified attempt", () => {
    let record: ReturnType<typeof createEmptyMasteryRecord> | undefined =
      recordVerifiedMasteryAttempt(undefined, {
        mode: "writing",
        accuracyScore: 90,
        targetHit: true,
        verified: true,
      });
    const afterFirstAttempt = record;

    record = recordVerifiedMasteryAttempt(record, {
      mode: "writing",
      accuracyScore: 100,
      targetHit: true,
      verified: false,
    });

    expect(record).toBe(afterFirstAttempt);
    expect(record?.scores.writing).toBe(90);
  });

  it("never advances status to stable or automatic from unverified attempts alone, even offline with a perfect score", () => {
    let record: ReturnType<typeof createEmptyMasteryRecord> | undefined;

    // Simulate many rounds of practice where the grammar checker was
    // offline (or the grammar point wasn't covered by the offline regex
    // fallback in evaluation.ts) so every attempt reports verified: false,
    // exactly like an EvaluationReport built from an unreachable
    // LanguageTool API.
    for (let round = 0; round < 5; round += 1) {
      for (const mode of MASTERY_MODES) {
        record = recordVerifiedMasteryAttempt(record, {
          mode,
          accuracyScore: 100,
          targetHit: true,
          verified: false,
          latencyMs: 1_000,
        });
      }
    }

    expect(record).toBeUndefined();
    expect(createEmptyMasteryRecord().status).toBe("new");
  });

  it("still reaches automatic status through the normal path once attempts are verified", () => {
    let record: ReturnType<typeof createEmptyMasteryRecord> | undefined =
      createEmptyMasteryRecord();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (const mode of MASTERY_MODES) {
        record = recordVerifiedMasteryAttempt(record, {
          mode,
          accuracyScore: 100,
          targetHit: true,
          verified: true,
          ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
          ...(mode === "writing" || mode === "transfer"
            ? { latencyMs: 30_000 }
            : {}),
        });
      }
    }
    record = recordVerifiedMasteryAttempt(record, {
      mode: "transfer",
      accuracyScore: 100,
      targetHit: true,
      verified: true,
      latencyMs: 30_000,
      fromDueReview: true,
    });
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, true);

    expect(record?.hasDelayedTransferEvidence).toBe(true);
    expect(record?.status).toBe("automatic");
  });
});

// Three-stage timed-practice model (PRACTICE_STAGE_TARGET_ACCURACY /
// PRACTICE_STAGE_REGRESSION_MARGIN in mastery.ts). Mirrors English's
// nextPracticeStage tests in apps/web/features/screens/practice-stage.test.ts.
describe("nextPracticeStage", () => {
  it("advances Stage 1 to Stage 2 on a closed-book round meeting 90%", () => {
    expect(nextPracticeStage(1, 90, false)).toBe(2);
    expect(nextPracticeStage(1, 100, false)).toBe(2);
  });

  it("does not advance Stage 1 below its 90% target", () => {
    expect(nextPracticeStage(1, 89, false)).toBe(1);
  });

  it("advances Stage 2 to Stage 3 on a closed-book round meeting 85%", () => {
    expect(nextPracticeStage(2, 85, false)).toBe(3);
  });

  it("holds Stage 3 at Stage 3 even on a perfect round -- there is nowhere further to advance", () => {
    expect(nextPracticeStage(3, 100, false)).toBe(3);
  });

  it("regresses a stage on a clear accuracy collapse (20+ points below target)", () => {
    expect(nextPracticeStage(2, 64, false)).toBe(1);
    expect(nextPracticeStage(3, 64, false)).toBe(2);
  });

  it("does not regress on routine variance just under target", () => {
    expect(nextPracticeStage(2, 70, false)).toBe(2);
  });

  it("never regresses below Stage 1", () => {
    expect(nextPracticeStage(1, 0, false)).toBe(1);
  });

  it("never moves the stage on an open-book round, regardless of score", () => {
    expect(nextPracticeStage(1, 100, true)).toBe(1);
    expect(nextPracticeStage(2, 0, true)).toBe(2);
    expect(nextPracticeStage(3, 100, true)).toBe(3);
  });
});
