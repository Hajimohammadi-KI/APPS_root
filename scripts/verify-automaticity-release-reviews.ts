import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  parseReviewLedger,
  sha256,
  unitDigest,
  validateReleaseReviews,
  type CellReview,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import type { CurriculumPack } from "../shared/learning-core/src/automaticity/curriculum";
import { createReviewEvidenceDraft } from "./lib/curriculum-review-evidence";
import { isRecord } from "../shared/learning-core/src/automaticity/contracts";
import type {
  BenchmarkCase,
  CandidatePrediction,
} from "../shared/learning-core/src/automaticity/qualification";
const root = resolve(import.meta.dir, ".."),
  output = resolve(
    root,
    `artifacts/coverage-review-gate/${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
await mkdir(output, { recursive: true });
const proof =
  "Synthetic reviewer evidence for automated negative and positive fixtures. Not human curriculum approval.\n";
await writeFile(resolve(output, "synthetic-review.txt"), proof);
const evidence = {
  path: relative(root, resolve(output, "synthetic-review.txt")),
  sha256: sha256(proof),
};
const rawPack = JSON.parse(
  await readFile(
    resolve(
      root,
      "Apps/English/English-Automaticity/apps/web/public/learning-core/curriculum-en.json",
    ),
    "utf8",
  ),
) as CurriculumPack;
const ledgerBefore = await readFile(
  resolve(root, "docs/automaticity-release-reviews.json"),
  "utf8",
);
const rawCoverage = JSON.parse(
  await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
) as { cells: CoverageCell[] };
const selected = rawCoverage.cells.find(
  (cell) =>
    cell.language === "en" &&
    cell.stage === "retrieve" &&
    cell.modality === "writing" && cell.taskIds.length > 1,
)!;
let fixtureId = 0;
async function fixture() {
  const pack = structuredClone(rawPack),
    cell = structuredClone(selected),
    unit = pack.units.find((unit) => unit.id === cell.constructionId)!;
  unit.review = "human_reviewed";
  for (const task of unit.tasks) task.contentReview = "human_reviewed";
  cell.humanReview = "complete";
  cell.releaseEligible = true;
  const review: CellReview = {
    id: "synthetic-cell-review",
    language: cell.language,
    constructionId: cell.constructionId,
    stage: cell.stage,
    modality: cell.modality,
    contentVersion: pack.version,
    mappingVersion: pack.mappingVersion,
    unitSha256: unitDigest(unit),
    contentReview: {
      reviewerId: "reviewer-a",
      role: "Synthetic content reviewer",
      reviewedAt: "2026-09-04T09:00:00Z",
      decision: "approved",
      evidence,
    },
    evaluators: [
      {
        id: "synthetic-manual-review",
        version: "1",
        kind: "human",
        taskIds: [...cell.taskIds],
        rubricVersions: [
          ...new Set(unit.tasks.map((task) => task.rubricVersion)),
        ],
        review: {
          reviewerId: "reviewer-b",
          role: "Synthetic assessment reviewer",
          reviewedAt: "2026-09-04T10:00:00Z",
          decision: "approved",
          evidence,
        },
        benchmarkInput: null,
      },
    ],
  };
  const result = { pack, cell, unit, review };
  const scopedTasks = unit.tasks.filter((task) =>
    cell.taskIds.includes(task.id),
  );
  // Positive fixtures simulate the record shape; these identities are not real people.
  for (const approval of [null, ...review.evaluators]) {
    const reviewer = approval?.review ?? review.contentReview;
    const draft = createReviewEvidenceDraft(review, scopedTasks, approval);
    const completed = {
      ...draft,
      ...reviewer,
      provenance: "human_review",
      note: "Synthetic schema fixture only; never use as actual curriculum approval.",
      checks:
        draft.checks &&
        Object.fromEntries(Object.keys(draft.checks).map((key) => [key, true])),
      taskReviews: draft.taskReviews.map((row) => ({
        ...row,
        checks: Object.fromEntries(
          Object.keys(row.checks).map((key) => [key, true]),
        ),
        note: "Synthetic task judgment exercises exact task and rubric binding.",
      })),
    };
    const file = resolve(output, `schema-fixture-${fixtureId++}.json`);
    const bytes = JSON.stringify(completed);
    await writeFile(file, bytes);
    reviewer.evidence = { path: relative(root, file), sha256: sha256(bytes) };
  }
  return result;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
const report: {
  createdAt: string;
  status: string;
  scope: string;
  cases: { name: string; status: string }[];
  error?: string;
} = {
  createdAt: new Date().toISOString(),
  status: "running",
  scope:
    "Synthetic local fixtures only. No real content reviews, evaluator approvals, learning results or runtime settings changed.",
  cases: [],
};
const pass = (name: string) => {
  report.cases.push({ name, status: "passed" });
  console.log(`Passed: ${name}`);
};
const check = (f: Fixture) =>
  validateReleaseReviews(
    root,
    [f.cell],
    new Map([["en", f.pack]]),
    parseReviewLedger({ schemaVersion: 1, reviews: [f.review] }),
    "2026-09-05T00:00:00Z",
  );
async function rejected(
  name: string,
  change: (f: Fixture) => unknown | Promise<unknown>,
  pattern: RegExp,
) {
  const f = await fixture();
  await change(f);
  await assert.rejects(() => check(f), pattern);
  pass(name);
}
const record = (value: unknown) => {
  assert(isRecord(value));
  return value;
};
async function alterEvidence(
  f: Fixture,
  kind: "content" | "evaluator",
  change: (value: Record<string, unknown>) => void,
) {
  const reviewer =
    kind === "content"
      ? f.review.contentReview
      : f.review.evaluators[0]!.review;
  const value = record(
    JSON.parse(await readFile(resolve(root, reviewer.evidence.path), "utf8")),
  );
  change(value);
  const bytes = JSON.stringify(value),
    file = resolve(output, `altered-schema-fixture-${fixtureId++}.json`);
  await writeFile(file, bytes);
  reviewer.evidence = { path: relative(root, file), sha256: sha256(bytes) };
}
const firstJudgment = (value: Record<string, unknown>) => {
  assert(Array.isArray(value.taskReviews));
  return record(value.taskReviews[0]);
};
try {
  const f = await fixture();
  assert.deepEqual(await check(f), {
    reviewedCells: 1,
    evaluatorApprovedCells: 1,
  });
  pass("complete-manual-evaluator-scope-with-pinned-evidence");
  await rejected(
    "nonempty-note-is-not-content-review",
    (f) => {
      f.review.contentReview.evidence = evidence;
    },
    /Structured human review/,
  );
  await rejected(
    "nonempty-note-is-not-evaluator-review",
    (f) => {
      f.review.evaluators[0]!.review.evidence = evidence;
    },
    /Structured human review/,
  );
  await rejected(
    "generated-draft-is-not-human-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        value.provenance = null;
      }),
    /Structured human review/,
  );
  await rejected(
    "review-file-identity-must-match-ledger",
    (f) =>
      alterEvidence(f, "content", (value) => {
        value.reviewerId = "someone-else";
      }),
    /identity does not match/,
  );
  await rejected(
    "review-file-date-must-match-ledger",
    (f) =>
      alterEvidence(f, "content", (value) => {
        value.reviewedAt = "2026-09-04T08:00:00Z";
      }),
    /identity does not match/,
  );
  await rejected(
    "ai-label-cannot-claim-human-review",
    async (f) => {
      f.review.contentReview.reviewerId = "Codex";
      await alterEvidence(f, "content", (value) => {
        value.reviewerId = "Codex";
      });
    },
    /recorded human reviewer/,
  );
  await rejected(
    "another-cell-review-cannot-be-reused",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(value.scope).modality = "speaking";
      }),
    /exact cell and content hash/,
  );
  await rejected(
    "stale-artifact-content-hash",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(value.scope).unitSha256 = "0".repeat(64);
      }),
    /exact cell and content hash/,
  );
  await rejected(
    "unresolved-construction-meaning",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(value.checks).meaningAccurate = false;
      }),
    /unresolved construction checks/,
  );
  await rejected(
    "missing-task-judgments",
    (f) =>
      alterEvidence(f, "content", (value) => {
        value.taskReviews = [];
      }),
    /every scoped task exactly once/,
  );
  await rejected(
    "duplicate-task-judgment",
    (f) =>
      alterEvidence(f, "content", (value) => {
        assert(
          Array.isArray(value.taskReviews) && value.taskReviews.length > 1,
        );
        value.taskReviews[1] = value.taskReviews[0];
      }),
    /Duplicate or invalid reviewed task/,
  );
  await rejected(
    "stale-task-version-in-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        firstJudgment(value).taskVersion = "older";
      }),
    /Stale or unrelated task identity/,
  );
  await rejected(
    "stale-task-rubric-in-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        firstJudgment(value).rubricVersion = "older";
      }),
    /Stale or unrelated task identity/,
  );
  await rejected(
    "unresolved-target-elicitation",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(firstJudgment(value).checks).targetElicited = false;
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "copying-cannot-pass-as-reviewed-retrieval",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(firstJudgment(value).checks).stageAppropriate = false;
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "incorrect-accepted-answers-block-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(firstJudgment(value).checks).acceptedAnswersAccurate = false;
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "unsuitable-modality-blocks-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        record(firstJudgment(value).checks).modalityAppropriate = false;
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "empty-task-findings-block-review",
    (f) =>
      alterEvidence(f, "content", (value) => {
        firstJudgment(value).note = "OK";
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "evaluator-review-is-pinned-to-version",
    (f) =>
      alterEvidence(f, "evaluator", (value) => {
        record(value.evaluator).version = "older";
      }),
    /does not cover this evaluator/,
  );
  await rejected(
    "evaluator-review-cannot-borrow-benchmark",
    (f) =>
      alterEvidence(f, "evaluator", (value) => {
        record(value.evaluator).benchmarkInput = {
          path: "unrelated.json",
          sha256: "0".repeat(64),
        };
      }),
    /does not cover this evaluator/,
  );
  await rejected(
    "unresolved-assessment-meaning-check",
    (f) =>
      alterEvidence(f, "evaluator", (value) => {
        record(firstJudgment(value).checks).meaningChecked = false;
      }),
    /Unresolved task review judgments/,
  );
  await rejected(
    "unresolved-assessment-abstention",
    (f) =>
      alterEvidence(f, "evaluator", (value) => {
        record(firstJudgment(value).checks).abstentionHandled = false;
      }),
    /Unresolved task review judgments/,
  );
  await assert.rejects(
    () => validateReleaseReviews(root, [f.cell], new Map([["en", f.pack]]), []),
    /Missing recorded human review/,
  );
  pass("review-flags-alone-cannot-qualify");
  await rejected(
    "invented-evaluator-mapping",
    (f) => (f.cell.evaluator = "invented-approved-evaluator"),
    /invented evaluator/,
  );
  await rejected(
    "release-with-pending-review",
    (f) => (f.cell.humanReview = "pending"),
    /without completed content review/,
  );
  await rejected(
    "source-is-still-authored",
    (f) => (f.unit.review = "authored"),
    /Review absent from content pack/,
  );
  await rejected(
    "same-version-prompt-edit",
    (f) => (f.unit.tasks[0]!.prompt += " changed"),
    /Stale reviewed content/,
  );
  await rejected(
    "same-version-answer-edit",
    (f) =>
      f.unit.tasks
        .find((t) => t.acceptedAnswers.length)!
        .acceptedAnswers.push("different answer"),
    /Stale reviewed content/,
  );
  await rejected(
    "same-version-prerequisite-edit",
    (f) => f.unit.prerequisites.push("changed"),
    /Stale reviewed content/,
  );
  await rejected(
    "stale-review-version",
    (f) => (f.review.contentVersion = "previous"),
    /Stale reviewed content/,
  );
  await rejected(
    "future-dated-review",
    (f) => (f.review.contentReview.reviewedAt = "2099-01-01T00:00:00Z"),
    /dated, approved human review/,
  );
  await rejected(
    "missing-reviewer",
    (f) => (f.review.contentReview.reviewerId = ""),
    /dated, approved human review/,
  );
  await rejected(
    "tampered-evidence-file",
    (f) =>
      (f.review.contentReview.evidence = {
        ...evidence,
        sha256: "0".repeat(64),
      }),
    /hash mismatch/,
  );
  await rejected(
    "approval-predates-content-review",
    (f) => (f.review.evaluators[0]!.review.reviewedAt = "2026-09-03T00:00:00Z"),
    /predates content review/,
  );
  await rejected(
    "missing-task-approval",
    (f) => f.review.evaluators[0]!.taskIds.pop(),
    /Invalid evaluator approval|missing for tasks|does not cover this evaluator/,
  );
  await rejected(
    "missing-rubric-approval",
    (f) => (f.review.evaluators[0]!.rubricVersions = []),
    /rubric not approved/,
  );
  await rejected(
    "duplicate-task-approval",
    (f) => f.review.evaluators.push(structuredClone(f.review.evaluators[0]!)),
    /duplicate evaluator task/,
  );
  await rejected(
    "unrelated-task-approval",
    (f) => f.review.evaluators[0]!.taskIds.push("unknown-task"),
    /Orphan or duplicate evaluator task/,
  );
  await rejected(
    "automated-evaluator-without-benchmark",
    (f) => (f.review.evaluators[0]!.kind = "transformer"),
    /lacks benchmark evidence/,
  );
  await rejected(
    "self-approved-model",
    (f) => {
      f.review.evaluators[0]!.kind = "rule";
      f.review.evaluators[0]!.review.reviewerId = f.review.evaluators[0]!.id;
    },
    /cannot approve itself/,
  );
  assert.throws(
    () =>
      parseReviewLedger({ schemaVersion: 1, reviews: [f.review, f.review] }),
    /Duplicate curriculum review/,
  );
  pass("duplicate-review-ledger-entry");
  const categories: BenchmarkCase["category"][] = [
    "correct_alternative",
    "grammar_error",
    "ambiguous",
    "off_target",
    "asr_corruption",
  ];
  const cases: BenchmarkCase[] = categories.flatMap((category) =>
    Array.from({ length: 20 }, (_, index) => ({
      id: `${category}-${index}`,
      language: "en" as const,
      modality: "writing" as const,
      contentVersion: f.pack.version,
      sourceId: "synthetic-test",
      license: "synthetic-test-only",
      constructionId: f.unit.id,
      rubricVersion: f.unit.tasks[0]!.rubricVersion,
      partition: "final" as const,
      itemFamily: `${category}-${index}`,
      category,
      expected:
        category === "correct_alternative"
          ? ("pass" as const)
          : category === "grammar_error"
            ? ("needs_repair" as const)
            : ("not_assessed" as const),
      humanReviewIds: ["synthetic-1", "synthetic-2"],
      sourceGroup: `synthetic-final-${category}-${index}`,
      templateFamily: `synthetic-final-${category}-${index}`,
      learnerGroup: null,
      contentFingerprint: sha256(`synthetic-final-${category}-${index}`),
      adjudicated: true,
    })),
  );
  const predictions: CandidatePrediction[] = cases.map((row) => ({
    caseId: row.id,
    verdict: row.expected,
    latencyMs: 30,
    meaningPreserved: true,
    targetObserved: true,
    cost: 0,
  }));
  const input = {
    candidate: { id: "synthetic-model", version: "1" },
    cases,
    predictions,
  };
  const benchmarkPath = resolve(output, "synthetic-benchmark.json");
  await writeFile(benchmarkPath, JSON.stringify(input));
  const model = await fixture(),
    approval = model.review.evaluators[0]!;
  approval.kind = "transformer";
  approval.id = input.candidate.id;
  approval.benchmarkInput = {
    path: relative(root, benchmarkPath),
    sha256: sha256(JSON.stringify(input)),
  };
  await assert.rejects(() => check(model), /frozen evaluation evidence/);
  pass("bare-score-file-cannot-bypass-human-labels-and-frozen-evaluation");
  approval.version = "2";
  await assert.rejects(() => check(model), /not qualified for this version/);
  pass("model-version-mismatch");
  approval.version = "1";
  input.cases.forEach((row) => (row.modality = "speaking"));
  await writeFile(benchmarkPath, JSON.stringify(input));
  approval.benchmarkInput.sha256 = sha256(JSON.stringify(input));
  await assert.rejects(() => check(model), /scope does not cover task/);
  pass("speaking-benchmark-cannot-qualify-writing");
  input.cases.forEach((row) => (row.modality = "writing"));
  input.predictions[0]!.verdict = "needs_repair";
  await writeFile(benchmarkPath, JSON.stringify(input));
  approval.benchmarkInput.sha256 = sha256(JSON.stringify(input));
  await assert.rejects(() => check(model), /not qualified for this version/);
  pass("forged-pass-cannot-bypass-recomputed-benchmark");
  const originalText = await readFile(
    resolve(root, "docs/automaticity-release-reviews.json"),
    "utf8",
  );
  assert.equal(originalText, ledgerBefore);
  pass("real-review-ledger-remains-unchanged");
  for (const id of ["en.c.001", "de.c.001"]) {
    const target = resolve(output, `${id}-review-packet.json`);
    const generate = () =>
      Bun.spawn(
        ["bun", "scripts/prepare-automaticity-content-review.ts", id, target],
        { cwd: root, stdout: "ignore", stderr: "ignore" },
      ).exited;
    assert.equal(await generate(), 0);
    const before = await readFile(target, "utf8"),
      packet = JSON.parse(before);
    assert.equal(packet.content.id, id);
    assert.equal(packet.reviewDrafts.length, 14);
    assert.equal(packet.schemaVersion, 2);
    for (const draft of packet.reviewDrafts) {
      assert.equal(draft.contentEvidenceDraft.provenance, null);
      assert.equal(draft.manualEvaluatorEvidenceDraft.provenance, null);
      assert.equal(
        draft.contentEvidenceDraft.taskReviews.length,
        draft.tasksNeedingEvaluatorApproval.length,
      );
      assert(
        draft.contentEvidenceDraft.taskReviews.every(
          (row: { checks: Record<string, unknown> }) =>
            Object.values(row.checks).every((value) => value === null),
        ),
      );
    }
    assert(
      packet.reviewDrafts.every(
        (row: {
          contentReview: { reviewerId: string | null };
          evaluators: unknown[];
        }) =>
          row.contentReview.reviewerId === null && row.evaluators.length === 0,
      ),
    );
    pass(`${id}-review-packet-has-all-stages-and-no-invented-approval`);
    assert.notEqual(await generate(), 0);
    assert.equal(await readFile(target, "utf8"), before);
    pass(`${id}-existing-review-packet-is-preserved`);
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      status: report.status,
      cases: report.cases.length,
      output,
    }),
  );
}
