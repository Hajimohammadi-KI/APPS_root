import { describe, expect, test } from "bun:test";
import { createEmptyCard, fsrs, Rating, type Grade } from "ts-fsrs";

import {
  FSRS_SHADOW_ALGORITHM,
  FSRS_SHADOW_STORAGE_KEY,
  MAX_FSRS_EVENTS_PER_REVIEW,
  assessLegacyReviewMigration,
  clearFsrsShadowRecords,
  compareFsrsShadowDueCounts,
  fsrsShadowRatingFromResult,
  readFsrsShadowRecords,
  recordFsrsShadowReview,
  replayFsrsShadowEvents,
  type FsrsShadowReviewEvent,
} from ".";

class MemoryStorage implements Storage {
  readonly #data = new Map<string, string>();
  get length() {
    return this.#data.size;
  }
  clear() {
    this.#data.clear();
  }
  getItem(key: string) {
    return this.#data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.#data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#data.delete(key);
  }
  setItem(key: string, value: string) {
    this.#data.set(key, value);
  }
}

function event(
  index: number,
  rating: 1 | 2 | 3 | 4 = 3,
  reviewId = "review-1",
): FsrsShadowReviewEvent {
  const reviewedAt = new Date(Date.UTC(2026, 0, 1 + index));
  return {
    version: 1,
    eventId: `${reviewId}:event-${index}`,
    language: index % 2 === 0 ? "en" : "de",
    reviewId,
    sourceId: "present-perfect-b1",
    reviewedAt: reviewedAt.toISOString(),
    rating,
    legacyBefore: {
      dueAt: reviewedAt.getTime(),
      state: `stage-${Math.max(0, index - 1)}`,
      successStreak: Math.max(0, index - 1),
      stabilityScore: Math.min(100, index * 20),
    },
    legacyAfter: {
      dueAt:
        reviewedAt.getTime() +
        [1, 3, 7, 14, 30][Math.min(4, index)] * 86_400_000,
      state: `stage-${index}`,
      successStreak: index,
      stabilityScore: Math.min(100, (index + 1) * 20),
      lastSuccessAt: reviewedAt.getTime(),
    },
  };
}

describe("FSRS shadow scheduler", () => {
  test("pins the audited package, algorithm, and upstream commit", () => {
    expect(FSRS_SHADOW_ALGORITHM).toEqual({
      package: "ts-fsrs",
      packageVersion: "5.4.1",
      algorithmVersion: "FSRS-6.0",
      upstreamCommit: "d26af4d93b8c17cce2513433576587a2750bc80b",
      requestRetention: 0.9,
      maximumIntervalDays: 36_500,
      enableShortTerm: true,
      enableFuzz: false,
    });
  });

  test("matches the pinned upstream FSRS-6 interval vector", () => {
    const scheduler = fsrs({ enable_fuzz: false });
    let card = createEmptyCard();
    let now = new Date(2022, 11, 29, 12, 30, 0, 0);
    const ratings: Grade[] = [
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Again,
      Rating.Again,
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Good,
    ];
    const intervals: number[] = [];
    for (const rating of ratings) {
      card = scheduler.next(card, now, rating).card;
      intervals.push(card.scheduled_days);
      now = card.due;
    }
    expect(intervals).toEqual([0, 2, 11, 46, 163, 498, 0, 0, 2, 4, 7, 12, 21]);
  });

  test("reports legacy migration loss instead of inventing rating history", () => {
    const assessment = assessLegacyReviewMigration(event(3).legacyBefore);
    expect(assessment.historyCompleteness).toBe("aggregate-only");
    expect(assessment.seedEligible).toBe(false);
    expect(assessment.missingFields).toContain("timestamped-ratings");
  });

  test("is disabled by default and never modifies the legacy schedule", () => {
    const storage = new MemoryStorage();
    const frozenEvent = Object.freeze(event(1));
    const before = structuredClone(frozenEvent);
    expect(recordFsrsShadowReview({ storage, event: frozenEvent })).toEqual({
      status: "disabled",
      persisted: false,
      record: null,
    });
    expect(frozenEvent).toEqual(before);
    expect(storage.getItem(FSRS_SHADOW_STORAGE_KEY)).toBeNull();
  });

  test("records prospectively, is idempotent, and keeps rollout off", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    const first = recordFsrsShadowReview({ storage, event: event(1) });
    const duplicate = recordFsrsShadowReview({ storage, event: event(1) });
    expect(first.status).toBe("recorded");
    expect(duplicate.status).toBe("duplicate");
    expect(duplicate.record?.events).toHaveLength(1);
    expect(duplicate.record?.learnerScheduleApplied).toBe(false);
    expect(duplicate.record?.rolloutEligible).toBe(false);
    expect(duplicate.record?.learningOutcome).toBe("not-evaluated");
    expect(duplicate.record?.legacyMigration.seedEligible).toBe(false);
  });

  test("clears only shadow state for rollback", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    storage.setItem("learner-state", "preserve-me");
    recordFsrsShadowReview({ storage, event: event(1) });
    clearFsrsShadowRecords(storage);
    expect(readFsrsShadowRecords(storage)).toEqual([]);
    expect(storage.getItem("learner-state")).toBe("preserve-me");
  });

  test("maps review outcomes without SM-2 ease factors", () => {
    expect(fsrsShadowRatingFromResult(false, "easy")).toBe(1);
    expect(fsrsShadowRatingFromResult(true, "hard")).toBe(2);
    expect(fsrsShadowRatingFromResult(true, "good")).toBe(3);
    expect(fsrsShadowRatingFromResult(true, "easy")).toBe(4);
  });

  test("deterministically replays and compares 1,000 representative histories", () => {
    const startedAt = performance.now();
    const records = Array.from({ length: 1_000 }, (_, historyIndex) => {
      const ratings = Array.from({ length: 8 }, (_, eventIndex) =>
        event(
          eventIndex,
          (((historyIndex + eventIndex) % 4) + 1) as 1 | 2 | 3 | 4,
          `review-${historyIndex}`,
        ),
      );
      const candidate = replayFsrsShadowEvents(ratings);
      const latest = ratings.at(-1)!;
      return {
        version: 1 as const,
        algorithm: FSRS_SHADOW_ALGORITHM,
        language: latest.language,
        cardId: `${latest.language}:${latest.sourceId}`,
        reviewId: latest.reviewId,
        sourceId: latest.sourceId,
        startedAt: ratings[0].reviewedAt,
        updatedAt: latest.reviewedAt,
        historyOrigin: "prospective-after-opt-in" as const,
        legacyMigration: assessLegacyReviewMigration(ratings[0].legacyBefore),
        events: ratings,
        candidate,
        comparison: {
          legacyDueAt: latest.legacyAfter.dueAt,
          fsrsDueAt: candidate.dueAt,
          deltaDays:
            (Date.parse(candidate.dueAt) - latest.legacyAfter.dueAt) /
            86_400_000,
        },
        learnerScheduleApplied: false as const,
        rolloutEligible: false as const,
        learningOutcome: "not-evaluated" as const,
      };
    });
    const elapsedMs = performance.now() - startedAt;
    const comparison = compareFsrsShadowDueCounts(
      records,
      new Date(Date.UTC(2026, 0, 8)),
      10,
    );
    expect(records).toHaveLength(1_000);
    expect(comparison.recordCount).toBe(1_000);
    expect(comparison.legacyDueCount).toBe(0);
    expect(comparison.fsrsDueCount).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(5_000);
    console.info(
      JSON.stringify({
        benchmark: "fsrs-shadow-1000-histories",
        elapsedMs: Number(elapsedMs.toFixed(2)),
        comparison,
      }),
    );
  });

  test("continues one shadow card across renewed legacy review IDs", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    recordFsrsShadowReview({
      storage,
      event: { ...event(1, 3, "legacy-review-a"), language: "en" },
    });
    const renewed = event(2, 4, "legacy-review-b");
    const result = recordFsrsShadowReview({
      storage,
      event: { ...renewed, sourceId: "present-perfect-b1" },
    });
    expect(result.record?.cardId).toBe("en:present-perfect-b1");
    expect(result.record?.events.map((row) => row.reviewId)).toEqual([
      "legacy-review-a",
      "legacy-review-b",
    ]);
  });

  test("storage failure never breaks the learner review", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    const unavailable = {
      getItem: storage.getItem.bind(storage),
      setItem() {
        throw new DOMException("quota", "QuotaExceededError");
      },
    };
    const result = recordFsrsShadowReview({
      storage: unavailable,
      event: event(1),
    });
    expect(result.status).toBe("storage-unavailable");
    expect(result.persisted).toBe(false);
    expect(result.record?.learnerScheduleApplied).toBe(false);
  });

  test("malformed opt-in data fails closed instead of breaking a review", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    const malformed = {
      ...event(1),
      legacyAfter: { ...event(1).legacyAfter, dueAt: Number.NaN },
    };
    const result = recordFsrsShadowReview({ storage, event: malformed });
    expect(result).toEqual({
      status: "invalid-event",
      persisted: false,
      record: null,
    });
  });

  test("never truncates a card history when local capacity is reached", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "automaticity-feature-flags-v1",
      JSON.stringify({ fsrs_shadow_v1: true }),
    );
    let lastResult = recordFsrsShadowReview({
      storage,
      event: { ...event(0), language: "en" },
    });
    for (let index = 1; index < MAX_FSRS_EVENTS_PER_REVIEW; index += 1) {
      lastResult = recordFsrsShadowReview({
        storage,
        event: { ...event(index), language: "en" },
      });
    }
    expect(lastResult.record?.events).toHaveLength(MAX_FSRS_EVENTS_PER_REVIEW);
    const overflow = recordFsrsShadowReview({
      storage,
      event: { ...event(MAX_FSRS_EVENTS_PER_REVIEW), language: "en" },
    });
    expect(overflow.status).toBe("capacity-reached");
    expect(readFsrsShadowRecords(storage)[0]?.events).toHaveLength(
      MAX_FSRS_EVENTS_PER_REVIEW,
    );
  });
});
