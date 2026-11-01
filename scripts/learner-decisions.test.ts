import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  appendDecisionBatch,
  applyLearnerDecisions,
  learnerDecisionRows,
  type LearnerDecision,
  type LearnerDecisionFile,
} from "./lib/learner-decisions";
import { reviseMasteryContent } from "./lib/mastery-content-revisions";
import { reviseVariationTasks } from "./lib/variation-revisions";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import {
  auditClosedTask,
  auditUnitAnswers,
} from "../shared/learning-core/src/automaticity/curriculum-audit";
import { LEARNER_FEEDBACK_POLICY } from "../shared/learning-core/src/automaticity/learner-feedback";

const built = () =>
  reviseMasteryContent(
    reviseVariationTasks(
      JSON.parse(
        readFileSync(
          new URL(
            "../shared/learning-core/content/curriculum-en.json",
            import.meta.url,
          ),
          "utf8",
        ),
      ) as CurriculumPack,
    ),
  );
const taskId = "en.c.013.repair.content-20261101.writing";
const prompt =
  "Correct the preposition and write the full sentence: The keys are in the table.";
const decision = (
  issue: number,
  kind: "accept_answer" | "known_wrong",
  answer: string,
  overrides: Partial<LearnerDecision> = {},
) => ({
  issue,
  taskId,
  taskVersion: "2026-11-01.1",
  prompt,
  decision: kind,
  answer,
  explanation: kind === "known_wrong" ? "At marks a point, not a surface." : "",
  decidedAt: "2026-11-05T09:00:00.000Z",
  ...overrides,
});
const file = (
  decisions: LearnerDecision[],
  ...later: LearnerDecision[][]
): LearnerDecisionFile => ({
  schemaVersion: 2,
  language: "en",
  batches: [decisions, ...later].map((rows, index) => ({
    version: `2026-11-0${5 + index}.1`,
    decisions: rows,
  })),
});

test("a later batch builds on the released version instead of replacing it", () => {
  const first = file([
    decision(4, "accept_answer", "The keys are lying on the table."),
  ]);
  const both = file(
    [decision(4, "accept_answer", "The keys are lying on the table.")],
    [decision(8, "accept_answer", "The keys are sitting on the table.")],
  );
  const one = applyLearnerDecisions(built(), first).pack;
  const two = applyLearnerDecisions(built(), both).pack;
  const unitOne = one.units.find((row) => row.id === "en.c.013")!;
  const unitTwo = two.units.find((row) => row.id === "en.c.013")!;
  const released = activePracticeTasks(unitOne).find(
    (row) => row.prompt === prompt,
  )!;
  // The version learners already answered stays byte-identical, now retired.
  expect(unitTwo.tasks.find((row) => row.id === released.id)).toEqual(released);
  const latest = activePracticeTasks(unitTwo).find(
    (row) => row.prompt === prompt,
  )!;
  expect(latest.version).toBe("2026-11-06.1");
  expect(latest.acceptedAnswers).toEqual([
    "The keys are on the table.",
    "The keys are lying on the table.",
    "The keys are sitting on the table.",
  ]);
  // Old links follow one hop to the newest version.
  for (const retired of unitTwo.retiredTasks ?? [])
    expect(
      unitTwo.retiredTasks!.some(
        (row) => row.taskId === retired.replacementTaskId,
      ),
    ).toBe(false);
  expect(validateCurriculum(two)).toEqual([]);
});
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const verdict = (pack: CurriculumPack, text: string) => {
  const task = pack.units
    .flatMap(activePracticeTasks)
    .find((row) => row.prompt === prompt)!;
  return assessControlledTask(
    {
      version: 2,
      type: "attempt",
      id: "attempt",
      language: "en",
      at: "2026-11-06T10:00:00.000Z",
      task: { ...task },
      response: {
        text,
        sha256: sha(text),
        originalTranscriptSha256: null,
        transcriptEdited: false,
      },
    } as never,
    task,
    "2026-11-06T10:00:00.000Z",
    "assessment",
  );
};

test("owner decisions become a new version of the exercise and keep the old one for history", () => {
  const source = built();
  const before = JSON.stringify(source);
  const { pack, skipped } = applyLearnerDecisions(
    source,
    file([
      decision(4, "accept_answer", "The keys are lying on the table."),
      decision(7, "known_wrong", "The keys are at the table."),
    ]),
  );
  expect(JSON.stringify(source)).toBe(before);
  expect(skipped).toEqual([]);
  expect(validateCurriculum(pack)).toEqual([]);
  const unit = pack.units.find((row) => row.id === "en.c.013")!;
  const active = activePracticeTasks(unit).find(
    (row) => row.prompt === prompt,
  )!;
  expect(active.id).not.toBe(taskId);
  expect(active.version).toBe("2026-11-05.1");
  expect(active.acceptedAnswers).toEqual([
    "The keys are on the table.",
    "The keys are lying on the table.",
  ]);
  expect(active.rejectedAnswers).toEqual([
    {
      answer: "The keys are at the table.",
      explanation: "At marks a point, not a surface.",
    },
  ]);
  expect(unit.tasks.find((row) => row.id === taskId)).toEqual(
    source.units
      .find((row) => row.id === "en.c.013")!
      .tasks.find((row) => row.id === taskId),
  );
  expect(unit.retiredTasks).toContainEqual(
    expect.objectContaining({ taskId, replacementTaskId: active.id }),
  );
  expect(
    [
      ...activePracticeTasks(unit).flatMap(auditClosedTask),
      ...auditUnitAnswers(unit, activePracticeTasks(unit)),
    ].filter((issue) => issue.severity === "error"),
  ).toEqual([]);
  expect(verdict(pack, "The keys are lying on the table.").verdict).toBe(
    "pass",
  );
  const rejected = verdict(pack, "The keys are at the table.");
  expect(rejected.verdict).toBe("needs_repair");
  expect(rejected.feedback).toContain("At marks a point, not a surface.");
  const again = applyLearnerDecisions(
    pack,
    file([
      decision(4, "accept_answer", "The keys are lying on the table."),
      decision(7, "known_wrong", "The keys are at the table."),
    ]),
  );
  expect(JSON.stringify(again.pack)).toBe(JSON.stringify(pack));
});

test("a decision about an exercise that has changed since the comment is not applied", () => {
  const source = built();
  const { pack, skipped } = applyLearnerDecisions(
    source,
    file([
      decision(9, "accept_answer", "on the table.", {
        taskId: "en.c.013.repair.0.writing",
        taskVersion: "2026-09-05.2",
        prompt: "Correct the sentence: The keys are in the table.",
      }),
      decision(10, "accept_answer", "The keys are on top of the table.", {
        taskId: "en.c.999.repair.0.writing",
      }),
    ]),
  );
  expect(JSON.stringify(pack)).toBe(JSON.stringify(source));
  expect(skipped.map((row) => row.issue)).toEqual([9, 10]);
});

test("contradictory decisions about the same form change nothing", () => {
  const source = built();
  const { pack, skipped } = applyLearnerDecisions(
    source,
    file([
      decision(11, "accept_answer", "The keys are at the table."),
      decision(12, "known_wrong", "the keys are at the table"),
    ]),
  );
  expect(JSON.stringify(pack)).toBe(JSON.stringify(source));
  expect(skipped.map((row) => row.issue)).toEqual([11, 12]);
});

test("only answer decisions are imported; fixes are listed for authoring", () => {
  const feedback = {
    kind: "automaticity.learner-feedback" as const,
    version: 1 as const,
    language: "en" as const,
    contentVersion: "2026-11-01.1",
    release: "2026.11.01.1",
    task: {
      id: taskId,
      version: "2026-11-01.1",
      constructionId: "en.c.013",
      prompt,
      acceptedAnswers: ["The keys are on the table."],
    },
    response: "The keys are lying on the table.",
    check: {
      verdict: "not_assessed",
      evaluator: "controlled-answer 1.0.0",
      feedback: "",
    },
    category: "answer_correct" as const,
    comment: "",
    consent: {
      policy: LEARNER_FEEDBACK_POLICY,
      at: "2026-11-01T10:00:00.000Z",
    },
  };
  const at = "2026-11-05T09:00:00.000Z";
  const rows = learnerDecisionRows([
    {
      issue: 4,
      feedback,
      decision: {
        decision: "accept_answer",
        answer: "The keys are lying on the table.",
        explanation: "",
        reply: "",
        decidedAt: at,
      },
    },
    {
      issue: 5,
      feedback,
      decision: {
        decision: "fix_exercise",
        answer: "",
        explanation: "",
        reply: "",
        decidedAt: at,
      },
    },
    {
      issue: 6,
      feedback,
      decision: {
        decision: "no_change",
        answer: "",
        explanation: "",
        reply: "",
        decidedAt: at,
      },
    },
  ]);
  expect(rows.en.map((row) => row.issue)).toEqual([4]);
  expect(rows.de).toEqual([]);
  expect(rows.fixes).toEqual([{ issue: 5, language: "en", taskId, prompt }]);
});

test("an import only appends a batch of new decisions and never removes a released one", () => {
  const start = file([
    decision(4, "accept_answer", "The keys are lying on the table."),
  ]);
  // Issue 4 was withdrawn after release, so GitHub no longer returns it.
  const next = appendDecisionBatch(
    start,
    [decision(9, "known_wrong", "The keys are at the table.")],
    "2026-11-07.1",
  );
  expect(
    next.batches.map((batch) => batch.decisions.map((row) => row.issue)),
  ).toEqual([[4], [9]]);
  expect(next.batches[1]!.version).toBe("2026-11-07.1");
  expect(
    appendDecisionBatch(
      next,
      [decision(9, "known_wrong", "The keys are at the table.")],
      "2026-11-08.1",
    ),
  ).toBe(next);
});
