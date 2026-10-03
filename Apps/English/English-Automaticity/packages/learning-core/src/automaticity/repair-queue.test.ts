import { describe, expect, test } from "bun:test";
import { assessControlledTask } from "./assessment";
import type { AttemptEvent, AutomaticityEvent } from "./contracts";
import type { CurriculumPack, PracticeTask } from "./curriculum";
import { reduceAutomaticityEvents, unresolvedRepairs } from "./evidence";
import { evidenceOverview } from "./overview";
import { repairTaskForAttempt, selectDailyTask } from "./selector";

const now = "2026-10-02T12:00:00.000Z";
const makeTask = (id: string): PracticeTask => ({
  id,
  version: "1",
  constructionId: "de.c.001",
  familyId: "G01",
  itemFamily: id,
  contextId: id,
  rubricVersion: "closed-nfc-case-v1",
  stage: "retrieve",
  modality: "writing",
  partition: "practice",
  transferCondition: "none",
  contentReview: "authored",
  prompt: "Ergänze: Ich ___ bereit.",
  answerPolicy: "closed",
  responseKind: "cloze",
  acceptedAnswers: ["Ich bin bereit."],
  hints: [],
  solution: "Ich bin bereit.",
  normalisation: {
    nfc: true,
    whitespace: true,
    terminalFullStop: true,
    preserveCase: true,
  },
  sourceId: "test",
});
const aTask = makeTask("a-task"),
  bTask = makeTask("b-task");
function makeAttempt(
  id: string,
  task: PracticeTask,
  minute: number,
  passed = false,
  previousAttemptId: string | null = null,
): AttemptEvent {
  const at = new Date(
    Date.parse("2026-10-02T10:00:00Z") + minute * 60000,
  ).toISOString();
  return {
    version: 2,
    type: "attempt",
    id,
    language: "de",
    at,
    task,
    response: {
      text: passed ? "Ich bin bereit." : "ich bin bereit.",
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
    previousAttemptId,
    audio: null,
  };
}
const judged = (a: AttemptEvent) =>
  [
    a,
    assessControlledTask(a, a.task as PracticeTask, a.at, `judge-${a.id}`),
  ] as const;
const pack: CurriculumPack = {
  version: "1",
  mappingVersion: "1",
  language: "de",
  units: [
    {
      id: "de.c.001",
      language: "de",
      title: "Fixture",
      level: "A1",
      familyIds: ["G01"],
      prerequisites: [],
      lessonAlias: "A1::Fixture",
      rule: "Fixture",
      examples: [],
      commonError: "Fixture",
      review: "authored",
      sources: [],
      tasks: [aTask, bTask],
    },
  ],
};
function reduce(events: readonly AutomaticityEvent[]) {
  const result = reduceAutomaticityEvents(events, "de", now);
  expect(result.rejected).toEqual([]);
  return result;
}
const pending = (events: readonly AutomaticityEvent[]) =>
  unresolvedRepairs(reduce(events).attempts).map((row) => row.attempt.id);

describe("repair queue follows the response being repaired", () => {
  test("success on an unrelated prompt does not erase an unresolved error", () => {
    const wrong = makeAttempt("wrong-a", aTask, 0),
      other = makeAttempt("pass-b", bTask, 1, true);
    const state = reduce([...judged(wrong), ...judged(other)]);
    expect(state.progress[0]?.repairNeeded).toBe(true);
    expect(selectDailyTask(pack.units[0]!, state, now).previousAttemptId).toBe(
      wrong.id,
    );
    expect(
      evidenceOverview(state, pack).repairs.map((row) => row.attemptId),
    ).toEqual([wrong.id]);
  });
  test("repairing one of two errors keeps the other error in every view", () => {
    const a = makeAttempt("a", aTask, 0),
      b = makeAttempt("b", bTask, 1);
    const fixedB = makeAttempt("fixed-b", bTask, 2, true, b.id);
    const state = reduce([...judged(a), ...judged(b), ...judged(fixedB)]);
    expect(
      unresolvedRepairs(state.attempts).map((row) => row.attempt.id),
    ).toEqual([a.id]);
    expect(selectDailyTask(pack.units[0]!, state, now).previousAttemptId).toBe(
      a.id,
    );
    expect(
      evidenceOverview(state, pack).repairs.map((row) => row.attemptId),
    ).toEqual([a.id]);
  });
  test("multiple pending errors from one topic remain visible", () => {
    const a = makeAttempt("a", aTask, 0),
      b = makeAttempt("b", bTask, 1);
    const state = reduce([...judged(a), ...judged(b)]);
    expect(
      evidenceOverview(state, pack).repairs.map((row) => row.attemptId),
    ).toEqual([a.id, b.id]);
    expect(selectDailyTask(pack.units[0]!, state, now).previousAttemptId).toBe(
      a.id,
    );
  });
  test("a failed repair replaces its own pending ancestor; a checked repair closes the chain", () => {
    const a = makeAttempt("a", aTask, 0);
    const retry = makeAttempt("retry", bTask, 1, false, a.id);
    const fixed = makeAttempt("fixed", bTask, 2, true, retry.id);
    expect(pending([...judged(a), ...judged(retry)])).toEqual([retry.id]);
    expect(pending([...judged(a), ...judged(retry), ...judged(fixed)])).toEqual(
      [],
    );
  });
  test("a checked later retry of the same task version resolves that task only", () => {
    const a = makeAttempt("a", aTask, 0),
      b = makeAttempt("b", bTask, 1),
      fixed = makeAttempt("fixed", aTask, 2, true);
    expect(pending([...judged(a), ...judged(b), ...judged(fixed)])).toEqual([
      b.id,
    ]);
  });
  test("a new version is not silently treated as a repair of an old response", () => {
    const a = makeAttempt("a", aTask, 0),
      fixed = makeAttempt("fixed", { ...aTask, version: "2" }, 1, true);
    expect(pending([...judged(a), ...judged(fixed)])).toEqual([a.id]);
    expect(
      pending([...judged(a), ...judged({ ...fixed, previousAttemptId: a.id })]),
    ).toEqual([]);
  });
  test("uncertain, unchecked and self-checked answers cannot clear an error", () => {
    const a = makeAttempt("a", aTask, 0),
      retry = makeAttempt("retry", aTask, 1, true, a.id);
    const pass = judged(retry)[1];
    expect(pending([...judged(a), retry])).toEqual([a.id]);
    expect(
      pending([
        ...judged(a),
        retry,
        {
          ...pass,
          verdict: "not_assessed",
          dimensions: {
            grammar: "unknown",
            target: "unknown",
            relevance: "unknown",
            opportunities: null,
          },
          uncertainty: true,
        },
      ]),
    ).toEqual([a.id]);
    expect(
      pending([
        ...judged(a),
        retry,
        { ...pass, evaluator: { ...pass.evaluator, kind: "self" } },
      ]),
    ).toEqual([a.id]);
  });
  test("overturning the repair judgment reopens the original error", () => {
    const a = makeAttempt("a", aTask, 0),
      fixed = makeAttempt("fixed", aTask, 1, true, a.id);
    expect(
      pending([
        ...judged(a),
        ...judged(fixed),
        {
          version: 2,
          type: "invalidation",
          id: "undo",
          language: "de",
          at: now,
          assessmentId: "judge-fixed",
          reason: "review_overturned",
          note: "Review required",
        },
      ]),
    ).toEqual([a.id]);
  });
  test("a link to another construction cannot close that construction's error", () => {
    const a = makeAttempt("a", aTask, 0),
      fixed = makeAttempt(
        "fixed",
        { ...bTask, constructionId: "de.c.002" },
        1,
        true,
        a.id,
      );
    expect(pending([...judged(a), ...judged(fixed)])).toEqual([a.id]);
  });
  test("a link to a future response cannot close an earlier error", () => {
    const a = makeAttempt("a", aTask, 0),
      fixed = makeAttempt("fixed", bTask, 1, true, "future");
    const future = makeAttempt("future", bTask, 2, false, a.id);
    expect(
      pending([...judged(a), ...judged(fixed), ...judged(future)]),
    ).toEqual([future.id]);
  });
  test("retired repairs link to the active replacement and retain the original response identity", () => {
    const a = makeAttempt("a", aTask, 0),
      replacement = { ...aTask, id: "replacement", version: "2" };
    const unit = {
      ...pack.units[0]!,
      tasks: [aTask, bTask, replacement],
      retiredTasks: [
        {
          taskId: aTask.id,
          replacementTaskId: replacement.id,
          reason: "Updated",
          retiredOn: "2026-10-02",
        },
      ],
    };
    const state = reduce(judged(a));
    expect(repairTaskForAttempt(unit, a)?.id).toBe(replacement.id);
    const link = new URL(
      evidenceOverview(state, { ...pack, units: [unit] }).repairs[0]!.href,
      "https://example.test",
    );
    expect(link.searchParams.get("task")).toBe(replacement.id);
    expect(link.searchParams.get("repairOf")).toBe(a.id);
  });
  test("repair task fallback never crosses response mode or uses evaluation items", () => {
    const a = makeAttempt("a", aTask, 0);
    const unit = {
      ...pack.units[0]!,
      tasks: [
        { ...aTask, id: "probe", partition: "evaluation" as const },
        { ...aTask, id: "speech", modality: "speaking" as const },
        { ...aTask, id: "active", stage: "repair" as const },
      ],
    };
    expect(repairTaskForAttempt(unit, a)?.id).toBe("active");
  });
});
