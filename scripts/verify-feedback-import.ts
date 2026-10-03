import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { feedbackDevelopmentManifest } from "./lib/assessment-feedback-import";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { reviewedManifest } from "./lib/model-benchmark";
import type { AssessmentFeedback } from "../shared/learning-core/src/automaticity/assessment-feedback";
const root=resolve(import.meta.dir,".."),directory=Bun.argv[2];
if(!directory)throw Error("Pass the successful synthetic feedback browser report directory");
const source=JSON.parse(await readFile(resolve(root,directory,"report.json"),"utf8")) as {scope:string;cases:{language:string;status:string}[]};
assert.match(source.scope,/synthetic/);assert(source.cases.length===2&&source.cases.every(row=>row.status==="verified"));
const runtime=await loadRepresentativeRuntime(root),at=new Date().toISOString(),folder=resolve(root,`artifacts/feedback-import-check/${at.replace(/[:.]/g,"-")}`);await mkdir(folder,{recursive:true});
const checks:string[]=[];let status="running",error:string|undefined;
try{
 for(const language of ["en","de"]){
  const exported=JSON.parse(await readFile(resolve(root,directory,`synthetic-feedback-${language}.json`),"utf8")) as AssessmentFeedback;
  const manifest=await feedbackDevelopmentManifest(exported,runtime.packs,at);
  assert.equal(manifest.cases.length,1);assert.equal(manifest.cases[0]!.partition,"development");assert.equal(manifest.cases[0]!.reviewStatus,"pending");assert.deepEqual(manifest.cases[0]!.reviews,[]);
  await assert.rejects(()=>reviewedManifest(root,manifest),/Two distinct independent reviewers/);
  await writeFile(resolve(folder,`${language}-synthetic-development.json`),JSON.stringify(manifest,null,2)+"\n");checks.push(`${language}: actual browser export imports as private development only`);
  const mutations:((copy:AssessmentFeedback)=>void)[]=[
   copy=>{copy.cases[0]!.attempt.response.text+=" changed";},
   copy=>{copy.cases[0]!.review.feedback="Changed without updating linked history";},
   copy=>{copy.cases[0]!.task.prompt="Different task";},
   copy=>{copy.cases[0]!.history.shift();},
   copy=>{copy.cases.push(structuredClone(copy.cases[0]!));},
   copy=>{copy.contentVersion="stale";},
  ];
  for(let i=0;i<mutations.length;i++){const copy=structuredClone(exported);mutations[i]!(copy);await assert.rejects(()=>feedbackDevelopmentManifest(copy,runtime.packs,at));checks.push(`${language}: edited or duplicated export ${i+1} rejected`);}
  await assert.rejects(()=>feedbackDevelopmentManifest({...exported,independentReviewEstablished:true},runtime.packs,at),/Invalid local feedback export/);checks.push(`${language}: local feedback cannot claim independent qualification`);
 }
 status="passed";
}catch(caught){status="failed";error=String(caught);process.exitCode=1;}
finally{await writeFile(resolve(folder,"report.json"),JSON.stringify({at,status,checks,error,source:directory,scope:"Synthetic provenance tests; no genuine review or learner sample"},null,2)+"\n");console.log(JSON.stringify({folder,status,checks:checks.length,error}));}
