import {
  isRecord,
  validDate,
  type AutomaticityEvent,
  type Language,
  type Modality,
} from "../../shared/learning-core/src/automaticity/contracts";
import { reduceAutomaticityEvents } from "../../shared/learning-core/src/automaticity/evidence";
import type { CurriculumPack } from "../../shared/learning-core/src/automaticity/curriculum";
import { sha256 } from "./automaticity-release-reviews";
export interface StudyProbe {
  id: string;
  language: Language;
  constructionId: string;
  modality: Modality;
  taskId: string;
  definitionSha256: string;
  kind: "baseline" | "retention" | "transfer";
  delayHours: 0 | 24 | 168 | 720;
  opensAt: string;
  closesAt: string;
}
export interface LearningStudy {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  interventionAt: string;
  consent: { participantKey: string; at: string; withdrawnAt?: string };
  probes: StudyProbe[];
}
export interface OpportunityScore {
  assessmentId: string;
  responseSha256: string;
  definitionSha256: string;
  reviewedAt: string;
  checked: number;
  correct: number;
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length
    ? (sorted[Math.floor((sorted.length - 1) / 2)]! +
        sorted[Math.ceil((sorted.length - 1) / 2)]!) /
        2
    : null;
};
export function wilsonInterval(
  successes: number,
  total: number,
): [number, number] | null {
  if (!total) return null;
  const z = 1.959963984540054,
    p = successes / total,
    d = 1 + (z * z) / total,
    c = (p + (z * z) / (2 * total)) / d,
    h = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
export function parseLearningStudy(
  value: unknown,
  packs: readonly CurriculumPack[],
  now: string,
): LearningStudy {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    !validDate(value.createdAt) ||
    !validDate(value.interventionAt) ||
    !validDate(now) ||
    Date.parse(value.createdAt) > Date.parse(now) ||
    Date.parse(value.createdAt) >= Date.parse(value.interventionAt) ||
    !isRecord(value.consent) ||
    typeof value.consent.participantKey !== "string" ||
    !value.consent.participantKey.trim() ||
    !validDate(value.consent.at) ||
    Date.parse(value.consent.at) > Date.parse(value.createdAt) ||
    !Array.isArray(value.probes) ||
    !value.probes.length
  )
    throw Error(
      "A prospectively dated study, consent and explicit probe plan are required",
    );
  if (value.consent.withdrawnAt !== undefined)
    throw Error("Study consent has been withdrawn; evaluation is disabled");
  const ids = new Set<string>(),
    assignments = new Set<string>();
  for (const raw of value.probes) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      !raw.id.trim() ||
      ids.has(raw.id) ||
      !["en", "de"].includes(String(raw.language)) ||
      !["writing", "speaking"].includes(String(raw.modality)) ||
      !["baseline", "retention", "transfer"].includes(String(raw.kind)) ||
      ![0, 24, 168, 720].includes(Number(raw.delayHours)) ||
      typeof raw.delayHours !== "number" ||
      !validDate(raw.opensAt) ||
      !validDate(raw.closesAt) ||
      Date.parse(raw.opensAt) >= Date.parse(raw.closesAt) ||
      Date.parse(raw.opensAt) < Date.parse(value.createdAt)
    )
      throw Error("Invalid, duplicate or retrospectively assigned probe");
    ids.add(raw.id);
    const task = packs
      .find((pack) => pack.language === raw.language)
      ?.units.flatMap((unit) => unit.tasks)
      .find((task) => task.id === raw.taskId);
    if (
      !task ||
      task.constructionId !== raw.constructionId ||
      task.modality !== raw.modality ||
      raw.definitionSha256 !== sha256(JSON.stringify(task)) ||
      task.contentReview !== "human_reviewed" ||
      task.partition !== "evaluation"
    )
      throw Error(
        "A study probe requires its exact reviewed held-out task definition",
      );
    if (
      raw.kind === "baseline"
        ? raw.delayHours !== 0 ||
          Date.parse(raw.closesAt) > Date.parse(value.interventionAt)
        : raw.delayHours === 0 ||
          Date.parse(raw.opensAt) <
            Date.parse(value.interventionAt) + raw.delayHours * 3_600_000
    )
      throw Error(
        "Baseline or delayed window crosses its predeclared boundary",
      );
    if (raw.kind === "transfer" && task.transferCondition === "none")
      throw Error("Transfer probes must name their transfer condition");
    const assignment = `${raw.language}:${raw.taskId}`;
    if (assignments.has(assignment))
      throw Error("A held-out item cannot be reused in another planned probe");
    assignments.add(assignment);
  }
  return value as unknown as LearningStudy;
}

/** Descriptive personal evidence, never a causal result or automatic mastery promotion. */
export function evaluateLearningStudy(
  study: LearningStudy,
  events: readonly AutomaticityEvent[],
  packs: readonly CurriculumPack[],
  now: string,
  audioBytes: ReadonlyMap<string, Uint8Array> = new Map(),
  approvedAssessmentIds: ReadonlySet<string> = new Set(),
  opportunityScores: readonly OpportunityScore[] = [],
) {
  parseLearningStudy(study, packs, now);
  const scores = new Map<string, OpportunityScore>();
  for (const score of opportunityScores) {
    if (
      !isRecord(score) ||
      typeof score.assessmentId !== "string" ||
      scores.has(score.assessmentId) ||
      !validDate(score.reviewedAt) ||
      Date.parse(score.reviewedAt) > Date.parse(now) ||
      !Number.isSafeInteger(score.checked) ||
      score.checked < 1 ||
      score.checked > 1000 ||
      !Number.isSafeInteger(score.correct) ||
      score.correct < 0 ||
      score.correct > score.checked
    )
      throw Error("Invalid or duplicate reviewed opportunity counts");
    const assessment = events.find(
        (event) =>
          event.type === "assessment" && event.id === score.assessmentId,
      ),
      attempt =
        assessment?.type === "assessment"
          ? events.find(
              (event) =>
                event.type === "attempt" && event.id === assessment.attemptId,
            )
          : null;
    if (
      !assessment ||
      assessment.type !== "assessment" ||
      !attempt ||
      attempt.type !== "attempt" ||
      score.responseSha256 !== attempt.response.sha256 ||
      score.definitionSha256 !== attempt.task.definitionSha256 ||
      score.checked !== assessment.dimensions.opportunities ||
      Date.parse(score.reviewedAt) < Date.parse(assessment.at) ||
      (assessment.verdict === "pass" && score.correct !== score.checked) ||
      (assessment.verdict === "target_not_observed" && score.correct !== 0)
    )
      throw Error(
        "Opportunity counts do not match their original reviewed response",
      );
    scores.set(score.assessmentId, score);
  }
  const reductions = {
    en: reduceAutomaticityEvents(
      events.filter((row) => row.language === "en"),
      "en",
      now,
    ),
    de: reduceAutomaticityEvents(
      events.filter((row) => row.language === "de"),
      "de",
      now,
    ),
  };
  const probes = study.probes.map((probe) => {
    const reduction = reductions[probe.language],
      candidates = reduction.attempts
        .filter(
          (row) =>
            row.attempt.task.id === probe.taskId &&
            Date.parse(row.attempt.at) >= Date.parse(probe.opensAt) &&
            Date.parse(row.attempt.at) <= Date.parse(probe.closesAt),
        )
        .sort(
          (a, b) =>
            Date.parse(a.attempt.at) - Date.parse(b.attempt.at) ||
            a.attempt.id.localeCompare(b.attempt.id),
        );
    const row = candidates[0]; // First response counts, not the best later retry.
    const base = {
      probeId: probe.id,
      language: probe.language,
      modality: probe.modality,
      constructionId: probe.constructionId,
      kind: probe.kind,
      delayHours: probe.delayHours,
      attemptId: row?.attempt.id ?? null,
      retries: Math.max(0, candidates.length - 1),
    };
    if (!row)
      return {
        ...base,
        status:
          Date.parse(now) > Date.parse(probe.closesAt) ? "missing" : "pending",
        reason: "No response in the planned window",
        success: null,
        opportunities: null,
        correctOpportunities: null,
        firstInputMs: null,
      };
    const a = row.attempt,
      assessment = row.assessment,
      reasons: string[] = [];
    const task = packs
      .find((pack) => pack.language === a.language)!
      .units.flatMap((unit) => unit.tasks)
      .find((task) => task.id === probe.taskId)!;
    if (
      a.task.definitionSha256 !== probe.definitionSha256 ||
      Object.keys(task)
        .filter((key) => key in a.task && key !== "definitionSha256")
        .some(
          (key) =>
            JSON.stringify(a.task[key as keyof typeof a.task]) !==
            JSON.stringify(task[key as keyof typeof task]),
        ) ||
      a.response.sha256 !== sha256(a.response.text)
    )
      reasons.push("Response or task definition does not match");
    if (!row.independent)
      reasons.push(
        "Response was assisted, exposed, repeated or has invalid audio evidence",
      );
    const judged =
      !!assessment &&
      approvedAssessmentIds.has(assessment.id) &&
      !assessment.uncertainty &&
      assessment.evaluator.kind !== "self" &&
      assessment.evaluator.scopeApproved &&
      !!assessment.evaluator.reviewId &&
      assessment.verdict !== "not_assessed" &&
      (assessment.dimensions.opportunities ?? 0) > 0;
    if (!judged)
      reasons.push("No current qualified review with an opportunity count");
    const earlier = reduction.attempts.filter(
      (old) =>
        old.attempt.task.constructionId === a.task.constructionId &&
        Date.parse(old.attempt.at) < Date.parse(a.at),
    );
    const exposures = events.filter(
      (event) =>
        event.language === a.language &&
        event.type === "exposure" &&
        event.constructionId === a.task.constructionId &&
        Date.parse(event.at) <= Date.parse(a.at),
    );
    if (
      earlier.some(
        (old) =>
          old.attempt.task.id === a.task.id ||
          old.attempt.task.itemFamily === a.task.itemFamily,
      ) ||
      exposures.some(
        (event) =>
          event.type === "exposure" &&
          (event.taskId === a.task.id ||
            event.itemFamily === a.task.itemFamily),
      )
    )
      reasons.push("The held-out probe item was already attempted or exposed");
    const priorIntervention = earlier.filter(
      (old) =>
        !study.probes.some(
          (planned) =>
            planned.kind === "baseline" &&
            planned.language === old.attempt.language &&
            planned.taskId === old.attempt.task.id &&
            planned.definitionSha256 === old.attempt.task.definitionSha256 &&
            Date.parse(old.attempt.at) >= Date.parse(planned.opensAt) &&
            Date.parse(old.attempt.at) <= Date.parse(planned.closesAt),
        ),
    );
    if (
      probe.kind === "baseline" &&
      (priorIntervention.length > 0 || exposures.length > 0)
    )
      reasons.push("Baseline follows recorded target practice or exposure");
    if (
      probe.kind !== "baseline" &&
      (row.elapsedSincePracticeMs === null ||
        row.elapsedSincePracticeMs < probe.delayHours * 3_600_000)
    )
      reasons.push(
        "The actual delay since the latest target practice is too short or unknown",
      );
    if (
      probe.kind === "transfer" &&
      (earlier.length === 0 ||
        earlier.some(
          (old) =>
            old.attempt.task.contextId === a.task.contextId ||
            old.attempt.task.itemFamily === a.task.itemFamily,
        ))
    )
      reasons.push("Transfer context or item family is not new");
    if (a.task.modality === "speaking") {
      const original = a.audio && audioBytes.get(a.audio.sha256);
      if (
        !original ||
        original.byteLength !== a.audio?.bytes ||
        sha256(original) !== a.audio.sha256
      )
        reasons.push("Original recording bytes are absent or changed");
      if (assessment?.evaluator.kind !== "human")
        reasons.push(
          "This study's speech endpoint requires review of the original audio by a person",
        );
    }
    const eligible = reasons.length === 0;
    return {
      ...base,
      status: eligible ? "assessed" : "excluded",
      reason: reasons.join("; "),
      success: eligible ? assessment!.verdict === "pass" : null,
      opportunities: eligible ? assessment!.dimensions.opportunities : null,
      correctOpportunities: eligible
        ? (scores.get(assessment!.id)?.correct ?? null)
        : null,
      firstInputMs:
        eligible &&
        a.task.modality === "writing" &&
        a.timing.source === "monotonic_visible"
          ? a.timing.firstInputMs
          : null,
    };
  });
  const groups = [
    ...new Set(
      probes.map((row) =>
        JSON.stringify([row.language, row.modality, row.kind, row.delayHours]),
      ),
    ),
  ].map((key) => {
    const [language, modality, kind, delayHours] = JSON.parse(key) as [
      Language,
      Modality,
      StudyProbe["kind"],
      number,
    ];
    const rows = probes.filter(
        (row) =>
          row.language === language &&
          row.modality === modality &&
          row.kind === kind &&
          row.delayHours === delayHours,
      ),
      assessed = rows.filter((row) => row.status === "assessed"),
      successes = assessed.filter((row) => row.success).length;
    return {
      language,
      modality,
      kind,
      delayHours,
      planned: rows.length,
      attempted: rows.filter((row) => row.attemptId).length,
      assessed: assessed.length,
      successes,
      failures: assessed.length - successes,
      excluded: rows.filter((row) => row.status === "excluded").length,
      missing: rows.filter((row) => row.status === "missing").length,
      pending: rows.filter((row) => row.status === "pending").length,
      accuracy: assessed.length ? successes / assessed.length : null,
      wilson95: wilsonInterval(successes, assessed.length),
      assessedOpportunities: assessed.reduce(
        (sum, row) => sum + (row.opportunities ?? 0),
        0,
      ),
      medianFirstInputMs: median(
        assessed.flatMap((row) =>
          row.firstInputMs === null ? [] : [row.firstInputMs],
        ),
      ),
      scoredOpportunities: assessed.reduce(
        (sum, row) =>
          sum +
          (row.correctOpportunities === null ? 0 : (row.opportunities ?? 0)),
        0,
      ),
      correctOpportunities: assessed.some(
        (row) => row.correctOpportunities !== null,
      )
        ? assessed.reduce(
            (sum, row) => sum + (row.correctOpportunities ?? 0),
            0,
          )
        : null,
      targetOpportunityAccuracy: (() => {
        const scored = assessed.filter(
            (row) => row.correctOpportunities !== null,
          ),
          denominator = scored.reduce(
            (sum, row) => sum + (row.opportunities ?? 0),
            0,
          );
        return denominator
          ? scored.reduce(
              (sum, row) => sum + (row.correctOpportunities ?? 0),
              0,
            ) / denominator
          : null;
      })(),
      unscoredOpportunityResponses: assessed.filter(
        (row) => row.correctOpportunities === null,
      ).length,
    };
  });
  return {
    schemaVersion: 1,
    studyId: study.id,
    asOf: now,
    studySha256: sha256(JSON.stringify(study)),
    kind: "descriptive_personal_study",
    causalBenefitEstablished: false,
    automaticMasteryGranted: false,
    probes,
    groups,
    rejected: { en: reductions.en.rejected, de: reductions.de.rejected },
    limit:
      "Missing follow-ups are not failures. Opportunity accuracy requires explicit reviewed counts. Wilson intervals treat responses as independent; repeated observations may be correlated. These descriptive results do not certify CEFR, fluency, causal benefit or adequate statistical power.",
  };
}
