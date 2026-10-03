import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,".."),require=createRequire(resolve(root,"Apps/English/English-Automaticity/package.json"));
const {chromium,expect}=require("@playwright/test"),installed=process.argv.includes("--installed"),baseline=process.argv.includes("--baseline");
const folder=resolve(root,`artifacts/assessment-feedback-browser/${new Date().toISOString().replace(/[:.]/g,"-")}`);await mkdir(folder,{recursive:true});
const report={at:new Date().toISOString(),scope:`${installed?"Installed":"Compiled source"} app in isolated synthetic profiles; reviewer contradictions are transport fixtures, not linguistic labels`,cases:[]};
const browser=await chromium.launch({channel:"msedge",headless:true});
try{
 for(const language of ["en","de"]){
  const app=`Apps/${language==="en"?"English/English-Automaticity":"Deutsch-Automaticity"}`,publicRoot=resolve(root,app,"apps/web/public");
  const pack=JSON.parse(await readFile(resolve(publicRoot,`learning-core/curriculum-${language}.json`),"utf8"));
  const task=pack.units.flatMap(unit=>unit.tasks).find(task=>task.constructionAssessment?.rule===`${language}.inflection`&&task.stage==="retrieve"&&task.modality==="writing");
  assert(task);const answer=language==="en"?"Mina works in the library every day.":"Ich erkläre den neuen Plan.";
  const server=createServer(async(req,res)=>{
   const path=new URL(req.url,"http://localhost").pathname;
   const file=path==="/practice"?resolve(root,`shared/learning-core/browser/practice-${language}.html`):["practice.js","practice.css",`curriculum-${language}.json`].some(name=>path===`/learning-core/${name}`)?resolve(publicRoot,path.slice(1)):null;
   if(!file){res.writeHead(404);res.end();return;}
   try{res.setHeader("Content-Type",file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".json")?"application/json":"text/html");res.end(await readFile(file));}catch(error){res.writeHead(500);res.end(String(error));}
  });await new Promise(done=>server.listen(0,"127.0.0.1",done));
  const base=installed?`http://127.0.0.1:${language==="en"?3202:3210}`:`http://127.0.0.1:${server.address().port}`;
  const context=await browser.newContext({serviceWorkers:"block",viewport:{width:1280,height:1050}}),page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(error.message));page.setDefaultTimeout(20000);
  const result={language,status:"running",checks:[]};report.cases.push(result);
  const events=()=>page.evaluate(lang=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${lang}:event:`)).map(key=>JSON.parse(localStorage.getItem(key))),language);
  const currentAttempt=async()=>{const id=await page.evaluate(lang=>JSON.parse(localStorage.getItem(`automaticity:v2:${lang}:session`)).submittedId,language);return(await events()).find(event=>event.id===id);};
  const action=(en,de)=>page.getByRole("button",{name:language==="en"?en:de,exact:true});
  const openReview=async()=>{if(!await page.locator("#response-review").evaluate(node=>node.open))await page.locator("#response-review > summary").click();};
  const submit=async()=>{await page.locator("#practice-response").fill(answer);await action("Save and check","Speichern und prüfen").click();await expect(action("Try again as a repair","Als Korrektur erneut versuchen")).toBeVisible();};
  try{
   await page.goto(`${base}/practice?task=${encodeURIComponent(task.id)}`,{waitUntil:"domcontentloaded"});
   await submit();const first=(await events()).find(event=>event.type==="attempt");assert(first);
   assert((await events()).some(event=>event.type==="assessment"&&event.attemptId===first.id&&event.verdict==="pass"));
   if(!baseline)assert.equal(first.task.definitionSha256,createHash("sha256").update(JSON.stringify(task)).digest("hex"));
   await openReview();await page.locator("#review-attempt").selectOption(first.id);
   await page.locator("#review-kind").selectOption("human");await page.locator("#reviewer-name").fill("Synthetic browser reviewer, not real approval");
   await page.locator("#review-verdict").selectOption("needs_repair");await page.locator("#review-feedback").fill("Synthetic disagreement for transport testing only. This is not a real language correction.");
   await page.locator("#review-correction").fill("Synthetic correction retained for the transport test.");
   await action("Save separate review","Separate Bewertung speichern").click();
   await expect(page.locator("#review-save-status")).toContainText(language==="en"?"Review saved separately":"Bewertung separat gespeichert");
   const preserved=(await events()).filter(event=>event.attemptId===first.id||event.id===first.id);assert.equal(preserved.length,3);
   await action("Try again as a repair","Als Korrektur erneut versuchen").click();await submit();
   if(baseline){const current=await currentAttempt();assert.notEqual(current.id,first.id);assert((await events()).some(event=>event.type==="assessment"&&event.attemptId===current.id&&event.verdict==="pass"));await expect(page.locator("#assessment-feedback-memory")).toHaveCount(0);result.status="reproduced_unprotected_judgment";continue;}
   await expect.poll(async()=>(await events()).some(event=>event.type==="assessment"&&event.evaluator.id==="feedback-memory")).toBe(true);
   const guard=(await events()).find(event=>event.type==="assessment"&&event.evaluator.id==="feedback-memory");assert.equal(guard.verdict,"not_assessed");assert.equal(guard.evaluator.scopeApproved,false);
   const guardedOriginal=(await events()).find(event=>event.id===guard.supersedes);assert.equal(guardedOriginal.verdict,"pass");
   result.checks.push("exact response and task definition are bound; original proposal preserved; disputed repeat abstains without mastery credit");
   await page.reload();await expect(page.locator("#practice-root")).toContainText(language==="en"?"A previous reviewer disputed":"Eine frühere Prüfung widersprach");
   for(const event of preserved)assert.deepEqual((await events()).find(row=>row.id===event.id),event);
   result.checks.push("reload retains guarded feedback and immutable original attempt/review history");
   await openReview();await expect(page.locator("#assessment-feedback-summary")).toContainText(language==="en"?"1 reviewer disagreements":"1 abweichende Rückmeldungen");
   const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#assessment-feedback-export").click()]);
   const exportPath=resolve(folder,`synthetic-feedback-${language}.json`);await download.saveAs(exportPath);const exported=JSON.parse(await readFile(exportPath,"utf8"));
   assert.equal(exported.independentReviewEstablished,false);assert.equal(exported.cases.length,1);assert.equal(exported.cases[0].attempt.response.text,answer);result.exportPath=exportPath;
   result.checks.push("explicit download contains exact saved feedback; no independent review or qualification inferred");
   await page.locator("#review-attempt").selectOption(first.id);await page.locator("#review-kind").selectOption("human");await page.locator("#reviewer-name").fill("Synthetic browser reviewer, not real approval");
   await page.locator("#review-verdict").selectOption("pass");await page.locator("#review-feedback").fill("Synthetic retraction for transport testing only; the earlier disagreement is withdrawn.");
   await action("Save separate review","Separate Bewertung speichern").click();await expect(page.locator("#assessment-feedback-summary")).toContainText(language==="en"?"0 reviewer disagreements":"0 abweichende Rückmeldungen");
   await action("Try again as a repair","Als Korrektur erneut versuchen").click();await submit();
   const newest=await currentAttempt(),newestAssessments=(await events()).filter(event=>event.type==="assessment"&&event.attemptId===newest.id);
   assert.equal(newestAssessments.length,1);assert.equal(newestAssessments[0].verdict,"pass");assert.equal(newestAssessments[0].evaluator.scopeApproved,false);
   result.checks.push("later review retracts the dispute without deleting prior events; automatic mastery remains unapproved");
   await page.screenshot({path:resolve(folder,`${language}.png`),fullPage:true});assert.deepEqual(errors,[]);result.status="verified";
  }catch(error){result.status="failed";result.error=String(error);await writeFile(resolve(folder,`${language}-failed-events.json`),JSON.stringify(await events(),null,2));throw error;}
  finally{await context.close();await new Promise(done=>server.close(done));}
 }
}finally{await browser.close();await writeFile(resolve(folder,"report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({folder,cases:report.cases.map(({language,status})=>({language,status}))}));}
