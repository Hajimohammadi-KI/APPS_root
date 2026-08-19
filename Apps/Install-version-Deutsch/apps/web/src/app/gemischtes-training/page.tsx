"use client";

import { useEffect, useRef, useState } from "react";
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
import { evaluatePracticeAnswer } from "@/features/automaticity/automaticity-analysis";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

// Interleaved practice: every other controlled-practice surface in this app
// is single-topic (blocked practice). Rohrer & Taylor's interleaving-effect
// research finds mixing 2-3 related-but-distinct topics in one session
// produces more durable, transferable learning than blocked repetition.
// This page is the one place that deliberately mixes topics instead of
// picking one for the whole session.

const TOPICS_PER_SESSION = 3;
const ITEMS_PER_TOPIC = 2;

interface QueueItem {
  grammarTitle: string;
  prompt: string;
  expected: string;
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temp;
  }
  return copy;
}

function buildQueue(studiedTitles: readonly string[]): QueueItem[] {
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
    for (const exercise of items) {
      queue.push({
        grammarTitle: unit.title,
        prompt: exercise[0] ?? "",
        expected: exercise[1] ?? unit.testAnswer,
      });
    }
  }
  return shuffled(queue);
}

export default function GemischtesTrainingPage() {
  const { state, recordAttempt } = useLearnerState();
  // Starts empty rather than calling buildQueue() (which shuffles via
  // Math.random()) directly in the initializer -- that ran independently
  // during SSR and the initial client render and produced two different
  // queues, a real hydration mismatch caught by an actual e2e run. Built
  // once, client-only, in the effect below instead.
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueReady, setQueueReady] = useState(false);
  const builtRef = useRef(false);
  useEffect(() => {
    if (builtRef.current) return;
    builtRef.current = true;
    setQueue(buildQueue(Object.keys(state.mastery)));
    setQueueReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const current = queue[index];

  function checkAnswer() {
    if (!current) return;
    // Gleiche Bewertung wie im Grammatik-Labor: „Korrigiere den Satz ...“ ist
    // offene Produktion und darf nicht am Vergleich mit genau einer
    // gespeicherten Zeichenkette scheitern.
    const isCorrect = evaluatePracticeAnswer(answer, {
      prompt: current.prompt,
      expected: current.expected,
    });
    setCorrect(isCorrect);
    recordAttempt({
      topic: current.grammarTitle,
      mode: "recognition",
      inputText: answer,
      correctedText: current.expected,
      targetHit: isCorrect,
      verified: isCorrect,
      accuracyScore: isCorrect ? 100 : 0,
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
          <EmptyTitle>Kein Grammatikinhalt verfügbar</EmptyTitle>
          <EmptyDescription>
            Der Grammatikkatalog ist leer, eine gemischte Sitzung kann nicht
            aufgebaut werden.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    );
  }

  if (!queueReady) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div>
          <Badge className="mb-3 bg-violet-700 text-white">
            Gemischtes Training
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Gemischte Wiederholung über Themen hinweg
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Deine Themen werden zu einer abwechslungsreichen Sitzung gemischt.
          </p>
        </div>
        <Card aria-live="polite">
          <CardHeader>
            <CardTitle>Übungen werden vorbereitet …</CardTitle>
            <CardDescription>
              Die erste Aufgabe erscheint gleich. Deine Eingabe bleibt dabei
              jederzeit unter deiner Kontrolle.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="session-complete-enter space-y-5">
        <div>
          <Badge className="mb-3 bg-violet-700 text-white">
            Gemischtes Training
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Sitzung abgeschlossen
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Du hast {new Set(queue.map((item) => item.grammarTitle)).size}{" "}
            verschiedene Themen gemischt in einer Sitzung geübt.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5">
            <Button onClick={() => window.location.reload()}>
              <Shuffle /> Neue gemischte Sitzung starten
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge className="mb-3 bg-violet-700 text-white">
          Gemischtes Training
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Gemischte Wiederholung über Themen hinweg
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Aufgabe {index + 1} von {queue.length} -- Themen sind absichtlich
          gemischt, nicht blockweise.
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
            aria-label="Deine Antwort"
            disabled={correct !== null}
            onChange={(event) => setAnswer(event.target.value)}
            value={answer}
          />
          {correct === null ? (
            <Button disabled={!answer.trim()} onClick={checkAnswer}>
              <Check /> Prüfen
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
                {correct ? "Richtig." : `Modell: ${current.expected}`}
              </p>
              <Button onClick={next}>
                <ArrowRight /> Weiter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
