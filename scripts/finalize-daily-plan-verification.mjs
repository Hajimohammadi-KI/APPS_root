import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const split = value.indexOf("=");
    assert(value.startsWith("--") && split > 2);
    return [value.slice(2, split), value.slice(split + 1)];
  }),
);
const bytes = (path) => readFile(resolve(root, path));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const read = async (path) => {
  const value = await bytes(path);
  return JSON.parse(
    (value[0] === 255
      ? value.toString("utf16le")
      : value.toString("utf8")
    ).replace(/^\uFEFF/, ""),
  );
};
const receipts = {},
  evidence = {};
for (const key of [
  "english-cycle",
  "german-cycle",
  "english-update",
  "german-update",
  "daily",
  "recording",
  "restore",
  "history",
  "integrity",
  "routes",
  "recall",
  "cycle",
  "archive",
  "transformer",
  "practice",
]) {
  assert(args[key], `Missing --${key}=receipt`);
  evidence[key] = await read(args[key]);
  receipts[key] = { path: args[key], sha256: hash(await bytes(args[key])) };
  if (!key.endsWith("-cycle"))
    assert(
      ["passed", "verified"].includes(evidence[key].status),
      `${key} is not verified`,
    );
  if (evidence[key].cases)
    assert(
      evidence[key].cases.every(
        (row) =>
          (["transformer", "routes", "archive"].includes(key) &&
            typeof row === "string") ||
          ["passed", "verified"].includes(row.status),
      ),
      `${key} contains a failed case`,
    );
}
assert.match(evidence.daily.scope, /Installed/);
assert.equal(evidence.daily.cases.length, 2);
assert(evidence.daily.cases.every((row) => row.checks.length >= 7));
assert.match(evidence.practice.scope, /Installed/);
assert.match(evidence.routes.scope, /Installed/);
assert(
  evidence.recording.cases.every(
    (row) =>
      row.pendingPermissionAndActiveRecordingBlockPause &&
      row.pausedRecordingRemainsPlayable &&
      row.storedHashVerified,
  ),
);
assert(
  evidence.recall.cases.every(
    (row) => row.runtime === "installed-desktop" && row.checks.length === 12,
  ),
);
assert.equal(evidence.cycle.cases.length, 4);
const products = [];
for (const spec of [
  {
    key: "english",
    name: "English",
    language: "en",
    version: "27.3.36",
    previous: "27.3.35",
    source: "Apps/English/English-Automaticity",
    directory: "English Grammar Automaticity Desktop",
    setup: "EnglishGrammar",
    port: 3202,
    check: "check",
  },
  {
    key: "german",
    name: "German",
    language: "de",
    version: "20.8.40",
    previous: "20.8.39",
    source: "Apps/Deutsch-Automaticity",
    directory: "DeutschFlow",
    setup: "DeutschFlow",
    port: 3210,
    check: "verify",
  },
]) {
  const cycle = evidence[`${spec.key}-cycle`],
    update = evidence[`${spec.key}-update`];
  assert.equal(cycle.version, spec.version);
  assert.equal(cycle.previousVersion, spec.previous);
  for (const key of [
    "install",
    "upgrade",
    "startup",
    "update",
    "repair",
    "uninstall",
    "transformerOrigin",
  ])
    assert.equal(cycle[key], "verified", `${spec.name} ${key}`);
  assert.equal(cycle.learnerDataPreserved, true);
  const applied = update.products.find((row) => row.product === spec.name);
  assert.equal(applied.version, spec.version);
  assert.equal(applied.profilePreservedBeforeStartup, true);
  assert.equal(applied.httpStatus, 200);
  const setupPath = `${spec.source}/apps/web/public/downloads/${spec.setup}-Setup-v${spec.version}.exe`;
  const setupSha256 = hash(await bytes(setupPath)),
    payloadSha256 = hash(
      await bytes(setupPath.replace(/\.exe$/, ".payload.zip")),
    );
  assert.equal(cycle.setupSha256.toLowerCase(), setupSha256);
  assert.equal(cycle.payloadSha256.toLowerCase(), payloadSha256);
  assert.equal(applied.setupSha256.toLowerCase(), setupSha256);
  assert.equal(applied.payloadSha256.toLowerCase(), payloadSha256);
  assert.equal(
    (await read(`${spec.source}/distribution/windows-modern/setup.config.json`))
      .version,
    spec.version,
  );
  assert.equal(
    (
      await readFile(
        resolve(
          process.env.LOCALAPPDATA,
          "Programs",
          spec.directory,
          "version.txt",
        ),
        "utf8",
      )
    ).trim(),
    spec.version,
  );
  const assets = [];
  for (const path of [
    "learning-core/practice.js",
    "learning-core/automaticity-v2.js",
    "learning-core/overview.js",
    `learning-core/curriculum-${spec.language}.json`,
    "sw.js",
  ]) {
    const response = await fetch(`http://127.0.0.1:${spec.port}/${path}`);
    assert.equal(response.status, 200);
    const sha256 = hash(Buffer.from(await response.arrayBuffer()));
    assert.equal(
      sha256,
      hash(await bytes(`${spec.source}/apps/web/public/${path}`)),
      `${spec.name} ${path} differs from installed runtime`,
    );
    assets.push({ path, sha256 });
  }
  const model = await (
    await fetch(`http://127.0.0.1:${spec.port}/api/automaticity/transformer`)
  ).json();
  assert.equal(model.enabled, false);
  assert.deepEqual(model.approvals, []);
  for (const key of [
    "daily",
    "recording",
    "restore",
    "history",
    "integrity",
    "routes",
    "recall",
    "cycle",
    "archive",
    "transformer",
    "practice",
  ])
    assert(
      Date.parse(evidence[key].createdAt ?? evidence[key].at) >
        Date.parse(update.createdAt),
      `${key} predates ${spec.name} update`,
    );
  const checkLog = `${spec.source}/artifacts/daily-plan-${spec.check}.log`,
    packageLog = `${spec.source}/artifacts/daily-plan-package.log`;
  const buildReceiptPath = `${spec.source}/artifacts/daily-plan-build-receipt.json`;
  const buildReceipt = await read(buildReceiptPath);
  assert.equal(buildReceipt.version, spec.version);
  assert.equal(buildReceipt.requiredCheckExitCode, 0);
  assert.equal(buildReceipt.packageExitCode, 0);
  assert.equal(
    buildReceipt.practiceSha256.toLowerCase(),
    assets.find((row) => row.path === "learning-core/practice.js").sha256,
  );
  const text = (await bytes(packageLog)).toString("utf8");
  assert(text.includes("Modern Windows setup created successfully."));
  products.push({
    ...spec,
    setupPath,
    setupSha256,
    payloadSha256,
    assets,
    profileFiles: applied.profileFiles,
    profileBytes: applied.profileBytes,
    cycle: args[`${spec.key}-cycle`],
    update: args[`${spec.key}-update`],
    modelEnabled: false,
    logs: [
      { path: buildReceiptPath, sha256: hash(await bytes(buildReceiptPath)) },
      { path: checkLog, sha256: hash(await bytes(checkLog)) },
      { path: packageLog, sha256: hash(await bytes(packageLog)) },
    ],
  });
}
const reportPath = "artifacts/daily-plan-delivery/verification.json",
  docPath = "docs/LANGUAGE-AUTOMATICITY-PHASE-6-2026-09-05.md";
const verifiedTasks = ["U01", "U02", "U03", "U04", "S01", "R02"];
const limitations = {
  physicalMicrophone: "not_tested",
  physicalTouchDevices: "not_tested",
  screenReader: "not_tested",
  actualAsrQuality: "not_tested",
  linguisticReview: "independent_review_pending",
  learnerOutcomes: "unmeasured",
  fullCurriculum: "not_qualified",
  modelAssistance:
    "disabled; no candidate has passed M03 or been selected for learner deployment",
  scheduler: "shadow-only; no candidate due dates activated",
  git: "unavailable; filesystem source capture required",
};
const report = {
  createdAt: new Date().toISOString(),
  status: "verified",
  scope:
    "Phase 6 engineering, shadow-history mapping and the baseline pilot release; not full curriculum or learner effectiveness",
  verifiedTasks,
  products,
  receipts,
  limitations,
  sourceCapture: {
    directory: "artifacts/language-release-source/20260905-daily-en36-de40",
    verification: "pending",
  },
  verificationHistory: {
    mixedModeFailure:
      "artifacts/daily-plan-browser/2026-09-05T17-15-00-876Z/report.json",
    correctedSource:
      "artifacts/daily-plan-browser/2026-09-05T17-18-54-232Z/report.json",
    previousRelease:
      "artifacts/curriculum-revision-delivery/final-verification.json",
  },
};
await mkdir(resolve(root, "artifacts/daily-plan-delivery"), {
  recursive: true,
});
const notes = {
  U01: "Current repairs remain visible across level changes. Oldest due work precedes new work; suggested prerequisites guide cold starts without locking topics. Daily actions use the correct mode and retain stage, exclude held-out/retired items and link repairs to the original response. Mixed writing-repair/speaking-review priority is verified.",
  U02: "The daily card has a goal of 3, 5 or 8 saved responses and a finish/resume action. Counts represent effort only. Exact drafts, selected tasks, recordings and goals survive pause/reload; resumed attempts do not claim uninterrupted timing. Keyboard focus, read-only second tabs and phone/tablet layouts are verified; all 280 topics remain available.",
  U03: "Installed history and evidence routes preserve original responses, clear unsupported inherited CEFR claims, and show practice, assistance, independent accuracy, transfer, retention and timing separately. Daily response goals confer no mastery. Synthetic qualified fixtures verify the reducer and route behavior; no learner outcome is asserted.",
  U04: "Installed offline, backup/restore, microphone refusal, pending permission, active recording, quota and provider-failure paths preserve saved work. Storage-full messages explain recovery. Keyboard focus, reflow, Persian RTL and untimed operation pass. The new practice flow stores responses locally; its Transformer endpoint is disabled and provider configuration is limited to loopback. Existing online-feedback, audio-storage and export preferences are retained separately; no training reuse is inferred. Physical microphone/touch and screen-reader checks remain unperformed and explicitly reported.",
  S01: "The prospective review-event mapping passes 12 installed checks per language with immutable item identity, actual timestamp eligibility, conflict rejection and memory/transfer separation. This engineering task is complete; no ratings were invented, no due dates changed, and real-data scheduler evaluation remains blocked at S02.",
  R02: "English 27.3.36 and DeutschFlow 20.8.40 pass required app checks, exact prior-version upgrade/install/start/update/repair/uninstall, full-profile preservation, installed learning routes and playable-audio backup/restore. This is a baseline pilot release. Transformer assistance is disabled and no qualified deployment is selected, so the model-assisted release condition is not active. M01-M04 and the full-curriculum release remain open.",
};
const backlogPath = "docs/language-automaticity-implementation-backlog.json",
  backlog = await read(backlogPath);
for (const task of backlog.tasks)
  if (verifiedTasks.includes(task.id)) {
    task.status = "verified";
    task.updatedOn = "2026-09-05";
    task.engineeringVerification = "verified_for_recorded_scope";
    task.progressNote = notes[task.id];
    task.evidence = [
      ...new Set([
        ...task.evidence,
        docPath,
        reportPath,
        ...Object.values(receipts).map((row) => row.path),
      ]),
    ];
  }
backlog.updatedOn = "2026-09-05";
backlog.progressRecord = docPath;
backlog.latestEngineeringUpdate = docPath;
Object.assign(backlog.delivery, {
  technicalIncrement: "verified",
  englishVersion: "27.3.36",
  germanVersion: "20.8.40",
  installedEnglishVersion: "27.3.36",
  installedGermanVersion: "20.8.40",
});
backlog.technicalRelease = {
  status: "verified",
  versions: { English: "27.3.36", German: "20.8.40" },
  installedVersions: { English: "27.3.36", German: "20.8.40" },
  fullCurriculum: "not_qualified",
  learnerOutcomes: "unmeasured",
  report: docPath,
};
report.remainingTasks = backlog.tasks
  .filter((task) => task.status !== "verified")
  .map((task) => ({
    id: task.id,
    status: task.status,
    required: task.required,
    title: task.title,
  }));
await writeFile(
  resolve(root, reportPath),
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  resolve(root, backlogPath),
  JSON.stringify(backlog, null, 2) + "\n",
);
const doc = `# Phase 6 and baseline pilot delivery\n\nVerified on 5 September 2026: English **27.3.36** and DeutschFlow **20.8.40**. Phase 6 is complete for its recorded engineering scope, including the previously verified live roadmap. S01's event mapping and R02's baseline pilot delivery also meet their acceptance criteria.\n\n${Object.entries(
  notes,
)
  .map(([id, note]) => `- **${id}:** ${note}`)
  .join(
    "\n",
  )}\n\n## Exact delivery\n\n${products.map((product) => `- **${product.name} ${product.version}:** [installer](../${product.setupPath}); setup SHA-256 \`${product.setupSha256}\`; payload SHA-256 \`${product.payloadSha256}\`. ${product.profileFiles} profile files (${product.profileBytes} bytes) were backed up and hash-verified before startup.`).join("\n")}\n\nThe complete profile comparisons are taken before first startup because the apps legitimately update their profiles during use. The installers are unsigned; the exact lifecycle receipts report whether they ran. No machine security setting was changed. The original 5,042 curriculum tasks and the 506 archived definitions remain preserved; this increment changes daily behavior, not curriculum content or linguistic review status.\n\n## Verification\n\n${Object.entries(
  receipts,
)
  .map(
    ([key, value]) =>
      `- [${key}](../${value.path}), SHA-256 \`${value.sha256}\`.`,
  )
  .join(
    "\n",
  )}\n\nThe browser cases use isolated profiles, synthetic answers and synthetic microphone input. They verify software behavior, not learning gains. Mobile and tablet checks use browser viewports; physical touch devices, a real microphone, ASR quality and screen-reader behavior were not tested. These limitations are part of U04's required reporting.\n\nThe [earlier mixed-mode failure](../${report.verificationHistory.mixedModeFailure}) is retained. It led to prioritising the current writing repair within the same construction before its overdue speaking review. The corrected source and installed tests pass. Earlier pre-routing and pre-accessibility package logs are retained; the hashes above identify the final delivered artifacts.\n\n## Gates still open\n\nIndependent linguistic reviews and calibrated evaluator approvals remain missing for L01, M01-M04 and W01-W05. The [280 review packets](../artifacts/content-review-packets/all-20260905-task-revision2/index.html) cover the active tasks and retain links to their origins. Authored content is not relabelled as human-reviewed.\n\nP01-P03 require learner-authored unaided samples, a prospective practice record and actual 24-hour/7-day follow-ups. S02-S03 and X01-X03 depend on qualified real outcomes; FSRS remains shadow-only and reinforcement learning is deferred. R03 remains blocked by full assessed-curriculum coverage. No automatic or scripted approval can supply these missing observations.\n\nThe browser security policy blocked opening the local review-packet HTML file through automation. The file remains available for manual opening; no alternate route was used to bypass that block.\n\n[Machine-readable delivery receipt](../${reportPath}) records exact hashes, evidence and remaining tasks. The filesystem source snapshot is recorded there after capture; Git metadata is unavailable in this workspace.\n`;
await writeFile(resolve(root, docPath), doc);
console.log(
  JSON.stringify({
    status: "verified",
    verifiedTasks,
    reportPath,
    docPath,
    remainingRequired: report.remainingTasks.filter((task) => task.required)
      .length,
  }),
);
