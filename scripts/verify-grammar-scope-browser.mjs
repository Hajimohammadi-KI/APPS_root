import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  `artifacts/grammar-scope-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  status: "running",
  cases: [],
};
try {
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.setOffline(true);
  await page.goto(
    pathToFileURL(resolve(root, "docs/LANGUAGE-GRAMMAR-SCOPE.html")).href,
  );
  await expect(page.locator("#count")).toHaveText("280 targets shown");
  report.cases.push("standalone HTML works offline with all 280 targets");
  await expect(page.locator(".note")).toContainText(
    "Independent human content review is pending",
  );
  report.cases.push("model authorship and human-review limit visible");
  await page.locator("#kind").selectOption("additional_target");
  await expect(page.locator("#count")).toHaveText("24 targets shown");
  await page.locator("#language").selectOption("de");
  await expect(page.locator("#count")).toHaveText("12 targets shown");
  report.cases.push("language and additional-target filters combine");
  await page.locator("#search").fill("Ersatzinfinitiv");
  await expect(page.locator("#count")).toHaveText("1 targets shown");
  await page.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details")).toHaveAttribute("open", "");
  await expect(page.locator("details")).toContainText("de.c.146");
  await expect(page.locator("details")).toContainText("partial_only");
  await expect(page.locator("details")).toContainText("0 cells need tasks");
  report.cases.push("keyboard opens the exact additional-target specification");
  await expect(page.locator("details")).toContainText(
    "C1::Komplexe Verbvalenz und Rektion",
  );
  report.cases.push("original title aliases and partial crosswalk visible");
  await page.locator("#search").fill("");
  await page.locator("#family").selectOption("G21");
  await expect(page.locator("#count")).toHaveText("1 targets shown");
  await page.locator("summary").click();
  await expect(page.locator("details")).toContainText(
    "7 writing-only exclusions",
  );
  report.cases.push(
    "graphic-only target preserves seven writing tasks and seven spoken N/A cells",
  );
  await page.locator("#kind").selectOption("existing_unit");
  await page.locator("#family").selectOption("all");
  await page.locator("#search").fill("de.c.105");
  await page.locator("#target-de\\.c\\.105 summary").click();
  await expect(page.locator("#target-de\\.c\\.105")).toContainText(
    "de.c.095 (reinforcement)",
  );
  report.cases.push(
    "many-to-many reinforcement is visibly distinct from task coverage",
  );
  await page.locator("#search").fill("no-target-matches-this-string");
  await expect(page.locator("#count")).toHaveText("0 targets shown");
  await expect(page.locator(".empty")).toBeVisible();
  report.cases.push("empty search has a clear state");
  await page.locator("#search").fill("");
  await page.locator("#language").selectOption("all");
  await page.locator("#kind").selectOption("additional_target");
  await page.screenshot({ path: resolve(output, "desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({ path: resolve(output, "mobile.png") });
  report.cases.push("mobile layout has no horizontal overflow");
  const links = await page
    .locator("main > p a")
    .evaluateAll((links) => links.map((link) => link.href));
  for (const href of links) assert((await readFile(new URL(href))).length > 0);
  report.cases.push("roadmap and generated-data links resolve to local files");
  assert.deepEqual(errors, []);
  report.cases.push("no browser exceptions");
  await context.close();
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ output, ...report }, null, 2));
}
