import type { Modality, Stage } from "./contracts";
import {
  activePracticeTasks,
  type ConstructionUnit,
  type PracticeTask,
} from "./curriculum";

/** Exact authored mappings fail closed; saved choices and drafts are handled by fresh(), not here. */
export function learningCycleTask(
  unit: ConstructionUnit,
  stage: Stage,
  modality: Modality,
  allowModalityFallback = false,
): PracticeTask | undefined {
  const active = activePracticeTasks(unit).filter(
    (task) => task.partition === "practice",
  );
  if (unit.learningCycle && modality === "writing") {
    const mapped = unit.learningCycle.steps.find(
      (step) => step.stage === stage,
    );
    return active.find(
      (task) =>
        task.id === mapped?.taskId &&
        task.stage === stage &&
        task.modality === modality,
    );
  }
  return (
    active.find((task) => task.stage === stage && task.modality === modality) ??
    (allowModalityFallback
      ? active.find((task) => task.stage === stage)
      : undefined)
  );
}
