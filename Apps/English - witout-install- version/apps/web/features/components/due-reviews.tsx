"use client";

// Spaced-repetition recall practice for grammar points the learner has
// already studied. This is the missing UI half of app-store.tsx's `reviews`
// queue: items were already being created (setTodayGrammar,
// analyzeLessonOutput) and scheduled with dueAt/intervalDays/successStreak,
// but nothing ever displayed them or let the learner work through a due
// item -- completeReview() (the scheduling update) didn't exist either.
//
// The recall attempt is graded the same way Mission grades writing/speaking
// (lib/assessment.ts's evaluateResponse, the same masteryEligible signal
// F1 wired into recordAttempt) -- not a self-rated "I got it right" button.
// Per AUTOMATICITY_PRODUCT_CONTRACT.md §8.2, a self-rating must never
// independently advance mastery, automaticity, or a review's schedule; an
// earlier version of this component used exactly that anti-pattern.

import * as React from "react";
import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  EVIDENCE_CONTENT_VERSION,
  transferSituation,
  useAppStore,
} from "@/features/store/app-store";
import { evaluateResponse, type Evaluation } from "@/lib/assessment";

// Distinguishes the near-term recall check (interval 1-3 days: "can you
// still produce this pattern at all") from the long-interval checkpoint
// (interval 7+ days: RECALL_INTERVAL_STEPS_DAYS[2] and beyond). Per the
// spacing/transfer literature this session is applying throughout, testing
// the exact same sentence forever only proves memorization of that one
// sentence -- the 7-day-and-beyond checkpoint instead asks the learner to
// apply the pattern to a brand new situation, the same rotation the
// same-day Transfer step already uses.
const TRANSFER_CHECKPOINT_INTERVAL_DAYS = 7;

function grammarFor(topic: string) {
  return (
    grammarUnits.find((unit) => unit.title === topic) ??
    grammarUnits.find((unit) => unit.title.toLocaleLowerCase("en") === "present perfect") ??
    grammarUnits.at(0) ?? null
  );
}

export function DueReviews() {
  const { state, completeReview, recordAttempt } = useAppStore();
  const dueItems = React.useMemo(
    () =>
      state.reviews
        .filter((review) => review.status === "pending" && review.dueAt <= Date.now())
        .sort((a, b) => a.dueAt - b.dueAt),
    [state.reviews],
  );
  const [index, setIndex] = React.useState(0);
  const [attempt, setAttempt] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<Evaluation | null>(null);

  const current = dueItems[Math.min(index, dueItems.length - 1)];

  React.useEffect(() => {
    setIndex(0);
    setAttempt("");
    setResult(null);
  }, [dueItems.length === 0]);

  if (!current) return null;

  const grammar = grammarFor(current.topic);
  const isTransferCheckpoint =
    current.intervalDays >= TRANSFER_CHECKPOINT_INTERVAL_DAYS;
  const situation =
    isTransferCheckpoint && grammar
      ? transferSituation(grammar, current.successStreak)
      : null;

  const advance = () => {
    setAttempt("");
    setResult(null);
    setIndex((value) => Math.min(value + 1, Math.max(dueItems.length - 2, 0)));
  };

  const checkRecall = async () => {
    if (!grammar) return;
    setChecking(true);
    try {
      const evaluation = await evaluateResponse(
        attempt,
        {
          grammar,
          minWords: 4,
          minSentences: 1,
          requiredTargetUses: 1,
          taskPrompt: situation
            ? `Apply this to a new situation, from memory, without looking anything up: ${situation}`
            : `Recall from memory: ${current.topic}. Write it without looking anything up.`,
        },
        state.settings,
      );
      setResult(evaluation);
      completeReview(current.id, evaluation.masteryEligible);
      // Previously this component only updated the review's own schedule
      // (streak/interval) via completeReview and never called recordAttempt --
      // no mode:"transfer" Attempt could ever originate from an actual delayed
      // review, so recalculateMastery's "automatic" gate could be satisfied
      // entirely from same-session Mission-step transfer attempts that were
      // never re-tested after a delay. Recording a real attempt here (tagged
      // fromDueReview so the gate can tell it apart from same-session
      // evidence) closes that gap. Only the novel-context checkpoint counts as
      // mode:"transfer" -- the near-term same-sentence recall check is
      // "recognition" evidence, not proof of transfer to a new situation.
      recordAttempt({
        grammarTitle: current.topic,
        mode: isTransferCheckpoint ? "transfer" : "recognition",
        inputText: attempt,
        correctedText: evaluation.corrected,
        targetHit: evaluation.pass,
        accuracyScore: evaluation.accuracyScore,
        fluencyScore: 0,
        latencyMs: null,
        passed: evaluation.pass,
        // Provider reachability and correctness are separate facts. A checked
        // wrong review is still verified evidence and must lower the score.
        verified: evaluation.online,
        assessedBy: evaluation.online ? "online" : "offline",
        contentVersion: EVIDENCE_CONTENT_VERSION,
        fromDueReview: true,
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="border-amber-300 bg-amber-50/70" id="due-reviews">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" />
            {isTransferCheckpoint ? "Transfer checkpoint" : "Due for review"}
          </CardTitle>
          <Badge variant="default">
            {dueItems.length} {dueItems.length === 1 ? "item" : "items"} due
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>{current.topic}</strong>
          <p className="text-sm text-muted-foreground">
            {situation
              ? `Day ${current.intervalDays}+ checkpoint: apply the pattern to a new situation, not the original sentence. Streak: ${current.successStreak}`
              : `Recall this from memory before checking. Streak: ${current.successStreak}`}
          </p>
          {situation ? (
            <p className="mt-2 rounded-lg bg-white p-3 text-sm">{situation}</p>
          ) : null}
        </div>
        <Textarea
          value={attempt}
          onChange={(event) => setAttempt(event.target.value)}
          placeholder={
            situation
              ? "Respond to the situation above using this pattern, from memory."
              : "Write it from memory, without looking anything up."
          }
          rows={3}
          disabled={checking}
        />
        {!result ? (
          <Button onClick={() => void checkRecall()} disabled={!attempt.trim() || checking}>
            {checking ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}{" "}
            {checking ? "Checking…" : "Check my recall"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
              <p className="text-muted-foreground">
                {result.masteryEligible
                  ? "Correct — this counts toward your review streak."
                  : result.online
                    ? "Not quite yet — this attempt did not pass, so the streak resets rather than advances."
                    : "Could not verify online, so this attempt does not count toward your streak. Reconnect and try again when you can."}
              </p>
              <p className="mt-2 text-muted-foreground">Reference:</p>
              <p>{current.corrected}</p>
            </div>
            <Button variant="outline" onClick={advance}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
