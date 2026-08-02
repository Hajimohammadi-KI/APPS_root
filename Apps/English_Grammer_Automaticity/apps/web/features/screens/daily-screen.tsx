"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Flame,
  MessageCircleMore,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/features/components/evaluation-result";
import {
  adaptiveReviewInterval,
  currentDailyPlan,
  recalculateMastery,
  useAppStore,
  type AttemptMode,
} from "@/features/store/app-store";
import {
  classifyError,
  evaluateResponse,
  type Evaluation,
} from "@/lib/assessment";
import { speak } from "@/lib/speech";
import { makeId, requiredFirst, todayKey } from "@/lib/utils";

const stepInfo = [
  [
    "Active rule recall",
    "Explain from memory when and how this grammar is used.",
  ],
  [
    "Build three sentences",
    "Write three complete personal sentences using today's target grammar.",
  ],
  [
    "Coach conversation",
    "Complete one fully evaluated spoken or written answer in the studio.",
  ],
] as const;
const defaultGrammar = requiredFirst(grammarUnits, "Grammar catalog");

export function DailyScreen({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const { state, mutate, recordAttempt } = useAppStore();
  const grammar =
    grammarUnits.find((unit) => unit.title === state.todayGrammar?.title) ??
    defaultGrammar;
  const plan = currentDailyPlan(state);
  const [answers, setAnswers] = React.useState<Record<string, string>>(
    plan.answers,
  );
  const [results, setResults] = React.useState<
    Record<string, Evaluation | Evaluation[]>
  >({});
  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState("");
  const due = state.reviews
    .filter(
      (review) => review.status === "pending" && review.dueAt <= Date.now(),
    )
    .toSorted((a, b) => a.dueAt - b.dueAt);
  const [sessionTarget, setSessionTarget] = React.useState<1 | 2 | 3>(
    () => {
      const latest = Object.entries(state.activity)
        .filter(([, count]) => count > 0)
        .map(([date]) => date)
        .sort()
        .at(-1);
      if (!latest) return 3;
      const daysAway = Math.floor(
        (new Date(`${todayKey()}T12:00:00`).valueOf() -
          new Date(`${latest}T12:00:00`).valueOf()) /
          86_400_000,
      );
      return daysAway >= 2 ? 2 : 3;
    },
  );
  const lastError = state.errors.toSorted((a, b) =>
    b.lastSeenAt.localeCompare(a.lastSeenAt),
  )[0];
  const original = lastError?.originalText ?? "She don't work here.";
  const corrected = lastError?.correctedText ?? "She doesn't work here.";
  const controlled = grammar.exercises[0] ?? [
    "Explain the rule.",
    grammar.rule,
  ];
  const review = due[0];
  const progress = Math.round((plan.completed.length / 3) * 100);
  const sessionCompleted = plan.completed.filter(
    (step) => step < sessionTarget,
  ).length;

  React.useEffect(() => {
    setAnswers(plan.answers);
  }, [state.todayGrammar?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAnswer = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    mutate((draft) => {
      const daily = draft.dailyPlans[todayKey()] ?? {
        completed: [],
        answers: {},
      };
      daily.answers[key] = value;
      draft.dailyPlans[todayKey()] = daily;
    });
  };

  const completeStep = (index: number) => {
    mutate((draft) => {
      const daily = draft.dailyPlans[todayKey()] ?? {
        completed: [],
        answers: {},
      };
      if (!daily.completed.includes(index)) daily.completed.push(index);
      draft.dailyPlans[todayKey()] = daily;
      draft.activity[todayKey()] = daily.completed.length;
    });
  };

  const record = (
    evaluation: Evaluation,
    mode: AttemptMode,
    topic = grammar.title,
  ) => {
    recordAttempt({
      grammarTitle: grammar.title,
      mode,
      inputText: evaluation.original,
      correctedText: evaluation.corrected,
      targetHit: evaluation.targetUses >= evaluation.required,
      accuracyScore: evaluation.accuracyScore,
      fluencyScore: 0,
      latencyMs: null,
      passed: evaluation.masteryEligible && evaluation.pass,
      verified: evaluation.masteryEligible,
    });
    mutate((draft) => {
      evaluation.matches.forEach((match) => {
        const errorClass = classifyError(match);
        const signature = `${grammar.title}:${errorClass}:${
          match.context?.text ?? evaluation.original
        }`;
        const existing = draft.errors.find((error) => error.id === signature);
        if (existing) {
          existing.occurrenceCount += 1;
          existing.lastSeenAt = new Date().toISOString();
          existing.repairStatus = "scheduled";
          existing.nextRepairAt = Date.now() + 86_400_000;
        } else {
          draft.errors.push({
            id: signature,
            grammarTitle: grammar.title,
            topic,
            errorClass,
            originalText: match.context?.text ?? evaluation.original,
            correctedText: evaluation.corrected,
            explanation: match.message,
            occurrenceCount: 1,
            repairStatus: "scheduled",
            nextRepairAt: Date.now() + 86_400_000,
            lastSeenAt: new Date().toISOString(),
          });
        }
      });
      recalculateMastery(draft, grammar.title);
    });
  };

  const evaluateOne = async (
    resultKey: string,
    value: string,
    options: {
      minWords: number;
      requiredTargetUses: number;
      mode: AttemptMode;
      taskPrompt: string;
    },
  ) => {
    if (!value.trim()) {
      setMessages((current) => ({
        ...current,
        [resultKey]: "Write your own English answer first.",
      }));
      return null;
    }
    setLoading(resultKey);
    const evaluation = await evaluateResponse(
      value.trim(),
      {
        grammar,
        minWords: options.minWords,
        requiredTargetUses: options.requiredTargetUses,
        taskPrompt: options.taskPrompt,
      },
      state.settings,
    );
    setLoading("");
    setResults((current) => ({ ...current, [resultKey]: evaluation }));
    record(evaluation, options.mode);
    if (evaluation.online) speak(evaluation.corrected);
    return evaluation;
  };

  const renderResult = (key: string) => {
    const result = results[key];
    if (!result) return null;
    if (Array.isArray(result)) {
      return (
        <div className="mt-3 space-y-3">
          {result.map((evaluation, index) => (
            <div key={`${key}-${index}`}>
              <p className="mb-1 text-sm font-extrabold">
                Sentence {index + 1}
              </p>
              <EvaluationResult evaluation={evaluation} />
            </div>
          ))}
        </div>
      );
    }
    return <EvaluationResult evaluation={result} />;
  };

  let streak = 0;
  for (let index = 0; index < 365; index++) {
    const date = new Date(Date.now() - index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (state.activity[date]) streak++;
    else if (index > 0) break;
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Daily Automaticity Path</h1>
          <p>
            Three focused tasks for today: grammar, read aloud, then coached
            conversation.
          </p>
        </div>
        <Badge variant={progress === 100 ? "success" : "default"}>
          {plan.completed.length}/3 completed
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Today's grammar focus
              </p>
              <CardTitle className="mt-1">
                {grammar.title} · {grammar.level}
              </CardTitle>
            </div>
            <Button onClick={() => navigate("grammar")} variant="outline">
              Change grammar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <fieldset className="mb-5">
            <legend className="text-sm font-extrabold">
              Choose a realistic session size
            </legend>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              A shorter session counts as a successful return. It does not
              falsely mark the remaining evidence gates as complete.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  [1, "5 min · Rescue"],
                  [2, "10 min · Gentle"],
                  [3, "15 min · Full path"],
                ] as const
              ).map(([target, label]) => (
                <Button
                  aria-pressed={sessionTarget === target}
                  key={target}
                  onClick={() => setSessionTarget(target)}
                  size="sm"
                  type="button"
                  variant={sessionTarget === target ? "default" : "outline"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span>
              Session target: {sessionCompleted}/{sessionTarget}
            </span>
            <strong>
              {sessionCompleted >= sessionTarget
                ? "Session target reached"
                : `${progress}% of full path`}
            </strong>
          </div>
          <Progress
            aria-label={`${sessionCompleted} of ${sessionTarget} selected session steps completed`}
            value={Math.round((sessionCompleted / sessionTarget) * 100)}
          />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {grammar.rule}
          </p>
          {state.settings.movementBreaks && sessionTarget >= 5 ? (
            <p className="mt-3 rounded-xl border bg-secondary p-3 text-sm">
              Movement break: pause for two minutes after step 3, look away from
              the screen, and move before you continue.
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Quick mission</strong>
              <span className="text-muted-foreground">
                Complete 1 speaking turn in Studio
              </span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Recovery mode</strong>
              <span className="text-muted-foreground">
                Finish first {sessionTarget} steps today
              </span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Review pressure</strong>
              <span className="text-muted-foreground">
                {due.length} due review{due.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                30-minute daily protocol
              </p>
              <CardTitle className="mt-1">Core routine for automaticity</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Use this as the default 30-minute shape for steady progress. It is
                a strong routine, not a guarantee.
              </p>
            </div>
            <Button onClick={() => setSessionTarget(5)} variant="outline">
              Start 30-minute session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                title: "Recall",
                minutes: "5 min",
                description: "Say the rule from memory.",
                exercise: `Explain when ${grammar.title} is used before opening any help.`,
                step: "Step 1",
              },
              {
                title: "Writing",
                minutes: "7 min",
                description: "Write two original sentences.",
                exercise: `Write two personal sentences with ${grammar.title} in a new context.`,
                step: "Step 2",
              },
              {
                title: "Speaking",
                minutes: "7 min",
                description: "Answer once in Studio or aloud.",
                exercise: `Open Studio and give one full answer using ${grammar.title}.`,
                step: "Step 3",
              },
              {
                title: "Read aloud",
                minutes: "10 min",
                description: "Read the corrected sentence aloud clearly.",
                exercise: `Read your corrected sentence aloud twice, or record it once and listen back.`,
                step: "Step 2",
              },
              {
                title: "Coach conversation",
                minutes: "8 min",
                description: "Answer once in Studio and submit it.",
                exercise: `Open Studio and give one complete answer using ${grammar.title}.`,
                step: "Step 3",
              },
            ].map(({ title, minutes, description, exercise, step }) => (
              <div key={title} className="rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <strong className="block">{title}</strong>
                  <Badge variant="secondary">{step}</Badge>
                </div>
                <span className="block text-xs font-semibold text-primary">{minutes}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
                <span className="mt-2 block rounded-lg border bg-background/80 p-2 text-xs leading-5 text-foreground">
                  Exercise: {exercise}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="daily-list">
        {stepInfo.map(([title, description], index) => {
          const done = plan.completed.includes(index);
          return (
            <article
              className="daily-step"
              data-done={done}
              data-optional={index >= sessionTarget}
              key={title}
            >
              <header className="daily-step-head">
                <span className="step-number">{index + 1}</span>
                <div>
                  <h2 className="font-extrabold">{title}</h2>
                  <p className="text-xs text-muted-foreground">{description}</p>
                  {index >= sessionTarget ? (
                    <span className="mt-1 inline-block text-xs font-bold text-muted-foreground">
                      Optional in this session
                    </span>
                  ) : null}
                </div>
                {done ? (
                  <CheckCircle2
                    aria-label="Completed"
                    className="size-6 text-emerald-600"
                  />
                ) : (
                  <Button
                    aria-label={`Listen to guidance for ${title}`}
                    onClick={() => speak(description)}
                    size="icon"
                    variant="ghost"
                  >
                    <Volume2 aria-hidden className="size-4" />
                  </Button>
                )}
              </header>
              <div className="daily-step-body">
                {index === 0 ? (
                  <>
                    <Textarea
                      aria-label="Answer for active rule recall"
                      autoComplete="off"
                      name="daily-recall"
                      onChange={(event) =>
                        saveAnswer("recall", event.target.value)
                      }
                      placeholder="Explain the rule in English from memory before opening the grammar lab."
                      value={answers.recall ?? ""}
                    />
                    <Button
                      className="mt-3"
                      disabled={loading === "recall"}
                      onClick={async () => {
                        const result = await evaluateOne(
                          "recall",
                          answers.recall ?? "",
                          {
                            minWords: 8,
                            requiredTargetUses: 0,
                            mode: "recognition",
                            taskPrompt: `Explain the rule for ${grammar.title} from memory.`,
                          },
                        );
                        if (result?.pass) completeStep(0);
                      }}
                    >
                      <Check aria-hidden className="size-4" />
                      {loading === "recall"
                        ? "Evaluating..."
                        : "Evaluate recall"}
                    </Button>
                    {messages.recall ? (
                      <p className="mt-2 text-sm">{messages.recall}</p>
                    ) : null}
                    {renderResult("recall")}
                  </>
                ) : null}

                {index === 1 ? (
                  <>
                    <div className="grid gap-2">
                      {[1, 2, 3].map((number) => (
                        <Input
                          aria-label={`Personal sentence ${number}`}
                          autoComplete="off"
                          key={number}
                          name={`daily-sentence-${number}`}
                          onChange={(event) =>
                            saveAnswer(`sentence${number}`, event.target.value)
                          }
                          placeholder={`My original English sentence ${number}`}
                          value={answers[`sentence${number}`] ?? ""}
                        />
                      ))}
                    </div>
                    <Button
                      className="mt-3"
                      disabled={loading === "sentences"}
                      onClick={async () => {
                        const values = [1, 2, 3].map(
                          (number) =>
                            answers[`sentence${number}`]?.trim() ?? "",
                        );
                        if (values.some((value) => !value)) {
                          setMessages((current) => ({
                            ...current,
                            sentences:
                              "Write all three original English sentences first.",
                          }));
                          return;
                        }
                        setLoading("sentences");
                        const evaluations = await Promise.all(
                          values.map((value) =>
                            evaluateResponse(
                              value,
                              {
                                grammar,
                                minWords: 3,
                                requiredTargetUses: 1,
                                taskPrompt:
                                  "Create an original sentence in a new context.",
                              },
                              state.settings,
                            ),
                          ),
                        );
                        setLoading("");
                        setResults((current) => ({
                          ...current,
                          sentences: evaluations,
                        }));
                        evaluations.forEach((evaluation) =>
                          record(evaluation, "writing"),
                        );
                        if (
                          evaluations.every((evaluation) => evaluation.pass)
                        ) {
                          speak(
                            evaluations
                              .map((evaluation) => evaluation.corrected)
                              .join(". "),
                          );
                          completeStep(1);
                        }
                      }}
                    >
                      <Check aria-hidden className="size-4" />
                      {loading === "sentences"
                        ? "Evaluating three sentences..."
                        : "Evaluate three sentences"}
                    </Button>
                    {messages.sentences ? (
                      <p className="mt-2 text-sm">{messages.sentences}</p>
                    ) : null}
                    {renderResult("sentences")}
                  </>
                ) : null}

                {index === 2 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">
                      {done
                        ? "A passed answer from the conversation studio is saved for today."
                        : "Open the studio, answer from memory, and pass all five criteria."}
                    </p>
                    <Button onClick={() => navigate("studio")}>
                      <MessageCircleMore aria-hidden className="size-4" />
                      Open conversation studio
                    </Button>
                  </div>
                ) : null}

                {index === 3 ? (
                  <>
                    <div className="mb-3 rounded-xl border bg-slate-50 p-3 text-sm leading-6">
                      <span className="text-red-700">{original}</span>
                      <br />→ <strong>{corrected}</strong>
                    </div>
                    <Textarea
                      aria-label="Correction explanation"
                      autoComplete="off"
                      name="daily-correction-explanation"
                      onChange={(event) =>
                        saveAnswer("why", event.target.value)
                      }
                      placeholder="Explain in English the exact change and why it is correct."
                      value={answers.why ?? ""}
                    />
                    <Button
                      className="mt-3"
                      disabled={loading === "why"}
                      onClick={async () => {
                        const result = await evaluateOne(
                          "why",
                          answers.why ?? "",
                          {
                            minWords: 5,
                            requiredTargetUses: 0,
                            mode: "repair",
                            taskPrompt:
                              "Explain the exact correction and its grammatical reason.",
                          },
                        );
                        if (result?.pass) completeStep(3);
                      }}
                    >
                      Evaluate repair explanation
                    </Button>
                    {renderResult("why")}
                  </>
                ) : null}

                {index === 4 ? (
                  <div>
                    <div className="rounded-xl border bg-slate-50 p-3 font-bold">
                      {corrected}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        onClick={() => speak(corrected)}
                        variant="secondary"
                      >
                        <Volume2 aria-hidden className="size-4" />
                        Listen
                      </Button>
                      <Button
                        onClick={() => {
                          const repeats =
                            Number(answers.repairRepeats ?? 0) + 1;
                          saveAnswer(
                            "repairRepeats",
                            String(Math.min(2, repeats)),
                          );
                          if (repeats >= 2) {
                            completeStep(4);
                            recordAttempt({
                              grammarTitle: grammar.title,
                              mode: "repair",
                              inputText: corrected,
                              correctedText: corrected,
                              targetHit: true,
                              accuracyScore: 100,
                              fluencyScore: 80,
                              latencyMs: null,
                              passed: false,
                              verified: false,
                            });
                          }
                        }}
                      >
                        <RotateCcw aria-hidden className="size-4" />
                        Repeated aloud ({answers.repairRepeats ?? "0"}/2)
                      </Button>
                    </div>
                  </div>
                ) : null}

                {index === 5 ? (
                  <>
                    <Textarea
                      aria-label="Transfer answer"
                      autoComplete="off"
                      name="daily-transfer"
                      onChange={(event) =>
                        saveAnswer("transfer", event.target.value)
                      }
                      placeholder="A classmate missed today's explanation. Summarize the useful point in your own English words and use the target grammar."
                      value={answers.transfer ?? ""}
                    />
                    <Button
                      className="mt-3"
                      disabled={loading === "transfer"}
                      onClick={async () => {
                        const result = await evaluateOne(
                          "transfer",
                          answers.transfer ?? "",
                          {
                            minWords: 8,
                            requiredTargetUses: 1,
                            mode: "transfer",
                            taskPrompt:
                              "Summarize the useful point for a classmate in your own words.",
                          },
                        );
                        if (result?.pass) completeStep(5);
                      }}
                    >
                      Evaluate mediation and transfer
                    </Button>
                    {renderResult("transfer")}
                  </>
                ) : null}

                {index === 6 ? (
                  <>
                    <div className="mb-3 rounded-xl border bg-slate-50 p-3 text-sm">
                      {review?.original ?? controlled[0]}
                    </div>
                    <Input
                      aria-label="Answer for delayed retrieval"
                      autoComplete="off"
                      name="daily-review-answer"
                      onChange={(event) =>
                        saveAnswer("reviewAnswer", event.target.value)
                      }
                      placeholder="Retrieve the corrected English answer without looking."
                      value={answers.reviewAnswer ?? ""}
                    />
                    <Button
                      className="mt-3"
                      disabled={loading === "review"}
                      onClick={async () => {
                        const expected = review?.corrected ?? controlled[1];
                        const value = answers.reviewAnswer?.trim() ?? "";
                        const evaluation = await evaluateOne("review", value, {
                          minWords: 1,
                          requiredTargetUses: 0,
                          mode: "recognition",
                          taskPrompt:
                            "Retrieve the corrected answer without looking.",
                        });
                        const exact =
                          value.toLowerCase() === expected.trim().toLowerCase();
                        setMessages((current) => ({
                          ...current,
                          review: exact
                            ? "Your retrieval matches the saved answer."
                            : "Not yet matching. Compare, cover the answer, and try again.",
                        }));
                        if (evaluation?.pass && exact) {
                          if (review) {
                            mutate((draft) => {
                              const row = draft.reviews.find(
                                (item) => item.id === review.id,
                              );
                              if (row) {
                                row.status = "done";
                                row.successStreak += 1;
                                row.stabilityScore = evaluation.accuracyScore;
                                const next = adaptiveReviewInterval(
                                  row.intervalDays,
                                  true,
                                  evaluation.accuracyScore,
                                  row.successStreak,
                                );
                                draft.reviews.push({
                                  ...row,
                                  id: makeId("review"),
                                  intervalDays: next,
                                  dueAt: Date.now() + next * 86_400_000,
                                  status: "pending",
                                });
                              }
                              recalculateMastery(draft, grammar.title);
                            });
                          }
                          completeStep(6);
                          speak(expected);
                        } else if (evaluation && review) {
                          mutate((draft) => {
                            const row = draft.reviews.find(
                              (item) => item.id === review.id,
                            );
                            if (!row) return;
                            const next = adaptiveReviewInterval(
                              row.intervalDays,
                              false,
                              evaluation.accuracyScore,
                              row.successStreak,
                            );
                            row.successStreak = 0;
                            row.stabilityScore = Math.max(
                              0,
                              row.stabilityScore - 15,
                            );
                            row.intervalDays = next;
                            row.dueAt = Date.now() + next * 86_400_000;
                            row.status = "pending";
                            recalculateMastery(draft, grammar.title);
                          });
                        }
                      }}
                    >
                      Check delayed retrieval
                    </Button>
                    {messages.review ? (
                      <p className="mt-2 text-sm font-bold">
                        {messages.review}
                      </p>
                    ) : null}
                    {renderResult("review")}
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Due Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {due.length > 0 ? (
              due.slice(0, 6).map((item) => (
                <div className="rounded-xl border p-3 text-sm" key={item.id}>
                  <div className="flex items-center justify-between gap-2">
                    <strong>{item.topic}</strong>
                    <Badge
                      variant={
                        item.sourceType === "error_item"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {item.mode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Interval: {item.intervalDays}{" "}
                    {item.intervalDays === 1 ? "day" : "days"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No review is due today.
              </p>
            )}
          </CardContent>
        </Card>
        {state.settings.showStreaks ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame aria-hidden className="size-5 text-orange-600" />
                Streak · {streak} {streak === 1 ? "day" : "days"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="heatmap"
                aria-label="Activity overview for the last 70 days"
              >
                {Array.from({ length: 70 }, (_, index) => {
                  const date = new Date(Date.now() - (69 - index) * 86_400_000)
                    .toISOString()
                    .slice(0, 10);
                  const count = state.activity[date] ?? 0;
                  const heatLevel =
                    count >= 5 ? 3 : count >= 2 ? 2 : count ? 1 : 0;
                  return (
                    <span
                      aria-label={`${date}: ${count} completed tasks`}
                      className="heat-cell"
                      data-level={heatLevel}
                      key={date}
                      title={`${date}: ${count}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Flexible Consistency</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              One missed day does not erase your learning. Return with the
              five-minute rescue session. Mastery depends on retained speaking
              and writing, not on an unbroken streak.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
