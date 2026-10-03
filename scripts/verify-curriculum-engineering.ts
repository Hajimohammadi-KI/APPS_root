import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import {
  activePracticeTasks,
  validateCurriculum,
} from "../shared/learning-core/src/automaticity/curriculum";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import {
  parseAutomaticityEvent,
  type AttemptEvent,
} from "../shared/learning-core/src/automaticity/contracts";
import { sha256, type CoverageCell } from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, ".."),
  now = new Date().toISOString(),
  runtime = await loadRepresentativeRuntime(root),
  output = resolve(
    root,
    `artifacts/curriculum-engineering/${now.replace(/[:.]/g, "-")}`,
  );
const coverage = JSON.parse(
  await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
) as { cells: CoverageCell[] };
const cases = [];
let checks = 0;
for (const pack of runtime.packs) {
  assert.deepEqual(validateCurriculum(pack), []);
  checks++;
  const families = new Set(pack.units.flatMap((unit) => unit.familyIds));
  assert.equal(families.size, 21);
  checks++;
  for (const unit of pack.units)
    for (const task of activePracticeTasks(unit)) {
      const make = (text: string): AttemptEvent => ({
        version: 2,
        type: "attempt",
        id: `test-${task.id}`,
        language: pack.language,
        at: now,
        task: { ...task, definitionSha256: sha256(JSON.stringify(task)) },
        response: {
          text,
          sha256: sha256(text),
          originalTranscriptSha256: null,
          transcriptEdited: false,
        },
        timing: {
          startedAt: now,
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
      });
      assert.ok(
        coverage.cells.some(
          (cell) =>
            cell.language === pack.language &&
            cell.constructionId === unit.id &&
            cell.stage === task.stage &&
            cell.modality === task.modality &&
            cell.taskIds.includes(task.id),
        ),
      );
      checks++;
      for (const response of ["", "SYNTHETIC_UNRELATED_794826"]) {
        const attempt = make(response);
        parseAutomaticityEvent(attempt);
        assert.notEqual(
          assessControlledTask(attempt, task, now, `check-${task.id}`).verdict,
          "pass",
        );
        checks++;
      }
      const bad = make(task.acceptedAnswers[0] ?? "Synthetic response");
      bad.task.rubricVersion += "-stale";
      assert.equal(
        assessControlledTask(bad, task, now, `stale-${task.id}`).verdict,
        "not_assessed",
      );
      checks++;
      if (task.modality === "speaking") {
        assert.equal(
          assessControlledTask(
            make(task.acceptedAnswers[0] ?? "Synthetic transcript"),
            task,
            now,
            `spoken-${task.id}`,
          ).verdict,
          "not_assessed",
        );
        checks++;
      } else if (task.answerPolicy === "closed")
        for (const answer of task.acceptedAnswers) {
          const result = assessControlledTask(
            make(answer),
            task,
            now,
            `accepted-${task.id}`,
          );
          assert.equal(result.verdict, "pass", task.id);
          assert.equal(result.evaluator.scopeApproved, false);
          checks += 2;
        }
      cases.push({
        language: pack.language,
        constructionId: unit.id,
        taskId: task.id,
        definitionSha256: sha256(JSON.stringify(task)),
        stage: task.stage,
        modality: task.modality,
        status: "passed",
      });
    }
}
for (const cell of coverage.cells) {
  assert.ok(
    cases.some(
      (row) =>
        row.language === cell.language &&
        row.constructionId === cell.constructionId &&
        row.stage === cell.stage &&
        row.modality === cell.modality,
    ),
  );
  checks++;
}
const report = {
  at: now,
  status: "passed",
  scope:
    "All active curriculum tasks: schema, cell route, closed-answer transport, irrelevant/empty answers, stale identities and speech abstention. This is not independent language review or proof of grammar accuracy.",
  units: runtime.packs.reduce((n, p) => n + p.units.length, 0),
  cells: coverage.cells.length,
  activeTasks: cases.length,
  checks,
  packHashes: runtime.packHashes,
  sourceHashes: runtime.sourceHashes,
  cases,
};
await mkdir(output, { recursive: true });
await writeFile(
  resolve(output, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    output,
    status: report.status,
    units: report.units,
    cells: report.cells,
    activeTasks: report.activeTasks,
    checks,
  }),
);
