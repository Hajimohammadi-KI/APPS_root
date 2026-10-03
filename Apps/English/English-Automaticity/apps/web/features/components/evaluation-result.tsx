"use client";

import { ExternalLink, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Evaluation } from "@/lib/assessment";
import { issueType } from "@/lib/assessment";
import { speak } from "@/lib/speech";

export function EvaluationResult({ evaluation }: { evaluation: Evaluation }) {
  const issues = [...evaluation.spelling, ...evaluation.grammarIssues];
  const checks = [
    {
      label: evaluation.online
        ? "○ LanguageTool service reached"
        : "✗ LanguageTool unavailable",
      reason: evaluation.checkReasons.online,
      failed: !evaluation.online,
    },
    {
      label: `${evaluation.spelling.length === 0 ? "○" : "✗"} ${evaluation.spelling.length === 0 ? "No spelling issue detected" : "Spelling issue found"}`,
      reason: evaluation.checkReasons.spelling,
      failed: evaluation.spelling.length > 0,
    },
    {
      label: `${evaluation.grammarIssues.length === 0 ? "○" : "✗"} ${evaluation.grammarIssues.length === 0 ? "No grammar issue detected" : "Grammar issue found"}`,
      reason: evaluation.checkReasons.grammar,
      failed: evaluation.grammarIssues.length > 0,
    },
    {
      label: `${evaluation.targetUses >= evaluation.required ? "✓" : "✗"} Target structure (${evaluation.targetUses}/${evaluation.required})`,
      reason: evaluation.checkReasons.target,
      failed: evaluation.targetUses < evaluation.required,
    },
    {
      label: `${evaluation.complete ? "✓" : "✗"} Minimum length`,
      reason: evaluation.checkReasons.complete,
      failed: !evaluation.complete,
    },
    {
      label: `${evaluation.relevant ? "✓" : "✗"} Answers the task`,
      reason: evaluation.checkReasons.relevant,
      failed: !evaluation.relevant,
    },
  ];
  return (
    <section
      aria-live="polite"
      className={`evaluation ${evaluation.pass ? "pass" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-extrabold">
          {evaluation.masteryEligible && evaluation.pass
            ? "✓ Answer verified"
            : evaluation.pass
              ? "✓ Practice answer ready"
              : "✗ Improve before continuing"}
        </h3>
        <Badge
          variant={
            evaluation.masteryEligible && evaluation.pass
              ? "success"
              : evaluation.pass
                ? "secondary"
                : "destructive"
          }
        >
          {evaluation.online ? "Online check" : "Practice"}{" "}
          {evaluation.accuracyScore}%
        </Badge>
      </div>
      <div className="evaluation-checks">
        {checks.map((check) => (
          <div
            className={`evaluation-check ${check.failed ? "evaluation-check-failed" : ""}`}
            key={check.label}
          >
            <strong>{check.label}</strong>
            <span>{check.reason}</span>
          </div>
        ))}
      </div>
      {!evaluation.online ? (
        <p className="blocking-notice">
          <strong>Offline practice check.</strong>{" "}
          {evaluation.pass
            ? "You can continue practicing. This attempt updates mastery or CEFR evidence only after an online language check."
            : "Fix the visible offline issue first. This attempt does not change mastery or CEFR evidence."}
        </p>
      ) : null}
      {issues.length > 0 ? (
        <div className="mt-3">
          <h4 className="font-bold">Exact issues and reasons</h4>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
            {issues.map((issue, index) => (
              <li key={`${issue.offset}-${index}`}>
                <strong>{issueType(issue)}:</strong> {issue.message}
                {issue.context?.text ? (
                  <span className="block text-xs text-muted-foreground">
                    “{issue.context.text}”
                  </span>
                ) : null}
                {issue.replacements[0]?.value ? (
                  <span className="block text-xs text-muted-foreground">
                    Suggested form:{" "}
                    <strong>{issue.replacements[0].value}</strong>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 rounded-xl border bg-white/80 p-3 text-sm leading-6">
        <strong>Grammar correction (same intended meaning):</strong>{" "}
        {evaluation.corrected}
        <Button
          className="ml-2"
          onClick={() => speak(evaluation.corrected)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Volume2 aria-hidden className="size-4" />
          Listen
        </Button>
      </div>
      {evaluation.correctionReview ? (
        <div className="mt-3 rounded-xl border bg-amber-50/70 p-3 text-sm leading-6">
          <p className="font-semibold">Correction review:</p>
          <p>
            <strong>Learner sentence:</strong> {evaluation.correctionReview.learnerSentence}
          </p>
          <p>
            <strong>Corrected sentence:</strong> {evaluation.correctionReview.correctedSentence}
          </p>
          <p>
            <strong>Mistake type:</strong> {evaluation.correctionReview.mistakeType}
          </p>
          <p>
            <strong>Explanation:</strong> {evaluation.correctionReview.explanation}
          </p>
        </div>
      ) : null}
      {evaluation.taskExample ? (
        <div className="mt-3 rounded-xl border border-violet-400 bg-violet-50/80 p-3 text-sm leading-6">
          <strong>Example that answers this task:</strong>{" "}
          {evaluation.taskExample}
        </div>
      ) : null}
      <div className="mt-3 space-y-3 rounded-xl border bg-slate-50/80 p-3 text-sm leading-6">
        <div>
          <strong>Language feedback</strong>
        </div>
        <div>
          <p className="font-semibold">Pronunciation:</p>
          <ul className="list-disc pl-5">
            {evaluation.conversationFeedback.pronunciation.map((line, index) => (
              <li key={`pronunciation-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Word choice:</p>
          <ul className="list-disc pl-5">
            {evaluation.conversationFeedback.wordChoice.map((line, index) => (
              <li key={`word-choice-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Grammar:</p>
          <ul className="list-disc pl-5">
            {evaluation.conversationFeedback.grammar.map((line, index) => (
              <li key={`grammar-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      <details className="mt-3 rounded-xl border bg-white/80 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">
          More feedback for the next attempt
        </summary>
        <div className="mt-3 grid gap-2 leading-6">
          <p>
            <strong>Pronunciation:</strong>{" "}
            {evaluation.conversationFeedback.partB.pronunciation_feedback}
          </p>
          <p>
            <strong>Word choice:</strong>{" "}
            {evaluation.conversationFeedback.partB.word_choice_feedback}
          </p>
          <p>
            <strong>Grammar:</strong>{" "}
            {evaluation.conversationFeedback.partB.grammar_feedback}
          </p>
          <p>
            <strong>Next step:</strong>{" "}
            {evaluation.conversationFeedback.partB.next_step}
          </p>
        </div>
      </details>
      {evaluation.targetUses < evaluation.required ? (
        <p className="mt-3 text-sm">
          <strong>Missing target structure:</strong> Use "
          {evaluation.grammar.title}" before completing this task.
        </p>
      ) : null}
      {!evaluation.complete ? (
        <p className="mt-3 text-sm">
          <strong>Content:</strong> Write a complete English answer that solves
          the task and stays on topic.
        </p>
      ) : null}
      {!evaluation.relevant ? (
        <p className="mt-3 text-sm">
          <strong>Why it does not answer the task:</strong>{" "}
          {evaluation.checkReasons.relevant}
        </p>
      ) : null}
      {evaluation.links.length > 0 ? (
        <div className="resource-links">
          {evaluation.links.map((link) => (
            <Button
              asChild
              key={`${link[0]}-${link[1]}`}
              size="sm"
              variant="outline"
            >
              <a href={link[1]} rel="noreferrer" target="_blank">
                {link[0]}
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
