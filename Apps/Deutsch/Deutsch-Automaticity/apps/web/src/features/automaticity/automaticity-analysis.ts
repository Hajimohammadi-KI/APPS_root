import { writingIssues } from "@automaticity/learning-core/writing-rules";
import {
  matchesReferenceAnswer,
  normalizeReferenceAnswer,
} from "@automaticity/learning-core/reference-answer";

export type AutomatikIssueCode =
  "missing_target" | "missing_comma" | "word_order" | "unfinished_sentence";

export interface AutomatikIssue {
  readonly code: AutomatikIssueCode;
  readonly message: string;
  readonly original: string;
  readonly corrected: string;
}

export interface AutomatikAnalysis {
  readonly verified: boolean;
  readonly online: boolean;
  readonly corrected: string;
  readonly sentenceCount: number;
  readonly wordCount: number;
  readonly targetUses: number;
  readonly score: number;
  readonly targetHit: boolean;
  readonly issues: readonly AutomatikIssue[];
}

function sentences(text: string): readonly string[] {
  return text
    .split(/(?:[.!?]+|\n+)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function words(text: string): readonly string[] {
  return text.trim().match(/[A-Za-zÄÖÜäöüß]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*/g) ?? [];
}

export function countWeilClauses(text: string): number {
  return text.match(/\bweil\b/gi)?.length ?? 0;
}

function firstWordOrderIssue(text: string): AutomatikIssue | null {
 const issue = writingIssues(text, "de").find(issue => issue.ruleId === "DE_SUBORDINATE_FINAL" || issue.ruleId === "DE_V2");
 return issue ? { code: "word_order", message: issue.message, original: issue.original, corrected: issue.replacement } : null;
}

export function analyzeWeilClause(text: string): AutomatikAnalysis {
  const cleanText = text.trim();
  const sentenceCount = sentences(cleanText).length;
  const wordCount = words(cleanText).length;
  const targetUses = countWeilClauses(cleanText);
  const issues: AutomatikIssue[] = [];

  const commaIssue = cleanText.match(/\b[^,.!?\n]+\s+weil\s+/i);
  if (commaIssue && !commaIssue[0].includes(",")) {
    const original = commaIssue[0].trim();
    issues.push({
      code: "missing_comma",
      message: "Vor dem weil-Nebensatz steht ein Komma.",
      original,
      corrected: original.replace(/\s+weil\s+/i, ", weil "),
    });
  }

  const wordOrderIssue = firstWordOrderIssue(cleanText);
  if (wordOrderIssue) issues.push(wordOrderIssue);

  if (cleanText && targetUses === 0) {
    issues.push({
      code: "missing_target",
      message: "Begründe mindestens eine Aussage mit einem weil-Nebensatz.",
      original: cleanText,
      corrected: "Ich übe heute, weil ich sicherer sprechen möchte.",
    });
  }

  if (cleanText && !/[.!?]$/.test(cleanText)) {
    issues.push({
      code: "unfinished_sentence",
      message: "Beende den letzten Satz mit einem Satzzeichen.",
      original: cleanText,
      corrected: `${cleanText}.`,
    });
  }

  const sentenceScore = Math.min(35, Math.round((sentenceCount / 6) * 35));
  const targetScore = Math.min(50, Math.round((targetUses / 4) * 50));
  const accuracyScore = Math.max(0, 15 - issues.length * 5);
  const score = Math.min(100, sentenceScore + targetScore + accuracyScore);

  return {
    verified: false,
    online: false,
    corrected: cleanText,
    sentenceCount,
    wordCount,
    targetUses,
    score,
    targetHit: sentenceCount >= 6 && targetUses >= 4 && issues.length === 0,
    issues,
  };
}

export function normalizePracticeAnswer(value: string): string {
  return normalizeReferenceAnswer(value);
}

export function practiceAnswerMatches(
  value: string,
  expected: string,
): boolean {
  return matchesReferenceAnswer(value, expected, {
    allowOptionalFinalPeriod: true,
  });
}
