import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium } = require("@playwright/test");
const output = resolve(root, `artifacts/legacy-fsrs-retirement/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { createdAt: new Date().toISOString(), scope: "Legacy review UI at the HTTP runtime identified per case; isolated synthetic profiles, old flag deliberately enabled, English assessment API mocked in browser only; no real learning evidence", cases: [] };
try {
  for (const language of ["en", "de"]) {
    const context = await browser.newContext(), page = await context.newPage(); page.setDefaultTimeout(20000);
    const override = process.argv.find(arg => arg.startsWith(`--${language}-base=`))?.split("=")[1];
    const base = override ?? `http://127.0.0.1:${language === "en" ? 3202 : 3210}`;
    const stateKey = language === "en" ? "grammar-automaticity:v27" : "GrammarAutomaticityV11_de";
    const row = { language, base, runtime: override ? "compiled-web-override" : "installed-desktop", status: "running" }, errors = []; report.cases.push(row); page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base + (language === "en" ? "/?screen=settings" : "/einstellungen"));
      await page.waitForFunction(key => !!localStorage.getItem(key), stateKey);
      const pack = await (await context.request.get(`${base}/learning-core/curriculum-${language}.json`)).json();
      const title = pack.units[0].title;
      const answer = language === "en" ? "I am ready for my lesson today. You are ready for your lesson today. She is ready for her lesson today. We are ready for our lesson today." : "Ich bin heute hier.";
      const legacyBytes = '[{"synthetic_original":"keep these exact historical bytes"}]';
      await page.evaluate(({ language, stateKey, title, answer, legacyBytes }) => {
        const state = JSON.parse(localStorage.getItem(stateKey));
        if (language === "en") {
          state.settings.onlineFeedback = true;
          state.learner.allowOnlineAI = true;
          const profile = JSON.parse(localStorage.getItem("study-suite:learner-profile:v1"));
          profile.privacy.allowOnlineAI = true;
          localStorage.setItem("study-suite:learner-profile:v1", JSON.stringify(profile));
          state.todayGrammar = { title, date: new Date().toISOString().slice(0, 10) };
          state.reviews = [{ id: "synthetic-review", sourceType: "grammar_topic", sourceId: title, topic: title, original: answer, corrected: answer, intervalDays: 1, dueAt: 1, successStreak: 0, stabilityScore: 0, mode: "transfer", status: "pending" }];
        } else {
          state.learner.allowOnlineAI = false;
          state.reviews = [{ id: "synthetic-review", sourceType: "grammar_topic", sourceId: title, topic: title, original: answer, corrected: answer, due: 1, stage: 0, mastered: false, successStreak: 0, stabilityScore: 0, reviewMode: "production" }];
        }
        localStorage.setItem(stateKey, JSON.stringify(state));
        localStorage.setItem("automaticity-feature-flags-v1", '{"fsrs_shadow_v1":true}');
        localStorage.setItem("automaticity-fsrs-shadow-v1", legacyBytes);
      }, { language, stateKey, title, answer, legacyBytes });
      let assessmentRequests = 0;
      if (language === "en") await page.route("**/api/assessment", async route => {
        if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" } });
        assessmentRequests++;
        const { text } = route.request().postDataJSON();
        await route.fulfill({ json: { original: text, corrected: text, changed: false, online: true, matches: [] }, headers: { "access-control-allow-origin": "*" } });
      });
      await page.goto(base + (language === "en" ? "/?screen=progress" : "/wiederholungen"));
      if (language === "en") {
        await page.locator("#delayed-transfer textarea").fill(answer);
        await page.getByRole("button", { name: "Save delayed transfer", exact: true }).click();
        await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).reviews.some(r => r.id === "synthetic-review" && r.status === "done"), stateKey);
        assert.equal(assessmentRequests, 1);
      } else {
        await page.getByRole("textbox", { name: "Richtige Fassung", exact: true }).fill(answer);
        await page.getByRole("button", { name: "Antwort prüfen", exact: true }).click();
        await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).reviews.some(r => r.id === "synthetic-review" && r.stage > 0 && r.due > Date.now()), stateKey);
      }
      assert.equal(await page.evaluate(() => localStorage.getItem("automaticity-fsrs-shadow-v1")), legacyBytes);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("automaticity-feature-flags-v1")).fsrs_shadow_v1), true);
      await page.reload();
      await page.locator("h1").first().waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem("automaticity-fsrs-shadow-v1")), legacyBytes);
      assert.deepEqual(errors, []);
      row.checks = { originalReviewCompleted: true, legacyFlagEnabled: true, noInferredFsrsWrite: true, originalShadowBytesPreservedAfterReload: true, mockedAssessmentRequests: assessmentRequests, pageErrors: errors };
      row.status = "passed";
    } catch (error) { row.status = "failed"; row.error = String(error); row.pageErrors = errors; row.body = await page.locator("body").innerText().catch(() => "unavailable"); await page.screenshot({ path: resolve(output, `${language}-failure.png`), fullPage: true }).catch(() => {}); }
    finally { await context.close(); }
  }
} finally {
  await browser.close(); report.status = report.cases.every(row => row.status === "passed") ? "passed" : "failed";
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ output, ...report }, null, 2));
}
assert.equal(report.status, "passed");
