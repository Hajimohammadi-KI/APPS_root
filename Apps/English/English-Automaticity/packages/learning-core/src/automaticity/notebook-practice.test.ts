import { describe, expect, test } from "bun:test";
import type {
  ConstructionUnit,
  CurriculumPack,
  PracticeTask,
} from "./curriculum";
import type { ReducedAttempt } from "./evidence";
import type { AssessmentEvent, AttemptEvent } from "./contracts";
import {
  DAILY_NOTEBOOK_GOAL,
  isNotebookTask,
  notebookCopy,
  notebookProgress,
} from "./notebook-practice";

const task = (id: string, sourceId: string): PracticeTask => ({
  id,
  version: "2026-11-03.1",
  constructionId: id.split(".").slice(0, 3).join("."),
  familyId: "G01",
  itemFamily: id,
  contextId: id,
  rubricVersion: "closed-nfc-case-v1",
  stage: "retrieve",
  modality: "writing",
  partition: "practice",
  transferCondition: "none",
  contentReview: "authored",
  prompt: "Complete the sentence: I ___ ready. (be)",
  answerPolicy: "closed",
  responseKind: "cloze",
  acceptedAnswers: ["I am ready."],
  hints: [],
  solution: "I am ready.",
  normalisation: {
    nfc: true,
    whitespace: true,
    terminalFullStop: true,
    preserveCase: true,
  },
  sourceId,
});
const unit = (
  id: string,
  level: string,
  tasks: PracticeTask[],
  retired: string[] = [],
): ConstructionUnit => ({
  id,
  language: "en",
  title: id,
  level,
  familyIds: ["G01"],
  prerequisites: [],
  lessonAlias: id,
  rule: "",
  examples: [],
  commonError: "",
  review: "authored",
  sources: [],
  tasks,
  retiredTasks: retired.map((taskId) => ({
    taskId,
    replacementTaskId: tasks[0]!.id,
    reason: "fixture",
    retiredOn: "2026-11-03",
  })),
});
const note = (id: string) => task(id, `learner-notebook-2026-11-03.1:${id}`);
const pack: CurriculumPack = {
  version: "2026-11-03.1",
  mappingVersion: "1",
  language: "en",
  units: [
    unit("en.c.040", "B1", [
      note("en.c.040.a"),
      task("en.c.040.b", "authored"),
    ]),
    unit(
      "en.c.002",
      "A1",
      [note("en.c.002.a"), note("en.c.002.old")],
      ["en.c.002.old"],
    ),
    unit("en.c.090", "A2", [note("en.c.090.a")]),
  ],
};
const attempt = (
  id: string,
  taskId: string,
  verdict: "pass" | "needs_repair" | "not_assessed" | null,
  at = "2026-11-03T10:00:00.000Z",
): ReducedAttempt => {
  const original: AttemptEvent = {
    version: 2,
    type: "attempt",
    id,
    at,
    language: "en",
    task: note(taskId),
    response: {
      text: verdict === "pass" ? "I am ready." : "I ready.",
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
  const assessed: AssessmentEvent | null =
    verdict === null
      ? null
      : {
          version: 2,
          type: "assessment",
          id: `assessment-${id}`,
          language: "en",
          at,
          attemptId: id,
          responseSha256: original.response.sha256,
          taskVersion: original.task.version,
          rubricVersion: original.task.rubricVersion,
          verdict,
          dimensions: {
            grammar:
              verdict === "pass"
                ? "pass"
                : verdict === "needs_repair"
                  ? "fail"
                  : "unknown",
            target: verdict === "not_assessed" ? "unknown" : "observed",
            relevance: verdict === "not_assessed" ? "unknown" : "pass",
            opportunities: verdict === "not_assessed" ? null : 1,
          },
          evaluator: {
            id: "controlled-answer",
            version: "1",
            kind: "rule",
            scopeApproved: false,
            reviewId: null,
          },
          uncertainty: verdict === "not_assessed",
          confidence: null,
          feedback: "Fixture feedback",
          correction: null,
          spans: [],
          supersedes: null,
        };
  return {
    attempt: original,
    assessment: assessed,
    independent: true,
    checked: verdict === "pass" || verdict === "needs_repair",
    success: verdict === "pass",
    delayed: false,
    novel: false,
    elapsedSincePracticeMs: null,
    eligibleForMastery: false,
    reasons: [],
  };
};

const oneItem: CurriculumPack = {
  ...pack,
  units: [unit("en.c.002", "A1", [note("en.c.002.a")])],
};
const now = "2026-11-03T12:00:00.000Z";

describe("error-notebook practice", () => {
  test.each(["needs_repair", "not_assessed", null] as const)(
    "a latest %s response reopens a previously passed item without rewriting history",
    (verdict) => {
      const rows = [
        attempt("old-pass", "en.c.002.a", "pass"),
        attempt("latest", "en.c.002.a", verdict, "2026-11-03T11:00:00.000Z"),
      ];
      const before = structuredClone(rows);
      const progress = notebookProgress(oneItem, rows, { now });
      expect(progress.passed).toBe(0);
      expect(progress.next?.previousAttemptId).toBe("latest");
      expect(progress.today).toBe(1);
      expect(rows).toEqual(before);
      expect(rows[0]!.assessment?.verdict).toBe("pass");
      expect(rows[1]!.assessment?.verdict ?? null).toBe(verdict);
    },
  );

  test("a later checked pass closes the item while an unverified pass does not", () => {
    const failed = attempt("failed", "en.c.002.a", "needs_repair");
    const passed = attempt(
      "passed",
      "en.c.002.a",
      "pass",
      "2026-11-03T11:00:00.000Z",
    );
    expect(notebookProgress(oneItem, [failed, passed], { now })).toMatchObject({
      passed: 1,
      next: null,
    });
    passed.checked = false;
    passed.success = false;
    expect(notebookProgress(oneItem, [failed, passed], { now }).passed).toBe(0);
  });

  test("orders real instants and resolves timestamp ties by attempt ID independently of input order", () => {
    const earlyPass = attempt(
      "a-pass",
      "en.c.002.a",
      "pass",
      "2026-11-03T10:30:00+02:00",
    );
    const lateWrong = attempt(
      "b-wrong",
      "en.c.002.a",
      "needs_repair",
      "2026-11-03T09:00:00Z",
    );
    const tiedUnknown = attempt(
      "z-unknown",
      "en.c.002.a",
      "not_assessed",
      "2026-11-03T10:00:00+01:00",
    );
    for (const rows of [
      [earlyPass, lateWrong, tiedUnknown],
      [tiedUnknown, earlyPass, lateWrong],
      [lateWrong, tiedUnknown, earlyPass],
    ]) {
      expect(notebookProgress(oneItem, rows, { now })).toMatchObject({
        passed: 0,
        next: { previousAttemptId: "z-unknown" },
      });
    }
  });

  test("wrong-language, old-version, future and invalid-time rows cannot replace current grading state", () => {
    const failed = attempt("current", "en.c.002.a", "needs_repair");
    const otherLanguage = attempt(
      "de",
      "en.c.002.a",
      "pass",
      "2026-11-03T11:00:00Z",
    );
    otherLanguage.attempt.language = "de";
    const oldVersion = attempt(
      "old-version",
      "en.c.002.a",
      "pass",
      "2026-11-03T11:00:00Z",
    );
    oldVersion.attempt.task.version = "retired-version";
    const future = attempt(
      "future",
      "en.c.002.a",
      "pass",
      "2026-11-03T13:00:00Z",
    );
    const invalid = attempt("invalid", "en.c.002.a", "pass", "not-a-date");
    expect(
      notebookProgress(
        oneItem,
        [failed, otherLanguage, oldVersion, future, invalid],
        { now },
      ),
    ).toMatchObject({
      passed: 0,
      next: { previousAttemptId: "current" },
      today: 1,
    });
    expect(
      notebookProgress(oneItem, [otherLanguage, future, invalid], { now }),
    ).toMatchObject({ passed: 0, today: 0, next: { previousAttemptId: null } });
    expect(notebookProgress(oneItem, [oldVersion], { now })).toMatchObject({
      passed: 0,
      today: 1,
      next: { previousAttemptId: null },
    });
    expect(
      notebookProgress(oneItem, [failed], { now: "invalid-now" }),
    ).toMatchObject({ passed: 0, today: 0, next: { previousAttemptId: null } });
  });
  test("recognises notebook items by their source", () => {
    expect(isNotebookTask(note("en.c.002.a"))).toBe(true);
    expect(
      isNotebookTask(task("x", "authored-checked-practice-2026-11-01.4:x")),
    ).toBe(false);
  });

  test("counts active items in level order and offers untried ones first", () => {
    const fresh = notebookProgress(pack, []);
    expect(fresh.total).toBe(3);
    expect(fresh.passed).toBe(0);
    // A1 before A2 before B1; the retired item is never offered.
    expect(fresh.next?.task.id).toBe("en.c.002.a");
    expect(fresh.next?.previousAttemptId).toBeNull();

    const later = notebookProgress(pack, [
      attempt("1", "en.c.002.a", "needs_repair"),
      attempt("2", "en.c.090.a", "pass"),
    ]);
    expect(later.passed).toBe(1);
    // The untried B1 item comes before repeating the failed A1 item.
    expect(later.next?.task.id).toBe("en.c.040.a");
  });

  test("returns to a failed item as a repair of its latest attempt, then stops", () => {
    const repair = notebookProgress(pack, [
      attempt("1", "en.c.002.a", "needs_repair", "2026-11-03T10:00:00.000Z"),
      attempt("3", "en.c.002.a", "not_assessed", "2026-11-03T11:00:00.000Z"),
      attempt("2", "en.c.090.a", "pass"),
      attempt("4", "en.c.040.a", "pass"),
    ]);
    expect(repair.passed).toBe(2);
    expect(repair.next?.task.id).toBe("en.c.002.a");
    expect(repair.next?.previousAttemptId).toBe("3");

    const done = notebookProgress(pack, [
      attempt("1", "en.c.002.a", "needs_repair"),
      attempt("5", "en.c.002.a", "pass", "2026-11-03T12:00:00.000Z"),
      attempt("2", "en.c.090.a", "pass"),
      attempt("4", "en.c.040.a", "pass"),
    ]);
    expect(done).toMatchObject({ total: 3, passed: 3, next: null });
  });

  test("keeps to one grammar level and counts the items tried today", () => {
    const b1 = notebookProgress(pack, [], { level: "B1" });
    expect(b1).toMatchObject({ total: 1, passed: 0 });
    expect(b1.next?.task.id).toBe("en.c.040.a");
    expect(notebookProgress(pack, [], { level: "C2" })).toMatchObject({
      total: 0,
      passed: 0,
      next: null,
      today: 0,
    });
    const attempts = [
      attempt("1", "en.c.002.a", "needs_repair", "2026-11-03T09:00:00.000Z"),
      attempt("2", "en.c.002.a", "pass", "2026-11-03T10:00:00.000Z"),
      attempt("3", "en.c.090.a", "pass", "2026-11-02T10:00:00.000Z"),
      attempt("4", "en.c.040.a", "needs_repair", "2026-11-03T11:00:00.000Z"),
    ];
    const now = "2026-11-03T12:00:00.000Z";
    // Two items were tried today, one twice; the A2 item was yesterday.
    expect(notebookProgress(pack, attempts, { now }).today).toBe(2);
    expect(
      notebookProgress(pack, attempts, { level: "A1", now }),
    ).toMatchObject({ total: 1, passed: 1, next: null, today: 1 });
    expect(DAILY_NOTEBOOK_GOAL).toBeGreaterThan(0);
  });

  test("never tells a visitor the items are their own errors and says where they come from", () => {
    // Every visitor sees the same items, written from one learner's notebook,
    // so the wording names the notebook without claiming it is theirs.
    const claim = {
      en: /\b(your|my|own)\b/iu,
      de: /\b(dein|mein|eigen)\w*/iu,
    } as const;
    for (const language of ["en", "de"] as const) {
      const copy = notebookCopy(language);
      const texts = [
        copy.title,
        copy.todayTitle,
        copy.source,
        copy.progressBasis,
        copy.thisTask,
        copy.noneAt("C2"),
        copy.progress("A1", { passed: 0, total: 18 }, { passed: 0, total: 28 }),
      ];
      for (const text of texts)
        expect(`${text}: ${text.match(claim[language])?.[0] ?? "none"}`).toBe(
          `${text}: none`,
        );
      expect(copy.source).toMatch(
        language === "en" ? /real writing errors/u : /echten Schreibfehlern/u,
      );
      expect(copy.progressBasis).toMatch(
        language === "en"
          ? /latest response.*not independent mastery/u
          : /letzten Antwort.*keinen Nachweis/u,
      );
    }
    expect(
      notebookCopy("en").progress(
        "A1",
        { passed: 1, total: 18 },
        { passed: 2, total: 28 },
      ),
    ).toBe("1 of 18 exercises at A1 passed · all levels: 2 of 28.");
  });
});
