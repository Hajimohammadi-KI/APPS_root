import { normalizeText } from "../text";
import type { PracticeTask } from "./curriculum";
export interface ContentAuditIssue {
  readonly taskId: string;
  readonly code: string;
  readonly severity: "error" | "warning";
}
export function auditClosedTask(
  task: Pick<
    PracticeTask,
    | "id"
    | "answerPolicy"
    | "responseKind"
    | "prompt"
    | "acceptedAnswers"
    | "solution"
  >,
): ContentAuditIssue[] {
  if (task.answerPolicy !== "closed") return [];
  const issues: ContentAuditIssue[] = [];
  const add = (code: string, severity: "error" | "warning") =>
    issues.push({ taskId: task.id, code, severity });
  const answers = task.acceptedAnswers.map((a) => normalizeText(a));
  if (!answers.length || answers.some((a) => !a))
    add("missing-answer", "error");
  if (!task.solution || !answers.includes(normalizeText(task.solution)))
    add("solution-not-accepted", "error");
  if (new Set(answers).size !== answers.length)
    add("duplicate-answer", "warning");
  const gaps = task.prompt.match(/_{2,}/gu) ?? [];
  if (task.responseKind === "cloze" && gaps.length > 1)
    add("multiple-gaps", "warning");
  if (task.responseKind === "correction" && task.solution) {
    const source = task.prompt.slice(task.prompt.lastIndexOf(":") + 1).trim();
    if (normalizeText(source) === normalizeText(task.solution))
      add("unchanged-correction", "warning");
  }
  return issues;
}
