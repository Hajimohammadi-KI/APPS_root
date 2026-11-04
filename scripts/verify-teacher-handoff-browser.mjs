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
    const readiness = await (
      await fetch(`${base}/assessment-readiness.json`)
    ).json();
    const links = readiness.reviewReadiness.selectedCycleReviewLinks;
    assert.equal(links.length, 6);
    assert.equal(readiness.reviewReadiness.status, "awaiting_human_evidence");
    if (process.argv.includes("--study")) {
      assert.equal(readiness.personalStudyPreparation.activePlan, false);
      assert.equal(readiness.personalStudyPreparation.actualObservations, 0);
      assert.equal(
        readiness.personalStudyPreparation.causalBenefitEstablished,
        false,
      );
      assert.deepEqual(
        readiness.personalStudyPreparation.phases.map((row) => row.phase),
        ["pre", "post", "day7", "day30"],
      );
      assert.doesNotMatch(
        JSON.stringify(readiness.personalStudyPreparation),
        /"(?:prompt|acceptedAnswers|solution|response)"/u,
      );
    }
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${base}/assessment-readiness.html`, {
          waitUntil: "networkidle",
        });
        await expect(
          page.getByRole("heading", { name: "تحویل برنامه به معلم" }),
        ).toBeVisible();
        if (process.argv.includes("--study"))
          await expect(
            page.getByRole("heading", {
              name: "آماده‌سازی مطالعهٔ شخصی با معلم",
            }),
          ).toBeVisible();
        for (const link of links)
          await expect(page.locator(`a[href="${link.url}"]`)).toBeVisible();
        await page.locator(`a[href="${links[0].url}"]`).click();
        await expect(page.locator("#review-unit")).toHaveValue(links[0].unitId);
        await expect(page.locator("#review-cycles-only")).toBeChecked();
        await expect(page.locator("#review-unit option")).toHaveCount(6);
        await expect(page.locator(".review-guide")).toBeVisible();
        await expect(page.locator(".review-cycle-goals")).toBeVisible();
        await expect(page.locator("[data-review-cycle-task]")).toHaveCount(7);
        await expect(
          page.getByRole("button", {
            name:
              language === "en"
                ? "Approve this unit"
                : "Diese Einheit freigeben",
            exact: true,
          }),
        ).toBeDisabled();
        const href = await page
          .locator(".review-share-link")
          .getAttribute("href");
        assert.equal(new URL(href).origin, new URL(base).origin);
        assert.equal(new URL(href).searchParams.get("unit"), links[0].unitId);
        await expect(page.locator(".review-other-tasks")).toBeVisible();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        assert.deepEqual(errors, []);
        report.push({
          language,
          width,
          status: "pass",
          checks: [
            "teacher guide and six exact links",
            "seven cycle tasks and goals",
            "full-unit approval guarded",
            "share link",
            ...(process.argv.includes("--study")
              ? [
                  "four preparation phases; no active study, observations or future questions",
                ]
              : []),
            "no errors or overflow",
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
