import type {
  BoosterAttemptInput,
  BoosterAttemptResultV1,
  BoosterFeatureFlags,
  BoosterKeyValueStorage,
  BoosterPlanV1,
  BoosterPromptType,
} from "./types";

export const BOOSTER_MODE_FLAG = "booster_mode" as const;
export const BOOSTER_FEATURE_FLAG_STORAGE_KEY =
  "automaticity-feature-flags-v1" as const;
export const BOOSTER_ATTEMPT_STORAGE_KEY =
  "automaticity-booster-attempts-v1" as const;
export const DEFAULT_BOOSTER_FEATURE_FLAGS: Readonly<
  Required<BoosterFeatureFlags>
> = { booster_mode: false };

const PROMPT_ORDER: readonly BoosterPromptType[] = [
  "picture-description",
  "situation-reaction",
  "continuation",
  "transformation",
  "mini-argument",
];
const MIN_AUDIO_BYTES = 1_024;
const RETENTION_DAYS = 180;
const MAX_ATTEMPTS = 250;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function roundedScore(value: number): number {
  return Number(clamp01(value).toFixed(4));
}

function asDate(value: Date | string): Date {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new RangeError("Invalid date");
  return parsed;
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function normalizedSessionMinutes(value: number): 15 | 30 | 45 {
  if (value >= 45) return 45;
  if (value >= 30) return 30;
  return 15;
}

function roundCountForMinutes(automatizationMinutes: number): 3 | 4 | 5 {
  if (automatizationMinutes >= 9) return 5;
  if (automatizationMinutes >= 6) return 4;
  return 3;
}

export function isBoosterModeEnabled(flags: BoosterFeatureFlags): boolean {
  return flags.booster_mode === true;
}

export function readBoosterFeatureFlags(
  storage: Pick<BoosterKeyValueStorage, "getItem">,
  key = BOOSTER_FEATURE_FLAG_STORAGE_KEY,
): Required<BoosterFeatureFlags> {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_BOOSTER_FEATURE_FLAGS };
    }
    return {
      booster_mode: (parsed as Record<string, unknown>).booster_mode === true,
    };
  } catch {
    return { ...DEFAULT_BOOSTER_FEATURE_FLAGS };
  }
}

export function createBoosterPlan(input: {
  readonly language: "en" | "de";
  readonly targetStructureId: string;
  readonly targetStructureLabel: string;
  readonly sessionMinutes: number;
  readonly automatizationMinutes: number;
  readonly prompts: Readonly<Record<BoosterPromptType, string>>;
}): BoosterPlanV1 {
  if (!input.targetStructureId.trim() || !input.targetStructureLabel.trim()) {
    throw new RangeError("Target structure is required");
  }
  if (
    !Number.isFinite(input.automatizationMinutes) ||
    input.automatizationMinutes < 2
  ) {
    throw new RangeError("At least two automatization minutes are required");
  }
  const sessionMinutes = normalizedSessionMinutes(input.sessionMinutes);
  const allocatedAutomatizationMinutes = Math.max(
    2,
    Math.floor(input.automatizationMinutes),
  );
  const roundCount = roundCountForMinutes(allocatedAutomatizationMinutes);
  const transitionSeconds = 15 * (roundCount - 1);
  const secondsPerRound = Math.min(
    90,
    Math.max(
      30,
      Math.floor(
        (allocatedAutomatizationMinutes * 60 - transitionSeconds) / roundCount,
      ),
    ),
  );
  const idSource = [
    input.language,
    input.targetStructureId,
    sessionMinutes,
    allocatedAutomatizationMinutes,
  ].join("|");
  const id = `booster-plan-${stableHash(idSource)}`;
  return {
    version: 1,
    id,
    language: input.language,
    targetStructureId: input.targetStructureId,
    targetStructureLabel: input.targetStructureLabel,
    sessionMinutes,
    sourceBlock: "automatization",
    allocatedAutomatizationMinutes,
    rounds: PROMPT_ORDER.slice(0, roundCount).map((promptType, index) => ({
      id: `${id}:round-${index + 1}`,
      promptType,
      prompt: input.prompts[promptType].replace(
        "{target}",
        input.targetStructureLabel,
      ),
      durationSeconds: secondsPerRound,
      requiredProductions: index < 2 ? 2 : 3,
      requiredStructureUses: index < 2 ? 1 : 2,
    })),
    learningOutcome: "not-evaluated",
  };
}

function words(value: string): readonly string[] {
  return value.trim().match(/[\p{L}\p{N}'’-]+/gu) ?? [];
}

export function scoreBoosterAttempt(
  input: BoosterAttemptInput,
): BoosterAttemptResultV1 {
  const startedAt = asDate(input.startedAt);
  const completedAt = asDate(input.completedAt);
  const firstProductionAt = input.firstProductionAt
    ? asDate(input.firstProductionAt)
    : null;
  const durationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());
  const wordCount = words(input.responseText).length;
  const audioCaptured =
    input.inputMode === "speaking" && input.audioBytes >= MIN_AUDIO_BYTES;
  const hasProduction =
    input.status === "completed" &&
    firstProductionAt !== null &&
    durationMs >= 1_000 &&
    wordCount > 0 &&
    (input.inputMode === "typing" || audioCaptured);
  const base = {
    version: 1 as const,
    attemptId: input.attemptId,
    planId: input.planId,
    roundId: input.round.id,
    targetStructureId: input.targetStructureId,
    inputMode: input.inputMode,
    occurredAt: completedAt.toISOString(),
    audioCaptured,
    speakingEvidence: hasProduction && input.inputMode === "speaking",
    typingFallback: input.inputMode === "typing",
    masteryEligible: false as const,
    automaticityClaim: "insufficient-longitudinal-evidence" as const,
    learningOutcome: "not-evaluated" as const,
  };
  if (!hasProduction) {
    return { ...base, status: "no-evidence", metrics: null };
  }

  const firstProductionLatencyMs = Math.max(
    0,
    firstProductionAt.getTime() - startedAt.getTime(),
  );
  const activeMinutes = Math.max(durationMs / 60_000, 1 / 60);
  const wordsPerMinute = Math.max(0, Math.round(wordCount / activeMinutes));
  const structureUseScore = roundedScore(
    Math.max(0, input.validatedStructureUses) /
      input.round.requiredStructureUses,
  );
  const productionCountScore = roundedScore(
    Math.max(0, input.productionCount) / input.round.requiredProductions,
  );
  const latencyScore = roundedScore(
    1 - firstProductionLatencyMs / (input.round.durationSeconds * 1_000),
  );
  const practicePace = input.inputMode === "speaking" ? 80 : 30;
  const fluencyScore = roundedScore(wordsPerMinute / practicePace);
  const composite = roundedScore(
    (structureUseScore + productionCountScore + latencyScore + fluencyScore) /
      4,
  );
  return {
    ...base,
    status: "practice-evidence",
    metrics: {
      structureUseScore,
      productionCountScore,
      latencyScore,
      fluencyScore,
      firstProductionLatencyMs,
      wordsPerMinute,
      wordCount,
      validatedStructureUses: Math.max(
        0,
        Math.floor(input.validatedStructureUses),
      ),
      productionCount: Math.max(0, Math.floor(input.productionCount)),
      selfRepairCount: Math.max(0, Math.floor(input.selfRepairCount ?? 0)),
      composite,
    },
  };
}

function isAttempt(value: unknown): value is BoosterAttemptResultV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Partial<BoosterAttemptResultV1>;
  return (
    row.version === 1 &&
    typeof row.attemptId === "string" &&
    typeof row.planId === "string" &&
    typeof row.roundId === "string" &&
    typeof row.targetStructureId === "string" &&
    (row.inputMode === "speaking" || row.inputMode === "typing") &&
    (row.status === "practice-evidence" || row.status === "no-evidence") &&
    typeof row.occurredAt === "string" &&
    Number.isFinite(Date.parse(row.occurredAt)) &&
    row.masteryEligible === false &&
    row.automaticityClaim === "insufficient-longitudinal-evidence" &&
    row.learningOutcome === "not-evaluated"
  );
}

export function readBoosterAttempts(
  storage: BoosterKeyValueStorage,
  now: Date | string = new Date(),
  key = BOOSTER_ATTEMPT_STORAGE_KEY,
): readonly BoosterAttemptResultV1[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const cutoff = asDate(now).getTime() - RETENTION_DAYS * 86_400_000;
    return parsed
      .filter(isAttempt)
      .filter((row) => Date.parse(row.occurredAt) >= cutoff)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .slice(-MAX_ATTEMPTS);
  } catch {
    return [];
  }
}

export function saveBoosterAttempt(
  storage: BoosterKeyValueStorage,
  attempt: BoosterAttemptResultV1,
  key = BOOSTER_ATTEMPT_STORAGE_KEY,
): readonly BoosterAttemptResultV1[] {
  if (!isAttempt(attempt)) throw new RangeError("Invalid booster attempt");
  const next = [
    ...readBoosterAttempts(storage, attempt.occurredAt, key).filter(
      (row) => row.attemptId !== attempt.attemptId,
    ),
    attempt,
  ].slice(-MAX_ATTEMPTS);
  storage.setItem(key, JSON.stringify(next));
  return next;
}

export function createBoosterAttemptId(input: {
  readonly planId: string;
  readonly roundId: string;
  readonly startedAt: Date | string;
}): string {
  const startedAt = asDate(input.startedAt).toISOString();
  return `booster-attempt-${stableHash(
    `${input.planId}|${input.roundId}|${startedAt}`,
  )}`;
}
