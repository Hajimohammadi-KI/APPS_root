import { isRecord, type AssessmentEvent, type AttemptEvent } from "./contracts";

export interface GrammarIssue {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  category: string;
}
export interface GrammarFeedback {
  original: string;
  corrected: string;
  provider: "LanguageTool";
  checkedAt: string;
  issues: GrammarIssue[];
}
const boundedText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max;

/** Missing/malformed upstream data must never look like a clean grammar check. */
export function parseGrammarProvider(
  raw: unknown,
  original: string,
): GrammarFeedback {
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.matches) ||
    raw.matches.length > 1000
  )
    throw new Error("Invalid grammar provider response");
  const issues: GrammarIssue[] = raw.matches.map((item: unknown) => {
    if (
      !isRecord(item) ||
      !boundedText(item.message, 10000) ||
      !Number.isSafeInteger(item.offset) ||
      !Number.isSafeInteger(item.length) ||
      (item.offset as number) < 0 ||
      (item.length as number) < 0 ||
      (item.offset as number) + (item.length as number) > original.length ||
      !Array.isArray(item.replacements) ||
      item.replacements.length > 1000
    )
      throw new Error("Invalid grammar issue");
    const replacements = item.replacements
      .map((replacement: unknown) => {
        if (!isRecord(replacement) || !boundedText(replacement.value, 10000))
          throw new Error("Invalid grammar replacement");
        return replacement.value;
      })
      .slice(0, 3);
    const rule = isRecord(item.rule) ? item.rule : {};
    const category = isRecord(rule.category) ? rule.category : {};
    return {
      message: item.message,
      offset: item.offset as number,
      length: item.length as number,
      replacements,
      ruleId: boundedText(rule.id, 500) ? rule.id : "unknown",
      category: boundedText(category.name, 500) ? category.name : "Language",
    };
  });
  let corrected = original,
    boundary = original.length + 1;
  for (const issue of [...issues].sort((a, b) => b.offset - a.offset)) {
    if (
      !issue.replacements.length ||
      issue.offset + issue.length > boundary ||
      issue.offset === boundary
    )
      continue;
    corrected =
      corrected.slice(0, issue.offset) +
      issue.replacements[0]! +
      corrected.slice(issue.offset + issue.length);
    boundary = issue.offset;
  }
  return {
    original,
    corrected,
    provider: "LanguageTool",
    checkedAt: new Date().toISOString(),
    issues,
  };
}

export function parseGrammarFeedback(
  raw: unknown,
  original: string,
): GrammarFeedback {
  if (
    !isRecord(raw) ||
    raw.original !== original ||
    raw.provider !== "LanguageTool" ||
    !boundedText(raw.corrected, 100000) ||
    typeof raw.checkedAt !== "string" ||
    !Number.isFinite(Date.parse(raw.checkedAt)) ||
    !Array.isArray(raw.issues) ||
    raw.issues.length > 1000
  )
    throw new Error("Grammar feedback does not match the saved response");
  const checked = parseGrammarProvider(
    {
      matches: raw.issues.map((item: unknown) => {
        if (!isRecord(item) || !Array.isArray(item.replacements))
          throw new Error("Invalid grammar feedback");
        return {
          ...item,
          replacements: item.replacements.map((value) => ({ value })),
          rule: { id: item.ruleId, category: { name: item.category } },
        };
      }),
    },
    original,
  );
  if (checked.corrected !== raw.corrected)
    throw new Error("Inconsistent grammar correction");
  return { ...checked, checkedAt: raw.checkedAt };
}

/** Text-only suggestions also help with transcripts, but never assess the recording. */
export function grammarFeedbackAssessment(
  attempt: AttemptEvent,
  result: GrammarFeedback,
  at: string,
  id: string,
  supersedes: string | null,
): AssessmentEvent {
  if (result.original !== attempt.response.text)
    throw new Error("Only the original response can receive text feedback");
  const en = attempt.language === "en";
  const spoken = attempt.task.modality === "speaking";
  const heading = spoken
    ? en
      ? "Suggestions for the typed transcript only. The recording was not sent or assessed; spoken grammar, pronunciation and fluency still need an audio review."
      : "Vorschläge nur zum getippten Transkript. Die Aufnahme wurde weder gesendet noch bewertet; gesprochene Grammatik, Aussprache und Flüssigkeit benötigen eine Audioprüfung."
    : en
      ? "Online proofreading suggestions; target use and meaning still need review."
      : "Online-Korrekturvorschläge; Zielstruktur und Bedeutung müssen noch geprüft werden.";
  return {
    version: 2,
    type: "assessment",
    id,
    language: attempt.language,
    at,
    attemptId: attempt.id,
    responseSha256: attempt.response.sha256,
    taskVersion: attempt.task.version,
    rubricVersion: attempt.task.rubricVersion,
    verdict: "not_assessed",
    dimensions: {
      grammar: "unknown",
      target: "unknown",
      relevance: "unknown",
      opportunities: null,
    },
    evaluator: {
      id: spoken ? "languagetool-transcript" : "languagetool-proofreading",
      version: "1",
      kind: "rule",
      scopeApproved: false,
      reviewId: null,
    },
    uncertainty: true,
    confidence: null,
    feedback:
      heading +
      " " +
      (result.issues.length
        ? result.issues.map((issue) => issue.message).join("\n")
        : en
          ? "The checker found no suggestions. This is not a verified pass."
          : "Das Prüfprogramm hat keine Vorschläge gefunden. Das ist kein bestätigtes Bestehen."),
    correction: result.corrected === result.original ? null : result.corrected,
    spans: result.issues.map((issue) => ({
      start: issue.offset,
      end: issue.offset + issue.length,
      explanation: issue.message,
    })),
    supersedes,
  };
}
