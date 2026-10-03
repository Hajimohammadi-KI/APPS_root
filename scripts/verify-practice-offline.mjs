import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium, expect } = require("@playwright/test");
const output = resolve(root, `artifacts/practice-offline/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { createdAt: new Date().toISOString(), scope: "Source worker and practice assets on isolated HTTP origins with synthetic drafts", cases: [] };
try {
  for (const language of ["en", "de"]) {
    const app = language === "en" ? "Apps/English/English-Automaticity" : "Apps/Deutsch-Automaticity";
    const server = createServer(async (req, res) => {
      const path = new URL(req.url, "http://localhost").pathname;
      const mapped = path === "/sw.js" ? `${app}/apps/web/public/sw.js` : path.startsWith("/learning-core/") ? `${app}/apps/web/public${path}` : path === "/practice" ? `shared/learning-core/browser/practice-${language}.html` : null;
      try {
        res.setHeader("Content-Type", path.endsWith(".js") ? "text/javascript" : path.endsWith(".json") ? "application/json" : path.endsWith(".css") ? "text/css" : "text/html");
        res.end(mapped ? await readFile(resolve(root, mapped)) : "<!doctype html><html><body>Unrelated offline fixture</body></html>");
      } catch { res.statusCode = 404; res.end(); }
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const context = await browser.newContext(), page = await context.newPage(); page.setDefaultTimeout(15000);
    const row = { language, status: "running" }; report.cases.push(row);
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      await page.goto(base + "/practice"); await page.locator("#practice-response").waitFor();
      await page.locator("#practice-response").fill("Synthetic offline task draft");
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await page.waitForFunction(async language => !!await caches.match(`/learning-core/curriculum-${language}.json`), language);
      assert(new URL(page.url()).searchParams.has("task"));
      await page.evaluate(async () => { for (const name of await caches.keys()) { const cache = await caches.open(name); for (const request of await cache.keys()) { const url = new URL(request.url); if (url.pathname === "/practice" && url.search) await cache.delete(request); } } });
      await context.setOffline(true); await page.reload();
      await expect(page.locator("#practice-response")).toHaveValue("Synthetic offline task draft");
      const topics = page.getByLabel(language === "en" ? "Grammar topic" : "Grammatikthema", { exact: true });
      const choices = await topics.locator("option").evaluateAll(nodes => nodes.map(node => node.value));
      await topics.selectOption(choices[2]); await page.locator("#practice-response").fill("Second task chosen while offline");
      await page.reload(); await expect(page.locator("#practice-response")).toHaveValue("Second task chosen while offline");
      row.controllerClaimed = true; row.uncachedTaskRestored = true; row.taskChangedAndReloadedOffline = true; row.status = "passed";
    } catch (error) { row.status = "failed"; row.error = error.message; row.body = await page.locator("body").innerText().catch(() => ""); }
    finally { await context.close(); await new Promise(resolve => server.close(resolve)); console.log(JSON.stringify(row)); }
  }
} finally { await browser.close(); report.status = report.cases.every(row => row.status === "passed") ? "passed" : "failed"; await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(`Evidence: ${output}`); }
assert.equal(report.status, "passed");
