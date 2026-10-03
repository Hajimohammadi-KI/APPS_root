import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  ),
  { chromium, expect } = require("@playwright/test"),
  hash = (value) => createHash("sha256").update(value).digest("hex"),
  installed = process.argv.includes("--installed");
const folder = resolve(
  root,
  `artifacts/scheduler-pilot-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
const report = {
  at: new Date().toISOString(),
  status: "running",
  scope: `${installed ? "Installed" : "Compiled source"} bounded scheduler UI with isolated synthetic consent and reviewer fixtures; actual shipped plans are disabled. No actual learner experiment or review is created.`,
  cases: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const language of ["en", "de"]) {
    const publicRoot = resolve(
        root,
        language === "en"
          ? "Apps/English/English-Automaticity/apps/web/public"
          : "Apps/Deutsch-Automaticity/apps/web/public",
      ),
      pack = JSON.parse(
        await readFile(
          resolve(publicRoot, `learning-core/curriculum-${language}.json`),
          "utf8",
        ),
      );
    const tasks = pack.units.slice(0, 2).map((unit) => {
      unit.review = "human_reviewed";
      const task = unit.tasks.find(
        (task) =>
          task.stage === "retrieve" &&
          task.modality === "writing" &&
          !(unit.retiredTasks ?? []).some((row) => row.taskId === task.id),
      );
      task.contentReview = "human_reviewed";
      return task;
    });
    const events = [],
      scopes = [],
      targets = [];
    for (const [index, task] of tasks.entries()) {
      const definitionSha256 = hash(JSON.stringify(task));
      for (const day of [2, 5]) {
        const at = `2026-09-0${day}T12:00:00.000Z`,
          id = `fixture-${index}-${day}`,
          attempt = {
            version: 2,
            type: "attempt",
            id,
            language,
            at,
            task: { ...task, definitionSha256 },
            response: {
              text: "Synthetic prior response",
              sha256: hash("Synthetic prior response"),
              originalTranscriptSha256: null,
              transcriptEdited: false,
            },
            timing: {
              startedAt: at,
              activeMs: null,
              firstInputMs: null,
              source: "unavailable",
            },
            assistance: {
              hintCount: 0,
              solutionRevealed: false,
              exampleSeen: false,
              selfReportedAssistance: false,
            },
            audio: null,
            previousAttemptId: null,
          };
        events.push(attempt, {
          version: 2,
          type: "assessment",
          id: `judge-${id}`,
          language,
          at,
          attemptId: id,
          responseSha256: attempt.response.sha256,
          taskVersion: task.version,
          rubricVersion: task.rubricVersion,
          verdict: "pass",
          dimensions: {
            grammar: "pass",
            target: "observed",
            relevance: "pass",
            opportunities: 1,
          },
          evaluator: {
            id: "synthetic-procedure",
            version: "1",
            kind: "human",
            scopeApproved: true,
            reviewId: `review-${index}`,
          },
          uncertainty: false,
          confidence: null,
          feedback: "Synthetic test only",
          correction: null,
          spans: [],
          supersedes: null,
        });
      }
      scopes.push({
        taskId: task.id,
        taskVersion: task.version,
        rubricVersion: task.rubricVersion,
        definitionSha256,
        reviewerName: "Synthetic reviewer",
        evaluatorId: "synthetic-procedure",
        evaluatorVersion: "1",
        reviewId: `review-${index}`,
        approvedAt: "2026-09-01T12:00:00.000Z",
      });
      targets.push({
        taskId: task.id,
        definitionSha256,
        constructionId: task.constructionId,
        sourceAttemptId: `fixture-${index}-5`,
        sourceAssessmentId: `judge-fixture-${index}-5`,
        arm: index ? "baseline" : "fsrs",
        baselineDueAt: "2026-09-08T12:00:00.000Z",
        candidateDueAt: "2026-09-10T12:00:00.000Z",
      });
    }
    const curriculumSha256 = hash(JSON.stringify(pack) + "\n"),
      approvals = {
        schemaVersion: 1,
        language,
        contentVersion: pack.version,
        mappingVersion: pack.mappingVersion,
        curriculumSha256,
        scopes,
      },
      plan = {
        schemaVersion: 1,
        language,
        id: "synthetic-browser-comparison",
        version: "1",
        curriculumSha256,
        approvedAt: "2026-09-06T11:00:00.000Z",
        startsAt: "2026-09-06T12:00:00.000Z",
        endsAt: "2026-09-25T12:00:00.000Z",
        reviewerId: "synthetic-reviewer",
        evidenceSha256: "a".repeat(64),
        shadowSha256: "b".repeat(64),
        description: "Synthetic comparison only",
        outcome: "Reviewed delay and workload",
        stoppingRule: "Stop on withdrawal or expiry",
        targets,
      };
    const server = createServer(async (req, res) => {
      const path = new URL(req.url, "http://localhost").pathname;
      const file =
        path === "/practice"
          ? resolve(
              root,
              `shared/learning-core/browser/practice-${language}.html`,
            )
          : /^\/learning-core\/[a-z0-9-]+\.(js|css|json)$/.test(path)
            ? resolve(publicRoot, path.slice(1))
            : null;
      try {
        if (!file) throw Error("not found");
        const bytes = await readFile(file);
        res.setHeader(
          "content-type",
          file.endsWith(".js")
            ? "text/javascript"
            : file.endsWith(".css")
              ? "text/css"
              : file.endsWith(".json")
                ? "application/json"
                : "text/html",
        );
        res.end(bytes);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const base = `http://127.0.0.1:${installed ? (language === "en" ? 3202 : 3210) : server.address().port}`;
    try {
      for (const scenario of [
        "disabled",
        "enrol-deliver-withdraw",
        "missing-review",
        "changed-definition",
      ]) {
        const context = await browser.newContext({ serviceWorkers: "block" }),
          page = await context.newPage(),
          errors = [],
          row = { language, scenario, status: "running" };
        report.cases.push(row);
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          const actual = await context.request.get(
            `${base}/learning-core/scheduler-pilot-${language}.json`,
          );
          assert.equal(actual.status(), 200);
          assert.equal((await actual.json()).plan, null);
          assert.equal(
            hash(
              await (
                await context.request.get(`${base}/learning-core/practice.js`)
              ).body(),
            ),
            hash(
              await readFile(resolve(publicRoot, "learning-core/practice.js")),
            ),
          );
          if (scenario !== "disabled") {
            await context.route(
              `**/learning-core/curriculum-${language}.json`,
              (route) => route.fulfill({ json: pack }),
            );
            await context.route(
              `**/learning-core/review-approvals-${language}.json`,
              (route) =>
                route.fulfill({
                  json:
                    scenario === "missing-review"
                      ? { ...approvals, scopes: [] }
                      : approvals,
                }),
            );
            await context.route(
              `**/learning-core/scheduler-pilot-${language}.json`,
              (route) =>
                route.fulfill({
                  json: {
                    schemaVersion: 1,
                    plan:
                      scenario === "changed-definition"
                        ? { ...plan, curriculumSha256: "c".repeat(64) }
                        : plan,
                  },
                }),
            );
            await page.addInitScript(
              ({ events, language }) => {
                for (const event of events) {
                  const key = `automaticity:v2:${language}:event:${encodeURIComponent(event.id)}`;
                  if (!localStorage.getItem(key))
                    localStorage.setItem(key, JSON.stringify(event));
                }
              },
              { events, language },
            );
          }
          await page.clock.install({
            time: new Date("2026-09-06T12:00:00.000Z"),
          });
          await page.goto(base + "/practice");
          await page.locator("#practice-response").waitFor();
          await page.locator("#scheduler-pilot > summary").click();
          if (scenario !== "enrol-deliver-withdraw") {
            await expect(page.locator("#scheduler-pilot-consent")).toHaveCount(
              0,
            );
            assert.equal(
              await page.evaluate(
                (language) =>
                  localStorage.getItem(
                    `automaticity:v2:${language}:scheduler-pilot:active`,
                  ),
                language,
              ),
              null,
            );
          } else {
            await page.locator("#scheduler-pilot-consent").check();
            await page
              .getByRole("button", {
                name:
                  language === "en"
                    ? "Join comparison"
                    : "Am Vergleich teilnehmen",
                exact: true,
              })
              .click();
            await expect(
              page.locator('[data-pilot-state="waiting"]'),
            ).toHaveCount(2);
            const snapshot = await page.evaluate((language) => {
              const key = localStorage.getItem(
                `automaticity:v2:${language}:scheduler-pilot:active`,
              );
              return { key, bytes: localStorage.getItem(key) };
            }, language);
            await page.clock.setFixedTime(new Date("2026-09-09T12:00:00.000Z"));
            await page.reload();
            await page.locator("#practice-response").waitFor();
            await page.locator("#scheduler-pilot > summary").click();
            await expect(
              page.locator('[data-pilot-state="waiting"]'),
            ).toHaveCount(1);
            await expect(page.locator('[data-pilot-state="due"]')).toHaveCount(
              1,
            );
            await page.clock.setFixedTime(new Date("2026-09-11T12:00:00.000Z"));
            await page.reload();
            await page.locator("#practice-response").waitFor();
            await page.locator("#scheduler-pilot > summary").click();
            await expect(page.locator('[data-pilot-state="due"]')).toHaveCount(
              2,
            );
            await page
              .locator(`[data-pilot-task="${tasks[0].id}"] button`)
              .click();
            assert.equal(
              new URL(page.url()).searchParams.get("task"),
              tasks[0].id,
            );
            assert.equal(
              await page.evaluate(
                (language) =>
                  Object.keys(localStorage).filter((key) =>
                    key.startsWith(
                      `automaticity:v2:${language}:scheduler-pilot:delivery:`,
                    ),
                  ).length,
                language,
              ),
              1,
            );
            await page
              .getByRole("button", {
                name:
                  language === "en"
                    ? "Stop comparison and restore usual reviews"
                    : "Vergleich beenden und bisherige Wiederholungen nutzen",
                exact: true,
              })
              .click();
            assert.equal(
              await page.evaluate(
                (language) =>
                  localStorage.getItem(
                    `automaticity:v2:${language}:scheduler-pilot:active`,
                  ),
                language,
              ),
              null,
            );
            assert.equal(
              await page.evaluate(
                (key) => localStorage.getItem(key),
                snapshot.key,
              ),
              snapshot.bytes,
            );
            const originals = await page.evaluate(
              ({ language, events }) =>
                events.map((event) =>
                  localStorage.getItem(
                    `automaticity:v2:${language}:event:${encodeURIComponent(event.id)}`,
                  ),
                ),
              { language, events },
            );
            assert.deepEqual(
              originals,
              events.map((event) => JSON.stringify(event)),
            );
            await page.setViewportSize({ width: 390, height: 844 });
            assert(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            );
            await page.screenshot({
              path: resolve(folder, `${language}-withdrawn.png`),
              fullPage: true,
            });
          }
          assert.deepEqual(errors, []);
          row.status = "passed";
        } catch (error) {
          row.status = "failed";
          row.error = String(error);
          row.pageErrors = errors;
        } finally {
          await context.close();
        }
      }
    } finally {
      await new Promise((done) => server.close(done));
    }
  }
} finally {
  await browser.close();
  report.status = report.cases.every((row) => row.status === "passed")
    ? "passed"
    : "failed";
  await writeFile(
    resolve(folder, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ folder, ...report }));
}
assert.equal(report.status, "passed");
