import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");
const require=createRequire(resolve(root,"Apps/English/English-Automaticity/package.json"));
const {chromium}=require("@playwright/test");
const output=resolve(root,`artifacts/automaticity-preservation/${new Date().toISOString().replace(/[:.]/g,"-")}`);
await mkdir(output,{recursive:true});
const bundle=await readFile(resolve(root,"shared/learning-core/browser/automaticity-v2.js"),"utf8");
const server=createServer((req,res)=>{res.setHeader("Cache-Control","no-store");if(req.url==="/core.js"){res.setHeader("Content-Type","text/javascript");res.end(bundle);}else{res.setHeader("Content-Type","text/html");res.end('<!doctype html><html lang="en"><title>Isolated preservation verification</title><body><main>Only synthetic fixture data</main><script src="/core.js"></script></body></html>');}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
const browser=await chromium.launch({channel:"msedge",headless:true});
const report={createdAt:new Date().toISOString(),profile:"new nonpersistent context per language; synthetic JSON and WAV only",cases:[]};
try{
  for(const language of ["en","de"]){
    const context=await browser.newContext({serviceWorkers:"block"});const page=await context.newPage();await page.goto(`http://127.0.0.1:${port}`);
    const row={language,status:"running"};report.cases.push(row);
    try{
      row.evidence=await page.evaluate(async language=>{
        const core=window.AutomaticityV2;
        const stateKey=language==="en"?"grammar-automaticity:v27":"GrammarAutomaticityV11_de";
        const audioDb=language==="en"?"GrammarAutomaticityV27":"GrammarAutomaticityV11_de";
        const staticKey=`${language==="en"?"english":"deutsch"}-automaticity:grammar-progress:v3`;
        const state={version:language==="en"?27:11,attempts:[{id:"duplicate",text:"Synthetic"},{id:"duplicate",text:"Synthetic"}],reviews:[{id:"due",due:172800000}],settings:{minutes:15},draft:"Keep this unfinished text"};
        const original=JSON.stringify(state);localStorage.setItem(stateKey,original);localStorage.setItem(staticKey,"{partial-unreadable");localStorage.setItem("oauth-token","do-not-export");
        const wav=new ArrayBuffer(44+16000);const view=new DataView(wav);const str=(at,value)=>[...value].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));str(0,"RIFF");view.setUint32(4,wav.byteLength-8,true);str(8,"WAVEfmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,"data");view.setUint32(40,16000,true);for(let i=0;i<8000;i++)view.setInt16(44+i*2,Math.sin(i/8000*2*Math.PI*440)*2000,true);
        const blob=new Blob([wav],{type:"audio/wav"});const audioHash=await core.sha256(wav);
        const open=(name,stores)=>new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>stores.forEach(([store,keyPath])=>req.result.createObjectStore(store,keyPath?{keyPath}:undefined));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
        const write=async(dbName,store,keyPath,records)=>{const db=await open(dbName,[[store,keyPath]]);await new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");const target=tx.objectStore(store);target.clear();records.forEach(([key,value])=>keyPath?target.put(value):target.put(value,key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();};
        const read=async(name,store)=>{const db=await open(name,[[store,"id"]]);const result=await new Promise((resolve,reject)=>{const req=db.transaction(store,"readonly").objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});db.close();return result;};
        await write(audioDb,"audio","id",[["recording",{id:"recording",blob,transcript:"Synthetic recording",createdAt:new Date().toISOString()}]]);
        const teacherDb=language==="en"?"english-automaticity-teacher-content":"deutsch-automaticity-teacher-content";
        const teacher=await open(teacherDb,[["content","id"],["audio",null]]);teacher.close();
        await write(teacherDb,"content","id",[["lesson",{id:"lesson",title:"Synthetic teacher fixture",pending:true}]]);
        await write(teacherDb,"audio",null,[["lesson",blob]]);
        const persistence={storage:localStorage,indexedDB};
        const noLocalSpace={get length(){return localStorage.length;},key:index=>localStorage.key(index),getItem:key=>localStorage.getItem(key),setItem:()=>{throw new DOMException("Synthetic full localStorage","QuotaExceededError");},removeItem:key=>localStorage.removeItem(key)};
        const durable=await core.preserveLegacyStateDurable({storage:noLocalSpace,indexedDB},language,new Date().toISOString());
        if(durable.status!=="saved"||durable.keys<2)throw new Error("Legacy migration tried to consume localStorage quota");
        core.preserveLegacyState(localStorage,language,new Date().toISOString());
        const backup=await core.captureCompleteBackup(persistence,language);await core.validateCompleteBackup(backup,language);
        if(backup.localStorage.some(([key])=>key==="oauth-token"))throw new Error("Credential store was included");
        localStorage.setItem(stateKey,"changed");localStorage.setItem(staticKey,"changed");await write(audioDb,"audio","id",[]);await write(teacherDb,"audio",null,[]);
        await core.restoreCompleteBackup(persistence,backup,language);
        if(localStorage.getItem(stateKey)!==original||localStorage.getItem(staticKey)!=="{partial-unreadable")throw new Error("Local state did not round trip exactly");
        const recordings=await read(audioDb,"audio");if(recordings.length!==1||!(recordings[0].blob instanceof Blob)||await core.sha256(await recordings[0].blob.arrayBuffer())!==audioHash)throw new Error("Recording bytes were lost");
        const teacherAudio=await read(teacherDb,"audio");if(teacherAudio.length!==1||await core.sha256(await teacherAudio[0].arrayBuffer())!==audioHash)throw new Error("Teacher audio was lost");
        const player=document.createElement("audio");player.src=URL.createObjectURL(recordings[0].blob);document.body.append(player);await new Promise((resolve,reject)=>{player.onloadedmetadata=resolve;player.onerror=()=>reject(new Error("Restored audio is not playable"));setTimeout(()=>reject(new Error("Audio metadata timeout")),5000);});if(Math.abs(player.duration-1)>0.05)throw new Error("Wrong restored audio duration");URL.revokeObjectURL(player.src);
        let refused=false;try{await core.restoreCompleteBackup(persistence,backup,language==="en"?"de":"en");}catch{refused=true;}if(!refused||localStorage.getItem(stateKey)!==original)throw new Error("Cross-language restore was not rejected");
        const corrupted=structuredClone(backup);corrupted.localStorage[0][1]="tampered";refused=false;try{await core.restoreCompleteBackup(persistence,corrupted,language);}catch{refused=true;}if(!refused||localStorage.getItem(stateKey)!==original)throw new Error("Corrupt backup changed data");
        const incoming=structuredClone(backup);incoming.localStorage=incoming.localStorage.map(([key,value])=>[key,key===stateKey?"incoming":value]);const{sha256:oldHash,...payload}=incoming;incoming.sha256=await core.sha256(JSON.stringify(payload));
        let failOnce=true;const failing={get length(){return localStorage.length;},key:i=>localStorage.key(i),getItem:key=>localStorage.getItem(key),removeItem:key=>localStorage.removeItem(key),setItem:(key,value)=>{if(key===stateKey&&failOnce){failOnce=false;throw new DOMException("Synthetic quota failure","QuotaExceededError");}localStorage.setItem(key,value);}};
        refused=false;try{await core.restoreCompleteBackup({storage:failing,indexedDB},incoming,language);}catch{refused=true;}if(!refused||localStorage.getItem(stateKey)!==original)throw new Error("Failed restore did not roll back");
        const blocked={...failing,get length(){return localStorage.length;},setItem:(key,value)=>{if(key===stateKey)throw new DOMException("Synthetic persistent failure","QuotaExceededError");localStorage.setItem(key,value);}};
        try{await core.restoreCompleteBackup({storage:blocked,indexedDB},incoming,language);}catch{}
        if(!await core.recoverInterruptedRestore(persistence,language)||localStorage.getItem(stateKey)!==original)throw new Error("Interrupted restore journal did not recover");
        if(await core.recoverInterruptedRestore(persistence,language))throw new Error("Completed recovery was not idempotent");
        return {localKeys:backup.localStorage.length,databases:backup.databases.map(db=>({name:db.name,stores:db.stores.map(store=>({name:store.name,records:store.records.length}))})),audioSha256:audioHash,audioDurationSeconds:1,preservedDuplicates:true,preservedPartialJson:true,preservedDraftAndReviews:true,crossLanguageRejected:true,corruptionRejected:true,failedRestoreRolledBack:true,interruptedRestoreRecovered:true};
      },language);
      row.status="passed";
    }catch(error){row.status="failed";row.error=error.message;}
    await page.screenshot({path:resolve(output,`${language}.png`)});await context.close();console.log(JSON.stringify(row));
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));report.finishedAt=new Date().toISOString();report.status=report.cases.every(row=>row.status==="passed")?"passed":"failed";await writeFile(resolve(output,"report.json"),JSON.stringify(report,null,2));console.log(`Evidence: ${output}`);}
assert.equal(report.status,"passed");
