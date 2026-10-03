import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium } = require("@playwright/test");
const folder = resolve(
  root,
  `artifacts/phase5-cycle-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonical = hash(
  await readFile(
    resolve(root, "shared/learning-core/browser/automaticity-v2.js"),
  ),
);
const report = {
  createdAt: new Date().toISOString(),
  status: "running",
  scope:
    "Installed browser evidence engine with isolated synthetic writing/speaking cycles, synthetic qualified reviews and a fixed test timeline. No actual human review, learner responses or elapsed learning results.",
  cases: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const language of ["en", "de"]) {
    const base = `http://127.0.0.1:${language === "en" ? 3202 : 3210}`;
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/practice");
    const response = await page.request.get(
      base + "/learning-core/automaticity-v2.js",
    );
    assert.equal(response.status(), 200);
    assert.equal(hash(await response.body()), canonical);
    await page.addScriptTag({
      url: base + "/learning-core/automaticity-v2.js",
    });
    for (const modality of ["writing", "speaking"]) {
      const result = await page.evaluate(
        async ({ language, modality }) => {
          const core = window.AutomaticityV2,
            now = "2026-09-10T12:00:00.000Z";
          const text = language === "en" ? "She is ready." : "Sie ist bereit.";
          const responseHash = await core.sha256(text);
          const make = (id, at, stage) => ({
            version: 2,
            type: "attempt",
            id,
            language,
            at,
            task: {
              id: `synthetic-${id}`,
              version: "1",
              constructionId: `${language}.c.001`,
              familyId: "G01",
              itemFamily: `synthetic-family-${id}`,
              contextId: `synthetic-context-${id}`,
              rubricVersion: "1",
              stage,
              modality,
              partition: "evaluation",
              transferCondition: stage === "transfer" ? "target_named" : "none",
              contentReview: "human_reviewed",
            },
            response: {
              text,
              sha256: responseHash,
              originalTranscriptSha256:
                modality === "speaking" ? responseHash : null,
              transcriptEdited: false,
            },
            timing: {
              startedAt: new Date(Date.parse(at) - 10000).toISOString(),
              activeMs: 8000,
              firstInputMs: 1200,
              source: "monotonic_visible",
            },
            assistance: {
              hintCount: 0,
              solutionRevealed: false,
              exampleSeen: false,
              selfReportedAssistance: false,
            },
            audio:
              modality === "speaking"
                ? {
                    id: `synthetic-audio-${id}`,
                    sha256: responseHash,
                    bytes: 16044,
                    durationMs: 1000,
                    mime: "audio/wav",
                    persisted: true,
                  }
                : null,
            previousAttemptId: null,
          });
          const judge = (attempt, verdict = "pass") => ({
            version: 2,
            type: "assessment",
            id: `judge-${attempt.id}`,
            language,
            at: new Date(Date.parse(attempt.at) + 1000).toISOString(),
            attemptId: attempt.id,
            responseSha256: attempt.response.sha256,
            taskVersion: attempt.task.version,
            rubricVersion: attempt.task.rubricVersion,
            verdict,
            dimensions: {
              grammar: verdict === "pass" ? "pass" : "fail",
              target: "observed",
              relevance: "pass",
              opportunities: 1,
            },
            evaluator: {
              id: "synthetic-review-fixture",
              version: "1",
              kind: "human",
              scopeApproved: true,
              reviewId: "synthetic-only-no-real-review",
            },
            uncertainty: false,
            confidence: null,
            feedback: "Synthetic architecture test only",
            correction: null,
            spans: [],
            supersedes: null,
          });
          const original = make(
            "original",
            "2026-09-01T10:00:00.000Z",
            "produce",
          );
          const wrong = judge(original, "needs_repair");
          const repair = make("repair", "2026-09-01T10:02:00.000Z", "repair");
          repair.previousAttemptId = original.id;
          const transfer = make(
            "transfer",
            "2026-09-01T11:00:00.000Z",
            "transfer",
          );
          const day = make("day", "2026-09-02T11:01:00.000Z", "retain");
          const week = make("week", "2026-09-09T11:01:00.000Z", "retain");
          const events = [
            original,
            wrong,
            repair,
            judge(repair),
            transfer,
            judge(transfer),
            day,
            judge(day),
            week,
            judge(week),
          ];
          const preserved = JSON.stringify(events);
          const state = core.reduceAutomaticityEvents(events, language, now);
          const revision = {
            ...judge(original),
            id: "judge-overturn",
            at: "2026-09-10T11:00:00.000Z",
            supersedes: wrong.id,
          };
          const revised = core.reduceAutomaticityEvents(
            [...events, revision],
            language,
            now,
          );
          const early = make("early", "2026-09-01T11:02:00.000Z", "retain");
          const premature = core.reduceAutomaticityEvents(
            [original, wrong, early, judge(early)],
            language,
            now,
          );
          const exposed = {
            ...day,
            assistance: { ...day.assistance, hintCount: 1 },
          };
          const assisted = core.reduceAutomaticityEvents(
            [original, wrong, exposed, judge(exposed)],
            language,
            now,
          );
          const safety = [];
          if (modality === "speaking")
            for (const change of [
              { audio: null },
              { audio: { ...day.audio, persisted: false } },
              { audio: { ...day.audio, bytes: 0, durationMs: 0 } },
              { response: { ...day.response, transcriptEdited: true } },
              { response: { ...day.response, originalTranscriptSha256: null } },
            ]) {
              const candidate = { ...day, ...change };
              const result = core.reduceAutomaticityEvents(
                [candidate, judge(candidate)],
                language,
                now,
              );
              safety.push(result.attempts[0]?.eligibleForMastery === false);
            }
          const uncertain = { ...judge(day), uncertainty: true };
          const uncertainty = core.reduceAutomaticityEvents(
            [day, uncertain],
            language,
            now,
          );
          const untimed = {
            ...day,
            timing: {
              ...day.timing,
              activeMs: null,
              firstInputMs: null,
              source: "unavailable",
            },
          };
          const untimedState = core.reduceAutomaticityEvents(
            [untimed, judge(untimed)],
            language,
            now,
          );
          return {
            preserved: preserved === JSON.stringify(events),
            rejected: state.rejected,
            progress: state.progress[0],
            repair: state.attempts.find((row) => row.attempt.id === "repair"),
            transfer: state.attempts.find(
              (row) => row.attempt.id === "transfer",
            ),
            revisedAccuracy: revised.progress[0]?.accuracy,
            prematureDelayed: premature.attempts.find(
              (row) => row.attempt.id === "early",
            )?.delayed,
            exposedEligible: assisted.attempts.find(
              (row) => row.attempt.id === "day",
            )?.eligibleForMastery,
            uncertainEligible: uncertainty.attempts[0]?.eligibleForMastery,
            untimedAssessed: untimedState.progress[0]?.independentAssessed,
            untimedMedian: untimedState.progress[0]?.medianFirstInputMs,
            speechSafeguards: safety,
          };
        },
        { language, modality },
      );
      assert.equal(result.preserved, true);
      assert.deepEqual(result.rejected, []);
      assert.equal(result.repair.eligibleForMastery, false);
      assert.equal(result.transfer.novel, true);
      assert.equal(result.transfer.delayed, false);
      assert.equal(result.progress.independentAssessed, 4);
      assert.equal(result.progress.accuracy, 0.75);
      assert.equal(result.progress.delayedSuccesses, 2);
      assert.equal(result.revisedAccuracy, 1);
      assert.equal(result.prematureDelayed, false);
      assert.equal(result.exposedEligible, false);
      assert.equal(result.uncertainEligible, false);
      assert.equal(result.untimedAssessed, 1);
      assert.equal(result.untimedMedian, null);
      if (modality === "speaking")
        assert.deepEqual(result.speechSafeguards, [
          true,
          true,
          true,
          true,
          true,
        ]);
      report.cases.push({
        language,
        modality,
        status: "passed",
        bundleSha256: canonical,
        accuracy: result.progress.accuracy,
        delayedSuccesses: result.progress.delayedSuccesses,
        meaning: "Synthetic architecture result only",
        speechSafeguards: result.speechSafeguards.length,
      });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    resolve(folder, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      folder,
      status: report.status,
      cases: report.cases.length,
    }),
  );
}
