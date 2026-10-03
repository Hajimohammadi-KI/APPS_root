import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  `artifacts/language-roadmap/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const paths = {
  backlog: resolve(output, "backlog.json"),
  history: resolve(output, "history.json"),
  output: resolve(output, "roadmap.html"),
};
const original = JSON.parse(
  await readFile(
    resolve(root, "docs/language-automaticity-implementation-backlog.json"),
    "utf8",
  ),
);
const fixture = structuredClone(original);
fixture.tasks.push({
  id: "TEST",
  phase: fixture.phases[0].id,
  title: "Synthetic progress update",
  status: "planned",
  priority: "P1",
  required: true,
  dependsOn: [],
  deliverable: "Browser fixture only",
  condition: null,
  acceptance: ["Verified synthetic update"],
  evidence: [],
  progressNote: "Awaiting fixture check",
});
await writeFile(paths.backlog, JSON.stringify(fixture));
const report = {
  createdAt: new Date().toISOString(),
  scope:
    "Synthetic backlog in isolated artifact folder; no learner data or real completion states changed by this verifier",
  status: "running",
  cases: [],
};
const pass = (name) => {
  report.cases.push({ name, status: "passed" });
  console.log("Passed: " + name);
};
const buildRoadmap = async (_paths, check = false) =>
  execFileSync(
    "bun",
    [
      "scripts/roadmap/fixture-server.ts",
      output,
      ...(check ? ["--check"] : []),
    ],
    { cwd: root, encoding: "utf8" },
  );
let service, browser;
try {
  await buildRoadmap(paths);
  await buildRoadmap(paths, true);
  pass("reproducible-generation");
  service = spawn(
    "bun",
    ["scripts/roadmap/fixture-server.ts", output, "--serve"],
    { cwd: root, windowsHide: true, stdio: "ignore" },
  );
  let port;
  for (let count = 0; count < 50; count++) {
    try {
      port = await readFile(resolve(output, "port.txt"), "utf8");
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert(port, "Fixture server started");
  const base = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.locator(".task")).toHaveCount(fixture.tasks.length);
  await page.locator("#status").selectOption("verified");
  await expect(page.locator(".task")).toHaveCount(
    fixture.tasks.filter((t) => t.status === "verified").length,
  );
  assert.equal(
    await page.locator(".task:not([data-status=verified])").count(),
    0,
  );
  pass("verified-filter-does-not-include-partial-work");
  await page.locator("#status").selectOption("all");
  await page.locator("#search").fill("Synthetic progress update");
  await expect(page.locator(".task")).toHaveCount(1);
  await page.locator("#task-TEST summary").first().click();
  fixture.tasks.at(-1).status = "verified";
  fixture.tasks.at(-1).progressNote = "Synthetic verification passed";
  fixture.tasks.at(-1).evidence = ["fixture-only"];
  await writeFile(paths.backlog, JSON.stringify(fixture));
  await expect(page.locator("#task-TEST")).toHaveAttribute(
    "data-status",
    "verified",
    { timeout: 12000 },
  );
  assert.equal(
    await page.locator("#search").inputValue(),
    "Synthetic progress update",
  );
  assert(await page.locator("#task-TEST").evaluate((node) => node.open));
  const bg = await page
    .locator("#task-TEST")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  assert.equal(bg, "rgb(238, 248, 240)");
  await expect(page.locator("#history .change")).toHaveCount(1);
  pass("automatic-green-update-preserves-filter-and-open-task");
  fixture.tasks.at(-1).status = "in_progress";
  fixture.tasks.at(-1).progressNote = "Synthetic regression reopened";
  await writeFile(paths.backlog, JSON.stringify(fixture));
  await expect(page.locator("#task-TEST")).toHaveAttribute(
    "data-status",
    "in_progress",
    { timeout: 12000 },
  );
  await expect(page.locator("#history .change")).toHaveCount(2);
  pass("regression-removes-green-and-keeps-history");
  await writeFile(paths.backlog, '{"broken":');
  await expect(page.locator("#error")).toBeVisible({ timeout: 12000 });
  await expect(page.locator("#task-TEST")).toBeVisible();
  pass("malformed-backlog-retains-last-good-view");
  fixture.tasks.at(-1).title =
    '</script><img src=x onerror="window.injected=true"> $&';
  await writeFile(paths.backlog, JSON.stringify(fixture));
  await expect(page.locator("#error")).toBeHidden({ timeout: 12000 });
  await page.locator("#search").fill("");
  await expect(page.locator("#task-TEST .task-name")).toContainText(
    "</script>",
  );
  assert.equal(await page.evaluate(() => window.injected), undefined);
  assert.equal(await page.locator("#task-TEST img").count(), 0);
  pass("embedded-and-rendered-data-escaped");
  assert.equal(
    (await fetch(base + "/snapshot", { method: "POST" })).status,
    405,
  );
  assert.equal(
    (
      await fetch(
        base + "/docs/language-automaticity-implementation-backlog.json",
      )
    ).status,
    404,
  );
  pass("read-only-local-viewer-no-workspace-file-serving");
  await page.locator("#task-C04 summary").first().click();
  await page.locator("#task-C04 button[data-task=C02]").click();
  assert(await page.locator("#task-C02").evaluate((node) => node.open));
  pass("dependency-navigation");
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: resolve(output, "mobile.png"),
    fullPage: true,
  });
  pass("mobile-reflow");
  await context.close();
  const offline = await browser.newContext();
  const file = await offline.newPage();
  await file.goto(pathToFileURL(paths.output).href);
  await expect(file.locator(".task")).toHaveCount(fixture.tasks.length);
  await expect(file.locator("#connection")).toHaveText("Offline HTML snapshot");
  pass("standalone-file-open");
  await file.locator("#search").focus();
  await file.keyboard.type("C04");
  await expect(file.locator("#task-C04")).toBeVisible();
  pass("keyboard-search");
  const stale = structuredClone(fixture);
  stale.tasks.at(-1).status = "nonsense";
  await writeFile(paths.backlog, JSON.stringify(stale));
  const before = await readFile(paths.output, "utf8");
  await assert.rejects(() => buildRoadmap(paths), /Invalid roadmap task/);
  assert.equal(await readFile(paths.output, "utf8"), before);
  pass("invalid-status-cannot-overwrite-html");
  await writeFile(paths.backlog, JSON.stringify(fixture));
  await buildRoadmap(paths);
  await buildRoadmap(paths, true);
  await assert.rejects(async () => {
    fixture.tasks.at(-1).status = "verified";
    fixture.tasks.at(-1).evidence = [];
    await writeFile(paths.backlog, JSON.stringify(fixture));
    await buildRoadmap(paths);
  }, /Verified task needs evidence/);
  pass("green-needs-evidence-reference");
  for (const field of ["remainingEngineeringWork", "afterHumanValidation"]) {
    fixture.tasks.at(-1).evidence = ["synthetic-test-evidence"];
    fixture.tasks.at(-1)[field] = [
      "Unfinished work must prevent full verification",
    ];
    await writeFile(paths.backlog, JSON.stringify(fixture));
    await assert.rejects(() => buildRoadmap(paths), /Invalid remaining work/);
    assert.equal(await readFile(paths.output, "utf8"), before);
    delete fixture.tasks.at(-1)[field];
  }
  pass("open-implementation-and-follow-up-prevent-full-verification");
  assert.deepEqual(errors, []);
  pass("no-browser-page-errors");
  if (process.argv.includes("--live")) {
    const live = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      actual = await live.newPage();
    const response = await actual.goto("http://127.0.0.1:3317");
    assert.equal(response.status(), 200);
    const source = await readFile(
      resolve(root, "docs/language-automaticity-implementation-backlog.json"),
      "utf8",
    );
    const liveData = await (
      await actual.request.get("http://127.0.0.1:3317/snapshot")
    ).json();
    assert.equal(
      liveData.sourceSha256,
      createHash("sha256").update(source).digest("hex"),
    );
    await expect(actual.locator(".task")).toHaveCount(
      JSON.parse(source).tasks.length,
    );
    await expect(actual.locator("#task-U05")).toHaveAttribute(
      "data-status",
      "verified",
    );
    await expect(actual.locator("#task-C04")).toHaveAttribute(
      "data-status",
      "implemented",
    );
    await expect(actual.locator("#task-C04 .pill.good")).toContainText(
      "Engineering checks passed",
    );
    await actual.screenshot({ path: resolve(output, "live-desktop.png") });
    await actual.setViewportSize({ width: 390, height: 844 });
    assert(
      await actual.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await actual.screenshot({ path: resolve(output, "live-mobile.png") });
    await live.close();
    pass("actual-local-viewer-matches-backlog-and-green-states");
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  service?.kill();
  await browser?.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      status: report.status,
      cases: report.cases.length,
      output,
    }),
  );
}
