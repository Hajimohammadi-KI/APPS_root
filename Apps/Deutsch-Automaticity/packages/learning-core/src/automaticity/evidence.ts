import {
  parseAutomaticityEvent,
  type AssessmentEvent,
  type AttemptEvent,
  type AutomaticityEvent,
  type Language,
  type Modality,
} from "./contracts";

export interface ReducedAttempt {
  attempt: AttemptEvent;
  assessment: AssessmentEvent | null;
  independent: boolean;
  checked: boolean;
  success: boolean;
  delayed: boolean;
  novel: boolean;
  elapsedSincePracticeMs: number | null;
  eligibleForMastery: boolean;
  reasons: string[];
}
export interface ConstructionProgress {
  constructionId: string;
  modality: Modality;
  attempts: number;
  assessed: number;
  practiceFailures: number;
  repairNeeded?: boolean;
  independentAssessed: number;
  independentSuccesses: number;
  accuracy: number | null;
  delayedSuccesses: number;
  novelSuccesses: number;
  humanReviewed: number;
  medianFirstInputMs: number | null;
  status:
    | "not_checked"
    | "practising"
    | "independent_evidence"
    | "retention_evidence";
  lastAttemptAt: string | null;
  nextReviewAt: string | null;
}
export interface EvidenceReduction {
  attempts: ReducedAttempt[];
  progress: ConstructionProgress[];
  rejected: { id: string; reason: string }[];
}
const DAY = 86_400_000;
const time = (at: string) => Date.parse(at);

/** Rebuild from immutable events; failed and overturned attempts remain in history. */
export function reduceAutomaticityEvents(
  raw: readonly unknown[],
  language: Language,
  now: string,
): EvidenceReduction {
  const rejected: EvidenceReduction["rejected"] = [];
  const events = new Map<string, AutomaticityEvent>();
  const conflicts = new Set<string>();
  for (const row of raw) {
    try {
      const event = parseAutomaticityEvent(row, language);
      if (time(event.at) > time(now) + 1000)
        throw new Error("Event is in the future");
      const old = events.get(event.id);
      if (old && JSON.stringify(old) !== JSON.stringify(event)) {
        conflicts.add(event.id);
        throw new Error("Conflicting duplicate event ID");
      }
      events.set(event.id, event);
    } catch (error) {
      rejected.push({
        id:
          typeof row === "object" && row && "id" in row
            ? String(row.id)
            : "unknown",
        reason: error instanceof Error ? error.message : "Invalid event",
      });
    }
  }
  for (const id of conflicts) events.delete(id);
  const all = [...events.values()].sort(
    (a, b) => time(a.at) - time(b.at) || a.id.localeCompare(b.id),
  );
  const attempts = all.filter(
    (event): event is AttemptEvent => event.type === "attempt",
  );
  const validAssessments: AssessmentEvent[] = [];
  for (const event of all) {
    if (event.type !== "assessment") continue;
    const attempt = events.get(event.attemptId);
    if (
      !attempt ||
      attempt.type !== "attempt" ||
      event.responseSha256 !== attempt.response.sha256 ||
      event.taskVersion !== attempt.task.version ||
      event.rubricVersion !== attempt.task.rubricVersion ||
      time(event.at) < time(attempt.at) ||
      event.spans.some((span) => span.end > attempt.response.text.length)
    ) {
      rejected.push({
        id: event.id,
        reason: "Assessment does not match its original response/task/rubric",
      });
      continue;
    }
    if (event.supersedes) {
      const old = events.get(event.supersedes);
      if (
        !old ||
        old.type !== "assessment" ||
        old.attemptId !== event.attemptId ||
        (event.evaluator.kind === "self" && old.evaluator.kind !== "self") ||
        time(old.at) >= time(event.at)
      ) {
        rejected.push({
          id: event.id,
          reason: "Invalid assessment supersession",
        });
        continue;
      }
    }
    validAssessments.push(event);
  }
  const removed = new Set<string>();
  for (const event of all)
    if (event.type === "invalidation") {
      const target = validAssessments.find(
        (row) => row.id === event.assessmentId,
      );
      if (target && time(target.at) <= time(event.at))
        removed.add(event.assessmentId);
      else
        rejected.push({
          id: event.id,
          reason: "Invalidation has no prior assessment",
        });
    }
  for (const assessment of validAssessments)
    if (assessment.supersedes) removed.add(assessment.supersedes);
  const reduced: ReducedAttempt[] = attempts.map((attempt) => {
    const candidates = validAssessments.filter(
      (event) =>
        event.attemptId === attempt.id &&
        event.evaluator.kind !== "self" &&
        !removed.has(event.id),
    );
    // Two competing verdicts require adjudication; never choose a convenient one.
    const assessment = candidates.length === 1 ? candidates[0]! : null;
    const reasons: string[] = [];
    if (attempt.task.version === "legacy-import-1")
      reasons.push(
        "Historical assistance, task context and assessment are not established",
      );
    if (candidates.length > 1) reasons.push("conflicting_assessments");
    const prior = attempts.filter(
      (row) =>
        row.task.constructionId === attempt.task.constructionId &&
        time(row.at) < time(attempt.at),
    );
    const exposure = all.filter(
      (event) =>
        event.type === "exposure" &&
        event.constructionId === attempt.task.constructionId &&
        time(event.at) <= time(attempt.at),
    );
    const lastPractice = Math.max(
      ...prior.map((row) => time(row.at)),
      ...exposure.map((row) => time(row.at)),
    );
    const elapsed = Number.isFinite(lastPractice)
      ? time(attempt.at) - lastPractice
      : null;
    const exposed = exposure.some(
      (event) =>
        event.type === "exposure" &&
        time(attempt.at) - time(event.at) < DAY &&
        (event.taskId === attempt.task.id ||
          event.itemFamily === attempt.task.itemFamily),
    );
    const repeatedItem = prior.some(
      (row) =>
        time(attempt.at) - time(row.at) < DAY &&
        (row.task.id === attempt.task.id ||
          row.task.itemFamily === attempt.task.itemFamily),
    );
    const assisted =
      attempt.assistance.hintCount > 0 ||
      attempt.assistance.solutionRevealed ||
      attempt.assistance.exampleSeen ||
      attempt.assistance.selfReportedAssistance;
    const first = !attempt.previousAttemptId && !repeatedItem;
    const audioEligible =
      attempt.task.modality !== "speaking" ||
      !!(
        attempt.audio?.persisted &&
        attempt.audio.bytes > 0 &&
        attempt.audio.durationMs > 0 &&
        !attempt.response.transcriptEdited &&
        attempt.response.originalTranscriptSha256 === attempt.response.sha256
      );
    const independent =
      attempt.task.version !== "legacy-import-1" &&
      first &&
      !assisted &&
      !exposed &&
      audioEligible &&
      attempt.response.text.trim().length > 0 &&
      attempt.task.stage !== "notice" &&
      attempt.task.stage !== "repair";
    const checked =
      !!assessment &&
      !assessment.uncertainty &&
      assessment.evaluator.kind !== "self" &&
      assessment.verdict !== "not_assessed" &&
      assessment.verdict !== "target_not_observed" &&
      (assessment.dimensions.opportunities ?? 0) > 0;
    const success = checked && assessment?.verdict === "pass";
    const delayed =
      independent && checked && elapsed !== null && elapsed >= DAY;
    const novel =
      independent &&
      checked &&
      attempt.task.transferCondition !== "none" &&
      prior.length > 0 &&
      !prior.some(
        (row) =>
          row.task.contextId === attempt.task.contextId ||
          row.task.itemFamily === attempt.task.itemFamily,
      );
    if (!assessment) reasons.push("no_current_assessment");
    if (assisted || exposed) reasons.push("assisted_or_exposed");
    if (!first) reasons.push("repeated_item_or_repair");
    if (!audioEligible) reasons.push("audio_or_original_transcript_missing");
    if (!assessment?.evaluator.scopeApproved)
      reasons.push("evaluator_scope_unapproved");
    if (attempt.task.contentReview !== "human_reviewed")
      reasons.push("content_review_pending");
    const eligibleForMastery =
      independent &&
      checked &&
      !!assessment?.evaluator.scopeApproved &&
      attempt.task.contentReview === "human_reviewed";
    return {
      attempt,
      assessment,
      independent,
      checked,
      success,
      delayed,
      novel,
      elapsedSincePracticeMs: elapsed,
      eligibleForMastery,
      reasons,
    };
  });
  const groups = new Map<string, ReducedAttempt[]>();
  for (const row of reduced) {
    const key = `${row.attempt.task.constructionId}:${row.attempt.task.modality}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const progress: ConstructionProgress[] = [...groups.values()].map((rows) => {
    const first = rows[0]!;
    const last = rows.at(-1)!;
    const eligible = rows.filter((row) => row.eligibleForMastery).slice(-20);
    const wins = eligible.filter((row) => row.success);
    const delays = wins.filter((row) => row.delayed);
    const timing = eligible
      .filter(
        (row) =>
          row.success &&
          row.attempt.timing.source === "monotonic_visible" &&
          row.attempt.timing.firstInputMs !== null,
      )
      .map((row) => row.attempt.timing.firstInputMs!)
      .sort((a, b) => a - b);
    const recent = eligible.at(-1);
    // Scheduling a practice revisit is allowed before mastery is established.
    // The due date itself never becomes evidence of successful delayed recall.
    const interval =
      !recent || !recent.success
        ? 1
        : [1, 3, 7, 14, 30][Math.min(delays.length, 4)]!;
    return {
      constructionId: first.attempt.task.constructionId,
      modality: first.attempt.task.modality,
      attempts: rows.length,
      assessed: rows.filter((row) => row.checked).length,
      practiceFailures: rows
        .slice(-20)
        .filter(
          (row) => row.checked && row.assessment?.verdict === "needs_repair",
        ).length,
      repairNeeded:
        rows.filter((row) => row.checked).at(-1)?.assessment?.verdict ===
        "needs_repair",
      independentAssessed: eligible.length,
      independentSuccesses: wins.length,
      accuracy: eligible.length ? wins.length / eligible.length : null,
      delayedSuccesses: delays.length,
      novelSuccesses: wins.filter((row) => row.novel).length,
      humanReviewed: eligible.filter(
        (row) =>
          row.assessment?.evaluator.kind === "human" &&
          row.assessment.evaluator.reviewId,
      ).length,
      medianFirstInputMs: timing.length
        ? timing.length % 2
          ? timing[Math.floor(timing.length / 2)]!
          : (timing[timing.length / 2 - 1]! + timing[timing.length / 2]!) / 2
        : null,
      status:
        eligible.length === 0
          ? rows.some((row) => row.checked)
            ? "practising"
            : "not_checked"
          : delays.length >= 2 && wins.some((row) => row.novel)
            ? "retention_evidence"
            : "independent_evidence",
      lastAttemptAt: last.attempt.at,
      nextReviewAt: new Date(
        time(last.attempt.at) + interval * DAY,
      ).toISOString(),
    };
  });
  return { attempts: reduced, progress, rejected };
}
