import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import {
  parseReviewLedger,
  sha256,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import {
  prepareCurriculumReviewImport,
  applyCurriculumReviews,
} from "./lib/reviewed-curriculum";
import {
  commitReviewOutputs,
  type ReviewOutput,
} from "./lib/review-output-transaction";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
import { canonicalReviewOutputs } from "./lib/assessment-readiness";
const root = resolve(import.meta.dir, ".."),
  input = Bun.argv[2];
if (!input)
  throw Error(
    "Pass a completed review bundle. This command stages validated output; it does not create human judgments or overwrite the installed apps.",
  );
const source = await readFile(resolve(root, input), "utf8");
if (source.length > 30_000_000) throw Error("Review bundle is too large");
const now = new Date().toISOString(),
  folder = `artifacts/curriculum-review-import/${now.replace(/[:.]/g, "-")}`;
const runtime = await loadRepresentativeRuntime(root),
  packs = new Map(runtime.packs.map((pack) => [pack.language, pack]));
const approvalSources = new Map<string, string>();
for (const path of Object.keys(runtime.packHashes)) {
  const target = path.replace("curriculum-", "review-approvals-");
  approvalSources.set(target, await readFile(resolve(root, target), "utf8"));
}
const coverageSource = await readFile(
    resolve(root, "docs/automaticity-coverage.json"),
    "utf8",
  ),
  ledgerSource = await readFile(
    resolve(root, "docs/automaticity-release-reviews.json"),
    "utf8",
  );
const coverage = JSON.parse(coverageSource) as {
  cells: CoverageCell[];
  summary: Record<string, number>;
};
const ledger = JSON.parse(ledgerSource);
const backlogPath = "docs/automaticity-coverage-backlog.json",
  backlogSource = await readFile(resolve(root, backlogPath), "utf8");
const prepared = prepareCurriculumReviewImport(
  JSON.parse(source),
  packs,
  coverage.cells,
  parseReviewLedger(ledger),
  folder,
  now,
);
await mkdir(resolve(root, folder));
const report = {
  at: now,
  status: "validating",
  inputSha256: sha256(source),
  addedCells: prepared.addedCells,
  installed: false,
  outputs: [] as unknown[],
  error: null as string | null,
};
try {
  for (const file of prepared.files) {
    await mkdir(dirname(resolve(root, file.path)), { recursive: true });
    await writeFile(resolve(root, file.path), file.contents, { flag: "wx" });
  }
  const applied = await applyCurriculumReviews(
    root,
    packs,
    coverage.cells,
    prepared.reviews,
    now,
  );
  for (const [lang, pack] of applied.packs) {
    await writeFile(
      resolve(root, folder, `curriculum-${lang}.json`),
      JSON.stringify(pack) + "\n",
      { flag: "wx" },
    );
    await writeFile(
      resolve(root, folder, `review-approvals-${lang}.json`),
      JSON.stringify(
        buildHumanReviewManifest(pack, prepared.reviews),
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
  }
  await writeFile(
    resolve(root, folder, "reviews.json"),
    JSON.stringify({ ...ledger, reviews: prepared.reviews }, null, 2) + "\n",
    { flag: "wx" },
  );
  await writeFile(
    resolve(root, folder, "coverage.json"),
    JSON.stringify(
      {
        ...coverage,
        cells: applied.cells,
        summary: {
          ...coverage.summary,
          reviewed: applied.reviewedCells,
          releaseEligible: applied.evaluatorApprovedCells,
        },
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  report.status = "validated_staging_only";
  if (Bun.argv.includes("--apply")) {
    const outputs: ReviewOutput[] = [
      {
        path: "docs/automaticity-release-reviews.json",
        expectedSha256: sha256(ledgerSource),
        contents: await readFile(resolve(root, folder, "reviews.json"), "utf8"),
      },
      {
        path: "docs/automaticity-coverage.json",
        expectedSha256: sha256(coverageSource),
        contents: await readFile(
          resolve(root, folder, "coverage.json"),
          "utf8",
        ),
      },
    ];
    for (const path of Object.keys(runtime.packHashes)) {
      const lang = path.endsWith("-en.json") ? "en" : "de";
      outputs.push({
        path,
        expectedSha256: runtime.packHashes[path]!,
        contents: await readFile(
          resolve(root, folder, `curriculum-${lang}.json`),
          "utf8",
        ),
      });
      const approvalPath = path.replace("curriculum-", "review-approvals-");
      outputs.push({
        path: approvalPath,
        expectedSha256: sha256(approvalSources.get(approvalPath)!),
        contents: await readFile(
          resolve(root, folder, `review-approvals-${lang}.json`),
          "utf8",
        ),
      });
    }
    const oldBacklog = JSON.parse(backlogSource) as Record<string, unknown>[];
    for (const pack of applied.packs.values())
      outputs.push(
        ...(await canonicalReviewOutputs(
          root,
          pack,
          buildHumanReviewManifest(pack, prepared.reviews),
        )),
      );
    outputs.push({
      path: backlogPath,
      expectedSha256: sha256(backlogSource),
      contents:
        JSON.stringify(
          oldBacklog.map((row) => ({
            ...row,
            ...applied.cells.find(
              (cell) =>
                cell.language === row.language &&
                cell.constructionId === row.constructionId &&
                cell.stage === row.stage &&
                cell.modality === row.modality,
            ),
          })),
          null,
          2,
        ) + "\n",
    });
    report.outputs = await commitReviewOutputs(root, folder, outputs);
    report.status = "applied_to_source_installation_pending";
  }
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(root, folder, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ folder, ...report }));
