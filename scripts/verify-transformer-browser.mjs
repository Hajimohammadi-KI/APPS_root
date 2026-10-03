import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'Apps/English/English-Automaticity/package.json'));
const {chromium,expect}=require('@playwright/test');
const folder=resolve(root,`artifacts/transformer-browser/${new Date().toISOString().replace(/[:.]/g,'-')}`);await mkdir(folder,{recursive:true});
const clientOnly=process.argv.includes('--client-only');
const report={createdAt:new Date().toISOString(),status:'running',scope:clientOnly?'Client-only synthetic transport checks; installed same-origin POST gate excluded':'Installed app endpoints and isolated synthetic browser transport fixtures; no human approval or learner profile changes',cases:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
 for(const language of ['en','de']){
  const base=`http://127.0.0.1:${language==='en'?3202:3210}`,app=language==='en'?'Apps/English/English-Automaticity':'Apps/Deutsch-Automaticity';
  const request=await browser.newContext();
  const endpoint=base+'/api/automaticity/transformer';
  const response=await request.request.get(endpoint);assert.equal(response.status(),200);assert.deepEqual(await response.json(),{enabled:false,approvals:[]});assert.equal(response.headers()['cache-control'],'no-store');
  if(!clientOnly){
   const disabledPost=await request.request.post(endpoint,{headers:{Origin:base},data:{attempt:{},approval:{approved:true}}});
   assert.equal(disabledPost.status(),200);assert.equal((await disabledPost.json()).assessment,null);
   assert.equal((await request.request.post(endpoint,{headers:{Origin:'https://unrelated.example'},data:{}})).status(),403);
  }
  assert.equal(hash(await (await request.request.get(base+'/learning-core/practice.js')).body()),hash(await readFile(resolve(root,'shared/learning-core/browser/practice.js'))));
  const pack=JSON.parse(await readFile(resolve(root,app,`apps/web/public/learning-core/curriculum-${language}.json`),'utf8'));
  const task=pack.units[0].tasks.find(row=>row.stage==='produce'&&row.modality==='writing');assert(task);await request.close();
  if(!clientOnly)report.cases.push(`${language}: actual installed endpoint disabled, same-origin enforcement and served bundle verified`);
  for(const mode of ['disabled','repair','wrong_response','failure']){
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();let posts=0,gets=0;const errors=[];page.on('pageerror',error=>errors.push(error.message));
   const approval={approved:true,evaluatorId:'synthetic-browser-provider',evaluatorVersion:'fixture-1',language,constructionIds:[task.constructionId],rubricVersions:[task.rubricVersion],modalities:['writing'],scopes:[{constructionId:task.constructionId,taskVersion:task.version,rubricVersion:task.rubricVersion,modality:'writing'}],benchmarkSha256:'a'.repeat(64),configurationSha256:'b'.repeat(64)};
   const original=language==='en'?'I is ready.':'Ich ist bereit.';
   await context.route('**/api/automaticity/transformer',async route=>{
    if(route.request().method()==='GET'){gets++;await route.fulfill({json:{enabled:mode!=='disabled',approvals:mode==='disabled'?[]:[approval]}});return;}
    posts++;const {attempt}=route.request().postDataJSON();assert.equal(attempt.response.text,original);assert.equal(attempt.response.sha256,hash(original));
    const stored=await page.evaluate(id=>Object.keys(localStorage).filter(key=>key.includes(':event:')).map(key=>JSON.parse(localStorage.getItem(key))).find(row=>row.id===id),attempt.id);assert.equal(stored.response.text,original);
    if(mode==='failure'){await route.fulfill({status:503,body:'Temporary test outage'});return;}
    const correction=language==='en'?'I am ready.':'Ich bin bereit.';
    await route.fulfill({json:{assessment:{version:2,type:'assessment',id:crypto.randomUUID(),language,at:new Date().toISOString(),attemptId:attempt.id,responseSha256:mode==='wrong_response'?'0'.repeat(64):attempt.response.sha256,taskVersion:task.version,rubricVersion:task.rubricVersion,verdict:'needs_repair',dimensions:{grammar:'fail',target:'observed',relevance:'pass',opportunities:1},evaluator:{id:approval.evaluatorId,version:approval.evaluatorVersion,kind:'transformer',scopeApproved:true,reviewId:approval.benchmarkSha256},uncertainty:false,confidence:null,feedback:'Synthetic browser fixture correction.',correction,spans:[{start:language==='en'?2:4,end:language==='en'?4:7,explanation:'Synthetic fixture error span.'}],supersedes:null}}});
   });
   await page.goto(base+`/practice?task=${encodeURIComponent(task.id)}`);
   await page.locator('#practice-response').fill(original);
   await page.getByRole('button',{name:language==='en'?'Save and check':'Speichern und prüfen',exact:true}).click();
   await page.waitForFunction(({language,mode})=>{
    const events=Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${language}:event:`)).map(key=>JSON.parse(localStorage.getItem(key)));
    return events.filter(row=>row.type==='assessment').length===(mode==='repair'?2:1)&&document.querySelector('#practice-response')?.disabled;
   },{language,mode});
   if(mode==='repair')await expect(page.getByRole('status').filter({hasText:'Synthetic browser fixture correction.'})).toBeVisible();
   else await page.waitForFunction(()=>document.querySelector('form button[type="submit"]')?.disabled);
   await page.waitForLoadState('networkidle');
   const events=await page.evaluate(language=>Object.keys(localStorage).filter(key=>key.startsWith(`automaticity:v2:${language}:event:`)).map(key=>JSON.parse(localStorage.getItem(key))),language);
   const attempt=events.find(row=>row.type==='attempt'),assessments=events.filter(row=>row.type==='assessment');assert.equal(attempt.response.text,original);assert.equal(attempt.response.sha256,hash(original));
   assert.equal(assessments.length,mode==='repair'?2:1);const baseline=assessments.find(row=>row.evaluator.kind!=='transformer');assert.equal(baseline.verdict,'not_assessed');
   if(mode==='repair'){const model=assessments.find(row=>row.evaluator.kind==='transformer');assert.equal(model.supersedes,baseline.id);assert.equal(model.attemptId,attempt.id);assert.equal(attempt.task.contentReview,'authored');}
   assert.equal(gets,1);assert.equal(posts,mode==='disabled'?0:1);assert.deepEqual(errors,[]);
   if(mode==='repair')await page.screenshot({path:resolve(folder,`${language}-synthetic-correction.png`),fullPage:true});
   report.cases.push(`${language}: ${mode}, original saved first and preserved; no human-review credit invented`);await context.close();
  }
 }
 report.status='passed';
}catch(error){report.status='failed';report.error=String(error);process.exitCode=1;}
finally{await browser.close();await writeFile(resolve(folder,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({folder,...report}));}
