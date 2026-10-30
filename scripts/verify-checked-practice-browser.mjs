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
const output = resolve(
  root,
  `artifacts/checked-practice-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
let language = "en",
  optionalOnly = false;
const publicRoot = () =>
  resolve(
    root,
    language === "en"
      ? "Apps/English/English-Automaticity/apps/web/public"
      : "Apps/Deutsch/Deutsch-Automaticity/apps/web/public",
  );
const checked = (task) =>
  task.partition === "practice" &&
  task.modality === "writing" &&
  task.answerPolicy === "closed" &&
  task.acceptedAnswers.length > 0 &&
  !task.constructionAssessment;
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const file =
    path === "/practice"
      ? resolve(root, `shared/learning-core/browser/practice-${language}.html`)
      : ["practice.js", "practice.css"].some(
            (name) => path === `/learning-core/${name}`,
          )
        ? resolve(root, "shared/learning-core/browser", path.split("/").at(-1))
        : path === `/learning-core/curriculum-${language}.json`
          ? resolve(publicRoot(), path.slice(1))
          : null;
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    let bytes = await readFile(file);
    if (optionalOnly && file.endsWith(".json")) {
      const pack = JSON.parse(bytes);
      for (const unit of pack.units) {
        unit.tasks = unit.tasks.filter((task) => !checked(task));
        delete unit.retiredTasks;
      }
      bytes = Buffer.from(JSON.stringify(pack));
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
    res.end(bytes);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  scope:
    "Compiled source; synthetic responses in isolated browser profiles; no real learning or physical audio-device claim",
  cases: [],
};
try {
  for (language of ["en", "de"]) {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const row = { language, checks: [], status: "running", pageErrors: [] };
    report.cases.push(row);
    page.on("pageerror", (error) => row.pageErrors.push(error.message));
    const t = (en, de) => (language === "en" ? en : de);
    const pack = JSON.parse(
      await readFile(
        resolve(publicRoot(), `learning-core/curriculum-${language}.json`),
        "utf8",
      ),
    );
    const taskById = new Map(
      pack.units.flatMap((unit) => unit.tasks.map((task) => [task.id, task])),
    );
    const currentTask = async () =>
      taskById.get(new URL(page.url()).searchParams.get("task"));
    try {
      await page.goto(`${base}/practice`, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByText(
          t("Optional writing and speaking", "Optional schreiben und sprechen"),
          { exact: true },
        ),
      ).toBeVisible();
      assert.ok(checked(await currentTask()));
      await expect(
        page.getByRole("button", { name: t("Speak", "Sprechen"), exact: true }),
      ).toHaveCount(0);
      await page.reload({ waitUntil: "domcontentloaded" });
      assert.ok(checked(await currentTask()));
      await page
        .locator("#practice-response")
        .fill("Synthetic checked-path response");
      await page
        .getByRole("button", {
          name: t("Save and check", "Speichern und prüfen"),
          exact: true,
        })
        .click();
      // Since W08 an unmatched closed answer is saved unscored, so continuation may be a repair or the next step.
      const continuation = page.getByRole("button", {
        name: new RegExp(
          `^(?:${t("Repair before continuing|Continue learning path", "Vor dem Weitergehen korrigieren|Lernweg fortsetzen")})$`,
        ),
      });
      await expect(continuation).toBeVisible();
      await continuation.click();
      await page.waitForFunction(
        (id) =>
          new URL(location.href).searchParams.get("task") !== id ||
          document.querySelector("#practice-response")?.value === "",
        (await currentTask()).id,
      );
      assert.ok(checked(await currentTask()));
      row.checks.push(
        "main entry, reload and continuation after an unscored or failed answer stay within checked writing",
      );
      const unit = pack.units.find((unit) =>
        unit.tasks.some(
          (task) =>
            task.partition === "practice" &&
            task.answerPolicy === "open" &&
            task.modality === "writing" &&
            !unit.retiredTasks?.some((retired) => retired.taskId === task.id),
        ),
      );
      const open = unit.tasks.find(
        (task) =>
          task.partition === "practice" &&
          task.answerPolicy === "open" &&
          task.modality === "writing" &&
          !unit.retiredTasks?.some((retired) => retired.taskId === task.id),
      );
      await page.goto(`${base}/practice?task=${encodeURIComponent(open.id)}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("button", {
          name: t("Save response", "Antwort speichern"),
          exact: true,
        }),
      ).toBeVisible();
      await page
        .locator("#practice-response")
        .fill("Preserved optional production draft");
      await page
        .getByRole("button", {
          name: t("Show a hint", "Hinweis anzeigen"),
          exact: true,
        })
        .click();
      const sessionKey = `automaticity:v2:${language}:session`;
      const originalBytes = await page.evaluate(
        (key) => localStorage.getItem(key),
        sessionKey,
      );
      await page.goto(`${base}/practice`, { waitUntil: "domcontentloaded" });
      await page.waitForURL(/[?&]task=/u);
      assert.ok(checked(await currentTask()));
      await expect(
        page.getByRole("link", {
          name: t(
            "Resume optional saved response",
            "Optionale gespeicherte Antwort fortsetzen",
          ),
          exact: true,
        }),
      ).toBeVisible();
      const preserved = await page.evaluate(
        ({ key, id }) => ({
          task: localStorage.getItem(`${key}:task:${encodeURIComponent(id)}`),
          archives: Object.keys(localStorage)
            .filter((name) => name.includes(":archived-session:"))
            .map((name) => localStorage.getItem(name)),
        }),
        { key: sessionKey, id: open.id },
      );
      assert.equal(preserved.task, originalBytes);
      assert.ok(preserved.archives.includes(originalBytes));
      await page
        .getByRole("link", {
          name: t(
            "Resume optional saved response",
            "Optionale gespeicherte Antwort fortsetzen",
          ),
          exact: true,
        })
        .click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Preserved optional production draft",
      );
      assert.equal(
        (
          await page.evaluate(
            (key) => JSON.parse(localStorage.getItem(key)),
            sessionKey,
          )
        ).hintCount,
        1,
      );
      row.checks.push(
        "explicit optional task remains reachable; generic entry preserves exact draft and help in task storage and archive; resume link restores it",
      );
      const speech = unit.tasks.find(
        (task) =>
          task.partition === "practice" &&
          task.modality === "speaking" &&
          !unit.retiredTasks?.some((retired) => retired.taskId === task.id),
      );
      assert.ok(speech);
      await page.goto(
        `${base}/practice?task=${encodeURIComponent(speech.id)}`,
        { waitUntil: "domcontentloaded" },
      );
      await expect(
        page.getByRole("button", {
          name: t("Start recording", "Aufnahme starten"),
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: t("Save response", "Antwort speichern"),
          exact: true,
        }),
      ).toBeVisible();
      row.checks.push(
        "explicit speech task retains recording controls and honest save label",
      );
      optionalOnly = true;
      const emptyContext = await browser.newContext({
        serviceWorkers: "block",
      });
      try {
        const emptyPage = await emptyContext.newPage();
        await emptyPage.goto(`${base}/practice`, {
          waitUntil: "domcontentloaded",
        });
        await expect(
          emptyPage.getByText(
            t(
              "No checked practice is available for this topic.",
              "Für dieses Thema ist noch keine prüfbare Übung verfügbar.",
            ),
            { exact: true },
          ),
        ).toBeVisible();
        await expect(emptyPage.locator("#practice-response")).toHaveCount(0);
      } finally {
        await emptyContext.close();
        optionalOnly = false;
      }
      row.checks.push(
        "an optional-only catalog does not fall back into unassessed main practice",
      );
      await page.screenshot({
        path: resolve(output, `${language}-optional.png`),
        fullPage: true,
      });
      row.status = "pass";
    } catch (error) {
      row.status = "fail";
      row.error = String(error?.stack ?? error);
      await page.screenshot({
        path: resolve(output, `${language}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(
    resolve(output, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log(JSON.stringify({ output, report }, null, 2));
}
