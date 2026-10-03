import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const installed = process.argv.includes("--installed");
const activeTasks = (unit) =>
  unit.tasks.filter(
    (task) => !(unit.retiredTasks ?? []).some((row) => row.taskId === task.id),
  );
const output = resolve(
  root,
  `artifacts/automaticity-practice/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
let language = "en";
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    let file;
    if (path === "/practice")
      file = resolve(
        root,
        `shared/learning-core/browser/practice-${language}.html`,
      );
    else if (path === `/learning-core/curriculum-${language}.json`)
      file = resolve(
        root,
        language === "en"
          ? "Apps/English/English-Automaticity/apps/web/public/learning-core/curriculum-en.json"
          : "Apps/Deutsch-Automaticity/apps/web/public/learning-core/curriculum-de.json",
      );
    else if (
      ["/learning-core/practice.js", "/learning-core/practice.css"].includes(
        path,
      )
    )
      file = resolve(
        root,
        "shared/learning-core/browser",
        path.split("/").at(-1),
      );
    else {
      res.writeHead(404);
      res.end();
      return;
    }
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
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const sourceBase = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  scope: `${installed ? "Installed apps" : "Actual compiled practice UI"}; isolated browser profiles and synthetic learner responses`,
  cases: [],
};
try {
  for (language of ["en", "de"]) {
    const base = installed
      ? `http://127.0.0.1:${language === "en" ? 3202 : 3210}`
      : sourceBase;
    const context = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const row = { language, status: "running" };
    report.cases.push(row);
    try {
      const pack = JSON.parse(
        await readFile(
          resolve(
            root,
            language === "en"
              ? "Apps/English/English-Automaticity/apps/web/public/learning-core/curriculum-en.json"
              : "Apps/Deutsch-Automaticity/apps/web/public/learning-core/curriculum-de.json",
          ),
          "utf8",
        ),
      );
      const unit = pack.units.find(
        (unit) =>
          activeTasks(unit).find(
            (task) => task.stage === "retrieve" && task.modality === "writing",
          )?.answerPolicy === "closed",
      );
      assert.ok(unit);
      const task = activeTasks(unit).find(
        (task) => task.stage === "retrieve" && task.modality === "writing",
      );
      await page.goto(`${base}/practice`);
      await page.locator("#practice-response").waitFor();
      await page
        .getByLabel(language === "en" ? "Grammar topic" : "Grammatikthema", {
          exact: true,
        })
        .selectOption(unit.id);
      assert.equal(await page.locator(".reference").innerText(), "");
      await page
        .locator("#practice-response")
        .fill("Synthetic unfinished draft");
      await page.reload();
      await page.locator("#practice-response").waitFor();
      assert.equal(
        await page.locator("#practice-response").inputValue(),
        "Synthetic unfinished draft",
      );
      await page.locator("#practice-response").fill(task.acceptedAnswers[0]);
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        (language) =>
          [...Array(localStorage.length)]
            .map((_, i) => localStorage.key(i))
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .some(
              (key) =>
                JSON.parse(localStorage.getItem(key)).type === "assessment",
            ),
        language,
      );
      const read = () =>
        page.evaluate(
          (language) =>
            [...Array(localStorage.length)]
              .map((_, i) => localStorage.key(i))
              .filter((key) =>
                key.startsWith(`automaticity:v2:${language}:event:`),
              )
              .map((key) => JSON.parse(localStorage.getItem(key))),
          language,
        );
      let events = await read();
      const original = events.find((row) => row.type === "attempt");
      assert.equal(original.timing.source, "unavailable");
      assert.equal(
        events.find((row) => row.type === "assessment").verdict,
        "pass",
      );
      assert.equal(
        events.find((row) => row.type === "assessment").evaluator.scopeApproved,
        false,
      );
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Try again as a repair"
              : "Als Korrektur erneut versuchen",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: language === "en" ? "Reveal a model" : "Musterlösung zeigen",
          exact: true,
        })
        .click();
      await page.locator("#practice-response").fill(task.acceptedAnswers[0]);
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        (language) =>
          [...Array(localStorage.length)]
            .map((_, i) => localStorage.key(i))
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .filter((row) => row.type === "assessment").length === 2,
        language,
      );
      events = await read();
      const repair = events.find(
        (row) => row.type === "attempt" && row.id !== original.id,
      );
      assert.equal(repair.previousAttemptId, original.id);
      assert.equal(repair.assistance.solutionRevealed, true);
      await page
        .getByRole("button", {
          name: language === "en" ? "Produce" : "Produzieren",
          exact: true,
        })
        .click();
      await page
        .locator("#practice-response")
        .fill(
          language === "en"
            ? "I enjoy walking in the park because it helps me relax."
            : "Ich gehe gern im Park spazieren, weil ich mich dabei entspannen kann.",
        );
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        (language) =>
          [...Array(localStorage.length)]
            .map((_, i) => localStorage.key(i))
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .filter((row) => row.type === "assessment").length === 3,
        language,
      );
      events = await read();
      assert.equal(
        events
          .filter((row) => row.type === "assessment")
          .sort((a, b) => a.at.localeCompare(b.at))
          .at(-1).verdict,
        "not_assessed",
      );
      const other = await context.newPage();
      await other.goto(`${base}/practice`);
      await other.locator("#practice-response").waitFor();
      assert.equal(
        await other.locator("#practice-response").isDisabled(),
        true,
      );
      await other.close();
      await page
        .getByRole("button", {
          name: language === "en" ? "Speak" : "Sprechen",
          exact: true,
        })
        .click();
      assert.equal(
        await page
          .getByRole("button", {
            name: language === "en" ? "Start recording" : "Aufnahme starten",
            exact: true,
          })
          .count(),
        1,
      );
      await page
        .locator("#practice-response")
        .fill("Transcript without a recording");
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        (language) =>
          [...Array(localStorage.length)]
            .map((_, i) => localStorage.key(i))
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .filter((row) => row.type === "assessment").length === 4,
        language,
      );
      events = await read();
      const speech = events.find(
        (row) => row.type === "attempt" && row.task.modality === "speaking",
      );
      assert.equal(speech.audio, null);
      assert.equal(
        events.find(
          (row) => row.type === "assessment" && row.attemptId === speech.id,
        ).verdict,
        "not_assessed",
      );
      await page.locator("#response-review > summary").click();
      await page.locator("#review-attempt").selectOption(original.id);
      await page.locator("#review-kind").selectOption("human");
      await page
        .locator("#reviewer-name")
        .fill("Synthetic browser-test reviewer");
      await page.locator("#review-verdict").selectOption("needs_repair");
      await page
        .locator("#review-feedback")
        .fill("Synthetic correction used only to verify review storage.");
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Save separate review"
              : "Separate Bewertung speichern",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        (language) =>
          [...Array(localStorage.length)]
            .map((_, i) => localStorage.key(i))
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .some(
              (row) =>
                row.type === "assessment" && row.evaluator.kind === "human",
            ),
        language,
      );
      events = await read();
      const reviewed = events.find(
        (row) => row.type === "assessment" && row.evaluator.kind === "human",
      );
      assert.equal(reviewed.evaluator.scopeApproved, false);
      assert.equal(
        reviewed.supersedes,
        events.find(
          (row) =>
            row.type === "assessment" &&
            row.attemptId === original.id &&
            row.evaluator.kind === "rule",
        ).id,
      );
      assert.deepEqual(
        events.find((row) => row.id === original.id),
        original,
      );
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Download complete backup"
              : "Vollständige Sicherung herunterladen",
          exact: true,
        })
        .click();
      const download = await downloadPromise;
      await download.saveAs(resolve(output, `${language}-backup.json`));
      const backup = JSON.parse(
        await readFile(resolve(output, `${language}-backup.json`), "utf8"),
      );
      assert.equal(backup.kind, "automaticity.complete-backup");
      assert.equal(
        backup.localStorage.filter(([key]) => key.includes(":event:")).length,
        events.length,
      );
      const topics = page.getByLabel(
        language === "en" ? "Grammar topic" : "Grammatikthema",
        { exact: true },
      );
      await topics.selectOption(pack.units[0].id);
      await page
        .locator("#practice-response")
        .fill("Draft A survives navigation");
      await topics.selectOption(pack.units[1].id);
      await page
        .locator("#practice-response")
        .fill("Draft B survives navigation");
      await page.goBack();
      await page.locator("#practice-response").waitFor();
      assert.equal(
        await page.locator("#practice-response").inputValue(),
        "Draft A survives navigation",
      );
      await page.goForward();
      await page.locator("#practice-response").waitFor();
      assert.equal(
        await page.locator("#practice-response").inputValue(),
        "Draft B survives navigation",
      );
      await page.getByText("راهنمای فارسی", { exact: true }).click();
      assert.equal(
        await page.locator('p[lang="fa"]').getAttribute("dir"),
        "rtl",
      );
      await page
        .getByLabel(
          language === "en"
            ? "Record response timing from the next task"
            : "Antwortzeit ab der nächsten Aufgabe erfassen",
          { exact: true },
        )
        .uncheck();
      await topics.selectOption(pack.units[2].id);
      await page.locator("#practice-response").fill("Synthetic untimed answer");
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (language) =>
          Object.keys(localStorage)
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .some(
              (row) =>
                row.type === "attempt" &&
                row.response.text === "Synthetic untimed answer",
            ),
        language,
      );
      assert.equal(
        (await read()).find(
          (row) =>
            row.type === "attempt" &&
            row.response.text === "Synthetic untimed answer",
        ).timing.source,
        "unavailable",
      );
      assert(
        await page.evaluate(
          (language) =>
            Object.keys(localStorage).some(
              (key) =>
                key.startsWith(`automaticity:v2:${language}:selection:`) &&
                JSON.parse(localStorage.getItem(key)).reason ===
                  "learner_topic_override",
            ),
          language,
        ),
      );
      await page.setViewportSize({ width: 768, height: 1024 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      await page.screenshot({
        path: resolve(output, `${language}-tablet.png`),
        fullPage: true,
      });
      await page.screenshot({
        path: resolve(output, `${language}-desktop.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: resolve(output, `${language}-mobile.png`),
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      assert.deepEqual(errors, []);
      row.status = "passed";
      row.evidence = {
        catalogUnits: pack.units.length,
        resumedDraft: true,
        backForwardDrafts: true,
        persianRtlGuidance: true,
        untimedKeyboardSubmission: true,
        overrideRecorded: true,
        tabletNoOverflow: true,
        interruptedTimingUnknown: true,
        closedPracticeChecked: true,
        solutionExposureRetained: true,
        repairLinkedToOriginal: true,
        openOutputUnassessed: true,
        noRecordingNoSpeechCredit: true,
        concurrentDraftProtected: true,
        reviewPreservesOriginal: true,
        reviewDoesNotApproveScope: true,
        completeBackupExported: true,
        mobileNoOverflow: true,
        scriptErrors: errors,
      };
    } catch (error) {
      row.status = "failed";
      row.error = String(error);
      row.scriptErrors = errors;
      await page.screenshot({
        path: resolve(output, `${language}-failure.png`),
        fullPage: true,
      });
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.status = report.cases.every((row) => row.status === "passed")
    ? "passed"
    : "failed";
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ output, ...report }, null, 2));
}
