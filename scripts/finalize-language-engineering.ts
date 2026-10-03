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
    ["English", "27.3.40"],
    ["German", "20.8.44"],
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
  (task: { required: boolean; remainingEngineeringWork?: string[] }) =>
    task.required && task.remainingEngineeringWork?.length,
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
await checkLogs(config.technicalChecks, 18);
const browser = await checkLogs(config.browserChecks, 10);
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
const remaining: Record<string, string[]> = {
  L01: [
    "Independent content review and scoped evaluator approval for the 168 representative cells.",
  ],
  M01: [
    "Independent English/German labels and adjudication, including separately reviewed calibration and untouched final evaluation material.",
  ],
  M02: [
    "Reviewed calibration/final inputs for a qualified candidate comparison. The executed development comparisons cannot supply these human labels.",
  ],
  M03: [
    "Independent acceptance of the measured error bounds and exact supported evaluator scopes.",
  ],
  W01: [
    "Independent language-content and assessment review of the foundation and reference families.",
  ],
  W02: [
    "Independent language-content and assessment review of temporal and verb-system families.",
  ],
  W03: [
    "Independent language-content and assessment review of complex proposition families.",
  ],
  W04: [
    "Independent language-content and assessment review of discourse, advanced integration and orthography.",
  ],
  W05: [
    "Actual content reviews and evaluator approvals for all 3,906 required cells. The release gate correctly refuses absent evidence.",
  ],
  P01: [
    "Participant consent, independently reviewed unseen probes and learner-authored pre-intervention baseline samples.",
  ],
  P02: [
    "Real daily practice chosen and performed by the learner. Scripted browser sessions are not participation.",
  ],
  P03: [
    "Original learner writing/audio, independent scoring and real 24-hour, seven-day and thirty-day follow-up windows.",
  ],
  S02: [
    "Consented prospective recall ratings, reviewed delayed outcomes and an observed workload/benefit comparison.",
  ],
  R03: [
    "Full-curriculum human qualification and release acceptance. The current installed technical release remains an authored practice release.",
  ],
};
const backlogPath = "docs/language-automaticity-implementation-backlog.json",
  original = await readFile(resolve(root, backlogPath)),
  backlog = JSON.parse(original.toString("utf8"));
assert.deepEqual(
  backlog.tasks
    .filter(
      (task: { required: boolean; status: string }) =>
        task.required && task.status !== "verified",
    )
    .map((task: { id: string }) => task.id)
    .sort(),
  Object.keys(remaining).sort(),
);
await writeFile(resolve(output, "backlog-before.json"), original, {
  flag: "wx",
});
const reportRef = relative(root, reportPath).replaceAll("\\", "/"),
  handoff = "docs/AUTOMATICITY-HUMAN-VALIDATION-HANDOFF.md",
  doc = "docs/LANGUAGE-AUTOMATICITY-TECHNICAL-COMPLETION-2026-09-05.md";
const notes: Record<string, string> = {
  L01: "12 bounded English/German scopes and 168 tasks have engineering validation, including alternatives, grammar/meaning roles, abstention and actual review routes. The installed approved-human-review path is verified with isolated fixtures. Independent review remains 0/168 representative cells.",
  M01: "Benchmark import, review integrity, partition separation, freezing and evaluation tooling are verified. The 20 original draft cases and 74 representative development cases remain unreviewed diagnostics; no calibration/final labels were invented.",
  M02: "Rule, LanguageTool and pinned local-model adapters and development comparisons are implemented and checked. Qualified comparisons await independently reviewed calibration/final inputs.",
  M03: "The support matrix covers all 3,906 cells and the scoped release compiler refuses unsupported or stale judgments. Actual approved automatic scopes remain zero.",
  W01: "Engineering checks cover every authored task and every installed stage/modality route in this family group; linguistic review remains separate.",
  W02: "Engineering checks cover every authored task and every installed stage/modality route in this family group; linguistic review remains separate.",
  W03: "Engineering checks cover every authored task and every installed stage/modality route in this family group; linguistic review remains separate.",
  W04: "Engineering checks cover every authored task and every installed stage/modality route in this family group; linguistic review remains separate.",
  W05: "All 280 constructions, 4,924 active tasks and 3,906 required cells pass structural/behavioral and installed-route checks. Completed review import, preservation, generator overlays and runtime human-scope compilation are implemented. The real review ledger remains empty, so full language qualification is not granted.",
  P01: "The prospective protocol, private reviewed-probe import and study evaluator are implemented and regression tested. Missing human consent, probe judgments and baseline responses are explicit.",
  P02: "The installed Daily, practice, review, original-audio and preservation workflows are verified. Only the learner can supply actual practice participation.",
  P03: "The evaluator verifies approved review procedures, original response/audio hashes, first responses, actual delays, unseen contexts, opportunity counts and missing outcomes. Real transfer and retention results await human participation and elapsed time.",
  S02: "Exact task-definition binding, explicit qualified ratings, pre-outcome FSRS predictions, Brier/log-loss reporting and read-only candidate dates are implemented and checked. Empty data yields no calibration or benefit claim; the learner schedule stays unchanged.",
  R03: "English 27.3.40 and DeutschFlow 20.8.44 pass source checks, installer lifecycle, normal-profile preservation and installed browser workflows. Full reviewed-curriculum release still needs the actual human qualification records.",
};
for (const task of backlog.tasks) {
  if (task.required) {
    task.engineeringVerification = "verified_for_recorded_scope";
    task.evidence = [
      ...new Set([
        ...task.evidence,
        config.technicalChecks,
        config.browserChecks,
        reportRef,
        doc,
      ]),
    ];
  }
  if (remaining[task.id]) {
    task.remainingHumanWork = remaining[task.id];
    task.progressNote = notes[task.id];
    task.updatedOn = "2026-09-05";
    task.evidence = [...new Set([...task.evidence, handoff])];
  }
}
Object.assign(backlog.delivery, {
  technicalIncrement: "verified",
  englishVersion: "27.3.40",
  germanVersion: "20.8.44",
  installedEnglishVersion: "27.3.40",
  installedGermanVersion: "20.8.44",
  fullRoadmap: "awaiting_human_validation",
  requiredEngineeringScopesVerified: 43,
  requiredHumanValidationTasks: 14,
});
Object.assign(backlog.technicalRelease, {
  status: "verified",
  versions: { English: "27.3.40", German: "20.8.44" },
  installedVersions: { English: "27.3.40", German: "20.8.44" },
  report: doc,
});
delete backlog.technicalRelease.blocker;
backlog.updatedOn = "2026-09-05";
backlog.progressRecord = doc;
backlog.latestEngineeringUpdate = doc;
const counts = {
  required: backlog.tasks.filter((task: { required: boolean }) => task.required)
    .length,
  engineeringVerified: backlog.tasks.filter(
    (task: { required: boolean; engineeringVerification: string }) =>
      task.required &&
      task.engineeringVerification === "verified_for_recorded_scope",
  ).length,
  fullAcceptanceVerified: backlog.tasks.filter(
    (task: { required: boolean; status: string }) =>
      task.required && task.status === "verified",
  ).length,
  humanValidationPending: Object.keys(remaining).length,
};
assert.equal(counts.required, 43);
assert.equal(counts.engineeringVerified, 43);
const report = {
  at: new Date().toISOString(),
  status: "verified",
  scope:
    "Currently executable required engineering work; human qualification and conditional future research are separate.",
  counts,
  products,
  receipts,
  remainingHumanWork: remaining,
  content: {
    units: 280,
    activeTasks: 4924,
    archivedTasks: 506,
    requiredCells: 3906,
    reviewedCells: 0,
  },
  learningOutcomes: "unmeasured",
  transformer: "not_qualified",
  fsrs: "shadow_only",
  reinforcementLearning: "offline_prototype_not_active",
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", {
  flag: "wx",
});
await writeFile(
  resolve(root, doc),
  `The currently executable engineering work is verified for all 43 required roadmap tasks. Full acceptance is recorded for 29; the remaining 14 require actual human review, learner participation or elapsed follow-up time. Conditional research remains subject to its original evidence gates.\n\nEnglish **27.3.40** and DeutschFlow **20.8.44** are installed. Both pass their required source checks, install/upgrade/start/repair/uninstall cycles, normal-profile preservation and ten groups of installed browser tests. The exact receipts and hashes are in [the verification record](../${reportRef}).\n\nThe checks cover **280 constructions, 4,924 active tasks and every one of the 3,906 required stage/modality routes**. Older task definitions and learner data are retained. The review ledger still has zero real approvals.\n\nThis release adds exact assessment-context checks, task-definition binding for FSRS, preserved import of completed curriculum reviews, compiled human-review scopes and immediate refresh of saved responses. It also adds private-probe validation and study reporting with actual timing, original audio, missing follow-ups and explicit opportunity counts. A bare approval flag cannot qualify a study response.\n\nThe [HTML roadmap](LANGUAGE-AUTOMATICITY-ROADMAP.html) shows green engineering evidence separately from remaining human validation. The [human handoff](AUTOMATICITY-HUMAN-VALIDATION-HANDOFF.md) gives the exact next steps and commands.\n\nNo CEFR level, automatic grammar mastery, learner improvement or causal benefit is claimed. The local feedback guard is active; the Transformer remains unqualified, FSRS stays in shadow mode and the contextual-bandit prototype remains offline.\n`,
  { flag: "wx" },
);
await writeFile(
  resolve(root, backlogPath),
  JSON.stringify(backlog, null, 2) + "\n",
);
console.log(
  JSON.stringify({ status: "verified", report: reportRef, ...counts }),
);
