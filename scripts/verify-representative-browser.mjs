import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test"),
  installed = process.argv.includes("--installed");
const output = resolve(
  root,
  `artifacts/l01-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
let language = "en";
const publicRoot = () =>
  resolve(
    root,
    `Apps/${language === "en" ? "English/English-Automaticity" : "Deutsch-Automaticity"}/apps/web/public`,
  );
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const file =
    path === "/practice"
      ? resolve(root, `shared/learning-core/browser/practice-${language}.html`)
      : [
            "practice.js",
            "practice.css",
            "automaticity-v2.js",
            `curriculum-${language}.json`,
          ].some((name) => path === `/learning-core/${name}`)
        ? resolve(publicRoot(), path.slice(1))
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
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const reviewManifest = JSON.parse(
  await readFile(
    resolve(root, "artifacts/l01-assessment/review-manifest.json"),
    "utf8",
  ),
);
const report = {
  at: new Date().toISOString(),
  scope: `${installed ? "Installed" : "Compiled source"} app forms; synthetic responses in isolated profiles; no language-review or learner-outcome claim`,
  cases: [],
};
try {
  for (language of ["en", "de"]) {
    const base = installed
      ? `http://127.0.0.1:${language === "en" ? 3202 : 3210}`
      : `http://127.0.0.1:${server.address().port}`;
    const pack = JSON.parse(
      await readFile(
        resolve(publicRoot(), `learning-core/curriculum-${language}.json`),
        "utf8",
      ),
    );
    for (const name of ["practice.js", `curriculum-${language}.json`]) {
      const served = Buffer.from(
        await (await fetch(`${base}/learning-core/${name}`)).arrayBuffer(),
      );
      const expected = await readFile(
        resolve(publicRoot(), "learning-core", name),
      );
      assert.equal(
        createHash("sha256").update(served).digest("hex"),
        createHash("sha256").update(expected).digest("hex"),
      );
    }
    for (const unit of pack.units.filter((unit) =>
      unit.tasks.some((t) => t.constructionAssessment),
    )) {
      const packet = JSON.parse(
        await readFile(
          resolve(
            root,
            `artifacts/l01-assessment/${reviewManifest.directory}/${unit.id}.json`,
          ),
          "utf8",
        ),
      );
      const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width: 1280, height: 950 },
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(30000);
      const row = {
        language,
        constructionId: unit.id,
        status: "running",
        checks: [],
      };
      report.cases.push(row);
      const taskFor = (stage, modality = "writing") =>
        unit.tasks.find(
          (t) =>
            t.constructionAssessment &&
            t.stage === stage &&
            t.modality === modality,
        );
      const action = (en, de) =>
        page.getByRole("button", {
          name: language === "en" ? en : de,
          exact: true,
        });
      const events = () =>
        page.evaluate(
          (lang) =>
            Object.keys(localStorage)
              .filter((k) => k.startsWith(`automaticity:v2:${lang}:event:`))
              .map((k) => JSON.parse(localStorage.getItem(k))),
          language,
        );
      const open = async (task) => {
        await page.goto(
          `${base}/practice?task=${encodeURIComponent(task.id)}`,
          { waitUntil: "domcontentloaded" },
        );
        await expect(page.locator("#practice-response")).toBeVisible();
        if (await page.locator("#practice-response").isDisabled())
          await action(
            "Try again as a repair",
            "Als Korrektur erneut versuchen",
          ).click();
      };
      const submit = async (text, verdict) => {
        const count = (await events()).filter(
          (e) => e.type === "assessment",
        ).length;
        await page.locator("#practice-response").fill(text);
        await action("Save and check", "Speichern und prüfen").click();
        await expect
          .poll(
            async () =>
              (await events()).filter((e) => e.type === "assessment").length,
          )
          .toBe(count + 1);
        const all = await events(),
          judgment = all
            .filter((e) => e.type === "assessment")
            .sort((a, b) => a.at.localeCompare(b.at))
            .at(-1);
        assert.equal(judgment.verdict, verdict);
        assert.equal(judgment.evaluator.scopeApproved, false);
        const original = all.find((e) => e.id === judgment.attemptId);
        assert.equal(original.response.text, text);
        assert.equal(
          original.response.sha256,
          createHash("sha256").update(text).digest("hex"),
        );
        return { original, judgment };
      };
      try {
        const task = taskFor("retrieve");
        // Use actual Grammar topic selection, not only direct task links.
        await page.goto(`${base}/practice`, { waitUntil: "domcontentloaded" });
        await page
          .getByLabel(language === "en" ? "Grammar topic" : "Grammatikthema", {
            exact: true,
          })
          .selectOption(unit.id);
        await expect(page.locator("#practice-response")).toBeVisible();
        assert.equal(new URL(page.url()).searchParams.get("task"), task.id);
        const valid = packet.engineeringCases.find(
          (c) =>
            c.taskId === task.id &&
            c.assessment.verdict === "pass" &&
            c.response !== packet.ruleScope.scenarios[0].example,
        ).response;
        const first = await submit(valid, "pass");
        row.checks.push(
          "Grammar selection reaches the new task and accepts an unlisted valid alternative",
        );
        await action(
          "Try again as a repair",
          "Als Korrektur erneut versuchen",
        ).click();
        const failed = await submit(
          packet.ruleScope.scenarios[0].error,
          "needs_repair",
        );
        assert.equal(failed.original.previousAttemptId, first.original.id);
        assert.equal(failed.judgment.dimensions.grammar, "fail");
        row.checks.push(
          "targeted grammar error and linked repair preserve the original response",
        );
        await open(task);
        const wrong = packet.engineeringCases.find(
          (c) =>
            c.taskId === task.id &&
            c.assessment.dimensions.grammar === "pass" &&
            c.assessment.dimensions.relevance === "fail",
        );
        assert.ok(wrong);
        const rejected = await submit(wrong.response, "needs_repair");
        assert.equal(rejected.judgment.dimensions.relevance, "fail");
        row.checks.push(
          "grammatical role mismatch is rejected for meaning, not labelled ungrammatical",
        );
        await open(task);
        const unsupported = packet.engineeringCases.find(
          (c) =>
            c.taskId === task.id && c.assessment.verdict === "not_assessed",
        ).response;
        await submit(unsupported, "not_assessed");
        row.checks.push(
          "unsupported alternative abstains without a false failure",
        );
        await open(taskFor("transfer"));
        await submit(
          language === "en"
            ? "My own situation needs a reviewer."
            : "Meine eigene Situation muss geprüft werden.",
          "not_assessed",
        );
        await expect(page.locator("#response-review > summary")).toBeVisible();
        row.checks.push("free transfer reaches the existing review workflow");
        await open(taskFor("retrieve", "speaking"));
        await submit(valid, "not_assessed");
        row.checks.push(
          "a typed transcript cannot receive written grammar approval as speech",
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        const stored = await events();
        assert.deepEqual(
          stored.find((e) => e.id === first.original.id),
          first.original,
        );
        await page.screenshot({
          path: resolve(output, `${unit.id}.png`),
          fullPage: true,
        });
        assert.deepEqual(errors, []);
        row.status = "verified";
      } catch (error) {
        row.status = "failed";
        row.error = String(error);
        await page.screenshot({
          path: resolve(output, `${unit.id}-failure.png`),
          fullPage: true,
        });
        throw error;
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(resolve(output, "report.json"));
}
