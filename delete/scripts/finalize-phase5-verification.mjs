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
const read = async (path) => {
  const bytes = await readFile(resolve(root, path));
  return JSON.parse(
    (bytes[0] === 255 && bytes[1] === 254
      ? bytes.toString("utf16le")
      : bytes.toString("utf8")
    ).replace(/^\uFEFF/, ""),
  );
};
const evidence = {};
const receipts = {};
for (const key of [
  "practice",
  "recording",
  "reviews",
  "recall",
  "cycle",
  "routes",
  "archive",
  "restore",
]) {
  assert(args[key], `Missing --${key}=receipt`);
  evidence[key] = await read(args[key]);
  assert.equal(evidence[key].status, "passed", `${key} failed`);
  receipts[key] = {
    path: args[key],
    sha256: createHash("sha256")
      .update(await readFile(resolve(root, args[key])))
      .digest("hex"),
  };
}
for (const key of ["practice", "recording", "reviews", "recall", "restore"]) {
  assert.equal(evidence[key].cases.length, 2);
  assert(evidence[key].cases.every((row) => row.status === "passed"));
}
assert.match(evidence.practice.scope, /Installed apps/);
assert.match(evidence.reviews.scope, /Installed/);
assert(
  evidence.recall.cases.every(
    (row) => row.runtime === "installed-desktop" && row.checks.length === 12,
  ),
);
assert(
  evidence.recording.cases.every(
    (row) =>
      row.evidence.audio.persisted &&
      row.storedHashVerified &&
      row.microphoneDenialPreservedDraft &&
      row.evidence.verdict === "not_assessed" &&
      row.evidence.response.originalTranscriptSha256 === null &&
      row.evidence.scopeApproved === false,
  ),
);
assert.equal(evidence.cycle.cases.length, 4);
assert(evidence.cycle.cases.every((row) => row.status === "passed"));
assert.equal(evidence.archive.cases.length, 2);
assert.match(evidence.routes.scope, /Installed apps/);
const delivery = await read(
  "artifacts/curriculum-revision-delivery/final-verification.json",
);
assert.equal(delivery.engineeringDelivery, "verified");
for (const product of delivery.products) {
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
    product.version,
  );
  const update = await read(product.update);
  for (const [key, value] of Object.entries(evidence))
    assert(
      Date.parse(value.at ?? value.createdAt) > Date.parse(update.createdAt),
      `${key} predates the installed update`,
    );
}
const reportPath = "artifacts/phase5-delivery/verification.json";
const docPath = "docs/LANGUAGE-AUTOMATICITY-PHASE-5-2026-09-05.md";
const packetIndex =
  "artifacts/content-review-packets/all-20260905-task-revision2/index.html";
await mkdir(resolve(root, "artifacts/phase5-delivery"), { recursive: true });
const report = {
  createdAt: new Date().toISOString(),
  engineeringScope:
    "Phase 5 functional architecture on installed English 27.3.35 and DeutschFlow 20.8.39",
  verifiedTasks: ["L02", "L03", "L04", "L05"],
  incompleteTasks: [
    {
      id: "L01",
      reason:
        "Representative packs remain authored; independent linguistic review and qualified assessment evidence are absent.",
    },
  ],
  receipts,
  delivery: "artifacts/curriculum-revision-delivery/final-verification.json",
  learnerOutcomes: "unmeasured",
  physicalMicrophone: "not_tested",
  actualAsrQuality: "not_tested",
  fullCurriculum: "not_qualified",
};
await writeFile(
  resolve(root, reportPath),
  JSON.stringify(report, null, 2) + "\n",
);
const doc = `# Phase 5 verification\n\nUpdated 5 September 2026. **L02, L03, L04 and L05 meet their recorded engineering acceptance criteria** on installed English 27.3.35 and DeutschFlow 20.8.39. L01 remains in progress because its deliverable includes reviewed bilingual construction packs.\n\n| Task | Status | Verified scope |\n| --- | --- | --- |\n| L01: construction validators and tasks | In progress | The current packs and targeted corrections are authored. Controlled checks abstain on unsupported alternatives, and open responses use the review path. Independent linguistic review and qualified representative evaluators remain missing. |\n| L02: audio and timing | Verified | Browser MediaRecorder stores playable, hash-checked audio. Permission refusal preserves the draft. Typed transcripts and absent, empty, unpersisted or edited speech evidence cannot establish spoken success. Untimed responses retain qualified accuracy without a response-time claim. |\n| L03: Daily and Grammar | Verified | Both installed language routes use the shared evidence. Actual UI checks cover saved drafts, hints/model exposure, linked repair, reload, back/forward navigation, exact assets and offline restore. |\n| L04: remaining learning routes and review | Verified | Six English and seven German routes agree on the same original response and next repair. Separate review drafts preserve original responses and recordings. Synthetic reviewed verdicts recompute progress; unsupported local reviews cannot approve their own scope. Prospective review checks enforce elapsed time, task identity and exposure. |\n| L05: representative full cycle | Verified architecture | Four installed-browser cases cover both languages and both productive modes through production, feedback, repair, new-context transfer and simulated next-day/next-week review. Repair adds no independent success; the original failure remains in the denominator. A superseding review recomputes the result without changing original events. |\n\nThe full-cycle clock, judgments and response/audio metadata are synthetic fixtures in isolated browser contexts. Separate installed UI and recording tests exercise actual browser behavior. These checks do not prove learner improvement, actual ASR quality, physical microphone compatibility or screen-reader accessibility. Those limitations remain in the accessibility and pilot work; they are not hidden by these four green architecture cards.\n\n## Evidence\n\n${Object.entries(
  receipts,
)
  .map(
    ([name, row]) => `- [${name}](../${row.path}): SHA-256 \`${row.sha256}\`.`,
  )
  .join(
    "\n",
  )}\n- [Exact versions, installers and profile preservation](../artifacts/curriculum-revision-delivery/final-verification.json).\n- [Phase 5 acceptance record](../${reportPath}).\n\n## Remaining L01 review\n\nThe [current review packets](../${packetIndex}) provide prompts, accepted answers, alternatives, prerequisites and explicit review forms. The ledger contains no completed independent reviews. A model-authored correction or a passing software test cannot be relabelled as human linguistic review. The complete curriculum, model qualification, delayed learner outcomes and scheduler/RL experiments remain separate open gates.\n`;
await writeFile(
  resolve(root, docPath),
  doc +
    "\n## Navigation observation\n\nThe recording and review verifiers retain their 15-second interaction checks and now allow 30 seconds for navigation, matching the other installed-browser suites. Fresh Edge navigation was measured at approximately 15.3-15.6 seconds while direct HTTP completed in 26-31 ms. Earlier timed-out runs are retained. These functional checks do not establish a navigation-performance target or resolve the cause of that browser delay; see the [recorded observations](../artifacts/installed-navigation/2026-09-05T16-57-45-378Z/report.json).\n",
);
const path = "docs/language-automaticity-implementation-backlog.json",
  backlog = await read(path);
const notes = {
  L01: "Targeted revisions and all existing representative task paths are implemented; unsupported judgments abstain. New tasks remain authored. The deliverable still requires independent linguistic review of bilingual construction packs and qualified assessment evidence. Current review packets and installed verification are ready; no human review has been invented.",
  L02: "Verified against the recorded architecture criteria on installed EN 27.3.35 / DE 20.8.39: real browser MediaRecorder with synthetic input, hash-checked playback, permission refusal preserving drafts, typed/edited transcript exclusion and untimed accuracy without timing claims. Physical microphone, actual ASR-quality and screen-reader checks remain separate unverified product limitations.",
  L03: "Verified on both installed Daily/Grammar routes: shared evidence and exact canonical assets, start/respond/model exposure/linked repair, reload and back/forward draft preservation, offline storage and complete backup restore. This verifies route integration; full reviewed curriculum coverage remains open under L01/W05.",
  L04: "Verified architecture on all 13 installed evidence routes. Original responses, review drafts and recordings are preserved. Superseding synthetic reviews recompute progress; local reviews cannot approve their own scope. Both languages pass the review-draft UI and 12 prospective-recall checks for elapsed time, exact identity, conflicts and exposure. No actual reviewer qualification is claimed.",
  L05: "Verified architecture: four installed-browser cycles cover English/German writing/speaking through production, feedback, repair, novel-context transfer and simulated next-day/next-week review. Failed attempts stay in the denominator and linked repair adds no independent success. Actual UI/recording/restore checks also pass. Full curriculum and real learning outcomes remain incomplete.",
};
for (const [id, note] of Object.entries(notes)) {
  const task = backlog.tasks.find((row) => row.id === id);
  task.progressNote = note;
  task.updatedOn = "2026-09-05";
  task.evidence = [
    ...new Set([...task.evidence, docPath, reportPath, ...Object.values(args)]),
  ];
  if (id !== "L01") {
    task.status = "verified";
    task.engineeringVerification = "verified_for_recorded_scope";
  }
}
const m04 = backlog.tasks.find((row) => row.id === "M04");
m04.progressNote = m04.progressNote.replace(
  "33 adapter tests",
  "34 adapter tests including retired-task rejection",
);
backlog.progressRecord = docPath;
backlog.latestEngineeringUpdate = docPath;
await writeFile(resolve(root, path), JSON.stringify(backlog, null, 2) + "\n");
console.log(
  JSON.stringify({
    reportPath,
    verifiedTasks: report.verifiedTasks,
    remaining: report.incompleteTasks,
  }),
);
