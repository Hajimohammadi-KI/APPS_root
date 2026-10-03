import {
  REPRESENTATIVE_VERSION,
  resolveRepresentativeTask,
} from "../shared/learning-core/src/automaticity/representative-tasks";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
  type PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import type { AttemptEvent } from "../shared/learning-core/src/automaticity/contracts";
const root = resolve(import.meta.dir, ".."),
  output = resolve(
    root,
    `artifacts/curriculum-task-revisions/${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
await mkdir(output, { recursive: true });
const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const baseline = JSON.parse(
  await readFile(
    resolve(
      root,
      "artifacts/curriculum-task-revisions/baseline-20260905/manifest.json",
    ),
    "utf8",
  ),
) as { files: { language: "en" | "de"; path: string; sha256: string }[] };
const report: {
  at: string;
  status: string;
  scope: string;
  preservedUnits: number;
  preservedTasks: number;
  retiredTasks: number;
  newTasks: number;
  activeTasks: number;
  error?: string;
} = {
  at: new Date().toISOString(),
  status: "running",
  scope:
    "Exact historical preservation and authored task/assessment checks; not independent linguistic review",
  preservedUnits: 0,
  preservedTasks: 0,
  retiredTasks: 0,
  newTasks: 0,
  activeTasks: 0,
};
function assess(task: PracticeTask, text: string, language: "en" | "de") {
  const at = "2026-09-05T16:00:00.000Z";
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "fixture",
    at,
    language,
    task,
    response: {
      text,
      sha256: hash(text),
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
  return assessControlledTask(attempt, task, at, "fixture-assessment");
}
try {
  for (const source of baseline.files) {
    const bytes = await readFile(
      resolve(
        root,
        `artifacts/curriculum-task-revisions/baseline-20260905/${source.language}.json`,
      ),
    );
    assert.equal(hash(bytes), source.sha256);
    const before = JSON.parse(bytes.toString("utf8")) as CurriculumPack;
    const current = JSON.parse(
      await readFile(resolve(root, source.path), "utf8"),
    ) as CurriculumPack;
    assert.deepEqual(validateCurriculum(current), []);
    assert.equal(current.version, REPRESENTATIVE_VERSION);
    assert.equal(before.units.length, current.units.length);
    for (const original of before.units) {
      const unit = current.units.find((unit) => unit.id === original.id)!;
      assert(unit);
      const originalIds = new Set(original.tasks.map((task) => task.id));
      const { retiredTasks, ...withoutRetirement } = unit;
      assert.deepEqual(
        {
          ...withoutRetirement,
          tasks: unit.tasks.filter((task) => originalIds.has(task.id)),
        },
        original,
        `Historical content changed: ${original.id}`,
      );
      report.preservedUnits++;
      report.preservedTasks += original.tasks.length;
      const active = activePracticeTasks(unit);
      report.activeTasks += active.length;
      for (const row of retiredTasks ?? []) {
        assert(originalIds.has(row.taskId));
        assert(!originalIds.has(row.replacementTaskId));
        assert(active.some((task) => task.id === row.replacementTaskId));
        assert(!active.some((task) => task.id === row.taskId));
        report.retiredTasks++;
      }
      if (source.language === "en")
        assert(
          !active.some(
            (task) =>
              task.stage === "retrieve" &&
              /Type (?:another |the )?model sentence:|State the rule for|Write the transfer model for|Repair this common error for/.test(
                task.prompt,
              ),
          ),
        );
      for (const task of unit.tasks.filter(
        (task) => !originalIds.has(task.id),
      )) {
        if (task.constructionAssessment) {
          assert(resolveRepresentativeTask(task));
          continue;
        }
        report.newTasks++;
        assert.equal(task.contentReview, "authored");
        assert.equal(task.partition, "practice");
        assert.equal(task.version, "2026-09-05.4");
        if (task.modality === "speaking")
          assert(
            !/\b(?:Write|Schreibe)\b/.test(task.prompt),
            `Speaking prompt asks for writing: ${task.id}`,
          );
        if (task.answerPolicy === "closed") {
          for (const answer of task.acceptedAnswers) {
            const result = assess(task, answer, source.language);
            assert.equal(result.verdict, "pass");
            assert.equal(result.evaluator.scopeApproved, false);
          }
          assert.notEqual(
            assess(task, "An unrelated grammatical sentence.", source.language)
              .verdict,
            "pass",
          );
        } else
          assert.equal(
            assess(
              task,
              "A response that needs an actual review.",
              source.language,
            ).verdict,
            "not_assessed",
          );
      }
    }
    if (source.language === "de") {
      const task = (id: string, slug: string) =>
        current.units
          .find((unit) => unit.id === id)!
          .tasks.find(
            (task) => task.id.includes(slug) && task.modality === "writing",
          )!;
      assert.equal(
        task("de.c.012", "revision1-koennen-infinitiv").solution,
        "Ich kann schwimmen.",
      );
      assert.equal(
        task("de.c.031", "revision1-relative-repair").solution,
        "Das ist der Mann, den ich sehe.",
      );
      assert.notEqual(
        assess(
          task("de.c.031", "revision1-relative-repair"),
          "den ich sehe.",
          "de",
        ).verdict,
        "pass",
      );
      for (const item of activePracticeTasks(
        current.units.find((unit) => unit.id === "de.c.069")!,
      ))
        if (item.id.includes("revision1"))
          assert.equal(item.answerPolicy, "open");
    }
  }
  assert.equal(report.preservedUnits, 280);
  assert.equal(report.preservedTasks, 5042);
  assert.equal(report.retiredTasks, 506);
  assert.equal(report.newTasks, 220);
  assert.equal(report.activeTasks, 4756 + 168);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ ...report, output }));
}
