import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  hash = (b) => createHash("sha256").update(b).digest("hex");
const bytes = (p) => readFile(resolve(root, p));
const read = async (p) => {
  const b = await bytes(p);
  return JSON.parse(
    (b[0] === 255 ? b.toString("utf16le") : b.toString("utf8")).replace(
      /^\uFEFF/,
      "",
    ),
  );
};
const inputs = await read("artifacts/l01-assessment/delivery-inputs.json"),
  evidence = {},
  receipts = {};
for (const key of [
  "english-cycle",
  "german-cycle",
  "english-update",
  "german-update",
  "browser",
  "practice",
  "restore",
  "archive",
  "daily",
]) {
  assert(inputs[key], `Missing ${key}`);
  evidence[key] = await read(inputs[key]);
  receipts[key] = { path: inputs[key], sha256: hash(await bytes(inputs[key])) };
  if (evidence[key].status)
    assert(
      ["passed", "verified"].includes(evidence[key].status),
      `${key} failed`,
    );
  if (evidence[key].cases)
    assert(
      evidence[key].cases.every(
        (row) =>
          typeof row === "string" ||
          ["verified", "passed"].includes(row.status),
      ),
      `${key} contains failed cases`,
    );
}
assert.match(evidence.browser.scope, /Installed/);
assert.equal(evidence.browser.cases.length, 12);
assert(evidence.browser.cases.every((row) => row.checks.length === 6));
const assessment = await read(
  "artifacts/l01-assessment/assessment-verification.json",
);
assert.equal(assessment.preservedTasks, 5262);
assert.equal(assessment.newTasks, 168);
assert.equal(assessment.scopes.length, 12);
const review = await read("artifacts/l01-assessment/review-gate.json");
assert.equal(review.status, "pending_independent_review");
assert.equal(review.reviewedCells, 0);
assert.equal(review.evaluatorApprovedCells, 0);
assert.deepEqual(
  (await read("docs/automaticity-representative-reviews.json")).reviews,
  [],
);
const products = [];
for (const spec of [
  {
    key: "english",
    name: "English",
    language: "en",
    version: "27.3.37",
    previous: "27.3.36",
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
    version: "20.8.41",
    previous: "20.8.40",
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
    assert.equal(cycle[key], "verified");
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
  for (const receipt of [cycle, applied]) {
    assert.equal(receipt.setupSha256.toLowerCase(), setupSha256);
    assert.equal(receipt.payloadSha256.toLowerCase(), payloadSha256);
  }
  const built = await read(`${spec.source}/artifacts/l01-build-receipt.json`);
  assert.equal(built.version, spec.version);
  assert.equal(built.checkExit, 0);
  assert.equal(built.packageExit, 0);
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
  for (const asset of [
    "practice.js",
    "automaticity-v2.js",
    `curriculum-${spec.language}.json`,
  ]) {
    const response = await fetch(
      `http://127.0.0.1:${spec.port}/learning-core/${asset}`,
    );
    assert.equal(response.status, 200);
    const sha256 = hash(Buffer.from(await response.arrayBuffer()));
    assert.equal(
      sha256,
      hash(
        await bytes(`${spec.source}/apps/web/public/learning-core/${asset}`),
      ),
    );
    assets.push({ asset, sha256 });
  }
  const model = await (
    await fetch(`http://127.0.0.1:${spec.port}/api/automaticity/transformer`)
  ).json();
  assert.equal(model.enabled, false);
  assert.deepEqual(model.approvals, []);
  for (const key of ["browser", "practice", "restore", "archive", "daily"])
    assert(
      Date.parse(evidence[key].at ?? evidence[key].createdAt) >
        Date.parse(update.createdAt),
      `${key} predates update`,
    );
  products.push({
    ...spec,
    setupPath,
    setupSha256,
    payloadSha256,
    assets,
    profileFiles: applied.profileFiles,
    profileBytes: applied.profileBytes,
  });
}
const reportPath = "artifacts/l01-assessment/delivery-verification.json",
  docPath = "docs/LANGUAGE-AUTOMATICITY-L01-2026-09-05.md";
const report = {
  at: new Date().toISOString(),
  status: "engineering_verified",
  l01Status: "pending_independent_review",
  products,
  receipts,
  preservedTasks: 5262,
  newTasks: 168,
  boundedWritingTasks: 48,
  humanReviewTasks: 120,
  scopes: 12,
  limitations: {
    ruleScope: "Bounded sentence grammars only; unsupported forms abstain.",
    independentLanguageReview: "pending",
    qualifiedAutomaticEvaluator: false,
    learnerOutcomes: "unmeasured",
    fullCurriculum: "not_qualified",
    publicDeployment: "not_updated",
  },
  sourceCapture: {
    directory: "artifacts/language-release-source/20260905-l01-en37-de41",
    verification: "pending",
  },
};
await writeFile(
  resolve(root, reportPath),
  JSON.stringify(report, null, 2) + "\n",
);
const reviewManifest = await read(
  "artifacts/l01-assessment/review-manifest.json",
);
const document = `# L01 representative grammar assessment\n\nDelivered locally on 5 September 2026 in English **27.3.37** and DeutschFlow **20.8.41**. The representative implementation and engineering checks are complete. L01 remains open for recorded independent language review and approval of the scoped assessment paths.\n\nThe apps now contain **12 construction scopes and 168 new tasks** across inflection, valency, temporal meaning, clause order, modal passive and contrast. Each language has six scopes; each scope covers seven stages in writing and speaking. All **5,262 previous task definitions** and 506 retired-task records are preserved. There are now 4,924 active tasks in the full catalog.\n\n48 bounded writing tasks use construction-specific parsing. The checker consumes the complete sentence, checks grammatical form, extracts participants and other meaning features, and compares them with the task situation. Valid supported variants pass without being stored in acceptedAnswers. Reversed roles or changed time/action fail relevance without being mislabelled ungrammatical. Contrast tasks distinguish causal from concessive linking. Capitalization remains part of writing. Unsupported wording is saved without a correctness score.\n\nThe other 120 tasks use explicit review paths: noticing, original production, transfer and all speaking tasks. Spoken work requires listening to the original recording; typed transcripts do not establish spoken accuracy. The bounded rule evaluator remains unapproved for mastery. No human review, model qualification or learner outcome was fabricated.\n\n389 focused assessment/evidence tests passed, including 334 representative cases. Both required app checks passed. Installed browser tests exercised all 12 scopes through Grammar topic selection, alternative answers, errors and linked repair, role mismatches, abstention, transfer review and speaking fallback. Installer tests verified fresh install, exact previous-version upgrade, startup, update, repair, uninstall and data preservation. Normal-profile updates preserved ${products.map((p) => p.name + ": " + p.profileFiles + " files / " + p.profileBytes + " bytes").join("; ")}.\n\nThe rules use authored examples informed by [British Council grammar references](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-prepositions) and [IDS grammar references](https://grammis.ids-mannheim.de/progr%40mm/6851). Sources are recorded for each scope; checking sources is not independent approval of these tasks.\n\nThe review gate covers only this representative subset. Full-family coverage and seven-day learner results are separate work. It currently reports **0 of 168 cells reviewed and approved**. Review packets contain the tasks, source links, regression results, manual assessment procedure and blank evidence forms. They are at [the review guide](../artifacts/l01-assessment/${reviewManifest.directory}/README.md). Record genuine completed evidence in docs/automaticity-representative-reviews.json and run bun scripts/check-representative-review.ts --release. These records cannot approve the rest of the curriculum or activate a runtime evaluator.\n\nThe browser suite initially attempted to edit an already submitted, locked response; it was corrected to use the app's explicit repair action. Historical verification helpers were updated for the new, preserved task subset. A root-level test run lacked app dependencies; the same tests passed in the synchronized app workspace. All failed logs remain available.\n\nEvidence: [delivery receipt](../${reportPath}), [assessment and preservation](../artifacts/l01-assessment/assessment-verification.json), [review gate](../artifacts/l01-assessment/review-gate.json). Public web deployments were not updated.\n`;
await writeFile(resolve(root, docPath), document);
const backlogPath = "docs/language-automaticity-implementation-backlog.json",
  backlog = await read(backlogPath),
  l01 = backlog.tasks.find((t) => t.id === "L01");
l01.status = "in_progress";
l01.engineeringVerification = "verified_for_recorded_scope";
l01.updatedOn = "2026-09-05";
l01.progressNote =
  "12 bounded English/German construction scopes and 168 tasks are implemented and verified in installed English 27.3.37 / DeutschFlow 20.8.41. 389 focused tests pass; valid alternatives, intended grammar, meaning/roles, abstention, repair and review routes are checked. 5,262 previous tasks are preserved. Independent content review and scoped evaluator approval remain pending (0/168 representative cells); full-curriculum coverage and seven-day learner results are separate gates.";
l01.evidence = [
  ...new Set([
    ...l01.evidence,
    docPath,
    reportPath,
    "shared/learning-core/src/automaticity/construction-rules.ts",
    "shared/learning-core/src/automaticity/representative-tasks.ts",
    "artifacts/l01-assessment/assessment-verification.json",
    "artifacts/l01-assessment/review-gate.json",
    "docs/automaticity-representative-reviews.json",
    ...Object.values(inputs),
  ]),
];
Object.assign(backlog.delivery, {
  englishVersion: "27.3.37",
  germanVersion: "20.8.41",
  installedEnglishVersion: "27.3.37",
  installedGermanVersion: "20.8.41",
});
Object.assign(backlog.technicalRelease, {
  versions: { English: "27.3.37", German: "20.8.41" },
  installedVersions: { English: "27.3.37", German: "20.8.41" },
  report: docPath,
});
backlog.latestEngineeringUpdate = docPath;
backlog.updatedOn = "2026-09-05";
await writeFile(
  resolve(root, backlogPath),
  JSON.stringify(backlog, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: report.status,
    l01: l01.status,
    products: products.map((p) => [p.name, p.version]),
    reportPath,
  }),
);
