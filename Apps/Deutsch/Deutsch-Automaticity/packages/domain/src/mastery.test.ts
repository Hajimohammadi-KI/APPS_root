import { describe, expect, it } from "bun:test";

import {
  createEmptyMasteryRecord,
  recordMasteryAttempt,
  recordMasteryReview,
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
