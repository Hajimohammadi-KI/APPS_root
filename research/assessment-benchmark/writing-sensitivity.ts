import {resolve} from "node:path";
import {hash,writingMetrics,type Verdict} from "./core";
const dir=resolve(import.meta.dir,"runs/writing-qwen3-4b-v1");
const bytes=await Bun.file(resolve(dir,"predictions.jsonl")).text();
const rows=bytes.trim().split("\n").map(s=>JSON.parse(s) as {language:string;label:"error"|"clean";verdict:Verdict;text:string;correction:string});
const normalized=(text:string)=>text.trim().replace(/\s+/g," ");
const contradicts=(row:typeof rows[number])=>(row.verdict==="correct"&&normalized(row.text)!==normalized(row.correction))||(row.verdict==="incorrect"&&normalized(row.text)===normalized(row.correction));
const result={schemaVersion:1,analysis:"Post-run sensitivity analysis prompted by code review, not a new independent test. Original predictions and preregistered v1 report preserved.",createdAt:new Date().toISOString(),predictionsSha256:hash(bytes),languages:Object.fromEntries(["en","de"].map(language=>{const subset=rows.filter(x=>x.language===language);return [language,{contradictoryCorrect:subset.filter(x=>x.verdict==="correct"&&contradicts(x)).length,contradictoryIncorrect:subset.filter(x=>x.verdict==="incorrect"&&contradicts(x)).length,strictCandidate:writingMetrics(subset.map(r=>({...r,verdict:contradicts(r)?"uncertain":r.verdict})))}];})),releaseEligible:false};
await Bun.write(resolve(dir,"sensitivity.json"),JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result,null,2));
