"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

import type { CefrLevel } from "@grammar/domain";

import { Button } from "@/components/ui/button";

interface PlacementQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly answer: string;
}

const QUESTIONS: readonly PlacementQuestion[] = [
  {
    id: "a1-1",
    prompt: "Ich ___ aus Berlin.",
    options: ["komme", "kommt", "kommen"],
    answer: "komme",
  },
  {
    id: "a1-2",
    prompt: "Das ist ___ Buch.",
    options: ["ein", "eine", "einen"],
    answer: "ein",
  },
  {
    id: "a2-1",
    prompt: "Gestern ___ wir im Museum.",
    options: ["sind", "waren", "werden"],
    answer: "waren",
  },
  {
    id: "a2-2",
    prompt: "Ich fahre ___ dem Bus zur Arbeit.",
    options: ["mit", "bei", "für"],
    answer: "mit",
  },
  {
    id: "b1-1",
    prompt: "Wenn es regnet, ___ ich zu Hause.",
    options: ["bleibe", "blieb", "geblieben"],
    answer: "bleibe",
  },
  {
    id: "b1-2",
    prompt: "Ich lerne Deutsch, ___ ich in Berlin studiere.",
    options: ["obwohl", "weil", "damit"],
    answer: "weil",
  },
  {
    id: "b2-1",
    prompt: "Der Bericht ___ vor der Sitzung fertiggestellt worden.",
    options: ["war", "hat", "wurde"],
    answer: "war",
  },
  {
    id: "b2-2",
    prompt: "An deiner Stelle ___ ich früher anfangen.",
    options: ["werde", "würde", "wurde"],
    answer: "würde",
  },
  {
    id: "c1-1",
    prompt: "Kaum ___ sie den Vortrag beendet, begannen die Fragen.",
    options: ["hatte", "hätte", "wurde"],
    answer: "hatte",
  },
  {
    id: "c1-2",
    prompt: "Die Studie ist überzeugend, ___ einige Daten fehlen.",
    options: ["wenngleich", "sodass", "indem"],
    answer: "wenngleich",
  },
  {
    id: "c2-1",
    prompt: "Wähle die natürlichste formelle Formulierung.",
    options: [
      "Wie dem auch sei, die Beweislage bleibt unklar.",
      "Wie es auch wäre, bleibt die Beweise unklar.",
      "Sei es wie, die Beweislage bleibt zu unklar.",
    ],
    answer: "Wie dem auch sei, die Beweislage bleibt unklar.",
  },
  {
    id: "c2-2",
    prompt:
      "Seine Argumentation war derart ___, dass kaum Fragen offenblieben.",
    options: ["stichhaltig", "hinfällig", "beiläufig"],
    answer: "stichhaltig",
  },
];

function recommendLevel(correct: number): CefrLevel {
  if (correct >= 12) return "C2";
  if (correct >= 10) return "C1";
  if (correct >= 8) return "B2";
  if (correct >= 6) return "B1";
  if (correct >= 4) return "A2";
  return "A1";
}

export function PlacementCheck({
  onAccept,
}: Readonly<{ onAccept: (level: CefrLevel) => void }>) {
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [result, setResult] = useState<{
    readonly correct: number;
    readonly level: CefrLevel;
  } | null>(null);
  const complete = Object.keys(answers).length === QUESTIONS.length;

  return (
    <details className="rounded-xl border bg-muted/35 p-4">
      <summary className="cursor-pointer font-semibold">
        Freiwillige Einstufung starten
      </summary>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Diese zwölf Aufgaben empfehlen nur einen Einstieg. Der Test ist
        freiwillig und bestätigt kein GER-Niveau; dafür zählen später
        wiederholtes Sprechen, Schreiben, Hören und zeitversetzter Abruf.
      </p>
      <div className="mt-4 grid gap-4">
        {QUESTIONS.map((question, index) => (
          <label
            className="grid min-w-0 gap-1.5 text-sm font-medium"
            key={question.id}
          >
            <span>
              {index + 1}. {question.prompt}
            </span>
            <select
              aria-label={`Antwort auf Frage ${index + 1}`}
              className="h-10 min-w-0 rounded-lg border bg-background px-3"
              onChange={(event) => {
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }));
                setResult(null);
              }}
              value={answers[question.id] ?? ""}
            >
              <option value="">Antwort wählen</option>
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
            setResult({ correct, level: recommendLevel(correct) });
          }}
          type="button"
          variant="outline"
        >
          <ClipboardCheck data-icon="inline-start" />
          Empfehlung berechnen
        </Button>
        {result ? (
          <Button onClick={() => onAccept(result.level)} type="button">
            <CheckCircle2 data-icon="inline-start" />
            {result.level} als Startniveau übernehmen
          </Button>
        ) : null}
      </div>
      {result ? (
        <p aria-live="polite" className="mt-3 text-sm" role="status">
          Empfohlenes Startniveau: <strong>{result.level}</strong> (
          {result.correct} von {QUESTIONS.length} richtig). Das ist eine
          Empfehlung, kein Zertifikat.
        </p>
      ) : null}
    </details>
  );
}
