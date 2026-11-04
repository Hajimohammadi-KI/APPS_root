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
      await fetch(base + `/learning-core/curriculum-${language}.json`)
    ).json();
    const unit = pack.units.find(
      (u) => u.id === (language === "en" ? "en.c.001" : "de.c.086"),
    );
    const task = unit.tasks.find(
      (t) => t.id.includes("errors-202611041") && t.rejectedAnswers?.length,
    );
    assert.ok(task);
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(
          base + `/practice?task=${encodeURIComponent(task.id)}`,
          { waitUntil: "networkidle" },
        );
        const wrong = task.rejectedAnswers[0].answer;
        await page.locator("#practice-response").fill(wrong);
        await page
          .getByRole("button", {
            name: language === "en" ? "Save and check" : "Speichern und prüfen",
            exact: true,
          })
          .click();
        await expect(
          page.locator('[data-feedback-category="grammar"]'),
        ).toBeVisible();
        const parent = await page.evaluate(
          (lang) =>
            JSON.parse(localStorage.getItem(`automaticity:v2:${lang}:session`))
              .submittedId,
          language,
        );
        await page.locator("[data-repair-action]").click();
        await expect(page.locator("#practice-response")).toHaveValue(wrong);
        await page
          .locator("#practice-response")
          .fill(task.acceptedAnswers.at(-1));
        await page
          .getByRole("button", {
            name: language === "en" ? "Save and check" : "Speichern und prüfen",
            exact: true,
          })
          .click();
        const result = await page.evaluate((lang) => {
          const s = JSON.parse(
            localStorage.getItem(`automaticity:v2:${lang}:session`),
          );
          return {
            s,
            events: Object.keys(localStorage)
              .filter((k) => k.startsWith(`automaticity:v2:${lang}:event:`))
              .map((k) => JSON.parse(localStorage.getItem(k))),
          };
        }, language);
        const current = result.events.find(
          (e) => e.type === "attempt" && e.id === result.s.submittedId,
        );
        assert.equal(current.previousAttemptId, parent);
        assert.equal(
          result.events.find((e) => e.type === "attempt" && e.id === parent)
            .response.text,
          wrong,
        );
        assert.equal(
          result.events.find(
            (e) => e.type === "assessment" && e.attemptId === current.id,
          ).verdict,
          "pass",
        );
        await page.goto(
          base + (language === "en" ? "/grammar" : "/grammatik"),
          { waitUntil: "networkidle" },
        );
        if (language === "en") {
          const selected = await page.evaluate(() => {
            const u = window.__ENGLISH_GRAMMAR_UNITS__.find(
              (u) => u.title === "Verb be: am/is/are",
            );
            return {
              index: u.exercises.findIndex((x) =>
                x[2]?.rejectedAnswers?.some(
                  (r) => r.answer === "I is ready for the lesson.",
                ),
              ),
            };
          });
          assert.ok(selected.index >= 0);
          await page.evaluate(
            ({ index }) =>
              localStorage.setItem(
                "english-automaticity:grammar-progress:v2",
                JSON.stringify({
                  activeLevel: "A1",
                  activeTopic: "Verb be: am/is/are",
                  taskIndex: index,
                  completed: [],
                }),
              ),
            selected,
          );
          await page.goto(base + "/grammar", { waitUntil: "networkidle" });
          await page.locator("#answerInput").fill("I is ready for the lesson.");
          await page.locator("#checkBtn").click();
          await expect(page.locator("#repairInput")).toHaveValue(
            "I is ready for the lesson.",
          );
          assert.ok(
            !(await page.locator("#feedback").innerText()).includes(
              "I am ready for the lesson.",
            ),
          );
          await page.locator("#modelBtn").click();
          await expect(page.locator("#feedback")).toContainText(
            "I am ready for the lesson.",
          );
          await page.locator("#repairInput").fill("I'm ready for the lesson.");
          await page.locator("#repairBtn").click();
          await expect(page.locator("#nextBtn")).toBeEnabled();
        } else {
          await page.goto(
            base + "/grammatik?topic=" + encodeURIComponent(unit.title),
            { waitUntil: "networkidle" },
          );
          await page.locator("#nextBtn").click();
          await expect(page.locator("#exercisePrompt")).toContainText(
            "aufstehen",
          );
          await page.locator("#answerInput").fill(wrong);
          await page.locator("#checkBtn").click();
          assert.ok(
            !(await page.locator("#feedback").innerText()).includes(
              task.acceptedAnswers[0],
            ),
          );
          await expect(page.locator("#answerInput")).toHaveValue(wrong);
          await page.locator("#showModelBtn").click();
          await expect(page.locator("#feedback")).toContainText(
            task.acceptedAnswers[0],
          );
          await page.locator("#answerInput").fill(task.acceptedAnswers[0]);
          await page.locator("#checkBtn").click();
        }
        assert.deepEqual(errors, []);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        report.push({
          language,
          width,
          status: "pass",
          checks: [
            "definite error repaired in a new linked attempt",
            "original answer immutable",
            "models explicit only",
            "accepted Lab repair uses same checker",
          ],
        });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
