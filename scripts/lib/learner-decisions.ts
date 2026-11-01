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

export interface LearnerDecision {
  issue: number;
  taskId: string;
  taskVersion: string;
  prompt: string;
  decision: "accept_answer" | "known_wrong";
  answer: string;
  explanation: string;
  decidedAt: string;
}
/** Owner decisions on learner comments, imported from the private repository
 * and committed so every build is reproducible. Batches are only appended:
 * each builds a new version on top of the previous one, so a version learners
 * already answered is never regenerated differently or dropped. */
export interface LearnerDecisionFile {
  schemaVersion: 2;
  language: "en" | "de";
  batches: { version: string; decisions: LearnerDecision[] }[];
}
type Row = LearnerDecision;

/** Appends the decisions not recorded yet as one batch; returns the same file when there are none. */
export function appendDecisionBatch(
  file: LearnerDecisionFile,
  rows: readonly LearnerDecision[],
  version: string,
): LearnerDecisionFile {
  const known = new Set(
    file.batches.flatMap((batch) => batch.decisions.map((row) => row.issue)),
  );
  const fresh = rows.filter((row) => !known.has(row.issue));
  if (!fresh.length) return file;
  if (file.batches.some((batch) => batch.version >= version))
    throw Error(`Batch version ${version} must follow the earlier ones`);
  return { ...file, batches: [...file.batches, { version, decisions: fresh }] };
}

/** Answer decisions per language; fix requests need authored content instead. */
export function learnerDecisionRows(
  decided: readonly {
    issue: number;
    feedback: LearnerFeedback;
    decision: LearnerFeedbackDecision;
  }[],
) {
  const rows: Record<"en" | "de", Row[]> = { en: [], de: [] };
  const fixes: {
    issue: number;
    language: "en" | "de";
    taskId: string;
    prompt: string;
  }[] = [];
  for (const { issue, feedback, decision } of decided) {
    if (decision.decision === "fix_exercise")
      fixes.push({
        issue,
        language: feedback.language,
        taskId: feedback.task.id,
        prompt: feedback.task.prompt,
      });
    if (
      decision.decision !== "accept_answer" &&
      decision.decision !== "known_wrong"
    )
      continue;
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
  for (const list of Object.values(rows))
    list.sort((a, b) => a.issue - b.issue);
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
  if (file.schemaVersion !== 2 || file.language !== source.language)
    throw Error(`Learner decisions do not match ${source.language}`);
  const pack = structuredClone(source);
  const skipped: { issue: number; reason: string }[] = [];
  for (const batch of file.batches)
    if (applyBatch(pack, batch.version, batch.decisions, skipped))
      pack.version = batch.version;
  return { pack, skipped: skipped.sort((a, b) => a.issue - b.issue) };
}

function applyBatch(
  pack: CurriculumPack,
  version: string,
  decisions: readonly Row[],
  skipped: { issue: number; reason: string }[],
): boolean {
  const groups = new Map<string, { task: PracticeTask; rows: Row[] }>();
  for (const row of decisions) {
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
      skipped.push({
        issue: row.issue,
        reason: "The exercise is no longer in the curriculum.",
      });
      continue;
    }
    if (normalizeText(task.prompt) !== normalizeText(row.prompt)) {
      skipped.push({
        issue: row.issue,
        reason: "The exercise text changed after the comment.",
      });
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
        .filter((a) =>
          rejected.some((r) => plain(r.answer) === plain(a.answer)),
        )
        .map((a) => plain(a.answer)),
    );
    for (const row of rows)
      if (conflicts.has(plain(row.answer)))
        skipped.push({
          issue: row.issue,
          reason: "Another decision on the same form contradicts it.",
        });
    const answers = [...task.acceptedAnswers];
    for (const row of accepted)
      if (
        !conflicts.has(plain(row.answer)) &&
        !answers.some((a) => plain(a) === plain(row.answer))
      )
        answers.push(row.answer.trim());
    const wrong = [...(task.rejectedAnswers ?? [])];
    for (const row of rejected) {
      if (conflicts.has(plain(row.answer))) continue;
      if (answers.some((a) => plain(a) === plain(row.answer))) {
        skipped.push({
          issue: row.issue,
          reason: "This form is an accepted answer.",
        });
        continue;
      }
      if (!wrong.some((w) => plain(w.answer) === plain(row.answer)))
        wrong.push({
          answer: row.answer.trim(),
          explanation: row.explanation.trim(),
        });
    }
    if (
      answers.length === task.acceptedAnswers.length &&
      wrong.length === (task.rejectedAnswers?.length ?? 0)
    )
      continue;
    const applied = rows.filter((row) => !conflicts.has(plain(row.answer)));
    const base = task.id.replace(
      /\.learner-\d+(?=\.(?:writing|speaking)$)/u,
      "",
    );
    const id = base.replace(
      /\.(writing|speaking)$/u,
      `.learner-${version.replace(/\D/gu, "")}.$1`,
    );
    const unit = pack.units.find((row) => row.tasks.includes(task))!;
    if (unit.tasks.some((row) => row.id === id)) continue;
    const replacement: PracticeTask = {
      ...task,
      id,
      version,
      contentReview: "authored",
      acceptedAnswers: answers,
      ...(wrong.length ? { rejectedAnswers: wrong } : {}),
      sourceId: `learner-decisions-${version}:${applied.map((row) => row.issue).join(",")}`,
    };
    unit.tasks.splice(unit.tasks.indexOf(task) + 1, 0, replacement);
    unit.retiredTasks ??= [];
    // Links to earlier versions follow one hop, so they now open the newest one.
    for (const retired of unit.retiredTasks)
      if (retired.replacementTaskId === task.id) retired.replacementTaskId = id;
    unit.retiredTasks.push({
      taskId: task.id,
      replacementTaskId: id,
      reason:
        "Apply the owner's reviewed decisions on learner comments: accepted answers and reviewed wrong forms.",
      retiredOn: version.slice(0, 10),
    });
    changed = true;
  }
  return changed;
}
