import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  "artifacts/r96-entry-browser",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = [];
const taskOf = (href, base) => new URL(href, base).searchParams.get("task");
try {
  for (const [language, base] of [
    ["en", process.argv[2] ?? "http://127.0.0.1:3202"],
    ["de", process.argv[3] ?? "http://127.0.0.1:3210"],
  ]) {
    const daily = language === "en" ? "/daily" : "/heute";
    const pack = await (
      await fetch(`${base}/learning-core/curriculum-${language}.json`)
    ).json();
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.setDefaultTimeout(15000);
      const row = { language, base, width, checks: [] };
      report.push(row);
      const noOverflow = async () =>
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
      try {
        await page.goto(base, { waitUntil: "networkidle" });
        const home = page.locator("a.lh-primary[href*='task=']");
        await expect(home).toBeVisible();
        const href = await home.getAttribute("href");
        const task = taskOf(href, base);
        const unit = pack.units.find((u) => u.tasks.some((t) => t.id === task));
        assert.ok(unit);
        await expect(
          page
            .locator("[data-learning-path-focus], [data-learning-path-topic]")
            .first(),
        ).toContainText(unit.title);
        await noOverflow();
        await page.goto(base + daily, { waitUntil: "networkidle" });
        const panel = page.locator("[data-learning-path-daily]");
        const primary = panel.locator(
          "a[data-learning-path-primary][href*='task=']",
        );
        await expect(primary).toBeVisible();
        assert.equal(taskOf(await primary.getAttribute("href"), base), task);
        await expect(panel).toContainText(unit.title);
        for (const anchor of await page
          .locator("a[data-learning-path-primary]")
          .all())
          assert.equal(taskOf(await anchor.getAttribute("href"), base), task);
        assert.equal(await page.locator(".activity").count(), 7);
        assert.ok(
          (await panel.innerText()).includes(
            language === "en" ? "extra practice" : "zusätzliche Übungen",
          ),
        );
        for (const bar of await page.locator(".activity .bar span").all())
          assert.equal(
            await bar.evaluate((el) => el.getBoundingClientRect().width),
            0,
          );
        await noOverflow();
        await page.screenshot({
          path: resolve(output, `${language}-daily-${width}.png`),
          fullPage: false,
        });
        row.checks.push(
          "fresh Home and Today share an exact task; seven supplementary activities and empty progress bars remain",
        );
        await primary.click();
        await page.waitForURL(/[?&]task=/u);
        assert.equal(new URL(page.url()).searchParams.get("task"), task);
        const words = `Preserved ${language} learner draft`;
        await page.locator("#practice-response").fill(words);
        const raw = await page.evaluate(
          (lang) => localStorage.getItem(`automaticity:v2:${lang}:session`),
          language,
        );
        await page.goto(base, { waitUntil: "networkidle" });
        await expect(page.locator("a.lh-primary[href*='task=']")).toBeVisible();
        assert.equal(
          taskOf(await page.locator("a.lh-primary").getAttribute("href"), base),
          task,
        );
        await page.goto(base + daily, { waitUntil: "networkidle" });
        await expect(primary).toBeVisible();
        assert.equal(taskOf(await primary.getAttribute("href"), base), task);
        await primary.click();
        await expect(page.locator("#practice-response")).toHaveValue(words);
        row.checks.push(
          "an unfinished checked draft is resumed consistently from both entries",
        );
        const chosen = pack.units.find(
          (u) =>
            u.level === "B1" &&
            u.tasks.some(
              (t) => t.partition === "practice" && t.answerPolicy === "closed",
            ),
        );
        assert.ok(chosen);
        const choiceBytes = await page.evaluate(
          ({ lang, id }) => {
            const bytes = JSON.stringify({
              version: 1,
              level: "B1",
              constructionId: id,
              updatedAt: new Date().toISOString(),
            });
            localStorage.setItem(`automaticity:v2:${lang}:choice`, bytes);
            localStorage.setItem(`automaticity:v2:${lang}:level`, "A1");
            return bytes;
          },
          { lang: language, id: chosen.id },
        );
        await page.goto(base, { waitUntil: "networkidle" });
        await expect(
          page
            .locator("[data-learning-path-focus], [data-learning-path-topic]")
            .first(),
        ).toContainText(chosen.title);
        const chosenHref = await page
          .locator("a.lh-primary[href*='task=']")
          .getAttribute("href");
        await page.goto(base + daily, { waitUntil: "networkidle" });
        await expect(panel).toContainText(chosen.title);
        assert.equal(
          taskOf(await primary.getAttribute("href"), base),
          taskOf(chosenHref, base),
        );
        await primary.click();
        await expect(page.locator(".worksheet-lesson-title")).toHaveText(
          chosen.title,
        );
        const retained = await page.evaluate(
          (lang) => ({
            choice: localStorage.getItem(`automaticity:v2:${lang}:choice`),
            archives: Object.keys(localStorage)
              .filter((key) =>
                key.startsWith(`automaticity:v2:${lang}:archived-session:`),
              )
              .map((key) => localStorage.getItem(key)),
          }),
          language,
        );
        assert.equal(retained.choice, choiceBytes);
        assert.ok(retained.archives.includes(raw));
        row.checks.push(
          "new explicit B1 choice wins over old A1 level and draft; choice and old draft bytes are preserved",
        );
        if (language === "de") {
          await page.goto(base + "/automatik", { waitUntil: "networkidle" });
          const main = page.locator(
            "a[data-learning-path-primary][href*='task=']",
          );
          await expect(main).toBeVisible();
          assert.equal(
            taskOf(await main.getAttribute("href"), base),
            taskOf(chosenHref, base),
          );
          await expect(page.getByText(/Zusatzmission:/u).first()).toBeVisible();
          await noOverflow();
          row.checks.push(
            "Automatik offers the same primary continuation and clearly separates the existing supplementary lesson",
          );
        }
        assert.deepEqual(errors, []);
        row.status = "pass";
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ output, report }, null, 2));
}
