import { describe, expect, test } from "bun:test";
import {
  parseAutomaticityEvent,
  type AssessmentEvent,
  type AttemptEvent,
  type AutomaticityEvent,
} from "./contracts";
import { reduceAutomaticityEvents } from "./evidence";
import {
  appendAutomaticityEvent,
  ownsStorageKey,
  preserveLegacyState,
  readAutomaticityEvents,
  type LocalStore,
} from "./storage";
import { sha256, validateCompleteBackup } from "./backup";
import { qualifyProspectiveReviews } from "./prospective";
import { buildQualifiedFsrsCandidates } from "../fsrs-shadow/qualified";

const hash = "a".repeat(64);
const now = "2026-09-10T12:00:00.000Z";
for (const language of ["en", "de"] as const)
  test(`${language}: complete simulated repair, transfer and delayed-review cycle`, () => {
    const make = (id: string, at: string) => {
      const row = attempt(id, at);
      row.language = language;
      row.task.constructionId = `${language}.c.001`;
      return row;
    };
    const original = make("original", "2026-09-01T10:00:00.000Z"),
      wrong = assessment(original);
    wrong.verdict = "needs_repair";
    wrong.dimensions.grammar = "fail";
    const repair = make("repair", "2026-09-01T10:02:00.000Z");
    repair.previousAttemptId = original.id;
    repair.task.stage = "repair";
    const transfer = make("transfer", "2026-09-01T11:00:00.000Z");
    transfer.task.stage = "transfer";
    transfer.task.transferCondition = "target_named";
    const day = make("day", "2026-09-02T11:01:00.000Z"),
      week = make("week", "2026-09-09T11:01:00.000Z");
    day.task.stage = "retain";
    week.task.stage = "retain";
    const events = [
      original,
      wrong,
      repair,
      assessment(repair),
      transfer,
      assessment(transfer),
      day,
      assessment(day),
      week,
      assessment(week),
    ];
    const result = reduceAutomaticityEvents(events, language, now);
    expect(
      result.attempts.find((row) => row.attempt.id === "repair")
        ?.eligibleForMastery,
    ).toBe(false);
    expect(
      result.attempts.find((row) => row.attempt.id === "transfer")?.novel,
    ).toBe(true);
    expect(
      result.attempts.find((row) => row.attempt.id === "transfer")?.delayed,
    ).toBe(false);
    expect(result.progress[0]?.independentAssessed).toBe(4);
    expect(result.progress[0]?.accuracy).toBe(0.75);
    expect(result.progress[0]?.delayedSuccesses).toBe(2);
    expect(result.progress[0]?.status).toBe("retention_evidence");
  });
test("prospective reviews require consent, explicit ratings and current delayed evidence", () => {
  const baseline = attempt("baseline", "2026-09-01T10:00:10.000Z");
  const later = attempt("later", "2026-09-03T10:00:10.000Z"),
    judge = assessment(later);
  baseline.task.partition = "practice";
  baseline.task.definitionSha256 = "b".repeat(64);
  later.task = { ...baseline.task, stage: "retain" };
  const events = [baseline, assessment(baseline), later, judge];
  const consent = {
    id: "synthetic-consent",
    language: "en" as const,
    purpose: "fsrs_shadow" as const,
    at: "2026-09-02T10:00:00.000Z",
  };
  const rating = {
    id: "r",
    attemptId: later.id,
    assessmentId: judge.id,
    consentId: consent.id,
    rating: 3 as const,
    recordedAt: "2026-09-03T10:05:00.000Z",
  };
  expect(
    qualifyProspectiveReviews(events, "en", now, null, [rating]).eligible,
  ).toHaveLength(0);
  expect(
    qualifyProspectiveReviews(events, "en", now, consent, []).eligible,
  ).toHaveLength(0);
  expect(
    qualifyProspectiveReviews(events, "en", now, consent, [rating]).eligible,
  ).toHaveLength(1);
  const originals = JSON.stringify({ events, consent, rating });
  const shadow = buildQualifiedFsrsCandidates(events, "en", now, consent, [
    rating,
  ]);
  expect(shadow.cards).toHaveLength(1);
  expect(shadow.cards[0]?.history[0]?.responseSha256).toBe(
    later.response.sha256,
  );
  expect(shadow.cards[0]?.candidate).toBeDefined();
  expect(shadow.learnerScheduleApplied).toBe(false);
  expect(shadow.rolloutEligible).toBe(false);
  expect(JSON.stringify({ events, consent, rating })).toBe(originals);
  expect(
    qualifyProspectiveReviews(events, "en", now, consent, [
      rating,
      { ...rating, rating: 4 },
    ]).eligible,
  ).toHaveLength(0);
  expect(
    qualifyProspectiveReviews(
      [
        ...events,
        {
          version: 2,
          type: "invalidation",
          id: "void",
          language: "en",
          at: "2026-09-04T12:00:00.000Z",
          assessmentId: judge.id,
          reason: "review_overturned",
        },
      ],
      "en",
      now,
      consent,
      [rating],
    ).eligible,
  ).toHaveLength(0);
});
function attempt(id = "a", at = "2026-09-01T10:00:10.000Z"): AttemptEvent {
  return {
    version: 2,
    type: "attempt",
    id,
    language: "en",
    at,
    task: {
      id: `task-${id}`,
      version: "1",
      constructionId: "en.c.001",
      familyId: "G01",
      itemFamily: `family-${id}`,
      contextId: `context-${id}`,
      rubricVersion: "1",
      stage: "retrieve",
      modality: "writing",
      partition: "evaluation",
      transferCondition: "none",
      contentReview: "human_reviewed",
    },
    response: {
      text: "She is ready.",
      sha256: hash,
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: new Date(Date.parse(at) - 10000).toISOString(),
      activeMs: 8000,
      firstInputMs: 1200,
      source: "monotonic_visible",
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
function assessment(a: AttemptEvent): AssessmentEvent {
  return {
    version: 2,
    type: "assessment",
    id: `judge-${a.id}`,
    language: a.language,
    at: new Date(Date.parse(a.at) + 1000).toISOString(),
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
      id: "test-rule",
      version: "1",
      kind: "rule",
      scopeApproved: true,
      reviewId: "synthetic-review",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic fixture",
    correction: null,
    spans: [],
    supersedes: null,
  };
}
function reduce(events: readonly unknown[]) {
  return reduceAutomaticityEvents(events, "en", now);
}
class MemoryStore implements LocalStore {
  rows = new Map<string, string>();
  get length() {
    return this.rows.size;
  }
  key(index: number) {
    return [...this.rows.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.rows.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.rows.set(key, value);
  }
  removeItem(key: string) {
    this.rows.delete(key);
  }
}
describe("independent evidence and provenance", () => {
  test("a valid first response is checked without inventing delay or transfer", () => {
    const a = attempt();
    const r = reduce([a, assessment(a)]);
    expect(r.attempts[0]?.eligibleForMastery).toBe(true);
    expect(r.attempts[0]?.delayed).toBe(false);
    expect(r.attempts[0]?.novel).toBe(false);
    expect(r.progress[0]?.status).toBe("independent_evidence");
  });
  test("self-checks cannot replace or conflict with an authoritative assessment", () => {
    const a = attempt(),
      judge = assessment(a);
    const self: AssessmentEvent = {
      ...judge,
      id: "self",
      at: "2026-09-01T11:00:00.000Z",
      evaluator: {
        id: "learner",
        version: "1",
        kind: "self",
        scopeApproved: false,
        reviewId: null,
      },
    };
    expect(reduce([a, judge, self]).attempts[0]?.assessment?.id).toBe(judge.id);
    expect(
      reduce([a, judge, { ...self, supersedes: judge.id }]).attempts[0]
        ?.assessment?.id,
    ).toBe(judge.id);
    expect(reduce([a, self]).progress[0]?.accuracy).toBeNull();
  });
  test("missing assessment stays unknown while a practice revisit can still be scheduled", () => {
    const r = reduce([attempt()]);
    expect(r.progress[0]?.accuracy).toBeNull();
    expect(r.progress[0]?.status).toBe("not_checked");
    expect(r.progress[0]?.nextReviewAt).toBe("2026-09-02T10:00:10.000Z");
    expect(r.progress[0]?.delayedSuccesses).toBe(0);
  });
  test.each([
    "solutionRevealed",
    "exampleSeen",
    "selfReportedAssistance",
  ] as const)("%s cannot earn independent credit", (key) => {
    const a = attempt();
    a.assistance[key] = true;
    expect(reduce([a, assessment(a)]).attempts[0]?.independent).toBe(false);
  });
  test("hints and exposure in another tab disqualify the matching item family", () => {
    const a = attempt();
    const e: AutomaticityEvent = {
      version: 2,
      type: "exposure",
      id: "exposure",
      language: "en",
      at: a.timing.startedAt,
      constructionId: a.task.constructionId,
      taskId: "other-render",
      itemFamily: a.task.itemFamily,
      kind: "hint",
    };
    expect(reduce([e, a, assessment(a)]).attempts[0]?.independent).toBe(false);
    a.assistance.hintCount = 1;
    expect(reduce([a, assessment(a)]).attempts[0]?.independent).toBe(false);
  });
  test("immediate repeated item successes are useful practice only", () => {
    const a = attempt();
    const b = attempt("b", "2026-09-01T10:02:10.000Z");
    b.task.itemFamily = a.task.itemFamily;
    const r = reduce([a, assessment(a), b, assessment(b)]);
    expect(r.attempts[1]?.independent).toBe(false);
    expect(r.progress[0]?.independentAssessed).toBe(1);
  });
  test("a fresh unaided return to a known item can establish retention but never novelty", () => {
    const a = attempt();
    const b = attempt("b", "2026-09-03T10:00:10.000Z");
    b.task.id = a.task.id;
    b.task.itemFamily = a.task.itemFamily;
    b.task.contextId = a.task.contextId;
    b.task.stage = "retain";
    const exposure: AutomaticityEvent = {
      version: 2,
      type: "exposure",
      id: "old-model",
      language: "en",
      at: a.timing.startedAt,
      constructionId: a.task.constructionId,
      taskId: a.task.id,
      itemFamily: a.task.itemFamily,
      kind: "solution",
    };
    const result = reduce([exposure, a, assessment(a), b, assessment(b)]);
    expect(result.attempts[0]?.independent).toBe(false);
    expect(result.attempts[1]?.independent).toBe(true);
    expect(result.attempts[1]?.delayed).toBe(true);
    expect(result.attempts[1]?.novel).toBe(false);
    b.previousAttemptId = a.id;
    expect(
      reduce([a, assessment(a), b, assessment(b)]).attempts[1]?.independent,
    ).toBe(false);
  });
  test("new task with actual elapsed time and new context supplies separate delay and novelty", () => {
    const a = attempt();
    const b = attempt("b", "2026-09-03T10:00:10.000Z");
    b.task.stage = "transfer";
    b.task.transferCondition = "elicited";
    const r = reduce([a, assessment(a), b, assessment(b)]);
    expect(r.attempts[1]?.elapsedSincePracticeMs).toBe(172800000);
    expect(r.attempts[1]?.delayed).toBe(true);
    expect(r.attempts[1]?.novel).toBe(true);
  });
  test("an immediate new-context task has novelty but not delay", () => {
    const a = attempt();
    const b = attempt("b", "2026-09-01T10:02:00.000Z");
    b.task.stage = "transfer";
    b.task.transferCondition = "target_named";
    const row = reduce([a, assessment(a), b, assessment(b)]).attempts[1];
    expect(row?.novel).toBe(true);
    expect(row?.delayed).toBe(false);
  });
  test("recent teaching exposure resets elapsed construction practice", () => {
    const a = attempt();
    const b = attempt("b", "2026-09-03T10:00:10.000Z");
    const e: AutomaticityEvent = {
      version: 2,
      type: "exposure",
      id: "e",
      language: "en",
      at: "2026-09-03T10:00:00.000Z",
      constructionId: a.task.constructionId,
      taskId: "teaching-item",
      itemFamily: "different",
      kind: "example",
    };
    expect(
      reduce([a, assessment(a), e, b, assessment(b)]).attempts[1]?.delayed,
    ).toBe(false);
  });
  test("failed eligible attempts remain in the accuracy denominator", () => {
    const a = attempt();
    const b = attempt("b");
    const fail = assessment(b);
    fail.verdict = "needs_repair";
    fail.dimensions.grammar = "fail";
    const r = reduce([a, assessment(a), b, fail]);
    expect(r.progress[0]?.accuracy).toBe(0.5);
    expect(r.progress[0]?.independentAssessed).toBe(2);
  });
  test("target not observed is not a grammar failure", () => {
    const a = attempt();
    const result = assessment(a);
    result.verdict = "target_not_observed";
    result.dimensions.target = "not_observed";
    expect(reduce([a, result]).progress[0]?.accuracy).toBeNull();
  });
  test("valid offline suggestions cannot pose as a qualified assessor", () => {
    const a = attempt();
    const result = assessment(a);
    result.evaluator.kind = "self";
    expect(reduce([a, result]).attempts[0]?.checked).toBe(false);
  });
  test("pending content or evaluator review cannot confer mastery eligibility", () => {
    const a = attempt();
    a.task.contentReview = "authored";
    const result = assessment(a);
    expect(reduce([a, result]).attempts[0]?.eligibleForMastery).toBe(false);
    a.task.contentReview = "human_reviewed";
    result.evaluator.scopeApproved = false;
    expect(reduce([a, result]).attempts[0]?.eligibleForMastery).toBe(false);
  });
  test("speech needs persisted audio and an unchanged original transcript", () => {
    const a = attempt();
    a.task.modality = "speaking";
    expect(reduce([a, assessment(a)]).attempts[0]?.eligibleForMastery).toBe(
      false,
    );
    a.audio = {
      id: "audio",
      sha256: hash,
      bytes: 44044,
      durationMs: 1000,
      mime: "audio/wav",
      persisted: true,
    };
    a.response.originalTranscriptSha256 = hash;
    expect(reduce([a, assessment(a)]).attempts[0]?.eligibleForMastery).toBe(
      true,
    );
    a.response.transcriptEdited = true;
    expect(reduce([a, assessment(a)]).attempts[0]?.eligibleForMastery).toBe(
      false,
    );
  });
  test("unchanged duplicates do not multiply progress", () => {
    const a = attempt(),
      result = assessment(a);
    const r = reduce([a, result, a, result]);
    expect(r.attempts.length).toBe(1);
    expect(r.progress[0]?.independentSuccesses).toBe(1);
  });
  test("conflicting duplicate identities are quarantined", () => {
    const a = attempt(),
      other = structuredClone(a);
    other.response.text = "Different answer";
    const r = reduce([a, other, assessment(a)]);
    expect(r.attempts).toHaveLength(0);
    expect(r.rejected.length).toBeGreaterThan(0);
  });
  test("competing current judgments abstain until explicitly superseded", () => {
    const a = attempt(),
      r1 = assessment(a),
      r2 = assessment(a);
    r2.id = "second";
    r2.at = "2026-09-01T10:00:12.000Z";
    expect(reduce([a, r1, r2]).attempts[0]?.checked).toBe(false);
    r2.supersedes = r1.id;
    expect(reduce([a, r1, r2]).attempts[0]?.checked).toBe(true);
  });
  test("overturned judgments recompute progress and due dates", () => {
    const a = attempt(),
      r1 = assessment(a),
      r2 = assessment(a);
    r2.id = "second";
    r2.at = "2026-09-01T10:00:12.000Z";
    r2.supersedes = r1.id;
    r2.verdict = "needs_repair";
    r2.dimensions.grammar = "fail";
    const r = reduce([a, r1, r2]);
    expect(r.progress[0]?.accuracy).toBe(0);
    expect(r.attempts[0]?.assessment?.id).toBe(r2.id);
  });
  test("an explicit invalidation never resurrects the previous verdict", () => {
    const a = attempt(),
      r = assessment(a);
    const invalid: AutomaticityEvent = {
      version: 2,
      type: "invalidation",
      id: "invalidate",
      language: "en",
      at: "2026-09-01T10:00:13.000Z",
      assessmentId: r.id,
      reason: "recording_replaced",
    };
    expect(reduce([a, r, invalid]).progress[0]?.accuracy).toBeNull();
  });
  test.each(["responseSha256", "taskVersion", "rubricVersion"] as const)(
    "a mismatched %s cannot assess another response",
    (key) => {
      const a = attempt(),
        r = assessment(a);
      r[key] = key === "responseSha256" ? "b".repeat(64) : "other";
      expect(reduce([a, r]).attempts[0]?.checked).toBe(false);
    },
  );
  test("future events, impossible timing and invalid spans are rejected", () => {
    expect(
      reduce([attempt("future", "2027-01-01T10:00:10.000Z")]).attempts,
    ).toHaveLength(0);
    const a = attempt();
    a.timing.firstInputMs = 99000;
    expect(() => parseAutomaticityEvent(a)).toThrow();
    a.timing.firstInputMs = 1000;
    const r = assessment(a);
    r.spans = [{ start: 0, end: 999, explanation: "bad" }];
    expect(reduce([a, r]).attempts[0]?.checked).toBe(false);
  });
  test("unknown timing is not converted into zero latency", () => {
    const a = attempt();
    a.timing = {
      startedAt: a.timing.startedAt,
      activeMs: null,
      firstInputMs: null,
      source: "unavailable",
    };
    expect(
      reduce([a, assessment(a)]).progress[0]?.medianFirstInputMs,
    ).toBeNull();
  });
  test("opposite-language events cannot enter this profile", () => {
    const a = attempt();
    a.language = "de";
    expect(reduce([a, assessment(a)]).attempts).toHaveLength(0);
  });
  test("contradictory pass and unassessed payloads are rejected", () => {
    const r = assessment(attempt());
    r.uncertainty = true;
    expect(() => parseAutomaticityEvent(r)).toThrow();
    r.uncertainty = false;
    r.verdict = "not_assessed";
    expect(() => parseAutomaticityEvent(r)).toThrow();
  });
});
describe("local preservation", () => {
  test("append is idempotent and conflicting IDs cannot overwrite prior work", () => {
    const store = new MemoryStore();
    const a = attempt();
    appendAutomaticityEvent(store, a);
    appendAutomaticityEvent(store, a);
    expect(store.length).toBe(1);
    a.response.text = "changed";
    expect(() => appendAutomaticityEvent(store, a)).toThrow();
    expect(readAutomaticityEvents(store, "en").events[0]?.type).toBe("attempt");
  });
  test("legacy snapshot preserves corrupt, partial and duplicate original bytes", () => {
    const store = new MemoryStore();
    store.setItem(
      "grammar-automaticity:v27",
      '{"attempts":[{"id":"a"},{"id":"a"}]}',
    );
    store.setItem("english-automaticity:daily-session:v1", "broken-json");
    store.setItem("oauth-token", "never-copy");
    const first = preserveLegacyState(store, "en", now);
    expect(first.keys).toBe(2);
    expect(preserveLegacyState(store, "en", now).status).toBe("already_saved");
    expect(store.getItem("english-automaticity:daily-session:v1")).toBe(
      "broken-json",
    );
    expect(store.getItem("automaticity:v2:en:legacy-snapshot")).not.toContain(
      "never-copy",
    );
  });
  test("unreadable event rows are reported and retained", () => {
    const store = new MemoryStore();
    store.setItem("automaticity:v2:en:event:bad", "bad");
    expect(readAutomaticityEvents(store, "en").unreadable).toHaveLength(1);
    expect(store.length).toBe(1);
  });
  test("opposite language and credential keys are not included", () => {
    expect(ownsStorageKey("deutsch-automaticity:daily-session:v1", "en")).toBe(
      false,
    );
    expect(ownsStorageKey("oauth-token", "en")).toBe(false);
  });
  test("backup integrity and language are checked before restoration", async () => {
    const payload = {
      kind: "automaticity.complete-backup",
      version: 2,
      language: "en",
      createdAt: now,
      localStorage: [["grammar-automaticity:v27", "{broken"]],
      databases: [],
    };
    const backup = {
      ...payload,
      sha256: await sha256(JSON.stringify(payload)),
    };
    await expect(validateCompleteBackup(backup, "en")).resolves.toBe(
      backup as never,
    );
    await expect(validateCompleteBackup(backup, "de")).rejects.toThrow();
    backup.localStorage[0]![1] = "altered";
    await expect(validateCompleteBackup(backup, "en")).rejects.toThrow();
  });
});
