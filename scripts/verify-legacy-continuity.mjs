import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {execFileSync} from "node:child_process";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,".."),require=createRequire(resolve(root,"Apps/English/English-Automaticity/package.json"));
const {chromium}=require("@playwright/test");
const output=resolve(root,`artifacts/legacy-continuity/${new Date().toISOString().replace(/[:.]/g,"-")}`);await mkdir(output,{recursive:true});
const entry=resolve(output,"fixture.mjs"),bundle=resolve(output,"fixture.js");
await writeFile(entry,`import * as core from ${JSON.stringify(resolve(root,"shared/learning-core/src/automaticity/index.ts").replaceAll("\\","/"))};\nimport * as en from ${JSON.stringify(resolve(root,"Apps/English/English-Automaticity/apps/web/lib/audio-db.ts").replaceAll("\\","/"))};\nimport * as de from ${JSON.stringify(resolve(root,"Apps/Deutsch-Automaticity/apps/web/src/features/audio/audio-repository.ts").replaceAll("\\","/"))};\nwindow.Fixture={core,en,de};`);
execFileSync("bun",["build",entry,"--target=browser","--format=iife",`--outfile=${bundle}`],{cwd:root,stdio:"pipe"});
const server=createServer(async(req,res)=>{res.setHeader("Content-Type",req.url==="/fixture.js"?"text/javascript":"text/html");res.end(req.url==="/fixture.js"?await readFile(bundle):'<!doctype html><html><title>Synthetic continuity check</title><body><script src="/fixture.js"></script></body></html>');});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({channel:"msedge",headless:true}),report={createdAt:new Date().toISOString(),scope:"Isolated synthetic legacy state and audio transactions; no real learner data",cases:[]};
try{for(const language of ["en","de"]){const context=await browser.newContext(),page=await context.newPage();const row={language,status:"running"};report.cases.push(row);
 try{await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result=await page.evaluate(async language=>{
   const {core}=window.Fixture,api=window.Fixture[language];
   const stateKey=language==="en"?"grammar-automaticity:v27":"GrammarAutomaticityV11_de";
   const now="2026-09-05T12:00:00.000Z",original=JSON.stringify({attempts:[{id:"prior",grammarTitle:"Synthetic construction",topic:"Synthetic construction",mode:"writing",inputText:"Original synthetic answer",createdAt:"2026-09-01T10:00:00.000Z",date:"2026-09-01T10:00:00.000Z",verified:true,passed:true,accuracyScore:100}]});
   localStorage.setItem(stateKey,original);const pack={language,version:"test",mappingVersion:"test",units:[{id:`${language}.c.test`,title:"Synthetic construction",level:"A1",familyIds:["G01"]}]};
   const imported=await core.syncLegacyPractice(localStorage,language,pack,now);const repeated=await core.syncLegacyPractice(localStorage,language,pack,now);
   if(imported.imported!==1 || repeated.imported!==0 || localStorage.getItem(stateKey)!==original)throw Error("Original history was changed or duplicated");
   const events=core.readAutomaticityEvents(localStorage,language).events;
   const reduced=core.reduceAutomaticityEvents(events,language,now);
   if(reduced.attempts[0].eligibleForMastery || reduced.attempts[0].independent)throw Error("Legacy verification became independent evidence");
   const save=language==="en"?api.putAudio:api.saveAudio;
   const recording={id:"committed",date:now,createdAt:now,topic:"Synthetic",grammarTitle:"Synthetic",transcript:"Synthetic audio",corrected:"Synthetic audio",repetitionStatus:"new",blob:new Blob([new Uint8Array([1,2,3,4])],{type:"audio/webm"})};
   await save(recording);
   const native=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const request=native.apply(this,args);request.addEventListener("success",()=>this.transaction.abort(),{once:true});return request;};
   let aborted=false;try{await save({...recording,id:"aborted"});}catch{aborted=true;}finally{IDBObjectStore.prototype.put=native;}
   if(!aborted)throw Error("Audio save claimed success before the transaction committed");
   const media=await api.listAudio();if(media.length!==1 || media[0].id!=="committed")throw Error("Aborted write damaged audio history");
   return {events,language,now,reduced,importedOnce:true,originalPreserved:true,abortedAudioSaveRejected:true,committedAudioKept:true};
  },language);
  const module=resolve(root,"shared/learning-core/src/automaticity/evidence.ts").replaceAll("\\","/");
  const expected=JSON.parse(execFileSync("bun",["--eval",`import {reduceAutomaticityEvents} from ${JSON.stringify(module)};const input=JSON.parse(await Bun.stdin.text());console.log(JSON.stringify(reduceAutomaticityEvents(input.events,input.language,input.now)));`],{cwd:root,input:JSON.stringify(result),encoding:"utf8"}));
  assert.deepEqual(result.reduced,expected);row.evidence={importedOnce:result.importedOnce,originalPreserved:result.originalPreserved,abortedAudioSaveRejected:result.abortedAudioSaveRejected,committedAudioKept:result.committedAudioKept,nodeBrowserReductionMatches:true};row.status="passed";
 }catch(error){row.status="failed";row.error=error.message;row.stack=error.stack;}
 await context.close();console.log(JSON.stringify(row));
}}finally{await browser.close();await new Promise(resolve=>server.close(resolve));report.status=report.cases.every(row=>row.status==="passed")?"passed":"failed";await writeFile(resolve(output,"report.json"),JSON.stringify(report,null,2));console.log(`Evidence: ${output}`);}
assert.equal(report.status,"passed");
