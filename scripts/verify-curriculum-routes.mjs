import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  ),
  { chromium } = require("@playwright/test"),
  hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const output = resolve(
  root,
  `artifacts/curriculum-routes/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true }),
  report = {
    at: new Date().toISOString(),
    status: "running",
    scope:
      "Installed app topic, stage and modality controls for every required curriculum cell. Isolated empty profiles; no synthetic human approvals or learner outcomes.",
    cases: [],
  };
try {
  for (const language of ["en", "de"]) {
    const base = `http://127.0.0.1:${language === "en" ? 3202 : 3210}`,
      context = await browser.newContext({ serviceWorkers: "block" }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      const source = await readFile(
        resolve(
          root,
          `${language === "en" ? "Apps/English/English-Automaticity" : "Apps/Deutsch-Automaticity"}/apps/web/public/learning-core/curriculum-${language}.json`,
        ),
      );
      const response = await context.request.get(
        `${base}/learning-core/curriculum-${language}.json`,
      );
      assert.equal(response.status(), 200);
      assert.equal(hash(await response.body()), hash(source));
      const pack = JSON.parse(source);
      await page.goto(`${base}/practice`);
      await page.locator("#practice-response").waitFor();
      for (const unit of pack.units) {
        const tasks = unit.tasks.filter(
          (task) =>
            !(unit.retiredTasks ?? []).some((row) => row.taskId === task.id),
        );
        const rows = await page.evaluate(
          async ({ language, unit, tasks }) => {
            const topic = document.querySelector(
              `select[aria-label="${language === "en" ? "Grammar topic" : "Grammatikthema"}"]`,
            );
            topic.value = unit.id;
            topic.dispatchEvent(new Event("change", { bubbles: true }));
            const names =
              language === "en"
                ? [
                    "Notice",
                    "Recall",
                    "Vary",
                    "Produce",
                    "Repair",
                    "Transfer",
                    "Return later",
                  ]
                : [
                    "Erkennen",
                    "Abrufen",
                    "Variieren",
                    "Produzieren",
                    "Korrigieren",
                    "Übertragen",
                    "Später abrufen",
                  ];
            const stages = [
                "notice",
                "retrieve",
                "vary",
                "produce",
                "repair",
                "transfer",
                "retain",
              ],
              rows = [];
            for (const [index, stage] of stages.entries())
              for (const modality of ["writing", "speaking"]) {
                const task = tasks.find(
                  (task) => task.stage === stage && task.modality === modality,
                );
                if (!task) continue;
                const button = [
                  ...document.querySelectorAll(".stage-nav button"),
                ].find((button) => button.textContent === names[index]);
                if (!button) throw Error(`Missing stage ${unit.id}:${stage}`);
                button.click();
                await Promise.resolve();
                const name =
                  language === "en"
                    ? modality === "writing"
                      ? "Write"
                      : "Speak"
                    : modality === "writing"
                      ? "Schreiben"
                      : "Sprechen";
                const mode = [...document.querySelectorAll("button")].find(
                  (button) => button.textContent === name,
                );
                if (!mode) throw Error(`Missing modality ${task.id}`);
                mode.click();
                await Promise.resolve();
                if (
                  document.querySelector("#practice-prompt")?.textContent !==
                    task.prompt ||
                  !document.querySelector("#practice-response")
                )
                  throw Error(`Wrong task rendered ${task.id}`);
                if (document.querySelector(".reference")?.textContent)
                  throw Error(`Premature answer exposure ${task.id}`);
                rows.push({
                  constructionId: unit.id,
                  taskId: task.id,
                  stage,
                  modality,
                  status: "passed",
                });
              }
            return rows;
          },
          { language, unit, tasks },
        );
        report.cases.push(...rows.map((row) => ({ language, ...row })));
      }
      assert.deepEqual(errors, []);
      await page.screenshot({
        path: resolve(output, `${language}-last-cell.png`),
        fullPage: true,
      });
    } finally {
      await context.close();
    }
  }
  assert.equal(report.cases.length, 3906);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      output,
      status: report.status,
      cells: report.cases.length,
      error: report.error,
    }),
  );
}
