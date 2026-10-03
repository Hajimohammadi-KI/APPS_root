import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const output = resolve(root, `artifacts/automaticity-coverage-gates/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const original = JSON.parse(await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"));
const report = { createdAt: new Date().toISOString(), status: "running", cases: [] };
try {
  execFileSync("bun", ["scripts/check-automaticity-coverage.ts"], { cwd: root, stdio: "pipe" });
  const release = spawnSync("bun", ["scripts/check-automaticity-coverage.ts", "--release"], { cwd: root, encoding: "utf8" });
  assert.equal(release.status, 2); report.cases.push({ name: "authored-is-not-reviewed-release", passed: true });
  for (const [name, change, expected] of [
    ["stale-content", row => { row.contentVersion = "previous-content-version"; }, /Stale coverage version/],
    ["unsupported-review", row => { row.humanReview = "complete"; row.releaseEligible = true; }, /review absent from the content pack/],
    ["invented-evaluator", row => { row.evaluator = "invented-approved-evaluator"; }, /Stale or invented evaluator mapping/],
  ]) {
    const fixture = structuredClone(original); change(fixture.cells[0]);
    const file = resolve(output, `${name}.json`); await writeFile(file, JSON.stringify(fixture));
    const result = spawnSync("bun", ["scripts/check-automaticity-coverage.ts", `--coverage=${file}`], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0); assert.match(result.stderr, expected);
    report.cases.push({ name, passed: true });
  }
  report.status = "passed";
} catch (error) { report.status = "failed"; report.error = String(error); throw error; }
finally { await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(`Evidence: ${output}`); }
