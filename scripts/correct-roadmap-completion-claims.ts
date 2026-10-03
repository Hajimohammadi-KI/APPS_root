import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dir, ".."),
  at = new Date().toISOString();
const folder = resolve(
  root,
  `artifacts/roadmap-completion-audit/${at.replace(/[:.]/g, "-")}`,
);
const hash = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
const path = resolve(
    root,
    "docs/language-automaticity-implementation-backlog.json",
  ),
  original = await readFile(path),
  backlog = JSON.parse(original.toString("utf8"));
assert.deepEqual(
  backlog.technicalRelease.versions,
  { English: "27.3.40", German: "20.8.44" },
  "This historical audit applies only to the 40/44 release; do not restore a resolved implementation gap on a later release.",
);
const open = backlog.tasks.filter(
  (task: { status: string }) => task.status !== "verified",
);
assert.equal(open.length, 19);
assert.equal(
  open.filter((task: { required: boolean }) => task.required).length,
  14,
);
const followups: Record<string, string[]> = {
  L01: [
    "Import the actual independent reviews; regenerate and validate the representative release scope, then verify the resulting installed content.",
  ],
  M01: [
    "Import the reviewed labels and adjudications; validate partition separation and freeze the actual calibration/final evaluation inputs.",
  ],
  M02: [
    "Run candidates on the reviewed calibration inputs, freeze the selected thresholds, then execute the untouched final comparison and report scope-specific error bounds.",
  ],
  M03: [
    "Compile support decisions from the qualified comparison and approved scopes. Reject unsupported scopes and verify the exact resulting release configuration.",
  ],
  M04: [
    "If a candidate is selected and independently approved, compile its pinned release, build and verify the enabled runtime, then deliver and test that installer. Disabled-adapter tests do not verify an enabled model release.",
  ],
  W01: [
    "Apply the reviewed content and evaluator records; repeat generated-content parity and affected route verification.",
  ],
  W02: [
    "Apply the reviewed content and evaluator records; repeat generated-content parity and affected route verification.",
  ],
  W03: [
    "Apply the reviewed content and evaluator records; repeat generated-content parity and affected route verification.",
  ],
  W04: [
    "Apply the reviewed content and evaluator records; repeat generated-content parity and affected route verification.",
  ],
  W05: [
    "Rebuild the reviewed coverage matrix and full-scope support evidence; execute the release gate against the actual approved content and evaluators.",
  ],
  P01: [
    "Validate and preserve the prospectively declared study, independently reviewed unseen probes and original baseline samples.",
  ],
  P03: [
    "Run the study evaluator on the actual consented samples after the declared follow-up windows; report missing outcomes and uncertainty.",
  ],
  S02: [
    "Evaluate real eligible shadow histories, agree the bounded comparison design, verify its delivered implementation, and analyse the actual delayed outcomes and workload.",
  ],
  R03: [
    "Build the final approved content/configuration and repeat install, update, repair, preservation and browser verification. The current practice installer is not that future approved release.",
  ],
};
const engineering: Record<string, string[]> = {
  S02: [
    "Implement and verify bounded Stage B delivery of candidate review dates, enrolment and withdrawal controls, a preserved baseline schedule and rollback. Current FSRS code only calculates read-only shadow candidates; this execution path is not delivered.",
  ],
};
const sourcePaths = [
  "shared/learning-core/src/fsrs-shadow/qualified.ts",
  "shared/learning-core/src/fsrs-shadow/scheduler.ts",
  "scripts/evaluate-fsrs-shadow.ts",
  "scripts/lib/practice-bandit.ts",
  "docs/automaticity-release-reviews.json",
  "docs/LANGUAGE-AUTOMATICITY-IMPLEMENTATION-ROADMAP.md",
];
const sources = [];
for (const sourcePath of sourcePaths)
  sources.push({
    path: sourcePath,
    sha256: hash(await readFile(resolve(root, sourcePath))),
  });
const auditPath = relative(root, resolve(folder, "report.json")).replaceAll(
    "\\",
    "/",
  ),
  doc = "docs/ROADMAP-OPEN-WORK-AUDIT-2026-09-05.md";
for (const task of open) {
  if (followups[task.id]) task.afterHumanValidation = followups[task.id];
  if (engineering[task.id])
    task.remainingEngineeringWork = engineering[task.id];
  if (task.engineeringVerification === "verified_for_recorded_scope")
    task.engineeringScope =
      task.id === "S02"
        ? "Stage A only: eligible history, read-only candidate dates and prediction reporting. No Stage B schedule delivery or rollback is verified."
        : task.id === "M04"
          ? "Pinned adapter, disabled routes, output safeguards and isolated transport tests. No qualified enabled Transformer release is verified."
          : "The source, route and delivery checks listed in Recorded evidence. They do not establish independent language review, learner outcomes or completion of the remaining steps.";
  task.evidence = [...new Set([...task.evidence, doc, auditPath])];
  task.updatedOn = at.slice(0, 10);
}
const scheduler = backlog.tasks.find(
  (task: { id: string }) => task.id === "S02",
);
scheduler.progressNote =
  "Stage A is engineering-tested: exact task-definition binding, eligible ratings, pre-outcome FSRS predictions, Brier/log-loss reporting and read-only candidate dates. Stage B remains open: bounded delivery of candidate dates, enrolment/withdrawal, preserved baseline scheduling and rollback are not implemented and verified. Real consented histories and a reviewed comparison design are also missing.";
backlog.delivery.fullRoadmap = "incomplete_implementation_and_human_validation";
backlog.delivery.requiredEngineeringTasksStillOpen = 1;
backlog.delivery.requiredTasksFullyVerified = 29;
backlog.completionAudit = {
  at,
  report: doc,
  evidence: auditPath,
  priorClaimCorrected:
    "Recorded checks on 43 tasks do not mean all required engineering or acceptance work is complete.",
  requiredFullyVerified: 29,
  requiredOpen: 14,
  conditionalOpen: 5,
  knownRequiredImplementationGaps: ["S02"],
};
backlog.latestEngineeringUpdate = doc;
backlog.progressRecord = doc;
const audit = {
  at,
  status: "audit_complete",
  scope:
    "Correction of completion claims; no app code, install, human review, learner evidence or task acceptance has been promoted.",
  beforeSha256: hash(original),
  sources,
  counts: backlog.completionAudit,
  tasks: open.map(
    (task: {
      id: string;
      title: string;
      status: string;
      required: boolean;
      remainingHumanWork?: string[];
      remainingEngineeringWork?: string[];
      afterHumanValidation?: string[];
      condition: string | null;
    }) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      required: task.required,
      remainingEngineeringWork: task.remainingEngineeringWork ?? [],
      remainingHumanWork: task.remainingHumanWork ?? [],
      afterHumanValidation: task.afterHumanValidation ?? [],
      condition: task.condition,
    }),
  ),
};
await mkdir(folder, { recursive: true });
await writeFile(resolve(folder, "backlog-before.json"), original, {
  flag: "wx",
});
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(audit, null, 2) + "\n",
  { flag: "wx" },
);
if (Bun.argv.includes("--apply")) {
  assert.equal(
    hash(await readFile(path)),
    hash(original),
    "Backlog changed during audit",
  );
  await writeFile(path, JSON.stringify(backlog, null, 2) + "\n");
}
console.log(
  JSON.stringify({
    folder,
    applied: Bun.argv.includes("--apply"),
    requiredFullyVerified: 29,
    requiredOpen: 14,
    conditionalOpen: 5,
    knownRequiredImplementationGaps: ["S02"],
  }),
);
