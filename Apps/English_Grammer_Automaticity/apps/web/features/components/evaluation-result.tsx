"use client";

import { ExternalLink, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Evaluation } from "@/lib/assessment";
import { issueType } from "@/lib/assessment";
import { speak } from "@/lib/speech";

export function EvaluationResult({ evaluation }: { evaluation: Evaluation }) {
  const issues = [...evaluation.spelling, ...evaluation.grammarIssues];
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
        <div className="evaluation-check">
          {evaluation.online ? "✓ Verified" : "○ Pending"} Online evaluation
        </div>
        <div className="evaluation-check">
          {evaluation.spelling.length === 0 ? "✓" : "✗"} Spelling
        </div>
        <div className="evaluation-check">
          {evaluation.grammarIssues.length === 0 ? "✓" : "✗"} Grammar
        </div>
        <div className="evaluation-check">
          {evaluation.targetUses >= evaluation.required ? "✓" : "✗"} Target
          structure ({evaluation.targetUses}/{evaluation.required})
        </div>
        <div className="evaluation-check">
          {evaluation.complete ? "✓" : "✗"} Complete
        </div>
        <div className="evaluation-check">
          {evaluation.relevant ? "✓" : "✗"} Answers the task
        </div>
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
        <strong>Corrected answer:</strong> {evaluation.corrected}
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
      <div className="mt-3 space-y-3 rounded-xl border bg-slate-50/80 p-3 text-sm leading-6">
        <div>
          <strong>Conversation feedback</strong>
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
      <div className="mt-3 rounded-xl border bg-white/80 p-3 text-sm">
        <p className="font-semibold">Step 3 Part B (JSON):</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
{JSON.stringify(evaluation.conversationFeedback.partB, null, 2)}
        </pre>
      </div>
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
          <strong>Task alignment:</strong> Answer the actual prompt with varied,
          original content. Repeated filler words and unrelated text do not
          count.
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
