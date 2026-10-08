import { expect, test } from "bun:test";
import type {
  AssessmentEvent,
  AttemptEvent,
  Language,
  TaskIdentity,
} from "./contracts";
import {
  qualifyProspectiveReviews,
  type ExplicitRecallRating,
  type ProspectiveConsent,
} from "./prospective";
import { buildQualifiedFsrsCandidates } from "../fsrs-shadow/qualified";

const now = "2026-09-10T12:00:00.000Z";
const consent: ProspectiveConsent = {
  id: "consent",
  at: "2026-09-01T00:00:00.000Z",
  language: "en",
  purpose: "fsrs_shadow",
};
function attempt(
  id: string,
  day: number,
  task: Partial<TaskIdentity> = {},
): AttemptEvent {
  const at = `2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`;
  return {
    version: 2,
    type: "attempt",
    id,
    language: "en",
    at,
    task: {
      definitionSha256: "b".repeat(64),
      id: "familiar-item",
      version: "1",
      constructionId: "en.c.001",
      familyId: "G01",
      itemFamily: "item-family",
      contextId: "context",
      rubricVersion: "1",
      stage: "retrieve",
      modality: "writing",
      partition: "practice",
      transferCondition: "none",
      contentReview: "human_reviewed",
      ...task,
    },
    response: {
      text: "Synthetic test answer",
      sha256: "a".repeat(64),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: at,
      activeMs: null,
      firstInputMs: null,
      source: "unavailable",
    },
    assistance: {
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
    },
    audio: null,
    previousAttemptId: null,
  };
}
function judge(a: AttemptEvent): AssessmentEvent {
  return {
    version: 2,
    type: "assessment",
    id: `judge-${a.id}`,
    language: a.language,
    at: a.at,
    attemptId: a.id,
    responseSha256: a.response.sha256,
    taskVersion: a.task.version,
    rubricVersion: a.task.rubricVersion,
    verdict: "pass",
    dimensions: {
      grammar: "pass",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      id: "synthetic-rule",
      version: "1",
      kind: "rule",
      scopeApproved: true,
      reviewId: "synthetic-approval",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic fixture only",
    correction: null,
    spans: [],
    supersedes: null,
  };
}
function rating(a: AttemptEvent): ExplicitRecallRating {
  return {
    id: `rating-${a.id}`,
    attemptId: a.id,
    assessmentId: judge(a).id,
    consentId: consent.id,
    rating: 3,
    recordedAt: a.at,
  };
}
const first = attempt("first", 2),
  later = attempt("later", 4, { stage: "retain" });
const events = [first, judge(first), later, judge(later)];
test("a changed same-version task definition and unpinned legacy task cannot borrow recall history", () => {
  for (const definitionSha256 of ["c".repeat(64), undefined]) {
    const changed = attempt("changed-definition", 6, { definitionSha256 });
    const result = qualifyProspectiveReviews(
      [...events, changed, judge(changed)],
      "en",
      now,
      consent,
      [rating(changed)],
    );
    expect(result.eligible).toHaveLength(0);
    expect(result.excluded).toHaveLength(1);
  }
});
const qualify = (
  ratings: readonly unknown[] = [rating(later)],
  permission: unknown = consent,
) =>
  qualifyProspectiveReviews(
    events,
    "en",
    now,
    permission as ProspectiveConsent,
    ratings as ExplicitRecallRating[],
  );

for (const language of ["en", "de"] as Language[])
  test(`${language}: familiar retrieval and retention share only their exact item history`, () => {
    const other = attempt("other-first", 2, {
      id: "another-item",
      itemFamily: "another-family",
      contextId: "another-context",
    });
    const otherLater = attempt("other-later", 6, other.task);
    const sameLater = attempt("same-later", 8, later.task);
    const source = [first, later, other, otherLater, sameLater].map((a) => ({
      ...a,
      language,
      task: { ...a.task, constructionId: `${language}.c.001` },
    }));
    const input = source.flatMap((a) => [a, judge(a)]);
    const ratings = source
      .slice(1)
      .filter((a) => a.id !== other.id)
      .map(rating);
    const snapshot = JSON.stringify({ input, ratings });
    const result = buildQualifiedFsrsCandidates(
      input,
      language,
      now,
      { ...consent, language },
      ratings,
    );
    expect(result.cards).toHaveLength(2);
    expect(result.cards.map((c) => c.history.length).sort()).toEqual([1, 2]);
    expect(
      new Set(result.cards.flatMap((c) => c.history.map((r) => r.attemptId)))
        .size,
    ).toBe(3);
    expect(result.learnerScheduleApplied).toBe(false);
    expect(result.rolloutEligible).toBe(false);
    expect(JSON.stringify({ input, ratings })).toBe(snapshot);
  });

for (const change of [
  { id: "new-item" },
  { version: "2" },
  { contextId: "new-context" },
  { itemFamily: "new-family" },
  { rubricVersion: "2" },
  { familyId: "G02" },
] satisfies Partial<TaskIdentity>[])
  test(`new item identity cannot borrow earlier familiarity: ${Object.keys(change)[0]}`, () => {
    const novel = attempt("novel", 4, change);
    const result = qualifyProspectiveReviews(
      [first, judge(first), novel, judge(novel)],
      "en",
      now,
      consent,
      [rating(novel)],
    );
    expect(result.eligible).toHaveLength(0);
    expect(result.excluded[0]?.reason).toContain("familiar");
  });

for (const change of [
  { stage: "transfer", transferCondition: "free" },
  { stage: "transfer", transferCondition: "none" },
  { transferCondition: "target_named" },
  { transferCondition: "elicited" },
  { stage: "vary" },
  { stage: "produce" },
  { partition: "calibration" },
  { partition: "evaluation" },
] satisfies Partial<TaskIdentity>[])
  test(`transfer and held-out production stay outside familiar recall: ${JSON.stringify(change)}`, () => {
    const changed = attempt("changed", 4, change);
    expect(
      qualifyProspectiveReviews(
        [first, judge(first), changed, judge(changed)],
        "en",
        now,
        consent,
        [rating(changed)],
      ).eligible,
    ).toHaveLength(0);
  });

test("no rating is invented for familiarization before consent", () => {
  const result = qualify([rating(first), rating(later)], {
    ...consent,
    at: "2026-09-03T00:00:00.000Z",
  });
  expect(result.eligible.map((r) => r.attemptId)).toEqual([later.id]);
});
test("speaking cannot borrow writing familiarity", () => {
  const spoken = attempt("spoken", 4, { modality: "speaking" });
  spoken.response.originalTranscriptSha256 = spoken.response.sha256;
  spoken.audio = {
    id: "audio",
    sha256: "b".repeat(64),
    bytes: 50,
    durationMs: 500,
    mime: "audio/wav",
    persisted: true,
  };
  expect(
    qualifyProspectiveReviews(
      [first, judge(first), spoken, judge(spoken)],
      "en",
      now,
      consent,
      [rating(spoken)],
    ).eligible,
  ).toHaveLength(0);
});
test("malformed consent and rating values fail closed without throwing", () => {
  for (const permission of [
    null,
    [],
    {},
    { ...consent, id: 42 },
    { ...consent, at: "bad" },
  ])
    expect(qualify([rating(later)], permission).eligible).toHaveLength(0);
  for (const row of [
    null,
    [],
    {},
    { ...rating(later), id: 42 },
    { ...rating(later), recordedAt: "bad" },
    { ...rating(later), rating: "3" },
  ]) {
    expect(qualify([row]).eligible).toHaveLength(0);
    expect(qualify([row]).excluded).toHaveLength(1);
  }
});
test("withdrawn or invalid revocation removes shadow eligibility", () => {
  expect(
    qualify(undefined, { ...consent, revokedAt: "2026-09-05T00:00:00.000Z" })
      .eligible,
  ).toHaveLength(0);
  expect(
    qualify(undefined, { ...consent, revokedAt: "bad" }).eligible,
  ).toHaveLength(0);
  expect(
    qualify(undefined, { ...consent, revokedAt: "2026-08-31T00:00:00.000Z" })
      .eligible,
  ).toHaveLength(0);
  expect(
    qualify(undefined, { ...consent, revokedAt: "2026-09-11T00:00:00.000Z" })
      .eligible,
  ).toHaveLength(0);
});
test("equivalent ratings deduplicate regardless of JSON property order", () => {
  const row = rating(later),
    reordered = Object.fromEntries(Object.entries(row).reverse());
  expect(qualify([row, reordered]).eligible).toHaveLength(1);
});
test("rating ID reuse across responses excludes both responses", () => {
  const next = attempt("next", 6);
  const result = qualifyProspectiveReviews(
    [...events, next, judge(next)],
    "en",
    now,
    consent,
    [rating(later), { ...rating(next), id: rating(later).id }],
  );
  expect(result.eligible).toHaveLength(0);
  expect(result.excluded).toHaveLength(2);
});
test("malformed conflicting ratings cannot leave a convenient valid rating eligible", () => {
  expect(
    qualify([rating(later), { ...rating(later), rating: 5 }]).eligible,
  ).toHaveLength(0);
});
test("failure ratings must agree with the qualified outcome", () => {
  const failed = judge(later);
  failed.verdict = "needs_repair";
  failed.dimensions.grammar = "fail";
  const input = [first, judge(first), later, failed];
  expect(
    qualifyProspectiveReviews(input, "en", now, consent, [
      { ...rating(later), rating: 1 },
    ]).eligible,
  ).toHaveLength(1);
  expect(
    qualifyProspectiveReviews(input, "en", now, consent, [rating(later)])
      .eligible,
  ).toHaveLength(0);
});
