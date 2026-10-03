import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  prepareCurriculumReviewImport,
  applyCurriculumReviews,
} from "./lib/reviewed-curriculum";
import { createContentReviewPacket } from "./lib/curriculum-review-packets";
import {
  unitDigest,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import type {
  CurriculumPack,
  PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import { loadStudyProbeCatalog } from "./lib/study-probe-catalog";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
// All approvals in this file are synthetic transport fixtures in isolated roots.
const now = "2026-09-05T20:00:00.000Z",
  folder = "artifacts/curriculum-review-import/test";
function fixture(privateProbe = false) {
  const task: PracticeTask = {
    id: "en.c.001.retrieve.1.writing",
    version: "1",
    constructionId: "en.c.001",
    familyId: "G01",
    itemFamily: "one",
    contextId: "one",
    rubricVersion: "1",
    stage: "retrieve",
    modality: "writing",
    partition: "practice",
    transferCondition: "none",
    contentReview: "authored",
    prompt: "Give a test response",
    answerPolicy: "open",
    responseKind: "free_output",
    acceptedAnswers: [],
    hints: [],
    solution: null,
    normalisation: {
      nfc: true,
      whitespace: true,
      terminalFullStop: true,
      preserveCase: true,
    },
    sourceId: "test",
  };
  const pack: CurriculumPack = {
    language: "en",
    version: "1",
    mappingVersion: "1",
    units: [
      {
        id: "en.c.001",
        language: "en",
        title: "Test",
        level: "A1",
        familyIds: ["G01"],
        prerequisites: [],
        lessonAlias: "test",
        rule: "test",
        examples: [],
        commonError: "test",
        review: "authored",
        sources: [],
        tasks: [
          task,
          { ...task, id: "en.c.001.produce.1.writing", stage: "produce" },
        ],
      },
    ],
  };
  if (privateProbe) {
    pack.units[0]!.tasks = [
      {
        ...task,
        id: "private-probe",
        partition: "evaluation",
        itemFamily: "private-unseen",
      },
    ];
  }
  const packs = new Map([["en", pack]]),
    unit = pack.units[0]!;
  const cells: CoverageCell[] = unit.tasks.map((task) => ({
    language: "en",
    constructionId: unit.id,
    contentVersion: "1",
    mappingVersion: "1",
    stage: task.stage,
    modality: task.modality,
    taskIds: [task.id],
    humanReview: "pending",
    evaluator: "human-review-required",
    releaseEligible: false,
  }));
  const packet = createContentReviewPacket(pack, unit),
    draft = packet.reviewDrafts[0]!;
  const reviewed = (raw: typeof draft.contentEvidenceDraft) => ({
    ...structuredClone(raw),
    provenance: "human_review",
    reviewerId: "Reviewer A",
    role: "Language teacher",
    reviewedAt: now,
    decision: "approved",
    note: "Synthetic transport check in an isolated test root only.",
    checks: raw.checks
      ? Object.fromEntries(Object.keys(raw.checks).map((key) => [key, true]))
      : null,
    taskReviews: raw.taskReviews.map((row) => ({
      ...row,
      note: "Synthetic task judgment for engineering checks only.",
      checks: Object.fromEntries(
        Object.keys(row.checks).map((key) => [key, true]),
      ),
    })),
  });
  const content = reviewed(draft.contentEvidenceDraft),
    evaluation = reviewed(draft.manualEvaluatorEvidenceDraft);
  evaluation.evaluator = {
    ...draft.manualEvaluatorEvidenceDraft.evaluator!,
    id: "reviewer-procedure",
    version: "1",
  };
  return {
    packs,
    cells,
    pack,
    unit,
    content,
    evaluation,
    input: {
      schemaVersion: 1,
      contentReviews: [content],
      evaluatorReviews: [evaluation],
    },
  };
}
async function materialize(
  input: ReturnType<typeof prepareCurriculumReviewImport>,
) {
  const parent = resolve(import.meta.dir, "../artifacts");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(resolve(parent, "review-compiler-test-"));
  for (const file of input.files) {
    await mkdir(dirname(resolve(root, file.path)), { recursive: true });
    await writeFile(resolve(root, file.path), file.contents);
  }
  return root;
}
test("completed cell reviews stage exact flags and evaluator coverage without changing source or other cells", async () => {
  const f = fixture(),
    before = JSON.stringify(f.pack),
    digest = unitDigest(f.unit);
  const prepared = prepareCurriculumReviewImport(
      f.input,
      f.packs,
      f.cells,
      [],
      folder,
      now,
    ),
    root = await materialize(prepared);
  const applied = await applyCurriculumReviews(
    root,
    f.packs,
    f.cells,
    prepared.reviews,
    now,
  );
  expect(applied.reviewedCells).toBe(1);
  expect(applied.evaluatorApprovedCells).toBe(1);
  expect(applied.cells[1]!.releaseEligible).toBe(false);
  expect(JSON.stringify(f.pack)).toBe(before);
  expect(unitDigest(applied.packs.get("en")!.units[0]!)).toBe(digest);
  const manifest = buildHumanReviewManifest(
    applied.packs.get("en")!,
    prepared.reviews,
  );
  expect(manifest.scopes).toHaveLength(1);
  expect(manifest.scopes[0]!.reviewerName).toBe("Reviewer A");
  expect(manifest.scopes[0]!.reviewId).toBe(prepared.reviews[0]!.id);
});
test("content review alone cannot approve an evaluator; empty ledgers reproduce authored catalogs", async () => {
  const f = fixture(),
    prepared = prepareCurriculumReviewImport(
      { ...f.input, evaluatorReviews: [] },
      f.packs,
      f.cells,
      [],
      folder,
      now,
    ),
    root = await materialize(prepared);
  const applied = await applyCurriculumReviews(
    root,
    f.packs,
    f.cells,
    prepared.reviews,
    now,
  );
  expect(applied.reviewedCells).toBe(1);
  expect(applied.evaluatorApprovedCells).toBe(0);
  expect(
    buildHumanReviewManifest(applied.packs.get("en")!, prepared.reviews).scopes,
  ).toHaveLength(0);
  expect(
    (await applyCurriculumReviews(root, f.packs, f.cells, [], now)).packs.get(
      "en",
    ),
  ).toEqual(f.pack);
});
test("blank, incomplete, automated, duplicated and stale human claims are rejected before staging", () => {
  const f = fixture();
  const changes = [
    (x: typeof f.input) => {
      x.contentReviews[0]!.reviewerId = "";
    },
    (x: typeof f.input) => {
      x.contentReviews[0]!.reviewerId = "Codex";
    },
    (x: typeof f.input) => {
      x.contentReviews[0]!.reviewedAt = "2099-01-01T00:00:00Z";
    },
    (x: typeof f.input) => {
      x.contentReviews[0]!.taskReviews = [];
    },
    (x: typeof f.input) => {
      x.contentReviews[0]!.scope.unitSha256 = "a".repeat(64);
    },
    (x: typeof f.input) => {
      x.contentReviews.push(x.contentReviews[0]!);
    },
    (x: typeof f.input) => {
      x.evaluatorReviews.push(x.evaluatorReviews[0]!);
    },
    (x: typeof f.input) => {
      x.evaluatorReviews[0]!.evaluator!.kind = "rule";
    },
  ];
  for (const change of changes) {
    const input = structuredClone(f.input);
    change(input);
    expect(() =>
      prepareCurriculumReviewImport(input, f.packs, f.cells, [], folder, now),
    ).toThrow();
  }
});
test("previous records are immutable and a tampered evidence file or changed prompt prevents application", async () => {
  const f = fixture(),
    prepared = prepareCurriculumReviewImport(
      f.input,
      f.packs,
      f.cells,
      [],
      folder,
      now,
    ),
    root = await materialize(prepared);
  expect(() =>
    prepareCurriculumReviewImport(
      f.input,
      f.packs,
      f.cells,
      prepared.reviews,
      folder,
      now,
    ),
  ).toThrow(/already exists/);
  f.unit.rule += " changed";
  await expect(
    applyCurriculumReviews(root, f.packs, f.cells, prepared.reviews, now),
  ).rejects.toThrow(/Stale/);
  f.unit.rule = "test";
  await writeFile(resolve(root, prepared.files[0]!.path), "{}");
  await expect(
    applyCurriculumReviews(root, f.packs, f.cells, prepared.reviews, now),
  ).rejects.toThrow(/hash mismatch/);
});
test("private study probes require recorded content and evaluator review and cannot reuse shipped practice", async () => {
  const f = fixture(true),
    prepared = prepareCurriculumReviewImport(
      f.input,
      f.packs,
      f.cells,
      [],
      folder,
      now,
    ),
    root = await materialize(prepared),
    applied = await applyCurriculumReviews(
      root,
      f.packs,
      f.cells,
      prepared.reviews,
      now,
    );
  const catalog = {
    schemaVersion: 1,
    packs: [...applied.packs.values()],
    reviews: prepared.reviews,
  };
  const result = await loadStudyProbeCatalog(
    root,
    catalog,
    [fixture().pack],
    now,
  );
  expect(result.reviewedCells).toBe(1);
  expect(result.packs[0]!.units[0]!.tasks).toHaveLength(3);
  await expect(
    loadStudyProbeCatalog(
      root,
      { ...catalog, reviews: [] },
      [fixture().pack],
      now,
    ),
  ).rejects.toThrow();
  await expect(
    loadStudyProbeCatalog(root, catalog, catalog.packs, now),
  ).rejects.toThrow(/reuses practice/);
  const changed = structuredClone(catalog);
  changed.packs[0]!.units[0]!.tasks[0]!.prompt += " edited";
  await expect(loadStudyProbeCatalog(root, changed, [], now)).rejects.toThrow(
    /Stale/,
  );
});
