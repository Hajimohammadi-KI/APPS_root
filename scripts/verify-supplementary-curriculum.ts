import { resolveRepresentativeTask } from "../shared/learning-core/src/automaticity/representative-tasks";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { supplementaryGrammar } from "../shared/learning-core/content/supplementary-grammar";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import { sha256 } from "../shared/learning-core/src/automaticity/backup";
import type {
  AttemptEvent,
  Language,
} from "../shared/learning-core/src/automaticity/contracts";
import {
  validateCurriculum,
  type CurriculumPack,
  type PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
const root = resolve(import.meta.dir, "..");
const output = resolve(
  root,
  `artifacts/supplementary-curriculum/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const cases: { id: string; passed: boolean; tasks?: number }[] = [];
let status = "running",
  error: string | undefined;
async function assess(task: PracticeTask, text: string, language: Language) {
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "synthetic-attempt",
    language,
    at: "2026-09-05T11:00:00.000Z",
    task,
    response: {
      text,
      sha256: await sha256(text),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: "2026-09-05T10:59:00.000Z",
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
  return assessControlledTask(
    attempt,
    task,
    "2026-09-05T11:00:01.000Z",
    "synthetic-assessment",
  );
}
try {
  for (const language of ["en", "de"] as const) {
    const app =
      language === "en"
        ? "Apps/English/English-Automaticity"
        : "Apps/Deutsch-Automaticity";
    const path = `${app}/apps/web/public/learning-core/curriculum-${language}.json`;
    const pack = JSON.parse(
      await readFile(resolve(root, path), "utf8"),
    ) as CurriculumPack;
    assert.deepEqual(validateCurriculum(pack), []);
    const baselinePath = Bun.argv
      .find((arg) => arg.startsWith("--baseline="))
      ?.slice(11);
    let baselineText: string;
    if (baselinePath) {
      const manifest = JSON.parse(
        await readFile(resolve(root, baselinePath, "manifest.json"), "utf8"),
      ) as { files: { language: string; sha256: string }[] };
      const bytes = await readFile(
        resolve(root, baselinePath, `${language}.json`),
      );
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        manifest.files.find((row) => row.language === language)?.sha256,
      );
      baselineText = bytes.toString("utf8");
    } else
      baselineText = execFileSync("git", ["show", `65696fb:${path}`], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 15_000_000,
      });
    const before = JSON.parse(baselineText) as CurriculumPack;
    for (const original of before.units) {
      const current = pack.units.find((unit) => unit.id === original.id)!;
      assert(current);
      const ids = new Set(original.tasks.map((task) => task.id)),
        { retiredTasks, ...content } = current;
      assert.deepEqual(
        { ...content, tasks: current.tasks.filter((task) => ids.has(task.id)) },
        original,
        `Original lesson/task identity changed: ${original.id}`,
      );
      for (const task of current.tasks.filter((task) => !ids.has(task.id)))
        assert(
          retiredTasks?.some((row) => row.replacementTaskId === task.id) ||
            (task.constructionAssessment && resolveRepresentativeTask(task)),
          `Undeclared replacement ${task.id}`,
        );
    }
    cases.push({
      id: `${language}-original-lesson-and-draft-identities`,
      passed: true,
    });
    for (const draft of supplementaryGrammar.filter((row) =>
      row.id.startsWith(language + "."),
    )) {
      const unit = pack.units.find((row) => row.id === draft.id);
      assert(unit, `Missing added target ${draft.id}`);
      assert.equal(unit.review, "authored");
      assert(unit.sources.length > 0);
      const writtenOnly = ["en.c.124", "de.c.156"].includes(unit.id);
      assert.equal(unit.tasks.length, writtenOnly ? 7 : 14);
      for (const stage of [
        "notice",
        "retrieve",
        "vary",
        "produce",
        "repair",
        "transfer",
        "retain",
      ]) {
        for (const modality of writtenOnly
          ? ["writing"]
          : ["writing", "speaking"]) {
          const task: PracticeTask | undefined = unit.tasks.find(
            (row) => row.stage === stage && row.modality === modality,
          );
          assert(task);
          assert(task.prompt.length > 15);
          assert.equal(task.contentReview, "authored");
          if (task.answerPolicy === "closed") {
            for (const answer of task.acceptedAnswers) {
              const result = await assess(task, answer, language);
              assert.equal(result.verdict, "pass");
              assert.equal(result.evaluator.scopeApproved, false);
            }
            assert.notEqual(
              (
                await assess(
                  task,
                  "A fluent sentence about an unrelated situation.",
                  language,
                )
              ).verdict,
              "pass",
            );
          } else
            assert.equal(
              (await assess(task, draft.example, language)).verdict,
              "not_assessed",
            );
        }
      }
      cases.push({ id: draft.id, passed: true, tasks: unit.tasks.length });
    }
    if (language === "en") {
      const roleTask = pack.units
        .find((row) => row.id === "en.c.119")!
        .tasks.find(
          (task) => task.stage === "retrieve" && task.modality === "writing",
        )!;
      assert.notEqual(
        (await assess(roleTask, "Who called Anna?", language)).verdict,
        "pass",
      );
      const agreement = pack.units
        .find((row) => row.id === "en.c.118")!
        .tasks.find(
          (task) => task.stage === "retrieve" && task.modality === "writing",
        )!;
      assert.notEqual(
        (
          await assess(
            agreement,
            "The box of spare cables are heavy.",
            language,
          )
        ).verdict,
        "pass",
      );
    } else {
      const roles = pack.units
        .find((row) => row.id === "de.c.150")!
        .tasks.find(
          (task) => task.stage === "retrieve" && task.modality === "writing",
        )!;
      assert.notEqual(
        (
          await assess(
            roles,
            "Das ist die Kollegin, dessen Fahrrad draußen steht.",
            language,
          )
        ).verdict,
        "pass",
      );
      assert.notEqual(
        (await assess(roles, roles.acceptedAnswers[0]!.toLowerCase(), language))
          .verdict,
        "pass",
      );
    }
    cases.push({
      id: `${language}-wrong-role-and-form-negatives`,
      passed: true,
    });
  }
  status = "passed";
} catch (caught) {
  status = "failed";
  error = String(caught);
  process.exitCode = 1;
} finally {
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        status,
        cases,
        error,
        scope:
          "Authored tasks and conservative software checks; no human or model qualification",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ status, cases: cases.length, error, output }));
}
