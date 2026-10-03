import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  ),
  { chromium, expect } = require("@playwright/test"),
  hash = (value) => createHash("sha256").update(value).digest("hex"),
  installed = process.argv.includes("--installed");
const folder = resolve(
  root,
  `artifacts/human-review-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true }),
  report = {
    at: new Date().toISOString(),
    status: "running",
    scope: `${installed ? "Installed" : "Compiled source"} review UI; synthetic reviewed catalog and scope injected only in isolated test browser contexts. The real shipped approvals remain empty. No actual human review or learner result is created.`,
    cases: [],
  };
try {
  for (const language of ["en", "de"]) {
    const publicRoot = resolve(
        root,
        `${language === "en" ? "Apps/English/English-Automaticity" : "Apps/Deutsch-Automaticity"}/apps/web/public`,
      ),
      source = await readFile(
        resolve(publicRoot, `learning-core/curriculum-${language}.json`),
      ),
      pack = JSON.parse(source),
      unit = pack.units[0],
      task = unit.tasks.find(
        (task) =>
          task.stage === "produce" &&
          task.modality === "writing" &&
          !(unit.retiredTasks ?? []).some((row) => row.taskId === task.id),
      );
    task.contentReview = "human_reviewed";
    unit.review = "human_reviewed";
    const manifest = {
      schemaVersion: 1,
      language,
      contentVersion: pack.version,
      mappingVersion: pack.mappingVersion,
      curriculumSha256: hash(JSON.stringify(pack) + "\n"),
      scopes: [
        {
          taskId: task.id,
          taskVersion: task.version,
          rubricVersion: task.rubricVersion,
          definitionSha256: hash(JSON.stringify(task)),
          reviewerName: "Synthetic reviewer",
          evaluatorId: "synthetic-manual-procedure",
          evaluatorVersion: "1",
          reviewId: "synthetic-only-not-a-real-review",
          approvedAt: new Date(Date.now() - 86_400_000).toISOString(),
        },
      ],
    };
    const requests = [];
    const server = createServer(async (req, res) => {
      requests.push(req.url);
      const pathname = new URL(req.url, "http://localhost").pathname,
        file =
          pathname === "/practice"
            ? resolve(
                root,
                `shared/learning-core/browser/practice-${language}.html`,
              )
            : /^\/learning-core\/(practice\.(js|css)|automaticity-v2\.js|curriculum-(en|de)\.json|review-approvals-(en|de)\.json)$/.test(
                  pathname,
                )
              ? resolve(publicRoot, pathname.slice(1))
              : null;
      if (!file) {
        res.writeHead(404);
        res.end();
        return;
      }
      try {
        res.setHeader(
          "Content-Type",
          file.endsWith(".js")
            ? "text/javascript"
            : file.endsWith(".css")
              ? "text/css"
              : file.endsWith(".json")
                ? "application/json"
                : "text/html",
        );
        const data = await readFile(file);
        res.setHeader("Content-Length", String(data.length));
        res.end(data);
        requests.push("served:" + pathname);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const base = `http://127.0.0.1:${installed ? (language === "en" ? 3202 : 3210) : server.address().port}`;
    try {
      for (const scenario of [
        "approved",
        "unknown-reviewer",
        "offline-approval",
        "edited-during-save",
      ]) {
        const context = await browser.newContext({ serviceWorkers: "block" }),
          page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.setDefaultTimeout(30000);
        const row = { language, scenario, status: "running", requests };
        report.cases.push(row);
        try {
          const shipped = await context.request.get(
            `${base}/learning-core/review-approvals-${language}.json`,
          );
          assert.equal(shipped.status(), 200);
          assert.deepEqual((await shipped.json()).scopes, []);
          const runtime = await context.request.get(
            `${base}/learning-core/practice.js`,
          );
          assert.equal(
            hash(await runtime.body()),
            hash(
              await readFile(
                resolve(root, "shared/learning-core/browser/practice.js"),
              ),
            ),
          );
          await page.route(
            `**/learning-core/curriculum-${language}.json`,
            (route) =>
              route.fulfill({
                contentType: "application/json",
                body: JSON.stringify(pack) + "\n",
              }),
          );
          let requested;
          const requestArrived = new Promise(
            (resolve) => (requested = resolve),
          );
          let release;
          const continueRequest = new Promise((resolve) => (release = resolve));
          await page.route(
            `**/learning-core/review-approvals-${language}.json`,
            async (route) => {
              requested();
              if (scenario === "edited-during-save") await continueRequest;
              if (scenario === "offline-approval") await route.abort();
              else
                await route.fulfill({
                  contentType: "application/json",
                  body: JSON.stringify(manifest),
                });
            },
          );
          await page.goto(
            `${base}/practice?task=${encodeURIComponent(task.id)}&review=1`,
            { waitUntil: "domcontentloaded", timeout: 60000 },
          );
          await page
            .locator("#practice-response")
            .fill("Synthetic learner transport fixture only.");
          await page
            .getByRole("button", {
              name:
                language === "en" ? "Save and check" : "Speichern und prüfen",
              exact: true,
            })
            .click();
          await expect(
            page.getByRole("button", {
              name:
                language === "en"
                  ? "Try again as a repair"
                  : "Als Korrektur erneut versuchen",
              exact: true,
            }),
          ).toBeVisible();
          await page.locator("#review-kind").selectOption("human");
          await page
            .locator("#reviewer-name")
            .fill(
              scenario === "unknown-reviewer"
                ? "Someone else"
                : "Synthetic reviewer",
            );
          await page.locator("#review-verdict").selectOption("pass");
          await page
            .locator("#review-feedback")
            .fill(
              "Synthetic human review transport fixture; no real linguistic judgment.",
            );
          await page
            .getByRole("button", {
              name:
                language === "en"
                  ? "Save separate review"
                  : "Separate Bewertung speichern",
              exact: true,
            })
            .click();
          if (scenario === "edited-during-save") {
            await requestArrived;
            await page
              .locator("#review-feedback")
              .fill("A newer draft must be preserved.");
            release();
            await expect(page.locator("#review-save-status")).toContainText(
              language === "en"
                ? "changed while saving"
                : "beim Speichern geändert",
            );
          } else
            await expect(page.locator("#review-save-status")).toContainText(
              scenario === "approved"
                ? language === "en"
                  ? "approved assessment procedure"
                  : "freigegebenen Bewertungsverfahren"
                : language === "en"
                  ? "Review saved separately"
                  : "Bewertung separat gespeichert",
            );
          const events = await page.evaluate(
              (language) =>
                Object.keys(localStorage)
                  .filter((key) =>
                    key.startsWith(`automaticity:v2:${language}:event:`),
                  )
                  .map((key) => JSON.parse(localStorage.getItem(key))),
              language,
            ),
            reviews = events.filter(
              (event) =>
                event.type === "assessment" && event.evaluator.kind === "human",
            );
          assert.equal(
            reviews.length,
            scenario === "edited-during-save" ? 0 : 1,
          );
          if (reviews.length) {
            assert.equal(
              reviews[0].evaluator.scopeApproved,
              scenario === "approved",
            );
            if (scenario === "approved")
              assert.equal(
                reviews[0].evaluator.reviewId,
                manifest.scopes[0].reviewId,
              );
          }
          if (scenario === "edited-during-save")
            assert.equal(
              await page.locator("#review-feedback").inputValue(),
              "A newer draft must be preserved.",
            );
          assert.equal(
            events.filter((event) => event.type === "attempt").length,
            1,
          );
          await page.addScriptTag({
            url: `${base}/learning-core/automaticity-v2.js`,
          });
          const reduction = await page.evaluate(
            ({ events, language }) =>
              window.AutomaticityV2.reduceAutomaticityEvents(
                events,
                language,
                new Date().toISOString(),
              ),
            { events, language },
          );
          assert.equal(
            reduction.attempts[0].eligibleForMastery,
            scenario === "approved",
          );
          assert.equal(
            reduction.progress[0].independentSuccesses,
            scenario === "approved" ? 1 : 0,
          );
          assert.deepEqual(errors, []);
          row.status = "passed";
          if (scenario === "approved")
            await page.screenshot({
              path: resolve(folder, `${language}-approved-fixture.png`),
              fullPage: true,
            });
        } catch (error) {
          row.status = "failed";
          row.error = String(error);
          row.url = page.url();
          row.pageErrors = errors;
          row.body = await page.content().catch(() => "unavailable");
          throw error;
        } finally {
          await context.close();
        }
      }
    } finally {
      await new Promise((done) => server.close(done));
    }
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  process.exitCode = 1;
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
      cases: report.cases.map(({ language, scenario, status }) => ({
        language,
        scenario,
        status,
      })),
      error: report.error,
    }),
  );
}
