import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test"),
  browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto("http://127.0.0.1:3317/", { waitUntil: "domcontentloaded" });
  const snapshot = await (
    await page.request.get("http://127.0.0.1:3317/snapshot")
  ).json();
  const expected = createHash("sha256")
    .update(
      await readFile(
        resolve(root, "docs/language-automaticity-implementation-backlog.json"),
      ),
    )
    .digest("hex");
  assert.equal(snapshot.sourceSha256, expected);
  await page.locator("#phase").selectOption("loop");
  const card = page.locator("#task-L01");
  await expect(card).toHaveAttribute("data-status", "in_progress");
  await expect(card.locator(".pill.good")).toHaveText(
    "✓ Engineering checks passed",
  );
  await expect(card).toContainText(
    /Independent content review and scoped evaluator approval .*pending/,
  );
  await page.screenshot({
    path: resolve(root, "artifacts/l01-assessment/roadmap.png"),
    fullPage: true,
  });
  await writeFile(
    resolve(root, "artifacts/l01-assessment/roadmap-verification.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        status: "verified",
        sourceSha256: expected,
        l01: "in_progress",
        engineeringBadge: "passed",
        independentReview: "pending",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Live L01 roadmap: engineering badge passed; independent review remains pending.",
  );
} finally {
  await browser.close();
}
