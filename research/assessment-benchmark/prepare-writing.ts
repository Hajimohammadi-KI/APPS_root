import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash, parseM2, referenceLabel, type Sentence } from "./core";
const base = resolve(import.meta.dir, "data"), output = resolve(import.meta.dir, "runs/writing-qwen3-4b-v1");
await mkdir(output, {recursive:true});
if (await Bun.file(resolve(output,"cases.jsonl")).exists()) throw Error("Frozen dataset already exists; create a new versioned directory");
const punctuation: Record<string,string> = {"’":"'","´":"'","‘":"'","′":"'","`":"'","“":'"',"”":'"',"˝":'"',"¨":'"',"„":'"',"『":'"',"』":'"',"–":"-","—":"-","―":"-","¬":"-","、":",","，":",","：":":","；":";","？":"?","！":"!","ِ":" ","\u200b":" "};
const normalized = (text: string) => [...text].map(c=>punctuation[c]??c).join("").replace(/\s/g,"");
function originalSurface(document: string, tokenized: string): string | null {
  let compact=""; const positions: number[]=[];
  for (let i=0;i<document.length;i++) { const c=punctuation[document[i]!]??document[i]!; if (/\s/.test(c)) continue; compact+=c;positions.push(i); }
  const target=normalized(tokenized), start=compact.indexOf(target);
  return start<0 ? null : document.slice(positions[start],positions[start+target.length-1]!+1).replace(/\s+/g," ").trim();
}
interface Case {id:string;language:"en"|"de";source:string;split:string;group:string;text:string;label:"error"|"clean";types:string[];reference:Sentence}
const cases: Case[]=[]; const excluded: Record<string,number>={}; const counts: Record<string,number>={};
const skip=(why:string)=>{excluded[why]=(excluded[why]??0)+1;};
function add(sentence:Sentence, info:Omit<Case,"reference"|"types"|"label">) {
  counts[info.language]=(counts[info.language]??0)+1;
  const label=referenceLabel(sentence);
  if (label==="ambiguous") return skip(`${info.language}:ambiguous annotation`);
  if (info.text.length < 12 || info.text.length > 600) return skip(`${info.language}:outside length bounds`);
  cases.push({...info,label,types:[...new Set(sentence.edits.map(e=>e.type))],reference:sentence});
}
for (const level of ["A","B","C","N"]) {
  const source=resolve(base,"english/wi+locness");
  const docs=(await Bun.file(resolve(source,`json/${level}.dev.json`)).text()).trim().split(/\r?\n/).map(line=>JSON.parse(line) as {id:string;text:string;userid?:string});
  const sentences=parseM2(await Bun.file(resolve(source,`m2/${level}.dev.gold.bea19.m2`)).text());
  for (const [i,sentence] of sentences.entries()) {
    const matches=docs.filter(doc=>normalized(doc.text).includes(normalized(sentence.text)));
    if (matches.length!==1) {skip("en:ambiguous or missing document alignment");continue;}
    const doc=matches[0]!,text=originalSurface(doc.text,sentence.text);
    if (!text) throw Error("Surface alignment failed");
    add(sentence,{id:`wi-locness:${level}:dev:${i}`,language:"en",source:level==="N"?"LOCNESS":"Write & Improve",split:"dev",group:`wi-locness:${doc.id}`,text});
  }
}
const german=resolve(base,"german/data");
const sourceMap=new Map<string,{source:string;group:string}[]>();
for (const source of ["falko","merlin"]) for (const line of (await Bun.file(resolve(german,`source/${source}-id-ctok-zh1.txt.test`)).text()).trim().split(/\r?\n/)) {
  const [id,text]=line.split("\t"); if (!id || !text) throw Error("Invalid German document mapping");
  const key=normalized(text);sourceMap.set(key,[...(sourceMap.get(key)??[]),{source,group:`${source}:${id}`}]);
}
for (const [i,sentence] of parseM2(await Bun.file(resolve(german,"fm-test.m2")).text()).entries()) {
  const groups=sourceMap.get(normalized(sentence.text));
  if (!groups?.length || new Set(groups.map(x=>x.group)).size!==1) {skip("de:ambiguous or missing document alignment");continue;}
  // The German release is tokenized; only undo whitespace before punctuation.
  const text=sentence.text.replace(/\s+([.,!?;:])/g,"$1").replace(/\(\s+/g,"(").replace(/\s+\)/g,")");
  add(sentence,{id:`fm:test:${i}`,language:"de",split:"test",...groups[0]!,text});
}
const selected:Case[]=[], used=new Set<string>();
for (const language of ["en","de"] as const) for (const label of ["error","clean"] as const) {
  const pool=cases.filter(x=>x.language===language&&x.label===label).sort((a,b)=>hash(`r36-v1:${a.id}`).localeCompare(hash(`r36-v1:${b.id}`)));
  let count=0;
  for (const row of pool) {const key=hash(normalized(row.text));if(used.has(key))continue;used.add(key);selected.push(row);if(++count===128)break;}
  if(count<128)throw Error(`Insufficient cases ${language} ${label}: ${count}`);
}
selected.sort((a,b)=>a.id.localeCompare(b.id));
const content=selected.map(x=>JSON.stringify(x)).join("\n")+"\n";
const manifest={schemaVersion:1,createdAt:new Date().toISOString(),seed:"r36-v1",selectionSha256:hash(content),counts,excluded,selected:512,labels:"Reference edited / reference no correction; includes grammar, spelling, punctuation and word choice. Not universal correctness or app task validity.",groupPolicy:"Official corpus split, exact text deduplication; document IDs retained. No training or tuning in this run. Sentence Wilson intervals are descriptive; within-document correlation may narrow them.",contamination:"Public data exposure during model pretraining unknown; diagnostic only.",screen:{minimumPerClass:100,maxFalseAcceptWilsonUpper:.05,minCorrectAcceptWilsonLower:.9}};
await Bun.write(resolve(output,"cases.jsonl"),content);
await Bun.write(resolve(output,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify(manifest,null,2));
