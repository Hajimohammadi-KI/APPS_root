import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,".."),require=createRequire(resolve(root,"Apps/English/English-Automaticity/package.json"));
const {chromium,expect}=require("@playwright/test"),installed=process.argv.includes("--installed");
const folder=resolve(root,`artifacts/phase7-browser/${new Date().toISOString().replace(/[:.]/g,"-")}`);await mkdir(folder,{recursive:true});
let language="en";
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,"http://localhost").pathname;let file;
 if(path==="/review")file=resolve(root,"docs/model-evaluation/REVIEW.html");
 else if(path==="/practice")file=resolve(root,`shared/learning-core/browser/practice-${language}.html`);
 else if(path==="/overview"){res.setHeader("Content-Type","text/html; charset=utf-8");res.end(`<html lang="${language}"><meta name="viewport" content="width=device-width,initial-scale=1"><section data-automaticity-overview></section><script src="/learning-core/overview.js"></script></html>`);return;}
 else if(path===`/learning-core/curriculum-${language}.json`)file=resolve(root,`${language==="en"?"Apps/English/English-Automaticity":"Apps/Deutsch-Automaticity"}/apps/web/public${path}`);
 else if(["/learning-core/practice.js","/learning-core/practice.css","/learning-core/overview.js"].includes(path))file=resolve(root,"shared/learning-core/browser",path.split("/").at(-1));
 else {res.writeHead(404);res.end();return;}res.setHeader("Content-Type",file.endsWith(".js")?"text/javascript; charset=utf-8":file.endsWith(".css")?"text/css":file.endsWith(".json")?"application/json":"text/html; charset=utf-8");res.end(await readFile(file));}catch(error){res.writeHead(500);res.end(String(error));}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:"msedge",headless:true});const report={createdAt:new Date().toISOString(),status:"running",scope:installed?"Installed apps; isolated synthetic browser profiles":"Compiled source assets; isolated synthetic browser profiles",cases:[]};
try{
 if(!process.argv.includes("--routes-only")){
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}}),page=await context.newPage();
 await page.goto(local+"/review");await expect(page.locator("details")).toHaveCount(20);
 await page.getByRole("button",{name:"Download my review"}).click();await expect(page.locator("#status")).toContainText("Enter your name");
 await page.locator("#reviewer").fill("Synthetic browser fixture");await page.locator("#role").fill("Automated transport test, not a human review");
 const example=page.locator("details").first();await example.locator("summary").focus();await page.keyboard.press("Enter");
 for(const [field,value] of [["verdict","not_assessed"],["targetObserved","null"],["meaningPreserved","null"]])await example.locator(`[data-field="${field}"]`).selectOption(value);
 await example.locator("textarea").fill("Synthetic export only; not an approval.");await page.reload();await example.locator("summary").click();await expect(example.locator("textarea")).toHaveValue("Synthetic export only; not an approval.");
 const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Download my review"}).click();const download=await downloadPromise;await download.saveAs(resolve(folder,"synthetic-review.json"));
 const exported=JSON.parse(await readFile(resolve(folder,"synthetic-review.json"),"utf8"));assert.equal(exported.labels.length,1);assert.equal(exported.labels[0].label.verdict,"not_assessed");
 await page.locator("#language").selectOption("de");await expect(page.locator("details:visible")).toHaveCount(10);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:resolve(folder,"review-mobile.png"),fullPage:true});
 report.cases.push("offline review interface: blank labels, keyboard, saved draft, partial export and mobile layout");await context.close();
 }
 for(language of (process.argv.includes("--german-only")?["de"]:["en","de"])){
  const base=installed?`http://127.0.0.1:${language==="en"?3202:3210}`:local;
  const context=await browser.newContext({viewport:{width:1365,height:950},serviceWorkers:"block"}),page=await context.newPage(),errors=[];page.on("pageerror",error=>errors.push(error.message));
  const pack=await (await fetch(base+`/learning-core/curriculum-${language}.json`)).json();assert.equal(pack.units.length,language==="en"?124:156);
  const unit=pack.units.find(row=>row.id===(language==="en"?"en.c.119":"de.c.150")),task=unit.tasks.find(row=>row.stage==="retrieve"&&row.modality==="writing");
  await page.goto(base+`/practice?task=${task.id}`);await expect(page.locator("#practice-response")).toBeVisible();
  await page.locator("#practice-response").fill(task.acceptedAnswers[0].toLowerCase());await page.getByRole("button",{name:language==="en"?"Save and check":"Speichern und prüfen",exact:true}).click();
  await page.waitForFunction(lang=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${lang}:event:`)).some(key=>JSON.parse(localStorage.getItem(key)).verdict==="needs_repair"),language);
  const attemptId=await page.evaluate(lang=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${lang}:event:`)).map(key=>JSON.parse(localStorage.getItem(key))).find(row=>row.type==="attempt").id,language);
  const routes=installed?(language==="en"?["/daily","/grammar","/studio","/?screen=errors","/teacher","/?screen=progress"]:["/heute","/grammatik","/studio","/fehler","/wiederholungen","/lehrkraft","/fortschritt"]):["/overview"];
  for(const route of routes){report.lastRoute=language+route;await page.goto(base+route);const link=page.locator(`[data-repair-queue] a[data-attempt="${attemptId}"]`);await expect(link).toBeVisible();assert((await link.getAttribute("href")).includes(`attempt=${attemptId}`));}
  await page.screenshot({path:resolve(folder,`${language}-overview.png`)});
  await page.locator(`[data-repair-queue] a[data-attempt="${attemptId}"]`).click();await expect(page.locator("#review-attempt")).toHaveValue(attemptId);
  await page.getByRole("button",{name:language==="en"?"Start a repair of this response":"Korrektur dieser Antwort beginnen",exact:true}).click();await page.locator("#practice-response").fill(task.acceptedAnswers[0]);await page.getByRole("button",{name:language==="en"?"Save and check":"Speichern und prüfen",exact:true}).click();
  await page.waitForFunction(({lang,id})=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${lang}:event:`)).map(key=>JSON.parse(localStorage.getItem(key))).some(row=>row.type==="attempt"&&row.previousAttemptId===id),{lang:language,id:attemptId});
  await page.goto(base+routes[0]);await expect(page.locator("[data-repair-queue]")).toHaveCount(0);
  const writtenOnly=pack.units.find(row=>row.id===(language==="en"?"en.c.124":"de.c.156"));await page.goto(base+`/practice?task=${writtenOnly.tasks.find(row=>row.stage==="retrieve").id}`);await expect(page.locator("#practice-response")).toBeVisible();await expect(page.getByRole("button",{name:language==="en"?"Speak":"Sprechen",exact:true})).toHaveCount(0);
  await page.screenshot({path:resolve(folder,`${language}-supplement.png`)});assert.deepEqual(errors,[]);report.cases.push(`${language}: ${routes.length} routes agree on the original repair; linked correction clears queue; new spelling task is writing-only`);await context.close();
 }
 if(installed&&!process.argv.includes("--german-only")){
  const context=await browser.newContext();await context.addInitScript(()=>{navigator.serviceWorker.register=()=>Promise.reject(new DOMException("Synthetic browser policy refusal","SecurityError"));});
  const page=await context.newPage(),errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:3202/?screen=progress");await expect(page.locator("[data-automaticity-overview]")).toBeVisible();await page.waitForLoadState("networkidle");assert.deepEqual(errors,[]);
  report.cases.push("English Progress remains usable when service-worker registration rejects");await context.close();
 }
 report.status="passed";
}catch(error){report.status="failed";report.error=String(error);process.exitCode=1;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));await writeFile(resolve(folder,"report.json"),JSON.stringify(report,null,2));console.log(JSON.stringify({folder,...report}));}
