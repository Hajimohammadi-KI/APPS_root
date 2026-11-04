// W33: the independent content review page in a real browser. A reviewer
// approves one unit and records findings for another; the downloaded approval
// file must pass the curriculum import unchanged. Serves each app's public folder.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  createReadStream,
  mkdtempSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
};
const browser = await chromium.launch();
const results = [];
try {
  for (const [language, app] of [
    ["en", "Apps/English/English-Automaticity"],
    ["de", "Apps/Deutsch/Deutsch-Automaticity"],
  ]) {
    const pub = resolve(root, app, "apps/web/public");
    const server = createServer((req, res) => {
      const path = resolve(pub, "." + new URL(req.url, "http://x").pathname);
      if (!path.startsWith(pub)) return res.writeHead(403).end();
      res.setHeader(
        "Content-Type",
        types[extname(path)] ?? "application/octet-stream",
      );
      createReadStream(path)
        .on("error", () => res.writeHead(404).end())
        .pipe(res);
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const base = `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const pack = JSON.parse(
      readFileSync(
        join(pub, `learning-core/curriculum-${language}.json`),
        "utf8",
      ),
    );
    const cycleUnits = pack.units.filter((unit) => unit.learningCycle);
    assert.equal(cycleUnits.length, 6);
    const selectedUnit = cycleUnits.at(-1);
    await page.goto(
      `${base}/learning-core/content-review.html?unit=${selectedUnit.id}&focus=cycle`,
    );
    await page.locator("#content-review select").waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.lang),
      language,
    );
    await expect(page.locator("#review-unit")).toHaveValue(selectedUnit.id);
    await expect(page.locator("#review-cycles-only")).toBeChecked();
    assert.equal(await page.locator("#review-unit option").count(), 6);
    await expect(page.locator(".review-guide")).toContainText(
      language === "en" ? "Download the JSON file" : "JSON-Datei",
    );
    await expect(page.locator(".review-cycle-goals")).toContainText(
      selectedUnit.learningCycle.goals.meaning,
    );
    assert.deepEqual(
      await page
        .locator("[data-review-cycle-task]")
        .evaluateAll((cards) => cards.map((card) => card.dataset.reviewTask)),
      selectedUnit.learningCycle.steps.map((step) => step.taskId),
    );
    await expect(page.locator(".review-share-link")).toHaveAttribute(
      "href",
      new RegExp(`unit=${selectedUnit.id}.*focus=cycle`),
    );
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      }),
    );
    await page
      .getByRole("button", {
        name:
          language === "en"
            ? "Copy link for this unit"
            : "Link für diese Einheit kopieren",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText(
      language === "en" ? "visible review link" : "sichtbaren Prüflink",
    );
    const inputs = page
      .locator("#content-review fieldset")
      .first()
      .locator("input");
    await inputs.nth(0).fill("Maria Keller");
    await inputs.nth(1).fill("Language teacher, independent review");
    const approve = page.locator("button", {
      hasText:
        language === "en" ? "Approve this unit" : "Diese Einheit freigeben",
    });
    await expect(approve).toBeDisabled();
    // Unit checks and note, then every exercise: all checks and a note.
    const unitBox = page.locator("#content-review fieldset").nth(1);
    for (const box of await unitBox.locator("input[type=checkbox]").all())
      await box.check();
    await unitBox
      .locator("textarea")
      .fill("Rule, examples and contrasts checked against a standard grammar.");
    for (const card of await page.locator("[data-review-cycle-task]").all()) {
      await card.locator("label.review-check input").first().check();
      await card
        .locator("textarea")
        .fill("Prompt, target and every accepted answer checked.");
    }
    await expect(approve).toBeDisabled();
    await expect(page.locator(".review-exports button").first()).toBeDisabled();
    await page
      .getByRole("button", {
        name: language === "en" ? "Save as findings" : "Als Befund speichern",
        exact: true,
      })
      .click();
    const cycleDownload = page.waitForEvent("download");
    await page.locator(".review-exports button").nth(1).click();
    const cycleFindingsFile = join(
      mkdtempSync(join(tmpdir(), "cycle-findings-")),
      "findings.json",
    );
    await (await cycleDownload).saveAs(cycleFindingsFile);
    const cycleFindings = JSON.parse(readFileSync(cycleFindingsFile, "utf8"));
    assert.equal(cycleFindings.findings[0].constructionId, selectedUnit.id);
    assert.ok(cycleFindings.findings[0].tasks.length > 0);
    assert.equal(cycleFindings.contentReviews, undefined);
    await page.locator(".review-other-tasks").evaluate((details) => {
      details.open = true;
    });
    for (const card of await page.locator("#content-review article").all()) {
      await card.locator("label.review-check input").first().check();
      await card
        .locator("textarea")
        .fill("Prompt, target and every accepted answer checked.");
    }
    await expect(approve).toBeEnabled();
    await approve.click();
    await expect(page.locator(".review-progress")).toContainText(
      language === "en" ? "1 of" : "1 von",
    );
    const downloadApproved = page.waitForEvent("download");
    await page.locator(".review-exports button").first().click();
    const file = join(
      mkdtempSync(join(tmpdir(), "content-review-")),
      "bundle.json",
    );
    await (await downloadApproved).saveAs(file);
    // The second unit: one exercise is not confirmed, saved as findings.
    await page.locator("#content-review select").selectOption({ index: 1 });
    await page
      .locator("#content-review article")
      .first()
      .locator("textarea")
      .fill(
        language === "en"
          ? "The accepted answer misses a common contraction."
          : "Eine häufige Kurzform fehlt bei den Antworten.",
      );
    await page
      .locator("button", {
        hasText:
          language === "en" ? "Save as findings" : "Als Befund speichern",
      })
      .click();
    const downloadFindings = page.waitForEvent("download");
    await page.locator(".review-exports button").nth(1).click();
    const findingsFile = join(
      mkdtempSync(join(tmpdir(), "content-findings-")),
      "findings.json",
    );
    await (await downloadFindings).saveAs(findingsFile);
    const reviewBytes = await page.evaluate(
      (lang) => localStorage.getItem(`content-review:${lang}:v1`),
      language,
    );
    await page.goto(
      `${base}/learning-core/content-review.html?unit=not-installed&focus=unknown`,
    );
    await expect(page.locator("#review-unit")).toHaveValue(pack.units[0].id);
    await expect(page.locator("#review-cycles-only")).not.toBeChecked();
    assert.equal(
      await page.locator("#review-unit option").count(),
      pack.units.length,
    );
    assert.equal(
      await page.evaluate(
        (lang) => localStorage.getItem(`content-review:${lang}:v1`),
        language,
      ),
      reviewBytes,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    await context.close();
    await new Promise((done) => server.close(done));
    // The import accepts the downloaded approval as is.
    const check = join(
      mkdtempSync(join(tmpdir(), "content-import-")),
      "check.ts",
    );
    writeFileSync(
      check,
      `
      import { readFileSync } from "node:fs";
      import { prepareCurriculumReviewImport } from ${JSON.stringify(resolve(root, "scripts/lib/reviewed-curriculum.ts"))};
      const packs = new Map([["${language}", JSON.parse(readFileSync(${JSON.stringify(join(pub, `learning-core/curriculum-${language}.json`))}, "utf8"))]]);
      const cells = JSON.parse(readFileSync(${JSON.stringify(resolve(root, "docs/automaticity-coverage.json"))}, "utf8")).cells;
      const prepared = prepareCurriculumReviewImport(JSON.parse(readFileSync(${JSON.stringify(file)}, "utf8")), packs, cells, [], "artifacts/curriculum-review-import/browser-check", new Date().toISOString());
      const findings = JSON.parse(readFileSync(${JSON.stringify(findingsFile)}, "utf8")).findings;
      let cycleFindingsRejected = false;
      try { prepareCurriculumReviewImport(JSON.parse(readFileSync(${JSON.stringify(cycleFindingsFile)}, "utf8")), packs, cells, [], "artifacts/curriculum-review-import/browser-check", new Date().toISOString()); }
      catch { cycleFindingsRejected = true; }
      if (!cycleFindingsRejected) throw Error("Cycle findings must not import as whole-unit approval");
      console.log(JSON.stringify({ imported: prepared.reviews.length, findings: findings.length, unconfirmed: findings[0].unconfirmed.length, cycleFindingsRejected }));
    `,
    );
    const run = spawnSync("bun", [check], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const summary = JSON.parse(run.stdout.trim().split("\n").pop());
    assert(
      summary.imported > 0 && summary.findings === 1 && summary.unconfirmed > 0,
    );
    assert(!overflow, "no horizontal overflow at 390px");
    assert.deepEqual(errors, []);
    results.push({ language, ...summary, status: "verified" });
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ status: "verified", results }));
