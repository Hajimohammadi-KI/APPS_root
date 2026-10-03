"use client";

import * as React from "react";
import { Check, CircleAlert, RotateCcw, Volume2 } from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/features/components/evaluation-result";
import { recalculateMastery, useAppStore } from "@/features/store/app-store";
import { evaluateResponse, type Evaluation } from "@/lib/assessment";
import { speak } from "@/lib/speech";
import { requiredFirst } from "@/lib/utils";

const defaultGrammar = requiredFirst(grammarUnits, "Grammar catalog");

function errorClassLabel(value: string) {
  const labels: Record<string, string> = {
    grammar: "Grammar",
    other: "Other error",
    punctuation: "Punctuation",
    spelling: "Spelling",
    vocabulary: "Vocabulary",
    word_order: "Word order",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function repairStatusLabel(value: string) {
  const labels: Record<string, string> = {
    fixed: "Fixed",
    improving: "Improving",
    scheduled: "Scheduled",
  };
  return labels[value] ?? value;
}

export function ErrorsScreen() {
  const { state, mutate, recordAttempt } = useAppStore();
  const [filter, setFilter] = React.useState("active");
  const [selectedId, setSelectedId] = React.useState(state.errors[0]?.id ?? "");
  const [repair, setRepair] = React.useState("");
  const [checks, setChecks] = React.useState([false, false]);
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(null);
  const [loading, setLoading] = React.useState(false);
  const errors = state.errors
    .filter((error) => filter === "all" || error.repairStatus !== "fixed")
    .toSorted((a, b) => b.occurrenceCount - a.occurrenceCount);
  const selected = errors.find((error) => error.id === selectedId) ?? errors[0];

  React.useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  React.useEffect(() => {
    setRepair("");
    setChecks([false, false]);
    setEvaluation(null);
  }, [selectedId]);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Error Workshop</h1>
          <p>
            Personal language errors are organized, merged, and re-practiced as
            correction, explanation, review, and transfer.
          </p>
        </div>
        <Badge variant={errors.length > 0 ? "warning" : "success"}>
          {errors.length} {filter === "all" ? "saved" : "active"}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="max-w-xs field-stack">
            <Label htmlFor="error-filter">Show errors</Label>
            <Select
              id="error-filter"
              name="error-filter"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              <option value="active">Active repair tasks</option>
              <option value="all">All saved errors</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selected ? (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-2">
            {errors.map((error) => (
              <button
                className="error-card w-full text-left"
                key={error.id}
                onClick={() => setSelectedId(error.id)}
                style={{
                  borderColor:
                    error.id === selected.id ? "var(--primary)" : undefined,
                  background: error.id === selected.id ? "#edf4ff" : undefined,
                }}
                type="button"
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{error.topic}</strong>
                  <Badge
                    variant={
                      error.occurrenceCount >= 3 ? "destructive" : "secondary"
                    }
                  >
                    ×{error.occurrenceCount}
                  </Badge>
                </span>
                <span className="mt-2 block text-xs font-bold text-primary">
                  {errorClassLabel(error.errorClass)}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                  {error.explanation}
                </span>
              </button>
            ))}
          </aside>

          <section className="page-stack">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge
                      variant={
                        selected.occurrenceCount >= 3
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {errorClassLabel(selected.errorClass)}
                    </Badge>
                    <CardTitle className="mt-2">{selected.topic}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {repairStatusLabel(selected.repairStatus)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-bold uppercase text-red-700">
                      Original
                    </p>
                    <p className="mt-1 text-sm">{selected.originalText}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-700">
                      Corrected
                    </p>
                    <p className="mt-1 text-sm">{selected.correctedText}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6">
                  <strong>Reason:</strong> {selected.explanation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Repair Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="mb-4 grid gap-2 text-sm md:grid-cols-3">
                  {[
                    "1. Read and understand",
                    "2. Listen and repeat",
                    "3. Rephrase",
                    "4. Use it in a new context",
                    "5. Pass online evaluation",
                    "6. Review later",
                  ].map((step) => (
                    <li
                      className="rounded-xl border bg-slate-50 p-2"
                      key={step}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
                <Button
                  onClick={() => speak(selected.correctedText)}
                  variant="secondary"
                >
                  <Volume2 aria-hidden className="size-4" />
                  Listen and repeat
                </Button>
                <Textarea
                  aria-label="New repair sentence"
                  autoComplete="off"
                  className="mt-3"
                  name="error-repair-sentence"
                  onChange={(event) => setRepair(event.target.value)}
                  placeholder="Write a new English sentence with the corrected structure in a different context."
                  value={repair}
                />
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {[
                    "I repeated the corrected form out loud.",
                    "This is a new context, not a copy.",
                  ].map((label, index) => (
                    <label
                      className="flex gap-2 rounded-xl border p-3 text-sm"
                      key={label}
                    >
                      <input
                        checked={checks[index]}
                        onChange={(event) =>
                          setChecks((current) => {
                            const next = [...current];
                            next[index] = event.target.checked;
                            return next;
                          })
                        }
                        type="checkbox"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={loading}
                    onClick={async () => {
                      const grammar =
                        grammarUnits.find(
                          (unit) => unit.title === selected.grammarTitle,
                        ) ?? defaultGrammar;
                      setLoading(true);
                      const result = await evaluateResponse(
                        repair,
                        {
                          grammar,
                          minWords: 5,
                          requiredTargetUses: 0,
                          taskPrompt:
                            "Write a fresh sentence that uses the corrected structure in a new context.",
                        },
                        state.settings,
                      );
                      setLoading(false);
                      setEvaluation(result);
                      recordAttempt({
                        grammarTitle: selected.grammarTitle,
                        mode: "repair",
                        inputText: repair,
                        correctedText: result.corrected,
                        targetHit: result.complete,
                        accuracyScore: result.accuracyScore,
                        fluencyScore: 0,
                        latencyMs: null,
                        passed: result.masteryEligible && checks.every(Boolean),
                        verified: result.masteryEligible,
                      });
                      if (result.pass && checks.every(Boolean)) {
                        mutate((draft) => {
                          const error = draft.errors.find(
                            (item) => item.id === selected.id,
                          );
                          if (error) {
                            error.repairStatus =
                              error.occurrenceCount >= 3
                                ? "improving"
                                : "fixed";
                            error.nextRepairAt = Date.now() + 3 * 86_400_000;
                          }
                          recalculateMastery(draft, selected.grammarTitle);
                        });
                      }
                    }}
                  >
                    <Check aria-hidden className="size-4" />
                    {loading ? "Evaluating..." : "Evaluate repair"}
                  </Button>
                  <Button
                    onClick={() => {
                      setRepair("");
                      setEvaluation(null);
                    }}
                    variant="outline"
                  >
                    <RotateCcw aria-hidden className="size-4" />
                    New attempt
                  </Button>
                </div>
                {evaluation ? (
                  <EvaluationResult evaluation={evaluation} />
                ) : null}
                {evaluation?.pass && !checks.every(Boolean) ? (
                  <p className="blocking-notice mt-3">
                    The sentence is correct, but both repair confirmations are
                    still required.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleAlert aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No errors in this view</EmptyTitle>
                <EmptyDescription>
                  Evaluated writing and speaking tasks automatically fill the
                  error workshop.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
