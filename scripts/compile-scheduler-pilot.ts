import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  isRecord,
  parseAutomaticityEvent,
  validDate,
  type Language,
} from "../shared/learning-core/src/automaticity/contracts";
import {
  parseSchedulerPilotPlan,
  validateSchedulerPilotPlan,
} from "../shared/learning-core/src/automaticity/scheduler-pilot";
import { reduceAutomaticityEvents } from "../shared/learning-core/src/automaticity/evidence";
import { buildQualifiedFsrsCandidates } from "../Apps/Deutsch-Automaticity/packages/learning-core/src/fsrs-shadow/qualified";
import {
  parseReviewLedger,
  validateReleaseReviews,
  sha256,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
const root = resolve(import.meta.dir, ".."),
  argument = Bun.argv[2],
  at = new Date().toISOString();
if (!argument)
  throw Error(
    "Pass a reviewed comparison JSON file or --empty. Output is private staging only.",
  );
const folder = resolve(
  root,
  `artifacts/scheduler-pilot-release/${at.replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
if (argument === "--empty") {
  await writeFile(
    resolve(folder, "report.json"),
    JSON.stringify(
      {
        at,
        status: "awaiting_human_evidence",
        active: false,
        remaining: [
          "Reviewed content and exact evaluator scopes",
          "Consented qualified shadow history",
          "Independent approval of the prospectively declared comparison, outcomes, stopping rule and deployment",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      folder,
      status: "awaiting_human_evidence",
      active: false,
    }),
  );
  process.exit(0);
}
const inputBytes = await readFile(resolve(root, argument));
assert(inputBytes.length < 200000, "Comparison declaration too large");
const input: unknown = JSON.parse(inputBytes.toString("utf8"));
assert(
  isRecord(input) &&
    isRecord(input.plan) &&
    isRecord(input.review) &&
    typeof input.shadowExportPath === "string",
);
const raw = input.plan,
  review = input.review;
assert(raw.language === "en" || raw.language === "de");
const language: Language = raw.language;
const reviewedPlan = { ...raw, evidenceSha256: sha256(JSON.stringify(review)) };
const plan = parseSchedulerPilotPlan(reviewedPlan, language);
const { evidenceSha256: _evidence, ...reviewPayload } = plan;
assert(
  review.schemaVersion === 1 &&
    review.provenance === "human_review" &&
    review.decision === "approved" &&
    typeof review.role === "string" &&
    review.role.trim().length > 2 &&
    review.reviewerId === plan.reviewerId &&
    review.reviewedAt === plan.approvedAt &&
    validDate(review.reviewedAt) &&
    Date.parse(review.reviewedAt) <= Date.parse(at),
);
assert(
  !/^(synthetic|fixture|automated|ai[_ -]?generated|test)(?:\b|[-_])/i.test(
    plan.reviewerId,
  ),
  "A synthetic review cannot approve a pilot",
);
assert.equal(
  review.planSha256,
  sha256(JSON.stringify(reviewPayload)),
  "Review must pin the exact declaration excluding its evidence hash",
);
assert(isRecord(review.checks));
for (const key of [
  "shadowEvidence",
  "eligibleTargets",
  "allocation",
  "outcomes",
  "nonInferiorityCriteria",
  "missingData",
  "withdrawalAndRollback",
  "privacyAndDeployment",
]) {
  const check = review.checks[key];
  assert(
    isRecord(check) &&
      check.approved === true &&
      typeof check.note === "string" &&
      check.note.trim().length >= 20,
    `Missing independent comparison finding: ${key}`,
  );
}
const exportBytes = await readFile(resolve(root, input.shadowExportPath));
assert(exportBytes.length < 50000000, "Shadow export too large");
assert.equal(sha256(exportBytes), plan.shadowSha256);
const source: unknown = JSON.parse(exportBytes.toString("utf8"));
assert(
  isRecord(source) &&
    source.language === language &&
    Array.isArray(source.events) &&
    Array.isArray(source.ratings),
);
const events = source.events.map((event) =>
  parseAutomaticityEvent(event, language),
);
assert(
  events.every((event) => Date.parse(event.at) <= Date.parse(plan.approvedAt)),
  "The declared shadow history must predate approval",
);
const runtime = await loadRepresentativeRuntime(root),
  pack = runtime.packs.find((pack) => pack.language === language)!;
const ledger = parseReviewLedger(
  JSON.parse(
    await readFile(
      resolve(root, "docs/automaticity-release-reviews.json"),
      "utf8",
    ),
  ),
);
const coverage = JSON.parse(
  await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
) as { cells: CoverageCell[] };
await validateReleaseReviews(
  root,
  coverage.cells,
  new Map(runtime.packs.map((pack) => [pack.language, pack])),
  ledger,
  at,
);
const approvals = buildHumanReviewManifest(pack, ledger);
await validateSchedulerPilotPlan(plan, pack, approvals, events, at);
const qualified = buildQualifiedFsrsCandidates(
  events,
  language,
  plan.approvedAt,
  source.consent as Parameters<typeof buildQualifiedFsrsCandidates>[3],
  source.ratings as Parameters<typeof buildQualifiedFsrsCandidates>[4],
);
const baseline = reduceAutomaticityEvents(events, language, plan.approvedAt);
for (const target of plan.targets) {
  const card = qualified.cards.find(
    (card) => card.history.at(-1)?.attemptId === target.sourceAttemptId,
  );
  assert(
    card && card.history.length >= 2,
    "At least two eligible delayed ratings per declared memory item are required",
  );
  assert.equal(
    card.candidate.dueAt,
    target.candidateDueAt,
    "Candidate date does not match pinned FSRS replay",
  );
  assert.equal(
    baseline.progress.find(
      (row) =>
        row.constructionId === target.constructionId &&
        row.modality === "writing",
    )?.nextReviewAt,
    target.baselineDueAt,
  );
  for (const history of card.history) {
    const attempt = events.find(
      (event) => event.type === "attempt" && event.id === history.attemptId,
    );
    assert(
      attempt?.type === "attempt" &&
        attempt.task.definitionSha256 === target.definitionSha256 &&
        sha256(attempt.response.text) === history.responseSha256,
      "Historical task/response binding changed",
    );
    await validateSchedulerPilotPlan(
      {
        ...plan,
        targets: plan.targets.map((item) =>
          item.taskId === target.taskId
            ? {
                ...item,
                sourceAttemptId: history.attemptId,
                sourceAssessmentId: history.assessmentId,
              }
            : item,
        ),
      },
      pack,
      approvals,
      events,
      at,
    );
  }
}
assert(
  Date.parse(plan.startsAt) >= Date.parse(at),
  "A prospective comparison cannot start in the past",
);
await writeFile(
  resolve(folder, `scheduler-pilot-${language}.json`),
  JSON.stringify({ schemaVersion: 1, plan }, null, 2) + "\n",
  { flag: "wx" },
);
const report = {
  at,
  status: "reviewed_plan_staged",
  active: false,
  language,
  planSha256: sha256(JSON.stringify(plan)),
  inputSha256: sha256(inputBytes),
  reviewSha256: plan.evidenceSha256,
  shadowSha256: plan.shadowSha256,
  scope:
    "Private staging only; no learner is enrolled and no schedule has changed. Deliver the reviewed file through the normal versioned installer checks before offering opt-in.",
};
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify({ folder, ...report }));
