export const AUTOMATICITY_VERSION = 2 as const;
export type Language = "en" | "de";
export type Modality = "writing" | "speaking";
export type Stage =
  "notice" | "retrieve" | "vary" | "produce" | "repair" | "transfer" | "retain";
export type Verdict =
  "pass" | "needs_repair" | "target_not_observed" | "not_assessed";
export type ReviewStatus = "authored" | "machine_checked" | "human_reviewed";
export type TransferCondition = "none" | "target_named" | "elicited" | "free";

export interface TaskIdentity {
  /** Exact authored prompt/rubric/task definition, absent on older saved attempts. */
  definitionSha256?: string;
  id: string;
  version: string;
  constructionId: string;
  familyId: string;
  itemFamily: string;
  contextId: string;
  rubricVersion: string;
  stage: Stage;
  modality: Modality;
  partition: "teaching" | "practice" | "calibration" | "evaluation";
  transferCondition: TransferCondition;
  contentReview: ReviewStatus;
}

export interface AttemptEvent {
  version: 2;
  type: "attempt";
  id: string;
  language: Language;
  at: string;
  task: TaskIdentity;
  response: {
    text: string;
    sha256: string;
    originalTranscriptSha256: string | null;
    transcriptEdited: boolean;
  };
  timing: {
    startedAt: string;
    activeMs: number | null;
    firstInputMs: number | null;
    source: "monotonic_visible" | "unavailable";
  };
  assistance: {
    hintCount: number;
    solutionRevealed: boolean;
    exampleSeen: boolean;
    selfReportedAssistance: boolean;
  };
  audio: {
    id: string;
    sha256: string;
    bytes: number;
    durationMs: number;
    mime: string;
    persisted: boolean;
  } | null;
  previousAttemptId: string | null;
}

export interface AssessmentEvent {
  version: 2;
  type: "assessment";
  id: string;
  language: Language;
  at: string;
  attemptId: string;
  responseSha256: string;
  taskVersion: string;
  rubricVersion: string;
  verdict: Verdict;
  dimensions: {
    grammar: "pass" | "fail" | "unknown";
    target: "observed" | "not_observed" | "unknown";
    relevance: "pass" | "fail" | "unknown";
    opportunities: number | null;
  };
  evaluator: {
    id: string;
    version: string;
    kind: "rule" | "transformer" | "human" | "self";
    scopeApproved: boolean;
    reviewId: string | null;
  };
  uncertainty: boolean;
  confidence: number | null;
  feedback: string;
  correction: string | null;
  spans: { start: number; end: number; explanation: string }[];
  supersedes: string | null;
}

export interface ExposureEvent {
  version: 2;
  type: "exposure";
  id: string;
  language: Language;
  at: string;
  constructionId: string;
  taskId: string;
  itemFamily: string;
  kind: "example" | "hint" | "solution";
}

export interface InvalidationEvent {
  version: 2;
  type: "invalidation";
  id: string;
  language: Language;
  at: string;
  assessmentId: string;
  reason:
    | "review_overturned"
    | "transcript_changed"
    | "recording_replaced"
    | "invalid_provider_response";
}

export type AutomaticityEvent =
  AttemptEvent | AssessmentEvent | ExposureEvent | InvalidationEvent;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function text(value: unknown): value is string {
  return typeof value === "string";
}
function nonempty(value: unknown): value is string {
  return text(value) && value.trim().length > 0 && value.length <= 500;
}
function choice(value: unknown, values: readonly string[]): boolean {
  return text(value) && values.includes(value);
}
function count(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
function nullableCount(value: unknown): boolean {
  return value === null || count(value);
}
export function validDate(value: unknown): value is string {
  return (
    text(value) &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
export function validHash(value: unknown): value is string {
  return text(value) && /^[a-f0-9]{64}$/.test(value);
}

/** Reject malformed external/storage events before they can influence a score. */
export function parseAutomaticityEvent(
  value: unknown,
  language?: Language,
): AutomaticityEvent {
  assert(isRecord(value), "Event must be an object");
  assert(
    value.version === 2 && nonempty(value.id) && validDate(value.at),
    "Invalid event identity or date",
  );
  assert(
    choice(value.language, ["en", "de"]) &&
      (!language || language === value.language),
    "Wrong event language",
  );
  if (value.type === "attempt") {
    const task = value.task;
    assert(isRecord(task), "Missing task identity");
    assert(
      task.definitionSha256 === undefined || validHash(task.definitionSha256),
      "Invalid task definition hash",
    );
    for (const key of [
      "id",
      "version",
      "constructionId",
      "familyId",
      "itemFamily",
      "contextId",
      "rubricVersion",
    ])
      assert(nonempty(task[key]), `Invalid task ${key}`);
    assert(
      choice(task.stage, [
        "notice",
        "retrieve",
        "vary",
        "produce",
        "repair",
        "transfer",
        "retain",
      ]),
      "Invalid stage",
    );
    assert(choice(task.modality, ["writing", "speaking"]), "Invalid modality");
    assert(
      choice(task.partition, [
        "teaching",
        "practice",
        "calibration",
        "evaluation",
      ]),
      "Invalid task partition",
    );
    assert(
      choice(task.transferCondition, [
        "none",
        "target_named",
        "elicited",
        "free",
      ]),
      "Invalid transfer condition",
    );
    assert(
      choice(task.contentReview, [
        "authored",
        "machine_checked",
        "human_reviewed",
      ]),
      "Invalid content review",
    );
    const response = value.response;
    assert(
      isRecord(response) &&
        text(response.text) &&
        response.text.length <= 100_000 &&
        validHash(response.sha256),
      "Invalid response",
    );
    assert(
      (response.originalTranscriptSha256 === null ||
        validHash(response.originalTranscriptSha256)) &&
        typeof response.transcriptEdited === "boolean",
      "Invalid transcript identity",
    );
    const timing = value.timing;
    assert(
      isRecord(timing) &&
        validDate(timing.startedAt) &&
        Date.parse(timing.startedAt) <= Date.parse(value.at as string),
      "Invalid start time",
    );
    assert(
      nullableCount(timing.activeMs) &&
        nullableCount(timing.firstInputMs) &&
        choice(timing.source, ["monotonic_visible", "unavailable"]),
      "Invalid timing",
    );
    if (timing.source === "unavailable")
      assert(
        timing.activeMs === null && timing.firstInputMs === null,
        "Unavailable timing cannot contain measurements",
      );
    if (timing.activeMs !== null) {
      assert(
        (timing.activeMs as number) <=
          Date.parse(value.at as string) - Date.parse(timing.startedAt) + 1000,
        "Active time exceeds wall time",
      );
      assert(
        timing.firstInputMs === null ||
          (timing.firstInputMs as number) <= (timing.activeMs as number),
        "First-input time exceeds active time",
      );
    }
    const assistance = value.assistance;
    assert(
      isRecord(assistance) &&
        count(assistance.hintCount) &&
        ["solutionRevealed", "exampleSeen", "selfReportedAssistance"].every(
          (key) => typeof assistance[key] === "boolean",
        ),
      "Invalid assistance",
    );
    assert(
      value.previousAttemptId === null || nonempty(value.previousAttemptId),
      "Invalid prior attempt",
    );
    if (value.audio !== null) {
      const audio = value.audio;
      assert(
        isRecord(audio) &&
          nonempty(audio.id) &&
          validHash(audio.sha256) &&
          count(audio.bytes) &&
          count(audio.durationMs) &&
          text(audio.mime) &&
          typeof audio.persisted === "boolean",
        "Invalid audio",
      );
    }
  } else if (value.type === "assessment") {
    assert(
      nonempty(value.attemptId) &&
        validHash(value.responseSha256) &&
        nonempty(value.taskVersion) &&
        nonempty(value.rubricVersion),
      "Invalid assessment identity",
    );
    assert(
      choice(value.verdict, [
        "pass",
        "needs_repair",
        "target_not_observed",
        "not_assessed",
      ]),
      "Invalid verdict",
    );
    const d = value.dimensions;
    assert(
      isRecord(d) &&
        choice(d.grammar, ["pass", "fail", "unknown"]) &&
        choice(d.target, ["observed", "not_observed", "unknown"]) &&
        choice(d.relevance, ["pass", "fail", "unknown"]) &&
        nullableCount(d.opportunities),
      "Invalid assessment dimensions",
    );
    const evaluator = value.evaluator;
    assert(
      isRecord(evaluator) &&
        nonempty(evaluator.id) &&
        nonempty(evaluator.version) &&
        choice(evaluator.kind, ["rule", "transformer", "human", "self"]) &&
        typeof evaluator.scopeApproved === "boolean" &&
        (evaluator.reviewId === null || nonempty(evaluator.reviewId)),
      "Invalid evaluator",
    );
    assert(
      typeof value.uncertainty === "boolean" &&
        (value.confidence === null ||
          (typeof value.confidence === "number" &&
            Number.isFinite(value.confidence) &&
            value.confidence >= 0 &&
            value.confidence <= 1)),
      "Invalid confidence",
    );
    assert(
      text(value.feedback) &&
        (value.correction === null || text(value.correction)),
      "Invalid feedback",
    );
    assert(
      Array.isArray(value.spans) &&
        value.spans.every(
          (span) =>
            isRecord(span) &&
            count(span.start) &&
            count(span.end) &&
            span.end >= span.start &&
            text(span.explanation),
        ),
      "Invalid evidence spans",
    );
    assert(
      value.supersedes === null ||
        (nonempty(value.supersedes) && value.supersedes !== value.id),
      "Invalid supersession",
    );
    if (value.verdict === "pass")
      assert(
        d.grammar === "pass" &&
          d.target === "observed" &&
          d.relevance === "pass" &&
          (d.opportunities as number) > 0 &&
          !value.uncertainty,
        "Pass contradicts assessment dimensions",
      );
    if (value.verdict === "target_not_observed")
      assert(
        d.target === "not_observed",
        "Target verdict contradicts dimensions",
      );
    if (value.verdict === "not_assessed")
      assert(
        d.grammar === "unknown",
        "Unassessed cannot claim grammar accuracy",
      );
  } else if (value.type === "exposure") {
    assert(
      ["constructionId", "taskId", "itemFamily"].every((key) =>
        nonempty(value[key]),
      ) && choice(value.kind, ["example", "hint", "solution"]),
      "Invalid exposure",
    );
  } else if (value.type === "invalidation") {
    assert(
      nonempty(value.assessmentId) &&
        choice(value.reason, [
          "review_overturned",
          "transcript_changed",
          "recording_replaced",
          "invalid_provider_response",
        ]),
      "Invalid invalidation",
    );
  } else throw new Error("Unknown automaticity event type");
  return value as unknown as AutomaticityEvent;
}
