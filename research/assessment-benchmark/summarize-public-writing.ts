import {resolve} from "node:path";
import {hash,writingMetrics,type Verdict} from "./core";
const dir=resolve(import.meta.dir,"runs/writing-qwen3-4b-v1");
const original=await Bun.file(resolve(dir,"predictions.jsonl")).text();
type Row={id:string;source:string;language:string;label:"error"|"clean";verdict:Verdict;text:string;correction:string};
// LOCNESS requests sending an offprint of published research to its owner.
// No correspondence is authorized. Keep those diagnostics local, and publish
// only W&I and Falko–MERLIN aggregate outcomes; no learner text is exported.
const rows=original.trim().split("\n").map(s=>JSON.parse(s) as Row).filter(x=>x.source!=="LOCNESS");
if(rows.some(x=>!["Write & Improve","falko","merlin"].includes(x.source)))throw Error("Unknown source");
const same=(a:string,b:string)=>a.trim().replace(/\s+/g," ")===b.trim().replace(/\s+/g," ");
const inconsistent=(r:Row)=>r.verdict==="correct"?!same(r.text,r.correction):r.verdict==="incorrect"?same(r.text,r.correction):false;
const report={schemaVersion:1,completedAt:new Date().toISOString(),predictionsSha256:hash(original),publicSubset:"Write & Improve and Falko–MERLIN only. LOCNESS-derived results remain local because its publication terms request sending an offprint, which is not authorized. Subsetting is a licensing decision, not model selection.",counts:{completed:rows.length},languages:Object.fromEntries(["en","de"].map(language=>{const subset=rows.filter(x=>x.language===language);return [language,{candidate:writingMetrics(subset),contradictoryCorrect:subset.filter(x=>x.verdict==="correct"&&inconsistent(x)).length,contradictoryIncorrect:subset.filter(x=>x.verdict==="incorrect"&&inconsistent(x)).length,postHocConsistencySensitivity:writingMetrics(subset.map(r=>({...r,verdict:inconsistent(r)?"uncertain":r.verdict})))}];})),releaseEligible:false};
await Bun.write(resolve(dir,"public-report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report.counts),Object.fromEntries(Object.entries(report.languages).map(([k,v])=>[k,v.candidate])));
