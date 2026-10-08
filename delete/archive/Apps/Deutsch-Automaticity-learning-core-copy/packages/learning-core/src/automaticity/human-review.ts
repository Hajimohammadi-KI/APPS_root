import {
  isRecord,
  validDate,
  validHash,
  type AttemptEvent,
  type AssessmentEvent,
  type Language,
} from "./contracts";
import { activePracticeTasks, type CurriculumPack } from "./curriculum";
import { sha256 } from "./backup";
export interface HumanReviewScope {
  taskId: string;
  taskVersion: string;
  rubricVersion: string;
  definitionSha256: string;
  reviewerName: string;
  evaluatorId: string;
  evaluatorVersion: string;
  reviewId: string;
  approvedAt: string;
}
export interface HumanReviewManifest {
  schemaVersion: 1;
  language: Language;
  contentVersion: string;
  mappingVersion: string;
  curriculumSha256: string;
  scopes: HumanReviewScope[];
}
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
/** Only a shipped, independently compiled scope can qualify local human feedback. */
export async function qualifyHumanReview(
  attempt: AttemptEvent,
  pack: CurriculumPack,
  raw: unknown,
  reviewerName: string,
  at: string,
  audioReview: { sha256: string; confirmed: boolean } | null = null,
): Promise<AssessmentEvent["evaluator"] | null> {
  if (
    !validDate(at) ||
    !isRecord(raw) ||
    raw.schemaVersion !== 1 ||
    raw.language !== attempt.language ||
    pack.language !== attempt.language ||
    raw.contentVersion !== pack.version ||
    raw.mappingVersion !== pack.mappingVersion ||
    raw.curriculumSha256 !== (await sha256(JSON.stringify(pack) + "\n")) ||
    !Array.isArray(raw.scopes) ||
    raw.scopes.length > 20_000
  )
    return null;
  const task = pack.units
    .flatMap(activePracticeTasks)
    .find((task) => task.id === attempt.task.id);
  if (
    !task ||
    task.contentReview !== "human_reviewed" ||
    attempt.task.contentReview !== "human_reviewed" ||
    attempt.task.definitionSha256 !== (await sha256(JSON.stringify(task))) ||
    attempt.response.sha256 !== (await sha256(attempt.response.text))
  )
    return null;
  for (const key of [
    "id",
    "version",
    "constructionId",
    "familyId",
    "rubricVersion",
    "stage",
    "modality",
    "partition",
    "itemFamily",
    "contextId",
    "transferCondition",
  ] as const)
    if (task[key] !== attempt.task[key]) return null;
  const scopes: HumanReviewScope[] = [];
  const identities = new Set<string>();
  for (const value of raw.scopes) {
    if (
      !isRecord(value) ||
      ![
        "taskId",
        "taskVersion",
        "rubricVersion",
        "reviewerName",
        "evaluatorId",
        "evaluatorVersion",
        "reviewId",
      ].every((key) => nonempty(value[key])) ||
      !validHash(value.definitionSha256) ||
      !validDate(value.approvedAt)
    )
      return null;
    const identity = JSON.stringify([value.taskId, value.reviewerName]);
    if (identities.has(identity)) return null;
    identities.add(identity);
    scopes.push(value as unknown as HumanReviewScope);
  }
  const scope = scopes.find(
    (scope) =>
      scope.taskId === task.id &&
      scope.taskVersion === task.version &&
      scope.rubricVersion === task.rubricVersion &&
      scope.definitionSha256 === attempt.task.definitionSha256 &&
      scope.reviewerName === reviewerName.trim() &&
      Date.parse(scope.approvedAt) <= Date.parse(attempt.at) &&
      Date.parse(scope.approvedAt) <= Date.parse(at),
  );
  if (!scope) return null;
  if (
    task.modality === "speaking" &&
    (!attempt.audio?.persisted ||
      !attempt.audio.bytes ||
      !attempt.audio.durationMs ||
      attempt.response.transcriptEdited ||
      attempt.response.originalTranscriptSha256 !== attempt.response.sha256 ||
      !audioReview?.confirmed ||
      audioReview.sha256 !== attempt.audio.sha256)
  )
    return null;
  return {
    id: scope.evaluatorId,
    version: scope.evaluatorVersion,
    kind: "human",
    scopeApproved: true,
    reviewId: scope.reviewId,
  };
}
export async function readHumanReviewManifest(
  language: Language,
): Promise<unknown> {
  try {
    const response = await fetch(
      `/learning-core/review-approvals-${language}.json`,
      { cache: "no-store", signal: AbortSignal.timeout(2000) },
    );
    if (!response.ok) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const row = await reader.read();
        if (row.done) break;
        size += row.value.byteLength;
        if (size > 8_000_000) {
          await reader.cancel();
          return null;
        }
        chunks.push(row.value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
