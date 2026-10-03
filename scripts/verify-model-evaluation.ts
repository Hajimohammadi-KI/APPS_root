import assert from "node:assert/strict";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {relative,resolve} from "node:path";
import {caseDigest,digest,parseManifest,reviewedManifest,validateRun,validateFreeze,validateEvaluationEvidence,policy,type BenchmarkManifest,type PredictionRun,type FrozenEvaluation,type ReviewRecord} from "./lib/model-benchmark";
const root=resolve(import.meta.dir,".."),folder=resolve(root,`artifacts/model-evaluation-gates/${new Date().toISOString().replace(/[:.]/g,"-")}`);
await mkdir(folder,{recursive:true});const cases:string[]=[];
const source=parseManifest(JSON.parse(await readFile(resolve(root,"docs/model-evaluation/development.json"),"utf8")));
const pass=(name:string)=>{cases.push(name);};
async function rejected(name:string,run:()=>unknown|Promise<unknown>,pattern:RegExp){await assert.rejects(async()=>run(),pattern);pass(name);}
let status="running",error:string|undefined;
try{
 assert.equal(source.cases.length,20);assert(source.cases.every(row=>row.humanReviewIds.length===0&&row.partition==="development"));pass("real draft contains no invented review or final cases");
 await rejected("unreviewed seed cannot qualify",()=>reviewedManifest(root,source),/Two distinct/);
 const repeated=structuredClone(source);repeated.cases.push({...structuredClone(repeated.cases[0]!),id:"renamed-identical-case"});
 await rejected("duplicate input cannot inflate case counts",()=>parseManifest(repeated),/inflate sample counts/);
 for(const field of ["sourceGroup","templateFamily","contentFingerprint","learnerGroup"] as const){
  const copy=structuredClone(source);copy.cases[0]!.learnerGroup="same-person";
  const duplicate={...copy.cases[0]!,id:"separate-partition",partition:"final" as const,itemFamily:"new",sourceGroup:"new",templateFamily:"new",learnerGroup:"new"};
  Object.assign(duplicate,{[field]:copy.cases[0]![field]});copy.cases.push(duplicate);
  await rejected(`renamed ${field} leakage`,()=>parseManifest(copy),/leakage/);
 }
 const manifest:BenchmarkManifest={...structuredClone(source),version:"synthetic-review-fixture",createdAt:"2026-09-04T08:00:00Z",cases:[structuredClone(source.cases[0]!),structuredClone(source.cases[5]!)]};
 manifest.cases.forEach((row,index)=>{row.partition=index?"final":"calibration";row.sourceGroup=`isolated-source-${index}`;row.templateFamily=`isolated-template-${index}`;row.itemFamily=`isolated-item-${index}`;});
 parseManifest(manifest);
 async function review(index:number,reviewerId:string,verdict:"pass"|"needs_repair"="pass"):Promise<ReviewRecord>{
  const row=manifest.cases[index]!,record:ReviewRecord={reviewerId,role:"Synthetic reviewer fixture, not a human approval",reviewedAt:"2026-09-04T09:00:00Z",caseSha256:caseDigest(row),label:{verdict,targetObserved:true,meaningPreserved:true,note:"Synthetic transport validation only"},evidence:{path:"",sha256:""}};
  const path=resolve(folder,`${index}-${reviewerId}.json`),bytes=JSON.stringify({reviewerId,labels:[{caseId:row.id,caseSha256:record.caseSha256,label:record.label}]});await writeFile(path,bytes);record.evidence={path:relative(root,path),sha256:digest(bytes)};return record;
 }
 for(let index=0;index<manifest.cases.length;index++)manifest.cases[index]!.reviews=[await review(index,"synthetic-A"),await review(index,"synthetic-B")];
 const reviewed=await reviewedManifest(root,manifest);assert(reviewed.cases.every(row=>row.reviewStatus==="reviewed"));pass("two hash-bound synthetic labels accepted as transport fixtures only");
 let bad=structuredClone(manifest);bad.cases[0]!.response+=" changed";await rejected("edited case invalidates review",()=>reviewedManifest(root,bad),/stale review/);
 bad=structuredClone(manifest);bad.cases[0]!.reviews[0]!.reviewerId="Codex";await rejected("model cannot certify its own case",()=>reviewedManifest(root,bad),/self-authored/);
 bad=structuredClone(manifest);bad.cases[0]!.reviews[1]=await review(0,"synthetic-disagrees","needs_repair");await rejected("disagreement requires a third reviewer",()=>reviewedManifest(root,bad),/adjudication/);
 bad=structuredClone(manifest);bad.cases[0]!.reviews[0]!.evidence.sha256="0".repeat(64);await rejected("review evidence cannot be changed",()=>reviewedManifest(root,bad),/hash mismatch/);
 bad=structuredClone(manifest);bad.cases[0]!.reviews[0]!.label.note="not in evidence";await rejected("evidence must contain exact judgment",()=>reviewedManifest(root,bad),/does not contain/);
 const run=(partition:"calibration"|"final"):PredictionRun=>({schemaVersion:1,candidate:{id:"synthetic-model",version:"1"},configurationSha256:"b".repeat(64),benchmarkVersion:reviewed.version,manifestSha256:digest(JSON.stringify(reviewed)),partition,startedAt:partition==="calibration"?"2026-09-04T10:00:00Z":"2026-09-04T12:00:00Z",finishedAt:partition==="calibration"?"2026-09-04T10:01:00Z":"2026-09-04T12:01:00Z",predictions:reviewed.cases.filter(row=>row.partition===partition).map(row=>({caseId:row.id,verdict:row.expected,latencyMs:1,meaningPreserved:true,targetObserved:true,cost:null})),caseHashes:Object.fromEntries(reviewed.cases.filter(row=>row.partition===partition).map(row=>[row.id,caseDigest(row)])),limit:"Synthetic test fixture"});
 const calibration=run("calibration"),final=run("final");validateRun(reviewed,calibration);validateRun(reviewed,final);pass("prediction hashes and exact case sets verified");
 const writeEvidence=async(name:string,value:unknown)=>{const path=resolve(folder,name),bytes=JSON.stringify(value);await writeFile(path,bytes);return{path:relative(root,path),sha256:digest(bytes)};};
 const calibrationRef=await writeEvidence("calibration.json",calibration);
 const freeze:FrozenEvaluation={schemaVersion:1,benchmarkVersion:reviewed.version,manifestSha256:final.manifestSha256,policySha256:digest(JSON.stringify(policy)),frozenAt:"2026-09-04T11:00:00Z",candidate:final.candidate,configurationSha256:final.configurationSha256,calibration:calibrationRef,finalCaseIds:reviewed.cases.filter(row=>row.partition==="final").map(row=>row.id)};
 validateFreeze(reviewed,final,freeze);pass("earlier frozen configuration matches final run");
 for(const [name,changed] of [["post-hoc freeze",{...freeze,frozenAt:"2026-09-04T13:00:00Z"}],["changed candidate",{...freeze,candidate:{id:"different",version:"1"}}],["changed settings",{...freeze,configurationSha256:"c".repeat(64)}],["changed policy",{...freeze,policySha256:"c".repeat(64)}]] as const)await rejected(name,()=>validateFreeze(reviewed,final,changed),/frozen configuration/);
 await rejected("missing predictions",()=>validateRun(reviewed,{...final,predictions:[]}),/Missing/);
 await rejected("old content cannot inherit approval",()=>validateRun({...reviewed,version:"new"},final),/Stale/);
 const input={candidate:final.candidate,cases:reviewed.cases,predictions:final.predictions,evaluationEvidence:{manifest:await writeEvidence("reviewed-fixture.json",reviewed),run:await writeEvidence("final.json",final),freeze:await writeEvidence("freeze.json",freeze)}};
 await validateEvaluationEvidence(root,input);pass("complete synthetic evidence chain can be independently recomputed");
 await rejected("bare score file cannot approve a model",()=>validateEvaluationEvidence(root,{candidate:final.candidate,cases:reviewed.cases,predictions:final.predictions}),/Missing reviewed/);
 await rejected("forged input cannot bypass immutable evidence",()=>validateEvaluationEvidence(root,{...input,predictions:[]}),/differs/);
 status="passed";
}catch(caught){status="failed";error=String(caught);process.exitCode=1;}
finally{await writeFile(resolve(folder,"report.json"),JSON.stringify({status,cases,error,scope:"Synthetic verification only; real benchmark remains unreviewed"},null,2));console.log(JSON.stringify({status,cases:cases.length,error,folder}));}
