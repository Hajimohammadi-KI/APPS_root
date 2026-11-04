import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(
  resolve(
    import.meta.dirname,
    "../Apps/English/English-Automaticity/package.json",
  ),
);
const { chromium, expect } = require("@playwright/test");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = [];
try {
  for (const [language, base] of [
    ["en", process.argv[2] ?? "http://127.0.0.1:3202"],
    ["de", process.argv[3] ?? "http://127.0.0.1:3210"],
  ]) {
    const pack = await (
      await fetch(`${base}/learning-core/curriculum-${language}.json`)
    ).json();
    const task = pack.units
      .flatMap((unit) => unit.tasks)
      .find(
        (task) =>
          task.sourceId.startsWith("learner-notebook-") &&
          task.rejectedAnswers?.length,
      );
    assert.ok(task);
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        const saved = [];
        for (const [answer, passed] of [
          [task.acceptedAnswers[0], 1],
          [task.rejectedAnswers[0].answer, 0],
          [task.acceptedAnswers[0], 1],
        ]) {
          await page.goto(
            `${base}/practice?task=${encodeURIComponent(task.id)}`,
            { waitUntil: "networkidle" },
          );
          await page.locator("#practice-response").fill(answer);
          await page
            .getByRole("button", {
              name:
                language === "en" ? "Save and check" : "Speichern und prüfen",
              exact: true,
            })
            .click();
          await expect(page.locator(".task-panel")).not.toHaveAttribute(
            "aria-busy",
            "true",
          );
          await expect(page.locator(".practice-notebook")).toContainText(
            language === "en" ? `${passed} of` : `${passed} von`,
          );
          const events = await page.evaluate(
            (lang) =>
              Object.keys(localStorage)
                .filter((key) =>
                  key.startsWith(`automaticity:v2:${lang}:event:`),
                )
                .map((key) => JSON.parse(localStorage.getItem(key))),
            language,
          );
          for (const original of saved)
            assert.deepEqual(
              events.find((event) => event.id === original.id),
              original,
            );
          const attempts = events.filter((event) => event.type === "attempt");
          assert.equal(attempts.length, saved.length + 1);
          saved.push(
            attempts.find((event) => !saved.some((old) => old.id === event.id)),
          );
          await page.evaluate(
            ({ lang, taskId }) => {
              localStorage.removeItem(`automaticity:v2:${lang}:session`);
              localStorage.removeItem(
                `automaticity:v2:${lang}:session:task:${encodeURIComponent(taskId)}`,
              );
            },
            { lang: language, taskId: task.id },
          );
        }
        assert.deepEqual(errors, []);
        report.push({
          language,
          width,
          status: "pass",
          checks: [
            "current pass 1→0→1",
            "earlier responses immutable",
            "no page errors",
          ],
        });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
