import { describe, expect, test } from "bun:test";
import type {
  ConstructionUnit,
  CurriculumPack,
  PracticeTask,
} from "./curriculum";
import type { ReducedAttempt } from "./evidence";
import {
  DAILY_NOTEBOOK_GOAL,
  isNotebookTask,
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
  verdict: "pass" | "needs_repair" | "not_assessed",
  at = "2026-11-03T10:00:00.000Z",
) =>
  ({
    attempt: { id, task: { id: taskId }, at, language: "en" },
    assessment: { verdict },
  }) as unknown as ReducedAttempt;

describe("error-notebook practice", () => {
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
});
