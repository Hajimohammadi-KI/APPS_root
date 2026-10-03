import {mkdir,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {REPRESENTATIVE_SCOPES,resolveRepresentativeTask} from "../shared/learning-core/src/automaticity/representative-tasks";
import {REPRESENTATIVE_FIXTURES} from "../shared/learning-core/src/automaticity/representative-fixtures";
import {digest,parseManifest,type BenchmarkDraft,type BenchmarkManifest} from "./lib/model-benchmark";
import {loadRepresentativeRuntime} from "./lib/representative-model-candidate";

const root=resolve(import.meta.dir,".."),runtime=await loadRepresentativeRuntime(root);
const output=resolve(root,Bun.argv.find(value=>value.startsWith("--output="))?.slice(9)??"docs/model-evaluation/representative-development.json");
const cases:BenchmarkDraft[]=[];
for(const scope of REPRESENTATIVE_SCOPES){
 const language=scope.rule.startsWith("en.")?"en":"de",pack=runtime.packs.find(pack=>pack.language===language)!;
 const task=pack.units.find(unit=>unit.id===scope.constructionId)?.tasks.find(task=>task.stage==="retrieve"&&task.modality==="writing"&&resolveRepresentativeTask(task)?.scope.rule===scope.rule);
 if(!task)throw Error(`Missing current representative writing task ${scope.rule}`);
 const fixture=REPRESENTATIVE_FIXTURES.find(row=>row.rule===scope.rule)!,scenario=scope.scenarios[0];
 const responses:{name:string;category:BenchmarkDraft["category"];response:string;expected:BenchmarkDraft["expected"]}[]=[
  {name:"canonical",category:"correct_alternative",response:scenario.example,expected:"pass"},
  {name:"alternative",category:"correct_alternative",response:fixture.alternatives[0][0]!,expected:"pass"},
  {name:"grammar",category:"grammar_error",response:scenario.error,expected:"needs_repair"},
  {name:"wrong-role",category:"off_target",response:fixture.wrongRole,expected:"needs_repair"},
  {name:"unsupported",category:"ambiguous",response:fixture.unsupported,expected:"not_assessed"},
  {name:"damaged-text",category:"asr_corruption",response:scenario.example+" \uFFFD",expected:"not_assessed"},
  ...(fixture.missingTarget?[{name:"missing-target",category:"off_target" as const,response:fixture.missingTarget,expected:"target_not_observed" as const}]:[]),
 ];
 for(const input of responses)cases.push({id:`dev-representative-${scope.rule}-${input.name}`,language,modality:task.modality,
  contentVersion:pack.version,taskVersion:task.version,constructionId:task.constructionId,rubricVersion:task.rubricVersion,
  sourceId:"representative-engineering-fixtures-2026-09-05",license:"Original model-authored project regression examples; no third-party extracts or learner records.",
  partition:"development",itemFamily:task.itemFamily,sourceGroup:"representative-implementation-regressions",templateFamily:`representative-${scope.rule}`,learnerGroup:null,
  contentFingerprint:digest(JSON.stringify([language,task.prompt.normalize("NFC").trim().replace(/\s+/gu," ").toLowerCase(),input.response.normalize("NFC").trim().replace(/\s+/gu," ").toLowerCase()])),
  category:input.category,expected:input.expected,humanReviewIds:[],adjudicated:false,prompt:task.prompt,response:input.response,
  acceptedAnswers:[scenario.example],normalisation:{terminalFullStop:task.normalisation.terminalFullStop},
  taskBinding:{taskId:task.id,taskSha256:digest(JSON.stringify(task))},authoredBy:"Codex",reviewStatus:"pending",reviews:[],adjudication:null,audioSha256:null});
}
const manifest:BenchmarkManifest={schemaVersion:1,version:"representative-development-2026-09-05.1",createdAt:new Date().toISOString(),
 purpose:"Development adapter regression only: reuses implementation-authored examples, not unseen evaluation. Expected labels are unreviewed hypotheses. The ambiguous category includes unsupported wording that may be grammatical. asr_corruption means synthetic damaged text here, not measured ASR or audio. acceptedAnswers contains one canonical example only for the closed-answer comparator; production tasks remain open. No calibration/final partition or language/learner qualification is created.",cases};
parseManifest(manifest);await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(manifest,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({output,cases:cases.length,constructionScopes:REPRESENTATIVE_SCOPES.length,independentReviews:0,approved:false}));
