import {
  parseAutomaticityEvent,
  type AssessmentEvent,
  type AttemptEvent,
} from "./contracts";
import type { PracticeTask } from "./curriculum";
import { resolveRepresentativeTask } from "./representative-tasks";
import {
  CONSTRUCTION_RULE_VERSION,
  constructionFeedback,
  parseConstruction,
} from "./construction-rules";
export function normaliseAnswer(text: string, task: PracticeTask): string {
  let value = text.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (task.normalisation.terminalFullStop)
    value = value.replace(/(?<!\.)\.$/u, "");
  return value;
}
/** Practice feedback is independent of approved mastery/evaluator scope. */
export function assessControlledTask(
  attempt: AttemptEvent,
  task: PracticeTask,
  at: string,
  id: string,
): AssessmentEvent {
  const english = attempt.language === "en";
  const base: AssessmentEvent = {
    version: 2,
    type: "assessment",
    id,
    language: attempt.language,
    at,
    attemptId: attempt.id,
    responseSha256: attempt.response.sha256,
    taskVersion: task.version,
    rubricVersion: task.rubricVersion,
    verdict: "not_assessed",
    dimensions: {
      grammar: "unknown",
      target: "unknown",
      relevance: "unknown",
      opportunities: null,
    },
    evaluator: {
      id: "controlled-answer",
      version: "1.0.0",
      kind: "rule",
      scopeApproved: false,
      reviewId: null,
    },
    uncertainty: true,
    confidence: null,
    feedback: english
      ? "Saved for practice. This open response needs a suitable grammar review before it can count as checked evidence."
      : "Als Übung gespeichert. Diese offene Antwort benötigt eine passende Grammatikprüfung, bevor sie als geprüfter Nachweis zählt.",
    correction: null,
    spans: [],
    supersedes: null,
  };
  const identityKeys = [
    "id",
    "version",
    "constructionId",
    "familyId",
    "rubricVersion",
    "stage",
    "modality",
    "partition",
    "itemFamily",
    "contextId",
    "transferCondition",
    "contentReview",
  ] as const;
  if (
    !task.constructionId.startsWith(attempt.language + ".") ||
    identityKeys.some((key) => attempt.task[key] !== task[key])
  ) {
    base.feedback = english
      ? "Saved without a score: the response and task identities do not match. Request a review."
      : "Ohne Bewertung gespeichert: Antwort und Aufgabenkennung passen nicht zusammen. Bitte prüfen lassen.";
    return base;
  }
  if (task.modality === "speaking") {
    base.feedback = english
      ? "Saved for review of the original recording. Typed text cannot establish spoken accuracy."
      : "Zur Prüfung der Originalaufnahme gespeichert. Getippter Text belegt keine mündliche Richtigkeit.";
    return base;
  }
  if (!attempt.response.text.trim()) {
    base.feedback = english
      ? "Add your own response before checking."
      : "Ergänze zuerst deine eigene Antwort.";
    return base;
  }
  if (task.constructionAssessment) {
    const resolved = resolveRepresentativeTask(task);
    base.evaluator = {
      id: "representative-construction",
      version: CONSTRUCTION_RULE_VERSION,
      kind: "rule",
      scopeApproved: false,
      reviewId: null,
    };
    if (!resolved || !resolved.scope.rule.startsWith(attempt.language + ".")) {
      base.feedback = english
        ? "Saved without a score: this task does not match the checker version. Request a review."
        : "Ohne Bewertung gespeichert: Diese Aufgabe passt nicht zur Prüfer-Version. Bitte prüfen lassen.";
      return base;
    }
    if (task.constructionAssessment.route === "human_review") {
      base.feedback = english
        ? "Saved for review. Check the requested pattern, who does what, and whether the meaning fits the situation. For speech, a reviewer must listen to the original recording; typed text cannot establish spoken accuracy."
        : "Zur Prüfung gespeichert. Prüfe das gefragte Muster, die Rollen und die Bedeutung im Kontext. Bei einer Sprechaufgabe muss eine prüfende Person die Originalaufnahme anhören; getippter Text belegt keine mündliche Richtigkeit.";
      return base;
    }
    const value = normaliseAnswer(attempt.response.text, task);
    const parsed = parseConstruction(resolved.scope.rule, value);
    if (!parsed) {
      base.feedback = english
        ? "This wording is outside the checker's supported sentence patterns. It may be correct. Saved without a score; request a review."
        : "Diese Formulierung liegt außerhalb der unterstützten Satzmuster. Sie kann richtig sein. Ohne Bewertung gespeichert; bitte prüfen lassen.";
      return base;
    }
    const relevant =
      JSON.stringify(parsed.frame) ===
      JSON.stringify(resolved.scope.scenarios[resolved.scenario].frame);
    const error =
      parsed.grammarError ??
      (value !== parsed.canonical ? "capitalization" : null);
    base.dimensions = {
      grammar: error ? "fail" : "pass",
      target: parsed.target ? "observed" : "not_observed",
      relevance: relevant ? "pass" : "fail",
      opportunities: 1,
    };
    base.verdict =
      error || !relevant
        ? "needs_repair"
        : parsed.target
          ? "pass"
          : "target_not_observed";
    base.uncertainty = false;
    base.feedback = constructionFeedback(
      error ?? (!relevant ? "relevance" : !parsed.target ? "target" : "pass"),
      attempt.language,
    );
    return parseAutomaticityEvent(base, attempt.language) as AssessmentEvent;
  }
  if (task.answerPolicy !== "closed") return base;
  const value = normaliseAnswer(attempt.response.text, task);
  const accepted = task.acceptedAnswers.some(
    (answer) => normaliseAnswer(answer, task) === value,
  );
  if (accepted) {
    base.verdict = "pass";
    base.uncertainty = false;
    base.dimensions = {
      grammar: "pass",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    };
    base.feedback = english
      ? "This matches an accepted form for this controlled task. Now use the pattern in your own words."
      : "Diese Antwort entspricht einer zulässigen Form der kontrollierten Aufgabe. Verwende das Muster nun mit eigenen Worten.";
  } else {
    const caseOnly = task.acceptedAnswers.some(
      (answer) =>
        normaliseAnswer(answer, task).toLocaleLowerCase(attempt.language) ===
        value.toLocaleLowerCase(attempt.language),
    );
    if (caseOnly && task.modality === "writing") {
      base.verdict = "needs_repair";
      base.uncertainty = false;
      base.dimensions = {
        grammar: "fail",
        target: "observed",
        relevance: "pass",
        opportunities: 1,
      };
      base.feedback = english
        ? "Check the capitalization, including sentence starts and names."
        : "Prüfe die Groß- und Kleinschreibung, besonders am Satzanfang und bei Nomen.";
    } else
      base.feedback = english
        ? "Your answer differs from the stored forms. It has been saved without a correctness score. Compare the meaning or request a review; a different correct answer should not be marked wrong."
        : "Deine Antwort unterscheidet sich von den gespeicherten Formen. Sie wurde ohne Richtigkeitswert gespeichert. Vergleiche die Bedeutung oder lasse sie prüfen; eine andere richtige Antwort soll nicht als falsch gelten.";
  }
  return parseAutomaticityEvent(base, attempt.language) as AssessmentEvent;
}
export interface ModelScopeApproval {
  evaluatorId: string;
  evaluatorVersion: string;
  language: "en" | "de";
  constructionIds: string[];
  rubricVersions: string[];
  modalities: ("writing" | "speaking")[];
  /** Exact tuples prevent approval crossing content versions or scope combinations. */
  scopes: {
    constructionId: string;
    taskVersion: string;
    rubricVersion: string;
    modality: "writing" | "speaking";
  }[];
  benchmarkSha256: string;
  approved: boolean;
}
/** Only pinned, separately benchmarked scopes may enter the evidence reducer. */
export function validateModelAssessment(
  proposal: unknown,
  attempt: AttemptEvent,
  approval: ModelScopeApproval,
): AssessmentEvent {
  const parsed = parseAutomaticityEvent(proposal, attempt.language);
  if (
    parsed.type !== "assessment" ||
    parsed.evaluator.kind !== "transformer" ||
    parsed.attemptId !== attempt.id ||
    parsed.responseSha256 !== attempt.response.sha256 ||
    parsed.taskVersion !== attempt.task.version ||
    parsed.rubricVersion !== attempt.task.rubricVersion ||
    parsed.spans.some((span) => span.end > attempt.response.text.length)
  )
    throw new Error("Model response does not match the original attempt.");
  if (
    !approval.approved ||
    approval.language !== attempt.language ||
    approval.evaluatorId !== parsed.evaluator.id ||
    approval.evaluatorVersion !== parsed.evaluator.version ||
    !approval.constructionIds.includes(attempt.task.constructionId) ||
    !approval.rubricVersions.includes(attempt.task.rubricVersion) ||
    !approval.modalities.includes(attempt.task.modality) ||
    !approval.scopes?.some(
      (scope) =>
        scope.constructionId === attempt.task.constructionId &&
        scope.taskVersion === attempt.task.version &&
        scope.rubricVersion === attempt.task.rubricVersion &&
        scope.modality === attempt.task.modality,
    ) ||
    !/^[a-f0-9]{64}$/.test(approval.benchmarkSha256)
  )
    throw new Error("This model scope has not passed its benchmark gate.");
  if (
    parsed.verdict === "pass" &&
    (parsed.dimensions.grammar !== "pass" ||
      parsed.dimensions.target !== "observed" ||
      parsed.dimensions.relevance !== "pass" ||
      parsed.uncertainty)
  )
    throw new Error(
      "A passing model judgment needs consistent target, meaning and grammar evidence.",
    );
  return {
    ...parsed,
    evaluator: {
      ...parsed.evaluator,
      scopeApproved: true,
      reviewId: approval.benchmarkSha256,
    },
  };
}
