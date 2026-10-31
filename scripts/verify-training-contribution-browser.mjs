// Node + Playwright. Isolated synthetic profiles; no real learner data/model training.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium, expect } = require("@playwright/test");
const arg = (language) => process.argv.find(value => value.startsWith(`--${language}=`))?.split("=").slice(1).join("=");
if (!!arg("en") !== !!arg("de")) throw Error("Provide both --en and --de, or neither.");
const hash = value => createHash("sha256").update(value).digest("hex");
const folder = resolve(root, `artifacts/training-contribution-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(folder, { recursive: true });
const report = { scope: "Synthetic selected-example transport, consent and immutability; no human review, model training or scientific validation claim", cases: [] };
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const language of ["en", "de"]) {
    const publicRoot = resolve(root, `Apps/${language === "en" ? "English/English-Automaticity" : "Deutsch/Deutsch-Automaticity"}/apps/web/public`);
    let server;
    let base = arg(language);
    if (!base) {
      server = createServer(async (req, res) => {
        try {
          const path = new URL(req.url, "http://localhost").pathname;
          const file = path === "/practice" ? resolve(root, `shared/learning-core/browser/practice-${language}.html`) : resolve(publicRoot, "." + path);
          const inside = relative(publicRoot, file);
          if (path !== "/practice" && (isAbsolute(inside) || inside.startsWith(".."))) throw Error("Outside public assets");
          const data = await readFile(file);
          res.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".json") ? "application/json" : file.endsWith(".css") ? "text/css" : "text/html");
          res.end(data);
        } catch { res.writeHead(404); res.end(); }
      });
      await new Promise(done => server.listen(0, "127.0.0.1", done));
      base = `http://127.0.0.1:${server.address().port}`;
    }
    try {
      const pack = await (await fetch(`${base}/learning-core/curriculum-${language}.json`)).json();
      const task = pack.units.flatMap(unit => unit.tasks).find(task => task.id === `${language}.c.001.retrieve.mastery-20261031-0.writing`);
      assert(task, "New authored task is installed");
      const originalText = `${task.acceptedAnswers[0]} Contact synthetic.person@example.test.`;
      const at = new Date(Date.now() - 300000).toISOString();
      const attempt = { version: 2, type: "attempt", id: "synthetic-attempt", language, at, task: { ...task, definitionSha256: hash(JSON.stringify(task)) }, response: { text: originalText, sha256: hash(originalText), originalTranscriptSha256: null, transcriptEdited: false }, timing: { startedAt: at, activeMs: null, firstInputMs: null, source: "unavailable" }, assistance: { hintCount: 0, solutionRevealed: false, exampleSeen: false, selfReportedAssistance: false }, audio: null, previousAttemptId: null };
      const automated = { version: 2, type: "assessment", id: "synthetic-machine", language, at: new Date(Date.parse(at) + 1000).toISOString(), attemptId: attempt.id, responseSha256: attempt.response.sha256, taskVersion: task.version, rubricVersion: task.rubricVersion, verdict: "not_assessed", dimensions: { grammar: "unknown", target: "unknown", relevance: "unknown", opportunities: null }, evaluator: { id: "controlled-answer", version: "1.0.0", kind: "rule", scopeApproved: false, reviewId: null }, uncertainty: true, confidence: null, feedback: "Synthetic transport test", correction: null, spans: [], supersedes: null };
      const review = { ...automated, id: "synthetic-human", at: new Date(Date.parse(at) + 2000).toISOString(), verdict: "needs_repair", dimensions: { grammar: "fail", target: "observed", relevance: "unknown", opportunities: 1 }, evaluator: { id: "local-review:Private Reviewer", version: "1", kind: "human", scopeApproved: false, reviewId: "synthetic-reviewer" }, uncertainty: false, feedback: "Private Reviewer says: synthetic fixture only.", supersedes: automated.id };
      const events = [attempt, automated, review];
      for (const width of [390, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block", acceptDownloads: true });
        try {
          await context.addInitScript(({ events, language }) => {
            for (const event of events) localStorage.setItem(`automaticity:v2:${language}:event:${encodeURIComponent(event.id)}`, JSON.stringify(event));
          }, { events, language });
          const page = await context.newPage(), errors = [], posts = [], downloads = [];
          page.setDefaultTimeout(15000);
          page.on("pageerror", error => errors.push(error.message));
          page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
          page.on("download", download => downloads.push(download));
          await page.goto(`${base}/practice?task=${task.id}&review=1`, { waitUntil: "networkidle" });
          await page.getByText(language === "en" ? "Saved responses & independent review" : "Gespeicherte Antworten & unabhängige Prüfung", { exact: true }).click();
          await page.locator("#training-contribution > summary").click();
          const consent = page.locator("#training-consent"), downloadButton = page.locator("#training-download");
          await expect(consent).not.toBeChecked();
          await expect(downloadButton).toBeDisabled();
          await page.locator("#training-case").selectOption(review.id);
          await expect(downloadButton).toBeDisabled();
          await page.locator("#training-text").fill(task.acceptedAnswers[0]);
          await page.locator("#training-feedback").fill("Please arrange independent review.");
          await consent.check();
          await expect(downloadButton).toBeEnabled();
          // Pause hashing to deterministically exercise an edit during preparation.
          await page.evaluate(() => {
            const original = crypto.subtle.digest.bind(crypto.subtle); let first = true;
            window.__hashCompleted = 0;
            crypto.subtle.digest = (...args) => {
              const promise = first ? (first = false, new Promise(resolve => { window.__releaseHash = () => original(...args).then(resolve); })) : original(...args);
              return promise.then(value => { window.__hashCompleted++; return value; });
            };
          });
          await downloadButton.click();
          await page.waitForFunction(() => !!window.__releaseHash);
          const preview = task.acceptedAnswers[0] + " ";
          await page.locator("#training-text").fill(preview);
          await expect(consent).not.toBeChecked();
          await page.evaluate(() => window.__releaseHash());
          await page.waitForFunction(() => window.__hashCompleted >= 3);
          assert.equal(downloads.length, 0, "Editing cancels a pending consent-bound download");
          await consent.check();
          const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
          const output = resolve(folder, `${language}-${width}-candidate.json`);
          await download.saveAs(output);
          const candidate = JSON.parse(await readFile(output, "utf8"));
          assert.equal(candidate.response.text, preview);
          assert.equal(candidate.response.sha256, hash(preview));
          assert.equal(candidate.status, "candidate_only");
          assert.equal(candidate.label, null);
          assert.equal(candidate.readyForTraining, false);
          assert.equal(candidate.originalJudgment.appliesToPreview, false);
          for (const secret of ["synthetic.person@example.test", "Private Reviewer", "synthetic-attempt", "synthetic-reviewer"])
            assert(!JSON.stringify(candidate).includes(secret));
          await expect(consent).not.toBeChecked();
          await expect(downloadButton).toBeDisabled();
          const originals = await page.evaluate(({ ids, language }) => ids.map(id => JSON.parse(localStorage.getItem(`automaticity:v2:${language}:event:${encodeURIComponent(id)}`))), { ids: events.map(row => row.id), language });
          assert.deepEqual(originals, events);
          assert.deepEqual(posts, []);
          assert.deepEqual(errors, []);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          report.cases.push({ language, width, status: "pass", checks: ["default-off separate consent", "selected edited previews only", "in-flight edit cancels download", "no uploads or training labels", "original history unchanged"] });
          console.log(`PASS ${language} ${width}px: consent, redaction, pending-edit cancellation, unqualified candidate, no upload, original history kept`);
        } finally { await context.close(); }
      }
    } finally { if (server) await new Promise(done => server.close(done)); }
  }
} finally {
  await browser.close();
  await writeFile(resolve(folder, "report.json"), JSON.stringify(report, null, 2) + "\n");
}
