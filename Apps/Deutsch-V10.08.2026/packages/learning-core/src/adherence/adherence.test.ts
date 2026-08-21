import { describe, expect, test } from "bun:test";
import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADHERENCE_PROFILE_STORAGE_KEY,
  ADHERENCE_SHADOW_STORAGE_KEY,
  DEFAULT_ADHERENCE_FEATURE_FLAGS,
  computeBlockWeights,
  computeReadiness,
  createDefaultAdherenceProfile,
  emptyStreakState,
  isAdherenceShadowEnabled,
  loadProfile,
  logShadowComparison,
  migrateAdherenceProfile,
  readShadowComparisons,
  requestContinuityFreeze,
  saveProfile,
  updateStreak,
  type AdherenceKeyValueStorage,
  type PlanDuration,
  type ReadinessSignals,
} from "./index";

class MemoryStorage implements AdherenceKeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function pseudoRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function randomSignals(random: () => number): ReadinessSignals {
  const durations: readonly PlanDuration[] = [15, 30, 45];
  return {
    completionRate7d: random() * 2 - 0.5,
    daysSinceLastSession: Math.floor(random() * 500 - 50),
    srsReviewBacklog: Math.floor(random() * 12_000 - 1_000),
    planDuration: durations[Math.floor(random() * durations.length)]!,
    currentPracticeStreak: Math.floor(random() * 500 - 50),
  };
}

describe("adherence readiness and plan weighting", () => {
  test("readiness stays deterministic and bounded across 10,000 generated inputs", () => {
    const random = pseudoRandom(20_260_821);
    for (let run = 0; run < 10_000; run += 1) {
      const signals = randomSignals(random);
      const first = computeReadiness(signals);
      expect(first).toBeGreaterThanOrEqual(0.15);
      expect(first).toBeLessThanOrEqual(1);
      expect(computeReadiness(signals)).toBe(first);
    }
  });

  test("five block weights keep their invariants across 5,000 inputs", () => {
    const random = pseudoRandom(50_001);
    const durations: readonly PlanDuration[] = [15, 30, 45];
    for (let run = 0; run < 5_000; run += 1) {
      const weights = computeBlockWeights(
        random() * 1.5 - 0.25,
        durations[Math.floor(random() * durations.length)]!,
      );
      const values = Object.values(weights);
      expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6);
      for (const value of values) expect(value).toBeGreaterThanOrEqual(0.05);
    }
  });

  test("low readiness shifts time toward review without removing productive blocks", () => {
    const recovery = computeBlockWeights(0.15, 15);
    const standard = computeBlockWeights(1, 15);
    expect(recovery.review).toBeGreaterThan(standard.review);
    expect(recovery.conversation_studio).toBeGreaterThanOrEqual(0.2);
    expect(recovery.automatization).toBeGreaterThanOrEqual(0.2);
  });
});

describe("real-session streak transitions", () => {
  const zone = "Europe/Berlin";
  const initial = emptyStreakState("2026-08-01T10:00:00Z", zone);

  test("1. no session does not increment anything", () => {
    expect(updateStreak(initial, false, "2026-08-01T12:00:00Z", zone)).toEqual(
      initial,
    );
  });

  test("2. first real session starts the chain", () => {
    const next = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    expect(next.totalActiveDays).toBe(1);
    expect(next.currentPracticeStreak).toBe(1);
    expect(next.lastPracticeDate).toBe("2026-08-01");
  });

  test("3. a second session on the same local day is idempotent", () => {
    const once = updateStreak(initial, true, "2026-08-01T08:00:00Z", zone);
    const twice = updateStreak(once, true, "2026-08-01T20:00:00Z", zone);
    expect(twice).toEqual(once);
  });

  test("4. a consecutive real day increments the practice streak", () => {
    const day1 = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    const day2 = updateStreak(day1, true, "2026-08-02T12:00:00Z", zone);
    expect(day2.currentPracticeStreak).toBe(2);
    expect(day2.totalActiveDays).toBe(2);
  });

  test("5. a gap of two days starts a comeback and resets an unprotected chain", () => {
    const day1 = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    const comeback = updateStreak(day1, true, "2026-08-03T12:00:00Z", zone);
    expect(comeback.currentPracticeStreak).toBe(1);
    expect(comeback.comebackStartedAt).toBe("2026-08-03");
    expect(comeback.longestComebackStreak).toBe(1);
  });

  test("6. a granted freeze protects continuity across one missed day", () => {
    const day1 = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    const frozen = requestContinuityFreeze(day1, "2026-08-02T12:00:00Z", zone);
    const day3 = updateStreak(frozen, true, "2026-08-03T12:00:00Z", zone);
    expect(day3.currentPracticeStreak).toBe(2);
    expect(day3.comebackStartedAt).toBe("2026-08-03");
  });

  test("7. no more than two freezes can be used in one month", () => {
    const first = requestContinuityFreeze(
      initial,
      "2026-08-02T12:00:00Z",
      zone,
    );
    const second = requestContinuityFreeze(first, "2026-08-03T12:00:00Z", zone);
    const exhausted = requestContinuityFreeze(
      second,
      "2026-08-04T12:00:00Z",
      zone,
    );
    expect(exhausted.freezesUsedThisMonth).toBe(2);
    expect(exhausted.continuityProtectedUntil).toBe("2026-08-03");
  });

  test("8. the freeze allowance resets in a new local month", () => {
    const exhausted = {
      ...initial,
      freezesUsedThisMonth: 2,
      freezeMonthKey: "2026-08",
    };
    const next = requestContinuityFreeze(
      exhausted,
      "2026-09-01T12:00:00Z",
      zone,
    );
    expect(next.freezesUsedThisMonth).toBe(1);
    expect(next.freezeMonthKey).toBe("2026-09");
  });

  test("9. a no-session update never fabricates a comeback", () => {
    const day1 = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    const idle = updateStreak(day1, false, "2026-08-10T12:00:00Z", zone);
    expect(idle.totalActiveDays).toBe(1);
    expect(idle.comebackStartedAt).toBeNull();
  });

  test("10. session identity follows the supplied timezone", () => {
    const utc = emptyStreakState("2026-08-01T22:30:00Z", "UTC");
    const berlin = emptyStreakState("2026-08-01T22:30:00Z", zone);
    expect(
      updateStreak(utc, true, "2026-08-01T22:30:00Z", "UTC").lastPracticeDate,
    ).toBe("2026-08-01");
    expect(
      updateStreak(berlin, true, "2026-08-01T22:30:00Z", zone).lastPracticeDate,
    ).toBe("2026-08-02");
  });

  test("a continuing comeback updates its longest observed run", () => {
    const day1 = updateStreak(initial, true, "2026-08-01T12:00:00Z", zone);
    const comeback = updateStreak(day1, true, "2026-08-03T12:00:00Z", zone);
    const continued = updateStreak(
      comeback,
      true,
      "2026-08-04T12:00:00Z",
      zone,
    );
    expect(continued.longestComebackStreak).toBe(2);
  });
});

describe("profile migration and isolated storage adapters", () => {
  const options = {
    now: "2026-08-21T10:00:00.000Z",
    timeZone: "Europe/Berlin",
  } as const;

  test("50 legacy profiles migrate deterministically and preserve larger totals", () => {
    for (let index = 0; index < 50; index += 1) {
      const legacy = {
        totalActiveDays: index + 10,
        currentPracticeStreak: index % 8,
      };
      const first = migrateAdherenceProfile(legacy, options);
      const second = migrateAdherenceProfile(first, options);
      expect(first.version).toBe(1);
      expect(first.streak.totalActiveDays).toBe(index + 10);
      expect(second).toEqual(first);
    }
  });

  test("migration can seed the current streak from real session dates", () => {
    const profile = migrateAdherenceProfile(null, {
      ...options,
      sessionDates: ["2026-08-18", "2026-08-19", "2026-08-20"],
    });
    expect(profile.streak.totalActiveDays).toBe(3);
    expect(profile.streak.currentPracticeStreak).toBe(3);
    expect(profile.streak.lastPracticeDate).toBe("2026-08-20");
  });

  test("profile storage round-trips without a browser global", () => {
    const storage = new MemoryStorage();
    const profile = createDefaultAdherenceProfile(options);
    saveProfile(storage, profile);
    expect(storage.values.has(ADHERENCE_PROFILE_STORAGE_KEY)).toBe(true);
    expect(loadProfile(storage, options)).toEqual(profile);
  });

  test("invalid stored JSON falls back to a deterministic empty profile", () => {
    const storage = new MemoryStorage();
    storage.setItem(ADHERENCE_PROFILE_STORAGE_KEY, "{invalid");
    expect(loadProfile(storage, options)).toEqual(
      createDefaultAdherenceProfile(options),
    );
  });

  test("shadow entries round-trip and same-day records are replaced", () => {
    const storage = new MemoryStorage();
    const blockWeights = computeBlockWeights(0.6, 30);
    const base = {
      date: "2026-08-21",
      planDuration: 30 as const,
      readiness: 0.6,
      predictedCompletion: false,
      actualCompletion: false,
      blockWeights,
    };
    logShadowComparison(storage, base);
    logShadowComparison(storage, {
      ...base,
      predictedCompletion: true,
      actualCompletion: true,
    });
    expect(storage.values.has(ADHERENCE_SHADOW_STORAGE_KEY)).toBe(true);
    expect(readShadowComparisons(storage)).toEqual([
      { ...base, predictedCompletion: true, actualCompletion: true },
    ]);
  });
});

describe("shadow rollout boundaries", () => {
  test("the flag defaults off and requires an explicit internal override", () => {
    expect(isAdherenceShadowEnabled(DEFAULT_ADHERENCE_FEATURE_FLAGS)).toBe(
      false,
    );
    expect(isAdherenceShadowEnabled({ adherence_v1_shadow: true })).toBe(true);
  });

  test("production source remains below the 5 KiB gzip budget", () => {
    const directory = dirname(fileURLToPath(import.meta.url));
    const source = readdirSync(directory)
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .sort()
      .map((name) => readFileSync(join(directory, name)))
      .join("\n");
    expect(gzipSync(source).byteLength).toBeLessThan(5 * 1024);
  });
});
