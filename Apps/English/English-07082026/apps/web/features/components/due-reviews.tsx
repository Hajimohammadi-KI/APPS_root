"use client";

// Spaced-repetition recall practice for grammar points the learner has
// already studied. This is the missing UI half of app-store.tsx's `reviews`
// queue: items were already being created (setTodayGrammar,
// analyzeLessonOutput) and scheduled with dueAt/intervalDays/successStreak,
// but nothing ever displayed them or let the learner work through a due
// item -- completeReview() (the scheduling update) didn't exist either.
// Free recall first, reference revealed after, self-rated pass/fail --
// the same core loop as a classic spaced-repetition flashcard review,
// which is the right fit here since each review already carries its own
// original/corrected reference text.

import * as React from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/features/store/app-store";

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
  const [revealed, setRevealed] = React.useState(false);

  const current = dueItems[Math.min(index, dueItems.length - 1)];

  React.useEffect(() => {
    setIndex(0);
    setAttempt("");
    setRevealed(false);
  }, [dueItems.length === 0]);

  if (!current) return null;

  const advance = () => {
    setAttempt("");
    setRevealed(false);
    setIndex((value) => Math.min(value + 1, Math.max(dueItems.length - 2, 0)));
  };

  const handleResult = (wasCorrect: boolean) => {
    completeReview(current.id, wasCorrect);
    advance();
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
            Recall this from memory before checking the reference below. Streak: {current.successStreak}
          </p>
        </div>
        <Textarea
          value={attempt}
          onChange={(event) => setAttempt(event.target.value)}
          placeholder="Write it from memory, without looking anything up."
          rows={3}
        />
        {!revealed ? (
          <Button onClick={() => setRevealed(true)} disabled={!attempt.trim()}>
            <Sparkles className="size-4" /> Reveal reference
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
              <p className="text-muted-foreground">Reference:</p>
              <p>{current.corrected}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleResult(true)}>I got it right</Button>
              <Button variant="outline" onClick={() => handleResult(false)}>
                I need more practice
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
