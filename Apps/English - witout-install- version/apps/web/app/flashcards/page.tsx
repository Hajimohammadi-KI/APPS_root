"use client";

import * as React from "react";
import Link from "next/link";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	useAppStore,
	type FlashcardItem,
	type FlashcardMode,
} from "@/features/store/app-store";
import { playTeacherAudioByContextKey } from "@/lib/teacher-content";

// Same contextKey convention Teacher Mode's flashcard panel writes to
// (teacher-flashcard-panel.tsx) -- a real human recording, when a teacher
// has added one, takes priority over the synthetic fallback.
async function speakFlashcardFront(card: FlashcardItem) {
	const played = await playTeacherAudioByContextKey(`flashcard-${card.id}`).catch(
		() => false,
	);
	if (played) return;
	if (!("speechSynthesis" in window)) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(card.front);
	utterance.lang = "en-US";
	window.speechSynthesis.speak(utterance);
}

interface DueItem {
	card: FlashcardItem;
	mode: FlashcardMode;
}

function normalize(value: string) {
	return value.trim().toLocaleLowerCase();
}

// Recognition (pick the right front from a few options) needs real
// distractors -- below this many total cards there aren't enough other
// fronts to build a fair multiple-choice question, so only production
// (typed recall) is tested until the deck grows.
const MIN_CARDS_FOR_RECOGNITION = 4;

export default function FlashcardsPage() {
	const { state, addFlashcard, gradeFlashcard, deleteFlashcard, setTodayGrammar } = useAppStore();
	const [front, setFront] = React.useState("");
	const [back, setBack] = React.useState("");
	const [originalSentence, setOriginalSentence] = React.useState("");
	const [productionAnswer, setProductionAnswer] = React.useState("");
	const [productionResult, setProductionResult] = React.useState<"correct" | "incorrect" | null>(null);
	// A forgotten card ("Again") previously just went back into the queue
	// with no way to actually practice the pattern it came from -- when the
	// card was added from a grammar lesson, offer a direct link to work
	// that lesson in today's Mission instead of only re-testing recall.
	const [correctiveLesson, setCorrectiveLesson] = React.useState<string | null>(null);

	const now = Date.now();
	const canTestRecognition = state.flashcards.length >= MIN_CARDS_FOR_RECOGNITION;
	const dueItems = React.useMemo(() => {
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

	const recognitionChoices = React.useMemo(() => {
		if (activeItem?.mode !== "recognition") return [];
		const distractors = state.flashcards
			.filter((card) => card.id !== activeItem.card.id)
			.map((card) => card.front)
			.filter((value, index, all) => all.indexOf(value) === index)
			.sort(() => Math.random() - 0.5)
			.slice(0, 3);
		return [...distractors, activeItem.card.front].sort(() => Math.random() - 0.5);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeItem?.card.id, activeItem?.mode]);

	function submitNewCard(event: React.FormEvent) {
		event.preventDefault();
		if (!front.trim() || !back.trim()) return;
		addFlashcard({
			front,
			back,
			source: "manual",
			originalSentence: originalSentence.trim() || undefined,
		});
		setFront("");
		setBack("");
		setOriginalSentence("");
	}

	function afterGrade(cardGrade: "again" | "hard" | "good") {
		if (!activeItem) return;
		setCorrectiveLesson(
			cardGrade === "again" ? (activeItem.card.lesson ?? null) : null,
		);
		// The answer's visibility is driven by productionResult (null = not yet
		// answered), so resetting that is what actually re-hides it between
		// cards. A separate `revealed` state used to live here but was only ever
		// written, never read, so it reset nothing.
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
		if (unit) setTodayGrammar(unit);
	}

	return (
		<div className="page-stack">
			<div className="page-heading">
				<Badge>{state.flashcards.length} cards · {dueItems.length} due now</Badge>
				<h1>Vocabulary &amp; Flashcards</h1>
				<p>
					Recognition (multiple choice) and production (typed recall) are
					tracked as two separate schedules per card -- recognizing a word
					and producing it unprompted are different skills. Grading is
					checked automatically, not self-reported. Cards stay on this
					device.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Review</CardTitle>
					<CardDescription>
						{activeItem?.mode === "recognition"
							? "Pick the word that matches this meaning."
							: "Type the word from memory before checking."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{correctiveLesson ? (
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
							<span>
								This card came from <strong>{correctiveLesson}</strong> --
								practice the pattern itself, not just the word.
							</span>
							<Button asChild onClick={practiceCorrectiveLesson} size="sm">
								<Link href="/daily">Practice {correctiveLesson}</Link>
							</Button>
						</div>
					) : null}
					{!activeItem ? (
						<p className="text-sm text-muted-foreground">
							Nothing due right now. New or graded cards reappear here when
							they're due.
							{!canTestRecognition ? (
								<>
									{" "}
									Add {MIN_CARDS_FOR_RECOGNITION - state.flashcards.length} more
									card(s) to unlock multiple-choice recognition testing.
								</>
							) : null}
						</p>
					) : activeItem.mode === "recognition" ? (
						<div className="space-y-4 rounded-lg border p-4">
							<Badge variant="secondary">Recognition</Badge>
							<div>
								<p className="text-xs font-bold uppercase text-muted-foreground">Meaning</p>
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
							<Badge variant="secondary">Production</Badge>
							<div>
								<p className="text-xs font-bold uppercase text-muted-foreground">Meaning</p>
								<p className="text-lg font-bold">{activeItem.card.back}</p>
							</div>
							{productionResult === null ? (
								<>
									<Input
										aria-label="Typed answer"
										onChange={(event) => setProductionAnswer(event.target.value)}
										onKeyDown={(event) => event.key === "Enter" && checkProduction()}
										placeholder="Write it from memory"
										value={productionAnswer}
									/>
									<Button disabled={!productionAnswer.trim()} onClick={checkProduction}>
										Check
									</Button>
								</>
							) : (
								<>
									<div>
										<p className="text-xs font-bold uppercase text-muted-foreground">
											{productionResult === "correct" ? "Correct" : "Correct answer"}
										</p>
										<div className="flex items-center gap-2">
											<p className="text-lg">{activeItem.card.front}</p>
											<Button
												onClick={() => void speakFlashcardFront(activeItem.card)}
												size="sm"
												variant="outline"
											>
												Listen
											</Button>
										</div>
									</div>
									{activeItem.card.originalSentence ? (
										<div>
											<p className="text-xs font-bold uppercase text-muted-foreground">
												Original sentence
											</p>
											<p className="text-sm italic">{activeItem.card.originalSentence}</p>
										</div>
									) : null}
									{productionResult === "correct" ? (
										<div className="flex flex-wrap gap-2">
											<Button onClick={() => gradeProductionDifficulty("hard")} variant="outline">
												Correct, but hard
											</Button>
											<Button onClick={() => gradeProductionDifficulty("good")}>
												Correct and easy
											</Button>
										</div>
									) : (
										<Button onClick={() => afterGrade("again")} variant="outline">
											Next
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
					<CardTitle>Add a card</CardTitle>
					<CardDescription>
						Same word and meaning added twice is skipped automatically, not
						duplicated.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-3" onSubmit={submitNewCard}>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<Label htmlFor="flashcard-front">Front (word or phrase)</Label>
								<Input id="flashcard-front" onChange={(event) => setFront(event.target.value)} value={front} />
							</div>
							<div>
								<Label htmlFor="flashcard-back">Back (meaning or translation)</Label>
								<Input id="flashcard-back" onChange={(event) => setBack(event.target.value)} value={back} />
							</div>
						</div>
						<div>
							<Label htmlFor="flashcard-sentence">Original sentence (optional)</Label>
							<Textarea
								id="flashcard-sentence"
								onChange={(event) => setOriginalSentence(event.target.value)}
								placeholder="The sentence you found this word in"
								value={originalSentence}
							/>
						</div>
						<Button disabled={!front.trim() || !back.trim()} type="submit">
							Add card
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>All cards</CardTitle>
				</CardHeader>
				<CardContent>
					{state.flashcards.length === 0 ? (
						<p className="text-sm text-muted-foreground">No cards yet.</p>
					) : (
						<ul className="space-y-2">
							{state.flashcards
								.toSorted((a, b) => a.production.dueAt - b.production.dueAt)
								.map((card) => (
									<li className="flex items-center justify-between gap-3 rounded-lg border p-3" key={card.id}>
										<div>
											<p className="font-bold">
												{card.front} <span className="font-normal text-muted-foreground">→ {card.back}</span>
											</p>
											<p className="text-xs text-muted-foreground">
												Recognition due {new Date(card.recognition.dueAt).toLocaleDateString()} ·
												Production due {new Date(card.production.dueAt).toLocaleDateString()} ·{" "}
												{card.recognition.lapses + card.production.lapses} lapse(s)
												{card.source !== "manual" ? ` · from ${card.source}` : ""}
											</p>
										</div>
										<Button onClick={() => deleteFlashcard(card.id)} size="sm" variant="outline">
											Delete
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
