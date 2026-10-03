import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium } = require("@playwright/test");
const installed = process.argv.includes("--installed");
const output = resolve(root, `artifacts/prospective-recall/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const bundle = await readFile(resolve(root, "shared/learning-core/browser/automaticity-v2.js"));
const hash = value => createHash("sha256").update(value).digest("hex");
const server = installed ? null : createServer((req, res) => {
  if (req.url === "/learning-core/automaticity-v2.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle); }
  else if (req.url === "/") { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html lang="en"><title>Synthetic recall verification</title><body>Isolated test</body></html>'); }
  else { res.writeHead(404); res.end(); }
});
if (server) await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { createdAt: new Date().toISOString(), scope: `${installed ? "HTTP runtime identified per case" : "Compiled source"} browser API; synthetic events in isolated profiles; no real consent, reviews or learner outcomes`, cases: [] };
try {
  for (const language of ["en", "de"]) {
    const override = process.argv.find(arg => arg.startsWith(`--${language}-base=`))?.split("=")[1];
    const base = override ?? `http://127.0.0.1:${installed ? language === "en" ? 3202 : 3210 : server.address().port}`;
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    const row = { language, base, runtime: override ? "compiled-web-override" : installed ? "installed-desktop" : "compiled-source", status: "running" }; report.cases.push(row);
    try {
      const response = await context.request.get(`${base}/learning-core/automaticity-v2.js`);
      assert.equal(response.status(), 200);
      row.bundleSha256 = hash(await response.body()); assert.equal(row.bundleSha256, hash(bundle));
      await page.goto(base + (installed ? "/practice" : "/"));
      if (installed) await page.locator("#practice-response").waitFor();
      await page.addScriptTag({ url: `${base}/learning-core/automaticity-v2.js` });
      row.checks = await page.evaluate(language => {
        const core = window.AutomaticityV2, now = "2026-09-10T12:00:00.000Z";
        const consent = { id: "synthetic-consent", language, purpose: "fsrs_shadow", at: "2026-09-01T00:00:00.000Z" };
        const attempt = (id, day, task = {}) => {
          const at = `2026-09-0${day}T10:00:00.000Z`;
          return { version: 2, type: "attempt", id, language, at,
            task: { definitionSha256: "b".repeat(64), id: "item-a", version: "1", constructionId: `${language}.c.001`, familyId: "G01", itemFamily: "family-a", contextId: "context-a", rubricVersion: "1", stage: "retrieve", modality: "writing", partition: "practice", transferCondition: "none", contentReview: "human_reviewed", ...task },
            response: { text: "Synthetic answer", sha256: "a".repeat(64), originalTranscriptSha256: null, transcriptEdited: false },
            timing: { startedAt: at, activeMs: null, firstInputMs: null, source: "unavailable" },
            assistance: { hintCount: 0, solutionRevealed: false, exampleSeen: false, selfReportedAssistance: false }, audio: null, previousAttemptId: null };
        };
        const judge = a => ({ version: 2, type: "assessment", id: `judge-${a.id}`, language, at: a.at, attemptId: a.id, responseSha256: a.response.sha256, taskVersion: a.task.version, rubricVersion: a.task.rubricVersion,
          verdict: "pass", dimensions: { grammar: "pass", target: "observed", relevance: "pass", opportunities: 1 }, evaluator: { id: "synthetic-rule", version: "1", kind: "rule", scopeApproved: true, reviewId: "synthetic-approval" }, uncertainty: false, confidence: null, feedback: "Synthetic fixture", correction: null, spans: [], supersedes: null });
        const rating = a => ({ id: `rating-${a.id}`, attemptId: a.id, assessmentId: judge(a).id, consentId: consent.id, rating: 3, recordedAt: a.at });
        const first = attempt("first", 2), later = attempt("later", 4, { stage: "retain" }), second = attempt("second", 2, { id: "item-b" }), secondLater = attempt("second-later", 6, { ...second.task, stage: "retain" });
        const events = [first, later, second, secondLater].flatMap(a => [a, judge(a)]);
        const ratings = [rating(later), rating(secondLater)];
        const before = JSON.stringify({ events, ratings, storage: { ...localStorage } });
        const run = (input = events, votes = ratings, permission = consent) => core.qualifyProspectiveReviews(input, language, now, permission, votes);
        const checks = [], check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
        const result = run();
        check("two familiar items retain separate identities", result.eligible.length === 2 && new Set(result.eligible.map(r => r.cardId)).size === 2);
        check("ratings preserve exact response and assessment links", result.eligible.every(r => r.responseSha256 === "a".repeat(64) && r.assessmentId === `judge-${r.attemptId}`));
        for (const [name, change] of [["changed definition", { definitionSha256: "c".repeat(64) }], ["unbound legacy", { definitionSha256: undefined }], ["new item", { id: "new" }], ["new version", { version: "2" }], ["transfer", { stage: "transfer", transferCondition: "free" }], ["held-out evaluation", { partition: "evaluation" }]]) {
          const changed = attempt(`changed-${name}`, 8, change);
          check(`${name} excluded from familiar recall`, run([...events, changed, judge(changed)], [rating(changed)]).eligible.length === 0);
        }
        check("malformed consent rejected", run(events, ratings, { ...consent, id: 42 }).eligible.length === 0);
        check("withdrawal ends calculation", run(events, ratings, { ...consent, revokedAt: "2026-09-07T00:00:00.000Z" }).eligible.length === 0);
        check("malformed ratings rejected without exceptions", run(events, [null, { ...rating(later), id: 42 }]).eligible.length === 0);
        check("reused rating identity quarantines both responses", run(events, [rating(later), { ...rating(secondLater), id: rating(later).id }]).eligible.length === 0);
        check("unapproved content stays ineligible", run(events.map(e => e.type === "attempt" ? { ...e, task: { ...e.task, contentReview: "authored" } } : e)).eligible.length === 0);
        check("inputs and learner storage remain unchanged", JSON.stringify({ events, ratings, storage: { ...localStorage } }) === before);
        return checks;
      }, language);
      assert.equal(row.checks.length, 14); assert.deepEqual(errors, []); row.status = "passed";
    } catch (error) { row.status = "failed"; row.error = String(error); row.pageErrors = errors; }
    finally { await context.close(); }
  }
} finally {
  await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
  report.status = report.cases.every(row => row.status === "passed") ? "passed" : "failed";
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ output, ...report }, null, 2));
}
assert.equal(report.status, "passed");
