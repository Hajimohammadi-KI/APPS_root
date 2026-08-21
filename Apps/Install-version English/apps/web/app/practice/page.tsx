"use client";

import * as React from "react";
import { ArrowRight, Check, Shuffle } from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { evaluatePracticeAnswer } from "@/lib/automaticity-analysis";
import { EVIDENCE_CONTENT_VERSION } from "@/features/screens/automaticity-screen";
import { useAppStore } from "@/features/store/app-store";

// Interleaved practice: every other controlled-practice surface in this app
// is single-topic (blocked practice). Rohrer & Taylor's interleaving-effect
// research finds mixing 2-3 related-but-distinct topics in one session
// produces more durable, transferable learning than blocked repetition,
// even though blocked practice usually *feels* easier in the moment. This
// page is the one place that deliberately mixes topics instead of picking
// one for the whole session.

const TOPICS_PER_SESSION = 3;
const ITEMS_PER_TOPIC = 2;

interface QueueItem {
  grammarTitle: string;
  prompt: string;
  expected: string;
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  // Destructuring swap avoids the non-null assertions the index form needed.
  // Both indices are always in range here (index counts down from length-1,
  // swapIndex is floored into [0, index]), so no assertion was buying safety.
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]] as [T, T];
  }
  return copy;
}

function buildQueue(studiedTitles: readonly string[]): QueueItem[] {
  // Prefer topics the learner has already studied at least once (mixing
  // genuinely different, already-encountered grammar, not brand-new
  // material) -- fall back to the first few catalog units only when there
  // isn't enough study history yet to draw from.
  const pool =
    studiedTitles.length >= 2
      ? studiedTitles
      : grammarUnits.slice(0, TOPICS_PER_SESSION).map((unit) => unit.title);
  const chosenTitles = shuffled(pool).slice(0, TOPICS_PER_SESSION);
  const queue: QueueItem[] = [];
  for (const title of chosenTitles) {
    const unit = grammarUnits.find((candidate) => candidate.title === title);
    if (!unit) continue;
    const items = shuffled(unit.exercises).slice(0, ITEMS_PER_TOPIC);
    for (const [prompt, expected] of items) {
      queue.push({ grammarTitle: unit.title, prompt, expected });
    }
  }
  return shuffled(queue);
}

export default function MixedPracticePage() {
  const { state, recordAttempt } = useAppStore();
  // Starts empty rather than calling buildQueue() (which shuffles via
  // Math.random()) directly in the initializer -- that ran independently
  // during SSR and the initial client render and produced two different
  // queues, a real hydration mismatch caught by an actual e2e run. Built
  // once, client-only, in the effect below instead.
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [queueReady, setQueueReady] = React.useState(false);
  const builtRef = React.useRef(false);
  React.useEffect(() => {
    if (builtRef.current) return;
    builtRef.current = true;
    setQueue(buildQueue(Object.keys(state.mastery)));
    setQueueReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState("");
  const [correct, setCorrect] = React.useState<boolean | null>(null);
  const current = queue[index];

  function checkAnswer() {
    if (!current) return;
    const isCorrect = evaluatePracticeAnswer(answer, {
      prompt: current.prompt,
      expected: current.expected,
    });
    setCorrect(isCorrect);
    recordAttempt({
      grammarTitle: current.grammarTitle,
      mode: "recognition",
      inputText: answer,
      correctedText: current.expected,
      targetHit: isCorrect,
      accuracyScore: isCorrect ? 100 : 0,
      fluencyScore: 0,
      latencyMs: null,
      passed: isCorrect,
      verified: true,
      assessedBy: "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
  }

  function next() {
    setIndex((value) => value + 1);
    setAnswer("");
    setCorrect(null);
  }

  if (queueReady && queue.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Shuffle />
          </EmptyMedia>
          <EmptyTitle>No grammar content available</EmptyTitle>
          <EmptyDescription>
            The grammar catalog is empty, so a mixed session cannot be built.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    );
  }

  if (!queueReady) return null;

  if (!current) {
    return (
      <div className="page-stack session-complete-enter">
        <div className="page-heading">
          <Badge>Mixed Practice</Badge>
          <h1>Session complete</h1>
          <p>
            You practiced {new Set(queue.map((item) => item.grammarTitle)).size}{" "}
            different topics, interleaved, in one sitting.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5">
            <Button onClick={() => window.location.reload()}>
              <Shuffle className="size-4" /> Start a new mixed session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <Badge>Mixed Practice</Badge>
        <h1>Interleaved review across topics</h1>
        <p>
          Item {index + 1} of {queue.length} -- topics are mixed on purpose,
          not blocked one at a time.
        </p>
      </div>
      <Card id="mission">
        <CardHeader>
          <CardTitle>{current.grammarTitle}</CardTitle>
          <CardDescription>{current.prompt}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            className="min-h-11 w-full rounded-xl border bg-background px-3"
            aria-label="Your answer"
            disabled={correct !== null}
            onChange={(event) => setAnswer(event.target.value)}
            value={answer}
          />
          {correct === null ? (
            <Button disabled={!answer.trim()} onClick={checkAnswer}>
              <Check className="size-4" /> Check
            </Button>
          ) : (
            <div className="shared-feedback-enter space-y-3">
              <p
                className={
                  correct
                    ? "text-sm font-bold text-violet-800"
                    : "text-sm font-bold text-red-800"
                }
              >
                {correct ? "Correct." : `Model: ${current.expected}`}
              </p>
              <Button onClick={next}>
                <ArrowRight className="size-4" /> Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
