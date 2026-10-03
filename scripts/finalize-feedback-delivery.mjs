import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const base = "artifacts/assessment-feedback-delivery";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const bytes = (path) => readFile(resolve(root, path));
const json = async (path) => {
  const value = await bytes(path);
  return JSON.parse((value[0] === 255 ? value.toString("utf16le") : value.toString("utf8")).replace(/^\uFEFF/, ""));
};
const inputs = await json(`${base}/inputs.json`), evidence = {}, receipts = {};
for (const key of ["english-cycle", "german-cycle", "english-update", "german-update", "feedback", "representative", "practice", "restore", "review", "daily", "packets", "import", "model", "bandit"]) {
  assert(inputs[key], `Missing evidence: ${key}`);
  const value = await json(inputs[key]);
  if (value.status) assert(["passed", "verified"].includes(value.status), `${key}: ${value.status}`);
  if (value.cases) assert(value.cases.every(row => typeof row === "string" || ["passed", "verified"].includes(row.status)), `${key}: failed case`);
  evidence[key] = value;
  receipts[key] = { path: inputs[key], sha256: hash(await bytes(inputs[key])) };
}
assert.match(evidence.feedback.scope, /^Installed/);
assert.equal(evidence.feedback.cases.length, 2);
assert(evidence.feedback.cases.every(row => row.checks.length === 4));
assert.match(evidence.representative.scope, /^Installed/);
assert.equal(evidence.representative.cases.length, 12);
assert.equal(evidence.packets.tasks, 4924);
assert.equal(evidence.packets.constructions, 280);
assert.equal(evidence.import.checks.length, 16);
assert.equal(evidence.model.checks.length, 18);
assert.equal(evidence.bandit.active, false);
assert.equal(evidence.bandit.readiness.readyForLiveUse, false);
assert.equal(evidence.bandit.observations.length, 0);
assert.equal(evidence.bandit.sourceSha256, hash(await bytes("scripts/lib/practice-bandit.ts")));
for (const ledger of ["docs/automaticity-release-reviews.json", "docs/automaticity-representative-reviews.json"])
  assert.deepEqual((await json(ledger)).reviews, [], "Do not silently change review claims");
const products = [];
for (const spec of [
  {key:"english",name:"English",language:"en",version:"27.3.38",previous:"27.3.37",source:"Apps/English/English-Automaticity",directory:"English Grammar Automaticity Desktop",setup:"EnglishGrammar",port:3202,release:"english-grammar-update.json"},
  {key:"german",name:"German",language:"de",version:"20.8.42",previous:"20.8.41",source:"Apps/Deutsch-Automaticity",directory:"DeutschFlow",setup:"DeutschFlow",port:3210,release:"deutschflow-update.json"}
]) {
  const cycle = evidence[`${spec.key}-cycle`], update = evidence[`${spec.key}-update`];
  assert.equal(cycle.version, spec.version); assert.equal(cycle.previousVersion, spec.previous);
  for (const action of ["install","upgrade","startup","update","repair","uninstall","transformerOrigin"]) assert.equal(cycle[action], "verified");
  assert.equal(cycle.learnerDataPreserved, true);
  const applied = update.products.find(row => row.product === spec.name);
  assert.equal(applied.version, spec.version); assert.equal(applied.previousVersion, spec.previous);
  assert.equal(applied.profilePreservedBeforeStartup, true); assert.equal(applied.httpStatus, 200);
  const setupPath = `${spec.source}/apps/web/public/downloads/${spec.setup}-Setup-v${spec.version}.exe`;
  const setupSha256 = hash(await bytes(setupPath)), payloadSha256 = hash(await bytes(setupPath.replace(/\.exe$/, ".payload.zip")));
  for (const receipt of [cycle, applied]) {
    assert.equal(receipt.setupSha256.toLowerCase(), setupSha256);
    assert.equal(receipt.payloadSha256.toLowerCase(), payloadSha256);
  }
  const originalBuild = await json(`${spec.source}/artifacts/feedback-build-initial-receipt.json`);
  assert.equal(originalBuild.checkExit, 0); assert.equal(originalBuild.packageExit, 1); assert.equal(originalBuild.version, spec.version);
  const oldLog = await bytes(`${spec.source}/artifacts/feedback-release-first-package.log`);
  assert.match(oldLog.toString(), /Language release configuration does not match setup.config.json/);
  for (const config of ["setup.config.json", "language-release-config.json"]) assert.equal((await json(`${spec.source}/distribution/windows-modern/${config}`)).version, spec.version);
  const release = await json(`releases/${spec.release}`);
  assert.equal(release.version, spec.version);
  assert.equal(release.payloadSha256.toLowerCase(), payloadSha256);
  assert.equal(release.sha256.toLowerCase(), hash(await bytes(`releases/${release.fileName}`)));
  const recovery = {
    ...originalBuild, finishedAt:new Date().toISOString(), packageExit:0,
    recovery:{initialReceipt:`${spec.source}/artifacts/feedback-build-initial-receipt.json`,initialPackageExit:1,
      cause:"Release configuration retained the previous version; full application and installer builds had completed successfully.",
      action:"Synchronized language-release-config.json and reran only local release-package publication. No app runtime source changed. Targeted installer checks and both exact lifecycle tests then passed.",
      releaseManifest:`releases/${spec.release}`,releaseSha256:release.sha256.toLowerCase(),cycle:inputs[`${spec.key}-cycle`]}
  };
  await writeFile(resolve(root, `${spec.source}/artifacts/feedback-build-receipt.json`), JSON.stringify(recovery,null,2)+"\n");
  assert.equal((await readFile(resolve(process.env.LOCALAPPDATA,"Programs",spec.directory,"version.txt"),"utf8")).trim(), spec.version);
  const assets = [];
  for (const asset of ["practice.js","automaticity-v2.js",`curriculum-${spec.language}.json`]) {
    const response = await fetch(`http://127.0.0.1:${spec.port}/learning-core/${asset}`); assert.equal(response.status,200);
    const digest = hash(Buffer.from(await response.arrayBuffer()));
    assert.equal(digest,hash(await bytes(`${spec.source}/apps/web/public/learning-core/${asset}`)));
    assets.push({asset,sha256:digest});
  }
  const model = await (await fetch(`http://127.0.0.1:${spec.port}/api/automaticity/transformer`)).json();
  assert.equal(model.enabled,false); assert.deepEqual(model.approvals,[]);
  for (const key of ["feedback","representative","practice","restore","review","daily"])
    assert(Date.parse(evidence[key].at ?? evidence[key].createdAt) > Date.parse(update.createdAt), `${key}: predates installed update`);
  products.push({...spec,setupPath,setupSha256,payloadSha256,assets,profileFiles:applied.profileFiles,profileBytes:applied.profileBytes,
    build:{path:`${spec.source}/artifacts/feedback-build-receipt.json`,sha256:hash(await bytes(`${spec.source}/artifacts/feedback-build-receipt.json`))},
    requiredCheck:{path:`${spec.source}/artifacts/feedback-release-check.log`,sha256:hash(await bytes(`${spec.source}/artifacts/feedback-release-check.log`))}});
}
await mkdir(resolve(root,base),{recursive:true});
const reportPath = `${base}/verification.json`, docPath = "docs/LANGUAGE-AUTOMATICITY-FEEDBACK-2026-09-05.md";
const report = {at:new Date().toISOString(),status:"verified",scope:"Local feedback-memory engineering delivery and offline policy prototype; no independent language approval or learner-effectiveness claim",products,receipts,
  learningPolicy:{prototype:"offline contextual bandit",active:false,realRewardObservations:0},
  limits:{l01:"pending independent review",fullCurriculum:"not_qualified",transformer:"disabled",publicDeployment:"not_updated",learnerOutcomes:"unmeasured"}};
await writeFile(resolve(root,reportPath),JSON.stringify(report,null,2)+"\n");
const backlogPath = "docs/language-automaticity-implementation-backlog.json", backlog = await json(backlogPath);
const addEvidence = (task, values) => { task.evidence=[...new Set([...task.evidence,...values])]; task.updatedOn="2026-09-05"; };
let memory = backlog.tasks.find(task=>task.id==="M05");
if (!memory) { memory={id:"M05",phase:"models",title:"Remember reviewed assessment disagreements",status:"verified",priority:"P1",dependsOn:["E02","L04"],ownerRole:"Implementation",touchpoints:["core","en_client","de_domain"],
  deliverable:"Local task-bound feedback memory and private development-case export/import.",
  acceptance:["A reviewed disagreement withholds the same disputed judgment only for the exact task definition, response and evaluator version.","Preserve original events, support review retraction, abstain on conflicts and never infer independent approval or mastery.","Export only on request; validate linked evidence on development import without creating final-test labels.","Verify both installed apps, update/repair payloads and preservation of learner history."],evidence:[],required:true,condition:null};
  backlog.tasks.splice(backlog.tasks.findIndex(task=>task.id==="M04")+1,0,memory);
}
memory.status="verified"; memory.engineeringVerification="verified_for_recorded_scope";
memory.progressNote="Delivered in English 27.3.38 and DeutschFlow 20.8.42. Exact repeated disputed judgments abstain; later reviews can retract the restriction. Original events and legacy history are preserved. Both installed browser flows and development import checks pass. Local review is not independent qualification; no general grammar learning or automatic mastery is inferred.";
addEvidence(memory,[docPath,reportPath,"shared/learning-core/src/automaticity/assessment-feedback.ts","scripts/lib/assessment-feedback-import.ts",...Object.values(inputs)]);
const l01 = backlog.tasks.find(task=>task.id==="L01");
assert.equal(l01.status,"in_progress");
l01.progressNote="12 bounded English/German construction scopes and 168 tasks remain implemented and verified in installed English 27.3.38 / DeutschFlow 20.8.42. Valid alternatives, target grammar, meaning/roles, abstention, repair and review routes pass installed checks. M05 now prevents repeated exact disputed judgments. Independent content review and scoped evaluator approval are still pending (0/168 representative cells); passing dependencies or engineering tests cannot supply that review.";
addEvidence(l01,[docPath,reportPath,inputs.representative,inputs.feedback]);
for (const id of ["W01","W02","W03","W04","W05"]) {
  const task=backlog.tasks.find(task=>task.id===id);
  task.progressNote="All 280 current constructions now have refreshed review packets covering all 4,924 active tasks and 3,906 required cells. File hashes, current task/rubric versions, complete cell coverage and refusal to overwrite reviews pass. 506 archived definitions remain preserved. The forms are blank: independent language review and qualified assessment are still required. The packet browser index was not opened in this run.";
  addEvidence(task,[docPath,inputs.packets,"artifacts/content-review-packets/all-20260905-feedback38-42/manifest.json"]);
}
for (const id of ["M01","M02","M03"]) addEvidence(backlog.tasks.find(task=>task.id===id),[docPath,inputs.model,"docs/model-evaluation/representative-comparison.json"]);
for (const id of ["X01","X02"]) {
  const task=backlog.tasks.find(task=>task.id===id);
  task.status="deferred";
  task.progressNote=id==="X01"
    ? "Executable offline readiness check is implemented. Current replay has zero qualified delayed rewards and remains unready. A reviewed prospective design, adequate observations and benefit/non-inferiority evidence are still required; Daily uses the existing rule policy."
    : "An offline contextual-bandit prototype now replays logged choices and qualified delayed outcomes, excludes contaminated evidence, balances exploration across eligible strategies and rejects unsupported off-policy comparisons. Eight synthetic tests pass. No live exploration, real reward dataset or learner experiment has been activated; the actual comparison remains deferred.";
  addEvidence(task,[docPath,inputs.bandit,"scripts/lib/practice-bandit.ts","scripts/practice-bandit.test.ts","scripts/replay-practice-bandit.ts"]);
}
Object.assign(backlog.delivery,{technicalIncrement:"verified",englishVersion:"27.3.38",germanVersion:"20.8.42",installedEnglishVersion:"27.3.38",installedGermanVersion:"20.8.42",reinforcementLearning:"offline_prototype_not_active"});
Object.assign(backlog.technicalRelease,{status:"verified",versions:{English:"27.3.38",German:"20.8.42"},installedVersions:{English:"27.3.38",German:"20.8.42"},report:docPath});
backlog.latestEngineeringUpdate=docPath; backlog.updatedOn="2026-09-05";
await writeFile(resolve(root,backlogPath),JSON.stringify(backlog,null,2)+"\n");
await writeFile(resolve(root,`${base}/README.md`),`# Verified local feedback delivery\n\nEnglish **27.3.38** and DeutschFlow **20.8.42** are installed and running. Install, exact previous-version upgrade, startup, update, repair, uninstall and normal-profile preservation passed. Installed feedback, representative grammar, Daily, practice, review drafts and audio-backup checks passed.\n\n${products.map(p=>`${p.name}: preserved ${p.profileFiles} profile files / ${p.profileBytes} bytes before startup.`).join("\n\n")}\n\nThe offline policy prototype is inactive and has no real reward observations. L01 still needs independent review. Public deployments were not updated. See [verification.json](verification.json) for hashes and exact evidence paths.\n`);
console.log(JSON.stringify({status:report.status,reportPath,versions:products.map(p=>p.version),verifiedRequired:backlog.tasks.filter(t=>t.required&&t.status==="verified").length,required:backlog.tasks.filter(t=>t.required).length}));
