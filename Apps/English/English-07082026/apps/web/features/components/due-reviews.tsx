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
import { RotateCcw, Sparkles } from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/features/store/app-store";
import { evaluateResponse, type Evaluation } from "@/lib/assessment";

function grammarFor(topic: string) {
  return (
    grammarUnits.find((unit) => unit.title === topic) ??
    grammarUnits.find((unit) => unit.title.toLocaleLowerCase("en") === "present perfect") ??
    grammarUnits.at(0) ?? null
  );
}

export function DueReviews() {
  const { state, completeReview } = useAppStore();
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

  const advance = () => {
    setAttempt("");
    setResult(null);
    setIndex((value) => Math.min(value + 1, Math.max(dueItems.length - 2, 0)));
  };

  const checkRecall = async () => {
    const grammar = grammarFor(current.topic);
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
          taskPrompt: `Recall from memory: ${current.topic}. Write it without looking anything up.`,
        },
        state.settings,
      );
      setResult(evaluation);
      completeReview(current.id, evaluation.masteryEligible);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="border-amber-300 bg-amber-50/70" id="due-reviews">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" /> Due for review
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
            Recall this from memory before checking. Streak: {current.successStreak}
          </p>
        </div>
        <Textarea
          value={attempt}
          onChange={(event) => setAttempt(event.target.value)}
          placeholder="Write it from memory, without looking anything up."
          rows={3}
          disabled={checking}
        />
        {!result ? (
          <Button onClick={() => void checkRecall()} disabled={!attempt.trim() || checking}>
            <Sparkles className="size-4" /> {checking ? "Checking…" : "Check my recall"}
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
