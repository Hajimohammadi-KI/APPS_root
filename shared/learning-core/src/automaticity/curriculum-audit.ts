import { normalizeText } from "../text";
import type { ConstructionUnit, PracticeTask } from "./curriculum";
import { KNOWN_CONTENT_REPAIRS } from "../content-repairs";
// Confirmed content defects, not a general semantic parser. Historical task
// definitions stay readable, but these prompts must never earn new credit.
const withdrawnCorrections = new Set(
  KNOWN_CONTENT_REPAIRS.flatMap((row) => [
    row.legacyPrompt,
    row.primaryPrompt,
  ]).map((prompt) => normalizeText(prompt)),
);
export interface ContentAuditIssue {
  readonly taskId: string;
  readonly code: string;
  readonly severity: "error" | "warning";
}
/** The text a correction prompt marks as wrong, or null when it shows none. */
export function correctionSource(prompt: string): string | null {
  const german = prompt.match(/Nicht richtig:\s*(.+)$/su)?.[1];
  if (german)
    return german
      .replace(/\s*Schreibe die vollständige richtige Antwort[^.]*\.\s*$/u, "")
      .trim();
  const colon = prompt.lastIndexOf(":");
  return colon < 0 ? null : prompt.slice(colon + 1).trim() || null;
}
const words = (text: string) =>
  normalizeText(text)
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}']+/gu) ?? [];
// Inflection stays comparable (studied/studying, Student/Studenten); short
// function words must match exactly.
const sameStem = (a: string, b: string) => {
  if (a === b) return true;
  let shared = 0;
  while (shared < Math.min(a.length, b.length) && a[shared] === b[shared])
    shared++;
  return shared >= Math.max(4, Math.min(a.length, b.length) - 2);
};
/** Share of the source's distinct words that the answer keeps. */
function retainedShare(source: string, answer: string): number {
  const from = [...new Set(words(source))],
    to = [...new Set(words(answer))];
  const kept = from.filter((word) => to.some((other) => sameStem(word, other)));
  return kept.length / Math.max(1, Math.min(from.length, to.length));
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
  > &
    Partial<Pick<PracticeTask, "rejectedAnswers">>,
): ContentAuditIssue[] {
  if (task.answerPolicy !== "closed") return [];
  const issues: ContentAuditIssue[] = [];
  const add = (code: string, severity: "error" | "warning") =>
    issues.push({ taskId: task.id, code, severity });
  const answers = task.acceptedAnswers.map((a) => normalizeText(a));
  if (
    task.responseKind === "correction" &&
    withdrawnCorrections.has(normalizeText(task.prompt))
  )
    add("known-invalid-correction", "error");
  if (!answers.length || answers.some((a) => !a))
    add("missing-answer", "error");
  if (!task.solution || !answers.includes(normalizeText(task.solution)))
    add("solution-not-accepted", "error");
  // A word cut off by an ellipsis is a placeholder no learner can type.
  if (answers.some((answer) => /\p{L}(?:\.{3}|…)/u.test(answer)))
    add("incomplete-answer", "error");
  // Notes such as "Nicht: … Sondern: …" or "These → Begründung" describe
  // language for the learner; they are not language to produce.
  if (
    answers.some((answer) =>
      /\b(?:Nicht|Sondern|Besser|Direkt|Indirekt|Vorgang|Zustand)\s*:|→/u.test(
        answer,
      ),
    )
  )
    add("note-as-answer", "error");
  if (new Set(answers).size !== answers.length)
    add("duplicate-answer", "warning");
  // A reviewed wrong form needs an explanation and can never also be accepted.
  if (
    task.rejectedAnswers?.some(
      (row) =>
        !row.explanation.trim() || answers.includes(normalizeText(row.answer)),
    )
  )
    add("rejected-answer-conflict", "error");
  const gaps = task.prompt.match(/_{2,}/gu) ?? [];
  if (task.responseKind === "cloze" && gaps.length > 1)
    add("multiple-gaps", "warning");
  const source =
    task.responseKind === "correction" ? correctionSource(task.prompt) : null;
  if (task.responseKind === "correction" && !source)
    add("missing-correction-source", "error");
  if (source && answers.length) {
    const length = words(source).length;
    if (
      length >= 3 &&
      answers.every(
        (answer) =>
          (/^\p{Lu}/u.test(source) && /^\p{Ll}/u.test(answer)) ||
          words(answer).length < length / 2,
      )
    )
      add("fragment-answer", "error");
    if (
      length &&
      answers.every((answer) => retainedShare(source, answer) < 1 / 3)
    )
      add("unrelated-correction", "error");
    if (answers.includes(normalizeText(source)))
      add("unchanged-correction", "error");
  }
  return issues;
}
/** The options a prompt itself offers: "with am, is or are", "(ein / einen)", "Ergänze viel oder viele". */
function offeredOptions(prompt: string): string[] {
  const list = prompt.match(
    /\bwith ((?:[\p{L}’']+, )+[\p{L}’']+,? or [\p{L}’']+|[\p{L}’']+ or [\p{L}’']+)[.:]/u,
  );
  if (list)
    return list[1]!
      .split(/,\s*(?:or\s+)?|\s+or\s+/u)
      .map((option) => option.trim())
      .filter(Boolean);
  const bracket = prompt.match(/\(([^()]+\/[^()]+)\)\s*$/u);
  if (bracket)
    return bracket[1]!
      .split("/")
      .map((option) => option.trim())
      .filter(Boolean);
  const german = prompt.match(/\bErgänze (\p{L}+) oder (\p{L}+)\b/u);
  return german ? [german[1]!, german[2]!] : [];
}
/** Sentences built with another option the prompt offers. They are certainly
 * not the answer, because the task restricts the choice to its options; they
 * are inferred only when one option yields a stored answer exactly. */
export function optionDistractors(
  task: Pick<PracticeTask, "prompt" | "responseKind" | "acceptedAnswers">,
): string[] {
  const plain = (text: string) =>
    normalizeText(text, { allowOptionalFinalPeriod: true });
  const accepted = task.acceptedAnswers.map(plain);
  let candidates: string[] = [];
  if (task.responseKind === "choice" && task.prompt.includes("A:"))
    candidates = task.prompt
      .slice(task.prompt.indexOf("A:"))
      .split(/\s*\/\s*(?=[A-D]:)/u)
      .map((option) => option.replace(/^[A-D]:\s*/u, "").trim())
      .filter(Boolean);
  else if (
    task.responseKind === "cloze" &&
    (task.prompt.match(/_{2,}/gu) ?? []).length === 1
  ) {
    const template = task.prompt
      .slice(task.prompt.lastIndexOf(":") + 1)
      .replace(/\s*\([^()]*\/[^()]*\)\s*$/u, "")
      .trim();
    if (/_{2,}/u.test(template))
      candidates = offeredOptions(task.prompt).map((option) =>
        template.replace(/_{2,}/u, option),
      );
  }
  if (candidates.length < 2 || !candidates.some((c) => accepted.includes(plain(c))))
    return [];
  return candidates.filter((candidate) => !accepted.includes(plain(candidate)));
}
/** A closed answer must be target language, not the unit's own rule or error description. */
export function auditUnitAnswers(
  unit: Pick<ConstructionUnit, "rule" | "commonError">,
  tasks: readonly Pick<
    PracticeTask,
    "id" | "answerPolicy" | "acceptedAnswers"
  >[],
): ContentAuditIssue[] {
  const plain = (text: string) =>
    normalizeText(text)
      .replace(/[.!?]$/u, "")
      .toLocaleLowerCase();
  const statements = new Set([unit.rule, unit.commonError].map(plain));
  return tasks
    .filter(
      (task) =>
        task.answerPolicy === "closed" &&
        task.acceptedAnswers.some((answer) => statements.has(plain(answer))),
    )
    .map((task) => ({
      taskId: task.id,
      code: "rule-as-answer",
      severity: "error" as const,
    }));
}
