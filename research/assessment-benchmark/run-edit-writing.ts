import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {hash,writingMetrics} from "./core";
import {attestLocalLaunch} from "./attest-local-launch";
import {boundedResponse} from "./context-candidate";
import {verifyDevelopmentSelection} from "./holdout-policy";
import {EDIT_PROMPT,EDIT_REVIEW_PROMPT,EDIT_SCHEMA,parseEditAssessment,combineEditReviews,type EditAssessment} from "./edit-assessment";
import {TARGET_SCOPE_PROMPT,targetWritingInput} from "./target-writing-input";
import type {ContextCase} from "./prepare-context-writing";

const MODELS={
 "14b":{name:"Qwen3-14B-Q5_K_M.gguf",sha256:"e7c9aba1129ca2936be9eca01419d9f86af40e08caa01230d5574b34d08e3e31",revision:"530227a7d994db8eca5ab5ced2fb692b614357fd",repository:"Qwen/Qwen3-14B-GGUF"},
 "27b":{name:"Qwen3.5-27B-Q4_K_M.gguf",sha256:"84b5f7f112156d63836a01a69dc3f11a6ba63b10a23b8ca7a7efaf52d5a2d806",revision:"3221f178a6b842d04f1fb42f1c413534adcc0a6a",repository:"unsloth/Qwen3.5-27B-GGUF"},
} as const;
const [modelId,split,version,inputProfile="baseline"]=Bun.argv.slice(2);
if(!modelId || !(modelId in MODELS) || !["development","holdout"].includes(split??"") || !/^v\d+$/.test(version??"") || !["baseline","target-last"].includes(inputProfile)) throw Error("Usage: run-edit-writing.ts 14b|27b development|holdout vN [baseline|target-last]");
const model={...MODELS[modelId as keyof typeof MODELS],runtime:"b11146-7fe450e19"};
const modelPath=resolve(import.meta.dir,"data",model.name),dataDir=resolve(import.meta.dir,"runs/writing-context-data-v2");
const directory=resolve(import.meta.dir,`runs/writing-edits-${modelId}-${split}-direct-${version}`);
await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,"run-reserved.json"),JSON.stringify({at:new Date().toISOString(),modelId,split}),{flag:"wx"});
const datasetManifest=await Bun.file(resolve(dataDir,"manifest.json")).json();
const key=(await Bun.file(resolve(import.meta.dir,"data/llama-api-key.local")).text()).trim();
async function attest(){
 const digest=createHash("sha256");for await(const bytes of createReadStream(modelPath))digest.update(bytes);
 if(digest.digest("hex")!==model.sha256)throw Error("Weight hash changed");
 const response=await fetch("http://127.0.0.1:8769/props",{headers:{authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error("Server identity unavailable");
 const props=await response.json() as {model_path:string;build_info:string;total_slots:number;cors_proxy_enabled:boolean;chat_template:string;default_generation_settings:unknown};
 if(resolve(props.model_path)!==modelPath || props.build_info!==model.runtime || props.total_slots!==4 || props.cors_proxy_enabled)throw Error("Wrong server identity");
 return {checkedAt:new Date().toISOString(),model,launch:await attestLocalLaunch(),templateSha256:hash(props.chat_template),defaults:props.default_generation_settings};
}
const codeHashes:Record<string,string>={};
for(const name of ["run-edit-writing.ts","edit-assessment.ts","core.ts","attest-local-launch.ts","context-candidate.ts","holdout-policy.ts","target-writing-input.ts"]){
 const code=await Bun.file(resolve(import.meta.dir,name)).text();codeHashes[name]=hash(code);await Bun.write(resolve(directory,name+".snapshot"),code);
}
const prompts=[EDIT_PROMPT,EDIT_REVIEW_PROMPT].map(prompt=>inputProfile==="target-last"?`${prompt}\n${TARGET_SCOPE_PROMPT}`:prompt);
const settings={model,codeHashes,inputProfile,prompts,schema:EDIT_SCHEMA,temperature:0,top_p:1,top_k:0,min_p:0,presence_penalty:0,seed:59,max_tokens:900,chat_template_kwargs:{enable_thinking:false},parallel:4,timeoutMs:240000,contextPolicy:datasetManifest.context,combination:"two-fresh-original-reviews;matching-verdict-and-NFC-whitespace-correction;any-invalid-or-disagreement-uncertain",firstPassIsDiagnosticOnly:true};
const identity=await attest();
await Bun.write(resolve(directory,"identity-pre-run.json"),JSON.stringify(identity,null,2)+"\n");
const {pid:_pid,createdAt:_created,...launch}=identity.launch;
const candidateFingerprint=hash(JSON.stringify({...settings,launch,templateSha256:identity.templateSha256,serverDefaults:identity.defaults}));
if(split==="holdout"){
 await verifyDevelopmentSelection(dataDir,candidateFingerprint,datasetManifest.selections.development.sha256);
 await writeFile(resolve(dataDir,"holdout-consumed.json"),JSON.stringify({at:new Date().toISOString(),directory,candidateFingerprint}),{flag:"wx"});
}
const dataBytes=await Bun.file(resolve(dataDir,`${split}.jsonl`)).text();
if(hash(dataBytes)!==datasetManifest.selections[split!].sha256)throw Error("Frozen data changed");
const cases=dataBytes.trim().split("\n").map(line=>JSON.parse(line) as ContextCase);
const config={...settings,split,mode:"direct",selectionSha256:hash(dataBytes),candidateFingerprint};
await Bun.write(resolve(directory,"config.json"),JSON.stringify(config,null,2)+"\n");
type Phase={assessment:EditAssessment|null;failure:string|null;raw:unknown;elapsedMs:number;requestStarted:boolean};
async function phase(row:ContextCase,prompt:string,signal:AbortSignal):Promise<Phase>{
 const start=performance.now();let raw:unknown=null,requestStarted=false;
 try{
  signal.throwIfAborted();
  requestStarted=true;
  raw=await boundedResponse(await fetch("http://127.0.0.1:8769/v1/chat/completions",{method:"POST",redirect:"error",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},signal,body:JSON.stringify({model:model.name,temperature:settings.temperature,top_p:settings.top_p,top_k:settings.top_k,min_p:settings.min_p,presence_penalty:0,seed:settings.seed,max_tokens:settings.max_tokens,chat_template_kwargs:settings.chat_template_kwargs,messages:[{role:"system",content:prompt},{role:"user",content:inputProfile==="target-last"?targetWritingInput(row):JSON.stringify({language:row.language,target:row.text,before:row.before,after:row.after})}],response_format:{type:"json_schema",json_schema:{name:"necessary_edits",strict:true,schema:EDIT_SCHEMA}}})}));
  const body=raw as {model?:string;system_fingerprint?:string;choices?:{finish_reason?:string;message?:{content?:string}}[]};
  if(body.model!==modelPath || body.system_fingerprint!==model.runtime || body.choices?.length!==1 || body.choices[0]?.finish_reason!=="stop" || typeof body.choices[0]?.message?.content!=="string")throw Error("Incomplete or changed model response");
  return {assessment:parseEditAssessment(JSON.parse(body.choices[0].message.content),row.text),failure:null,raw,elapsedMs:Math.round(performance.now()-start),requestStarted};
 }catch(error){return {assessment:null,failure:error instanceof Error?error.message:String(error),raw,elapsedMs:Math.round(performance.now()-start),requestStarted};}
}
type Result={id:string;language:"en"|"de";group:string;label:"clean"|"error";slice:string;verdict:EditAssessment["verdict"];correction:string;edits:EditAssessment["edits"];phases:Phase[];elapsedMs:number};
const rows:Result[]=[],path=resolve(directory,"predictions.jsonl"),writer=Bun.file(path).writer();let cursor=0;
async function worker(){while(cursor<cases.length){const row=cases[cursor++]!,start=performance.now(),signal=AbortSignal.timeout(settings.timeoutMs);
 const first=await phase(row,settings.prompts[0]!,signal),second=await phase(row,settings.prompts[1]!,signal),result=combineEditReviews(first.assessment,second.assessment);
 const output={id:row.id,language:row.language,group:row.group,label:row.label,slice:row.slice,...result,phases:[first,second],elapsedMs:Math.round(performance.now()-start)};
 rows.push(output);writer.write(JSON.stringify(output)+"\n");await writer.flush();if(rows.length%16===0)console.log(JSON.stringify({completed:rows.length,total:cases.length}));
}}
try{await Promise.all(Array.from({length:4},worker));}finally{await writer.end();}
const post=await attest();await Bun.write(resolve(directory,"identity-post-run.json"),JSON.stringify(post,null,2)+"\n");
if(JSON.stringify(identity.launch)!==JSON.stringify(post.launch)||identity.templateSha256!==post.templateSha256||JSON.stringify(identity.defaults)!==JSON.stringify(post.defaults))throw Error("Server changed during run");
const timings=rows.map(r=>r.elapsedMs).sort((a,b)=>a-b);
const metrics=(subset:Result[],index?:number)=>writingMetrics(subset.map(row=>({label:row.label,verdict:index===undefined?row.verdict:row.phases[index]!.assessment?.verdict??"uncertain"})));
const phases=rows.flatMap(r=>r.phases),failureReasons=[...new Set(phases.map(p=>p.failure).filter((p):p is string=>Boolean(p)))];
const report={schemaVersion:1,completedAt:new Date().toISOString(),split,mode:"direct",candidateFingerprint,configSha256:hash(JSON.stringify(config)),selectionSha256:hash(dataBytes),predictionsSha256:hash(new Uint8Array(await Bun.file(path).arrayBuffer())),count:rows.length,attemptedPhases:phases.length,requestsStarted:phases.filter(p=>p.requestStarted).length,structurallyValidCalls:phases.filter(p=>p.assessment).length,failures:Object.fromEntries(failureReasons.map(reason=>[reason,phases.filter(p=>p.failure===reason).length])),latencyMs:{median:timings[Math.floor(timings.length/2)],p95:timings[Math.floor(timings.length*.95)]},languages:Object.fromEntries(["en","de"].map(language=>{const subset=rows.filter(r=>r.language===language);return[language,{candidate:metrics(subset),firstPass:metrics(subset,0),reviewPass:metrics(subset,1),groups:new Set(subset.map(r=>r.group)).size}];})),releaseEligible:false,limitations:datasetManifest.limitations+" Two reviews share a model and are correlated. First-pass results are diagnostic only. Exact quotation/reconstruction does not certify linguistic validity. No app task/meaning qualification."};
await Bun.write(resolve(directory,"public-report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
