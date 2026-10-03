import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const filesOnly = process.argv.includes("--files-only");
const directory = resolve(
  root,
  process.argv[2] ?? "artifacts/content-review-packets/all-20260905-task-revision2",
);
const output = resolve(
  root,
  `artifacts/content-review-packet-check/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const manifest = await json(resolve(directory, "manifest.json"));
const coverage = await json(resolve(root, "docs/automaticity-coverage.json"));
const ledgerBefore = await readFile(
  resolve(root, "docs/automaticity-release-reviews.json"),
);
const packs = new Map();
for (const [lang, app] of [
  ["en", "Apps/English/English-Automaticity"],
  ["de", "Apps/Deutsch-Automaticity"],
])
  packs.set(
    lang,
    await json(
      resolve(
        root,
        app,
        `apps/web/public/learning-core/curriculum-${lang}.json`,
      ),
    ),
  );
const report = {
  at: new Date().toISOString(),
  status: "running",
  scope:
    filesOnly
      ? "Generated packet files only; browser not run; no human judgments, app or learner data changes"
      : "Actual generated packets and isolated browser; no human judgments, app or learner data changes",
  directory: relative(root, directory),
  cases: [],
};
let browser;
try {
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.status, "awaiting_actual_human_review");
  assert.equal(
    manifest.packets.length,
    [...packs.values()].reduce((n, pack) => n + pack.units.length, 0),
  );
  const seen = new Set();
  let taskCount = 0,
    cellCount = 0;
  for (const row of manifest.packets) {
    const bytes = await readFile(resolve(directory, row.path));
    assert.equal(hash(bytes), row.sha256);
    const packet = JSON.parse(bytes.toString("utf8")),
      pack = packs.get(row.language),
      unit = pack.units.find((unit) => unit.id === row.constructionId);
    assert(unit);
    assert(!seen.has(unit.id));
    seen.add(unit.id);
    assert.deepEqual(packet.content, unit);
    assert.equal(row.contentVersion, pack.version);
    assert.equal(row.mappingVersion, pack.mappingVersion);
    const cells = coverage.cells.filter(
      (cell) =>
        cell.language === row.language && cell.constructionId === unit.id,
    );
    assert.equal(packet.reviewDrafts.length, cells.length);
    assert.equal(row.cells, cells.length);
    const activeTaskIds = new Set(cells.flatMap(cell => cell.taskIds));
    assert.equal(row.tasks, activeTaskIds.size);
    assert.equal(row.archivedTasks, unit.retiredTasks?.length ?? 0);
    assert.equal(activeTaskIds.size + row.archivedTasks, unit.tasks.length);
    for(const retired of unit.retiredTasks ?? []) assert(!activeTaskIds.has(retired.taskId));
    const matched = new Set();
    for (const draft of packet.reviewDrafts) {
      const cell = cells.find(
        (cell) =>
          cell.stage === draft.stage && cell.modality === draft.modality,
      );
      assert(cell);
      const key = `${draft.stage}:${draft.modality}`;
      assert(!matched.has(key));
      matched.add(key);
      assert.deepEqual(draft.evaluators, []);
      assert.equal(draft.contentReview.decision, null);
      assert.equal(draft.contentReview.reviewerId, null);
      for (const evidence of [
        draft.contentEvidenceDraft,
        draft.manualEvaluatorEvidenceDraft,
      ]) {
        assert.equal(evidence.provenance, null);
        assert.equal(evidence.decision, null);
        assert.equal(evidence.reviewerId, null);
        assert.deepEqual(
          evidence.taskReviews.map((row) => row.taskId).sort(),
          [...cell.taskIds].sort(),
        );
        for (const judgment of evidence.taskReviews) {
          const task = unit.tasks.find((task) => task.id === judgment.taskId);
          assert(task);
          assert.equal(judgment.taskVersion, task.version);
          assert.equal(judgment.rubricVersion, task.rubricVersion);
          assert(
            Object.values(judgment.checks).every((value) => value === null),
          );
          assert.equal(judgment.note, "");
        }
      }
    }
    taskCount += activeTaskIds.size;
    cellCount += cells.length;
  }
  assert.equal(cellCount, coverage.cells.length);
  console.log(`Verified ${seen.size} packets, ${cellCount} cells and ${taskCount} tasks.`);
  report.cases.push(
    "Every canonical construction, required cell and task has an exact hash-pinned blank review packet",
  );
  const before = await readFile(resolve(directory, "manifest.json"));
  const rerun = spawnSync(
    "bun",
    ["scripts/prepare-automaticity-content-review.ts", "--all", directory],
    { cwd: root, encoding: "utf8", timeout: 15000 },
  );
  assert.equal(rerun.error, undefined);
  assert.notEqual(rerun.status, 0);
  assert.match(rerun.stderr, /EEXIST/);
  assert.deepEqual(await readFile(resolve(directory, "manifest.json")), before);
  for (const row of manifest.packets)
    assert.equal(
      hash(await readFile(resolve(directory, row.path))),
      row.sha256,
    );
  report.cases.push(
    "Regeneration refuses an existing review directory and preserves every packet",
  );
  if (!filesOnly) {
  const require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
  const { chromium, expect } = require("@playwright/test");
  console.log("Existing review files are preserved. Checking the browser index.");
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
      viewport: { width: 1100, height: 850 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(directory, "index.html")).href);
  await expect(
    page.getByRole("heading", { name: "Grammar content review", exact: true }),
  ).toBeVisible();
  await expect(page.locator("article:visible")).toHaveCount(
    manifest.packets.length,
  );
  await page.getByRole("searchbox").fill("German");
  await expect(page.locator("article:visible")).toHaveCount(
    packs.get("de").units.length,
  );
  await page.getByRole("searchbox").fill("G08");
  await expect(page.locator("article:visible")).toHaveCount(
    manifest.packets.filter((row) => row.familyIds.includes("G08")).length,
  );
  await page.getByRole("searchbox").fill("en.c.001");
  await expect(page.locator("article:visible")).toHaveCount(1);
  await expect(page.locator("article:visible a")).toHaveAttribute(
    "href",
    "en.c.001.json",
  );
  await page.getByRole("searchbox").fill("no matching construction");
  await expect(page.locator("article:visible")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("0 constructions");
  await page.getByRole("searchbox").fill("German");
  await page.screenshot({ path: resolve(output, "german-review-index.png") });
  assert.deepEqual(errors, []);
  report.cases.push(
    "Browser index renders, filters by language/family/construction and handles no results",
  );
  }
  assert.deepEqual(
    await readFile(resolve(root, "docs/automaticity-release-reviews.json")),
    ledgerBefore,
  );
  assert.equal(JSON.parse(ledgerBefore.toString("utf8")).reviews.length, 0);
  report.cases.push("No actual content or evaluator approval was created");
  Object.assign(report, {
    status: "passed",
    constructions: seen.size,
    cells: cellCount,
    tasks: taskCount,
  });
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await browser?.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: report.status,
      output,
      cases: report.cases.length,
    }),
  );
}
