import { normalizeText } from "../text";
import {
  alignAnswers,
  answerDifference,
  unscoredFeedback,
} from "./answer-alignment";
import type { PracticeTask } from "./curriculum";
import { correctionSource, optionDistractors } from "./curriculum-audit";

export type ClosedAnswerReason =
  | "accepted"
  | "rejected"
  | "unchanged"
  | "option"
  | "case"
  | "punctuation"
  | "unmatched";
export interface ClosedAnswerCheck {
  verdict: "pass" | "needs_repair" | "not_assessed";
  reason: ClosedAnswerReason;
  /** Empty when an unmatched task has no stored answer to compare with. */
  feedback: string;
  spans: { start: number; end: number; explanation: string }[];
}
export type ClosedAnswerTask = Pick<
  PracticeTask,
  "prompt" | "responseKind" | "acceptedAnswers" | "modality"
> &
  Partial<Pick<PracticeTask, "rejectedAnswers">> & {
    terminalFullStop: boolean;
  };

/** How a Grammar Lab prompt asks for its answer, as the learning path names it. */
export function closedResponseKind(
  prompt: string,
): PracticeTask["responseKind"] {
  if (/_{2,}/u.test(prompt)) return "cloze";
  if (/^(?:Correct|Korrigiere)\b/u.test(prompt)) return "correction";
  if (/\bA:.+\/\s*B:/u.test(prompt)) return "choice";
  return "transformation";
}

// A German subordinate clause or an infinitive group with these words needs
// a comma; other commas, and English commas, may be optional.
const COMMA_REQUIRED_BEFORE = new Set([
  "dass",
  "weil",
  "ob",
  "obwohl",
  "damit",
  "nachdem",
  "bevor",
  "während",
  "sodass",
  "falls",
  "sobald",
  "seitdem",
  "indem",
  "um",
  "ohne",
  "statt",
  "anstatt",
]);
const marked = (text: string) =>
  [...text.matchAll(/([^\p{L}\p{N}’']*)([\p{L}\p{N}’']+)/gu)].map(
    ([, before, word]) => ({
      comma: before!.includes(","),
      word: word!.toLocaleLowerCase(),
    }),
  );
/** The same words as a stored form with a different mark: certainly wrong,
 * unless the only difference is a comma that may be optional. */
function punctuationOnly(
  value: string,
  answer: string,
  language: "en" | "de",
): boolean {
  const a = marked(value),
    b = marked(answer);
  if (a.length !== b.length || a.some((row, i) => row.word !== b[i]!.word))
    return false;
  const withoutCommas = (text: string) =>
    text.replace(/\s*,\s*/gu, " ").toLocaleLowerCase(language);
  if (withoutCommas(value) !== withoutCommas(answer)) return true;
  return (
    language === "de" &&
    b.some(
      (row, i) =>
        row.comma && !a[i]!.comma && COMMA_REQUIRED_BEFORE.has(row.word),
    )
  );
}

/** The verdict on one closed answer, shared by the learning path and both
 * Grammar Labs. Only an accepted form passes. An answer is wrong only when it
 * is certainly wrong: a form the owner rejected after review, the unchanged
 * sentence to correct, another option the prompt offers, or a stored form in
 * the wrong case or with a different mark. Anything else is saved without a
 * score, because a correct alternative may be missing from the stored forms. */
export function checkClosedAnswer(
  task: ClosedAnswerTask,
  response: string,
  language: "en" | "de",
): ClosedAnswerCheck {
  const english = language === "en";
  const plain = (text: string) =>
    normalizeText(text, { allowOptionalFinalPeriod: task.terminalFullStop });
  const value = plain(response);
  const accepted = task.acceptedAnswers.some((answer) => {
    const expected = plain(answer);
    return (
      expected === value ||
      (english &&
        task.responseKind === "cloze" &&
        /^[a-z]/u.test(expected) &&
        value === expected[0]!.toUpperCase() + expected.slice(1))
    );
  });
  if (accepted)
    return {
      verdict: "pass",
      reason: "accepted",
      feedback: english
        ? "This matches an accepted form for this controlled task. Now use the pattern in your own words."
        : "Diese Antwort entspricht einer zulässigen Form der kontrollierten Aufgabe. Verwende das Muster nun mit eigenen Worten.",
      spans: [],
    };
  const rejected = task.rejectedAnswers?.find(
    (row) => plain(row.answer) === value,
  );
  const source =
    task.responseKind === "correction" ? correctionSource(task.prompt) : null;
  const unchanged = !!source && plain(source) === value;
  const option = optionDistractors(task).some(
    (sentence) => plain(sentence) === value,
  );
  const caseOnly =
    task.modality === "writing" &&
    task.acceptedAnswers.some(
      (answer) =>
        plain(answer).toLocaleLowerCase(language) ===
        value.toLocaleLowerCase(language),
    );
  const punctuation =
    task.modality === "writing" &&
    task.acceptedAnswers.some((answer) =>
      punctuationOnly(value, plain(answer), language),
    );
  const [verdict, reason, feedback]: [
    ClosedAnswerCheck["verdict"],
    ClosedAnswerReason,
    string,
  ] = rejected
    ? [
        "needs_repair",
        "rejected",
        english
          ? `This form was reviewed and is not correct here. ${rejected.explanation}`
          : `Diese Form wurde geprüft und ist hier nicht richtig. ${rejected.explanation}`,
      ]
    : unchanged
      ? [
          "needs_repair",
          "unchanged",
          english
            ? "This is still the sentence to correct. Change the part the instruction names and write the full sentence."
            : "Das ist noch der Satz, der korrigiert werden soll. Ändere die genannte Stelle und schreibe den ganzen Satz.",
        ]
      : option
        ? [
            "needs_repair",
            "option",
            english
              ? "This is one of the given options, but not the one that fits here."
              : "Das ist eine der angegebenen Möglichkeiten, aber nicht die passende.",
          ]
        : caseOnly
          ? [
              "needs_repair",
              "case",
              english
                ? "Check the capitalization, including sentence starts and names."
                : "Prüfe die Groß- und Kleinschreibung, besonders am Satzanfang und bei Nomen.",
            ]
          : punctuation
            ? [
                "needs_repair",
                "punctuation",
                english
                  ? "Check the punctuation: the words match, but a mark differs from the stored answer."
                  : "Prüfe die Zeichensetzung: Die Wörter stimmen, aber ein Satzzeichen weicht von der gespeicherten Lösung ab.",
              ]
            : ["not_assessed", "unmatched", ""];
  if (!task.acceptedAnswers.length)
    return { verdict, reason, feedback, spans: [] };
  // The token edits to the nearest stored form: an unscored answer gets one
  // sentence; a verdict keeps its own and names a single difference.
  const edits =
    task.acceptedAnswers
      .map((answer) => alignAnswers(response, answer))
      .sort((a, b) => a.length - b.length)[0] ?? [];
  const notes = edits.map((edit) => answerDifference(edit, language));
  return {
    verdict,
    reason,
    feedback:
      verdict === "not_assessed"
        ? unscoredFeedback(edits, language)
        : notes.length === 1
          ? `${feedback} ${notes[0]}`
          : feedback,
    spans: edits.map((edit, index) => ({
      start: edit.start,
      end: edit.end,
      explanation: notes[index]!,
    })),
  };
}
