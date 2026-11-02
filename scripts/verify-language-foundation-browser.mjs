import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  `artifacts/language-foundation-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const bundlePath = resolve(output, "node-evidence.mjs");
execFileSync(
  "bun",
  [
    "build",
    "shared/learning-core/src/automaticity/evidence.ts",
    "--target=node",
    "--format=esm",
    `--outfile=${bundlePath}`,
  ],
  { cwd: root, stdio: "pipe" },
);
const { reduceAutomaticityEvents } = await import(
  pathToFileURL(bundlePath).href
);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  createdAt: new Date().toISOString(),
  scope:
    "Installed EN/DE static routes and browser/Node reducer equivalence. Fresh synthetic profiles; no genuine human review or learner proficiency claim.",
  cases: [],
  status: "running",
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
const now = "2026-09-05T12:00:00.000Z";
function fixtures(language) {
  const attempt = (id, at = "2026-09-01T10:00:00.000Z") => ({
    version: 2,
    type: "attempt",
    id,
    language,
    at,
    task: {
      id: `task-${id}`,
      version: "1",
      constructionId: `${language}.c.001`,
      familyId: "G01",
      itemFamily: `family-${id}`,
      contextId: `context-${id}`,
      rubricVersion: "1",
      stage: "retrieve",
      modality: "writing",
      partition: "evaluation",
      transferCondition: "none",
      contentReview: "human_reviewed",
    },
    response: {
      text: "Synthetic fixture",
      sha256: digest("Synthetic fixture"),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: new Date(Date.parse(at) - 10000).toISOString(),
      activeMs: 8000,
      firstInputMs: 1000,
      source: "monotonic_visible",
    },
    assistance: {
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
    },
    audio: null,
    previousAttemptId: null,
  });
  const assessment = (
    a,
    verdict = "pass",
    id = `judge-${a.id}`,
    supersedes = null,
  ) => ({
    version: 2,
    type: "assessment",
    id,
    language,
    at: new Date(
      Date.parse(a.at) + 1000 + (supersedes ? 1000 : 0),
    ).toISOString(),
    attemptId: a.id,
    responseSha256: a.response.sha256,
    taskVersion: a.task.version,
    rubricVersion: a.task.rubricVersion,
    verdict,
    dimensions: {
      grammar: verdict === "pass" ? "pass" : "fail",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      id: "synthetic-rule",
      version: "1",
      kind: "rule",
      scopeApproved: true,
      reviewId: "synthetic-review-only",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic fixture, not a real review",
    correction: null,
    spans: [],
    supersedes,
  });
  const a = attempt("first"),
    j = assessment(a),
    b = attempt("later", "2026-09-03T10:00:00.000Z");
  const assisted = {
    ...a,
    assistance: { ...a.assistance, solutionRevealed: true },
  };
  const noAudio = { ...a, task: { ...a.task, modality: "speaking" } };
  const noTiming = {
    ...a,
    timing: {
      ...a.timing,
      activeMs: null,
      firstInputMs: null,
      source: "unavailable",
    },
  };
  const flagOnly = {
    ...a,
    task: { ...a.task, stage: "retain", transferCondition: "elicited" },
  };
  const transferOnly = {
    ...a,
    task: { ...a.task, stage: "transfer", transferCondition: "elicited" },
  };
  const actualTransfer = {
    ...b,
    task: { ...b.task, stage: "transfer", transferCondition: "elicited" },
  };
  return [
    {
      id: "eligible-success-and-failure",
      events: [a, j, b, assessment(b, "needs_repair")],
    },
    { id: "identical-duplicates", events: [a, j, a, j] },
    {
      id: "conflicting-duplicate",
      events: [
        a,
        j,
        { ...a, response: { ...a.response, text: "Conflicting original" } },
      ],
    },
    {
      id: "competing-judgments",
      events: [a, j, assessment(a, "needs_repair", "second-judge")],
    },
    {
      id: "superseded-verdict",
      events: [a, j, assessment(a, "needs_repair", "second-judge", j.id)],
    },
    { id: "copied-repair", events: [assisted, j] },
    { id: "missing-original-audio", events: [noAudio, j] },
    { id: "missing-timing", events: [noTiming, j] },
    { id: "flags-without-history", events: [flagOnly, j] },
    { id: "transfer-without-history", events: [transferOnly, j] },
    {
      id: "actual-delay-and-novelty",
      events: [a, j, actualTransfer, assessment(actualTransfer)],
    },
  ];
}
async function run(id, language, callback) {
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1365, height: 950 },
  });
  // No evaluator request may leave the local machine.
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["data:", "blob:"].includes(url.protocol) ||
      ["localhost", "127.0.0.1"].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const row = { id, language, status: "running" };
  report.cases.push(row);
  try {
    row.evidence = await callback(page, context);
    assert.deepEqual(errors, []);
    row.status = "passed";
  } catch (error) {
    row.status = "failed";
    row.error = String(error);
  } finally {
    await page
      .screenshot({
        path: resolve(output, `${language}-${id}.png`),
        fullPage: true,
      })
      .catch(() => {});
    await context.close();
    console.log(JSON.stringify(row));
  }
}
try {
  for (const language of ["en", "de"]) {
    const base = `http://127.0.0.1:${language === "en" ? 3202 : 3210}`;
    const grammarRoute = language === "en" ? "/grammar" : "/grammatik";
    const app =
      language === "en"
        ? "Apps/English/English-Automaticity"
        : "Apps/Deutsch/Deutsch-Automaticity";
    const coreBytes = await readFile(
      resolve(root, "shared/learning-core/browser/automaticity-v2.js"),
    );
    await run("node-browser-evidence-parity", language, async (page) => {
      await page.goto(base + grammarRoute);
      const served = await page.request.get(
        base + "/learning-core/automaticity-v2.js",
      );
      assert.equal(served.status(), 200);
      assert.equal(digest(await served.body()), digest(coreBytes));
      await page.addScriptTag({
        url: base + "/learning-core/automaticity-v2.js",
      });
      const rows = [];
      for (const fixture of fixtures(language)) {
        const expected = reduceAutomaticityEvents(
          fixture.events,
          language,
          now,
        );
        const actual = await page.evaluate(
          ({ events, language, now }) =>
            window.AutomaticityV2.reduceAutomaticityEvents(
              events,
              language,
              now,
            ),
          { events: fixture.events, language, now },
        );
        assert.deepEqual(actual, expected);
        assert.equal(
          actual.rejected.length,
          fixture.id === "conflicting-duplicate" ? 2 : 0,
          fixture.id,
        );
        if (fixture.id === "conflicting-duplicate")
          assert.equal(actual.attempts.length, 0);
        if (fixture.id === "competing-judgments")
          assert.equal(actual.attempts[0].assessment, null);
        if (fixture.id === "eligible-success-and-failure") {
          assert.equal(actual.progress[0].independentAssessed, 2);
          assert.equal(actual.progress[0].accuracy, 0.5);
        }
        if (fixture.id === "missing-timing")
          assert.equal(actual.progress[0].medianFirstInputMs, null);
        if (fixture.id === "identical-duplicates")
          assert.equal(actual.attempts.length, 1);
        if (["copied-repair", "missing-original-audio"].includes(fixture.id))
          assert.equal(actual.attempts[0].eligibleForMastery, false);
        if (
          ["flags-without-history", "transfer-without-history"].includes(
            fixture.id,
          )
        ) {
          assert.equal(actual.attempts[0].delayed, false);
          assert.equal(actual.attempts[0].novel, false);
        }
        if (fixture.id === "actual-delay-and-novelty") {
          assert.equal(actual.attempts[1].delayed, true);
          assert.equal(actual.attempts[1].novel, true);
        }
        if (fixture.id === "superseded-verdict")
          assert.equal(actual.attempts[0].assessment.verdict, "needs_repair");
        rows.push({
          id: fixture.id,
          identical: true,
          attempts: actual.attempts.length,
        });
      }
      return { bundleSha256: digest(coreBytes), cases: rows };
    });
    await run(
      "legacy-offline-production-and-repair",
      language,
      async (page, context) => {
        const publicPath = `replacements/${language}/${language === "en" ? "grammar.html" : "grammatik.html"}`;
        const served = await page.request.get(base + grammarRoute);
        assert.equal(served.status(), 200);
        assert.equal(
          digest(await served.body()),
          digest(
            await readFile(resolve(root, app, "apps/web/public", publicPath)),
          ),
        );
        // The German Lab explains in Persian by default; these checks read German text.
        if (language === "de")
          await context.addInitScript(() =>
            localStorage.setItem(
              "deutsch-automaticity:explanation-language",
              "Deutsch",
            ),
          );
        await page.goto(base + grammarRoute);
        await page.locator("#answerInput").waitFor();
        const unit = await page.evaluate(
          (language) =>
            (language === "en"
              ? window.__ENGLISH_GRAMMAR_UNITS__
              : window.GERMAN_GRAMMAR_UNITS)[0],
          language,
        );
        const expected = unit.exercises[0][1];
        // Close the network after loading. Saving practice needs no provider result.
        await context.setOffline(true);
        if (language === "en") {
          await page.locator("#answerInput").fill("Synthetic unmatched answer");
          await page.locator("#checkBtn").click();
          // R96: the Lab gives the learning path's verdict; an unmatched answer
          // is never called wrong, and the feedback names the unit's rule.
          await expect(page.locator("#feedback")).toContainText(
            "Saved without a score",
          );
          await expect(page.locator("#feedback")).not.toHaveClass(/\bbad\b/);
          await expect(page.locator("#feedback .answer-rule")).toContainText(
            `Rule: ${unit.rule}`,
          );
          await page.locator("#repairInput").fill(expected);
          await page.locator("#repairBtn").click();
          await expect(page.locator("#feedback")).toContainText(
            "does not establish independent recall",
          );
          // Since 2026.11.02.2 the Lab checks every exercise of the unit (gaps and
          // correct/complete/choose/change/transform prompts); none is left unchecked.
          assert(
            unit.exercises.every((exercise) =>
              /_{2,}|…|\.\.\.|^(correct|complete|choose|change|transform)\b/i.test(
                exercise[0],
              ),
            ),
          );
          assert(
            !unit.exercises.some((exercise) => exercise[1] === unit.recallTest),
          );
          // The other option a prompt offers ("with is or are") is certainly wrong.
          const optionIndex = unit.exercises.findIndex(
            (exercise, i) => i > 0 && /\bwith \w+ or \w+:/.test(exercise[0]),
          );
          const index = optionIndex;
          assert(optionIndex > 0);
          const [, first, second] = unit.exercises[optionIndex][0].match(
            /\bwith (\w+) or (\w+):/,
          );
          const template = unit.exercises[optionIndex][0]
            .slice(unit.exercises[optionIndex][0].lastIndexOf(":") + 1)
            .trim();
          const wrongOption = [first, second]
            .map((option) => template.replace(/_{2,}/, option))
            .find((sentence) => sentence !== unit.exercises[optionIndex][1]);
          for (let i = 1; i <= index; i++) {
            await page.locator("#nextBtn").click();
            if (i === optionIndex) {
              await page.locator("#answerInput").fill(wrongOption);
              await page.locator("#checkBtn").click();
              await expect(page.locator("#feedback")).toContainText(
                "Not correct: This is one of the given options",
              );
              await expect(page.locator("#feedback")).toHaveClass(/\bbad\b/);
            }
            await page.locator("#answerInput").fill(unit.exercises[i][1]);
            await page.locator("#checkBtn").click();
          }
          // A matching form only completes guided practice.
          await expect(page.locator("#feedback")).toContainText(
            "Correct stored form",
          );
        } else {
          // R96: the unchanged sentence to correct is certainly wrong; another
          // answer may be a correct alternative and is saved without a score.
          const source = unit.exercises[0][0].match(
            /Nicht richtig:\s*(.+?)\s*Schreibe die vollständige/,
          )?.[1];
          assert(source);
          await page.locator("#answerInput").fill(source);
          await page.locator("#checkBtn").click();
          await expect(page.locator("#feedback")).toContainText(
            "Das ist noch der Satz, der korrigiert werden soll.",
          );
          await expect(page.locator("#feedback")).toHaveClass(/\bbad\b/);
          await page
            .locator("#answerInput")
            .fill("Ich habe heute leider keine Zeit für den Kurs.");
          await page.locator("#checkBtn").click();
          await expect(page.locator("#feedback")).toContainText(
            "Ohne Bewertung gespeichert",
          );
          await expect(page.locator("#feedback")).not.toHaveClass(/\bbad\b/);
          await expect(page.locator("#feedback mark").first()).toBeVisible();
          await expect(page.locator("#feedback .answer-rule")).toContainText(
            unit.rule,
          );
          // Select an actual open exercise and preserve its original text offline.
          const pick = await page.evaluate(() => {
            for (const [
              unitIndex,
              u,
            ] of window.GERMAN_GRAMMAR_UNITS.entries()) {
              const exerciseIndex = u.exercises.findIndex(
                (e) => e[2]?.mode === "open_production",
              );
              if (exerciseIndex >= 0 && u.title !== "es gibt mit Akkusativ")
                return {
                  unitIndex,
                  exerciseIndex,
                  minimum: u.exercises[exerciseIndex][2].minimumSentences ?? 1,
                };
            }
          });
          assert(pick);
          await page
            .locator(`button.topic[data-index="${pick.unitIndex}"]`)
            .evaluate((el) => el.click());
          for (let i = 0; i < pick.exerciseIndex; i++)
            await page.locator("#nextBtn").click();
          await page
            .locator("#intentInput")
            .fill("می‌خواهم درباره کار و زندگی خودم بنویسم.");
          await page
            .locator("#answerInput")
            .fill(
              "Ich arbeite heute im Büro. Ich lerne jeden Tag Deutsch. Wir sprechen oft über unsere Aufgaben. Ich möchte meine Gedanken klar erklären.",
            );
          await page.locator("#checkBtn").click();
          await expect(page.locator("#feedback")).toContainText("Selbstcheck");
        }
        const key = `${language === "en" ? "english" : "deutsch"}-automaticity:grammar-open-responses:v1`;
        const original = await page.evaluate(
          (key) => localStorage.getItem(key),
          key,
        );
        assert(original);
        const rows = JSON.parse(original);
        assert(rows.length > 0);
        await context.setOffline(false);
        await page.goto(base + "/practice");
        await page.locator("#practice-response").waitFor();
        await page.addScriptTag({
          url: base + "/learning-core/automaticity-v2.js",
        });
        await expect
          .poll(() =>
            page.evaluate(
              (language) =>
                window.AutomaticityV2.readAutomaticityEvents(
                  localStorage,
                  language,
                ).events.filter((e) => e.type === "attempt").length,
              language,
            ),
          )
          .toBeGreaterThan(0);
        const reduced = await page.evaluate(
          ({ language, key }) => ({
            original: localStorage.getItem(key),
            reduction: window.AutomaticityV2.reduceAutomaticityEvents(
              window.AutomaticityV2.readAutomaticityEvents(
                localStorage,
                language,
              ).events,
              language,
              new Date().toISOString(),
            ),
          }),
          { language, key },
        );
        assert.equal(reduced.original, original);
        assert(
          reduced.reduction.attempts.every(
            (a) =>
              !a.independent && !a.eligibleForMastery && !a.delayed && !a.novel,
          ),
        );
        return {
          storedResponses: rows.length,
          importedAttempts: reduced.reduction.attempts.length,
          originalPreserved: true,
          independentCredit: false,
          offlineSaved: true,
        };
      },
    );
  }
} finally {
  await browser.close();
  report.status =
    report.cases.length === 4 &&
    report.cases.every((row) => row.status === "passed")
      ? "passed"
      : "failed";
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Evidence: ${output}`);
}
assert.equal(report.status, "passed");
