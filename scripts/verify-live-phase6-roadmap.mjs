import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test");
const source = await readFile(
  resolve(root, "docs/language-automaticity-implementation-backlog.json"),
);
const backlog = JSON.parse(source);
const output = resolve(
  root,
  `artifacts/phase6-roadmap-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  scope: "Read-only live roadmap over HTTP; no review-packet file navigation",
  status: "running",
  tasks: [],
};
try {
  const context = await browser.newContext({
    viewport: { width: 1365, height: 950 },
  });
  const page = await context.newPage();
  assert.equal(
    (
      await page.goto("http://127.0.0.1:3317/", {
        waitUntil: "domcontentloaded",
      })
    ).status(),
    200,
  );
  const snapshot = await (
    await context.request.get("http://127.0.0.1:3317/snapshot")
  ).json();
  assert.equal(
    snapshot.sourceSha256,
    createHash("sha256").update(source).digest("hex"),
  );
  await expect(page.locator(".task")).toHaveCount(backlog.tasks.length);
  for (const id of [
    "U01",
    "U02",
    "U03",
    "U04",
    "U05",
    "S01",
    "R02",
    "L02",
    "L03",
    "L04",
    "L05",
  ]) {
    const task = page.locator(`#task-${id}`);
    await expect(task).toHaveAttribute("data-status", "verified");
    assert.equal(
      await task.evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(238, 248, 240)",
    );
    report.tasks.push(id);
  }
  for (const id of ["L01", "W05", "P03", "S02", "R03"])
    await expect(page.locator(`#task-${id}`)).not.toHaveAttribute(
      "data-status",
      "verified",
    );
  await page.locator("#phase").selectOption("daily");
  await expect(page.locator(".task")).toHaveCount(5);
  await page.screenshot({
    path: resolve(output, "phase6-green.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: resolve(output, "phase6-mobile.png"),
    fullPage: true,
  });
  report.verifiedRequired = backlog.tasks.filter(
    (task) => task.required && task.status === "verified",
  ).length;
  report.required = backlog.tasks.filter((task) => task.required).length;
  report.sourceSha256 = snapshot.sourceSha256;
  report.status = "verified";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ output, ...report }));
}
