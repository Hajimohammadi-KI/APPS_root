import { describe, expect, it } from "bun:test";

import {
  createEmptyMasteryRecord,
  MASTERY_MODES,
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
    expect(record.status).toBe("stable");

    record = recordMasteryReview(record, true);
    expect(record.status).toBe("automatic");
  });

  it("downgrades review evidence after a failed delayed review", () => {
    let record = createEmptyMasteryRecord();
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, false);

    expect(record.successfulReviews).toBe(0);
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
    for (const mode of MASTERY_MODES) {
      record = recordVerifiedMasteryAttempt(record, {
        mode,
        accuracyScore: 100,
        targetHit: true,
        verified: true,
        ...(mode === "recognition" ? { latencyMs: 4_000 } : {}),
      });
    }
    record = recordMasteryReview(record, true);
    record = recordMasteryReview(record, true);

    expect(record?.status).toBe("automatic");
  });
});
