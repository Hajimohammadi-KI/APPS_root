import { describe, expect, test } from "bun:test";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADHERENCE_PROFILE_STORAGE_KEY,
  ADHERENCE_SHADOW_STORAGE_KEY,
  DEFAULT_ADHERENCE_FEATURE_FLAGS,
  computeBlockWeights,
  computeReadiness,
  createNudgeEvent,
  createDefaultAdherenceProfile,
  DEFAULT_NUDGE_POLICY,
  emptyStreakState,
  evaluateNudge,
  findEligibleTimeIntention,
  isAdherenceShadowEnabled,
  loadProfile,
  logNudgeEvent,
  logShadowComparison,
  matchIntention,
  migrateAdherenceProfile,
  NUDGE_COPY,
  readNudgeEvents,
  readShadowComparisons,
  replaceImplementationIntentions,
  replaceNudgeOptIn,
  requestContinuityFreeze,
  runAdherenceShadow,
  saveProfile,
  updateStreak,
  validateImplementationIntentions,
  IMPLEMENTATION_INTENTION_COPY,
  type AdherenceKeyValueStorage,
  type AdherenceCurrentPlan,
  type ImplementationIntention,
  type NudgeEventV1,
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

describe("optional implementation intentions", () => {
  const intentions: readonly ImplementationIntention[] = [
    {
      id: "morning-plan",
      trigger: "time",
      triggerLabel: "08:30",
      action: "full_session",
      active: true,
    },
    {
      id: "coffee-plan",
      trigger: "after_event",
      triggerLabel: "After breakfast",
      action: "review_only",
      active: true,
    },
  ];

  test("accepts optional zero or two-to-five active plans, never one or six", () => {
    expect(validateImplementationIntentions([])).toMatchObject({
      valid: true,
      activeCount: 0,
    });
    expect(validateImplementationIntentions(intentions)).toMatchObject({
      valid: true,
      activeCount: 2,
    });
    expect(
      validateImplementationIntentions(intentions.slice(0, 1)),
    ).toMatchObject({
      valid: false,
      code: "active-count",
    });
    expect(
      validateImplementationIntentions(
        Array.from({ length: 6 }, (_, index) => ({
          ...intentions[0]!,
          id: `plan-${index}`,
        })),
      ),
    ).toMatchObject({ valid: false, code: "active-count" });
  });

  test("matches active time and normalized local labels without emitting anything", () => {
    expect(
      matchIntention(intentions[0]!, {
        trigger: "time",
        triggerLabel: "08:30",
      }),
    ).toBe(true);
    expect(
      matchIntention(intentions[1]!, {
        trigger: "after_event",
        triggerLabel: "  AFTER   BREAKFAST ",
      }),
    ).toBe(true);
    expect(
      matchIntention(
        { ...intentions[1]!, active: false },
        { trigger: "after_event", triggerLabel: "after breakfast" },
      ),
    ).toBe(false);
    expect(
      matchIntention(intentions[1]!, {
        trigger: "context",
        triggerLabel: "after breakfast",
      }),
    ).toBe(false);
  });

  test("rejects invalid times, duplicate IDs, and blank labels", () => {
    expect(
      validateImplementationIntentions([
        { ...intentions[0]!, triggerLabel: "25:99" },
        intentions[1]!,
      ]),
    ).toMatchObject({ valid: false, code: "invalid-label" });
    expect(
      validateImplementationIntentions([
        intentions[0]!,
        { ...intentions[1]!, id: intentions[0]!.id },
      ]),
    ).toMatchObject({ valid: false, code: "duplicate-id" });
  });

  test("replacement preserves streak and opt-in state and remains local-only", () => {
    const profile = {
      ...createDefaultAdherenceProfile({
        now: "2026-08-22T08:00:00.000Z",
        timeZone: "Europe/Berlin",
      }),
      nudgeOptIn: false,
    };
    const next = replaceImplementationIntentions(
      profile,
      intentions,
      "2026-08-22T09:00:00.000Z",
    );
    expect(next.streak).toEqual(profile.streak);
    expect(next.nudgeOptIn).toBe(false);
    expect(next.intentions).toEqual(intentions);
    expect(profile.intentions).toEqual([]);
  });

  test("English, German, and Persian copy is complete with correct direction", () => {
    expect(IMPLEMENTATION_INTENTION_COPY.en.direction).toBe("ltr");
    expect(IMPLEMENTATION_INTENTION_COPY.de.direction).toBe("ltr");
    expect(IMPLEMENTATION_INTENTION_COPY.fa.direction).toBe("rtl");
    for (const copy of Object.values(IMPLEMENTATION_INTENTION_COPY)) {
      expect(Object.keys(copy.triggers)).toHaveLength(4);
      expect(Object.keys(copy.actions)).toHaveLength(4);
      expect(copy.privacy.length).toBeGreaterThan(20);
    }
  });
});

describe("consent-first guarded in-app nudges", () => {
  const zone = "Europe/Berlin";
  const trigger: ImplementationIntention = {
    id: "morning-plan",
    trigger: "time",
    triggerLabel: "08:30",
    action: "full_session",
    active: true,
  };
  const base = {
    trigger,
    now: "2026-08-20T06:40:00.000Z",
    timeZone: zone,
    readiness: 0.8,
    reviewBacklog: 2,
    optedIn: true,
    history: [] as readonly NudgeEventV1[],
  } as const;

  function shown(triggerId: string, occurredAt: string): NudgeEventV1 {
    return createNudgeEvent({
      type: "shown",
      triggerId,
      occurredAt,
      timeZone: zone,
      decision: "eligible",
    });
  }

  test("uses the required first-failure guard order", () => {
    const cooldown = shown("morning-plan", "2026-08-20T06:00:00.000Z");
    expect(
      evaluateNudge({
        ...base,
        trigger: { ...trigger, active: false },
        readiness: 0,
        reviewBacklog: 999,
        optedIn: false,
        history: [cooldown],
      }).code,
    ).toBe("ineligible-trigger");
    expect(evaluateNudge({ ...base, history: [cooldown] }).code).toBe(
      "trigger-cooldown",
    );

    const evening = {
      ...trigger,
      id: "evening-plan",
      triggerLabel: "21:00",
    };
    expect(
      evaluateNudge({
        ...base,
        trigger: evening,
        now: "2026-08-20T19:05:00.000Z",
        readiness: 0,
        reviewBacklog: 999,
        optedIn: false,
      }).code,
    ).toBe("quiet-hours");
    expect(evaluateNudge({ ...base, readiness: 0.34 }).code).toBe(
      "low-readiness",
    );
    expect(evaluateNudge({ ...base, reviewBacklog: 41 }).code).toBe(
      "review-backlog-cap",
    );
    expect(evaluateNudge({ ...base, optedIn: false }).code).toBe("opted-out");

    const todayShown = shown("other-plan", "2026-08-20T05:00:00.000Z");
    expect(evaluateNudge({ ...base, history: [todayShown] }).code).toBe(
      "daily-cap",
    );
    const weekHistory = [
      shown("other-1", "2026-08-17T10:00:00.000Z"),
      shown("other-2", "2026-08-18T10:00:00.000Z"),
      shown("other-3", "2026-08-19T10:00:00.000Z"),
    ];
    expect(evaluateNudge({ ...base, history: weekHistory }).code).toBe(
      "weekly-cap",
    );
    expect(evaluateNudge(base)).toMatchObject({
      eligible: true,
      code: "eligible",
      triggerId: "morning-plan",
      learningOutcome: "not-evaluated",
    });
  });

  test("matches only active time plans inside the local 30-minute window", () => {
    expect(findEligibleTimeIntention([trigger], base.now, zone)?.id).toBe(
      "morning-plan",
    );
    expect(
      findEligibleTimeIntention(
        [{ ...trigger, action: "skip_ok" }],
        base.now,
        zone,
      ),
    ).toBeNull();
    expect(
      findEligibleTimeIntention([trigger], "2026-08-20T07:01:00.000Z", zone),
    ).toBeNull();
  });

  test("uses real timezone offsets through both Berlin DST transitions", () => {
    const spring = findEligibleTimeIntention(
      [trigger],
      "2026-03-29T06:30:00.000Z",
      zone,
    );
    const autumn = findEligibleTimeIntention(
      [trigger],
      "2026-10-25T07:30:00.000Z",
      zone,
    );
    expect(spring?.id).toBe(trigger.id);
    expect(autumn?.id).toBe(trigger.id);

    const onlySeventyOneHoursAgo = shown(
      trigger.id,
      "2026-03-26T07:30:00.000Z",
    );
    expect(
      evaluateNudge({
        ...base,
        now: "2026-03-29T06:30:00.000Z",
        history: [onlySeventyOneHoursAgo],
      }).code,
    ).toBe("trigger-cooldown");
  });

  test("persists minimal stable engagement events and expires old rows", () => {
    const storage = new MemoryStorage();
    const event = createNudgeEvent({
      type: "evaluated",
      triggerId: trigger.id,
      occurredAt: base.now,
      timeZone: zone,
      decision: "eligible",
    });
    const duplicate = createNudgeEvent({
      type: "evaluated",
      triggerId: trigger.id,
      occurredAt: base.now,
      timeZone: zone,
      decision: "eligible",
    });
    expect(duplicate.id).toBe(event.id);
    logNudgeEvent(storage, event);
    logNudgeEvent(storage, duplicate);
    expect(readNudgeEvents(storage, base.now)).toEqual([event]);
    expect(JSON.stringify(event)).not.toMatch(
      /triggerLabel|prompt|transcript|email|audio/i,
    );
    expect(readNudgeEvents(storage, "2026-12-01T08:00:00.000Z")).toEqual([]);
  });

  test("opt-in remains false by default and changing it preserves learner state", () => {
    const profile = createDefaultAdherenceProfile({
      now: base.now,
      timeZone: zone,
    });
    expect(profile.nudgeOptIn).toBe(false);
    const enabled = replaceNudgeOptIn(profile, true, base.now);
    expect(enabled.nudgeOptIn).toBe(true);
    expect(enabled.streak).toEqual(profile.streak);
    expect(enabled.intentions).toEqual(profile.intentions);
    expect(evaluateNudge({ ...base, optedIn: profile.nudgeOptIn }).code).toBe(
      "opted-out",
    );
  });

  test("policy and EN/DE/FA copy remain supportive and directionally correct", () => {
    expect(DEFAULT_NUDGE_POLICY).toMatchObject({
      eligibleWindowMinutes: 30,
      perTriggerCooldownHours: 72,
      minimumReadiness: 0.35,
      reviewBacklogCap: 40,
      dailyCap: 1,
      weeklyCap: 3,
    });
    expect(NUDGE_COPY.en.direction).toBe("ltr");
    expect(NUDGE_COPY.de.direction).toBe("ltr");
    expect(NUDGE_COPY.fa.direction).toBe("rtl");
    for (const copy of Object.values(NUDGE_COPY)) {
      expect(copy.policy.length).toBeGreaterThan(40);
      expect(copy.dismiss.length).toBeGreaterThan(5);
      expect(`${copy.promptTitle} ${copy.promptBody}`).not.toMatch(
        /failure|failed|lose|lost|schuld|versagt|تنبل|شکست/i,
      );
    }
  });
});

describe("shadow rollout boundaries", () => {
  test("the flag defaults off and requires an explicit internal override", () => {
    expect(isAdherenceShadowEnabled(DEFAULT_ADHERENCE_FEATURE_FLAGS)).toBe(
      false,
    );
    expect(isAdherenceShadowEnabled({ adherence_v1_shadow: true })).toBe(true);
  });

  test("flag off returns an isolated copy and does not compute or apply a proposal", () => {
    const currentPlan: AdherenceCurrentPlan = {
      planDuration: 15,
      blockMinutes: {
        grammar: 3,
        mixed_practice: 3,
        conversation_studio: 4,
        review: 2,
        automatization: 3,
      },
    };
    const result = runAdherenceShadow({
      flags: DEFAULT_ADHERENCE_FEATURE_FLAGS,
      currentPlan,
      readinessSignals: {
        completionRate7d: 0.5,
        daysSinceLastSession: 1,
        srsReviewBacklog: 3,
        planDuration: 15,
        currentPracticeStreak: 2,
      },
    });

    expect(result).toEqual({
      status: "disabled",
      featureFlagEnabled: false,
      currentPlan,
      proposedPlan: null,
      readiness: null,
      engagementPrediction: null,
      appliedToLearnerPlan: false,
      persisted: false,
      learningOutcome: "not-evaluated",
    });
    expect(result.currentPlan).not.toBe(currentPlan);
    expect(result.currentPlan.blockMinutes).not.toBe(currentPlan.blockMinutes);
  });

  test("enabled shadow computes a comparison but preserves every caller input", () => {
    const currentPlan: AdherenceCurrentPlan = {
      planDuration: 30,
      blockMinutes: {
        grammar: 4,
        mixed_practice: 8,
        conversation_studio: 6,
        review: 4,
        automatization: 8,
      },
    };
    const signals: ReadinessSignals = {
      completionRate7d: 0.35,
      daysSinceLastSession: 4,
      srsReviewBacklog: 12,
      planDuration: 30,
      currentPracticeStreak: 1,
    };
    const planBefore = structuredClone(currentPlan);
    const signalsBefore = structuredClone(signals);
    const result = runAdherenceShadow({
      flags: { adherence_v1_shadow: true },
      currentPlan,
      readinessSignals: signals,
    });

    expect(result.status).toBe("computed");
    expect(result.appliedToLearnerPlan).toBe(false);
    expect(result.persisted).toBe(false);
    expect(result.learningOutcome).toBe("not-evaluated");
    expect(currentPlan).toEqual(planBefore);
    expect(signals).toEqual(signalsBefore);
    expect(
      Object.values(result.proposedPlan!.blockMinutes).reduce(
        (sum, value) => sum + value,
        0,
      ),
    ).toBe(30);
  });

  test("15/30/45-minute shadow proposals remain deterministic and total the current duration", () => {
    const random = pseudoRandom(30_450_015);
    for (const planDuration of [15, 30, 45] as const) {
      for (let run = 0; run < 1_000; run += 1) {
        const currentPlan: AdherenceCurrentPlan = {
          planDuration,
          blockMinutes:
            planDuration === 15
              ? {
                  grammar: 3,
                  mixed_practice: 3,
                  conversation_studio: 4,
                  review: 2,
                  automatization: 3,
                }
              : planDuration === 30
                ? {
                    grammar: 6,
                    mixed_practice: 6,
                    conversation_studio: 8,
                    review: 4,
                    automatization: 6,
                  }
                : {
                    grammar: 9,
                    mixed_practice: 10,
                    conversation_studio: 12,
                    review: 5,
                    automatization: 9,
                  },
        };
        const input = {
          flags: { adherence_v1_shadow: true },
          currentPlan,
          readinessSignals: {
            ...randomSignals(random),
            planDuration,
          },
        } as const;
        const first = runAdherenceShadow(input);
        const second = runAdherenceShadow(input);
        expect(second).toEqual(first);
        expect(first.status).toBe("computed");
        expect(
          Object.values(first.proposedPlan!.blockMinutes).reduce(
            (sum, value) => sum + value,
            0,
          ),
        ).toBe(planDuration);
      }
    }
  });

  test("invalid or mismatched current plans fail closed", () => {
    const result = runAdherenceShadow({
      flags: { adherence_v1_shadow: true },
      currentPlan: {
        planDuration: 15,
        blockMinutes: {
          grammar: 3,
          mixed_practice: 3,
          conversation_studio: 4,
          review: 2,
          automatization: 2,
        },
      },
      readinessSignals: {
        completionRate7d: 1,
        daysSinceLastSession: 0,
        srsReviewBacklog: 0,
        planDuration: 30,
        currentPracticeStreak: 10,
      },
    });
    expect(result.status).toBe("invalid-current-plan");
    expect(result.proposedPlan).toBeNull();
    expect(result.appliedToLearnerPlan).toBe(false);
    expect(result.persisted).toBe(false);
  });

  test("the browser shadow adapter remains below the 5 KiB gzip budget", () => {
    const directory = dirname(fileURLToPath(import.meta.url));
    const browserBundle = readFileSync(
      join(directory, "../../browser/adherence-shadow.js"),
    );
    expect(gzipSync(browserBundle).byteLength).toBeLessThan(5 * 1024);
  });
});
