export const LEARNING_SCHEMA_VERSION = "1.0.0" as const;
export const LEARNING_DATA_EXPORT_KIND =
  "automaticity.learning-data-export" as const;

export * from "./adherence";
export * from "./booster";
export * from "./content-quality";
export * from "./fsrs-shadow";
export * from "./measurement";

export type LearningLanguage = "en" | "de";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type DailySessionMinutes = 15 | 30 | 45;
export type LearningMode =
  | "recognition"
  | "recall"
  | "writing"
  | "speaking"
  | "repair"
  | "transfer"
  | "mediation";

const LEARNING_MODES: ReadonlySet<string> = new Set([
  "recognition",
  "recall",
  "writing",
  "speaking",
  "repair",
  "transfer",
  "mediation",
]);

export function isLearningMode(value: string): value is LearningMode {
  return LEARNING_MODES.has(value);
}

export type DailyAutomaticityBlockId =
  | "grammar"
  | "mixed_practice"
  | "conversation_studio"
  | "review"
  | "automatization";

export interface DailyAutomaticityBlock {
  readonly id: DailyAutomaticityBlockId;
  readonly minutes: number;
  readonly practiceUnits: number;
}

export interface DailyAutomaticityProgram {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly sessionMinutes: DailySessionMinutes;
  readonly volumeMultiplier: 1 | 2 | 3;
  readonly blocks: readonly DailyAutomaticityBlock[];
}

export interface ContentUnit {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly id: string;
  readonly version: string;
  readonly language: LearningLanguage;
  readonly cefrLevel?: CefrLevel;
  readonly title: string;
  readonly targetForm: string;
  readonly prompt: string;
  readonly modes: readonly LearningMode[];
  readonly provenance: {
    readonly kind: "authored" | "open-dataset";
    readonly sourceId: string;
    readonly license: string;
    readonly humanReviewed: boolean;
  };
}

export interface DailyPracticePlan {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly id: string;
  readonly createdAt: string;
  readonly language: LearningLanguage;
  readonly sessionMinutes: DailySessionMinutes;
  readonly contentUnitId: string;
  readonly program: DailyAutomaticityProgram;
}

export interface LearnerResponse {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly id: string;
  readonly contentUnitId: string;
  readonly dailyPlanId: string;
  readonly mode: LearningMode;
  readonly submittedAt: string;
  readonly inputText: string;
  readonly correctedText: string;
  readonly latencyMs: number | null;
  readonly audio: {
    readonly captured: boolean;
    readonly persisted: boolean;
    readonly referenceId?: string;
  } | null;
}

export type EvidenceVerificationStatus = "verified" | "unverified";

export interface EvidenceRecord {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly id: string;
  readonly responseId: string;
  readonly contentUnitId: string;
  readonly createdAt: string;
  readonly mode: LearningMode;
  readonly verification: {
    readonly status: EvidenceVerificationStatus;
    readonly provider: "deterministic" | "online" | "offline";
    readonly reason:
      | "verified-evaluation"
      | "missing-audio"
      | "missing-response"
      | "unverified-evaluation";
  };
  readonly metrics: {
    readonly targetHit: boolean;
    readonly accuracyScore: number;
    readonly fluencyScore: number | null;
  };
  readonly gates: {
    readonly realProduction: boolean;
    readonly targetDemonstrated: boolean;
    readonly providerChecked: boolean;
    readonly delayedRecall: boolean;
    readonly novelTransfer: boolean;
    readonly repairCompleted: boolean;
  };
  readonly masteryEligible: boolean;
  readonly qualification?: {
    readonly independent: boolean;
    readonly previousResponseId: string | null;
    readonly previousPractisedAt: string | null;
    readonly taskId: string | null;
    readonly previousTaskId: string | null;
    readonly contextId: string | null;
    readonly previousContextId: string | null;
  };
  readonly automaticityClaim: "insufficient-longitudinal-evidence";
}

export type LearningDomainEvent =
  | {
      readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
      readonly id: string;
      readonly type: "learning.response.submitted.v1";
      readonly occurredAt: string;
      readonly payload: {
        readonly responseId: string;
        readonly contentUnitId: string;
        readonly dailyPlanId: string;
        readonly mode: LearningMode;
      };
    }
  | {
      readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
      readonly id: string;
      readonly type: "learning.evidence.recorded.v1";
      readonly occurredAt: string;
      readonly payload: {
        readonly evidenceId: string;
        readonly responseId: string;
        readonly contentUnitId: string;
        readonly mode: LearningMode;
        readonly verificationStatus: EvidenceVerificationStatus;
        readonly masteryEligible: boolean;
      };
    }
  | {
      readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
      readonly id: string;
      readonly type: "learning.evidence.invalidated.v1";
      readonly occurredAt: string;
      readonly payload: {
        readonly evidenceId: string;
        readonly responseId: string;
        readonly contentUnitId: string;
        readonly reason: "superseded-by-rerecord";
        readonly supersedingResponseId: string;
      };
    }
  | {
      readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
      readonly id: string;
      readonly type: "learning.delayed-recall.recorded.v1";
      readonly occurredAt: string;
      readonly payload: {
        readonly evidenceId: string;
        readonly responseId: string;
        readonly contentUnitId: string;
      };
    }
  | {
      readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
      readonly id: string;
      readonly type: "learning.novel-transfer.recorded.v1";
      readonly occurredAt: string;
      readonly payload: {
        readonly evidenceId: string;
        readonly responseId: string;
        readonly contentUnitId: string;
      };
    };

export interface LearningEvidenceBundle {
  readonly contentUnit: ContentUnit;
  readonly dailyPlan: DailyPracticePlan;
  readonly response: LearnerResponse;
  readonly evidence: EvidenceRecord;
  readonly events: readonly LearningDomainEvent[];
}

export interface AttemptVerticalSliceInput {
  readonly attemptId: string;
  readonly occurredAt: string;
  readonly language: LearningLanguage;
  readonly cefrLevel?: CefrLevel;
  readonly contentVersion: string;
  readonly topic: string;
  readonly targetForm?: string;
  readonly prompt?: string;
  readonly mode: LearningMode;
  readonly inputText: string;
  readonly correctedText: string;
  readonly targetHit: boolean;
  readonly accuracyScore: number;
  readonly fluencyScore?: number | null;
  readonly latencyMs?: number | null;
  readonly attemptVerified: boolean;
  readonly assessedBy: "deterministic" | "online" | "offline";
  readonly sessionMinutes: DailySessionMinutes;
  readonly audioCaptured?: boolean;
  readonly audioReferenceId?: string;
  readonly fromDueReview?: boolean;
  readonly sourceId?: string;
  readonly provenance?: ContentUnit["provenance"];
  readonly independence?: {
    readonly unaided: boolean;
    readonly firstAttempt: boolean;
    readonly exampleExposed: boolean;
    readonly solutionExposed: boolean;
  };
  readonly reviewEvidence?: {
    readonly previousResponseId: string;
    readonly previousPractisedAt: string;
    readonly taskId: string;
    readonly previousTaskId: string;
    readonly contextId: string;
    readonly previousContextId: string;
  };
}

export interface EvidenceInvalidationInput {
  readonly evidenceId: string;
  readonly occurredAt: string;
  readonly supersedingResponseId: string;
}

export interface LearningEvidenceLedger {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly contentUnits: readonly ContentUnit[];
  readonly dailyPlans: readonly DailyPracticePlan[];
  readonly responses: readonly LearnerResponse[];
  readonly evidence: readonly EvidenceRecord[];
  readonly events: readonly LearningDomainEvent[];
}

/**
 * Portable, versioned learner backup shared by both language apps.
 *
 * The legacy exports contained only each app's UI state, which silently
 * dropped the normalized evidence ledger. Keeping the app state and ledger
 * as separate fields preserves backwards-readable data while making the
 * evidence schema explicit for later validation or migration.
 */
export interface LearningDataExport<TLearnerState = unknown> {
  readonly kind: typeof LEARNING_DATA_EXPORT_KIND;
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly language: LearningLanguage;
  readonly learnerState: TLearnerState;
  readonly learningEvidence: LearningEvidenceLedger;
}

export interface BuildLearningDataExportInput<TLearnerState> {
  readonly language: LearningLanguage;
  readonly exportedAt: string;
  readonly learnerState: TLearnerState;
  readonly storage: KeyValueStorage;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const LEARNING_EVIDENCE_STORAGE_KEY =
  "automaticity:learning-evidence:v1" as const;

export const DAILY_SESSION_OPTIONS = [15, 30, 45] as const;

export function normalizeDailySessionMinutes(
  value: number,
): DailySessionMinutes {
  if (value >= 45) return 45;
  if (value >= 30) return 30;
  return 15;
}

const DAILY_AUTOMATICITY_MINUTES: Record<
  DailySessionMinutes,
  readonly [number, number, number, number, number]
> = {
  15: [3, 3, 4, 2, 3],
  30: [6, 6, 8, 4, 6],
  45: [9, 10, 12, 5, 9],
};

const DAILY_AUTOMATICITY_UNITS: Record<
  DailySessionMinutes,
  readonly [number, number, number, number, number]
> = {
  15: [2, 2, 1, 2, 1],
  30: [4, 4, 2, 4, 2],
  45: [6, 6, 3, 6, 3],
};

const BLOCK_IDS: readonly DailyAutomaticityBlockId[] = [
  "grammar",
  "mixed_practice",
  "conversation_studio",
  "review",
  "automatization",
];

export function buildDailyAutomaticityProgram(
  sessionMinutes: DailySessionMinutes,
): DailyAutomaticityProgram {
  const minutes = DAILY_AUTOMATICITY_MINUTES[sessionMinutes];
  const units = DAILY_AUTOMATICITY_UNITS[sessionMinutes];
  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    sessionMinutes,
    volumeMultiplier: (sessionMinutes / 15) as 1 | 2 | 3,
    blocks: BLOCK_IDS.map((id, index) => ({
      id,
      minutes: minutes[index]!,
      practiceUnits: units[index]!,
    })),
  };
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "untitled";
}

export function validateContentUnit(unit: ContentUnit): readonly string[] {
  const errors: string[] = [];
  if (!unit.id.trim()) errors.push("id is required");
  if (!unit.version.trim()) errors.push("version is required");
  if (!unit.title.trim()) errors.push("title is required");
  if (!unit.targetForm.trim()) errors.push("targetForm is required");
  if (!unit.prompt.trim()) errors.push("prompt is required");
  if (unit.modes.length === 0) errors.push("at least one mode is required");
  if (!unit.provenance.sourceId.trim())
    errors.push("provenance.sourceId is required");
  if (!unit.provenance.license.trim())
    errors.push("provenance.license is required");
  return errors;
}

export function buildAttemptVerticalSlice(
  input: AttemptVerticalSliceInput,
): LearningEvidenceBundle {
  const contentUnitId = `${input.language}:authored:${slug(input.topic)}`;
  const dailyPlanId = `${input.language}:daily:${input.occurredAt.slice(0, 10)}:${input.sessionMinutes}`;
  const responseId = `${input.attemptId}:response`;
  const evidenceId = `${input.attemptId}:evidence`;
  const hasResponse = input.inputText.trim().length > 0;
  const audioCaptured = input.audioCaptured === true;
  const realProduction =
    hasResponse && (input.mode !== "speaking" || audioCaptured);
  const providerChecked =
    input.assessedBy === "deterministic" || input.assessedBy === "online";

  const reason: EvidenceRecord["verification"]["reason"] = !hasResponse
    ? "missing-response"
    : input.mode === "speaking" && !audioCaptured
      ? "missing-audio"
      : !input.attemptVerified || !providerChecked
        ? "unverified-evaluation"
        : "verified-evaluation";
  const verificationStatus: EvidenceVerificationStatus =
    reason === "verified-evaluation" ? "verified" : "unverified";

  const contentUnit: ContentUnit = {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    id: contentUnitId,
    version: input.contentVersion,
    language: input.language,
    ...(input.cefrLevel ? { cefrLevel: input.cefrLevel } : {}),
    title: input.topic,
    targetForm: input.targetForm?.trim() || input.topic,
    prompt: input.prompt?.trim() || `Produce ${input.topic} independently.`,
    modes: [input.mode],
    provenance: input.provenance ?? {
      kind: "authored",
      sourceId: input.sourceId ?? `${input.language}-app-authored-content`,
      license: "proprietary-authored",
      // Runtime construction proves neither independent review nor approval.
      humanReviewed: false,
    },
  };
  const dailyPlan: DailyPracticePlan = {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    id: dailyPlanId,
    createdAt: `${input.occurredAt.slice(0, 10)}T00:00:00.000Z`,
    language: input.language,
    sessionMinutes: input.sessionMinutes,
    contentUnitId,
    program: buildDailyAutomaticityProgram(input.sessionMinutes),
  };
  const response: LearnerResponse = {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    id: responseId,
    contentUnitId,
    dailyPlanId,
    mode: input.mode,
    submittedAt: input.occurredAt,
    inputText: input.inputText,
    correctedText: input.correctedText,
    latencyMs: input.latencyMs ?? null,
    audio:
      input.mode === "speaking"
        ? {
            captured: audioCaptured,
            persisted: Boolean(input.audioReferenceId),
            ...(input.audioReferenceId
              ? { referenceId: input.audioReferenceId }
              : {}),
          }
        : null,
  };
  const independent =
    input.independence?.unaided === true &&
    input.independence.firstAttempt &&
    !input.independence.exampleExposed &&
    !input.independence.solutionExposed &&
    input.mode !== "repair";
  const review = input.reviewEvidence;
  const elapsed = review
    ? Date.parse(input.occurredAt) - Date.parse(review.previousPractisedAt)
    : NaN;
  const hasPriorResponse =
    !!review?.previousResponseId?.trim() &&
    review.previousResponseId !== responseId;
  const delayedRecall =
    independent &&
    realProduction &&
    input.targetHit &&
    verificationStatus === "verified" &&
    hasPriorResponse &&
    Number.isFinite(elapsed) &&
    elapsed >= 86_400_000;
  const novelTransfer =
    independent &&
    realProduction &&
    input.targetHit &&
    verificationStatus === "verified" &&
    input.mode === "transfer" &&
    hasPriorResponse &&
    Number.isFinite(elapsed) &&
    elapsed >= 0 &&
    !!review?.taskId &&
    !!review.previousTaskId &&
    review.taskId !== review.previousTaskId &&
    !!review.contextId &&
    !!review.previousContextId &&
    review.contextId !== review.previousContextId;
  const masteryEligible =
    verificationStatus === "verified" &&
    realProduction &&
    input.targetHit &&
    independent;
  const evidence: EvidenceRecord = {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    id: evidenceId,
    responseId,
    contentUnitId,
    createdAt: input.occurredAt,
    mode: input.mode,
    verification: {
      status: verificationStatus,
      provider: input.assessedBy,
      reason,
    },
    metrics: {
      targetHit: input.targetHit,
      accuracyScore: clampScore(input.accuracyScore),
      fluencyScore:
        input.mode === "speaking" ? clampScore(input.fluencyScore ?? 0) : null,
    },
    gates: {
      realProduction,
      targetDemonstrated: input.targetHit,
      providerChecked,
      delayedRecall,
      novelTransfer,
      repairCompleted: input.mode === "repair" && input.targetHit,
    },
    masteryEligible,
    qualification: {
      independent,
      previousResponseId: review?.previousResponseId ?? null,
      previousPractisedAt: review?.previousPractisedAt ?? null,
      taskId: review?.taskId ?? null,
      previousTaskId: review?.previousTaskId ?? null,
      contextId: review?.contextId ?? null,
      previousContextId: review?.previousContextId ?? null,
    },
    // A single route attempt is evidence, never proof of automaticity.
    automaticityClaim: "insufficient-longitudinal-evidence",
  };
  const events: LearningDomainEvent[] = [
    {
      schemaVersion: LEARNING_SCHEMA_VERSION,
      id: `${input.attemptId}:response-submitted`,
      type: "learning.response.submitted.v1",
      occurredAt: input.occurredAt,
      payload: {
        responseId,
        contentUnitId,
        dailyPlanId,
        mode: input.mode,
      },
    },
    {
      schemaVersion: LEARNING_SCHEMA_VERSION,
      id: `${input.attemptId}:evidence-recorded`,
      type: "learning.evidence.recorded.v1",
      occurredAt: input.occurredAt,
      payload: {
        evidenceId,
        responseId,
        contentUnitId,
        mode: input.mode,
        verificationStatus,
        masteryEligible,
      },
    },
  ];

  if (delayedRecall) {
    events.push({
      schemaVersion: LEARNING_SCHEMA_VERSION,
      id: `${input.attemptId}:delayed-recall-recorded`,
      type: "learning.delayed-recall.recorded.v1",
      occurredAt: input.occurredAt,
      payload: { evidenceId, responseId, contentUnitId },
    });
  }
  if (novelTransfer) {
    events.push({
      schemaVersion: LEARNING_SCHEMA_VERSION,
      id: `${input.attemptId}:novel-transfer-recorded`,
      type: "learning.novel-transfer.recorded.v1",
      occurredAt: input.occurredAt,
      payload: { evidenceId, responseId, contentUnitId },
    });
  }

  return { contentUnit, dailyPlan, response, evidence, events };
}

export function emptyLearningEvidenceLedger(): LearningEvidenceLedger {
  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    contentUnits: [],
    dailyPlans: [],
    responses: [],
    evidence: [],
    events: [],
  };
}

function isLearningEvidenceLedger(
  value: unknown,
): value is LearningEvidenceLedger {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.schemaVersion === LEARNING_SCHEMA_VERSION &&
    Array.isArray(row.contentUnits) &&
    Array.isArray(row.dailyPlans) &&
    Array.isArray(row.responses) &&
    Array.isArray(row.evidence) &&
    Array.isArray(row.events) &&
    [
      row.contentUnits,
      row.dailyPlans,
      row.responses,
      row.evidence,
      row.events,
    ].every((records) =>
      (records as unknown[]).every(
        (record) =>
          !!record &&
          typeof record === "object" &&
          typeof (record as Record<string, unknown>).id === "string",
      ),
    ) &&
    (row.evidence as unknown[]).every((record) => {
      const evidence = record as Record<string, unknown>;
      return (
        !!evidence.gates &&
        typeof evidence.gates === "object" &&
        !!evidence.verification &&
        typeof evidence.verification === "object" &&
        !!evidence.metrics &&
        typeof evidence.metrics === "object"
      );
    })
  );
}

export function readLearningEvidenceLedger(
  storage: KeyValueStorage,
  key = LEARNING_EVIDENCE_STORAGE_KEY,
): LearningEvidenceLedger {
  try {
    const raw = storage.getItem(key);
    if (!raw) return emptyLearningEvidenceLedger();
    const value: unknown = JSON.parse(raw);
    if (!isLearningEvidenceLedger(value)) {
      return emptyLearningEvidenceLedger();
    }
    // Historical route flags are retained in the original stored JSON, but do
    // not become independently qualified evidence when read by current code.
    return {
      ...value,
      evidence: value.evidence.map((row) =>
        row.qualification?.independent === true
          ? row
          : {
              ...row,
              masteryEligible: false,
              gates: {
                ...row.gates,
                delayedRecall: false,
                novelTransfer: false,
              },
            },
      ),
    };
  } catch {
    return emptyLearningEvidenceLedger();
  }
}

export function buildLearningDataExport<TLearnerState>(
  input: BuildLearningDataExportInput<TLearnerState>,
): LearningDataExport<TLearnerState> {
  return {
    kind: LEARNING_DATA_EXPORT_KIND,
    schemaVersion: LEARNING_SCHEMA_VERSION,
    exportedAt: input.exportedAt,
    language: input.language,
    learnerState: input.learnerState,
    learningEvidence: readLearningEvidenceLedger(input.storage),
  };
}

/**
 * Accept only this app family's versioned backup envelope before a UI asks the
 * learner to replace local progress. This keeps measurement exports, other
 * languages, and arbitrary JSON files from being mistaken for a backup.
 */
export function parseLearningDataExport<TLearnerState = unknown>(
  value: unknown,
  expectedLanguage: LearningLanguage,
): LearningDataExport<TLearnerState> | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.kind !== LEARNING_DATA_EXPORT_KIND ||
    row.schemaVersion !== LEARNING_SCHEMA_VERSION ||
    row.language !== expectedLanguage ||
    typeof row.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(row.exportedAt)) ||
    !row.learnerState ||
    typeof row.learnerState !== "object" ||
    !isLearningEvidenceLedger(row.learningEvidence)
  ) {
    return null;
  }
  return value as LearningDataExport<TLearnerState>;
}

/** Restore the normalized evidence half only after the caller confirms import. */
export function writeLearningEvidenceLedger(
  storage: KeyValueStorage,
  ledger: LearningEvidenceLedger,
  key = LEARNING_EVIDENCE_STORAGE_KEY,
): void {
  storage.setItem(key, JSON.stringify(ledger));
}

export function appendLearningEvidenceBundleToStorage(
  storage: KeyValueStorage,
  bundle: LearningEvidenceBundle,
  key = LEARNING_EVIDENCE_STORAGE_KEY,
): LearningEvidenceLedger {
  const original = storage.getItem(key);
  if (original !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(original);
    } catch {
      throw new Error(
        "Stored evidence is unreadable; export a recovery copy before adding new evidence.",
      );
    }
    if (!isLearningEvidenceLedger(parsed))
      throw new Error(
        "Stored evidence has an unsupported shape; original data was kept.",
      );
  }
  const recoveryKey = `${key}:before-evidence-qualification-v2`;
  if (original !== null && storage.getItem(recoveryKey) === null) {
    storage.setItem(recoveryKey, original);
    if (storage.getItem(recoveryKey) !== original)
      throw new Error(
        "Original evidence could not be preserved; the append was cancelled.",
      );
  }
  const next = mergeLearningEvidenceBundle(
    readLearningEvidenceLedger(storage, key),
    bundle,
  );
  storage.setItem(key, JSON.stringify(next));
  return next;
}

export function appendEvidenceInvalidationToStorage(
  storage: KeyValueStorage,
  input: EvidenceInvalidationInput,
  key = LEARNING_EVIDENCE_STORAGE_KEY,
): LearningEvidenceLedger {
  const current = readLearningEvidenceLedger(storage, key);
  const evidence = current.evidence.find((row) => row.id === input.evidenceId);
  if (!evidence || !isEvidenceActive(current, input.evidenceId)) return current;

  const event: LearningDomainEvent = {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    id: `${input.evidenceId}:invalidated:${input.supersedingResponseId}`,
    type: "learning.evidence.invalidated.v1",
    occurredAt: input.occurredAt,
    payload: {
      evidenceId: evidence.id,
      responseId: evidence.responseId,
      contentUnitId: evidence.contentUnitId,
      reason: "superseded-by-rerecord",
      supersedingResponseId: input.supersedingResponseId,
    },
  };
  const next: LearningEvidenceLedger = {
    ...current,
    events: upsertById(current.events, event, Infinity),
  };
  storage.setItem(key, JSON.stringify(next));
  return next;
}

export function isEvidenceActive(
  ledger: LearningEvidenceLedger,
  evidenceId: string,
): boolean {
  return !ledger.events.some(
    (event) =>
      event.type === "learning.evidence.invalidated.v1" &&
      event.payload.evidenceId === evidenceId,
  );
}

function upsertById<T extends { readonly id: string }>(
  rows: readonly T[],
  row: T,
  limit: number,
): readonly T[] {
  return [...rows.filter((candidate) => candidate.id !== row.id), row].slice(
    -limit,
  );
}

export function mergeLearningEvidenceBundle(
  current: LearningEvidenceLedger,
  bundle: LearningEvidenceBundle,
  limit = Infinity,
): LearningEvidenceLedger {
  let events = current.events;
  for (const event of bundle.events) {
    events = upsertById(events, event, Infinity);
  }
  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    contentUnits: upsertById(
      current.contentUnits,
      bundle.contentUnit,
      Infinity,
    ),
    dailyPlans: upsertById(current.dailyPlans, bundle.dailyPlan, Infinity),
    responses: upsertById(current.responses, bundle.response, limit),
    evidence: upsertById(current.evidence, bundle.evidence, limit),
    events,
  };
}
