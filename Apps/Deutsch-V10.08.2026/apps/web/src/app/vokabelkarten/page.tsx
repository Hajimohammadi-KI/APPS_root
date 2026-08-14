"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import type { FlashcardGrade } from "@grammar/domain";

export default function VokabelkartenPage() {
  const { state, addFlashcard, gradeFlashcard, deleteFlashcard, setTodayGrammar } =
    useLearnerState();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [originalSentence, setOriginalSentence] = useState("");
  const [revealed, setRevealed] = useState(false);
  // A forgotten card ("Nochmal") previously just went back into the queue
  // with no way to actually practice the pattern it came from -- when the
  // card was added from a grammar lesson, offer a direct link to work
  // that lesson in today's Mission instead of only re-testing recall.
  const [correctiveLesson, setCorrectiveLesson] = useState<string | null>(null);

  const now = Date.now();
  const dueCards = useMemo(
    () => state.flashcards.filter((card) => card.dueAt <= now).slice().sort((a, b) => a.dueAt - b.dueAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.flashcards],
  );
  const activeCard = dueCards[0] ?? null;

  function submitNewCard(event: FormEvent) {
    event.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addFlashcard({
      front,
      back,
      source: "manual",
      ...(originalSentence.trim() ? { originalSentence: originalSentence.trim() } : {}),
    });
    setFront("");
    setBack("");
    setOriginalSentence("");
  }

  function grade(cardGrade: FlashcardGrade) {
    if (!activeCard) return;
    gradeFlashcard(activeCard.id, cardGrade);
    setCorrectiveLesson(cardGrade === "again" ? (activeCard.lesson ?? null) : null);
    setRevealed(false);
  }

  function practiceCorrectiveLesson() {
    if (!correctiveLesson) return;
    const unit = grammarUnits.find((candidate) => candidate.title === correctiveLesson);
    if (unit) setTodayGrammar(unit.title, unit.level);
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge className="mb-3 bg-violet-700 text-white">
          {state.flashcards.length} Karten · {dueCards.length} heute fällig
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Vokabelkarten
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Echte Wiederholung: Again/Hard/Good verändert wirklich, wann eine Karte
          wiederkommt — dieselbe Leiter, die auch die Wiederholungen benutzen.
          Karten bleiben auf diesem Gerät.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wiederholen</CardTitle>
          <CardDescription>
            Erinnere dich, bevor du die Antwort aufdeckst — das ist der ganze Sinn
            eines verzögerten Tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {correctiveLesson ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
              <span>
                Diese Karte stammt aus <strong>{correctiveLesson}</strong> --
                übe das Muster selbst, nicht nur das Wort.
              </span>
              <Button
                onClick={practiceCorrectiveLesson}
                render={<Link href="/heute" />}
                size="sm"
              >
                {correctiveLesson} üben
              </Button>
            </div>
          ) : null}
          {!activeCard ? (
            <p className="text-sm text-muted-foreground">
              Gerade nichts fällig. Neue oder bewertete Karten erscheinen hier,
              sobald sie fällig sind.
            </p>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Vorderseite</p>
                <p className="text-lg font-bold">{activeCard.front}</p>
              </div>
              {revealed ? (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Rückseite</p>
                    <p className="text-lg">{activeCard.back}</p>
                  </div>
                  {activeCard.originalSentence ? (
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Originalsatz
                      </p>
                      <p className="text-sm italic">{activeCard.originalSentence}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => grade("again")} variant="outline">
                      Nochmal
                    </Button>
                    <Button onClick={() => grade("hard")} variant="outline">
                      Schwer
                    </Button>
                    <Button onClick={() => grade("good")}>Gut</Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => setRevealed(true)}>Antwort zeigen</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Karte hinzufügen</CardTitle>
          <CardDescription>
            Dasselbe Wort-Bedeutung-Paar wird nicht doppelt angelegt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitNewCard}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold" htmlFor="flashcard-front">
                  Vorderseite (Wort oder Ausdruck)
                </label>
                <Input id="flashcard-front" onChange={(event) => setFront(event.target.value)} value={front} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold" htmlFor="flashcard-back">
                  Rückseite (Bedeutung oder Übersetzung)
                </label>
                <Input id="flashcard-back" onChange={(event) => setBack(event.target.value)} value={back} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold" htmlFor="flashcard-sentence">
                Originalsatz (optional)
              </label>
              <Textarea
                id="flashcard-sentence"
                onChange={(event) => setOriginalSentence(event.target.value)}
                placeholder="Der Satz, in dem du dieses Wort gefunden hast"
                value={originalSentence}
              />
            </div>
            <Button disabled={!front.trim() || !back.trim()} type="submit">
              Karte hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alle Karten</CardTitle>
        </CardHeader>
        <CardContent>
          {state.flashcards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Karten.</p>
          ) : (
            <ul className="space-y-2">
              {state.flashcards
                .slice()
                .sort((a, b) => a.dueAt - b.dueAt)
                .map((card) => (
                  <li className="flex items-center justify-between gap-3 rounded-lg border p-3" key={card.id}>
                    <div>
                      <p className="font-bold">
                        {card.front} <span className="font-normal text-muted-foreground">→ {card.back}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fällig {new Date(card.dueAt).toLocaleDateString("de-DE")} · {card.lapses} Rückfall/Rückfälle
                        {card.source !== "manual" ? ` · aus ${card.source}` : ""}
                      </p>
                    </div>
                    <Button onClick={() => deleteFlashcard(card.id)} size="sm" variant="outline">
                      Löschen
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
