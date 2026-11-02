import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONTENT_CHECKS,
  CONTENT_TASK_CHECKS,
  approvedReviewDocuments,
  contentReviewBundle,
  contentReviewFindings,
  reviewCells,
  reviewProblems,
  unitContentDigest,
  type UnitReviewForm,
} from "../shared/learning-core/src/automaticity/content-review";
import {
  activePracticeTasks,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import { unitDigest } from "./lib/automaticity-release-reviews";
import * as evidence from "./lib/curriculum-review-evidence";
import type { CoverageCell } from "./lib/automaticity-release-reviews";
import { prepareCurriculumReviewImport } from "./lib/reviewed-curriculum";

// The review page reads the curriculum each app serves.
const root = resolve(import.meta.dir, "..");
const packs = new Map(
  (["en", "de"] as const).map((language) => [
    language,
    JSON.parse(
      readFileSync(
        resolve(
          root,
          language === "en"
            ? "Apps/English/English-Automaticity"
            : "Apps/Deutsch/Deutsch-Automaticity",
          `apps/web/public/learning-core/curriculum-${language}.json`,
        ),
        "utf8",
      ),
    ) as CurriculumPack,
  ]),
);
const coverage = JSON.parse(
  readFileSync(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
) as { cells: CoverageCell[] };
const confirmed = (
  pack: CurriculumPack,
  unitIndex: number,
  reviewerId = "Maria Keller",
): UnitReviewForm => {
  const unit = pack.units[unitIndex]!;
  return {
    reviewerId,
    role: "Language teacher (independent review)",
    reviewedAt: "2026-11-02T18:00:00.000Z",
    checks: Object.fromEntries(CONTENT_CHECKS.map((check) => [check, true])),
    note: "Rule, examples and contrasts checked against a standard grammar.",
    tasks: Object.fromEntries(
      activePracticeTasks(unit).map((task) => [
        task.id,
        {
          checks: Object.fromEntries(
            CONTENT_TASK_CHECKS.map((check) => [check, true]),
          ),
          note: "Prompt, target and every accepted answer checked.",
        },
      ]),
    ),
  };
};

test("the review page uses the release review's checks, digest and cells", async () => {
  expect([...CONTENT_CHECKS]).toEqual([...evidence.CONTENT_CHECKS]);
  expect([...CONTENT_TASK_CHECKS]).toEqual([...evidence.CONTENT_TASK_CHECKS]);
  for (const pack of packs.values())
    for (const unit of pack.units) {
      expect(`${unit.id} ${await unitContentDigest(unit)}`).toBe(
        `${unit.id} ${unitDigest(unit)}`,
      );
      const cells = coverage.cells.filter(
        (cell) =>
          cell.language === pack.language && cell.constructionId === unit.id,
      );
      expect(
        reviewCells(unit)
          .map(
            (cell) =>
              `${cell.stage}:${cell.modality}=${cell.tasks
                .map((t) => t.id)
                .sort()
                .join(",")}`,
          )
          .sort(),
      ).toEqual(
        cells
          .map(
            (cell) =>
              `${cell.stage}:${cell.modality}=${[...cell.taskIds].sort().join(",")}`,
          )
          .sort(),
      );
    }
});

test("a complete review from the page is accepted by the import as is", async () => {
  for (const pack of packs.values()) {
    const unit = pack.units[0]!;
    const documents = await approvedReviewDocuments(
      pack,
      unit,
      confirmed(pack, 0),
      "2026-11-02T19:00:00.000Z",
    );
    const prepared = prepareCurriculumReviewImport(
      JSON.parse(JSON.stringify(contentReviewBundle(documents))),
      packs,
      coverage.cells,
      [],
      "artifacts/curriculum-review-import/page-test",
      "2026-11-02T19:00:00.000Z",
    );
    expect(prepared.reviews).toHaveLength(reviewCells(unit).length);
  }
});

test("an incomplete review approves nothing and becomes findings for the owner", async () => {
  const pack = packs.get("de")!;
  const unit = pack.units[0]!;
  const form = confirmed(pack, 0);
  const [first] = activePracticeTasks(unit);
  form.tasks[first!.id] = {
    checks: {
      ...form.tasks[first!.id]!.checks,
      acceptedAnswersAccurate: false,
    },
    note: "„Ich bin es“ fehlt als richtige Antwort.",
  };
  expect(reviewProblems(unit, form)).toEqual([
    `${first!.id}:acceptedAnswersAccurate`,
  ]);
  await expect(approvedReviewDocuments(pack, unit, form)).rejects.toThrow(
    "not complete",
  );
  expect(contentReviewFindings(pack, unit, form).tasks).toEqual([
    {
      taskId: first!.id,
      prompt: first!.prompt,
      unconfirmed: ["acceptedAnswersAccurate"],
      note: "„Ich bin es“ fehlt als richtige Antwort.",
    },
  ]);
  expect(reviewProblems(unit, confirmed(pack, 0, "ChatGPT review"))).toEqual([
    "reviewer-not-human",
  ]);
});
