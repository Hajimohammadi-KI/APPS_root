import {
  isRecord,
  validDate,
  parseAutomaticityEvent,
} from "../../shared/learning-core/src/automaticity/contracts";
import { collectAssessmentFeedback } from "../../shared/learning-core/src/automaticity/assessment-feedback";
import type { CurriculumPack } from "../../shared/learning-core/src/automaticity/curriculum";
import {
  digest,
  parseManifest,
  type BenchmarkDraft,
  type BenchmarkManifest,
} from "./model-benchmark";

/** Recompute provenance from immutable exported events; local reviews never become qualification labels. */
export async function feedbackDevelopmentManifest(
  value: unknown,
  packs: CurriculumPack[],
  importedAt: string,
): Promise<BenchmarkManifest> {
  if (
    !isRecord(value) ||
    value.kind !== "automaticity.assessment-feedback" ||
    value.version !== 1 ||
    value.purpose !== "local_feedback_development_only" ||
    value.independentReviewEstablished !== false ||
    !validDate(value.createdAt) ||
    !validDate(importedAt) ||
    Date.parse(value.createdAt) > Date.parse(importedAt) ||
    !Array.isArray(value.cases) ||
    value.cases.length === 0 ||
    value.cases.length > 10000
  )
    throw Error("Invalid local feedback export");
  const pack = packs.find(
    (pack) =>
      pack.language === value.language && pack.version === value.contentVersion,
  );
  if (!pack)
    throw Error(
      "Feedback curriculum changed; retain the export for explicit remapping",
    );
  const events = value.cases.flatMap((row) => {
    if (!isRecord(row) || !Array.isArray(row.history))
      throw Error("Missing feedback history");
    return [row.attempt, ...row.history].map((event) =>
      parseAutomaticityEvent(event, pack.language),
    );
  });
  const rebuilt = await collectAssessmentFeedback(
    events,
    pack,
    value.createdAt,
  );
  if (JSON.stringify(rebuilt.cases) !== JSON.stringify(value.cases))
    throw Error(
      "Feedback cases do not match the original task, response and review chain",
    );
  const groups = new Map<string, typeof rebuilt.cases>();
  for (const row of rebuilt.cases) {
    const normalized = (text: string) =>
      text.normalize("NFC").trim().replace(/\s+/gu, " ");
    const key = JSON.stringify([
      pack.language,
      normalized(row.task.prompt),
      normalized(row.attempt.response.text),
    ]);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const sourceHash = digest(JSON.stringify(value));
  const cases: BenchmarkDraft[] = [...groups.values()].map((rows) => {
    const row = rows[0]!,
      conflicting = new Set(rows.map((row) => row.review.verdict)).size > 1;
    const expected = conflicting ? "not_assessed" : row.review.verdict;
    const response = row.attempt.response.text,
      prompt = row.task.prompt;
    return {
      id: `feedback-${digest(JSON.stringify([pack.language, prompt, response])).slice(0, 24)}`,
      language: pack.language,
      modality: "writing",
      contentVersion: pack.version,
      constructionId: row.task.constructionId,
      rubricVersion: row.task.rubricVersion,
      taskVersion: row.task.version,
      sourceId: `local-feedback-${sourceHash}`,
      license:
        "Locally exported response and reviewer feedback for private development. No redistribution or general model-training permission is inferred.",
      partition: "development",
      itemFamily: row.task.itemFamily,
      sourceGroup: "local-review-feedback-development",
      templateFamily: row.task.itemFamily,
      learnerGroup: "private-local-feedback",
      contentFingerprint: digest(
        JSON.stringify([
          pack.language,
          prompt.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase(),
          response.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase(),
        ]),
      ),
      category: conflicting
        ? "ambiguous"
        : expected === "pass"
          ? "correct_alternative"
          : expected === "target_not_observed"
            ? "off_target"
            : "grammar_error",
      expected,
      humanReviewIds: [],
      adjudicated: false,
      prompt,
      response,
      acceptedAnswers: row.task.acceptedAnswers,
      normalisation: {
        terminalFullStop: row.task.normalisation.terminalFullStop,
      },
      taskBinding: { taskId: row.task.id, taskSha256: row.taskSha256 },
      authoredBy: "local-feedback-development-import",
      reviewStatus: "pending",
      reviews: [],
      adjudication: null,
      audioSha256: null,
    };
  });
  const manifest: BenchmarkManifest = {
    schemaVersion: 1,
    version: `local-feedback-development-${sourceHash.slice(0, 16)}`,
    createdAt: importedAt,
    purpose:
      "Private development regressions from locally recorded reviewer disagreements. Labels are unqualified hypotheses; conflicting labels require adjudication. No independent benchmark review, calibration/final evaluation, policy reward or model-training permission is created.",
    cases,
  };
  return parseManifest(manifest);
}
