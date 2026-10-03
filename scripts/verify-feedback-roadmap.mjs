import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const {chromium, expect} = require("@playwright/test");
const folder = resolve(root, `artifacts/feedback-roadmap/${new Date().toISOString().replace(/[:.]/g,"-")}`);
await mkdir(folder,{recursive:true});
const source = await readFile(resolve(root,"docs/language-automaticity-implementation-backlog.json"));
const backlog = JSON.parse(source);
const browser = await chromium.launch({channel:"msedge",headless:true});
const report = {at:new Date().toISOString(),scope:"Live HTTP roadmap; no review-packet navigation",status:"running",checks:[]};
try {
  const page = await browser.newPage({viewport:{width:1250,height:920}});
  assert.equal((await page.goto("http://127.0.0.1:3317/")).status(),200);
  const snapshot = await (await page.request.get("http://127.0.0.1:3317/snapshot")).json();
  const sourceSha256=createHash("sha256").update(source).digest("hex");
  assert.equal(snapshot.sourceSha256,sourceSha256);
  await expect(page.locator(".task")).toHaveCount(backlog.tasks.length);
  for (const id of ["M05","U01","U02","U03","U04"]) {
    const task=page.locator(`#task-${id}`);
    await expect(task).toHaveAttribute("data-status","verified");
    assert.equal(await task.evaluate(node=>getComputedStyle(node).backgroundColor),"rgb(238, 248, 240)");
  }
  report.checks.push("Completed feedback and Daily tasks are green and match the current source hash");
  await expect(page.locator("#task-L01")).toHaveAttribute("data-status","in_progress");
  await expect(page.locator("#task-L01")).toContainText("0/168 representative cells");
  for (const id of ["M01","M02","M03","M04","W05","P03","R03","X01","X02","X03"])
    await expect(page.locator(`#task-${id}`)).not.toHaveAttribute("data-status","verified");
  report.checks.push("Language-review, model-qualification, learner-outcome and actual-experiment gates stay open");
  assert.equal(snapshot.backlog.technicalRelease.versions.English,"27.3.38");
  assert.equal(snapshot.backlog.technicalRelease.versions.German,"20.8.42");
  assert.equal(snapshot.backlog.delivery.reinforcementLearning,"offline_prototype_not_active");
  assert(snapshot.history.changes.some(row=>row.taskId==="M05"&&row.to==="verified"));
  report.checks.push("Current delivery versions and dated feedback-task history are present");
  await page.locator("#phase").selectOption("models");
  await expect(page.locator(".task")).toHaveCount(5);
  await page.screenshot({path:resolve(folder,"models.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:resolve(folder,"mobile.png"),fullPage:true});
  report.checks.push("Model phase filters to five cards and fits the mobile viewport");
  Object.assign(report,{status:"verified",sourceSha256,verifiedRequired:backlog.tasks.filter(t=>t.required&&t.status==="verified").length,required:backlog.tasks.filter(t=>t.required).length});
} catch(error) {report.status="failed";report.error=String(error);process.exitCode=1;}
finally {await browser.close();await writeFile(resolve(folder,"report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({folder,...report}));}
