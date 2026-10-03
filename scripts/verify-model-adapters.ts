import assert from "node:assert/strict";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dir,".."),folder=resolve(root,`artifacts/model-adapter-gates/${new Date().toISOString().replace(/[:.]/g,"-")}`);await mkdir(folder,{recursive:true});
let mode="lt-valid",requests:unknown[]=[];
const server=Bun.serve({hostname:"127.0.0.1",port:0,async fetch(request){
 if(mode.startsWith("lt")){const form=await request.formData();requests.push(Object.fromEntries(form));return Response.json({software:{version:mode==="lt-valid"?"synthetic-1":"changed"},matches:[]});}
 const input:unknown=await request.json();requests.push(input);
 if(mode==="unavailable")return new Response("Unavailable",{status:503});
 return Response.json(mode==="malformed"?{verdict:"invented",version:"synthetic-1"}:{version:"synthetic-1",verdict:"pass",targetObserved:true,meaningPreserved:true});
}});
const cases:string[]=[];let status="running",error:string|undefined;
try{
 for(const [testMode,candidate] of [["lt-valid","languagetool"],["lt-changed","languagetool"],["pretrained","pretrained-local"],["malformed","pretrained-local"],["unavailable","pretrained-local"]]){
  mode=testMode!;requests=[];
  const child=Bun.spawn(["bun","scripts/evaluate-model-candidates.ts",`--candidate=${candidate}`,"--version=synthetic-1",`--endpoint=http://127.0.0.1:${server.port}/assess`],{cwd:root,stdout:"pipe",stderr:"pipe"});
  const stdout=await new Response(child.stdout).text(),stderr=await new Response(child.stderr).text();assert.equal(await child.exited,0,stderr);
  const runPath=JSON.parse(stdout.trim()).folder;const run=JSON.parse(await readFile(resolve(runPath,"run.json"),"utf8")),report=JSON.parse(await readFile(resolve(runPath,"report.json"),"utf8"));
  assert.equal(requests.length,20);assert.equal(report.approved,false);assert.equal(report.qualification.eligibleForReleaseReview,false);
  if(testMode!=="pretrained")assert(run.predictions.every((row:{verdict:string})=>row.verdict==="not_assessed"));
  if(testMode==="pretrained")assert(report.diagnostics.some((scope:{unsafePasses:number})=>scope.unsafePasses>0));
  for(const input of requests){const keys=Object.keys(input as object);assert(!keys.some(key=>["expected","acceptedAnswers","humanReviewIds","reviews"].includes(key)));}
  if(testMode==="lt-changed"||testMode==="malformed"||testMode==="unavailable")assert.equal(report.observations.filter((row:{error?:string})=>row.error).length,20);
  cases.push(`${testMode}: isolated synthetic provider, no gold-label leakage, no activation`);
 }
 status="passed";
}catch(caught){status="failed";error=String(caught);process.exitCode=1;}
finally{server.stop(true);await writeFile(resolve(folder,"report.json"),JSON.stringify({status,cases,error,limit:"Mock transport tests, not real candidate benchmarks"},null,2));console.log(JSON.stringify({status,cases:cases.length,error,folder}));}
