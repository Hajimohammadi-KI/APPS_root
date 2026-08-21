import { compareSemanticVersions, parseSemanticVersion } from "./version";
import type { TaskLifecycleState } from "./task-lifecycle";

export interface TaskDefinition {
  readonly taskId: string;
  readonly taskVersion: string;
  readonly contentVersion: string;
  readonly rubricId: string;
  readonly rubricVersion: string;
  readonly lifecycleState: TaskLifecycleState;
  readonly checksum: string;
  readonly publishedAt?: string;
  readonly definition: Readonly<Record<string, unknown>>;
}

function key(taskId: string, taskVersion: string): string {
  return `${taskId}@${taskVersion}`;
}

export class TaskCatalog {
  readonly #definitions: ReadonlyMap<string, TaskDefinition>;

  constructor(definitions: readonly TaskDefinition[]) {
    const entries = new Map<string, TaskDefinition>();
    for (const definition of definitions) {
      parseSemanticVersion(definition.taskVersion);
      const catalogKey = key(definition.taskId, definition.taskVersion);
      if (entries.has(catalogKey)) {
        throw new Error(`Duplicate task definition: ${catalogKey}`);
      }
      entries.set(catalogKey, Object.freeze({ ...definition }));
    }
    this.#definitions = entries;
  }

  resolveHistorical(taskId: string, taskVersion: string): TaskDefinition {
    const definition = this.#definitions.get(key(taskId, taskVersion));
    if (!definition) {
      throw new Error(`Historical task definition not found: ${taskId}@${taskVersion}`);
    }
    return definition;
  }

  resolveForNewAttempt(taskId: string): TaskDefinition {
    const candidates = [...this.#definitions.values()]
      .filter(
        (definition) =>
          definition.taskId === taskId && definition.lifecycleState === "published",
      )
      .sort((left, right) =>
        compareSemanticVersions(right.taskVersion, left.taskVersion),
      );
    const selected = candidates[0];
    if (!selected) {
      throw new Error(`No published task definition available: ${taskId}`);
    }
    return selected;
  }
}
