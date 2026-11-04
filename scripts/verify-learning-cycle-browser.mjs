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
    const units = pack.units.filter((unit) => unit.learningCycle);
    assert.equal(units.length, 6);
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        for (const unit of units) {
          const retrieve = unit.learningCycle.steps.find(
            (step) => step.stage === "retrieve",
          );
          await page.goto(
            `${base}/practice?task=${encodeURIComponent(retrieve.taskId)}`,
            { waitUntil: "networkidle" },
          );
          await expect(page.locator(".learning-cycle-goals")).toBeVisible();
          for (const step of unit.learningCycle.steps) {
            await page
              .locator(".practice-stage-options")
              .evaluate((details) => {
                details.open = true;
              });
            await page.locator(`[data-cycle-stage="${step.stage}"]`).click();
            await expect(page).toHaveURL(
              new RegExp(
                `task=${encodeURIComponent(step.taskId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
              ),
            );
            await expect(page.locator(".learning-cycle-purpose")).toHaveText(
              step.purpose,
            );
            const task = unit.tasks.find((task) => task.id === step.taskId);
            if (step.stage === "vary")
              await page
                .locator("#practice-response")
                .fill("Saved cycle draft");
            if (step.stage === "transfer") {
              assert.equal(task.answerPolicy, "open");
              await page
                .locator("#practice-response")
                .fill(
                  language === "en"
                    ? "Here is my own response for this situation."
                    : "Hier ist meine eigene Antwort auf diese Situation.",
                );
              await page
                .getByRole("button", {
                  name:
                    language === "en" ? "Save response" : "Antwort speichern",
                  exact: true,
                })
                .click();
              await expect(
                page.locator('[data-feedback-category="unscored"]'),
              ).toBeVisible();
              await expect(page.locator(".task-panel")).not.toHaveAttribute(
                "aria-busy",
                "true",
              );
              await expect
                .poll(async () =>
                  page.evaluate((lang) => {
                    const session = JSON.parse(
                      localStorage.getItem(`automaticity:v2:${lang}:session`),
                    );
                    return !!session?.submittedId;
                  }, language),
                )
                .toBe(true);
              const saved = await page.evaluate((lang) => {
                const events = Object.keys(localStorage)
                  .filter((key) =>
                    key.startsWith(`automaticity:v2:${lang}:event:`),
                  )
                  .map((key) => JSON.parse(localStorage.getItem(key)));
                const session = JSON.parse(
                  localStorage.getItem(`automaticity:v2:${lang}:session`),
                );
                return {
                  attempt: events.find(
                    (event) =>
                      event.type === "attempt" &&
                      event.id === session.submittedId,
                  ),
                  assessment: events.find(
                    (event) =>
                      event.type === "assessment" &&
                      event.attemptId === session.submittedId,
                  ),
                };
              }, language);
              assert.equal(saved.attempt?.task.id, task.id);
              assert.equal(
                saved.attempt?.response.text,
                language === "en"
                  ? "Here is my own response for this situation."
                  : "Hier ist meine eigene Antwort auf diese Situation.",
              );
              assert.equal(saved.assessment?.verdict, "not_assessed");
            }
          }
          await page.locator(".practice-stage-options").evaluate((details) => {
            details.open = true;
          });
          await page.locator('[data-cycle-stage="vary"]').click();
          await expect(page.locator("#practice-response")).toHaveValue(
            "Saved cycle draft",
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            ),
            false,
          );
        }
        assert.deepEqual(errors, []);
        report.push({
          language,
          width,
          units: units.length,
          status: "pass",
          checks: [
            "seven exact stage mappings",
            "goals and purposes",
            "draft preserved",
            "open situation unscored",
            "no page errors or overflow",
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
