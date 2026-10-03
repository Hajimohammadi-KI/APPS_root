import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const split = value.indexOf("=");
    assert(value.startsWith("--") && split > 2, "Use --name=path arguments");
    return [value.slice(2, split), value.slice(split + 1)];
  }),
);
for (const key of [
  "english-cycle",
  "german-cycle",
  "english-update",
  "german-update",
  "archive",
  "transformer",
  "restore",
  "routes",
  "content",
  "packets",
  "review-gate",
  "supplementary",
])
  assert(args[key], `Missing --${key}=receipt`);
const read = async (path) => {
  const bytes = await readFile(resolve(root, path));
  return JSON.parse(
    (bytes[0] === 255 && bytes[1] === 254
      ? bytes.toString("utf16le")
      : bytes.toString("utf8")
    ).replace(/^\uFEFF/, ""),
  );
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const evidence = {};
for (const key of [
  "archive",
  "transformer",
  "restore",
  "routes",
  "content",
  "packets",
  "review-gate",
  "supplementary",
]) {
  evidence[key] = await read(args[key]);
  assert.equal(evidence[key].status, "passed", `${key} did not pass`);
}
assert.equal(evidence.archive.cases.length, 2);
assert.equal(evidence.transformer.cases.length, 10);
assert(
  evidence.restore.cases.length === 2 &&
    evidence.restore.cases.every(
      (row) =>
        row.status === "passed" &&
        row.runtime === "installed-desktop" &&
        row.settingsExportRestore.confirmedRestore,
    ),
);
assert(evidence.routes.cases.some((row) => row.startsWith("en: 6 routes")));
assert(evidence.routes.cases.some((row) => row.startsWith("de: 7 routes")));
assert.equal(evidence.content.preservedTasks, 5042);
assert.equal(evidence.content.retiredTasks, 506);
assert.equal(evidence.content.newTasks, 220);
assert.equal(evidence.content.activeTasks, 4756);
const products = [];
for (const product of [
  {
    name: "English",
    key: "english",
    language: "en",
    source: "Apps/English/English-Automaticity",
    directory: "English Grammar Automaticity Desktop",
    setup: "EnglishGrammar",
    port: 3202,
    api: "http://127.0.0.1:4201/api/health",
  },
  {
    name: "German",
    key: "german",
    language: "de",
    source: "Apps/Deutsch-Automaticity",
    directory: "DeutschFlow",
    setup: "DeutschFlow",
    port: 3210,
    api: "http://127.0.0.1:4210/api/v1/health",
  },
]) {
  const { version } = await read(
    product.source +
      "/distribution/windows-modern/language-release-config.json",
  );
  const cycle = await read(args[product.key + "-cycle"]),
    update = await read(args[product.key + "-update"]);
  assert.equal(cycle.version, version);
  for (const key of [
    "install",
    "upgrade",
    "startup",
    "update",
    "repair",
    "uninstall",
    "transformerOrigin",
  ])
    assert.equal(cycle[key], "verified");
  assert.equal(cycle.learnerDataPreserved, true);
  assert.equal(update.status, "verified");
  const preserved = update.products.find((row) => row.product === product.name);
  assert.equal(preserved.version, version);
  assert.equal(preserved.profilePreservedBeforeStartup, true);
  for (const key of ["archive", "transformer", "restore", "routes"])
    assert(
      Date.parse(evidence[key].at ?? evidence[key].createdAt) >
        Date.parse(update.createdAt),
      `${key} predates installed update`,
    );
  assert.equal(
    (
      await readFile(
        resolve(
          process.env.LOCALAPPDATA,
          "Programs",
          product.directory,
          "version.txt",
        ),
        "utf8",
      )
    ).trim(),
    version,
  );
  const setupPath =
    product.source +
    `/apps/web/public/downloads/${product.setup}-Setup-v${version}.exe`;
  const setupSha256 = hash(await readFile(resolve(root, setupPath)));
  const payloadSha256 = hash(
    await readFile(resolve(root, setupPath.replace(/\.exe$/, ".payload.zip"))),
  );
  assert.equal(setupSha256, cycle.setupSha256.toLowerCase());
  assert.equal(payloadSha256, cycle.payloadSha256.toLowerCase());
  assert.equal(setupSha256, preserved.setupSha256.toLowerCase());
  assert.equal(payloadSha256, preserved.payloadSha256.toLowerCase());
  const assets = [];
  for (const path of [
    "learning-core/practice.js",
    "learning-core/overview.js",
    `learning-core/curriculum-${product.language}.json`,
    "sw.js",
  ]) {
    const response = await fetch(`http://127.0.0.1:${product.port}/${path}`);
    assert.equal(response.status, 200);
    const sha256 = hash(Buffer.from(await response.arrayBuffer()));
    assert.equal(
      sha256,
      hash(
        await readFile(resolve(root, product.source, "apps/web/public", path)),
      ),
    );
    assets.push({ path, sha256 });
  }
  const curriculum = assets.find((row) =>
    row.path.endsWith(`curriculum-${product.language}.json`),
  );
  assert.equal(curriculum.sha256, cycle.sourceCurriculumSha256.toLowerCase());
  assert.equal((await fetch(product.api)).status, 200);
  const endpoint = await fetch(
    `http://127.0.0.1:${product.port}/api/automaticity/transformer`,
  );
  assert.equal(endpoint.status, 200);
  assert.deepEqual(await endpoint.json(), { enabled: false, approvals: [] });
  products.push({
    ...product,
    version,
    setupPath,
    setupSha256,
    payloadSha256,
    assets,
    profileFiles: preserved.profileFiles,
    profileBytes: preserved.profileBytes,
    cycle: args[product.key + "-cycle"],
    update: args[product.key + "-update"],
    modelEnabled: false,
  });
}
const reportPath =
  "artifacts/curriculum-revision-delivery/final-verification.json";
const sourceDirectory =
  "artifacts/language-release-source/20260905-curriculum-en35-de39";
await mkdir(resolve(root, "artifacts/curriculum-revision-delivery"), {
  recursive: true,
});
await writeFile(
  resolve(root, reportPath),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      engineeringDelivery: "verified",
      sourceCapture: { directory: sourceDirectory, verification: "pending" },
      verificationHistory: {
        earlierGermanStartupFailure:
          "artifacts/installer-cycle/German-20260905-184318-50b499ea/report.json",
        repeatedExactArtifact: args["german-cycle"],
        startupFailureCause: "not_established",
        earlierGermanApiTestTimeout:
          "Apps/Deutsch-Automaticity/artifacts/curriculum-revision-final-verify-api-timeout.log",
        browserNavigationObservations:
          "artifacts/installed-navigation/2026-09-05T16-57-45-378Z/report.json",
      },
      content: evidence.content,
      products,
      evidence: args,
      fullCurriculum: "not_qualified",
      learnerOutcomes: "unmeasured",
      modelActivation: "disabled",
    },
    null,
    2,
  ) + "\n",
);
const docPath = "docs/LANGUAGE-AUTOMATICITY-TASK-REVISIONS-2026-09-05.md";
const doc = `# Curriculum task revisions\n\nUpdated 5 September 2026. English **${products[0].version}** and DeutschFlow **${products[1].version}** are installed and running. This release improves the independent practice curriculum and preserves historical work.\n\n## What changed\n\nAcross 119 constructions, 506 unsuitable tasks are retired and 220 replacements are available. All 5,042 original task definitions remain unchanged. The curriculum now has 280 constructions, 4,756 active tasks and 506 archived definitions. All 3,906 required cells still have authored tasks.\n\n- English retrieval now asks for original sentences from a meaning or use cue. Retired exercises included copying a visible model, stating a grammar rule, and repairing an unspecified sentence.\n- German changes target haben forms, können with the infinitive, verb position with weil, relative pronouns, nominalisation and time expressions. Repairs preserve the original meaning. For example, the relative-clause repair now accepts the complete sentence “Das ist der Mann, den ich sehe.” Open reformulations remain unassessed until reviewed.\n- Speaking replacements ask for spoken answers. Spelling-only tasks retain their declared modality exclusions.\n- New task selection excludes retired exercises. Old links and drafts open an archive with a read-only response and a button to the replacement. The original attempt and draft remain unchanged, and the replacement starts separately. Retired task IDs cannot invoke the Transformer route.\n\nThese changes apply to the shared independent practice route. They are not a claim that every legacy guided exercise has been rewritten or that the full curriculum has received independent linguistic review. The new tasks are explicitly model-authored.\n\n## Review and coverage\n\nThe [current review index](../artifacts/content-review-packets/all-20260905-task-revision2/index.html) includes 280 packets covering all 4,756 active tasks and 3,906 required cells. Retired definitions are retained as history and excluded from new approval. Earlier packet sets remain preserved. The review ledger is still empty, and the full release gate correctly remains unqualified. W01-W04 remain in progress; W05 remains blocked on independent reviews and assessment qualification.\n\nGrammar references used for these targeted corrections include [British Council: present simple be](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/present-simple-be), [IDS grammis: relative pronouns](https://grammis.ids-mannheim.de/progr%40mm/6867) and [IDS grammis: sentence brackets](https://grammis.ids-mannheim.de/systematische-grammatik/1241). These sources do not certify the generated task set.\n\n## Delivery verification\n\nBoth full app checks passed, followed by exact-hash installer lifecycle tests and normal installed updates. The lifecycle checks cover install, upgrade, startup, update, repair and uninstall. Complete normal-profile backups and byte comparisons occurred before startup. Isolated installed-browser checks cover archived drafts, new responses, all 13 evidence routes, offline practice, audio export/restore and 10 Transformer API/client cases. No real learner responses were generated by these tests.\n\n${products.map((row) => `- ${row.name} **${row.version}**: ${row.profileFiles} profile files (${row.profileBytes.toLocaleString("en-US")} bytes) preserved before startup. Setup: [${row.setup}-Setup-v${row.version}.exe](../${row.setupPath}). SHA-256: \`${row.setupSha256}\`.`).join("\n")}\n\n- [Final delivery receipts](../${reportPath}) pin the installers, payloads, live assets, updates and test reports.\n- [Source manifest](../${sourceDirectory}/manifest.json) and [hash verification](../${sourceDirectory}/verification.json) identify the final filesystem source capture. Git metadata is unavailable; no clean-commit claim is made.\n- Required check logs: English \`artifacts/curriculum-revision-final-check.log\` and German \`artifacts/curriculum-revision-final-verify.log\`, inside their respective app directories.\n\nThe packages are local and unsigned. Public web deployment parity is not asserted. The Transformer remains disabled, FSRS remains in shadow mode, and learner automaticity and delayed transfer remain unmeasured.\n`;
await writeFile(
  resolve(root, docPath),
  doc +
    "\n## Retained verification history\n\nThe first lifecycle run of the final German artifact did not open its web/API ports within 180 seconds. The exact same setup and payload passed the repeated full cycle, with startup in 12.5 seconds, and the normal installed update then passed. Both receipts remain available; the first failure's cause is not established. An earlier German API test also exceeded its five-second startup fixture limit; the unchanged full check passed on rerun.\n\n[Fresh Edge observations](../artifacts/installed-navigation/2026-09-05T16-57-45-378Z/report.json) recorded initial browser navigation of about 15.3-15.6 seconds while direct HTTP responses took 26-31 ms. Two browser verifiers previously used a 15-second navigation ceiling. They now use the other suites' 30-second navigation limit and retain 15-second interaction checks. This is a test-harness correction, not a claimed application performance fix.\n",
);
const backlogPath = "docs/language-automaticity-implementation-backlog.json",
  backlog = await read(backlogPath);
const versions = Object.fromEntries(
  products.map((row) => [row.name, row.version]),
);
backlog.technicalRelease = {
  ...backlog.technicalRelease,
  status: "verified",
  versions,
  installedVersions: versions,
  report: docPath,
};
Object.assign(backlog.delivery, {
  technicalIncrement: "verified",
  englishVersion: versions.English,
  germanVersion: versions.German,
  installedEnglishVersion: versions.English,
  installedGermanVersion: versions.German,
});
backlog.progressRecord = docPath;
backlog.latestEngineeringUpdate = docPath;
const notes = {
  B01: `Installed English ${versions.English} and DeutschFlow ${versions.German} serve the verified source assets and pass API/HTTP/browser checks. Original route/storage baseline remains available; thesis work is outside scope.`,
  C04: "Coverage validation passes for all 3906 required cells using active tasks only. Retired definitions remain in history and cannot receive new release approval. All 51 strict review-gate checks pass; no independent reviewer approval is invented.",
  W05: "Structural coverage passes for 3906 required cells and 4756 active tasks. All 280 current packets retain 506 archived definitions as history and exclude them from new approval. Independent linguistic and assessment reviews remain absent, so the full release gate correctly stays unqualified.",
  R02: `English ${versions.English} and DeutschFlow ${versions.German} are installed and running. Full app checks, exact installer lifecycle, normal-profile preservation, 13 evidence routes, offline/audio restore, archived-draft preservation and 10 Transformer browser/API cases passed. Packages are unsigned; the model remains disabled and full curriculum and learner evidence gates remain open.`,
};
for (const id of ["W01", "W02", "W03", "W04"])
  notes[id] =
    "All declared family targets have authored tasks. This increment replaces 506 unsuitable tasks across 119 constructions with 220 new tasks, preserving every original definition and saved-work identity. Current review packets cover 4756 active tasks and 3906 cells. Independent linguistic review, accepted alternatives and qualified assessment remain open.";
for (const [id, note] of Object.entries(notes)) {
  const task = backlog.tasks.find((row) => row.id === id);
  task.progressNote = note;
  task.updatedOn = "2026-09-05";
  task.evidence = [
    ...new Set([
      ...task.evidence,
      docPath,
      reportPath,
      ...Object.values(args),
      "artifacts/content-review-packets/all-20260905-task-revision2/index.html",
    ]),
  ];
}
const revisionTask = {
  id: "W06",
  phase: "expansion",
  title: "Replace defective tasks without losing saved work",
  status: "verified",
  priority: "P1",
  required: true,
  condition: null,
  dependsOn: ["C03", "E03"],
  ownerRole: "Implementation",
  touchpoints: ["core", "en_content", "de_content", "release"],
  updatedOn: "2026-09-05",
  engineeringVerification: "verified_for_recorded_scope",
  deliverable:
    "Targeted task revisions, reusable retirement metadata and archive behavior in both installed apps.",
  acceptance: [
    "Preserve every original task definition and its stable ID.",
    "Exclude retired tasks from new selection and model assessment; preserve old links and drafts in a read-only archive.",
    "Verify corrected task behavior, complete app checks, exact installer lifecycle and installed browser preservation.",
    "Keep new content authored and leave independent curriculum review open.",
  ],
  progressNote:
    "Verified for this increment: 506 tasks retired, 220 replacements added across 119 constructions, all 5042 original definitions preserved. Both installed apps preserve archived drafts/attempts, start replacement drafts separately and exclude retired tasks from selection. Full linguistic review remains separate.",
  evidence: [docPath, reportPath, ...Object.values(args)],
};
const existing = backlog.tasks.findIndex((row) => row.id === "W06");
if (existing < 0)
  backlog.tasks.splice(
    backlog.tasks.findIndex((row) => row.id === "W05") + 1,
    0,
    revisionTask,
  );
else backlog.tasks[existing] = revisionTask;
await writeFile(
  resolve(root, backlogPath),
  JSON.stringify(backlog, null, 2) + "\n",
);
console.log(
  JSON.stringify({ reportPath, versions, fullCurriculum: "not_qualified" }),
);
