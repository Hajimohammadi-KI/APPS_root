import type { Modality } from "./contracts";
import { activePracticeTasks, type ConstructionUnit } from "./curriculum";
import { unresolvedRepairs, type EvidenceReduction } from "./evidence";

/** An explicit training criterion, not a prediction or guarantee of general fluency. */
export const LEARNING_TARGET = {
  accuracy: 0.9,
  checks: 20,
  delayedDays: 2,
  newContexts: 2,
} as const;

export function learningTarget(
  state: EvidenceReduction,
  constructionId: string,
  modality: Modality,
) {
  const history = state.attempts.filter(
    (row) =>
      row.attempt.task.constructionId === constructionId &&
      row.attempt.task.modality === modality,
  );
  const checked = history
    .filter((row) => row.eligibleForMastery)
    .sort(
      (a, b) =>
        Date.parse(a.attempt.at) - Date.parse(b.attempt.at) ||
        a.attempt.id.localeCompare(b.attempt.id),
    )
    .slice(-LEARNING_TARGET.checks);
  const successes = checked.filter((row) => row.success);
  const accuracy = checked.length ? successes.length / checked.length : null;
  const delayedDays = new Set(
    successes
      .filter((row) => row.delayed)
      .map((row) => row.attempt.at.slice(0, 10)),
  ).size;
  const newContexts = new Set(
    successes
      .filter(
        (row) =>
          row.novel &&
          ["elicited", "free"].includes(row.attempt.task.transferCondition),
      )
      .map((row) => row.attempt.task.contextId),
  ).size;
  const repairs = unresolvedRepairs(history).length;
  return {
    checked: checked.length,
    successes: successes.length,
    accuracy,
    delayedDays,
    newContexts,
    repairs,
    met:
      checked.length >= LEARNING_TARGET.checks &&
      accuracy !== null &&
      accuracy >= LEARNING_TARGET.accuracy &&
      delayedDays >= LEARNING_TARGET.delayedDays &&
      newContexts >= LEARNING_TARGET.newContexts &&
      repairs === 0,
  };
}

/** Written results never fill the speaking requirement. Orthography-only topics stay written. */
export function constructionTargetMet(
  state: EvidenceReduction,
  unit: ConstructionUnit,
): boolean {
  const modes = new Set(
    activePracticeTasks(unit)
      .filter((task) => task.partition === "practice")
      .map((task) => task.modality),
  );
  return (
    modes.size > 0 &&
    [...modes].every((mode) => learningTarget(state, unit.id, mode).met)
  );
}
