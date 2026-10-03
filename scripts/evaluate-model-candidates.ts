import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {isRecord} from "../shared/learning-core/src/automaticity/contracts";
import {qualifyCandidate,type CandidatePrediction} from "../shared/learning-core/src/automaticity/qualification";
import {caseDigest,digest,parseManifest,reviewedManifest,validateRun,validateFreeze,evidenceFile,policy,type PredictionRun,type FrozenEvaluation} from "./lib/model-benchmark";
import {representativeCandidate,loadRepresentativeRuntime,resolveBoundBenchmarkTask,assessBoundBenchmark} from "./lib/representative-model-candidate";
const root=resolve(import.meta.dir,".."),arg=(name:string)=>Bun.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const manifestPath=resolve(root,arg("manifest")??"docs/model-evaluation/development.json");
const manifest=parseManifest(JSON.parse(await readFile(manifestPath,"utf8")));
const partition=arg("partition")??"development";
if(!["development","calibration","final"].includes(partition))throw Error("Unknown benchmark partition");
const candidateId=arg("candidate")??"controlled-answer",version=arg("version")??(candidateId==="controlled-answer"?"1.0.0":candidateId===representativeCandidate.id?representativeCandidate.version:null);
if(!["controlled-answer",representativeCandidate.id,"languagetool","pretrained-local"].includes(candidateId)||!version)throw Error("Select a known adapter and pin --version before evaluation");
if(candidateId===representativeCandidate.id&&version!==representativeCandidate.version)throw Error("Representative candidate version does not match the production implementation");
const endpoint=arg("endpoint"),candidate={id:candidateId,version};
if(candidateId==="languagetool"||candidateId==="pretrained-local"){
 if(!endpoint)throw Error("A configured local candidate endpoint is required. The free LanguageTool API must not be batch-tested.");
 const url=new URL(endpoint);if(!["127.0.0.1","localhost","[::1]"].includes(url.hostname)||url.protocol!=="http:"||url.username||url.password)throw Error("This diagnostic runner accepts loopback HTTP candidates only");
}
const providerConfigurationSha256=arg("provider-config-sha256")??null;
if(providerConfigurationSha256!==null&&!/^[a-f0-9]{64}$/.test(providerConfigurationSha256))throw Error("Invalid provider configuration hash");
if(candidateId==="pretrained-local"&&partition!=="development"&&!providerConfigurationSha256)throw Error("Reviewed Transformer runs require a pinned provider configuration hash");
const runtime=candidateId===representativeCandidate.id?await loadRepresentativeRuntime(root):null;
const boundTasks=new Map(runtime?manifest.cases.filter(row=>row.partition===partition).map(row=>[row.id,resolveBoundBenchmarkTask(row,runtime)]):[]);
const config={adapterVersion:runtime?"4":"3",endpoint:endpoint??null,candidate,providerConfigurationSha256,normalisation:"NFC, case-preserving, declared final full stop only",providerTimeoutMs:15000,
 ...(runtime?{sourceHashes:runtime.sourceHashes,packHashes:runtime.packHashes}:{} )};
const run:PredictionRun={schemaVersion:1,candidate,configurationSha256:digest(JSON.stringify(config)),benchmarkVersion:manifest.version,manifestSha256:digest(JSON.stringify(manifest)),partition:partition as PredictionRun["partition"],startedAt:new Date().toISOString(),finishedAt:"",predictions:[],caseHashes:{},limit:"Development labels are model-authored hypotheses. Diagnostics cannot approve a model. Local compute/energy cost is not measured."};
run.configuration=config;
const rows=manifest.cases.filter(row=>row.partition===partition);if(!rows.length)throw Error(`No ${partition} examples have been collected`);
let freeze:FrozenEvaluation|undefined;
if(partition!=="development"){
 const reviewed=await reviewedManifest(root,manifest);
 if(JSON.stringify(reviewed)!==JSON.stringify(manifest))throw Error("Recorded human labels must be compiled into the manifest before evaluation");
}
if(partition==="final"){
 if(!arg("freeze"))throw Error("Final requests require an earlier frozen calibration record");
 freeze=JSON.parse(await readFile(resolve(root,arg("freeze")!),"utf8")) as FrozenEvaluation;
 if(freeze.manifestSha256!==run.manifestSha256||freeze.configurationSha256!==run.configurationSha256||freeze.policySha256!==digest(JSON.stringify(policy))||JSON.stringify(freeze.candidate)!==JSON.stringify(candidate)||Date.parse(freeze.frozenAt)>=Date.parse(run.startedAt))throw Error("Frozen configuration is stale or post-dates final evaluation");
 const calibration=JSON.parse(await evidenceFile(root,freeze.calibration)) as PredictionRun;validateRun(manifest,calibration);
 if(calibration.partition!=="calibration"||calibration.configurationSha256!==run.configurationSha256||JSON.stringify(calibration.candidate)!==JSON.stringify(candidate)||Date.parse(calibration.finishedAt)>Date.parse(freeze.frozenAt))throw Error("Calibration does not support this frozen configuration");
}
const folder=resolve(root,`artifacts/model-evaluation/${run.startedAt.replace(/[:.]/g,"-")}-${candidateId}`);await mkdir(folder,{recursive:true});
await writeFile(resolve(folder,"started.json"),JSON.stringify({...run,policy},null,2),{flag:"wx"});
const observations:unknown[]=[];
for(const row of rows){
 const started=performance.now();let verdict:CandidatePrediction["verdict"]="not_assessed",meaningPreserved:boolean|null=null,targetObserved:boolean|null=null,cost:number|null=null;
 if(candidateId==="controlled-answer"){
  // Reuse the production closed-answer policy through the same assessment module.
  const {assessControlledTask}=await import("../shared/learning-core/src/automaticity/assessment");
  const {sha256}=await import("../shared/learning-core/src/automaticity/backup");
  const task={id:row.id,version:row.taskVersion,constructionId:row.constructionId,familyId:"G01",itemFamily:row.itemFamily,contextId:row.id,rubricVersion:row.rubricVersion,stage:"retrieve" as const,modality:row.modality,partition:"practice" as const,transferCondition:"none" as const,contentReview:"authored" as const,prompt:row.prompt,answerPolicy:row.modality==="writing"?"closed" as const:"open" as const,responseKind:"free_output" as const,acceptedAnswers:row.acceptedAnswers,hints:[],solution:null,normalisation:{nfc:true as const,whitespace:true as const,preserveCase:true as const,terminalFullStop:row.normalisation.terminalFullStop},sourceId:row.sourceId};
  const assessment=assessControlledTask({version:2,type:"attempt",id:row.id,language:row.language,at:run.startedAt,task,response:{text:row.response,sha256:await sha256(row.response),originalTranscriptSha256:null,transcriptEdited:false},timing:{startedAt:run.startedAt,activeMs:null,firstInputMs:null,source:"unavailable"},assistance:{hintCount:0,solutionRevealed:false,exampleSeen:false,selfReportedAssistance:false},audio:null,previousAttemptId:null},task,new Date().toISOString(),`assessment-${row.id}`);
  verdict=assessment.verdict;targetObserved=assessment.dimensions.target==="observed"?true:null;meaningPreserved=assessment.dimensions.relevance==="pass"?true:null;cost=0;
 }else if(candidateId===representativeCandidate.id){
  const assessment=assessBoundBenchmark(row,boundTasks.get(row.id)!,new Date().toISOString());
  verdict=assessment.verdict;
  targetObserved=assessment.dimensions.target==="observed"?true:assessment.dimensions.target==="not_observed"?false:null;
  meaningPreserved=assessment.dimensions.relevance==="pass"?true:assessment.dimensions.relevance==="fail"?false:null;
  cost=0;observations.push({caseId:row.id,taskBinding:row.taskBinding,assessment});
 }else{
  try{
   const request=candidateId==="languagetool"?{headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({language:row.language==="en"?"en-US":"de-DE",text:row.response}).toString()}:{headers:{"Content-Type":"application/json"},body:JSON.stringify({model:version,language:row.language,modality:row.modality,prompt:row.prompt,response:row.response,constructionId:row.constructionId})};
   const response=await fetch(endpoint!,{method:"POST",...request,redirect:"error",signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(`Candidate HTTP ${response.status}`);
   const text=await response.text();if(text.length>1_000_000)throw Error("Oversized candidate response");
   const value:unknown=JSON.parse(text);if(!isRecord(value))throw Error("Malformed candidate response");
   if(candidateId==="languagetool"){
    if(!isRecord(value.software)||value.software.version!==version||!Array.isArray(value.matches)||value.matches.some(match=>!isRecord(match)||!Number.isInteger(match.offset)||!Number.isInteger(match.length)||Number(match.offset)<0||Number(match.length)<0||Number(match.offset)+Number(match.length)>row.response.length))throw Error("LanguageTool version/annotation mismatch");
    observations.push({caseId:row.id,matches:value.matches,software:value.software,limit:"Proofreading suggestions do not establish target or meaning correctness."});
   }else{
    if(value.version!==version||(providerConfigurationSha256&&value.configurationSha256!==providerConfigurationSha256)||!["pass","needs_repair","target_not_observed","not_assessed"].includes(String(value.verdict))||![true,false,null].includes(value.meaningPreserved as boolean|null)||![true,false,null].includes(value.targetObserved as boolean|null))throw Error("Pretrained candidate output/version mismatch");
    verdict=value.verdict as CandidatePrediction["verdict"];meaningPreserved=value.meaningPreserved as boolean|null;targetObserved=value.targetObserved as boolean|null;
    observations.push({caseId:row.id,proposal:value,...(value.unavailable?{error:"Candidate unavailable or output rejected",fallback:"not_assessed"}:{})});
   }
  }catch(error){observations.push({caseId:row.id,error:String(error),fallback:"not_assessed"});}
 }
 run.caseHashes[row.id]=caseDigest(row);run.predictions.push({caseId:row.id,verdict,latencyMs:performance.now()-started,meaningPreserved,targetObserved,cost});
}
if(candidateId==="pretrained-local")run.outputObservations=observations;
run.finishedAt=new Date().toISOString();validateRun(manifest,run);if(freeze)validateFreeze(manifest,run,freeze);
const finalReport=qualifyCandidate(manifest.cases,run.predictions,candidate);
// Remapping development cases is only for diagnostic arithmetic; never release qualification.
const diagnostics=qualifyCandidate(rows.map(row=>({...row,partition:"final" as const})),run.predictions,candidate).scopes;
await writeFile(resolve(folder,"run.json"),JSON.stringify(run,null,2));
await writeFile(resolve(folder,"report.json"),JSON.stringify({status:"completed",partition,candidate,diagnostics,observations,qualification:finalReport,approved:false,limit:run.limit},null,2));
console.log(JSON.stringify({folder,cases:rows.length,candidate,partition,approved:false}));
