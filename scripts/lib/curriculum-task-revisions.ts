import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  CurriculumPack,
  PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
export async function applyTaskRevisions(
  root: string,
  pack: CurriculumPack,
): Promise<void> {
  const data = JSON.parse(
    await readFile(
      resolve(root, "shared/learning-core/content/task-revisions.json"),
      "utf8",
    ),
  ) as {
    schemaVersion: number;
    author: { kind: string; humanReview: boolean };
    revisions: {
      constructionId: string;
      retired: {
        taskId: string;
        sha256: string;
        replacementTaskId: string;
        reason: string;
        retiredOn: string;
      }[];
      replacements: PracticeTask[];
    }[];
  };
  if (
    data.schemaVersion !== 1 ||
    data.author.kind !== "model" ||
    data.author.humanReview !== false
  )
    throw Error("Unsubstantiated task revision review claim");
  const seen = new Set<string>();
  for (const revision of data.revisions.filter((row) =>
    row.constructionId.startsWith(pack.language + "."),
  )) {
    const unit = pack.units.find((unit) => unit.id === revision.constructionId);
    if (!unit || seen.has(unit.id) || unit.retiredTasks)
      throw Error(`Invalid task revision unit ${revision.constructionId}`);
    seen.add(unit.id);
    for (const record of revision.retired) {
      const original = unit.tasks.find((task) => task.id === record.taskId);
      if (
        !original ||
        createHash("sha256").update(JSON.stringify(original)).digest("hex") !==
          record.sha256
      )
        throw Error(`Stale task revision ${record.taskId}`);
    }
    for (const task of revision.replacements) {
      if (
        task.constructionId !== unit.id ||
        task.contentReview !== "authored" ||
        task.partition !== "practice" ||
        unit.tasks.some((old) => old.id === task.id)
      )
        throw Error(`Invalid replacement ${task.id}`);
      unit.tasks.push(structuredClone(task));
    }
    unit.retiredTasks = revision.retired.map(
      ({ sha256: _hash, ...record }) => record,
    );
  }
}
