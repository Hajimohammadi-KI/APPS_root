import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isRecord } from "../../shared/learning-core/src/automaticity/contracts";
import {
  activePracticeTasks,
  GRAMMAR_FAMILIES,
  validateCurriculum,
  type CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import {
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./automaticity-release-reviews";
import {
  PACK_PATHS,
  SCOPE_INPUTS,
  SCOPE_OUTPUT,
  verifyGrammarScope,
} from "./grammar-scope-files";

/** Missing files are a known prerequisite failure; unreadable or corrupt files remain errors. */
export async function missingGrammarScopeFiles(
  root: string,
): Promise<string[]> {
  const absent: string[] = [];
  for (const file of [...SCOPE_INPUTS, SCOPE_OUTPUT]) {
    try {
      await access(resolve(root, file));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      absent.push(file);
    }
  }
  return absent;
}

function parseCoverage(raw: unknown): CoverageCell[] {
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.cells) ||
    raw.cells.some(
      (cell) =>
        !isRecord(cell) ||
        ![
          "language",
          "contentVersion",
          "mappingVersion",
          "constructionId",
          "stage",
          "modality",
          "humanReview",
          "evaluator",
        ].every((key) => typeof cell[key] === "string" && !!cell[key].trim()) ||
        !Array.isArray(cell.taskIds) ||
        cell.taskIds.some((id) => typeof id !== "string" || !id.trim()) ||
        typeof cell.releaseEligible !== "boolean",
    )
  )
    throw Error("Invalid installed coverage document");
  return raw.cells as CoverageCell[];
}
const cellKey = (
  cell: Pick<
    CoverageCell,
    "language" | "constructionId" | "stage" | "modality"
  >,
) => `${cell.language}:${cell.constructionId}:${cell.stage}:${cell.modality}`;

/** Verifies shipped active tasks and recorded evidence, never reconstructs absent scope or grants approvals. */
export async function auditInstalledCoverage(
  root: string,
  options: {
    installedOnly?: boolean;
    release?: boolean;
    coveragePath?: string;
    reviewsPath?: string;
  } = {},
) {
  const missing = await missingGrammarScopeFiles(root);
  for (const file of [...SCOPE_INPUTS, SCOPE_OUTPUT])
    if (file.endsWith(".json") && !missing.includes(file))
      JSON.parse(
        (await readFile(resolve(root, file), "utf8")).replace(/^\uFEFF/, ""),
      );
  // Even installed-only mode must not hide existing, corrupt scope sources.
  const scope = missing.length ? null : await verifyGrammarScope(root);
  const cells = parseCoverage(
    JSON.parse(
      await readFile(
        resolve(
          root,
          options.coveragePath ?? "docs/automaticity-coverage.json",
        ),
        "utf8",
      ),
    ),
  );
  const reviews = parseReviewLedger(
    JSON.parse(
      await readFile(
        resolve(
          root,
          options.reviewsPath ?? "docs/automaticity-release-reviews.json",
        ),
        "utf8",
      ),
    ),
  );
  const packs = new Map<string, CurriculumPack>();
  const indexed = new Map<string, CoverageCell[]>();
  for (const cell of cells) {
    const key = cellKey(cell);
    indexed.set(key, [...(indexed.get(key) ?? []), cell]);
  }
  const seen = new Set<string>();
  for (const [index, language] of (["en", "de"] as const).entries()) {
    const pack = JSON.parse(
      await readFile(resolve(root, PACK_PATHS[index]!), "utf8"),
    ) as CurriculumPack;
    if (pack.language !== language)
      throw Error(`Wrong installed pack language ${language}`);
    const issues = validateCurriculum(pack);
    if (issues.length) throw Error(issues.join("\n"));
    packs.set(language, pack);
    const families = new Set(pack.units.flatMap((unit) => unit.familyIds));
    for (const [family] of GRAMMAR_FAMILIES)
      if (!families.has(family))
        throw Error(`Unmapped ${language} grammar family ${family}`);
    for (const unit of pack.units) {
      const active = activePracticeTasks(unit);
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
          const actual = active.filter(
            (task) => task.stage === stage && task.modality === modality,
          );
          const scopeCell = scope?.cells.find(
            (cell) =>
              cell.constructionId === unit.id &&
              cell.stage === stage &&
              cell.modality === modality,
          );
          if (scopeCell && !scopeCell.required) {
            if (actual.length)
              throw Error(
                `N/A target must not offer assessed ${modality} tasks: ${unit.id}`,
              );
            continue;
          }
          // Installed-only checks what is shipped, not hypothetical missing curriculum cells.
          if (!actual.length && (options.installedOnly || !scope)) continue;
          const key = cellKey({
            language,
            constructionId: unit.id,
            stage,
            modality,
          });
          if (seen.has(key)) throw Error(`Duplicate cell ${key}`);
          seen.add(key);
          const matching = indexed.get(key) ?? [];
          if (matching.length !== 1)
            throw Error(`Missing/duplicate coverage cell ${key}`);
          const cell = matching[0]!;
          if (
            cell.contentVersion !== pack.version ||
            cell.mappingVersion !== pack.mappingVersion
          )
            throw Error(`Stale coverage version ${key}`);
          if (
            (cell.humanReview === "complete" || cell.releaseEligible) &&
            (unit.review !== "human_reviewed" ||
              actual.some((task) => task.contentReview !== "human_reviewed"))
          )
            throw Error(
              `Coverage claims review absent from the content pack: ${key}`,
            );
          if (
            !actual.length ||
            JSON.stringify(actual.map((task) => task.id).sort()) !==
              JSON.stringify([...cell.taskIds].sort())
          )
            throw Error(`Missing or stale tasks ${key}`);
        }
    }
  }
  if (seen.size !== cells.length) throw Error("Coverage contains orphan cells");
  const reviewed = await validateReleaseReviews(root, cells, packs, reviews);
  const blocked = cells.filter(
    (cell) => cell.humanReview !== "complete" || !cell.releaseEligible,
  );
  const missingScopeCells = scope?.summary.missingTaskCells ?? null;
  const releaseBlocked = !scope || blocked.length > 0 || missingScopeCells! > 0;
  return {
    exitCode:
      (!options.installedOnly && !scope) || (options.release && releaseBlocked)
        ? 2
        : 0,
    report: {
      structuralCoverage: "verified" as const,
      coverageScope:
        options.installedOnly || !scope
          ? "installed_active_tasks"
          : "expanded_grammar_scope",
      expandedGrammarScope: scope?.summary ?? "unavailable",
      missingGrammarScopeFiles: missing,
      cells: seen.size,
      ...reviewed,
      fullCurriculumRelease: releaseBlocked
        ? "not_qualified"
        : "eligible_for_review",
      unqualifiedCells: blocked.length,
      missingExpandedScopeCells: missingScopeCells,
      totalUnqualifiedRequiredCells:
        missingScopeCells === null ? null : blocked.length + missingScopeCells,
    },
  };
}
