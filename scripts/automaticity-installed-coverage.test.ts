import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { SCOPE_INPUTS, SCOPE_OUTPUT } from "./lib/grammar-scope-files";
import {
  auditInstalledCoverage,
  missingGrammarScopeFiles,
} from "./lib/installed-coverage";

const root = resolve(import.meta.dir, "..");
let temp: string;
let coverage: { cells: Record<string, unknown>[] };
beforeAll(async () => {
  temp = await mkdtemp(join(tmpdir(), "installed-coverage-"));
  coverage = JSON.parse(
    await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
  );
});
afterAll(async () => {
  if (temp) await rm(temp, { recursive: true, force: true });
});
function run(...args: string[]) {
  const result = Bun.spawnSync(
    [process.execPath, "scripts/check-automaticity-coverage.ts", ...args],
    { cwd: root },
  );
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}
test("installed-only verifies real active coverage without inventing human approval", () => {
  const result = run("--installed-only");
  expect(result.exitCode).toBe(0);
  const report = JSON.parse(result.stdout);
  expect(report.structuralCoverage).toBe("verified");
  expect(report.expandedGrammarScope).toBe("unavailable");
  expect(report.missingGrammarScopeFiles).toEqual([
    ...SCOPE_INPUTS,
    SCOPE_OUTPUT,
  ]);
  expect(report.cells).toBe(coverage.cells.length);
  expect(report.reviewedCells).toBe(0);
  expect(report.evaluatorApprovedCells).toBe(0);
  expect(report.fullCurriculumRelease).toBe("not_qualified");
});
test("full mode reports all missing prerequisites and cannot qualify release", () => {
  for (const args of [[], ["--release"], ["--installed-only", "--release"]]) {
    const result = run(...args);
    expect(result.exitCode).toBe(2);
    const report = JSON.parse(result.stdout);
    expect(report.missingGrammarScopeFiles).toEqual([
      ...SCOPE_INPUTS,
      SCOPE_OUTPUT,
    ]);
    expect(report.fullCurriculumRelease).toBe("not_qualified");
  }
});
test.each(["version", "tasks", "orphan", "duplicate", "review"])(
  "installed mode rejects %s coverage corruption",
  async (kind) => {
    const changed = structuredClone(coverage);
    if (kind === "version") changed.cells[0]!.contentVersion = "stale";
    if (kind === "tasks") changed.cells[0]!.taskIds = [];
    if (kind === "orphan")
      changed.cells.push({
        ...changed.cells[0],
        constructionId: "en.c.missing",
      });
    if (kind === "duplicate")
      changed.cells.push(structuredClone(changed.cells[0]!));
    if (kind === "review") changed.cells[0]!.humanReview = "complete";
    const path = join(temp, `${kind}.json`);
    await writeFile(path, JSON.stringify(changed));
    const result = run("--installed-only", `--coverage=${path}`);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toContain("ENOENT");
    expect(result.stderr).toMatch(
      /Stale coverage|Missing or stale|orphan cells|Duplicate|claims review absent|Missing\/duplicate/u,
    );
    await expect(
      auditInstalledCoverage(root, { installedOnly: true, coveragePath: path }),
    ).rejects.toThrow();
  },
);
test("partial or complete corrupt scope sources are errors even in installed-only mode", async () => {
  const fixture = join(temp, "scope-fixture");
  expect(await missingGrammarScopeFiles(fixture)).toEqual([
    ...SCOPE_INPUTS,
    SCOPE_OUTPUT,
  ]);
  const reference = join(fixture, "docs/grammar-scope/references.json");
  await mkdir(dirname(reference), { recursive: true });
  await writeFile(reference, "{");
  await expect(
    auditInstalledCoverage(fixture, { installedOnly: true }),
  ).rejects.toThrow(/JSON|Parse/u);
  for (const path of [...SCOPE_INPUTS, SCOPE_OUTPUT]) {
    const file = join(fixture, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, "{}");
  }
  await writeFile(
    reference,
    JSON.stringify({ reviewer: { kind: "human", humanReview: true } }),
  );
  expect(await missingGrammarScopeFiles(fixture)).toEqual([]);
  await expect(
    auditInstalledCoverage(fixture, { installedOnly: true }),
  ).rejects.toThrow("Unsubstantiated reference review claim");
});
test("direct installed audit reports its limited scope and never enables full release", async () => {
  const result = await auditInstalledCoverage(root, { installedOnly: true });
  expect(result.report.coverageScope).toBe("installed_active_tasks");
  expect(result.report.missingExpandedScopeCells).toBeNull();
  expect(result.report.totalUnqualifiedRequiredCells).toBeNull();
  expect(result.report.fullCurriculumRelease).toBe("not_qualified");
  expect(result.report.reviewedCells).toBe(0);
  expect(result.report.evaluatorApprovedCells).toBe(0);
});
test("malformed coverage and invalid review ledger never fall back to unavailable", async () => {
  const malformed = join(temp, "malformed.json");
  await writeFile(malformed, "{");
  const invalidLedger = join(temp, "ledger.json");
  await writeFile(
    invalidLedger,
    JSON.stringify({ schemaVersion: 1, reviews: [{ id: "forged" }] }),
  );
  for (const flag of [
    `--coverage=${malformed}`,
    `--reviews=${invalidLedger}`,
  ]) {
    const result = run("--installed-only", flag);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toContain("ENOENT");
    expect(result.stdout).not.toContain('"structuralCoverage": "verified"');
  }
});
