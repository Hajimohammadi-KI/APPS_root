import {readFile,readdir} from "node:fs/promises";
import {resolve} from "node:path";
import {assessControlledTask} from "../../shared/learning-core/src/automaticity/assessment";
import {CONSTRUCTION_RULE_VERSION} from "../../shared/learning-core/src/automaticity/construction-rules";
import type {CurriculumPack,PracticeTask} from "../../shared/learning-core/src/automaticity/curriculum";
import {resolveRepresentativeTask} from "../../shared/learning-core/src/automaticity/representative-tasks";
import {digest,type BenchmarkDraft} from "./model-benchmark";

export const representativeCandidate={id:"representative-construction",version:CONSTRUCTION_RULE_VERSION};
export interface RepresentativeRuntime {packs:CurriculumPack[];sourceHashes:Record<string,string>;packHashes:Record<string,string>}
export async function loadRepresentativeRuntime(root:string):Promise<RepresentativeRuntime>{
 const packs:CurriculumPack[]=[],packHashes:Record<string,string>={},sourceHashes:Record<string,string>={};
 for(const language of ["en","de"] as const){
  const path=`${language==="en"?"Apps/English/English-Automaticity":"Apps/Deutsch/Deutsch-Automaticity"}/apps/web/public/learning-core/curriculum-${language}.json`;
  const bytes=await readFile(resolve(root,path),"utf8");packHashes[path]=digest(bytes);packs.push(JSON.parse(bytes));
 }
 // Pin the shared assessment implementation and its local dependencies, not just its version label.
 const directory="shared/learning-core/src/automaticity";
 for(const file of (await readdir(resolve(root,directory))).filter(file=>file.endsWith(".ts")&&!file.endsWith(".test.ts")).sort()){
  const path=`${directory}/${file}`;sourceHashes[path]=digest(await readFile(resolve(root,path),"utf8"));
 }
 for(const path of ["scripts/evaluate-model-candidates.ts","scripts/lib/representative-model-candidate.ts","scripts/lib/model-benchmark.ts"])
  sourceHashes[path]=digest(await readFile(resolve(root,path),"utf8"));
 return {packs,sourceHashes,packHashes};
}
export function resolveBoundBenchmarkTask(row:BenchmarkDraft,runtime:RepresentativeRuntime):PracticeTask{
 if(!row.taskBinding)throw Error(`Production task binding required: ${row.id}`);
 const packs=runtime.packs.filter(pack=>pack.language===row.language&&pack.version===row.contentVersion);
 const tasks=packs.flatMap(pack=>pack.units.flatMap(unit=>unit.tasks)).filter(task=>task.id===row.taskBinding!.taskId);
 if(tasks.length!==1)throw Error(`Production task is missing, duplicated or stale: ${row.id}`);
 const task=tasks[0]!;
 if(digest(JSON.stringify(task))!==row.taskBinding.taskSha256||!resolveRepresentativeTask(task)||
  task.version!==row.taskVersion||task.constructionId!==row.constructionId||task.rubricVersion!==row.rubricVersion||
  task.modality!==row.modality||task.prompt!==row.prompt||task.normalisation.terminalFullStop!==row.normalisation.terminalFullStop)
  throw Error(`Production task does not match benchmark context: ${row.id}`);
 return task;
}
export function assessBoundBenchmark(row:BenchmarkDraft,task:PracticeTask,at:string){
 return assessControlledTask({version:2,type:"attempt",id:row.id,language:row.language,at,task,
  response:{text:row.response,sha256:digest(row.response),originalTranscriptSha256:null,transcriptEdited:false},
  timing:{startedAt:at,activeMs:null,firstInputMs:null,source:"unavailable"},
  assistance:{hintCount:0,solutionRevealed:false,exampleSeen:false,selfReportedAssistance:false},
  audio:null,previousAttemptId:null},task,at,`assessment-${row.id}`);
}
