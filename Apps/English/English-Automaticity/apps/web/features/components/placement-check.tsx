"use client";

import * as React from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import type { CefrLevel } from "@grammar/content";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface PlacementQuestion {
  id: string;
  prompt: string;
  options: readonly string[];
  answer: string;
}

const QUESTIONS: readonly PlacementQuestion[] = [
  {
    id: "a1-1",
    prompt: "I ___ from Berlin.",
    options: ["am", "is", "are"],
    answer: "am",
  },
  {
    id: "a1-2",
    prompt: "She ___ coffee every morning.",
    options: ["drink", "drinks", "drinking"],
    answer: "drinks",
  },
  {
    id: "a2-1",
    prompt: "We ___ the museum yesterday.",
    options: ["visit", "visited", "have visit"],
    answer: "visited",
  },
  {
    id: "a2-2",
    prompt: "This bag is ___ than mine.",
    options: ["heavy", "heavier", "more heavy"],
    answer: "heavier",
  },
  {
    id: "b1-1",
    prompt: "If it rains, we ___ at home.",
    options: ["stay", "will stay", "stayed"],
    answer: "will stay",
  },
  {
    id: "b1-2",
    prompt: "I have lived here ___ 2022.",
    options: ["for", "since", "during"],
    answer: "since",
  },
  {
    id: "b2-1",
    prompt: "The report ___ before the meeting began.",
    options: ["finished", "had been finished", "has finishing"],
    answer: "had been finished",
  },
  {
    id: "b2-2",
    prompt: "I wish I ___ more time yesterday.",
    options: ["have", "had had", "would have"],
    answer: "had had",
  },
  {
    id: "c1-1",
    prompt: "Hardly ___ the talk when the questions started.",
    options: ["she had finished", "had she finished", "did she finished"],
    answer: "had she finished",
  },
  {
    id: "c1-2",
    prompt: "The proposal is valuable, ___ its practical limitations.",
    options: ["albeit", "whereas", "unless"],
    answer: "albeit",
  },
  {
    id: "c2-1",
    prompt: "Choose the most natural formal sentence.",
    options: [
      "Be that as it may, the evidence remains inconclusive.",
      "Being that it may, the evidence stays not conclusive.",
      "As that may be, evidence remains to inconclude.",
    ],
    answer: "Be that as it may, the evidence remains inconclusive.",
  },
  {
    id: "c2-2",
    prompt: "Her account was so ___ that even minor details felt convincing.",
    options: ["cogent", "contingent", "perfunctory"],
    answer: "cogent",
  },
];

function recommendation(correct: number): CefrLevel {
  if (correct >= 12) return "C2";
  if (correct >= 10) return "C1";
  if (correct >= 8) return "B2";
  if (correct >= 6) return "B1";
  if (correct >= 4) return "A2";
  return "A1";
}

export function PlacementCheck({
  onAccept,
}: {
  onAccept: (level: CefrLevel) => void;
}) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<{
    correct: number;
    level: CefrLevel;
  } | null>(null);
  const complete = Object.keys(answers).length === QUESTIONS.length;

  return (
    <details className="rounded-xl border bg-secondary p-4">
      <summary className="cursor-pointer font-bold">
        Open optional placement check
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">
        This 12-question check suggests a starting level. It is optional and
        does not verify CEFR level; speaking and writing evidence still decides
        mastery.
      </p>
      <div className="mt-4 grid gap-4">
        {QUESTIONS.map((question, index) => (
          <label className="grid gap-1.5 text-sm" key={question.id}>
            <span>
              {index + 1}. {question.prompt}
            </span>
            <Select
              aria-label={`Answer for question ${index + 1}`}
              onChange={(event) => {
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }));
                setResult(null);
              }}
              value={answers[question.id] ?? ""}
            >
              <option value="">Choose an answer</option>
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          disabled={!complete}
          onClick={() => {
            const correct = QUESTIONS.filter(
              (question) => answers[question.id] === question.answer,
            ).length;
            setResult({ correct, level: recommendation(correct) });
          }}
          type="button"
          variant="outline"
        >
          <ClipboardCheck aria-hidden className="size-4" />
          Show recommendation
        </Button>
        {result ? (
          <Button onClick={() => onAccept(result.level)} type="button">
            <CheckCircle2 aria-hidden className="size-4" />
            Use {result.level} as starting level
          </Button>
        ) : null}
      </div>
      {result ? (
        <p aria-live="polite" className="mt-3 text-sm" role="status">
          Suggested starting level: <strong>{result.level}</strong> (
          {result.correct} of {QUESTIONS.length} correct). This is a starting
          recommendation, not a certificate.
        </p>
      ) : null}
    </details>
  );
}
