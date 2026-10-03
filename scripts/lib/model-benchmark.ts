import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {isAbsolute,relative,resolve} from "node:path";
import {isRecord,type Verdict} from "../../shared/learning-core/src/automaticity/contracts";
import {parseBenchmarkInput,qualifyCandidate,type BenchmarkCase,type CandidatePrediction} from "../../shared/learning-core/src/automaticity/qualification";

export const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export const policy={version:"grammar-qualification-2026-09-05.2",minimumPerCategory:20,maximumConsequentialErrors:0,maximumSupportedAbstentionRate:0.2,automaticallyApprove:false} as const;
export interface ReviewLabel {verdict:Verdict;targetObserved:boolean|null;meaningPreserved:boolean|null;note:string}
export interface ReviewRecord {reviewerId:string;role:string;reviewedAt:string;caseSha256:string;label:ReviewLabel;evidence:{path:string;sha256:string}}
export interface BenchmarkDraft extends BenchmarkCase {
  prompt:string;response:string;acceptedAnswers:string[];taskVersion:string;normalisation:{terminalFullStop:boolean};
  /** Optional binding to the complete production task. Accepted answers remain a separate closed-answer baseline. */
  taskBinding?:{taskId:string;taskSha256:string};
  authoredBy:string;reviewStatus:"pending"|"reviewed";reviews:ReviewRecord[];
  adjudication:ReviewRecord|null;audioSha256:string|null;
}
export interface BenchmarkManifest {schemaVersion:1;version:string;createdAt:string;purpose:string;cases:BenchmarkDraft[]}
export interface FrozenEvaluation {schemaVersion:1;benchmarkVersion:string;manifestSha256:string;policySha256:string;frozenAt:string;
 candidate:{id:string;version:string};configurationSha256:string;calibration:{path:string;sha256:string};finalCaseIds:string[]}
export interface PredictionRun {schemaVersion:1;candidate:{id:string;version:string};configurationSha256:string;configuration?:Record<string,unknown>;outputObservations?:unknown[];
 benchmarkVersion:string;manifestSha256:string;partition:"development"|"calibration"|"final";startedAt:string;finishedAt:string;
 predictions:CandidatePrediction[];caseHashes:Record<string,string>;limit:string}
export function caseDigest(row:BenchmarkDraft):string {
  const {reviews,adjudication,humanReviewIds,adjudicated,expected,reviewStatus,...content}=row;
  return digest(JSON.stringify(content));
}
const date=(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value));
export function parseManifest(value:unknown):BenchmarkManifest {
 if(!isRecord(value)||value.schemaVersion!==1||typeof value.version!=="string"||!value.version.trim()||!date(value.createdAt)||!Array.isArray(value.cases))throw Error("Invalid benchmark manifest");
 parseBenchmarkInput({candidate:{id:"manifest-validation",version:"1"},cases:value.cases,predictions:[]});
 for(const row of value.cases){
  if(!isRecord(row)||!["prompt","response","taskVersion","authoredBy"].every(key=>typeof row[key]==="string"&&String(row[key]).trim())||
   !Array.isArray(row.acceptedAnswers)||row.acceptedAnswers.some(answer=>typeof answer!=="string")||!isRecord(row.normalisation)||typeof row.normalisation.terminalFullStop!=="boolean"||
   !Array.isArray(row.reviews)||!["pending","reviewed"].includes(String(row.reviewStatus))||
   !(row.audioSha256===null||typeof row.audioSha256==="string"&&/^[a-f0-9]{64}$/.test(row.audioSha256)))throw Error("Invalid benchmark response/provenance");
  const fingerprint=digest(JSON.stringify([row.language,String(row.prompt).normalize("NFC").trim().replace(/\s+/gu," ").toLowerCase(),String(row.response).normalize("NFC").trim().replace(/\s+/gu," ").toLowerCase()]));
  if(row.contentFingerprint!==fingerprint)throw Error(`Stale response fingerprint ${row.id}`);
  if(row.taskBinding!==undefined&&(!isRecord(row.taskBinding)||typeof row.taskBinding.taskId!=="string"||!row.taskBinding.taskId.trim()||typeof row.taskBinding.taskSha256!=="string"||!/^[a-f0-9]{64}$/.test(row.taskBinding.taskSha256)))throw Error(`Invalid production task binding ${row.id}`);
 }
 const parsed=value as unknown as BenchmarkManifest;
 const structural=qualifyCandidate(parsed.cases,[],{id:"manifest-validation",version:"1"}).reasons.filter(reason=>/leakage|Duplicate|provenance|source rights/.test(reason));
 if(structural.length)throw Error(structural.join("; "));
 const distinct=new Set<string>();
 for(const row of parsed.cases){
  const key=JSON.stringify([row.partition,row.language,row.modality,row.prompt.normalize("NFC").trim().replace(/\s+/gu," "),row.response.normalize("NFC").trim().replace(/\s+/gu," ")]);
  if(distinct.has(key))throw Error(`Repeated benchmark input cannot inflate sample counts: ${row.id}`);
  distinct.add(key);
 }
 return parsed;
}
export async function evidenceFile(root:string,ref:{path:string;sha256:string}):Promise<string>{
 if(!isRecord(ref)||typeof ref.path!=="string"||typeof ref.sha256!=="string"||!/^[a-f0-9]{64}$/.test(ref.sha256))throw Error("Invalid evidence reference");
 const path=resolve(root,ref.path),rel=relative(root,path);
 if(isAbsolute(ref.path)||rel.startsWith("..")||isAbsolute(rel))throw Error("Evidence must be inside this workspace");
 const bytes=await readFile(path);if(createHash("sha256").update(bytes).digest("hex")!==ref.sha256)throw Error("Evidence hash mismatch");
 return bytes.toString("utf8");
}
export async function reviewedManifest(root:string,manifest:BenchmarkManifest,now=new Date().toISOString()):Promise<BenchmarkManifest>{
 const result=structuredClone(manifest);
 for(const row of result.cases){
  if(row.modality==="speaking"&&!row.audioSha256)throw Error(`Original audio is required for a speaking benchmark: ${row.id}`);
  if(row.reviews.length<2||new Set(row.reviews.map(review=>review.reviewerId)).size!==row.reviews.length)throw Error(`Two distinct independent reviewers required: ${row.id}`);
  const verify=async(review:ReviewRecord)=>{
   if(!review.reviewerId?.trim()||review.reviewerId===row.authoredBy||!review.role?.trim()||!date(review.reviewedAt)||Date.parse(review.reviewedAt)>Date.parse(now)||Date.parse(review.reviewedAt)<Date.parse(manifest.createdAt)||review.caseSha256!==caseDigest(row))throw Error(`Invalid, self-authored or stale review: ${row.id}`);
   const label=review.label;
   if(!label||!["pass","needs_repair","target_not_observed","not_assessed"].includes(label.verdict)||![true,false,null].includes(label.targetObserved)||![true,false,null].includes(label.meaningPreserved)||!label.note?.trim())throw Error(`Incomplete review label: ${row.id}`);
   if(label.verdict==="pass"&&(label.targetObserved!==true||label.meaningPreserved!==true))throw Error(`Contradictory passing review: ${row.id}`);
   const proof=JSON.parse(await evidenceFile(root,review.evidence)) as {reviewerId?:string;labels?:{caseId:string;caseSha256:string;label:ReviewLabel}[]};
   if(proof.reviewerId!==review.reviewerId||!proof.labels?.some(item=>item.caseId===row.id&&item.caseSha256===review.caseSha256&&JSON.stringify(item.label)===JSON.stringify(label)))throw Error(`Review evidence does not contain this label: ${row.id}`);
  };
  for(const review of row.reviews)await verify(review);
  const labelKey=(review:ReviewRecord)=>JSON.stringify([review.label.verdict,review.label.targetObserved,review.label.meaningPreserved]);
  const disagreement=new Set(row.reviews.map(labelKey)).size>1;
  if(disagreement&&(!row.adjudication||row.reviews.some(review=>review.reviewerId===row.adjudication!.reviewerId)))throw Error(`Independent adjudication required: ${row.id}`);
  if(row.adjudication){await verify(row.adjudication);if(row.reviews.some(review=>Date.parse(review.reviewedAt)>Date.parse(row.adjudication!.reviewedAt)))throw Error(`Adjudication predates labels: ${row.id}`);}
  const label=(row.adjudication??row.reviews[0]!).label;
  row.expected=label.verdict;row.humanReviewIds=row.reviews.map(review=>review.reviewerId);row.adjudicated=true;row.reviewStatus="reviewed";
 }
 return result;
}
export function validateRun(manifest:BenchmarkManifest,run:PredictionRun):void {
 if(run.configuration&&digest(JSON.stringify(run.configuration))!==run.configurationSha256)throw Error("Changed recorded model configuration");
 if(!run||run.schemaVersion!==1||!date(run.startedAt)||!date(run.finishedAt)||Date.parse(run.finishedAt)<Date.parse(run.startedAt)||Date.parse(run.finishedAt)>Date.now()||
  run.benchmarkVersion!==manifest.version||run.manifestSha256!==digest(JSON.stringify(manifest))||!/^[a-f0-9]{64}$/.test(run.configurationSha256))throw Error("Stale or malformed prediction run");
 const rows=manifest.cases.filter(row=>row.partition===run.partition);
 if(run.outputObservations){
  if(!Array.isArray(run.outputObservations)||run.outputObservations.length!==rows.length||run.outputObservations.some(row=>!isRecord(row)||typeof row.caseId!=="string")||new Set(run.outputObservations.map(row=>(row as {caseId:string}).caseId)).size!==rows.length)throw Error("Missing or repeated model output observations");
  for(const output of run.outputObservations){if(!isRecord(output))throw Error("Invalid model observation");const prediction=run.predictions.find(row=>row.caseId===output.caseId);if(!prediction||!rows.some(row=>row.id===output.caseId)||(isRecord(output.proposal)?output.proposal.verdict!==prediction.verdict:prediction.verdict!=="not_assessed"))throw Error("Model output does not match the recorded prediction");}
 }
 if(!rows.length||run.predictions.length!==rows.length||new Set(run.predictions.map(row=>row.caseId)).size!==rows.length||Object.keys(run.caseHashes).length!==rows.length)throw Error("Missing or duplicate prediction cases");
 for(const row of rows)if(run.caseHashes[row.id]!==caseDigest(row)||!run.predictions.some(prediction=>prediction.caseId===row.id))throw Error("Prediction is not bound to exact case content");
 const parsed=parseBenchmarkInput({candidate:run.candidate,cases:rows,predictions:run.predictions});
 if(qualifyCandidate(parsed.cases,parsed.predictions,parsed.candidate).reasons.some(reason=>reason.startsWith("Invalid prediction")))throw Error("Malformed candidate prediction");
}
export function validateFreeze(manifest:BenchmarkManifest,run:PredictionRun,freeze:FrozenEvaluation):void {
 validateRun(manifest,run);
 const ids=manifest.cases.filter(row=>row.partition==="final").map(row=>row.id).sort();
 if(run.partition!=="final"||!freeze||freeze.schemaVersion!==1||freeze.manifestSha256!==run.manifestSha256||freeze.benchmarkVersion!==manifest.version||freeze.policySha256!==digest(JSON.stringify(policy))||!date(freeze.frozenAt)||Date.parse(freeze.frozenAt)>=Date.parse(run.startedAt)||
  JSON.stringify(freeze.candidate)!==JSON.stringify(run.candidate)||freeze.configurationSha256!==run.configurationSha256||JSON.stringify([...freeze.finalCaseIds].sort())!==JSON.stringify(ids))throw Error("Final evaluation does not match its earlier frozen configuration");
}
/** A stored score file alone cannot qualify an automated evaluator. */
export async function validateEvaluationEvidence(root:string,value:unknown):Promise<void>{
 if(!isRecord(value)||!isRecord(value.evaluationEvidence))throw Error("Missing reviewed benchmark and frozen evaluation evidence");
 const refs=value.evaluationEvidence as unknown as Record<"manifest"|"run"|"freeze",{path:string;sha256:string}>;
 const manifest=parseManifest(JSON.parse(await evidenceFile(root,refs.manifest)));
 const reviewed=await reviewedManifest(root,manifest);
 if(JSON.stringify(manifest)!==JSON.stringify(reviewed))throw Error("Stored benchmark labels do not match human review");
 const run=JSON.parse(await evidenceFile(root,refs.run)) as PredictionRun;
 const freeze=JSON.parse(await evidenceFile(root,refs.freeze)) as FrozenEvaluation;
 validateFreeze(manifest,run,freeze);
 const calibration=JSON.parse(await evidenceFile(root,freeze.calibration)) as PredictionRun;
 validateRun(manifest,calibration);
 if(calibration.partition!=="calibration"||calibration.configurationSha256!==run.configurationSha256||JSON.stringify(calibration.candidate)!==JSON.stringify(run.candidate)||Date.parse(calibration.finishedAt)>Date.parse(freeze.frozenAt))throw Error("Invalid frozen calibration evidence");
 if(JSON.stringify(value.cases)!==JSON.stringify(manifest.cases)||JSON.stringify(value.predictions)!==JSON.stringify(run.predictions)||JSON.stringify(value.candidate)!==JSON.stringify(run.candidate))throw Error("Qualification input differs from frozen evidence");
}
