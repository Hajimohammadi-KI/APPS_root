import { gapFill, normalizeText } from "../text";
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
  if (
    candidates.length < 2 ||
    !candidates.some((c) => accepted.includes(plain(c)))
  )
    return [];
  return candidates.filter((candidate) => !accepted.includes(plain(candidate)));
}
// Closed-class words a gap may leave out: choosing them is the grammar task.
const FUNCTION_WORDS = {
  en: new Set(
    "a an the this that these those my your his her its our their whose who whom which what where when why how i you he she it we they me him us them mine yours hers ours theirs myself yourself himself herself itself ourselves themselves am is are was were be been being have has had do does did will would can could shall should may might must can't won't not no some any much many few little more most less to of in on at by for with from about into onto over under after before since until as than if whether when while because although though so and but or nor either neither both there here very too enough".split(
      " ",
    ),
  ),
  de: new Set(
    "der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner mein meine meinen meinem meiner dein deine sein seine ihr ihre unser unsere euer eure dieser diese dieses diesen diesem ich du er sie es wir mich dich ihn uns euch mir dir ihm ihnen sich man bin bist ist sind seid war warst waren wart sei seien wäre wären habe hast hat haben habt hatte hattest hatten hätte hätten werde wirst wird werden werdet wurde wurden worden würde würden kann kannst können könnt könnte könnten muss musst müssen müsst müsste darf darfst dürfen dürfte soll sollst sollen sollte will willst wollen wollte mag möchte möchtest in an auf unter über neben zwischen vor hinter mit nach bei seit von zu zum zur aus für um durch gegen ohne bis wegen trotz während am im ins vom beim und aber oder denn sondern weil dass ob wenn als wie nachdem bevor damit obwohl je desto umso sowohl weder noch entweder allerdings jedoch deshalb daher darum deswegen folglich dennoch trotzdem gleichwohl außerdem zudem hingegen also auch nur schon doch ja mal halt eben nicht nie sehr wo wann warum was wer wen wem wessen welche welcher welches welchen welchem viel viele vielen wenig wenige einige alle allen manche mehrere andere denen dessen deren meinem meinen meines deinem deinen deiner deines seinem seinen seiner seines ihrem ihren ihrer ihres unserem unseren unserer unseres eurem euren eurer eures diesen dieses könne müsse dürfe solle wolle möge habe werde konnte konnten musste mussten durfte durften sollten solltest wollten könntest müssten dürften".split(
      " ",
    ),
  ),
};
const fold = (text: string) =>
  normalizeText(text)
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/gu, "ss");
const foldedWords = (text: string) => fold(text).match(/[\p{L}']+/gu) ?? [];
const isFunctionWord = (word: string, language: "en" | "de") =>
  language === "en"
    ? word.startsWith("'") ||
      FUNCTION_WORDS.en.has(word) ||
      FUNCTION_WORDS.en.has(word.replace(/'(?:s|re|m|ve|ll|d)$|n't$/u, ""))
    : [...FUNCTION_WORDS.de].some((known) => fold(known) === word) ||
      /^(?:wo|da)r?(?:an|auf|aus|bei|durch|fur|gegen|in|mit|nach|uber|um|unter|von|vor|zu|zwischen)$/u.test(
        word,
      );
const GAP_FRAMES =
  /schreibe (?:die|den) (?:vollständige|ganzen|vollständigen)(?: richtige)? (?:Antwort|Satz|deutschen Text|Text)(?: auf Deutsch)?|schreibe (?:beide Sätze|ihn|sie) vollständig(?: auf Deutsch)?|Setze die fehlende Form ein|Wende die Form in einem zweiten kontrollierten Beispiel an|Ergänze die Lücke(?:, sodass der Text zusammenhängt)?|Write the full sentence|Complete the sentence/giu;
const pairs = (word: string) =>
  new Set([...word].slice(1).map((letter, at) => word[at] + letter));
// Inflected, ge- or zu- forms keep a prefix or most letter pairs of their cue
// (fährst/fahren, gearbeitet/arbeiten, abzuschließen/abschließen,
// geschrieben/schreiben); suppletive forms such as ate/eat need a bracket cue.
const cuedBy = (word: string, cue: string) => {
  const [short, long] = word.length <= cue.length ? [word, cue] : [cue, word];
  if (short.length >= 3 && long.startsWith(short)) return true;
  if (short.length < 4) return false;
  if (long.startsWith(short.slice(0, 4))) return true;
  const a = pairs(short),
    b = pairs(long);
  const shared = [...a].filter((pair) => b.has(pair)).length;
  return (2 * shared) / (a.size + b.size) >= 0.5;
};
/** A one-gap cloze must let the learner work out what is missing: each
 * content word in the gap appears, in some form, in the instruction or the
 * rest of the sentence, or the prompt offers options or ends with a cue in
 * brackets. Otherwise any number of correct sentences fit (Sie ist ___.).
 * Hints do not count: opening one is recorded as help. */
export function auditGapCue(
  task: Pick<
    PracticeTask,
    "id" | "answerPolicy" | "modality" | "prompt" | "acceptedAnswers"
  >,
  language: "en" | "de",
): ContentAuditIssue[] {
  if (task.answerPolicy !== "closed" || task.modality !== "writing") return [];
  const issue = (code: string): ContentAuditIssue[] => [
    { taskId: task.id, code, severity: "error" },
  ];
  if (/\p{L}_{2,}|_{2,}\p{L}/u.test(task.prompt))
    return issue("gap-inside-word");
  const fill = gapFill(task.prompt, task.acceptedAnswers[0] ?? "");
  if (fill === null) return [];
  // A bracket cue that already is the answer leaves nothing to recall. Only a
  // capital the sentence itself does not require (a name) is a task.
  const bracket = task.prompt.match(/\(([^()/]+)\)\s*$/u)?.[1];
  if (bracket) {
    const plain = (text: string) =>
      normalizeText(text).replace(/[,.;]/gu, " ").replace(/\s+/gu, " ").trim();
    const opening = !/\p{L}/u.test(
      task.prompt.slice(0, task.prompt.search(/_{2,}/u)).split(":").at(-1)!,
    );
    if (
      plain(bracket) === plain(fill) ||
      (opening &&
        plain(bracket).toLocaleLowerCase() === plain(fill).toLocaleLowerCase())
    )
      return issue("copied-cue");
  }
  if (
    /\([^()]+\)\s*$/u.test(task.prompt) ||
    offeredOptions(task.prompt).length > 1
  )
    return [];
  const colon = task.prompt.lastIndexOf(":");
  // The fixed frames name no word of the answer ("… Antwort auf Deutsch"),
  // and a function word such as "auf" cues no content word (Aufgaben).
  const cues = foldedWords(
    task.prompt.slice(0, Math.max(0, colon)).replace(GAP_FRAMES, " ") +
      " " +
      task.prompt.slice(colon + 1).replace(/_{2,}/u, " "),
  ).filter((cue) => !isFunctionWord(cue, language));
  const uncued = foldedWords(fill).filter(
    (word) =>
      !isFunctionWord(word, language) && !cues.some((cue) => cuedBy(word, cue)),
  );
  return uncued.length ? issue("uncued-gap") : [];
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
