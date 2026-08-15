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
import type { FlashcardMode, FlashcardRecord } from "@grammar/domain";

interface DueItem {
  card: FlashcardRecord;
  mode: FlashcardMode;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("de-DE");
}

// Recognition (pick the right front from a few options) needs real
// distractors -- below this many total cards there aren't enough other
// fronts to build a fair multiple-choice question, so only production
// (typed recall) is tested until the deck grows.
const MIN_CARDS_FOR_RECOGNITION = 4;

export default function VokabelkartenPage() {
  const { state, addFlashcard, gradeFlashcard, deleteFlashcard, setTodayGrammar } =
    useLearnerState();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [originalSentence, setOriginalSentence] = useState("");
  const [productionAnswer, setProductionAnswer] = useState("");
  const [productionResult, setProductionResult] = useState<"correct" | "incorrect" | null>(null);
  // A forgotten card ("Nochmal") previously just went back into the queue
  // with no way to actually practice the pattern it came from -- when the
  // card was added from a grammar lesson, offer a direct link to work
  // that lesson in today's Mission instead of only re-testing recall.
  const [correctiveLesson, setCorrectiveLesson] = useState<string | null>(null);

  const now = Date.now();
  const canTestRecognition = state.flashcards.length >= MIN_CARDS_FOR_RECOGNITION;
  const dueItems = useMemo(() => {
    const items: DueItem[] = [];
    for (const card of state.flashcards) {
      if (canTestRecognition && card.recognition.dueAt <= now) {
        items.push({ card, mode: "recognition" });
      }
      if (card.production.dueAt <= now) items.push({ card, mode: "production" });
    }
    return items.sort((a, b) => a.card[a.mode].dueAt - b.card[b.mode].dueAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.flashcards, canTestRecognition]);
  const activeItem = dueItems[0] ?? null;

  const recognitionChoices = useMemo(() => {
    if (!activeItem || activeItem.mode !== "recognition") return [];
    const distractors = state.flashcards
      .filter((card) => card.id !== activeItem.card.id)
      .map((card) => card.front)
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [...distractors, activeItem.card.front].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.card.id, activeItem?.mode]);

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

  function afterGrade(cardGrade: "again" | "hard" | "good") {
    if (!activeItem) return;
    setCorrectiveLesson(cardGrade === "again" ? (activeItem.card.lesson ?? null) : null);
    setProductionAnswer("");
    setProductionResult(null);
  }

  function chooseRecognition(choice: string) {
    if (!activeItem) return;
    const correct = choice === activeItem.card.front;
    gradeFlashcard(activeItem.card.id, "recognition", correct ? "good" : "again");
    afterGrade(correct ? "good" : "again");
  }

  function checkProduction() {
    if (!activeItem) return;
    const correct = normalize(productionAnswer) === normalize(activeItem.card.front);
    setProductionResult(correct ? "correct" : "incorrect");
    if (!correct) {
      gradeFlashcard(activeItem.card.id, "production", "again");
    }
  }

  function gradeProductionDifficulty(cardGrade: "hard" | "good") {
    if (!activeItem) return;
    gradeFlashcard(activeItem.card.id, "production", cardGrade);
    afterGrade(cardGrade);
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
          {state.flashcards.length} Karten · {dueItems.length} heute fällig
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Vokabelkarten
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Erkennen (Multiple-Choice) und Produzieren (freies Tippen) werden pro
          Karte getrennt geplant -- ein Wort erkennen und es selbst produzieren
          sind unterschiedliche Fähigkeiten. Bewertung wird automatisch geprüft,
          nicht selbst eingeschätzt. Karten bleiben auf diesem Gerät.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wiederholen</CardTitle>
          <CardDescription>
            {activeItem?.mode === "recognition"
              ? "Wähle das Wort, das zu dieser Bedeutung passt."
              : "Tippe das Wort aus dem Gedächtnis, bevor du prüfst."}
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
          {!activeItem ? (
            <p className="text-sm text-muted-foreground">
              Gerade nichts fällig. Neue oder bewertete Karten erscheinen hier,
              sobald sie fällig sind.
              {!canTestRecognition ? (
                <>
                  {" "}
                  Füge {MIN_CARDS_FOR_RECOGNITION - state.flashcards.length}{" "}
                  weitere Karte(n) hinzu, um Multiple-Choice-Erkennung
                  freizuschalten.
                </>
              ) : null}
            </p>
          ) : activeItem.mode === "recognition" ? (
            <div className="space-y-4 rounded-lg border p-4">
              <Badge variant="secondary">Erkennen</Badge>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Bedeutung</p>
                <p className="text-lg font-bold">{activeItem.card.back}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {recognitionChoices.map((choice) => (
                  <Button
                    key={choice}
                    onClick={() => chooseRecognition(choice)}
                    variant="outline"
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <Badge variant="secondary">Produzieren</Badge>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Bedeutung</p>
                <p className="text-lg font-bold">{activeItem.card.back}</p>
              </div>
              {productionResult === null ? (
                <>
                  <Input
                    aria-label="Getippte Antwort"
                    onChange={(event) => setProductionAnswer(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && checkProduction()}
                    placeholder="Schreibe es aus dem Gedächtnis"
                    value={productionAnswer}
                  />
                  <Button disabled={!productionAnswer.trim()} onClick={checkProduction}>
                    Prüfen
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      {productionResult === "correct" ? "Richtig" : "Richtige Antwort"}
                    </p>
                    <p className="text-lg">{activeItem.card.front}</p>
                  </div>
                  {activeItem.card.originalSentence ? (
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Originalsatz
                      </p>
                      <p className="text-sm italic">{activeItem.card.originalSentence}</p>
                    </div>
                  ) : null}
                  {productionResult === "correct" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => gradeProductionDifficulty("hard")} variant="outline">
                        Richtig, aber schwer
                      </Button>
                      <Button onClick={() => gradeProductionDifficulty("good")}>
                        Richtig und leicht
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => afterGrade("again")} variant="outline">
                      Weiter
                    </Button>
                  )}
                </>
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
                .sort((a, b) => a.production.dueAt - b.production.dueAt)
                .map((card) => (
                  <li className="flex items-center justify-between gap-3 rounded-lg border p-3" key={card.id}>
                    <div>
                      <p className="font-bold">
                        {card.front} <span className="font-normal text-muted-foreground">→ {card.back}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Erkennen fällig {new Date(card.recognition.dueAt).toLocaleDateString("de-DE")} ·
                        Produzieren fällig {new Date(card.production.dueAt).toLocaleDateString("de-DE")} ·{" "}
                        {card.recognition.lapses + card.production.lapses} Rückfall/Rückfälle
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
