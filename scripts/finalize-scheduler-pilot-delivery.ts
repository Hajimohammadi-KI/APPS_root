import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { sha256 } from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, ".."),
  configPath = Bun.argv[2];
if (!configPath) throw Error("Pass the final release evidence configuration");
const json = async (path: string) =>
  JSON.parse(
    (await readFile(resolve(root, path), "utf8")).replace(/^\uFEFF/, ""),
  );
const config = await json(configPath),
  output = resolve(root, config.output),
  reportPath = resolve(output, "verification.json"),
  sourceArg = Bun.argv.find((arg) => arg.startsWith("--bind-source="));
assert.deepEqual(
  config.products
    .map((item: { product: string; version: string }) => [
      item.product,
      item.version,
    ])
    .sort(),
  [
    ["English", "27.3.41"],
    ["German", "20.8.45"],
  ],
);
assert(
  relative(
    resolve(root, "artifacts/language-engineering-completion"),
    output,
  ) &&
    !relative(
      resolve(root, "artifacts/language-engineering-completion"),
      output,
    ).startsWith(".."),
  "Evidence output must stay in artifacts/language-engineering-completion",
);
await mkdir(output, { recursive: true });
if (sourceArg) {
  const folder = sourceArg.slice(14),
    manifest = await json(`${folder}/manifest.json`),
    report = await json(reportPath);
  assert.equal(report.status, "verified");
  for (const file of manifest.files) {
    assert.equal(
      sha256(await readFile(resolve(root, file.path))),
      file.sha256,
      `Current source changed: ${file.path}`,
    );
    assert.equal(
      sha256(await readFile(resolve(root, folder, "source", file.path))),
      file.sha256,
      `Source copy changed: ${file.path}`,
    );
  }
  report.sourceCapture = {
    path: `${folder}/manifest.json`,
    sha256: sha256(await readFile(resolve(root, folder, "manifest.json"))),
    files: manifest.files.length,
    verifiedAt: new Date().toISOString(),
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      status: "verified",
      sourceFiles: manifest.files.length,
      report: reportPath,
    }),
  );
  process.exit(0);
}
const currentBacklog = await json(
  "docs/language-automaticity-implementation-backlog.json",
);
const openImplementation = currentBacklog.tasks.filter(
  (task: {
    id: string;
    required: boolean;
    remainingEngineeringWork?: string[];
  }) =>
    task.required && task.id !== "S02" && task.remainingEngineeringWork?.length,
);
assert.equal(
  openImplementation.length,
  0,
  `Cannot repeat the historical all-engineering-complete claim while implementation remains open: ${openImplementation.map((task: { id: string }) => task.id).join(", ")}`,
);
const receipts: { path: string; sha256: string }[] = [];
const types = Bun.spawn(
  [
    "node",
    "Apps/Deutsch-Automaticity/node_modules/typescript/bin/tsc",
    "-p",
    "scripts/tsconfig.language-tools.json",
  ],
  { cwd: root, stdout: "pipe", stderr: "pipe" },
);
const [typeStdout, typeStderr, typeExit] = await Promise.all([
  new Response(types.stdout).text(),
  new Response(types.stderr).text(),
  types.exited,
]);
assert.equal(
  typeExit,
  0,
  `Final tool type check failed: ${typeStderr}${typeStdout}`,
);
const typeLog = resolve(output, "final-tool-types.log");
await writeFile(
  typeLog,
  JSON.stringify({
    at: new Date().toISOString(),
    command: [
      "node",
      "Apps/Deutsch-Automaticity/node_modules/typescript/bin/tsc",
      "-p",
      "scripts/tsconfig.language-tools.json",
    ],
    exit: typeExit,
  }) +
    "\n" +
    typeStdout +
    "\nSTDERR\n" +
    typeStderr,
  { flag: "wx" },
);
receipts.push({
  path: relative(root, typeLog).replaceAll("\\", "/"),
  sha256: sha256(await readFile(typeLog)),
});
async function receipt(path: string) {
  const bytes = await readFile(resolve(root, path));
  receipts.push({ path, sha256: sha256(bytes) });
  return JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
}
async function checkLogs(path: string, expected: number) {
  const result = await receipt(path);
  assert.equal(result.status, "passed", path);
  assert.equal(result.checks.length, expected);
  for (const check of result.checks) {
    assert.equal(check.status, "passed", check.id);
    assert.equal(
      sha256(await readFile(resolve(root, dirname(path), check.log))),
      check.logSha256,
      check.id,
    );
    if (check.receipt) await receipt(check.receipt);
  }
  return result;
}
await checkLogs(config.technicalChecks, 21);
const browser = await checkLogs(config.browserChecks, 11);
const routes = await json(
  browser.checks.find(
    (check: { id: string }) => check.id === "all-curriculum-cells",
  ).receipt,
);
assert.equal(routes.cases.length, 3906);
assert(
  routes.cases.every((row: { status: string }) => row.status === "passed"),
);
const human = await json(
  browser.checks.find((check: { id: string }) => check.id === "human-review")
    .receipt,
);
assert.equal(human.cases.length, 8);
assert(human.cases.every((row: { status: string }) => row.status === "passed"));
const ledger = await receipt("docs/automaticity-release-reviews.json");
assert.equal(
  ledger.reviews.length,
  0,
  "This completion record must be updated if real reviews have arrived",
);
const products = [];
for (const item of config.products) {
  const cycle = await receipt(item.lifecycle),
    update = await receipt(item.update);
  assert.equal(cycle.product, item.product);
  assert.equal(cycle.version, item.version);
  assert.equal(cycle.learnerDataPreserved, true);
  for (const key of [
    "install",
    "upgrade",
    "startup",
    "update",
    "repair",
    "uninstall",
    "transformerOrigin",
  ])
    assert.equal(cycle[key], "verified", `${item.product}:${key}`);
  const installed = update.products.find(
    (row: { product: string }) => row.product === item.product,
  );
  assert.equal(update.status, "verified");
  assert.equal(installed.version, item.version);
  assert.equal(installed.profilePreservedBeforeStartup, true);
  assert.equal(installed.httpStatus, 200);
  assert.equal(installed.setupSha256, cycle.setupSha256);
  assert.equal(installed.payloadSha256, cycle.payloadSha256);
  assert.equal(
    (
      await readFile(resolve(installed.installRoot, "version.txt"), "utf8")
    ).trim(),
    item.version,
  );
  const preserved = await receipt(
    relative(
      root,
      resolve(installed.backupRoot, "profile-manifest.json"),
    ).replaceAll("\\", "/"),
  );
  assert.equal(preserved.length, installed.profileFiles);
  let preservedBytes = 0;
  for (const file of preserved) {
    const bytes = await readFile(
      resolve(installed.backupRoot, "profile", file.path),
    );
    assert.equal(bytes.length, file.bytes);
    assert.equal(
      sha256(bytes),
      file.sha256.toLowerCase(),
      `${item.product} saved profile: ${file.path}`,
    );
    preservedBytes += bytes.length;
  }
  assert.equal(preservedBytes, installed.profileBytes);
  assert.equal(
    sha256(await readFile(cycle.setupPath)),
    cycle.setupSha256.toLowerCase(),
  );
  assert.equal(
    sha256(await readFile(cycle.setupPath.replace(/\.exe$/, ".payload.zip"))),
    cycle.payloadSha256.toLowerCase(),
  );
  const build = await json(
    `${item.app}/artifacts/completion-build-receipt.json`,
  );
  assert.equal(build.version, item.version);
  assert.equal(build.checkExit, 0);
  assert.equal(build.packageExit, 0);
  for (const name of [
    "completion-build-receipt.json",
    "completion-release-check.log",
    "completion-release-package.log",
  ]) {
    const target = resolve(output, `${item.product}-${name}`);
    await writeFile(
      target,
      await readFile(resolve(root, item.app, "artifacts", name)),
      { flag: "wx" },
    );
    receipts.push({
      path: relative(root, target).replaceAll("\\", "/"),
      sha256: sha256(await readFile(target)),
    });
  }
  const language = item.product === "English" ? "en" : "de",
    approvalPath = `${item.app}/apps/web/public/learning-core/review-approvals-${language}.json`;
  assert.equal((await receipt(approvalPath)).scopes.length, 0);
  products.push({
    product: item.product,
    version: item.version,
    previousVersion: installed.previousVersion,
    setupPath: cycle.setupPath,
    setupSha256: cycle.setupSha256,
    payloadSha256: cycle.payloadSha256,
    profileFiles: installed.profileFiles,
    profileBytes: installed.profileBytes,
    profilePreservedBeforeStartup: true,
    installRoot: installed.installRoot,
    lifecycle: item.lifecycle,
    update: item.update,
  });
}
const pilotReceipt = await receipt(
  browser.checks.find((row: { id: string }) => row.id === "scheduler-pilot")
    .receipt,
);
assert.equal(pilotReceipt.cases.length, 8);
assert(
  pilotReceipt.cases.every(
    (row: { status: string }) => row.status === "passed",
  ),
);
for (const item of config.products) {
  const language = item.product === "English" ? "en" : "de";
  assert.equal(
    (
      await receipt(
        `${item.app}/apps/web/public/learning-core/scheduler-pilot-${language}.json`,
      )
    ).plan,
    null,
  );
}
const backlogPath = "docs/language-automaticity-implementation-backlog.json",
  original = await readFile(resolve(root, backlogPath)),
  backlog = JSON.parse(original.toString("utf8")),
  reportRef = relative(root, reportPath).replaceAll("\\", "/"),
  doc = "docs/LANGUAGE-AUTOMATICITY-DELIVERY-2026-09-06.md",
  design = "docs/SCHEDULER-PILOT-IMPLEMENTATION-2026-09-06.md";
await writeFile(resolve(output, "backlog-before.json"), original, {
  flag: "wx",
});
const task = backlog.tasks.find((row: { id: string }) => row.id === "S02");
assert(task && task.status !== "verified");
task.remainingEngineeringWork = [];
task.engineeringVerification = "verified_for_recorded_scope";
task.engineeringScope =
  "Stage A shadow replay and bounded Stage B writing comparison runtime: exact reviewed task/assessment binding, explicit opt-in, baseline snapshot, actual assigned dates, delivery logs, interruption, withdrawal and rollback. Synthetic source and installed-browser evidence; no actual learner comparison or scheduler qualification.";
task.progressNote =
  "Stage A and Stage B engineering checks pass in installed English 27.3.41 and DeutschFlow 20.8.45. The bounded writing pilot now delivers actual baseline/candidate dates, preserves baseline scheduling and supports explicit opt-in, withdrawal and rollback. The compiler requires actual independently reviewed shadow evidence and a prospective plan. Outcome tests include late human scoring, failures, missing follow-ups and withdrawal. Shipped plans are empty; real consent, reviewed observations and measured benefit remain pending.";
task.remainingHumanWork = [
  "Consented prospective recall histories, independent content/evaluator and comparison-design review, explicit learner participation and independently scored delayed outcomes.",
];
task.afterHumanValidation = [
  "Evaluate qualified shadow data; compile the exact independently reviewed prospective plan and deliver it through versioned installer checks. After actual opt-in and elapsed follow-up, analyse real accuracy, observed workload, uncertainty and missing/contaminated outcomes against the predefined benefit criteria.",
];
task.updatedOn = "2026-09-06";
task.evidence = [
  ...new Set([
    ...task.evidence,
    design,
    "scripts/compile-scheduler-pilot.ts",
    "scripts/evaluate-scheduler-pilot.ts",
    "scripts/scheduler-pilot-evaluation.test.ts",
    pilotReceipt
      ? browser.checks.find(
          (row: { id: string }) => row.id === "scheduler-pilot",
        ).receipt
      : "",
    reportRef,
  ]),
];
for (const row of backlog.tasks.filter(
  (row: { required: boolean }) => row.required,
)) {
  row.evidence = [
    ...new Set([
      ...row.evidence,
      config.technicalChecks,
      config.browserChecks,
      doc,
      reportRef,
    ]),
  ];
}
const release = backlog.tasks.find((row: { id: string }) => row.id === "R03");
release.progressNote =
  "English 27.3.41 and DeutschFlow 20.8.45 pass required source checks, installer lifecycle, exact normal-profile preservation and eleven installed browser verification groups. The authored practice release is delivered; a full independently reviewed curriculum release still awaits genuine review records.";
release.updatedOn = "2026-09-06";
Object.assign(backlog.delivery, {
  technicalIncrement: "verified",
  englishVersion: "27.3.41",
  germanVersion: "20.8.45",
  installedEnglishVersion: "27.3.41",
  installedGermanVersion: "20.8.45",
  fullRoadmap: "awaiting_human_validation",
  requiredImplementationStillOpen: [],
  requiredEngineeringTasksStillOpen: 0,
  fsrs: "bounded_pilot_available_not_enrolled",
  requiredEngineeringScopesVerified: 43,
  requiredHumanValidationTasks: 14,
});
Object.assign(backlog.technicalRelease, {
  status: "verified",
  versions: { English: "27.3.41", German: "20.8.45" },
  installedVersions: { English: "27.3.41", German: "20.8.45" },
  report: doc,
});
delete backlog.technicalRelease.blocker;
backlog.updatedOn = "2026-09-06";
backlog.progressRecord = doc;
backlog.latestEngineeringUpdate = doc;
const counts = {
  required: backlog.tasks.filter((row: { required: boolean }) => row.required)
    .length,
  recordedEngineeringVerified: backlog.tasks.filter(
    (row: { required: boolean; engineeringVerification: string }) =>
      row.required &&
      row.engineeringVerification === "verified_for_recorded_scope",
  ).length,
  fullAcceptanceVerified: backlog.tasks.filter(
    (row: { required: boolean; status: string }) =>
      row.required && row.status === "verified",
  ).length,
  humanValidationPending: backlog.tasks.filter(
    (row: { required: boolean; status: string }) =>
      row.required && row.status !== "verified",
  ).length,
  requiredImplementationStillOpen: backlog.tasks
    .filter(
      (row: { required: boolean; remainingEngineeringWork?: string[] }) =>
        row.required && row.remainingEngineeringWork?.length,
    )
    .map((row: { id: string }) => row.id),
};
assert.deepEqual(counts, {
  required: 43,
  recordedEngineeringVerified: 43,
  fullAcceptanceVerified: 29,
  humanValidationPending: 14,
  requiredImplementationStillOpen: [],
});
const report = {
  at: new Date().toISOString(),
  status: "verified",
  scope:
    "Delivered engineering increment and known required implementation gaps; independent language qualification and real learner studies remain open.",
  counts,
  products,
  receipts,
  content: {
    units: 280,
    activeTasks: 4924,
    archivedTasks: 506,
    requiredCells: 3906,
    reviewedCells: 0,
  },
  learningOutcomes: "unmeasured",
  transformer: "not_qualified",
  fsrs: "bounded_pilot_available_not_enrolled",
  reinforcementLearning: "offline_prototype_not_active",
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", {
  flag: "wx",
});
await writeFile(
  resolve(root, doc),
  `English **27.3.41** and DeutschFlow **20.8.45** are installed and verified. Both required app checks and packages pass; install, upgrade, startup, repair and uninstall pass in isolated profiles. Normal updates preserve the complete learner profiles before startup, with backups checked against their SHA-256 manifests. Eleven installed browser groups and 21 root engineering gates pass, including all 3,906 curriculum routes. The missing-human-input gates intentionally refuse release qualification.\n\nS02's missing Stage B runtime is implemented and checked: exact reviewed targets, explicit opt-in, preserved baseline, actual baseline/FSRS dates, delivery logs, interruption, expiry, withdrawal and rollback. The compiler and outcome evaluator are available, and outcome tests include scoring after the response window, failures, missing data and tampering. See [the design and handoff](${design.split("/").at(-1)}). No actual pilot is enrolled; the delivered plans are empty.\n\nThe roadmap records **29 of 43 required tasks fully verified** and passed engineering checks for all 43. The remaining **14 required tasks** need actual independent review or learner observations, followed by the listed data-dependent qualification and delivery commands. Five conditional model/scheduling/research tasks remain subject to their evidence gates. Green engineering badges do not imply human review or measured learning gains.\n\nExact receipts and hashes: [verification record](../${reportRef}). Original content reviews remain zero; no Transformer is qualified and reinforcement learning remains an offline prototype. [Git repair and reversible cleanup](GIT-AND-CLEANUP-2026-09-06.md) preserve both histories and the original documents.\n`,
  { flag: "wx" },
);
await writeFile(
  resolve(root, backlogPath),
  JSON.stringify(backlog, null, 2) + "\n",
);
console.log(
  JSON.stringify({ status: "verified", report: reportRef, ...counts }),
);
