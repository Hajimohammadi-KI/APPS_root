import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const folder = resolve(
  root,
  `artifacts/completion-roadmap/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
const source = await readFile(
  resolve(root, "docs/language-automaticity-implementation-backlog.json"),
);
const backlog = JSON.parse(source),
  sourceSha256 = createHash("sha256").update(source).digest("hex");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  at: new Date().toISOString(),
  scope: "Final live and standalone roadmap; no review-packet navigation",
  status: "running",
  checks: [],
};
try {
  const page = await browser.newPage({
    viewport: { width: 1250, height: 920 },
  });
  assert.equal((await page.goto("http://127.0.0.1:3317/")).status(), 200);
  const snapshot = await (
    await page.request.get("http://127.0.0.1:3317/snapshot")
  ).json();
  assert.equal(snapshot.sourceSha256, sourceSha256);
  assert.equal(snapshot.backlog.technicalRelease.versions.English, "27.3.41");
  assert.equal(snapshot.backlog.technicalRelease.versions.German, "20.8.45");
  assert.equal(snapshot.backlog.delivery.requiredEngineeringTasksStillOpen, 0);
  assert.equal(
    snapshot.backlog.delivery.fsrs,
    "bounded_pilot_available_not_enrolled",
  );
  await expect(page.locator(".task")).toHaveCount(48);
  await expect(page.locator("#stats .stat strong")).toHaveText([
    "29 / 43",
    "43 / 43",
    "14",
    "5",
  ]);
  report.checks.push(
    "Current source and installed versions match; full acceptance is shown before partial engineering evidence",
  );
  for (const task of backlog.tasks.filter((task) => task.required)) {
    const card = page.locator(`#task-${task.id}`);
    assert.equal(task.engineeringVerification, "verified_for_recorded_scope");
    if (task.status === "verified") {
      await expect(card.locator(".badges .good")).toContainText(
        "Verified complete",
      );
      assert.equal(
        await card.evaluate((node) => getComputedStyle(node).backgroundColor),
        "rgb(238, 248, 240)",
      );
    } else {
      await expect(card).toHaveAttribute("data-human-validation", "pending");
      await expect(card.locator(".badges .good")).toContainText(
        "Recorded checks passed",
      );
      await expect(card.locator(".badges .warning")).toContainText(
        task.remainingEngineeringWork?.length
          ? "Implementation still open"
          : "Human validation pending",
      );
      for (const step of task.remainingHumanWork)
        await expect(card.locator(".task-body")).toContainText(step);
      for (const step of [
        ...(task.remainingEngineeringWork || []),
        ...(task.afterHumanValidation || []),
      ])
        await expect(card.locator(".task-body")).toContainText(step);
    }
  }
  report.checks.push(
    "Recorded checks, remaining implementation, human review and later execution are distinguished without promoting incomplete acceptance",
  );
  await expect(page.locator("#completion-note")).toContainText(
    "14 required tasks and 5 conditional tasks remain open",
  );
  assert.deepEqual(
    backlog.tasks
      .filter((task) => task.required && task.remainingEngineeringWork?.length)
      .map((task) => task.id),
    [],
  );
  await expect(page.locator("#completion-note")).not.toContainText(
    "Required implementation still open:",
  );
  await expect(page.locator("#task-S02")).toHaveAttribute(
    "data-human-validation",
    "pending",
  );
  await expect(page.locator("#task-S02")).not.toHaveAttribute(
    "data-implementation",
    "pending",
  );
  await expect(page.locator("#task-S02")).toContainText(
    "Stage A and Stage B engineering checks pass",
  );
  await expect(page.locator("#task-S02")).toContainText(
    "Shipped plans are empty",
  );
  await expect(page.locator("#task-L01")).toContainText(
    "0/168 representative cells",
  );
  await expect(page.locator("#task-W05")).toContainText(
    "real review ledger remains empty",
  );
  assert.equal(
    snapshot.backlog.delivery.reinforcementLearning,
    "offline_prototype_not_active",
  );
  report.checks.push(
    "Missing independent review and inactive reinforcement learning remain explicit",
  );
  await page.screenshot({
    path: resolve(folder, "desktop.png"),
    fullPage: true,
  });
  await page.locator("#phase").selectOption("models");
  await expect(page.locator(".task")).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: resolve(folder, "mobile.png"),
    fullPage: true,
  });
  report.checks.push("Phase filtering and mobile layout work");
  await page.goto(
    pathToFileURL(resolve(root, "docs/LANGUAGE-AUTOMATICITY-ROADMAP.html"))
      .href,
  );
  await expect(page.locator("#stats .stat strong")).toHaveText([
    "29 / 43",
    "43 / 43",
    "14",
    "5",
  ]);
  await expect(page.locator(".task")).toHaveCount(48);
  report.checks.push(
    "Standalone HTML contains the same final evidence and human gates",
  );
  Object.assign(report, {
    status: "verified",
    sourceSha256,
    tasksWithRecordedEngineeringChecks: 43,
    fullAcceptanceVerified: 29,
    humanValidationPending: 14,
    requiredImplementationStillOpen: [],
  });
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(
    resolve(folder, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ folder, ...report }));
}
