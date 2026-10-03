import type {
  DailySessionMinutes,
  EvidenceRecord,
  LearningDomainEvent,
  LearningEvidenceLedger,
  LearningLanguage,
  LearningMode,
} from "./index";

export const MEASUREMENT_SCHEMA_VERSION = "1.0.0" as const;
export const MEASUREMENT_EXPORT_KIND =
  "automaticity.privacy-safe-measurement-export" as const;
export const MEASUREMENT_CONSENT_STORAGE_KEY =
  "automaticity:measurement-consent:v1" as const;
export const MEASUREMENT_BASELINE_STORAGE_KEY =
  "automaticity:measurement-baseline:v1" as const;

export type MeasurementDataCategory =
  | "identifier-metadata"
  | "learning-outcomes"
  | "engagement-events"
  | "human-rating-provenance";

export const DEFAULT_MEASUREMENT_DATA_CATEGORIES = [
  "identifier-metadata",
  "learning-outcomes",
  "engagement-events",
  "human-rating-provenance",
] as const satisfies readonly MeasurementDataCategory[];

const MEASUREMENT_DATA_CATEGORY_SET: ReadonlySet<string> = new Set(
  DEFAULT_MEASUREMENT_DATA_CATEGORIES,
);
const MEASUREMENT_INTERVENTION_FLAGS = [
  "experimentalScheduling",
  "aiIntervention",
] as const;

export const MEASUREMENT_RETENTION_POLICY = {
  version: "2026-08-22",
  storage: "local-device-only",
  maximumDays: 365,
  exportTransfer: "user-initiated-download-only",
  deletion:
    "Revoking stops new exports. Delete removes the local consent and baseline records; learning backups remain separate.",
} as const;

export interface MeasurementConsent {
  readonly schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  readonly id: string;
  readonly participantId: string;
  readonly purpose: "product-effectiveness-research";
  readonly dataCategories: readonly MeasurementDataCategory[];
  readonly policyVersion: string;
  readonly status: "granted" | "revoked";
  readonly grantedAt: string;
  readonly revokedAt: string | null;
}

export interface GrantMeasurementConsentInput {
  readonly id: string;
  readonly participantId: string;
  readonly grantedAt: string;
  readonly dataCategories?: readonly MeasurementDataCategory[];
  readonly policyVersion?: string;
}

export interface MeasurementBaseline {
  readonly schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  readonly id: string;
  readonly participantId: string;
  readonly capturedAt: string;
  readonly language: LearningLanguage;
  readonly appVersion: string;
  readonly sessionMinutes: DailySessionMinutes;
  readonly capturedBeforeIntervention: true;
  readonly interventionFlags: Readonly<Record<string, false>>;
  readonly summary: {
    readonly attemptCount: number;
    readonly verifiedEvidenceCount: number;
    readonly masteryEligibleCount: number;
    readonly delayedRecallCount: number;
    readonly novelTransferCount: number;
  };
}

export interface CaptureMeasurementBaselineInput {
  readonly id: string;
  readonly capturedAt: string;
  readonly language: LearningLanguage;
  readonly appVersion: string;
  readonly sessionMinutes: DailySessionMinutes;
  readonly interventionFlags: Readonly<Record<string, boolean>>;
  readonly ledger: LearningEvidenceLedger;
}

export type CaptureMeasurementBaselineResult =
  | {
      readonly status: "captured";
      readonly baseline: MeasurementBaseline;
      readonly reused: boolean;
    }
  | {
      readonly status: "unavailable";
      readonly reason: "consent-required" | "intervention-already-enabled";
    };

export type MeasurementMetricClass = "learning-outcome" | "engagement";

export interface MeasurementEventEnvelope {
  readonly schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  readonly eventId: string;
  readonly sourceEventType: LearningDomainEvent["type"];
  readonly occurredAt: string;
  readonly language: LearningLanguage;
  readonly appVersion: string;
  readonly contentVersion: string | null;
  readonly metricClass: MeasurementMetricClass;
  readonly references: {
    readonly responseId: string | null;
    readonly evidenceId: string | null;
    readonly contentUnitId: string | null;
    readonly dailyPlanId: string | null;
    readonly supersedingResponseId: string | null;
  };
}

export type HumanRatingProvenance =
  | { readonly status: "not-collected" }
  | {
      readonly status: "human-rated";
      readonly rubricVersion: string;
      readonly raterId: string;
      readonly ratedAt: string;
    };

export interface MeasurementOutcomeRecord {
  readonly schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  readonly evidenceId: string;
  readonly responseId: string;
  readonly contentUnitId: string;
  readonly occurredAt: string;
  readonly mode: LearningMode;
  readonly verificationStatus: EvidenceRecord["verification"]["status"];
  readonly verificationProvider: EvidenceRecord["verification"]["provider"];
  readonly targetHit: boolean;
  readonly accuracyScore: number;
  readonly fluencyScore: number | null;
  readonly realProduction: boolean;
  readonly delayedRecall: boolean;
  readonly novelTransfer: boolean;
  readonly repairCompleted: boolean;
  readonly masteryEligible: boolean;
  readonly humanRating: HumanRatingProvenance;
}

export type MeasurementMetricId =
  | "first_attempt_valid_rate"
  | "time_to_first_valid_speech"
  | "delayed_recall_rate"
  | "novel_transfer_rate"
  | "independent_repair_rate"
  | "return_after_gap_rate"
  | "false_positive_rate";

export interface MeasurementMetricDefinition {
  readonly id: MeasurementMetricId;
  readonly metricClass: MeasurementMetricClass;
  readonly unit: "rate" | "milliseconds";
  readonly numerator: string;
  readonly denominator: string;
  readonly minimumSampleSize: number;
  readonly humanLabelsRequired: boolean;
  readonly timezone: "UTC";
}

/**
 * Definitions are deliberately separate from computed values. A UI or export
 * must report N/A when the denominator, longitudinal window, or human labels
 * are missing instead of inventing a success statistic.
 */
export const MEASUREMENT_METRIC_DEFINITIONS = [
  {
    id: "first_attempt_valid_rate",
    metricClass: "learning-outcome",
    unit: "rate",
    numerator: "verified mastery-eligible first attempts",
    denominator: "all eligible first attempts",
    minimumSampleSize: 20,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "time_to_first_valid_speech",
    metricClass: "learning-outcome",
    unit: "milliseconds",
    numerator: "elapsed milliseconds to first verified speaking evidence",
    denominator: "sessions with a verified speaking attempt",
    minimumSampleSize: 20,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "delayed_recall_rate",
    metricClass: "learning-outcome",
    unit: "rate",
    numerator: "verified delayed-recall attempts",
    denominator: "due delayed-recall attempts",
    minimumSampleSize: 20,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "novel_transfer_rate",
    metricClass: "learning-outcome",
    unit: "rate",
    numerator: "verified novel-transfer attempts",
    denominator: "eligible novel-transfer attempts",
    minimumSampleSize: 20,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "independent_repair_rate",
    metricClass: "learning-outcome",
    unit: "rate",
    numerator: "verified independent repairs",
    denominator: "repair-required attempts",
    minimumSampleSize: 20,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "return_after_gap_rate",
    metricClass: "engagement",
    unit: "rate",
    numerator: "participants returning after a gap of at least 48 hours",
    denominator: "participants eligible to return after that gap",
    minimumSampleSize: 30,
    humanLabelsRequired: false,
    timezone: "UTC",
  },
  {
    id: "false_positive_rate",
    metricClass: "learning-outcome",
    unit: "rate",
    numerator: "system-positive outcomes rated incorrect by a human",
    denominator: "all human-rated system-positive outcomes",
    minimumSampleSize: 50,
    humanLabelsRequired: true,
    timezone: "UTC",
  },
] as const satisfies readonly MeasurementMetricDefinition[];

export interface PrivacySafeMeasurementExport {
  readonly kind: typeof MEASUREMENT_EXPORT_KIND;
  readonly schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly language: LearningLanguage;
  readonly appVersion: string;
  readonly consent: MeasurementConsent;
  readonly retentionPolicy: typeof MEASUREMENT_RETENTION_POLICY;
  readonly baseline: MeasurementBaseline;
  readonly events: readonly MeasurementEventEnvelope[];
  readonly outcomes: readonly MeasurementOutcomeRecord[];
  readonly metricDefinitions: readonly MeasurementMetricDefinition[];
  readonly cohortStatistics: {
    readonly status: "not-computed";
    readonly reason: "production-telemetry-unavailable";
  };
}

export type BuildPrivacySafeMeasurementExportResult =
  | { readonly status: "ready"; readonly data: PrivacySafeMeasurementExport }
  | {
      readonly status: "unavailable";
      readonly reason: "consent-required" | "baseline-required";
    };

export interface MeasurementStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readMeasurementConsent(
  storage: Pick<MeasurementStorage, "getItem">,
): MeasurementConsent | null {
  const value = readStoredObject(storage, MEASUREMENT_CONSENT_STORAGE_KEY);
  const categories = Array.isArray(value?.dataCategories)
    ? value.dataCategories.filter(
        (category): category is MeasurementDataCategory =>
          typeof category === "string" &&
          MEASUREMENT_DATA_CATEGORY_SET.has(category),
      )
    : [];
  if (
    value?.schemaVersion !== MEASUREMENT_SCHEMA_VERSION ||
    typeof value.id !== "string" ||
    typeof value.participantId !== "string" ||
    value.purpose !== "product-effectiveness-research" ||
    !Array.isArray(value.dataCategories) ||
    categories.length !== value.dataCategories.length ||
    new Set(categories).size !== categories.length ||
    typeof value.policyVersion !== "string" ||
    (value.status !== "granted" && value.status !== "revoked") ||
    typeof value.grantedAt !== "string" ||
    (value.revokedAt !== null && typeof value.revokedAt !== "string") ||
    (value.status === "revoked" && typeof value.revokedAt !== "string")
  ) {
    return null;
  }
  return {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    id: value.id,
    participantId: value.participantId,
    purpose: "product-effectiveness-research",
    dataCategories: categories,
    policyVersion: value.policyVersion,
    status: value.status,
    grantedAt: value.grantedAt,
    revokedAt: value.revokedAt,
  };
}

export function grantMeasurementConsent(
  storage: Pick<MeasurementStorage, "setItem">,
  input: GrantMeasurementConsentInput,
): MeasurementConsent {
  const consent: MeasurementConsent = {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    id: input.id,
    participantId: input.participantId,
    purpose: "product-effectiveness-research",
    dataCategories: input.dataCategories ?? DEFAULT_MEASUREMENT_DATA_CATEGORIES,
    policyVersion: input.policyVersion ?? MEASUREMENT_RETENTION_POLICY.version,
    status: "granted",
    grantedAt: input.grantedAt,
    revokedAt: null,
  };
  storage.setItem(MEASUREMENT_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

export function revokeMeasurementConsent(
  storage: Pick<MeasurementStorage, "getItem" | "setItem">,
  revokedAt: string,
): MeasurementConsent | null {
  const current = readMeasurementConsent(storage);
  if (!current) return null;
  const revoked: MeasurementConsent = {
    ...current,
    status: "revoked",
    revokedAt,
  };
  storage.setItem(MEASUREMENT_CONSENT_STORAGE_KEY, JSON.stringify(revoked));
  return revoked;
}

export function deleteLocalMeasurementData(storage: MeasurementStorage): void {
  storage.removeItem(MEASUREMENT_CONSENT_STORAGE_KEY);
  storage.removeItem(MEASUREMENT_BASELINE_STORAGE_KEY);
}

export function enforceMeasurementRetention(
  storage: MeasurementStorage,
  now: string,
): boolean {
  const consent = readMeasurementConsent(storage);
  if (!consent) return false;
  const retentionAnchor = consent.revokedAt ?? consent.grantedAt;
  const elapsedMs = Date.parse(now) - Date.parse(retentionAnchor);
  const maximumMs =
    MEASUREMENT_RETENTION_POLICY.maximumDays * 24 * 60 * 60 * 1_000;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= maximumMs) return false;
  deleteLocalMeasurementData(storage);
  return true;
}

export function readMeasurementBaseline(
  storage: Pick<MeasurementStorage, "getItem">,
): MeasurementBaseline | null {
  const value = readStoredObject(storage, MEASUREMENT_BASELINE_STORAGE_KEY);
  const summary =
    value?.summary && typeof value.summary === "object"
      ? (value.summary as Record<string, unknown>)
      : null;
  const flags =
    value?.interventionFlags && typeof value.interventionFlags === "object"
      ? (value.interventionFlags as Record<string, unknown>)
      : null;
  if (
    value?.schemaVersion !== MEASUREMENT_SCHEMA_VERSION ||
    typeof value.id !== "string" ||
    typeof value.participantId !== "string" ||
    typeof value.capturedAt !== "string" ||
    (value.language !== "en" && value.language !== "de") ||
    typeof value.appVersion !== "string" ||
    (value.sessionMinutes !== 15 &&
      value.sessionMinutes !== 30 &&
      value.sessionMinutes !== 45) ||
    value.capturedBeforeIntervention !== true ||
    !summary ||
    !flags ||
    !MEASUREMENT_INTERVENTION_FLAGS.every((key) => flags[key] === false) ||
    ![
      summary.attemptCount,
      summary.verifiedEvidenceCount,
      summary.masteryEligibleCount,
      summary.delayedRecallCount,
      summary.novelTransferCount,
    ].every((count) => typeof count === "number" && count >= 0)
  ) {
    return null;
  }
  return {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    id: value.id,
    participantId: value.participantId,
    capturedAt: value.capturedAt,
    language: value.language,
    appVersion: value.appVersion,
    sessionMinutes: value.sessionMinutes,
    capturedBeforeIntervention: true,
    interventionFlags: {
      experimentalScheduling: false,
      aiIntervention: false,
    },
    summary: {
      attemptCount: summary.attemptCount as number,
      verifiedEvidenceCount: summary.verifiedEvidenceCount as number,
      masteryEligibleCount: summary.masteryEligibleCount as number,
      delayedRecallCount: summary.delayedRecallCount as number,
      novelTransferCount: summary.novelTransferCount as number,
    },
  };
}

export function captureMeasurementBaseline(
  storage: Pick<MeasurementStorage, "getItem" | "setItem">,
  input: CaptureMeasurementBaselineInput,
): CaptureMeasurementBaselineResult {
  const consent = readMeasurementConsent(storage);
  if (consent?.status !== "granted") {
    return { status: "unavailable", reason: "consent-required" };
  }
  if (Object.values(input.interventionFlags).some(Boolean)) {
    return { status: "unavailable", reason: "intervention-already-enabled" };
  }
  const existing = readMeasurementBaseline(storage);
  if (existing?.participantId === consent.participantId) {
    return { status: "captured", baseline: existing, reused: true };
  }
  const interventionFlags = Object.fromEntries(
    Object.keys(input.interventionFlags).map((key) => [key, false]),
  ) as Readonly<Record<string, false>>;
  const baseline: MeasurementBaseline = {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    id: input.id,
    participantId: consent.participantId,
    capturedAt: input.capturedAt,
    language: input.language,
    appVersion: input.appVersion,
    sessionMinutes: input.sessionMinutes,
    capturedBeforeIntervention: true,
    interventionFlags,
    summary: summarizeLedger(input.ledger),
  };
  storage.setItem(MEASUREMENT_BASELINE_STORAGE_KEY, JSON.stringify(baseline));
  return { status: "captured", baseline, reused: false };
}

export function buildPrivacySafeMeasurementExport(input: {
  readonly language: LearningLanguage;
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly storage: Pick<MeasurementStorage, "getItem">;
  readonly ledger: LearningEvidenceLedger;
}): BuildPrivacySafeMeasurementExportResult {
  const consent = readMeasurementConsent(input.storage);
  if (consent?.status !== "granted") {
    return { status: "unavailable", reason: "consent-required" };
  }
  const baseline = readMeasurementBaseline(input.storage);
  if (!baseline || baseline.participantId !== consent.participantId) {
    return { status: "unavailable", reason: "baseline-required" };
  }
  const data: PrivacySafeMeasurementExport = {
    kind: MEASUREMENT_EXPORT_KIND,
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    exportedAt: input.exportedAt,
    language: input.language,
    appVersion: input.appVersion,
    consent,
    retentionPolicy: MEASUREMENT_RETENTION_POLICY,
    baseline,
    events: input.ledger.events.map((event) =>
      toMeasurementEvent(event, input.language, input.appVersion, input.ledger),
    ),
    outcomes: input.ledger.evidence.map(toMeasurementOutcome),
    metricDefinitions: MEASUREMENT_METRIC_DEFINITIONS,
    cohortStatistics: {
      status: "not-computed",
      reason: "production-telemetry-unavailable",
    },
  };
  return { status: "ready", data };
}

export type MeasurementQualityDimension =
  | "completeness"
  | "uniqueness"
  | "validity"
  | "time-version"
  | "privacy-leakage"
  | "sample-size";

export interface MeasurementQualityFinding {
  readonly dimension: MeasurementQualityDimension;
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly count: number;
  readonly message: string;
}

export interface MeasurementDataQualityReport {
  readonly status: "passed" | "failed" | "insufficient-data";
  readonly sampleSize: number;
  readonly checkedAt: string;
  readonly findings: readonly MeasurementQualityFinding[];
}

const PROHIBITED_ANALYTICS_KEY =
  /(?:inputtext|correctedtext|prompt|transcript|audio|email|ipaddress|hardwareid|devicefingerprint|freeform|intention)/i;

export function validatePrivacySafeMeasurementExport(
  data: PrivacySafeMeasurementExport,
  checkedAt: string,
): MeasurementDataQualityReport {
  const findings: MeasurementQualityFinding[] = [];
  const eventIds = data.events.map((event) => event.eventId);
  const duplicateCount = eventIds.length - new Set(eventIds).size;
  if (duplicateCount > 0) {
    findings.push({
      dimension: "uniqueness",
      severity: "error",
      code: "duplicate-event-id",
      count: duplicateCount,
      message: "Event IDs must be unique at the route-attempt grain.",
    });
  }

  const requiredStrings = [
    data.exportedAt,
    data.appVersion,
    data.consent.id,
    data.consent.participantId,
    data.baseline.id,
    data.baseline.participantId,
  ];
  const missingRequired = requiredStrings.filter(
    (value) => !value.trim(),
  ).length;
  if (missingRequired > 0) {
    findings.push({
      dimension: "completeness",
      severity: "error",
      code: "missing-required-value",
      count: missingRequired,
      message: "Required measurement identifiers and versions cannot be empty.",
    });
  }

  const timestamps = [
    data.exportedAt,
    data.consent.grantedAt,
    data.baseline.capturedAt,
    ...data.events.map((event) => event.occurredAt),
    ...data.outcomes.map((outcome) => outcome.occurredAt),
  ];
  const invalidTimestampCount = timestamps.filter(
    (value) => !Number.isFinite(Date.parse(value)),
  ).length;
  if (invalidTimestampCount > 0) {
    findings.push({
      dimension: "validity",
      severity: "error",
      code: "invalid-timestamp",
      count: invalidTimestampCount,
      message:
        "All measurement timestamps must be valid ISO-compatible values.",
    });
  }

  const invalidScoreCount = data.outcomes.filter(
    (outcome) =>
      outcome.accuracyScore < 0 ||
      outcome.accuracyScore > 100 ||
      (outcome.fluencyScore !== null &&
        (outcome.fluencyScore < 0 || outcome.fluencyScore > 100)),
  ).length;
  if (invalidScoreCount > 0) {
    findings.push({
      dimension: "validity",
      severity: "error",
      code: "score-out-of-range",
      count: invalidScoreCount,
      message: "Accuracy and fluency scores must remain within 0–100.",
    });
  }

  const versionMismatchCount = [
    data.schemaVersion,
    data.consent.schemaVersion,
    data.baseline.schemaVersion,
    ...data.events.map((event) => event.schemaVersion),
    ...data.outcomes.map((outcome) => outcome.schemaVersion),
  ].filter((version) => version !== MEASUREMENT_SCHEMA_VERSION).length;
  const baselineBeforeConsent =
    Number.isFinite(Date.parse(data.baseline.capturedAt)) &&
    Number.isFinite(Date.parse(data.consent.grantedAt)) &&
    Date.parse(data.baseline.capturedAt) < Date.parse(data.consent.grantedAt);
  if (versionMismatchCount > 0 || baselineBeforeConsent) {
    findings.push({
      dimension: "time-version",
      severity: "error",
      code: "invalid-time-version-contract",
      count: versionMismatchCount + (baselineBeforeConsent ? 1 : 0),
      message:
        "Schema versions must match and the baseline must be captured after consent but before intervention.",
    });
  }

  const leakagePaths = findProhibitedKeys(data);
  if (leakagePaths.length > 0) {
    findings.push({
      dimension: "privacy-leakage",
      severity: "error",
      code: "prohibited-raw-field",
      count: leakagePaths.length,
      message: `Raw learner content is prohibited in analytics (${leakagePaths.join(", ")}).`,
    });
  }

  if (data.outcomes.length === 0) {
    findings.push({
      dimension: "sample-size",
      severity: "warning",
      code: "insufficient-sample",
      count: 0,
      message: "N/A — no learning outcomes are available for calculation.",
    });
  }

  const failed = findings.some((finding) => finding.severity === "error");
  return {
    status: failed
      ? "failed"
      : data.outcomes.length === 0
        ? "insufficient-data"
        : "passed",
    sampleSize: data.outcomes.length,
    checkedAt,
    findings,
  };
}

function readStoredObject(
  storage: Pick<MeasurementStorage, "getItem">,
  key: string,
): Record<string, unknown> | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function summarizeLedger(
  ledger: LearningEvidenceLedger,
): MeasurementBaseline["summary"] {
  return {
    attemptCount: ledger.responses.length,
    verifiedEvidenceCount: ledger.evidence.filter(
      (evidence) => evidence.verification.status === "verified",
    ).length,
    masteryEligibleCount: ledger.evidence.filter(
      (evidence) => evidence.masteryEligible,
    ).length,
    delayedRecallCount: ledger.events.filter(
      (event) => event.type === "learning.delayed-recall.recorded.v1",
    ).length,
    novelTransferCount: ledger.events.filter(
      (event) => event.type === "learning.novel-transfer.recorded.v1",
    ).length,
  };
}

function toMeasurementEvent(
  event: LearningDomainEvent,
  language: LearningLanguage,
  appVersion: string,
  ledger: LearningEvidenceLedger,
): MeasurementEventEnvelope {
  const references = eventReferences(event);
  const contentVersion = references.contentUnitId
    ? (ledger.contentUnits.find(
        (content) => content.id === references.contentUnitId,
      )?.version ?? null)
    : null;
  return {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    eventId: event.id,
    sourceEventType: event.type,
    occurredAt: event.occurredAt,
    language,
    appVersion,
    contentVersion,
    metricClass: "learning-outcome",
    references,
  };
}

function eventReferences(
  event: LearningDomainEvent,
): MeasurementEventEnvelope["references"] {
  const payload = event.payload;
  return {
    responseId: "responseId" in payload ? payload.responseId : null,
    evidenceId: "evidenceId" in payload ? payload.evidenceId : null,
    contentUnitId: "contentUnitId" in payload ? payload.contentUnitId : null,
    dailyPlanId: "dailyPlanId" in payload ? payload.dailyPlanId : null,
    supersedingResponseId:
      "supersedingResponseId" in payload ? payload.supersedingResponseId : null,
  };
}

function toMeasurementOutcome(
  evidence: EvidenceRecord,
): MeasurementOutcomeRecord {
  return {
    schemaVersion: MEASUREMENT_SCHEMA_VERSION,
    evidenceId: evidence.id,
    responseId: evidence.responseId,
    contentUnitId: evidence.contentUnitId,
    occurredAt: evidence.createdAt,
    mode: evidence.mode,
    verificationStatus: evidence.verification.status,
    verificationProvider: evidence.verification.provider,
    targetHit: evidence.metrics.targetHit,
    accuracyScore: evidence.metrics.accuracyScore,
    fluencyScore: evidence.metrics.fluencyScore,
    realProduction: evidence.gates.realProduction,
    delayedRecall: evidence.gates.delayedRecall,
    novelTransfer: evidence.gates.novelTransfer,
    repairCompleted: evidence.gates.repairCompleted,
    masteryEligible: evidence.masteryEligible,
    humanRating: { status: "not-collected" },
  };
}

function findProhibitedKeys(value: unknown, path = "$"): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findProhibitedKeys(item, `${path}[${index}]`),
    );
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => {
      const childPath = `${path}.${key}`;
      return [
        ...(PROHIBITED_ANALYTICS_KEY.test(key) ? [childPath] : []),
        ...findProhibitedKeys(child, childPath),
      ];
    },
  );
}
