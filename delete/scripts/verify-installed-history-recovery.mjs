import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium, expect } = require("@playwright/test");
const output = resolve(root, `artifacts/installed-history-recovery/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { createdAt: new Date().toISOString(), scope: "Installed HTTP apps, isolated synthetic profiles; no normal learner data or shared Electron bridge", cases: [] };
try {
  for (const language of ["en", "de"]) {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    const base = `http://127.0.0.1:${language === "en" ? 3202 : 3210}`;
    const settings = base + (language === "en" ? "/?screen=settings" : "/einstellungen");
    const stateKey = language === "en" ? "grammar-automaticity:v27" : "GrammarAutomaticityV11_de";
    const staticKey = `${language === "en" ? "english" : "deutsch"}-automaticity:grammar-open-responses:v1`;
    const row = { language, status: "running" }; report.cases.push(row);
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(settings, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(key => !!localStorage.getItem(key), stateKey);
      const pack = await (await context.request.get(base + `/learning-core/curriculum-${language}.json`)).json();
      const title = pack.units[0].title;
      const original = JSON.stringify([{ topic: title, level: pack.units[0].level, response: "Synthetic original from an earlier grammar session", occurredAt: "2026-09-01T09:00:00.000Z", outcome: "ai-accepted" }]);
      await page.evaluate(({ stateKey, staticKey, original, language }) => {
        const state = JSON.parse(localStorage.getItem(stateKey));
        state.learner.verifiedLevel = "C2";
        localStorage.setItem(stateKey, JSON.stringify(state));
        localStorage.setItem(staticKey, original);
        const key = "study-suite:learner-profile:v1";
        const profile = JSON.parse(localStorage.getItem(key));
        const track = profile.languages[language === "en" ? "english" : "german"];
        track.verifiedLevel = "C2";
        track.evidence.grammarAccuracy = 100;
        localStorage.setItem(key, JSON.stringify(profile));
      }, { stateKey, staticKey, original, language });
      await page.reload();
      await page.waitForFunction(({ stateKey, language }) => {
        const state = JSON.parse(localStorage.getItem(stateKey));
        const profile = JSON.parse(localStorage.getItem("study-suite:learner-profile:v1"));
        return state?.learner?.verifiedLevel === null && profile?.languages?.[language === "en" ? "english" : "german"]?.verifiedLevel === null;
      }, { stateKey, language });
      await page.waitForFunction(language => Object.keys(localStorage).some(key => key.startsWith(`automaticity:v2:${language}:event:`)), language);
      await page.addScriptTag({ url: base + "/learning-core/automaticity-v2.js" });
      const reduced = await page.evaluate(({ language, staticKey }) => {
        const core = window.AutomaticityV2;
        const events = core.readAutomaticityEvents(localStorage, language).events;
        return { reduction: core.reduceAutomaticityEvents(events, language, new Date().toISOString()), original: localStorage.getItem(staticKey) };
      }, { language, staticKey });
      assert.equal(reduced.original, original);
      assert.equal(reduced.reduction.attempts.length, 1);
      assert.equal(reduced.reduction.attempts[0].eligibleForMastery, false);
      assert.equal(reduced.reduction.attempts[0].independent, false);
      await page.goto(base + "/practice");
      await page.locator("#practice-response").waitFor();
      const count = await page.evaluate(language => Object.keys(localStorage).filter(key => key.startsWith(`automaticity:v2:${language}:event:`)).length, language);
      assert.equal(count, 1);
      row.legacyContinuity = { originalPreserved: true, importedOnceAcrossRoutes: true, oldScoreNotIndependent: true, unsupportedCefrCleared: true };

      await page.goto(settings);
      const exportButton = page.getByRole("button", { name: language === "en" ? "Export data" : "Lerndaten exportieren", exact: true });
      await expect(exportButton).toBeVisible();
      const priorState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), stateKey);
      await page.evaluate(key => {
        const native = Storage.prototype.setItem;
        Storage.prototype.setItem = function(k, v) { if (k === key) throw new DOMException("Synthetic quota limit", "QuotaExceededError"); return native.call(this, k, v); };
      }, stateKey);
      const checkbox = page.getByRole("checkbox", { name: language === "en" ? /Require correct spelling for grammar mastery/ : /Rechtschreibung.*Grammatik|Grammatik.*Rechtschreibung/ }).first();
      if (language === "en") await checkbox.setChecked(!priorState.settings.spellingAffectsMastery);
      else await page.getByRole("radio", { name: priorState.settings.dailyStudyMinutes === 30 ? "45 Min." : "30 Min.", exact: true }).check();
      await expect(page.getByRole("alert").filter({ hasText: language === "en" ? "Changes could not be saved" : "nicht gespeichert" })).toBeVisible();
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), stateKey), priorState);
      const downloadEvent = page.waitForEvent("download"); await exportButton.click();
      const download = await downloadEvent, file = resolve(output, `${language}-unsaved-state-backup.json`); await download.saveAs(file);
      const backup = JSON.parse(await readFile(file, "utf8"));
      const exportedState = JSON.parse(backup.localStorage.find(([key]) => key === stateKey)[1]);
      if (language === "en") assert.equal(exportedState.settings.spellingAffectsMastery, !priorState.settings.spellingAffectsMastery);
      else assert.equal(exportedState.settings.dailyStudyMinutes, priorState.settings.dailyStudyMinutes === 30 ? 45 : 30);
      row.quotaRecovery = { visibleWarning: true, persistedStateKept: true, unsavedStateExported: true };
      await page.screenshot({ path: resolve(output, `${language}-quota-recovery.png`), fullPage: true });

      await page.evaluate(key => localStorage.removeItem(key), stateKey);
      await page.reload();
      await page.evaluate(key => localStorage.setItem(key, "{unreadable-original"), stateKey);
      await page.reload();
      await expect(page.getByRole("alert").filter({ hasText: language === "en" ? "Changes could not be saved" : "nicht gespeichert" })).toBeVisible();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), stateKey), "{unreadable-original");
      row.corruptOriginalKept = true;
      assert.deepEqual(errors, []); row.status = "passed";
    } catch (error) { row.status = "failed"; row.error = error.message; row.stack = error.stack; row.pageErrors = errors; await page.screenshot({ path: resolve(output, `${language}-failure.png`), fullPage: true }).catch(() => {}); }
    finally { await context.close(); console.log(JSON.stringify(row)); }
  }
} finally { await browser.close(); report.status = report.cases.every(row => row.status === "passed") ? "passed" : "failed"; await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(`Evidence: ${output}`); }
assert.equal(report.status, "passed");
