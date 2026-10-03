import assert from "node:assert/strict";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {digest,parseManifest,reviewedManifest,validateRun,type PredictionRun} from "./lib/model-benchmark";
import {assessBoundBenchmark,loadRepresentativeRuntime,representativeCandidate,resolveBoundBenchmarkTask} from "./lib/representative-model-candidate";

const root=resolve(import.meta.dir,".."),folder=resolve(root,`artifacts/representative-model-evaluation/${new Date().toISOString().replace(/[:.]/g,"-")}`);
await mkdir(folder,{recursive:true});
const sourcePath="docs/model-evaluation/representative-development.json";
const source=parseManifest(JSON.parse(await readFile(resolve(root,sourcePath),"utf8"))),runtime=await loadRepresentativeRuntime(root);
const checks:string[]=[],runs:{candidate:string;folder:string;runSha256:string;reportSha256:string}[]=[];
let status="running",error:string|undefined;
try{
 assert.equal(source.cases.length,74);assert.equal(new Set(source.cases.map(row=>row.constructionId)).size,12);
 assert(source.cases.every(row=>row.partition==="development"&&row.modality==="writing"&&row.reviews.length===0&&row.humanReviewIds.length===0&&!row.adjudicated&&row.audioSha256===null));
 await assert.rejects(()=>reviewedManifest(root,source),/Two distinct/);
 checks.push("74 implementation-authored development cases in 12 scopes; no independent review, held-out or speech evidence inferred");
 const now=new Date().toISOString();
 for(const row of source.cases){
  const task=resolveBoundBenchmarkTask(row,runtime),assessment=assessBoundBenchmark(row,task,now);
  assert.equal(assessment.verdict,row.expected,row.id);assert.equal(assessment.evaluator.scopeApproved,false);
  assert.equal(assessment.responseSha256,digest(row.response));assert.equal(assessment.taskVersion,task.version);
 }
 checks.push("all diagnostic hypotheses reproduced through the exact production tasks without mastery approval");
 const base=source.cases[0]!;
 for(const [name,patch] of Object.entries({missingBinding:{taskBinding:undefined},wrongHash:{taskBinding:{...base.taskBinding!,taskSha256:"0".repeat(64)}},wrongId:{taskBinding:{...base.taskBinding!,taskId:"missing"}},prompt:{prompt:base.prompt+" changed"},language:{language:"de"},contentVersion:{contentVersion:"stale"},taskVersion:{taskVersion:"stale"},rubric:{rubricVersion:"stale"},construction:{constructionId:"en.c.999"},modality:{modality:"speaking"},normalisation:{normalisation:{terminalFullStop:!base.normalisation.terminalFullStop}}})){
  assert.throws(()=>resolveBoundBenchmarkTask({...base,...patch} as typeof base,runtime),/binding|required|missing|stale|match/i);checks.push(`${name}: changed task context rejected`);
 }
 const malformed=structuredClone(source);malformed.cases[0]!.taskBinding!.taskSha256="not-a-hash";
 assert.throws(()=>parseManifest(malformed),/Invalid production task binding/);checks.push("malformed binding rejected on manifest import");
 const changedRuntime=structuredClone(runtime);const altered=changedRuntime.packs.flatMap(pack=>pack.units.flatMap(unit=>unit.tasks)).find(task=>task.id===base.taskBinding!.taskId)!;altered.prompt+=" changed";
 assert.throws(()=>resolveBoundBenchmarkTask(base,changedRuntime),/does not match/);checks.push("changed source task cannot inherit an old diagnostic binding");
 for(const candidate of ["controlled-answer",representativeCandidate.id]){
  const child=Bun.spawn(["bun","scripts/evaluate-model-candidates.ts",`--candidate=${candidate}`,`--manifest=${sourcePath}`],{cwd:root,stdout:"pipe",stderr:"pipe"});
  const [stdout,stderr,exit]=await Promise.all([new Response(child.stdout).text(),new Response(child.stderr).text(),child.exited]);assert.equal(exit,0,stderr);
  const output=JSON.parse(stdout.trim()),runText=await readFile(resolve(output.folder,"run.json"),"utf8"),reportText=await readFile(resolve(output.folder,"report.json"),"utf8");
  const run=JSON.parse(runText) as PredictionRun,report=JSON.parse(reportText);validateRun(source,run);
  assert.equal(report.approved,false);assert.equal(report.qualification.eligibleForReleaseReview,false);
  if(candidate===representativeCandidate.id){
   assert.deepEqual(run.configuration?.sourceHashes,runtime.sourceHashes);assert.deepEqual(run.configuration?.packHashes,runtime.packHashes);
   for(const row of source.cases){const prediction=run.predictions.find(prediction=>prediction.caseId===row.id)!;assert.equal(prediction.verdict,row.expected,row.id);
    if(row.id.endsWith("wrong-role"))assert.equal(prediction.meaningPreserved,false);
    if(row.id.endsWith("missing-target"))assert.equal(prediction.targetObserved,false);
    if(row.expected==="not_assessed"){assert.equal(prediction.targetObserved,null);assert.equal(prediction.meaningPreserved,null);}
   }
   assert.equal(report.observations.length,74);assert(report.observations.every((row:{assessment:{evaluator:{scopeApproved:boolean}}})=>row.assessment.evaluator.scopeApproved===false));
  }else{assert.equal(run.predictions.filter(row=>row.verdict==="pass").length,12);assert.equal(run.predictions.filter(row=>row.verdict==="not_assessed").length,62);}
  checks.push(`${candidate}: real CLI run, exact case hashes, no qualification; false and unknown dimensions remain distinct`);
  runs.push({candidate,folder:output.folder,runSha256:digest(runText),reportSha256:digest(reportText)});
 }
 const child=Bun.spawn(["bun","scripts/evaluate-model-candidates.ts",`--candidate=${representativeCandidate.id}`,"--version=stale",`--manifest=${sourcePath}`],{cwd:root,stdout:"pipe",stderr:"pipe"});
 const [stdout,stderr,exit]=await Promise.all([new Response(child.stdout).text(),new Response(child.stderr).text(),child.exited]);assert.notEqual(exit,0);assert.match(stderr,/does not match the production implementation/);assert.equal(stdout.trim(),"");
 checks.push("CLI rejects a falsely pinned candidate version before writing a run");
 status="passed";
}catch(caught){status="failed";error=String(caught);process.exitCode=1;}
finally{
 const report={schemaVersion:1,at:new Date().toISOString(),status,checks,runs,error,sourcePath,manifestSha256:digest(JSON.stringify(source)),approved:false,
  limit:"Development adapter regression using implementation examples and model-authored expectations. Passing these checks does not establish independently measured language accuracy, calibration, final qualification or learner outcomes."};
 await writeFile(resolve(folder,"report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({status,checks:checks.length,folder,runs,error}));
}
