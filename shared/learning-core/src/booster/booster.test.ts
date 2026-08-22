import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import {
  BOOSTER_ATTEMPT_STORAGE_KEY,
  BOOSTER_COPY,
  createBoosterAttemptId,
  createBoosterPlan,
  DEFAULT_BOOSTER_FEATURE_FLAGS,
  isBoosterModeEnabled,
  readBoosterAttempts,
  saveBoosterAttempt,
  scoreBoosterAttempt,
  type BoosterAttemptInput,
  type BoosterKeyValueStorage,
} from ".";
import {
  countCompleteProductions,
  countValidatedStructureUses,
} from "./browser-entry";

class MemoryStorage implements BoosterKeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const plan = createBoosterPlan({
  language: "en",
  targetStructureId: "en:b1:present-perfect",
  targetStructureLabel: "Present perfect",
  sessionMinutes: 15,
  automatizationMinutes: 4,
  prompts: BOOSTER_COPY.en.prompts,
});

function attempt(
  overrides: Partial<BoosterAttemptInput> = {},
): BoosterAttemptInput {
  return {
    attemptId: "attempt-1",
    planId: plan.id,
    round: plan.rounds[0]!,
    targetStructureId: plan.targetStructureId,
    inputMode: "speaking",
    status: "completed",
    startedAt: "2026-08-22T10:00:00.000Z",
    firstProductionAt: "2026-08-22T10:00:02.000Z",
    completedAt: "2026-08-22T10:00:32.000Z",
    responseText: "I have finished one project and I have learned a lot.",
    audioBytes: 8_000,
    validatedStructureUses: 2,
    productionCount: 2,
    selfRepairCount: 1,
    ...overrides,
  };
}

describe("forced-output booster contract", () => {
  test("stays off by default and requires the exact booster_mode flag", () => {
    expect(isBoosterModeEnabled(DEFAULT_BOOSTER_FEATURE_FLAGS)).toBe(false);
    expect(isBoosterModeEnabled({ booster_mode: false })).toBe(false);
    expect(isBoosterModeEnabled({ booster_mode: true })).toBe(true);
  });

  test("allocates three to five rounds only inside the automatization block", () => {
    const cases = [
      { minutes: 4, rounds: 3 },
      { minutes: 7, rounds: 4 },
      { minutes: 10, rounds: 5 },
    ];
    for (const item of cases) {
      const candidate = createBoosterPlan({
        language: "de",
        targetStructureId: "de:b1:weil",
        targetStructureLabel: "weil-Nebensatz",
        sessionMinutes: item.minutes * 4,
        automatizationMinutes: item.minutes,
        prompts: BOOSTER_COPY.de.prompts,
      });
      expect(candidate.sourceBlock).toBe("automatization");
      expect(candidate.allocatedAutomatizationMinutes).toBe(item.minutes);
      expect(candidate.rounds).toHaveLength(item.rounds);
      expect(
        candidate.rounds.every(
          (round) => round.durationSeconds >= 30 && round.durationSeconds <= 90,
        ),
      ).toBe(true);
      expect(candidate.learningOutcome).toBe("not-evaluated");
    }
  });

  test("keeps every composite component and the composite itself bounded to 0-1", () => {
    for (let index = -100; index <= 100; index += 1) {
      const result = scoreBoosterAttempt(
        attempt({
          validatedStructureUses: index,
          productionCount: index * 2,
          firstProductionAt: new Date(
            Date.parse("2026-08-22T10:00:00.000Z") + index * 1_000,
          ),
        }),
      );
      expect(result.metrics).not.toBeNull();
      for (const score of [
        result.metrics!.structureUseScore,
        result.metrics!.productionCountScore,
        result.metrics!.latencyScore,
        result.metrics!.fluencyScore,
        result.metrics!.composite,
      ]) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  test("empty, abandoned, and audio-free recordings create no speaking evidence", () => {
    for (const candidate of [
      attempt({ responseText: "" }),
      attempt({ status: "abandoned" }),
      attempt({ audioBytes: 0 }),
      attempt({ firstProductionAt: null }),
    ]) {
      const result = scoreBoosterAttempt(candidate);
      expect(result.status).toBe("no-evidence");
      expect(result.speakingEvidence).toBe(false);
      expect(result.metrics).toBeNull();
      expect(result.masteryEligible).toBe(false);
    }
  });

  test("typing fallback is explicit and never becomes speaking or mastery evidence", () => {
    const result = scoreBoosterAttempt(
      attempt({ inputMode: "typing", audioBytes: 0 }),
    );
    expect(result.status).toBe("practice-evidence");
    expect(result.typingFallback).toBe(true);
    expect(result.speakingEvidence).toBe(false);
    expect(result.masteryEligible).toBe(false);
    expect(result.automaticityClaim).toBe("insufficient-longitudinal-evidence");
    expect(result.learningOutcome).toBe("not-evaluated");
  });

  test("links a minimal stored result to attempt, round, plan, and target IDs", () => {
    const storage = new MemoryStorage();
    const result = scoreBoosterAttempt(attempt());
    saveBoosterAttempt(storage, result);
    const stored = readBoosterAttempts(storage, result.occurredAt);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      attemptId: "attempt-1",
      planId: plan.id,
      roundId: plan.rounds[0]!.id,
      targetStructureId: "en:b1:present-perfect",
      learningOutcome: "not-evaluated",
      masteryEligible: false,
    });
    const raw = storage.getItem(BOOSTER_ATTEMPT_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("I have finished");
    expect(raw).not.toContain("audio/");
  });

  test("stable attempt IDs use the exact plan, round, and start time", () => {
    const input = {
      planId: plan.id,
      roundId: plan.rounds[0]!.id,
      startedAt: "2026-08-22T10:00:00.000Z",
    };
    expect(createBoosterAttemptId(input)).toBe(createBoosterAttemptId(input));
    expect(createBoosterAttemptId(input)).not.toBe(
      createBoosterAttemptId({
        ...input,
        roundId: plan.rounds[1]!.id,
      }),
    );
  });

  test("English and German copy is complete and avoids mastery claims", () => {
    for (const copy of [BOOSTER_COPY.en, BOOSTER_COPY.de]) {
      expect(copy.direction).toBe("ltr");
      expect(Object.keys(copy.prompts)).toHaveLength(5);
      expect(copy.practiceOnly.toLowerCase()).toContain(
        copy === BOOSTER_COPY.en ? "not mastery" : "keine beherrschung",
      );
    }
  });

  test("a keyword or malformed fragment alone is never a checked structure use", () => {
    const patterns = [
      String.raw`\b(?:I|you|we|they)\s+have\s+(?:finished|done|seen|been)\b`,
    ];
    expect(countValidatedStructureUses("have", patterns)).toBe(0);
    expect(countValidatedStructureUses("I have.", patterns)).toBe(0);
    expect(countCompleteProductions("I have.")).toBe(0);
    expect(
      countValidatedStructureUses(
        "I have finished the project. I have seen the result.",
        patterns,
      ),
    ).toBe(2);
    expect(
      countCompleteProductions(
        "I have finished the project. I have seen the result.",
      ),
    ).toBe(2);
  });

  test("the browser runtime remains below a 9 KiB gzip budget", () => {
    const directory = dirname(fileURLToPath(import.meta.url));
    const browserBundle = readFileSync(
      join(directory, "../../browser/forced-output-booster.js"),
    );
    expect(gzipSync(browserBundle).byteLength).toBeLessThan(9 * 1024);
  });
});
