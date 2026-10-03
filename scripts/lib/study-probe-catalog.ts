import {
  isRecord,
  type Language,
} from "../../shared/learning-core/src/automaticity/contracts";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import {
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./automaticity-release-reviews";
/** Private reviewed evaluation material stays out of shipped practice and model training. */
export async function loadStudyProbeCatalog(
  root: string,
  value: unknown,
  practice: readonly CurriculumPack[],
  now: string,
) {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.packs) ||
    !value.packs.length
  )
    throw Error(
      "Provide a private probe catalog and recorded independent reviews",
    );
  const packs = value.packs as CurriculumPack[],
    languages = new Set<string>(),
    cells: CoverageCell[] = [];
  const practiceTasks = practice.flatMap((pack) =>
      pack.units.flatMap((unit) => unit.tasks),
    ),
    ids = new Set(practiceTasks.map((task) => task.id)),
    families = new Set(
      practiceTasks.map((task) => `${task.constructionId}:${task.itemFamily}`),
    );
  for (const pack of packs) {
    if (
      !["en", "de"].includes(pack.language) ||
      languages.has(pack.language) ||
      !pack.version?.trim() ||
      !pack.mappingVersion?.trim() ||
      !pack.units?.length ||
      validateCurriculum(pack).length
    )
      throw Error("Invalid or duplicated private probe curriculum");
    languages.add(pack.language);
    for (const unit of pack.units) {
      const tasks = activePracticeTasks(unit);
      if (!tasks.length || unit.retiredTasks?.length)
        throw Error(
          "Private probe units cannot contain retired or empty tasks",
        );
      for (const task of tasks) {
        if (
          !unit.id.startsWith(pack.language + ".") ||
          task.partition !== "evaluation" ||
          task.contentReview !== "human_reviewed" ||
          ids.has(task.id) ||
          families.has(`${task.constructionId}:${task.itemFamily}`) ||
          task.hints.length ||
          task.solution !== null ||
          task.answerPolicy !== "open"
        )
          throw Error(
            "Probe reuses practice content, exposes an answer or lacks reviewed evaluation identity",
          );
        ids.add(task.id);
      }
      for (const [stage, modality] of new Map(
        tasks.map((task) => [
          `${task.stage}:${task.modality}`,
          [task.stage, task.modality] as const,
        ]),
      ).values()) {
        const scoped = tasks.filter(
          (task) => task.stage === stage && task.modality === modality,
        );
        cells.push({
          language: pack.language,
          constructionId: unit.id,
          contentVersion: pack.version,
          mappingVersion: pack.mappingVersion,
          stage,
          modality,
          taskIds: scoped.map((task) => task.id),
          humanReview: "complete",
          evaluator: "human-review-required",
          releaseEligible: true,
        });
      }
    }
  }
  const reviews = parseReviewLedger({
    schemaVersion: 1,
    reviews: value.reviews,
  });
  if (
    reviews.some((review) =>
      review.evaluators.some((evaluator) => evaluator.kind !== "human"),
    )
  )
    throw Error(
      "Private study probes require a documented human assessment procedure",
    );
  const verified = await validateReleaseReviews(
    root,
    cells,
    new Map(packs.map((pack) => [pack.language, pack])),
    reviews,
    now,
  );
  if (
    verified.reviewedCells !== cells.length ||
    verified.evaluatorApprovedCells !== cells.length
  )
    throw Error("Private probe review is incomplete");
  const merged = structuredClone([...practice]);
  for (const pack of packs) {
    let target = merged.find((row) => row.language === pack.language);
    if (!target) {
      target = { ...pack, units: [] };
      merged.push(target);
    }
    for (const unit of pack.units) {
      const current = target.units.find((row) => row.id === unit.id);
      if (current) current.tasks.push(...structuredClone(unit.tasks));
      else target.units.push(structuredClone(unit));
    }
  }
  return {
    packs: merged,
    probeLanguages: [...languages] as Language[],
    reviewedCells: cells.length,
    reviews,
  };
}
