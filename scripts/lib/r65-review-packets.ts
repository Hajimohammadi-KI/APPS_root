import { isRecord } from "../../shared/learning-core/src/automaticity/contracts";
import type { PracticeTask } from "../../shared/learning-core/src/automaticity/curriculum";
import {
  caseDigest,
  digest,
  evidenceFile,
  reviewedManifest,
  type BenchmarkDraft,
  type BenchmarkManifest,
  type ReviewLabel,
} from "./model-benchmark";

export const R65_DEVELOPMENT_PATH =
  "research/assessment-benchmark/runs/writing-context-data-v2/development.jsonl";
export const R65_DEVELOPMENT_SHA256 =
  "d1c6c63f7e5e3a2a5c0e8fba0d4647aa7845276c35bb36769102c65721187e1c";
export const R65_PURPOSE = "independent_development_review_only";
const hashPattern = /^[a-f0-9]{64}$/;
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const triState = (value: unknown) =>
  value === null || typeof value === "boolean";
const normalizedText = (value: string) =>
  value.normalize("NFC").trim().replace(/\s+/gu, " ");

export interface BlindCase {
  caseId: string;
  caseSha256: string;
  language: "en" | "de";
  target: string;
  originalContext: { before: string; after: string };
}
export interface BlindPacket {
  schemaVersion: 1;
  kind: "r65-blind-development-packet";
  purpose: typeof R65_PURPOSE;
  packetId: string;
  createdAt: string;
  cases: BlindCase[];
}
export interface EvidenceRef {
  path: string;
  sha256: string;
}

export function validateBlindPacket(
  value: unknown,
): asserts value is BlindPacket {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== "r65-blind-development-packet" ||
    value.purpose !== R65_PURPOSE ||
    !nonempty(value.packetId) ||
    !validDate(value.createdAt) ||
    !Array.isArray(value.cases) ||
    !value.cases.length
  )
    throw Error("Invalid blind packet");
  const ids = new Set<string>();
  for (const row of value.cases) {
    if (
      !isRecord(row) ||
      !nonempty(row.caseId) ||
      ids.has(row.caseId) ||
      !["en", "de"].includes(String(row.language)) ||
      !nonempty(row.target) ||
      !isRecord(row.originalContext) ||
      typeof row.originalContext.before !== "string" ||
      typeof row.originalContext.after !== "string" ||
      Object.keys(row).some(
        (key) =>
          ![
            "caseId",
            "caseSha256",
            "language",
            "target",
            "originalContext",
          ].includes(key),
      ) ||
      Object.keys(row.originalContext).some(
        (key) => !["before", "after"].includes(key),
      ) ||
      row.caseSha256 !==
        digest(
          JSON.stringify({
            language: row.language,
            target: row.target,
            originalContext: row.originalContext,
          }),
        )
    )
      throw Error("Unblinded, duplicate or altered packet case");
    ids.add(row.caseId);
  }
}

/** Whitelist only original text. No source labels, reference edits or predictions enter forms. */
export function buildBlindPacket(
  bytes: string,
  selection: { sha256: string; count: number },
  packetId: string,
  createdAt: string,
) {
  if (
    !nonempty(packetId) ||
    !validDate(createdAt) ||
    !hashPattern.test(selection.sha256) ||
    digest(bytes) !== selection.sha256
  )
    throw Error("Changed development snapshot or invalid packet identity");
  const rows: unknown[] = bytes
    .trim()
    .split(/\r?\n/u)
    .map((line) => JSON.parse(line));
  if (rows.length !== selection.count || !rows.length)
    throw Error("Development count mismatch");
  const ids = new Set<string>(),
    surfaces = new Set<string>();
  const mappings: {
    caseId: string;
    sourceCaseId: string;
    sourceRowSha256: string;
  }[] = [];
  const cases = rows
    .map((row) => {
      if (
        !isRecord(row) ||
        !nonempty(row.id) ||
        !["en", "de"].includes(String(row.language)) ||
        row.sourceSplit !== "train" ||
        !nonempty(row.text) ||
        typeof row.before !== "string" ||
        typeof row.after !== "string" ||
        !["error", "clean"].includes(String(row.label)) ||
        !isRecord(row.reference)
      )
        throw Error(
          "Invalid development row; only the existing official-train development snapshot is accepted",
        );
      const surface = digest(JSON.stringify([row.language, row.text]));
      if (ids.has(row.id) || surfaces.has(surface))
        throw Error("Duplicate development case");
      ids.add(row.id);
      surfaces.add(surface);
      const caseId = `r65-${digest(`${packetId}:${row.id}`).slice(0, 24)}`;
      const original = {
        language: row.language as "en" | "de",
        target: row.text,
        originalContext: { before: row.before, after: row.after },
      };
      mappings.push({
        caseId,
        sourceCaseId: row.id,
        sourceRowSha256: digest(JSON.stringify(row)),
      });
      return {
        caseId,
        caseSha256: digest(JSON.stringify(original)),
        ...original,
      };
    })
    .sort((a, b) => a.caseId.localeCompare(b.caseId));
  const packet: BlindPacket = {
    schemaVersion: 1,
    kind: "r65-blind-development-packet",
    purpose: R65_PURPOSE,
    packetId,
    createdAt,
    cases,
  };
  return {
    packet,
    coordinator: {
      schemaVersion: 1,
      kind: "r65-private-coordinator",
      packetSha256: digest(JSON.stringify(packet)),
      developmentSha256: selection.sha256,
      mappings,
      instructions:
        "Keep separate from reviewers. Original corpus files and outcomes must not be overwritten. Later human judgments are a separate development analysis.",
    },
    publicSummary: {
      schemaVersion: 1,
      purpose: R65_PURPOSE,
      createdAt,
      developmentSha256: selection.sha256,
      packetSha256: digest(JSON.stringify(packet)),
      count: cases.length,
      languages: {
        en: cases.filter((row) => row.language === "en").length,
        de: cases.filter((row) => row.language === "de").length,
      },
      completedHumanReviews: 0,
      adjudications: 0,
      taskLinkedCases: 0,
      automaticallyApproved: false,
      holdoutRead: false,
      limitations:
        "Forms prepared only. No authenticated reviewers, independently collected task labels, held-out result or model approval is established.",
    },
  };
}

export function blankCorpusReview(
  packet: BlindPacket,
  stage: "independent" | "adjudication" = "independent",
) {
  return {
    schemaVersion: 1,
    kind: "r65-corpus-human-review",
    purpose: R65_PURPOSE,
    packetId: packet.packetId,
    packetSha256: digest(JSON.stringify(packet)),
    stage,
    provenance: null,
    reviewerId: null,
    role: null,
    reviewedAt: null,
    independentlyReviewed: null,
    sourceCorrectionsHidden: null,
    modelPredictionsHidden: null,
    previousReviews: [],
    labels: packet.cases.map((row) => ({
      caseId: row.caseId,
      caseSha256: row.caseSha256,
      grammar: null,
      contextSufficient: null,
      minimalCorrection: null,
      correctionSha256: null,
      note: "",
    })),
  };
}

function assertHuman(
  value: Record<string, unknown>,
  createdAt: string,
  now: string,
) {
  if (
    value.provenance !== "human_review" ||
    !nonempty(value.reviewerId) ||
    !nonempty(value.role) ||
    /codex|chatgpt|synthetic|fixture|automated/iu.test(value.reviewerId) ||
    !validDate(value.reviewedAt) ||
    !validDate(now) ||
    Date.parse(value.reviewedAt) < Date.parse(createdAt) ||
    Date.parse(value.reviewedAt) > Date.parse(now) ||
    value.independentlyReviewed !== true
  )
    throw Error(
      "Recorded human identity, role, timestamp and independent-review attestation required; identity is not externally authenticated",
    );
}

/** Validate actual recorded evidence, never turn a blank packet into human labels. */
export function validateCorpusReview(
  packet: BlindPacket,
  value: unknown,
  now: string,
) {
  validateBlindPacket(packet);
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== "r65-corpus-human-review" ||
    value.purpose !== R65_PURPOSE ||
    value.packetId !== packet.packetId ||
    value.packetSha256 !== digest(JSON.stringify(packet)) ||
    value.stage !== "independent" ||
    value.sourceCorrectionsHidden !== true ||
    value.modelPredictionsHidden !== true ||
    !Array.isArray(value.previousReviews) ||
    value.previousReviews.length ||
    !Array.isArray(value.labels) ||
    !value.labels.length
  )
    throw Error("Invalid, unblinded, stale or non-independent review");
  assertHuman(value, packet.createdAt, now);
  const seen = new Set<string>();
  for (const item of value.labels) {
    if (
      !isRecord(item) ||
      typeof item.caseId !== "string" ||
      seen.has(item.caseId)
    )
      throw Error("Duplicate or invalid human label");
    seen.add(item.caseId);
    const row = packet.cases.find((row) => row.caseId === item.caseId);
    if (
      !row ||
      item.caseSha256 !== row.caseSha256 ||
      !["acceptable", "needs_repair", "uncertain"].includes(
        String(item.grammar),
      ) ||
      !triState(item.contextSufficient) ||
      !nonempty(item.note)
    )
      throw Error("Missing or stale human judgment");
    if (item.grammar === "needs_repair") {
      if (
        !nonempty(item.minimalCorrection) ||
        normalizedText(item.minimalCorrection) === normalizedText(row.target) ||
        item.correctionSha256 !== digest(item.minimalCorrection)
      )
        throw Error(
          "Necessary correction must change the exact target and match its hash",
        );
    } else if (
      item.minimalCorrection !== null ||
      item.correctionSha256 !== null
    )
      throw Error(
        "No correction may accompany an acceptable or uncertain judgment",
      );
    if (item.contextSufficient !== true && item.grammar !== "uncertain")
      throw Error("Insufficient context must remain uncertain");
  }
  return {
    reviewerId: value.reviewerId as string,
    reviewedAt: value.reviewedAt as string,
    labels: value.labels,
    count: seen.size,
    approved: false as const,
  };
}

/** This template deliberately has no invented app task, intended meaning, response or correction. */
export function taskIntakeTemplate() {
  return {
    schemaVersion: 1,
    kind: "r65-task-linked-intake",
    purpose: R65_PURPOSE,
    createdAt: null,
    authoredBy: null,
    language: null,
    contentVersion: null,
    taskId: null,
    taskSha256: null,
    response: null,
    responseSha256: null,
    intendedMeaning: null,
    intendedMeaningSource: null,
    intendedMeaningSha256: null,
    proposedCorrection: null,
    correctionSha256: null,
    sourceId: null,
    license: null,
    consentEvidence: null,
  };
}

/** Resolve the task supplied by the caller; no curriculum/holdout file is read by this adapter. */
export function taskDevelopmentManifest(
  value: unknown,
  task: PracticeTask,
  contentVersion: string,
): BenchmarkManifest {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== "r65-task-linked-intake" ||
    value.purpose !== R65_PURPOSE ||
    !validDate(value.createdAt) ||
    !nonempty(value.authoredBy) ||
    !["en", "de"].includes(String(value.language)) ||
    value.contentVersion !== contentVersion ||
    value.taskId !== task.id ||
    value.taskSha256 !== digest(JSON.stringify(task)) ||
    !task.constructionId.startsWith(`${value.language}.`) ||
    task.partition !== "practice" ||
    task.modality !== "writing" ||
    !nonempty(value.response) ||
    value.responseSha256 !== digest(value.response) ||
    !nonempty(value.intendedMeaning) ||
    !["learner_supplied", "task_explicit"].includes(
      String(value.intendedMeaningSource),
    ) ||
    value.intendedMeaningSha256 !== digest(value.intendedMeaning) ||
    !nonempty(value.sourceId) ||
    !nonempty(value.license) ||
    !nonempty(value.consentEvidence)
  )
    throw Error(
      "Incomplete actual task/meaning/response/rights intake or changed task binding",
    );
  if (
    !(value.proposedCorrection === null && value.correctionSha256 === null) &&
    (!nonempty(value.proposedCorrection) ||
      value.correctionSha256 !== digest(value.proposedCorrection))
  )
    throw Error("Correction bytes do not match correction hash");
  const intakeSha256 = digest(JSON.stringify(value));
  const row: BenchmarkDraft = {
    id: `r65-task-${intakeSha256.slice(0, 24)}`,
    language: value.language as "en" | "de",
    modality: "writing",
    contentVersion,
    sourceId: value.sourceId,
    license: value.license,
    constructionId: task.constructionId,
    rubricVersion: task.rubricVersion,
    taskVersion: task.version,
    partition: "development",
    itemFamily: task.itemFamily,
    sourceGroup: `private-intake-${intakeSha256}`,
    templateFamily: task.itemFamily,
    learnerGroup: null,
    category: "ambiguous",
    expected: "not_assessed",
    humanReviewIds: [],
    adjudicated: false,
    contentFingerprint: digest(
      JSON.stringify([
        value.language,
        task.prompt.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase(),
        value.response
          .normalize("NFC")
          .trim()
          .replace(/\s+/gu, " ")
          .toLowerCase(),
      ]),
    ),
    prompt: task.prompt,
    response: value.response,
    acceptedAnswers: [],
    normalisation: { terminalFullStop: task.normalisation.terminalFullStop },
    taskBinding: { taskId: task.id, taskSha256: value.taskSha256 },
    authoredBy: value.authoredBy,
    reviewStatus: "pending",
    reviews: [],
    adjudication: null,
    audioSha256: null,
  };
  return {
    schemaVersion: 1,
    version: `r65-task-development-${intakeSha256}`,
    createdAt: value.createdAt,
    purpose: R65_PURPOSE,
    cases: [row],
  };
}

export function blankTaskReview(
  manifest: BenchmarkManifest,
  correctionSha256: string | null,
) {
  const row = manifest.cases[0]!;
  return {
    schemaVersion: 1,
    kind: "r65-task-human-review",
    benchmarkVersion: manifest.version,
    provenance: null,
    reviewerId: null,
    role: null,
    reviewedAt: null,
    independentlyReviewed: null,
    originalJudgedBeforeCorrection: null,
    originalJudgmentEvidence: null,
    labels: [
      {
        caseId: row.id,
        caseSha256: caseDigest(row),
        label: {
          verdict: null,
          targetObserved: null,
          meaningPreserved: null,
          note: "",
        },
        correction: {
          correctionSha256,
          grammatical: null,
          meaningPreserved: null,
          targetObserved: null,
          minimal: null,
          note: "",
        },
      },
    ],
  };
}

/** Distribute originalStage first; release correctionStage only after the original judgment is sealed. */
export function taskReviewMaterials(
  intake: unknown,
  task: PracticeTask,
  contentVersion: string,
) {
  const manifest = taskDevelopmentManifest(intake, task, contentVersion);
  if (!isRecord(intake)) throw Error("Invalid intake");
  const row = manifest.cases[0]!;
  return {
    manifest,
    originalStage: {
      schemaVersion: 1,
      kind: "r65-task-original-judgment",
      provenance: null,
      independentlyReviewed: null,
      benchmarkVersion: manifest.version,
      caseId: row.id,
      caseSha256: caseDigest(row),
      taskId: task.id,
      taskVersion: task.version,
      rubricVersion: task.rubricVersion,
      taskSha256: row.taskBinding!.taskSha256,
      constructionId: task.constructionId,
      prompt: task.prompt,
      response: row.response,
      responseSha256: intake.responseSha256,
      intendedMeaning: intake.intendedMeaning,
      intendedMeaningSource: intake.intendedMeaningSource,
      intendedMeaningSha256: intake.intendedMeaningSha256,
      reviewerId: null,
      role: null,
      reviewedAt: null,
      judgment: {
        verdict: null,
        targetObserved: null,
        meaningPreserved: null,
        note: "",
      },
    },
    correctionStage: {
      benchmarkVersion: manifest.version,
      caseId: row.id,
      caseSha256: caseDigest(row),
      proposedCorrection: intake.proposedCorrection,
      correctionSha256: intake.correctionSha256,
      originalJudgmentEvidence: null,
      judgment: {
        grammatical: null,
        meaningPreserved: null,
        targetObserved: null,
        minimal: null,
        note: "",
      },
    },
    combinedReviewTemplate: blankTaskReview(
      manifest,
      intake.correctionSha256 as string | null,
    ),
  };
}

/** Reuse existing two-reviewer/evidence/hash/adjudication checks; always development, never approval. */
export async function validateTaskReviews(
  root: string,
  intake: unknown,
  task: PracticeTask,
  contentVersion: string,
  refs: EvidenceRef[],
  adjudication: EvidenceRef | null,
  now: string,
) {
  const manifest = taskDevelopmentManifest(intake, task, contentVersion);
  if (!isRecord(intake)) throw Error("Invalid intake");
  const row = manifest.cases[0]!;
  const readReview = async (ref: EvidenceRef) => {
    const value: unknown = JSON.parse(await evidenceFile(root, ref));
    if (
      !isRecord(value) ||
      value.schemaVersion !== 1 ||
      value.kind !== "r65-task-human-review" ||
      value.benchmarkVersion !== manifest.version ||
      value.originalJudgedBeforeCorrection !== true ||
      !Array.isArray(value.labels) ||
      value.labels.length !== 1
    )
      throw Error("Invalid task-linked review evidence");
    assertHuman(value, manifest.createdAt, now);
    const item = value.labels[0];
    if (
      !isRecord(item) ||
      item.caseId !== row.id ||
      item.caseSha256 !== caseDigest(row) ||
      !isRecord(item.label) ||
      !isRecord(item.correction)
    )
      throw Error("Stale original task judgment");
    const original: unknown = JSON.parse(
      await evidenceFile(root, value.originalJudgmentEvidence as EvidenceRef),
    );
    if (
      !isRecord(original) ||
      original.schemaVersion !== 1 ||
      original.kind !== "r65-task-original-judgment" ||
      original.benchmarkVersion !== manifest.version ||
      original.caseId !== row.id ||
      original.caseSha256 !== caseDigest(row) ||
      original.reviewerId !== value.reviewerId ||
      original.role !== value.role ||
      JSON.stringify(original.judgment) !== JSON.stringify(item.label)
    )
      throw Error(
        "Original judgment evidence does not match the reviewer, task and sealed label",
      );
    const originalFields = taskReviewMaterials(
      intake,
      task,
      contentVersion,
    ).originalStage;
    for (const key of [
      "taskId",
      "taskVersion",
      "rubricVersion",
      "taskSha256",
      "constructionId",
      "prompt",
      "response",
      "responseSha256",
      "intendedMeaning",
      "intendedMeaningSource",
      "intendedMeaningSha256",
    ] as const)
      if (original[key] !== originalFields[key])
        throw Error(
          "Original judgment display does not match the task, response and meaning",
        );
    if (Object.keys(original).some((key) => !(key in originalFields)))
      throw Error("Original judgment contains unexpected unblinding fields");
    assertHuman(original, manifest.createdAt, value.reviewedAt as string);
    const correction = item.correction;
    if (
      correction.correctionSha256 !== intake.correctionSha256 ||
      ![
        correction.grammatical,
        correction.meaningPreserved,
        correction.targetObserved,
        correction.minimal,
      ].every(triState) ||
      !nonempty(correction.note)
    )
      throw Error("Incomplete or changed correction judgment");
    if (
      intake.correctionSha256 === null &&
      [
        correction.grammatical,
        correction.meaningPreserved,
        correction.targetObserved,
        correction.minimal,
      ].some((value) => value !== null)
    )
      throw Error("Cannot judge a nonexistent correction");
    return {
      review: {
        reviewerId: value.reviewerId as string,
        role: value.role as string,
        reviewedAt: value.reviewedAt as string,
        caseSha256: item.caseSha256 as string,
        label: item.label as unknown as ReviewLabel,
        evidence: ref,
      },
      correction,
    };
  };
  const recorded = await Promise.all(refs.map(readReview));
  row.reviews = recorded.map((result) => result.review);
  const resolved = adjudication ? await readReview(adjudication) : null;
  row.adjudication = resolved?.review ?? null;
  const correctionKey = (value: Record<string, unknown>) =>
    JSON.stringify([
      value.grammatical,
      value.meaningPreserved,
      value.targetObserved,
      value.minimal,
    ]);
  if (
    new Set(recorded.map((result) => correctionKey(result.correction))).size >
      1 &&
    !resolved
  )
    throw Error(
      "Independent adjudication required for correction disagreement",
    );
  const reviewed = await reviewedManifest(root, manifest, now);
  if (
    resolved &&
    row.reviews.some(
      (review) => review.reviewerId === resolved.review.reviewerId,
    )
  )
    throw Error("Adjudicator must be a third independent reviewer");
  return {
    manifest: reviewed,
    correctionJudgment: resolved?.correction ?? recorded[0]?.correction,
    approved: false as const,
    purpose: R65_PURPOSE,
  };
}
