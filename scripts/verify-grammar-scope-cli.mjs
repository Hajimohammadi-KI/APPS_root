import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  output = resolve(
    root,
    `artifacts/grammar-scope-cli/${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
await mkdir(output, { recursive: true });
const report = {
  createdAt: new Date().toISOString(),
  status: "running",
  cases: [],
};
const digest = async (path) =>
  createHash("sha256")
    .update(await readFile(resolve(root, path)))
    .digest("hex");
const protectedPaths = [
  "Apps/English/English-Automaticity/apps/web/public/learning-core/curriculum-en.json",
  "Apps/Deutsch-Automaticity/apps/web/public/learning-core/curriculum-de.json",
  "docs/automaticity-release-reviews.json",
  "docs/automaticity-coverage.json",
  "docs/automaticity-coverage-backlog.json",
];
const before = await Promise.all(protectedPaths.map(digest));
try {
  const scope = JSON.parse(
    await readFile(resolve(root, "docs/grammar-scope/inventory.json"), "utf8"),
  );
  const reserved = {
    ...scope.partitions[0],
    id: "synthetic-held-out-duplicate",
    partition: "evaluation",
    exposed: false,
  };
  const fixture = resolve(output, "synthetic-protected-material.json");
  await writeFile(
    fixture,
    JSON.stringify({ schemaVersion: 1, items: [reserved] }),
  );
  const guarded = spawnSync(
    "bun",
    [
      "scripts/build-automaticity-curriculum.ts",
      `--protected-material=${fixture}`,
    ],
    { cwd: root, encoding: "utf8" },
  );
  await writeFile(
    resolve(output, "protected-generator.log"),
    guarded.stdout + guarded.stderr,
  );
  assert.notEqual(guarded.status, 0);
  assert.match(guarded.stderr, /Leaked evaluation families/);
  assert.deepEqual(await Promise.all(protectedPaths.map(digest)), before);
  report.cases.push({
    name: "real-generator-rejects-held-out-overlap-before-writing",
    passed: true,
  });
  for (const [name, args, expected] of [
    ["generated-scope-fresh", ["scripts/build-grammar-scope.ts", "--check"], 0],
    [
      "scope-alone-cannot-qualify-release",
      ["scripts/build-grammar-scope.ts", "--check", "--release"],
      2,
    ],
    ["combined-coverage-gate", ["scripts/check-automaticity-coverage.ts"], 0],
    [
      "combined-release-remains-blocked",
      ["scripts/check-automaticity-coverage.ts", "--release"],
      2,
    ],
  ]) {
    const result = spawnSync("bun", args, { cwd: root, encoding: "utf8" });
    await writeFile(
      resolve(output, `${name}.log`),
      result.stdout + result.stderr,
    );
    assert.equal(result.status, expected, result.stderr);
    const parsed = JSON.parse(result.stdout);
    if (name.startsWith("combined")) {
      assert.equal(parsed.missingExpandedScopeCells, 0);
      assert.equal(parsed.totalUnqualifiedRequiredCells, 3906);
      assert.equal(parsed.fullCurriculumRelease, "not_qualified");
    }
    report.cases.push({ name, exitCode: result.status, passed: true });
  }
  assert.deepEqual(await Promise.all(protectedPaths.map(digest)), before);
  report.cases.push({
    name: "curriculum-and-real-review-ledger-unchanged",
    passed: true,
  });
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ output, ...report }, null, 2));
}
