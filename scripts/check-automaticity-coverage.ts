import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { verifyGrammarScope } from "./lib/grammar-scope-files";
import {
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import {
  GRAMMAR_FAMILIES,
  validateCurriculum,
  activePracticeTasks,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
const root = resolve(import.meta.dir, "..");
const grammarScope = await verifyGrammarScope(root);
const coveragePath = Bun.argv
  .find((arg) => arg.startsWith("--coverage="))
  ?.slice("--coverage=".length);
const coverage = JSON.parse(
  await readFile(
    resolve(root, coveragePath ?? "docs/automaticity-coverage.json"),
    "utf8",
  ),
) as { cells: CoverageCell[] };
const ledgerPath =
  Bun.argv
    .find((arg) => arg.startsWith("--reviews="))
    ?.slice("--reviews=".length) ?? "docs/automaticity-release-reviews.json";
const reviews = parseReviewLedger(
  JSON.parse(await readFile(resolve(root, ledgerPath), "utf8")),
);
const packs = new Map<string, CurriculumPack>();
const seen = new Set<string>();
let total = 0;
for (const [language, app] of [
  ["en", "Apps/English/English-Automaticity"],
  ["de", "Apps/Deutsch-Automaticity"],
] as const) {
  const pack = JSON.parse(
    await readFile(
      resolve(
        root,
        `${app}/apps/web/public/learning-core/curriculum-${language}.json`,
      ),
      "utf8",
    ),
  ) as CurriculumPack;
  packs.set(language, pack);
  const issues = validateCurriculum(pack);
  if (issues.length) throw new Error(issues.join("\n"));
  const families = new Set(pack.units.flatMap((unit) => unit.familyIds));
  for (const [family] of GRAMMAR_FAMILIES)
    if (!families.has(family))
      throw new Error(`Unmapped ${language} grammar family ${family}`);
  for (const unit of pack.units)
    for (const stage of [
      "notice",
      "retrieve",
      "vary",
      "produce",
      "repair",
      "transfer",
      "retain",
    ])
      for (const modality of ["writing", "speaking"]) {
        const scopeCell = grammarScope.cells.find(cell=>cell.constructionId===unit.id && cell.stage===stage && cell.modality===modality);
        if (scopeCell && !scopeCell.required) {
          if (unit.tasks.some(task=>task.stage===stage && task.modality===modality)) throw new Error(`N/A target must not offer assessed ${modality} tasks: ${unit.id}`);
          continue;
        }
        const key = `${language}:${unit.id}:${stage}:${modality}`;
        if (seen.has(key)) throw new Error(`Duplicate cell ${key}`);
        seen.add(key);
        const cells = coverage.cells.filter(
          (cell) =>
            cell.language === language &&
            cell.constructionId === unit.id &&
            cell.stage === stage &&
            cell.modality === modality,
        );
        if (cells.length !== 1)
          throw new Error(`Missing/duplicate coverage cell ${key}`);
        if (
          cells[0]!.contentVersion !== pack.version ||
          cells[0]!.mappingVersion !== pack.mappingVersion
        )
          throw new Error(`Stale coverage version ${key}`);
        if (
          (cells[0]!.humanReview === "complete" || cells[0]!.releaseEligible) &&
          (unit.review !== "human_reviewed" ||
            activePracticeTasks(unit).some(
              (task) =>
                task.stage === stage &&
                task.modality === modality &&
                task.contentReview !== "human_reviewed",
            ))
        )
          throw new Error(
            `Coverage claims review absent from the content pack: ${key}`,
          );
        const actual = activePracticeTasks(unit)
          .filter((task) => task.stage === stage && task.modality === modality)
          .map((task) => task.id)
          .sort();
        if (
          !actual.length ||
          JSON.stringify(actual) !==
            JSON.stringify([...cells[0]!.taskIds].sort())
        )
          throw new Error(`Missing or stale tasks ${key}`);
        total++;
      }
}
if (total !== coverage.cells.length)
  throw new Error("Coverage contains orphan cells");
const reviewedEvidence = await validateReleaseReviews(
  root,
  coverage.cells,
  packs,
  reviews,
);
const blocked = coverage.cells.filter(
  (cell) => cell.humanReview !== "complete" || !cell.releaseEligible,
);
const missingScopeCells = grammarScope.summary.missingTaskCells;
const releaseBlocked = blocked.length > 0 || missingScopeCells > 0;
console.log(
  JSON.stringify(
    {
      structuralCoverage: "verified",
      expandedGrammarScope: grammarScope.summary,
      cells: total,
      ...reviewedEvidence,
      fullCurriculumRelease: releaseBlocked
        ? "not_qualified"
        : "eligible_for_review",
      unqualifiedCells: blocked.length,
      missingExpandedScopeCells: missingScopeCells,
      totalUnqualifiedRequiredCells: blocked.length + missingScopeCells,
    },
    null,
    2,
  ),
);
if (Bun.argv.includes("--release") && releaseBlocked) process.exitCode = 2;
