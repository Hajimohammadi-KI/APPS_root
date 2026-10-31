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
const { chromium, expect } = require("@playwright/test");
const installed = process.argv.includes("--installed");
const output = resolve(
  root,
  `artifacts/daily-plan-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const publicRoot = (language) =>
  resolve(
    root,
    language === "en"
      ? "Apps/English/English-Automaticity/apps/web/public"
      : "Apps/Deutsch/Deutsch-Automaticity/apps/web/public",
  );
let language = "en";
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  const file =
    path === "/practice"
      ? resolve(root, `shared/learning-core/browser/practice-${language}.html`)
      : ["practice.js", "practice.css", "automaticity-v2.js"].some(
            (name) => path === `/learning-core/${name}`,
          )
        ? resolve(root, "shared/learning-core/browser", path.split("/").at(-1))
        : path === `/learning-core/curriculum-${language}.json`
          ? resolve(publicRoot(language), path.slice(1))
          : null;
  if (!file) {
    response.writeHead(404);
    response.end();
    return;
  }
  try {
    response.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : file.endsWith(".json")
            ? "application/json"
            : "text/html",
    );
    response.end(await readFile(file));
  } catch (error) {
    response.writeHead(500);
    response.end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  scope: `${installed ? "Installed" : "Compiled source"} practice routes; synthetic answers, isolated browser profiles; no real learning or physical-device claim`,
  cases: [],
};
try {
  for (language of ["en", "de"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    const base = installed
      ? `http://127.0.0.1:${language === "en" ? 3202 : 3210}`
      : `http://127.0.0.1:${server.address().port}`;
    const row = { language, checks: [], status: "running" };
    report.cases.push(row);
    const t = (en, de) => (language === "en" ? en : de);
    const action = (en, de) =>
      page.getByRole("button", { name: t(en, de), exact: true });
    const events = () =>
      page.evaluate(
        (lang) =>
          Object.keys(localStorage)
            .filter((key) => key.startsWith(`automaticity:v2:${lang}:event:`))
            .map((key) => JSON.parse(localStorage.getItem(key))),
        language,
      );
    // Collapsed sections are opened, as a learner would, before their controls are used.
    const expand = async (en, de, target = page) => {
      const summary = target.getByText(t(en, de), { exact: true });
      if (!(await summary.evaluate((node) => node.parentElement.open)))
        await summary.click();
    };
    const planOptions = (target = page) =>
      expand(
        "My plan & practice options",
        "Mein Plan & Übungseinstellungen",
        target,
      );
    const continuation = () =>
      page.getByRole("button", {
        name: new RegExp(
          `^(?:${t("Repair before continuing|Continue learning path", "Vor dem Weitergehen korrigieren|Lernweg fortsetzen")})$`,
        ),
      });
    try {
      for (const asset of [
        "practice.js",
        "automaticity-v2.js",
        `curriculum-${language}.json`,
      ]) {
        const bytes = Buffer.from(
          await (await fetch(`${base}/learning-core/${asset}`)).arrayBuffer(),
        );
        const expected = await readFile(
          resolve(publicRoot(language), "learning-core", asset),
        );
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          createHash("sha256").update(expected).digest("hex"),
        );
      }
      row.checks.push("served assets match current source");
      await page.goto(`${base}/practice`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#daily-response-goal")).toHaveValue("3");
      const count = await page
        .getByLabel(t("Grammar topic", "Grammatikthema"), { exact: true })
        .locator("option")
        .count();
      assert.equal(count, language === "en" ? 124 : 156);
      await planOptions();
      await page.locator("#daily-response-goal").focus();
      await page.locator("#daily-response-goal").selectOption("5");
      await expect(page.locator("#daily-response-goal")).toBeFocused();
      await page
        .locator("#practice-response")
        .fill("Synthetic saved daily-plan draft");
      const initialUrl = page.url();
      const sessionBytes = await page.evaluate(
        (lang) => localStorage.getItem(`automaticity:v2:${lang}:session`),
        language,
      );
      await action("Finish for now", "Für heute pausieren").focus();
      await page.keyboard.press("Enter");
      await expect(action("Resume practice", "Weiterüben")).toBeVisible();
      await expect(action("Resume practice", "Weiterüben")).toBeFocused();
      await expect(page.locator("#practice-response")).toHaveCount(0);
      assert.equal(
        (await events()).filter((row) => row.type === "attempt").length,
        0,
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(action("Resume practice", "Weiterüben")).toBeVisible();
      await expect(page.locator("#daily-response-goal")).toHaveValue("5");
      await action("Resume practice", "Weiterüben").click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic saved daily-plan draft",
      );
      assert.equal(page.url(), initialUrl);
      assert.equal(
        await page.evaluate(
          (lang) => localStorage.getItem(`automaticity:v2:${lang}:session`),
          language,
        ),
        sessionBytes,
      );
      row.checks.push(
        "keyboard pause, reload and resume preserve exact draft and task without an attempt",
      );
      await action("Save and check", "Speichern und prüfen").click();
      await expect(page.locator("[data-daily-responses]")).toHaveAttribute(
        "data-daily-responses",
        "1",
      );
      const first = (await events()).find((row) => row.type === "attempt");
      assert.equal(first.timing.source, "unavailable");
      // Since W08 an unmatched closed answer is saved without a score; it is never accepted.
      const firstVerdicts = (await events())
        .filter(
          (row) => row.type === "assessment" && row.attemptId === first.id,
        )
        .map((row) => row.verdict);
      assert.ok(firstVerdicts.includes("not_assessed"));
      assert.ok(!firstVerdicts.includes("pass"));
      await action(
        "Try again as a repair",
        "Als Korrektur erneut versuchen",
      ).click();
      await action("Reveal a model", "Musterlösung zeigen").click();
      await page
        .locator("#practice-response")
        .fill("Synthetic assisted repair");
      await action("Save and check", "Speichern und prüfen").click();
      await expect(page.locator("[data-daily-responses]")).toHaveAttribute(
        "data-daily-responses",
        "2",
      );
      const repaired = (await events()).find(
        (row) => row.type === "attempt" && row.previousAttemptId === first.id,
      );
      assert.equal(repaired.assistance.solutionRevealed, true);
      await page.locator("#daily-response-goal").selectOption("3");
      // R88: open writing is optional and opened through its explicit task link.
      await expand(
        "Optional writing and speaking",
        "Optional schreiben und sprechen",
      );
      await page
        .getByRole("link", {
          name: `${t("Produce", "Produzieren")} · ${t("Write", "Schreiben")}`,
          exact: true,
        })
        .click();
      await expect(action("Save response", "Antwort speichern")).toBeVisible();
      await expect(
        action("Save and check", "Speichern und prüfen"),
      ).toHaveCount(0);
      await page
        .locator("#practice-response")
        .fill("Synthetic open response for effort counting only");
      await action("Save response", "Antwort speichern").click();
      await expect(page.locator("[data-daily-responses]")).toHaveAttribute(
        "data-daily-responses",
        "3",
      );
      await planOptions();
      await expect(
        page.getByText(
          t(/Today's goal is reached/, /Dein Tagesziel ist erreicht/),
        ),
      ).toBeVisible();
      assert.equal(
        (await events()).filter(
          (row) => row.type === "assessment" && row.evaluator.scopeApproved,
        ).length,
        0,
      );
      row.checks.push(
        "unmatched closed answer saved unscored; assisted repair and optional open responses count as effort without mastery; interrupted timing unavailable",
      );
      // A saved response continues on the main path, which offers only checked writing.
      await continuation().click();
      await expect(
        action("Save and check", "Speichern und prüfen"),
      ).toBeVisible();
      await page
        .locator("#practice-response")
        .fill("Synthetic draft retained through quota failure");
      await page.addScriptTag({
        url: `${base}/learning-core/automaticity-v2.js`,
      });
      const key = await page.evaluate(
        (lang) =>
          window.AutomaticityV2.dailyPlanKey(
            lang,
            window.AutomaticityV2.practiceDay(new Date().toISOString()),
          ),
        language,
      );
      await page.evaluate(
        (key) => localStorage.setItem(key, "original-unreadable-goal"),
        key,
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await planOptions();
      await expect(
        page.getByText(
          t(
            /saved daily goal could not be read/,
            /gespeichertes Tagesziel ist nicht lesbar/,
          ),
        ),
      ).toBeVisible();
      await page.locator("#daily-response-goal").selectOption("8");
      assert.equal(
        await page.evaluate(
          (key) =>
            Object.keys(localStorage).some(
              (name) =>
                name.startsWith(key + ":unreadable:") &&
                localStorage.getItem(name) === "original-unreadable-goal",
            ),
          key,
        ),
        true,
      );
      const originalPlan = await page.evaluate(
        (key) => localStorage.getItem(key),
        key,
      );
      await page.evaluate((key) => {
        window.dailyTestSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (name, value) {
          if (name === key)
            throw new DOMException(
              "Synthetic storage quota failure",
              "QuotaExceededError",
            );
          return window.dailyTestSetItem.call(this, name, value);
        };
      }, key);
      await page.locator("#daily-response-goal").selectOption("3");
      await expect(page.locator("#daily-response-goal")).toHaveValue("8");
      await action("Finish for now", "Für heute pausieren").click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic draft retained through quota failure",
      );
      assert.equal(
        await page.evaluate((key) => localStorage.getItem(key), key),
        originalPlan,
      );
      await expect(page.getByRole("alert")).toContainText(
        t("Export a backup below", "Exportiere unten eine Sicherung"),
      );
      await page.evaluate(() => {
        Storage.prototype.setItem = window.dailyTestSetItem;
        delete window.dailyTestSetItem;
      });
      row.checks.push(
        "unreadable plan archived on explicit change; quota preserves original goal and editable draft",
      );
      const other = await context.newPage();
      other.setDefaultNavigationTimeout(30000);
      await other.goto(`${base}/practice`, { waitUntil: "domcontentloaded" });
      await planOptions(other);
      await expect(other.locator("#daily-response-goal")).toBeDisabled();
      await expect(
        other.getByRole("button", {
          name: t("Finish for now", "Für heute pausieren"),
          exact: true,
        }),
      ).toBeDisabled();
      await other.close();
      row.checks.push("second tab cannot alter the daily plan");
      for (const width of [375, 820]) {
        await page.setViewportSize({ width, height: 950 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
        );
        await page.screenshot({
          path: resolve(output, `${language}-${width}.png`),
          fullPage: true,
        });
      }
      await planOptions();
      // The support-language guide and prompts also carry lang=fa; target the Persian help itself.
      const persianHelp = page.getByText("راهنمای فارسی", { exact: true });
      await persianHelp.click();
      const persianGuide = persianHelp.locator(
        "xpath=following-sibling::p[@lang='fa']",
      );
      await expect(persianGuide).toBeVisible();
      await expect(persianGuide).toHaveAttribute("dir", "rtl");
      await action("Finish for now", "Für heute pausieren").click();
      await action("Resume practice", "Weiterüben").click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic draft retained through quota failure",
      );
      row.checks.push(
        "mobile/tablet reflow, Persian RTL, and visible finish/resume controls",
      );
      await page.addScriptTag({
        url: `${base}/learning-core/automaticity-v2.js`,
      });
      const seeded = await page.evaluate(async (language) => {
        const core = window.AutomaticityV2;
        const pack = await (
          await fetch(`/learning-core/curriculum-${language}.json`)
        ).json();
        const unit = pack.units[0],
          speech = core
            .activePracticeTasks(unit)
            .find(
              (task) =>
                task.stage === "retrieve" && task.modality === "speaking",
            );
        const at = new Date(Date.now() - 3 * 86400000).toISOString();
        const attempt = {
          version: 2,
          type: "attempt",
          id: crypto.randomUUID(),
          language,
          at,
          task: speech,
          response: {
            text: "Synthetic earlier speaking attempt",
            sha256: await core.sha256("Synthetic earlier speaking attempt"),
            originalTranscriptSha256: null,
            transcriptEdited: false,
          },
          timing: {
            startedAt: at,
            source: "unavailable",
            activeMs: null,
            firstInputMs: null,
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
        core.appendAutomaticityEvent(localStorage, attempt);
        return {
          title: unit.title,
          id: attempt.id,
          checkedTaskIds: core
            .activePracticeTasks(unit)
            .filter(
              (task) =>
                task.partition === "practice" && core.isCheckedTask(task),
            )
            .map((task) => task.id),
          returnTaskId: core
            .activePracticeTasks(unit)
            .find(
              (task) =>
                task.stage === "retain" &&
                task.modality === "speaking" &&
                task.partition === "practice",
            ).id,
        };
      }, language);
      await page.reload({ waitUntil: "domcontentloaded" });
      await planOptions();
      await expand("Other suggested topics", "Weitere Themenvorschläge");
      const dueTopic = page
        .locator(".focus-list")
        .getByRole("button", { name: seeded.title, exact: true });
      // R88: a due spoken review never pulls the main path into unscored speech.
      await expect(
        dueTopic.locator("xpath=following-sibling::p[1]"),
      ).toHaveText(new RegExp(`^${t("Writing", "Schreiben")} · `));
      await dueTopic.click();
      await page.waitForURL((url) =>
        seeded.checkedTaskIds.includes(url.searchParams.get("task")),
      );
      await expect(
        action("Save and check", "Speichern und prüfen"),
      ).toBeVisible();
      // Spoken recall stays one explicit optional link away, saved without a score.
      await expand(
        "Optional writing and speaking",
        "Optional schreiben und sprechen",
      );
      await page
        .getByRole("link", {
          name: `${t("Return later", "Später abrufen")} · ${t("Speak", "Sprechen")}`,
          exact: true,
        })
        .click();
      await page.waitForURL(
        (url) => url.searchParams.get("task") === seeded.returnTaskId,
      );
      assert.equal(
        new URL(page.url()).searchParams.get("task"),
        seeded.returnTaskId,
      );
      await expect(action("Start recording", "Aufnahme starten")).toBeVisible();
      await expect(action("Save response", "Antwort speichern")).toBeVisible();
      await page.addScriptTag({
        url: `${base}/learning-core/automaticity-v2.js`,
      });
      const repairSeed = await page.evaluate(async (language) => {
        const core = window.AutomaticityV2,
          at = new Date().toISOString();
        const pack = await (
          await fetch(`/learning-core/curriculum-${language}.json`)
        ).json();
        const unit = pack.units.find(
          (unit) =>
            unit.level !== "C1" &&
            core
              .activePracticeTasks(unit)
              .some(
                (task) =>
                  task.answerPolicy === "closed" &&
                  task.stage === "retrieve" &&
                  task.modality === "writing",
              ),
        );
        const task = core
          .activePracticeTasks(unit)
          .find(
            (task) =>
              task.answerPolicy === "closed" &&
              task.stage === "retrieve" &&
              task.modality === "writing",
          );
        const text = task.acceptedAnswers[0].toUpperCase();
        const attempt = {
          version: 2,
          type: "attempt",
          id: crypto.randomUUID(),
          language,
          at,
          task,
          response: {
            text,
            sha256: await core.sha256(text),
            originalTranscriptSha256: null,
            transcriptEdited: false,
          },
          timing: {
            startedAt: at,
            source: "unavailable",
            activeMs: null,
            firstInputMs: null,
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
        core.appendAutomaticityEvent(localStorage, attempt);
        const assessment = core.assessControlledTask(
          attempt,
          task,
          at,
          crypto.randomUUID(),
        );
        core.appendAutomaticityEvent(localStorage, assessment);
        return {
          title: unit.title,
          id: attempt.id,
          taskId: task.id,
          verdict: assessment.verdict,
        };
      }, language);
      assert.equal(repairSeed.verdict, "needs_repair");
      await planOptions();
      await page
        .getByLabel(t("Practice level", "Übungsniveau"), { exact: true })
        .selectOption("C1");
      await expand("Other suggested topics", "Weitere Themenvorschläge");
      await page
        .locator(".focus-list")
        .getByRole("button", { name: repairSeed.title, exact: true })
        .click();
      await page.waitForURL(
        (url) => url.searchParams.get("task") === repairSeed.taskId,
      );
      assert.equal(
        new URL(page.url()).searchParams.get("task"),
        repairSeed.taskId,
      );
      const linked = await page.evaluate(
        (lang) =>
          JSON.parse(localStorage.getItem(`automaticity:v2:${lang}:session`)),
        language,
      );
      assert.equal(linked.previousAttemptId, repairSeed.id);
      row.checks.push(
        "due spoken review keeps the main path on checked writing; speaking recall opens from its explicit optional link with recording and an honest save label; changing level keeps repair visible and linked to original response",
      );
      row.status = "passed";
    } catch (error) {
      row.status = "failed";
      row.error = error.message;
      row.stack = error.stack;
      await page.screenshot({
        path: resolve(output, `${language}-failure.png`),
        fullPage: true,
      });
    }
    await context.close();
    console.log(JSON.stringify(row));
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
report.status = report.cases.every((row) => row.status === "passed")
  ? "verified"
  : "failed";
await writeFile(
  resolve(output, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify({ status: report.status, output }));
if (report.status !== "verified") process.exitCode = 1;
