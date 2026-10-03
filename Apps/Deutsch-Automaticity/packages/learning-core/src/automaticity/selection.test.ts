import { describe, expect, test } from "bun:test";
import {
  assessControlledTask,
  normaliseAnswer,
  validateModelAssessment,
} from "./assessment";
import { ResponseTimer } from "./media";
import { selectDailyFocus, selectDailyTask } from "./selector";
import { type CurriculumPack, type PracticeTask } from "./curriculum";
import { constructionsForLesson, validateCurriculum } from "./curriculum";
import { type AttemptEvent } from "./contracts";
import { reduceAutomaticityEvents } from "./evidence";
import { evidenceOverview } from "./overview";
const at = "2026-09-05T10:00:00.000Z";
const task: PracticeTask = {
  id: "t",
  version: "1",
  constructionId: "de.c.001",
  familyId: "G01",
  itemFamily: "i",
  contextId: "home",
  rubricVersion: "1",
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
};
const attempt: AttemptEvent = {
  version: 2,
  type: "attempt",
  id: "a",
  language: "de",
  at,
  task,
  response: {
    text: "Ich bin bereit.",
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
const pack: CurriculumPack = {
  version: "1",
  mappingVersion: "1",
  language: "de",
  units: [1, 2, 3].map((index) => ({
    id: `de.c.00${index}`,
    language: "de",
    title: `Unit ${index}`,
    level: "A1",
    familyIds: ["G01"],
    prerequisites: [],
    lessonAlias: `A1::Unit ${index}`,
    rule: "Synthetic fixture",
    examples: [],
    commonError: "Synthetic",
    review: "authored",
    sources: [],
    tasks: [],
  })),
};
describe("scoped feedback and task selection", () => {
  test("approved model tuples cannot cross content versions, modes or rubrics", () => {
    const proposal = assessControlledTask(attempt, task, at, "model-result");
    proposal.evaluator = {
      id: "test-model",
      version: "1",
      kind: "transformer",
      scopeApproved: false,
      reviewId: null,
    };
    const approval = {
      evaluatorId: "test-model",
      evaluatorVersion: "1",
      language: "de" as const,
      constructionIds: [task.constructionId],
      rubricVersions: [task.rubricVersion, "changed"],
      modalities: ["writing" as const, "speaking" as const],
      scopes: [
        {
          constructionId: task.constructionId,
          taskVersion: task.version,
          rubricVersion: task.rubricVersion,
          modality: task.modality,
        },
      ],
      benchmarkSha256: "b".repeat(64),
      approved: true,
    };
    expect(
      validateModelAssessment(proposal, attempt, approval).evaluator
        .scopeApproved,
    ).toBe(true);
    for (const change of [
      { version: "2" },
      { modality: "speaking" as const },
      { rubricVersion: "changed" },
    ]) {
      const changed = { ...attempt, task: { ...attempt.task, ...change } };
      expect(() =>
        validateModelAssessment(
          {
            ...proposal,
            taskVersion: changed.task.version,
            rubricVersion: changed.task.rubricVersion,
          },
          changed,
          approval,
        ),
      ).toThrow("benchmark");
    }
    expect(() =>
      validateModelAssessment(
        {
          ...proposal,
          dimensions: { ...proposal.dimensions, target: "not_observed" },
        },
        attempt,
        approval,
      ),
    ).toThrow(/contradicts|consistent/);
  });
  test("all views select the same repair and remove it after an overturned judgment", () => {
    const wrong = {
      ...attempt,
      response: { ...attempt.response, text: "ich bin bereit." },
    };
    const judgment = assessControlledTask(wrong, task, at, "repair-judgment");
    const withTasks = {
      ...pack,
      units: pack.units.map((unit, index) =>
        index ? unit : { ...unit, tasks: [task] },
      ),
    };
    const view = evidenceOverview(
      reduceAutomaticityEvents([wrong, judgment], "de", at),
      withTasks,
    );
    expect(view.repairs[0]?.attemptId).toBe(attempt.id);
    expect(
      new URL(view.repairs[0]!.href, "http://localhost").searchParams.get(
        "repairOf",
      ),
    ).toBe(attempt.id);
    expect(view.modes[0]?.accuracy).toBeNull();
    expect(view.modes[1]?.attempts).toBe(0);
    const replacement = {
      ...judgment,
      id: "overturned",
      at: "2026-09-05T10:00:00.500Z",
      supersedes: judgment.id,
      verdict: "pass" as const,
      dimensions: {
        grammar: "pass" as const,
        target: "observed" as const,
        relevance: "pass" as const,
        opportunities: 1,
      },
    };
    expect(
      evidenceOverview(
        reduceAutomaticityEvents([wrong, judgment, replacement], "de", at),
        withTasks,
      ).repairs,
    ).toEqual([]);
  });
  test("lesson aliases support many-to-many mappings without changing construction IDs", () => {
    const linked: CurriculumPack = {
      ...pack,
      units: pack.units.map((unit, index) => ({
        ...unit,
        lessonAliases: index < 2 ? ["A1::Shared lesson"] : [],
      })),
    };
    expect(
      constructionsForLesson(linked, "A1::Shared lesson").map(
        (unit) => unit.id,
      ),
    ).toEqual(["de.c.001", "de.c.002"]);
    expect(validateCurriculum(linked)).toEqual([]);
    linked.units[0]!.prerequisites = ["de.c.002"];
    linked.units[1]!.prerequisites = ["de.c.001"];
    expect(
      validateCurriculum(linked).some((issue) => issue.includes("cycle")),
    ).toBe(true);
  });
  test("normalization preserves grammatical case and significant punctuation", () => {
    expect(normaliseAnswer("  Ich   bin bereit. ", task)).toBe(
      "Ich bin bereit",
    );
    expect(normaliseAnswer("ich bin bereit?", task)).toBe("ich bin bereit?");
  });
  test("case-only mismatch is checked without accepting lowercased German nouns", () => {
    const result = assessControlledTask(
      {
        ...attempt,
        response: { ...attempt.response, text: "ich bin bereit." },
      },
      task,
      at,
      "judge",
    );
    expect(result.verdict).toBe("needs_repair");
    expect(result.evaluator.scopeApproved).toBe(false);
  });
  test("a valid variant and an open answer do not receive invented failure scores", () => {
    expect(
      assessControlledTask(
        {
          ...attempt,
          response: { ...attempt.response, text: "Ich bin schon bereit." },
        },
        task,
        at,
        "j",
      ).verdict,
    ).toBe("not_assessed");
    expect(
      assessControlledTask(
        attempt,
        { ...task, answerPolicy: "open", acceptedAnswers: [] },
        at,
        "j",
      ).verdict,
    ).toBe("not_assessed");
  });
  test("model responses cannot approve themselves", () => {
    const proposal = assessControlledTask(attempt, task, at, "j");
    proposal.evaluator = {
      id: "model",
      version: "1",
      kind: "transformer",
      scopeApproved: true,
      reviewId: "self-approved",
    };
    const approval = {
      evaluatorId: "model",
      evaluatorVersion: "1",
      language: "de" as const,
      constructionIds: [task.constructionId],
      rubricVersions: ["1"],
      modalities: ["writing" as const],
      scopes: [
        {
          constructionId: task.constructionId,
          taskVersion: task.version,
          rubricVersion: task.rubricVersion,
          modality: task.modality,
        },
      ],
      benchmarkSha256: "b".repeat(64),
      approved: false,
    };
    expect(() => validateModelAssessment(proposal, attempt, approval)).toThrow(
      "benchmark",
    );
    expect(() =>
      validateModelAssessment(
        { ...proposal, responseSha256: "c".repeat(64) },
        attempt,
        { ...approval, approved: true },
      ),
    ).toThrow("original");
  });
  test("cold start stays diagnostic and limits the daily focus", () => {
    const result = selectDailyFocus(pack, [], at, "A1", 99);
    expect(result.focus).toHaveLength(2);
    expect(result.repairs).toEqual([]);
    expect(result.reason).toBe("diagnostic");
    expect(selectDailyFocus(pack, [], at, "A1", 99)).toEqual(result);
  });
  test("practice errors can request repair before a mastery score exists", () => {
    const result = assessControlledTask(
      {
        ...attempt,
        response: { ...attempt.response, text: "ich bin bereit." },
      },
      task,
      at,
      "j",
    );
    const state = reduceAutomaticityEvents([attempt, result], "de", at);
    expect(state.progress[0]?.accuracy).toBeNull();
    expect(state.progress[0]?.practiceFailures).toBe(1);
    expect(selectDailyFocus(pack, state.progress, at, "A1").reason).toBe(
      "repair",
    );
    expect(
      selectDailyFocus(pack, state.progress, "2026-09-07T10:00:00.000Z", "A1")
        .reason,
    ).toBe("due_review");
    expect(state.progress[0]?.delayedSuccesses).toBe(0);
  });
  test("a hidden tab contributes no response latency", () => {
    let clock = 0;
    const timer = new ResponseTimer(() => clock);
    clock = 200;
    timer.visibility(false);
    clock = 10000;
    timer.visibility(true);
    clock = 10400;
    timer.input();
    clock = 10600;
    expect(timer.read()).toEqual({ activeMs: 800, firstInputMs: 600 });
  });
  test("a repaired error leaves the repair queue but remains in history", () => {
    const fail = assessControlledTask(
      {
        ...attempt,
        response: { ...attempt.response, text: "ich bin bereit." },
      },
      task,
      at,
      "bad",
    );
    const later = {
      ...attempt,
      id: "b",
      at: "2026-09-05T10:01:00.000Z",
      previousAttemptId: attempt.id,
    };
    const pass = assessControlledTask(later, task, later.at, "good");
    const state = reduceAutomaticityEvents(
      [attempt, fail, later, pass],
      "de",
      later.at,
    );
    expect(state.progress[0]?.practiceFailures).toBe(1);
    expect(state.progress[0]?.repairNeeded).toBe(false);
    expect(
      selectDailyFocus(pack, state.progress, later.at, "A1").repairs,
    ).toEqual([]);
  });
  test("large practice totals cannot push a due construction behind new work", () => {
    const progress = reduceAutomaticityEvents([attempt], "de", at).progress;
    const due = {
      ...progress[0]!,
      attempts: 100000,
      nextReviewAt: "2026-09-04T10:00:00.000Z",
    };
    expect(selectDailyFocus(pack, [due], at, "A1").focus[0]?.id).toBe(
      due.constructionId,
    );
  });
  test("changing level cannot hide an outstanding repair", () => {
    const progress = reduceAutomaticityEvents([attempt], "de", at).progress[0]!;
    const mixed = {
      ...pack,
      units: pack.units.map((unit, index) => ({
        ...unit,
        level: index ? "B1" : "A1",
      })),
    };
    const selected = selectDailyFocus(
      mixed,
      [{ ...progress, repairNeeded: true, nextReviewAt: null }],
      at,
      "B1",
    );
    expect(selected.reason).toBe("repair");
    expect(selected.focus[0]?.id).toBe(attempt.task.constructionId);
    expect(
      selectDailyFocus(
        mixed,
        [{ ...progress, repairNeeded: false }],
        at,
        "B1",
      ).focus.every((unit) => unit.level === "B1"),
    ).toBe(true);
  });
  test("unknown and other-language constructions cannot fill the repair queue", () => {
    const progress = reduceAutomaticityEvents([attempt], "de", at).progress[0]!;
    const foreign = ["en.c.001", "missing"].map((constructionId) => ({
      ...progress,
      constructionId,
      repairNeeded: true,
      practiceFailures: 999,
    }));
    const selected = selectDailyFocus(pack, foreign, at, "A1");
    expect(selected.repairs).toEqual([]);
    expect(selected.reason).toBe("diagnostic");
  });
  test("accumulated reviews replace new work and the oldest due review comes first", () => {
    const progress = reduceAutomaticityEvents([attempt], "de", at).progress[0]!;
    const reviews = [
      {
        ...progress,
        constructionId: "de.c.001",
        nextReviewAt: "2026-09-04T10:00:00Z",
      },
      {
        ...progress,
        constructionId: "de.c.002",
        attempts: 999999,
        nextReviewAt: "2026-09-02T10:00:00Z",
      },
    ];
    expect(
      selectDailyFocus(pack, reviews, at, "A1").focus.map((unit) => unit.id),
    ).toEqual(["de.c.002", "de.c.001"]);
  });
  test("suggested prerequisites do not lock an unassessed advanced topic", () => {
    const advanced = {
      ...pack,
      units: pack.units.map((unit, index) =>
        index === 2
          ? { ...unit, level: "C1", prerequisites: ["de.c.001"] }
          : unit,
      ),
    };
    expect(
      selectDailyFocus(advanced, [], at, "C1").focus.map((unit) => unit.id),
    ).toEqual(["de.c.003"]);
  });
  test("a due speaking review opens an active speaking return task, never a held-out probe", () => {
    const progress = reduceAutomaticityEvents([attempt], "de", at).progress[0]!;
    const unit = {
      ...pack.units[0]!,
      tasks: [
        task,
        {
          ...task,
          id: "held-out",
          stage: "retain" as const,
          modality: "speaking" as const,
          partition: "evaluation" as const,
        },
        {
          ...task,
          id: "retired",
          stage: "retain" as const,
          modality: "speaking" as const,
        },
        {
          ...task,
          id: "active-return",
          stage: "retain" as const,
          modality: "speaking" as const,
        },
      ],
      retiredTasks: [
        {
          taskId: "retired",
          replacementTaskId: "active-return",
          retiredOn: "2026-09-05",
          reason: "Synthetic revision",
        },
      ],
    };
    const selected = selectDailyTask(
      unit,
      {
        attempts: [],
        rejected: [],
        progress: [
          {
            ...progress,
            modality: "speaking",
            nextReviewAt: "2026-09-04T10:00:00Z",
          },
        ],
      },
      at,
    );
    expect(selected.task?.id).toBe("active-return");
    expect(selected.reason).toBe("due_review");
    expect(selected.previousAttemptId).toBeNull();
  });
  test("daily repair opens the failed task with its original response identity", () => {
    const failure = assessControlledTask(
      {
        ...attempt,
        response: { ...attempt.response, text: "ich bin bereit." },
      },
      task,
      at,
      "repair",
    );
    const state = reduceAutomaticityEvents([attempt, failure], "de", at);
    state.progress.push({
      ...state.progress[0]!,
      modality: "speaking",
      repairNeeded: false,
      nextReviewAt: "2026-09-04T10:00:00Z",
    });
    const selected = selectDailyTask(
      { ...pack.units[0]!, tasks: [task] },
      state,
      at,
    );
    expect(selected.reason).toBe("repair");
    expect(selected.task?.id).toBe(task.id);
    expect(selected.previousAttemptId).toBe(attempt.id);
  });
});
