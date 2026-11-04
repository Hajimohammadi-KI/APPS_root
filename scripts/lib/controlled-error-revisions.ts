import {
  activePracticeTasks,
  type CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import {
  CONTROLLED_ERROR_DATE,
  CONTROLLED_ERROR_FORMS,
  CONTROLLED_ERROR_VERSION,
  acceptedAnswerFingerprint,
  controlledErrorsForTask,
  controlledErrorTaskId,
} from "../../shared/learning-core/src/controlled-error-forms";
import { normalizeText } from "../../shared/learning-core/src/text";

/** Append new authored task versions; preserve all historical task definitions. */
export function applyControlledErrorRevisions(
  source: CurriculumPack,
): CurriculumPack {
  const pack = structuredClone(source);
  let changed = false;
  for (const spec of CONTROLLED_ERROR_FORMS.filter(
    (row) => row.language === pack.language,
  )) {
    const unit = pack.units.find((row) => row.id === spec.constructionId);
    if (!unit)
      throw new Error(`Missing controlled-error unit: ${spec.constructionId}`);
    const original = unit.tasks.find((row) => row.id === spec.taskId);
    if (
      !original ||
      original.modality !== "writing" ||
      original.partition !== "practice" ||
      original.answerPolicy !== "closed" ||
      controlledErrorsForTask(pack.language, original).length !==
        spec.rejectedAnswers.length
    ) {
      throw new Error(`Changed controlled-error task scope: ${spec.taskId}`);
    }
    const normalize = (text: string) =>
      normalizeText(text, {
        allowOptionalFinalPeriod: original.normalisation.terminalFullStop,
      });
    const rejectedAnswers = [
      ...(original.rejectedAnswers ?? []),
      ...spec.rejectedAnswers.filter(
        (row) =>
          !original.rejectedAnswers?.some(
            (existing) => normalize(existing.answer) === normalize(row.answer),
          ),
      ),
    ];
    if (
      rejectedAnswers.some((row) =>
        original.acceptedAnswers.some(
          (answer) => normalize(answer) === normalize(row.answer),
        ),
      )
    )
      throw new Error(
        `Accepted/rejected controlled-error collision: ${spec.taskId}`,
      );
    const id = controlledErrorTaskId(original.id);
    const replacement = unit.tasks.find((row) => row.id === id);
    if (replacement) {
      if (
        !activePracticeTasks(unit).some((row) => row.id === id) ||
        replacement.prompt !== original.prompt ||
        acceptedAnswerFingerprint(replacement.acceptedAnswers) !==
          acceptedAnswerFingerprint(original.acceptedAnswers) ||
        JSON.stringify(replacement.rejectedAnswers) !==
          JSON.stringify(rejectedAnswers) ||
        !unit.retiredTasks?.some(
          (row) => row.taskId === original.id && row.replacementTaskId === id,
        )
      )
        throw new Error(`Changed controlled-error replacement: ${id}`);
      continue;
    }
    if (!activePracticeTasks(unit).some((row) => row.id === original.id))
      throw new Error(`Inactive controlled-error source: ${original.id}`);
    unit.tasks.splice(unit.tasks.indexOf(original) + 1, 0, {
      ...original,
      id,
      version: CONTROLLED_ERROR_VERSION,
      contentReview: "authored",
      sourceId: `authored-controlled-errors-${CONTROLLED_ERROR_VERSION}:${unit.id}`,
      rejectedAnswers: rejectedAnswers.map((row) => ({ ...row })),
    });
    unit.retiredTasks ??= [];
    // Retirement records must resolve directly to a currently active task.
    for (const retired of unit.retiredTasks)
      if (retired.replacementTaskId === original.id)
        retired.replacementTaskId = id;
    unit.retiredTasks.push({
      taskId: original.id,
      replacementTaskId: id,
      reason:
        "New authored version with exact definite grammar-error forms; accepted answers unchanged.",
      retiredOn: CONTROLLED_ERROR_DATE,
    });
    changed = true;
  }
  if (changed && pack.version < CONTROLLED_ERROR_VERSION)
    pack.version = CONTROLLED_ERROR_VERSION;
  return pack;
}
