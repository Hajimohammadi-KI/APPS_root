import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium, expect } = require("@playwright/test");
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const englishUrl = argument("--english-url", "http://127.0.0.1:3202");
const germanUrl = argument("--german-url", "http://127.0.0.1:3210");
for (const value of [englishUrl, germanUrl]) {
  const url = new URL(value);
  assert(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Only local test servers are allowed");
}
const output = resolve(root, argument("--output-dir", `artifacts/language-integrity-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`));
const outputRelative = relative(resolve(root, "artifacts"), output);
assert(outputRelative && !outputRelative.startsWith("..") && !isAbsolute(outputRelative), "Evidence must remain under workspace artifacts");
await mkdir(output, { recursive: true });
const report = {
  createdAt: new Date().toISOString(),
  scope: "Isolated synthetic browser regression; no learner proficiency or learning outcome claim",
  englishUrl,
  germanUrl,
  browserProfile: "new nonpersistent context for each case",
  cases: [],
};
const browser = await chromium.launch({ channel: argument("--channel", "msedge"), headless: true });
const allowedOrigins = new Set([new URL(englishUrl).origin, new URL(germanUrl).origin, "http://127.0.0.1:4201", "http://localhost:4201", "http://127.0.0.1:4210", "http://localhost:4210"]);

async function runCase(id, check) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(30_000);
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["data:", "blob:"].includes(url.protocol) || allowedOrigins.has(url.origin)
      ? route.continue()
      : route.abort("blockedbyclient");
  });
  const row = { id, status: "running", startedAt: new Date().toISOString() };
  report.cases.push(row);
  try {
    row.evidence = await check(page, context);
    row.status = "passed";
  } catch (error) {
    row.status = "failed";
    row.error = error instanceof Error ? error.message : String(error);
  } finally {
    row.screenshot = `${id}.png`;
    await page.screenshot({ path: resolve(output, row.screenshot), fullPage: true }).catch(() => { row.screenshot = null; });
    row.finishedAt = new Date().toISOString();
    await context.close();
    console.log(`${row.status.toUpperCase()} ${id}${row.error ? `: ${row.error}` : ""}`);
  }
}

async function englishAssessment(page, malformed) {
  const text = "I work at the library every morning.";
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    localStorage.setItem("study-suite:learner-profile:v1", JSON.stringify({
      schemaVersion: 1, profileId: "synthetic-integrity-check", createdAt: now, updatedAt: now,
      privacy: { allowOnlineAI: true, shareAcrossApps: false, storeAudio: false },
    }));
    localStorage.setItem("grammar-automaticity:v27", JSON.stringify({
      version: 27,
      settings: { onlineFeedback: true, saveAudio: false, apiBaseUrl: "http://127.0.0.1:4201" },
      errors: [{
        id: "synthetic-repair", grammarTitle: "Present simple", topic: "Synthetic browser regression",
        errorClass: "grammar", originalText: "I works at home.", correctedText: "I work at home.",
        explanation: "Synthetic fixture: first-person agreement.", occurrenceCount: 1,
        repairStatus: "new", nextRepairAt: 0, lastSeenAt: now,
      }],
    }));
  });
  let intercepted = 0;
  await page.route("**/api/assessment", async (route) => {
    const headers = {
      "access-control-allow-origin": new URL(englishUrl).origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    intercepted += 1;
    const request = route.request().postDataJSON();
    assert.equal(request.text, text);
    const payload = { original: text, corrected: text, changed: false, online: true };
    if (!malformed) payload.matches = [];
    return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(payload) });
  });
  await page.goto(`${englishUrl}/?screen=errors`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Error Workshop", exact: true })).toBeVisible();
  await page.getByLabel("New repair sentence").fill(text);
  await page.getByRole("button", { name: "Evaluate repair", exact: true }).click();
  await expect.poll(() => intercepted).toBe(1);
  await expect(page.locator(".evaluation")).toBeVisible();
  if (malformed) {
    await expect(page.locator(".evaluation")).toContainText("LanguageTool unavailable");
    await expect(page.locator(".evaluation")).not.toContainText("Answer verified");
  } else {
    await expect(page.locator(".evaluation")).toContainText("LanguageTool service reached");
  }
  const readLastAttempt = () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}");
    const attempt = state.attempts?.at(-1);
    return attempt ? { mode: attempt.mode, verified: attempt.verified, passed: attempt.passed } : null;
  });
  await expect.poll(async () => (await readLastAttempt())?.verified).toBe(!malformed);
  return { injectedResponse: malformed ? "HTTP 200 with missing matches" : "HTTP 200 with valid empty matches", intercepted, attempt: await readLastAttempt() };
}

async function englishWriting(page, malformed) {
  const text = "I have worked on my project today. I have written two notes. I have never used this method before. My friend has given me advice. The advice is useful. I feel more confident now.";
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    localStorage.setItem("study-suite:learner-profile:v1", JSON.stringify({
      schemaVersion: 1, profileId: "synthetic-writing-integrity-check", createdAt: now, updatedAt: now,
      privacy: { allowOnlineAI: true, shareAcrossApps: false, storeAudio: false },
    }));
    localStorage.setItem("grammar-automaticity:v27", JSON.stringify({
      version: 27,
      settings: { onlineFeedback: true, saveAudio: false, apiBaseUrl: "http://127.0.0.1:4201" },
      todayGrammar: { title: "Present perfect", level: "B1", date: now.slice(0, 10) },
    }));
  });
  let intercepted = 0;
  await page.route("**/api/assessment", async (route) => {
    const headers = {
      "access-control-allow-origin": new URL(englishUrl).origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    intercepted += 1;
    assert.equal(route.request().postDataJSON().text, text);
    const payload = { original: text, corrected: text, changed: false, online: true };
    if (!malformed) payload.matches = [];
    return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(payload) });
  });
  await page.goto(`${englishUrl}/?screen=progress`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /2\. Automate & write/ }).click();
  await page.getByLabel("Present perfect journal", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Analyse and save writing", exact: true }).click();
  await expect.poll(() => intercepted).toBe(1);
  const readWriting = () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}");
    const ledger = JSON.parse(localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}");
    const attempt = state.attempts?.at(-1);
    const evidence = ledger.evidence?.at(-1);
    const plan = Object.values(state.dailyPlans ?? {}).find((row) => row.answers?.["automaticity:present-perfect:journal"]);
    return {
      attempt: attempt ? { mode: attempt.mode, verified: attempt.verified, passed: attempt.passed } : null,
      evidence: evidence ? { mode: evidence.mode, verification: evidence.verification, masteryEligible: evidence.masteryEligible, automaticityClaim: evidence.automaticityClaim } : null,
      dailyWriting: plan?.answers?.["automaticity:present-perfect:writing"],
      journal: plan?.answers?.["automaticity:present-perfect:journal"],
    };
  });
  await expect.poll(async () => (await readWriting()).evidence?.verification.status).toBe(malformed ? "unverified" : "verified");
  const saved = await readWriting();
  assert.deepEqual(saved.attempt, { mode: "writing", verified: !malformed, passed: !malformed });
  // A valid grammar check does not establish unaided retrieval. This legacy
  // route supplies no independent-attempt provenance, even for the control.
  assert.equal(saved.evidence.masteryEligible, false);
  assert.equal(saved.evidence.automaticityClaim, "insufficient-longitudinal-evidence");
  assert.equal(saved.dailyWriting, malformed ? "unassessed" : "done");
  assert.equal(saved.journal, text, "The learner's synthetic draft must remain saved");
  if (malformed) await expect(page.getByText("Draft saved. Assessment is unavailable; this attempt does not count as verified progress.", { exact: true })).toBeVisible();
  return { injectedResponse: malformed ? "HTTP 200 with missing matches" : "HTTP 200 with valid empty matches", intercepted, ...saved };
}

async function prepareGermanClosedTask(page) {
  await page.goto(`${germanUrl}/grammatik`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#answerInput")).toBeVisible();
  const runtimeResponse = await page.request.get(`${germanUrl}/replacements/de/grammar-runtime.js`);
  assert.equal(runtimeResponse.status(), 200);
  const source = await readFile(resolve(root, "Apps/Deutsch-Automaticity/apps/web/public/replacements/de/grammar-runtime.js"));
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(digest(await runtimeResponse.body()), digest(source), "German live runtime differs from current source; rebuild/restart before claiming verification");
  const task = await page.evaluate(() => {
    for (const unit of window.GERMAN_GRAMMAR_UNITS ?? []) {
      for (const [index, exercise] of (unit.exercises ?? []).entries()) {
        const answer = exercise[1];
        if (exercise[2]?.mode === "open_production" || answer === unit.recallTest || typeof answer !== "string") continue;
        const noun = answer.match(/\s([A-ZÄÖÜ][\p{L}]+)/u)?.[1];
        if (noun && /\b(ich|ist|sind|gibt|habe|hat|muss)\b/iu.test(answer)) {
          return { title: unit.title, index, answer, lowercased: answer.replace(noun, noun.toLocaleLowerCase("de-DE")) };
        }
      }
    }
    return null;
  });
  assert(task, "No suitable controlled noun-capitalisation task found in the served catalog");
  await page.goto(`${germanUrl}/grammatik?topic=${encodeURIComponent(task.title)}`, { waitUntil: "domcontentloaded" });
  for (let index = 0; index < task.index; index += 1) await page.locator("#nextBtn").click();
  return { ...task, runtimeSha256: digest(source) };
}

const germanProgress = (page) => page.evaluate(() => localStorage.getItem("deutsch-automaticity:grammar-progress:v3"));
async function germanUncertain(page, answer) {
  const task = await prepareGermanClosedTask(page);
  const before = await germanProgress(page);
  await page.locator("#answerInput").fill(answer);
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toContainText("noch nicht bewertet");
  await expect(page.locator("#feedback")).not.toHaveClass(/\bgood\b|\bbad\b/);
  assert.equal(await germanProgress(page), before, "Uncertain language must not complete a task");
  return { title: task.title, exerciseIndex: task.index, runtimeSha256: task.runtimeSha256, answer, unchangedProgress: true, feedback: await page.locator("#feedback").innerText() };
}

async function germanWeilWriting(page) {
  const text = Array(6).fill("We practise, weil work matters.").join(" ");
  await page.goto(`${germanUrl}/automatik`, { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("GrammarAutomaticityV11_de")))).toBe(true);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("GrammarAutomaticityV11_de"));
    state.todayGrammar = { title: "Nebensatz mit weil", level: "A2", date: new Date().toISOString().slice(0, 10) };
    state.learningLevel = "A2";
    localStorage.setItem("GrammarAutomaticityV11_de", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /2\. Automatisieren & schreiben/ }).click();
  const readWriting = () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("GrammarAutomaticityV11_de") ?? "{}");
    const plan = Object.values(state.dailyPlans ?? {}).find((row) => row.answers?.["automatik:nebensatz-mit-weil:journal"]);
    return {
      attempts: state.attempts ?? [],
      ledger: localStorage.getItem("automaticity:learning-evidence:v1"),
      dailyWriting: plan?.answers?.["automatik:nebensatz-mit-weil:writing"],
      journal: plan?.answers?.["automatik:nebensatz-mit-weil:journal"],
    };
  });
  const before = await readWriting();
  await page.getByLabel("Nebensatz mit weil-Tagebuch", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Schreiben analysieren und speichern", exact: true }).click();
  const feedback = "Die Sprache ist für diese Prüfung nicht eindeutig Deutsch. Die Antwort wurde noch nicht bewertet.";
  await expect(page.getByText(feedback, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readWriting()).journal).toBe(text);
  const saved = await readWriting();
  assert.deepEqual(saved.attempts, before.attempts, "Mixed-language weil output must not become an assessed attempt");
  assert.equal(saved.ledger, before.ledger, "Mixed-language weil output must not gain shared evidence");
  assert.notEqual(saved.dailyWriting, "done");
  return { unchangedAttempts: true, unchangedLedger: true, journalRetained: saved.journal === text, noWritingCredit: true, feedback };
}

try {
  await runCase("english-malformed-response-unverified", (page) => englishAssessment(page, true));
  await runCase("english-valid-empty-matches-control", (page) => englishAssessment(page, false));
  await runCase("english-writing-malformed-unverified-ledger", (page) => englishWriting(page, true));
  await runCase("english-writing-valid-control", (page) => englishWriting(page, false));
  await runCase("german-casing-and-valid-control", async (page) => {
    const task = await prepareGermanClosedTask(page);
    const before = await germanProgress(page);
    await page.locator("#answerInput").fill(task.lowercased);
    await page.locator("#checkBtn").click();
    await expect(page.locator("#feedback")).toHaveClass(/\bbad\b/);
    assert.equal(await germanProgress(page), before, "Incorrect noun case must not complete a task");
    await page.locator("#answerInput").fill(task.answer);
    await page.locator("#checkBtn").click();
    await expect(page.locator("#feedback")).toHaveClass(/\bgood\b/);
    assert.notEqual(await germanProgress(page), before, "Positive control must complete the controlled task");
    return { title: task.title, exerciseIndex: task.index, runtimeSha256: task.runtimeSha256, wrongCaseRejected: true, validControlAccepted: true };
  });
  await runCase("german-uncertain-language-unassessed", (page) => germanUncertain(page, "Bonjour tout le monde."));
  await runCase("german-ambiguous-hat-unassessed", (page) => germanUncertain(page, "A hat costs money."));
  await runCase("german-weil-writing-language-guard", germanWeilWriting);
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.status = report.cases.length === 8 && report.cases.every((row) => row.status === "passed") ? "passed" : "failed";
  await writeFile(resolve(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Evidence: ${resolve(output, "report.json")}`);
  if (report.status !== "passed") process.exitCode = 1;
}
