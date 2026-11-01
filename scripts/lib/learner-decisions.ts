import { createHash } from "node:crypto";
import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
import type {
  LearnerFeedback,
  LearnerFeedbackDecision,
} from "../../shared/learning-core/src/automaticity/learner-feedback";
import { normalizeText } from "../../shared/learning-core/src/text";

/** Owner decisions on learner comments, imported from the private repository
 * and committed, so every curriculum build stays reproducible. */
export interface LearnerDecisionFile {
  schemaVersion: 1;
  language: "en" | "de";
  /** The task version of every exercise these decisions revise. */
  version: string | null;
  decisions: {
    issue: number;
    taskId: string;
    taskVersion: string;
    prompt: string;
    decision: "accept_answer" | "known_wrong";
    answer: string;
    explanation: string;
    decidedAt: string;
  }[];
}
type Row = LearnerDecisionFile["decisions"][number];

/** Answer decisions per language; fix requests need authored content instead. */
export function learnerDecisionRows(
  decided: readonly {
    issue: number;
    feedback: LearnerFeedback;
    decision: LearnerFeedbackDecision;
  }[],
) {
  const rows: Record<"en" | "de", Row[]> = { en: [], de: [] };
  const fixes: { issue: number; language: "en" | "de"; taskId: string; prompt: string }[] = [];
  for (const { issue, feedback, decision } of decided) {
    if (decision.decision === "fix_exercise")
      fixes.push({ issue, language: feedback.language, taskId: feedback.task.id, prompt: feedback.task.prompt });
    if (decision.decision !== "accept_answer" && decision.decision !== "known_wrong") continue;
    rows[feedback.language].push({
      issue,
      taskId: feedback.task.id,
      taskVersion: feedback.task.version,
      prompt: feedback.task.prompt,
      decision: decision.decision,
      answer: decision.answer,
      explanation: decision.explanation,
      decidedAt: decision.decidedAt,
    });
  }
  for (const list of Object.values(rows)) list.sort((a, b) => a.issue - b.issue);
  return { ...rows, fixes: fixes.sort((a, b) => a.issue - b.issue) };
}

const plain = (text: string) =>
  normalizeText(text, { allowOptionalFinalPeriod: true }).toLocaleLowerCase();

/** Apply decisions to the exercise each comment was about. A decision whose
 * exercise text has changed since, or that contradicts another decision on the
 * same form, is reported and not applied. The previous version stays for saved work. */
export function applyLearnerDecisions(
  source: CurriculumPack,
  file: LearnerDecisionFile,
): { pack: CurriculumPack; skipped: { issue: number; reason: string }[] } {
  if (file.schemaVersion !== 1 || file.language !== source.language)
    throw Error(`Learner decisions do not match ${source.language}`);
  const pack = structuredClone(source);
  const skipped: { issue: number; reason: string }[] = [];
  if (!file.decisions.length) return { pack, skipped };
  if (!file.version) throw Error("Learner decisions need a version");
  const groups = new Map<string, { task: PracticeTask; rows: Row[] }>();
  for (const row of file.decisions) {
    const unit = pack.units.find((candidate) =>
      row.taskId.startsWith(`${candidate.id}.`),
    );
    let id = row.taskId;
    for (let hops = 0; unit && hops < 20; hops++) {
      const next = unit.retiredTasks?.find((retired) => retired.taskId === id);
      if (!next) break;
      id = next.replacementTaskId;
    }
    const task = unit && activePracticeTasks(unit).find((t) => t.id === id);
    if (!task || task.answerPolicy !== "closed") {
      skipped.push({ issue: row.issue, reason: "The exercise is no longer in the curriculum." });
      continue;
    }
    if (normalizeText(task.prompt) !== normalizeText(row.prompt)) {
      skipped.push({ issue: row.issue, reason: "The exercise text changed after the comment." });
      continue;
    }
    const group = groups.get(task.id) ?? { task, rows: [] };
    group.rows.push(row);
    groups.set(task.id, group);
  }
  let changed = false;
  for (const { task, rows } of groups.values()) {
    const accepted = rows.filter((row) => row.decision === "accept_answer");
    const rejected = rows.filter((row) => row.decision === "known_wrong");
    const conflicts = new Set(
      accepted
        .filter((a) => rejected.some((r) => plain(r.answer) === plain(a.answer)))
        .map((a) => plain(a.answer)),
    );
    for (const row of rows)
      if (conflicts.has(plain(row.answer)))
        skipped.push({ issue: row.issue, reason: "Another decision on the same form contradicts it." });
    const answers = [...task.acceptedAnswers];
    for (const row of accepted)
      if (!conflicts.has(plain(row.answer)) && !answers.some((a) => plain(a) === plain(row.answer)))
        answers.push(row.answer.trim());
    const wrong = [...(task.rejectedAnswers ?? [])];
    for (const row of rejected) {
      if (conflicts.has(plain(row.answer))) continue;
      if (answers.some((a) => plain(a) === plain(row.answer))) {
        skipped.push({ issue: row.issue, reason: "This form is an accepted answer." });
        continue;
      }
      if (!wrong.some((w) => plain(w.answer) === plain(row.answer)))
        wrong.push({ answer: row.answer.trim(), explanation: row.explanation.trim() });
    }
    if (answers.length === task.acceptedAnswers.length && wrong.length === (task.rejectedAnswers?.length ?? 0))
      continue;
    const applied = rows.filter((row) => !conflicts.has(plain(row.answer)));
    const digest = createHash("sha256")
      .update(JSON.stringify(applied.map((row) => [row.issue, row.decision, row.answer])))
      .digest("hex")
      .slice(0, 8);
    const base = task.id.replace(/\.learner-[a-f0-9]{8}(?=\.(?:writing|speaking)$)/u, "");
    const id = base.replace(/\.(writing|speaking)$/u, `.learner-${digest}.$1`);
    const unit = pack.units.find((row) => row.tasks.includes(task))!;
    if (unit.tasks.some((row) => row.id === id)) continue;
    const replacement: PracticeTask = {
      ...task,
      id,
      version: file.version,
      contentReview: "authored",
      acceptedAnswers: answers,
      ...(wrong.length ? { rejectedAnswers: wrong } : {}),
      sourceId: `learner-decisions-${file.version}:${applied.map((row) => row.issue).join(",")}`,
    };
    unit.tasks.splice(unit.tasks.indexOf(task) + 1, 0, replacement);
    unit.retiredTasks ??= [];
    // Links to earlier versions follow one hop, so they now open the newest one.
    for (const retired of unit.retiredTasks)
      if (retired.replacementTaskId === task.id) retired.replacementTaskId = id;
    unit.retiredTasks.push({
      taskId: task.id,
      replacementTaskId: id,
      reason: "Apply the owner's reviewed decisions on learner comments: accepted answers and reviewed wrong forms.",
      retiredOn: file.version.slice(0, 10),
    });
    changed = true;
  }
  if (changed) pack.version = file.version;
  return { pack, skipped: skipped.sort((a, b) => a.issue - b.issue) };
}
