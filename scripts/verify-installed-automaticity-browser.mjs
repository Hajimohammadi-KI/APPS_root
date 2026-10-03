import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");
const require=createRequire(resolve(root,"Apps/English/English-Automaticity/package.json"));
const {chromium,expect}=require("@playwright/test");
const output=resolve(root,`artifacts/installed-automaticity-browser/${new Date().toISOString().replace(/[:.]/g,"-")}`);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:"msedge",headless:true});
const report={createdAt:new Date().toISOString(),scope:"HTTP runtime identified per case; isolated browser profiles with synthetic state and audio, never the normal Electron profile",cases:[]};
try {
  for(const language of ["en","de"]){
    const override=process.argv.find(arg=>arg.startsWith(`--${language}-base=`))?.split("=")[1];
    const base=override??`http://127.0.0.1:${language==="en"?3202:3210}`;
    const context=await browser.newContext({viewport:{width:1365,height:1000},acceptDownloads:true});
    const page=await context.newPage();page.setDefaultTimeout(20000);
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    const row={language,status:"running",base,runtime:override?"compiled-web-override":"installed-desktop"};report.cases.push(row);
    try{
      const served=await (await context.request.get(`${base}/learning-core/practice.js`)).body();
      const expected=await readFile(resolve(root,"shared/learning-core/browser/practice.js"));
      const hash=value=>createHash("sha256").update(value).digest("hex");
      assert.equal(hash(served),hash(expected));row.practiceBundleSha256=hash(served);
      row.runtimeAssets=[];
      const app=language==="en"?"Apps/English/English-Automaticity":"Apps/Deutsch-Automaticity";
      for(const path of ["sw.js",`learning-core/curriculum-${language}.json`]){
        const actual=await (await context.request.get(`${base}/${path}`)).body();
        const canonical=await readFile(resolve(root,`${app}/apps/web/public/${path}`));
        assert.equal(hash(actual),hash(canonical));row.runtimeAssets.push({path,sha256:hash(actual)});
      }
      row.routes=[];
      for(const route of language==="en"?["/daily","/grammar"]:["/heute","/grammatik"]){
        await page.goto(base+route,{waitUntil:"domcontentloaded"});
        await expect(page.locator('a[href="/practice"]').first()).toBeVisible();row.routes.push(route);
      }
      await page.goto(base+"/practice",{waitUntil:"domcontentloaded"});
      await page.locator("#practice-response").waitFor();
      await page.locator("#practice-response").fill("Synthetic installed-runtime draft");
      await page.reload();await expect(page.locator("#practice-response")).toHaveValue("Synthetic installed-runtime draft");
      row.checkpoint="service-worker-ready";
      await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
      row.checkpoint="service-worker-controller";
      row.workerBeforeControl=await page.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.state,installing:r.installing?.state,waiting:r.waiting?.state}))}));
      row.checkpoint="service-worker-cache";
      await page.waitForFunction(async(language)=>!!await caches.match("/practice")&&!!await caches.match("/learning-core/practice.js")&&!!await caches.match(`/learning-core/curriculum-${language}.json`),language);
      // A new task URL may never have been cached online. Its shell must still work.
      await page.evaluate(async()=>{for(const name of await caches.keys()){const cache=await caches.open(name);for(const request of await cache.keys()){const url=new URL(request.url);if(url.pathname==="/practice"&&url.search)await cache.delete(request);}}});
      await context.setOffline(true);await page.reload();
      // ready promises an active registration. Verify control on the actual offline navigation.
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      await expect(page.locator("#practice-response")).toHaveValue("Synthetic installed-runtime draft");
      await page.getByRole("button",{name:language==="en"?"Produce":"Produzieren",exact:true}).click();
      await page.locator("#practice-response").fill("Synthetic offline original response");
      await page.getByRole("button",{name:language==="en"?"Save and check":"Speichern und prüfen",exact:true}).click();
      row.checkpoint="offline-assessment";
      await page.waitForFunction(language=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${language}:event:`)).some(key=>{const event=JSON.parse(localStorage.getItem(key));return event.type==="assessment"&&event.verdict==="not_assessed";}),language);
      row.offlineDraftAndUnassessedSave=true;
      await context.setOffline(false);
      await page.setViewportSize({width:390,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:resolve(output,`${language}-practice-mobile.png`),fullPage:true});
      await page.setViewportSize({width:1365,height:1000});
      await page.goto(base+(language==="en"?"/?screen=settings":"/einstellungen"),{waitUntil:"domcontentloaded"});
      const exportButton=page.getByRole("button",{name:language==="en"?"Export data":"Lerndaten exportieren",exact:true});
      await expect(exportButton).toBeVisible();
      await page.addScriptTag({url:base+"/learning-core/automaticity-v2.js"});
      const savedDailyPlan=await page.evaluate(language=>{
        const core=window.AutomaticityV2,plan={...core.loadDailyPlan(localStorage,language,new Date().toISOString()).plan,responseGoal:8,paused:true};
        core.saveDailyPlan(localStorage,language,plan);const key=core.dailyPlanKey(language,plan.day);return {key,value:localStorage.getItem(key)};
      },language);
      const marker=`automaticity:v2:${language}:draft:installed-fixture`;
      const audioHash=await page.evaluate(async({language,marker})=>{
        localStorage.setItem(marker,"Preserve synthetic unfinished answer");
        const wav=new ArrayBuffer(16044),v=new DataView(wav);const str=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
        str(0,"RIFF");v.setUint32(4,16036,true);str(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,"data");v.setUint32(40,16000,true);for(let i=0;i<8000;i++)v.setInt16(44+i*2,Math.sin(i*2*Math.PI*440/8000)*2000,true);
        const saved=await window.AutomaticityV2.storeRecording(indexedDB,{id:"installed-synthetic-audio",blob:new Blob([wav],{type:"audio/wav"}),durationMs:1000,createdAt:new Date().toISOString(),language,taskId:"synthetic-fixture"});return saved.sha256;
      },{language,marker});
      const downloaded=page.waitForEvent("download");await exportButton.click();const download=await downloaded;
      const file=resolve(output,`${language}-settings-backup.json`);await download.saveAs(file);
      const backup=JSON.parse(await readFile(file,"utf8"));assert.equal(backup.kind,"automaticity.complete-backup");assert.equal(backup.language,language);assert(backup.localStorage.some(([key])=>key===marker));
      assert.equal(backup.localStorage.find(([key])=>key===savedDailyPlan.key)?.[1],savedDailyPlan.value);
      assert(backup.databases.some(db=>db.name===`automaticity-v2-${language}`&&db.stores.some(store=>store.records.length>0)));
      const fileInput=page.locator('input[type="file"][accept="application/json,.json"]');
      const corrupted=structuredClone(backup);corrupted.sha256="0".repeat(64);
      let dialogs=0;page.on("dialog",async dialog=>{dialogs++;await dialog.accept();});
      await fileInput.setInputFiles({name:"corrupt.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(corrupted))});
      await expect(page.getByRole("status").filter({hasText:/checksum/i})).toBeVisible();assert.equal(dialogs,0);
      assert.equal(await page.evaluate(marker=>localStorage.getItem(marker),marker),"Preserve synthetic unfinished answer");
      await page.evaluate(marker=>localStorage.setItem(marker,"Changed synthetic draft"),marker);
      await page.evaluate(key=>localStorage.setItem(key,"Changed synthetic plan"),savedDailyPlan.key);
      const navigation=page.waitForEvent("domcontentloaded");await fileInput.setInputFiles(file);await navigation;
      await expect(exportButton).toBeVisible();assert.equal(dialogs,1);
      assert.equal(await page.evaluate(marker=>localStorage.getItem(marker),marker),"Preserve synthetic unfinished answer");
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),savedDailyPlan.key),savedDailyPlan.value);row.dailyPlanPreserved=true;
      await page.addScriptTag({url:base+"/learning-core/automaticity-v2.js"});
      const restored=await page.evaluate(async language=>{const core=window.AutomaticityV2;const audio=await core.readRecording(indexedDB,language,"installed-synthetic-audio");const player=document.createElement("audio");player.src=URL.createObjectURL(audio.blob);document.body.append(player);await new Promise((resolve,reject)=>{player.onloadedmetadata=resolve;player.onerror=()=>reject(Error("Restored audio unavailable"));});const result={hash:await core.sha256(await audio.blob.arrayBuffer()),duration:player.duration};URL.revokeObjectURL(player.src);return result;},language);
      assert.equal(restored.hash,audioHash);assert(Math.abs(restored.duration-1)<0.05);row.settingsExportRestore={corruptionRejected:true,confirmedRestore:true,audioSha256:audioHash,audioDuration:restored.duration};
      await page.screenshot({path:resolve(output,`${language}-settings.png`),fullPage:true});
      assert.deepEqual(errors,[]);row.pageErrors=errors;row.status="passed";
    }catch(error){row.status="failed";row.error=error.message;row.stack=error.stack;row.pageErrors=errors;row.browserState=await page.evaluate(async()=>({worker:!!navigator.serviceWorker.controller,caches:await caches.keys(),body:document.body.innerText.slice(-3500)})).catch(()=>null);await page.screenshot({path:resolve(output,`${language}-failure.png`),fullPage:true}).catch(()=>{});}
    finally{await context.close();console.log(JSON.stringify(row));}
  }
}finally{await browser.close();report.status=report.cases.every(row=>row.status==="passed")?"passed":"failed";await writeFile(resolve(output,"report.json"),JSON.stringify(report,null,2));console.log(`Evidence: ${output}`);}
assert.equal(report.status,"passed");
