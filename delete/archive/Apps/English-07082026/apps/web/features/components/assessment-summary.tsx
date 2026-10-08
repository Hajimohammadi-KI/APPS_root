"use client";

import { ExternalLink, Volume2 } from "lucide-react";
import type { EvaluationResult } from "@/lib/assessment";
import { issueType } from "@/lib/assessment";
import { speakText } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function CorrectedText({
  corrected,
  original,
}: {
  corrected: string;
  original: string;
}) {
  const originalWords = original.split(/\s+/);
  return corrected.split(/\s+/).map((word, index) => (
    <span
      className={cn(
        originalWords[index] !== word &&
          "font-black text-red-700 underline decoration-2",
      )}
      key={`${word}-${index}`}
    >
      {word}{" "}
    </span>
  ));
}

export function AssessmentSummary({ result }: { result: EvaluationResult }) {
  const issues = [...result.spelling, ...result.grammarIssues];
  return (
    <section
      className={cn(
        "mt-3 rounded-xl border border-l-[5px] bg-white p-4",
        result.pass
          ? "border-emerald-300 border-l-emerald-600 bg-emerald-50/60"
          : "border-red-200 border-l-red-700 bg-red-50/60",
      )}
      data-assessment={result.pass ? "pass" : "fail"}
    >
      <h4 className="mb-3 font-black">
        {result.pass ? "✓ Answer accepted" : "✗ Answer not accepted"}
      </h4>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Check ok={result.online} text="Online evaluation" />
        <Check ok={result.spelling.length === 0} text="Spelling" />
        <Check ok={result.grammarIssues.length === 0} text="Grammar" />
        <Check
          ok={result.targetUses >= result.required}
          text={`Target structure (${result.targetUses}/${result.required})`}
        />
        <Check ok={result.complete} text="Complete and relevant" />
      </div>

      {result.online ? null : (
        <p className="mt-3 rounded-lg bg-red-100 p-3 text-sm font-bold text-red-900">
          Evaluation was interrupted. This task remains locked. Check API and
          internet connection, then try again.
        </p>
      )}

      {issues.length ? (
        <div className="mt-4">
          <h5 className="font-black">Exact issues and reasons</h5>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
            {issues.map((issue, index) => (
              <li key={`${issue.offset}-${issue.rule?.id}-${index}`}>
                <b>{issueType(issue)}:</b> {issue.message}
                {issue.context?.text ? (
                  <span className="block text-xs text-slate-500">
                    “{issue.context.text}”
                  </span>
                ) : null}
                {issue.replacements[0]?.value ? (
                  <span className="block text-xs text-slate-600">
                    Suggested form: <b>{issue.replacements[0].value}</b>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-3 text-sm leading-6">
        <b>Corrected answer:</b>{" "}
        <CorrectedText
          corrected={result.corrected}
          original={result.original}
        />
        <Button
          className="ml-2 align-middle"
          onClick={() => speakText(result.corrected)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Volume2 aria-hidden="true" className="size-4" />
          Listen
        </Button>
      </div>

      {result.targetUses < result.required ? (
        <p className="mt-3 text-sm">
          <b>Missing target structure:</b> Use "{result.grammar.title}" before
          completing this task.
        </p>
      ) : null}
      {!result.complete ? (
        <p className="mt-3 text-sm">
          <b>Content:</b> Write a complete English answer
          {result.relevant ? "." : " and stay on the required topic."}
        </p>
      ) : null}

      {result.links.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.links.map(([label, url]) => (
            <Button asChild key={`${label}-${url}`} size="sm" variant="outline">
              <a href={url} rel="noreferrer" target="_blank">
                {label}: {result.grammar.title}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-bold">
      {ok ? "✓" : "✗"} {text}
    </div>
  );
}
