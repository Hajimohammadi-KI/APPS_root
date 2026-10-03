import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildInventory,
  buildCoverage,
  hash,
  lesson,
  rows,
  specification,
  taskType,
  TASK_TYPES,
  validateTransformation,
  validateGeneratedPractice,
  type PartitionItem,
  type Transformation,
  type ScopeInput,
  type Lesson,
  type Reference,
} from "./grammar-scope";
import type { CurriculumPack } from "../../shared/learning-core/src/automaticity/curriculum";

export const SCOPE_OUTPUT = "docs/grammar-scope/inventory.json";
export const SCOPE_INPUTS = [
  "english-specifications.psv",
  "german-specifications.psv",
  "additions.psv",
  "family-audit.psv",
  "references.json",
  "relationships.json",
  "task-policy.json",
  "transformation-examples.json",
  "protected-material.json",
  "baseline-lessons.json",
].map((path) => `docs/grammar-scope/${path}`);
export const PACK_PATHS = [
  "Apps/English/English-Automaticity/apps/web/public/learning-core/curriculum-en.json",
  "Apps/Deutsch-Automaticity/apps/web/public/learning-core/curriculum-de.json",
];
const parse = async (root: string, path: string) =>
  JSON.parse(
    (await readFile(resolve(root, path), "utf8")).replace(/^\uFEFF/, ""),
  ) as unknown;
export async function loadScopeInput(root: string): Promise<ScopeInput> {
  const read = (path: string) =>
    readFile(resolve(root, `docs/grammar-scope/${path}`), "utf8");
  const referenceFile = (await parse(
    root,
    "docs/grammar-scope/references.json",
  )) as {
    checkedOn: string;
    reviewer: { kind: string; humanReview: boolean };
    sources: Reference[];
  };
  if (
    referenceFile.reviewer.kind !== "model" ||
    referenceFile.reviewer.humanReview !== false ||
    !/^\d{4}-\d{2}-\d{2}$/.test(referenceFile.checkedOn)
  )
    throw new Error("Unsubstantiated reference review claim");
  const relationships = (await parse(
    root,
    "docs/grammar-scope/relationships.json",
  )) as { reinforcements: string[][] };
  const policy = (await parse(root, "docs/grammar-scope/task-policy.json")) as {
    types: { id: string; purpose: string; evidence: string }[];
    partitions: string[];
    humanReview: string;
  };
  if (
    JSON.stringify(policy.types.map((row) => row.id)) !==
      JSON.stringify(TASK_TYPES) ||
    policy.types.some((row) => !row.purpose.trim() || !row.evidence.trim()) ||
    JSON.stringify(policy.partitions) !==
      JSON.stringify(["teaching", "practice", "calibration", "evaluation"]) ||
    policy.humanReview !== "pending"
  )
    throw new Error("Incomplete task-type or partition policy");
  return {
    date: referenceFile.checkedOn,
    specifications: [
      ...rows(await read("english-specifications.psv"), 6),
      ...rows(await read("german-specifications.psv"), 6),
    ].map(specification),
    additions: rows(await read("additions.psv"), 9).map(
      ([id, family, title, related, ...fields]) => ({
        ...specification([id!, ...fields]),
        family: family!,
        title: title!,
        related: related!.split(",").filter(Boolean),
      }),
    ),
    familyAudit: rows(await read("family-audit.psv"), 5).map(
      ([language, family, references, decision, gaps]) => ({
        language: language!,
        family: family!,
        references: references!.split(","),
        decision: decision!,
        gaps: gaps!.split(",").filter(Boolean),
      }),
    ),
    references: referenceFile.sources,
    packs: await Promise.all(
      PACK_PATHS.map(
        async (path) => (await parse(root, path)) as CurriculumPack,
      ),
    ),
    baseline: (
      (await parse(root, "docs/grammar-scope/baseline-lessons.json")) as {
        lessons: Lesson[];
      }
    ).lessons,
    reinforcements: relationships.reinforcements,
  };
}
export async function buildScope(root: string) {
  const input = await loadScopeInput(root),
    inventory = buildInventory(input);
  const transformations = (
    (await parse(root, "docs/grammar-scope/transformation-examples.json")) as {
      examples: Transformation[];
    }
  ).examples;
  if (
    !transformations.length ||
    new Set(transformations.map((row) => row.id)).size !==
      transformations.length
  )
    throw new Error("Missing/duplicate transformation examples");
  for (const row of transformations) validateTransformation(row);
  const cells = buildCoverage(inventory, input.packs);
  const protectedItems = await readProtectedMaterial(root);
  const { items: partitions, selection } = validateGeneratedPractice(
    input.packs,
    protectedItems,
  );
  const sources = await Promise.all(
    [
      ...SCOPE_INPUTS,
      ...PACK_PATHS,
      "scripts/lib/grammar-scope.ts",
      "scripts/lib/grammar-scope-files.ts",
      "scripts/build-grammar-scope.ts",
      "scripts/build-automaticity-curriculum.ts",
    ].map(async (path) => ({
      path,
      sha256: hash(await readFile(resolve(root, path))),
    })),
  );
  const crosswalk = input.packs.flatMap((pack) =>
    pack.units.map((unit) => ({
      ...lesson(unit),
      constructions: inventory.flatMap((row) =>
        row.lessonLinks
          .filter((link) => link.id === unit.id)
          .map((link) => ({ id: row.id, relationship: link.relationship })),
      ),
    })),
  );
  return {
    schemaVersion: 1,
    version: "2026-09-05.scope.1",
    scope:
      "Mapping and authoring specification across 21 families in each language. Baseline lesson IDs are retained; missing explicit targets produce work. Source CEFR labels are unvalidated placement suggestions. No claim of finite exhaustive grammar or independent human review.",
    sources,
    references: input.references,
    familyAudit: input.familyAudit,
    inventory,
    crosswalk,
    cells,
    transformations,
    taskTypeRequirements: TASK_TYPES.map((id) => ({
      id,
      presentTasks: input.packs
        .flatMap((pack) => pack.units)
        .flatMap((unit) => unit.tasks)
        .filter((task) => taskType(task) === id).length,
      implementation:
        id === "interaction"
          ? "missing_contingent_dialogue_tasks"
          : "authoring_policy_defined",
    })),
    partitions,
    protectedItems,
    selection,
    summary: {
      baselineLessons: input.baseline.length,
      currentLessons: crosswalk.length,
      existingConstructions: inventory.filter(
        (row) => row.kind === "existing_unit",
      ).length,
      additionalTargets: inventory.filter(
        (row) => row.kind !== "existing_unit",
      ).length,
      familyAudits: input.familyAudit.length,
      cells: cells.length,
      requiredCells: cells.filter((row) => row.required).length,
      notApplicableCells: cells.filter((row) => !row.required).length,
      missingTaskCells: cells.filter((row) => row.status === "missing_tasks")
        .length,
      authoredUnqualifiedCells: cells.filter(
        (row) => row.status === "authored_unqualified",
      ).length,
      humanReviewedConstructions: 0,
      qualifiedReleaseCells: 0,
      fullCurriculumRelease: "not_qualified",
    },
  };
}

export async function readProtectedMaterial(
  root: string,
  path = "docs/grammar-scope/protected-material.json",
): Promise<PartitionItem[]> {
  const registry = (await parse(root, path)) as {
    schemaVersion: number;
    items: PartitionItem[];
  };
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.items))
    throw new Error("Invalid protected-material registry");
  return registry.items;
}
export type ScopeDocument = Awaited<ReturnType<typeof buildScope>>;
export async function verifyGrammarScope(root: string): Promise<ScopeDocument> {
  const expected = await buildScope(root),
    existing = await readFile(resolve(root, SCOPE_OUTPUT), "utf8");
  if (existing !== JSON.stringify(expected, null, 2) + "\n")
    throw new Error(
      "Stale or modified grammar scope: run bun scripts/build-grammar-scope.ts",
    );
  return expected;
}
