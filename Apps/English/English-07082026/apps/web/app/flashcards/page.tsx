"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore, type FlashcardGrade } from "@/features/store/app-store";

export default function FlashcardsPage() {
	const { state, addFlashcard, gradeFlashcard, deleteFlashcard } = useAppStore();
	const [front, setFront] = React.useState("");
	const [back, setBack] = React.useState("");
	const [originalSentence, setOriginalSentence] = React.useState("");
	const [revealed, setRevealed] = React.useState(false);

	const now = Date.now();
	const dueCards = React.useMemo(
		() => state.flashcards.filter((card) => card.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[state.flashcards],
	);
	const activeCard = dueCards[0] ?? null;

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

	function grade(cardGrade: FlashcardGrade) {
		if (!activeCard) return;
		gradeFlashcard(activeCard.id, cardGrade);
		setRevealed(false);
	}

	return (
		<div className="page-stack">
			<div className="page-heading">
				<Badge>{state.flashcards.length} cards · {dueCards.length} due now</Badge>
				<h1>Vocabulary &amp; Flashcards</h1>
				<p>
					Real spaced repetition: grading a card Again/Hard/Good changes when
					it comes back, the same interval ladder the grammar review queue
					uses. Cards stay on this device.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Review</CardTitle>
					<CardDescription>
						Recall the answer before revealing it -- that's the whole point of
						a delayed test.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{!activeCard ? (
						<p className="text-sm text-muted-foreground">
							Nothing due right now. New or graded cards reappear here when
							they're due.
						</p>
					) : (
						<div className="space-y-4 rounded-lg border p-4">
							<div>
								<p className="text-xs font-bold uppercase text-muted-foreground">Front</p>
								<p className="text-lg font-bold">{activeCard.front}</p>
							</div>
							{revealed ? (
								<>
									<div>
										<p className="text-xs font-bold uppercase text-muted-foreground">Back</p>
										<p className="text-lg">{activeCard.back}</p>
									</div>
									{activeCard.originalSentence ? (
										<div>
											<p className="text-xs font-bold uppercase text-muted-foreground">
												Original sentence
											</p>
											<p className="text-sm italic">{activeCard.originalSentence}</p>
										</div>
									) : null}
									<div className="flex flex-wrap gap-2">
										<Button onClick={() => grade("again")} variant="outline">
											Again
										</Button>
										<Button onClick={() => grade("hard")} variant="outline">
											Hard
										</Button>
										<Button onClick={() => grade("good")}>Good</Button>
									</div>
								</>
							) : (
								<Button onClick={() => setRevealed(true)}>Show answer</Button>
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
								.toSorted((a, b) => a.dueAt - b.dueAt)
								.map((card) => (
									<li className="flex items-center justify-between gap-3 rounded-lg border p-3" key={card.id}>
										<div>
											<p className="font-bold">
												{card.front} <span className="font-normal text-muted-foreground">→ {card.back}</span>
											</p>
											<p className="text-xs text-muted-foreground">
												Due {new Date(card.dueAt).toLocaleDateString()} · {card.lapses} lapse(s)
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
