"use client";

import * as React from "react";
import { Mic, Plus, Upload } from "lucide-react";
import type { CefrLevel } from "@grammar/content";
import { HumanAudioPlayer, HumanAudioRecorder } from "@/features/components/human-audio-player";
import { AccordionSelect } from "@/components/ui/accordion-select";
import { useAppStore, type FlashcardItem } from "@/features/store/app-store";
import {
	listTeacherContent,
	saveTeacherContent,
	type TeacherContentItem,
} from "@/lib/teacher-content";

const LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Same lookup convention Mission's speak() uses (contextKey "grammar-<unit
// title>"): a flashcard's pronunciation audio is stored as a regular
// TeacherContentItem keyed by "flashcard-<flashcard id>", not a new storage
// mechanism. This keeps one audio system for the whole app instead of two.
function flashcardContextKey(cardId: string) {
	return `flashcard-${cardId}`;
}

export function parseBatchLine(line: string): { front: string; back: string; originalSentence?: string } | null {
	const parts = line.split("|").map((part) => part.trim());
	const [front, back, originalSentence] = parts;
	if (!front || !back) return null;
	return { front, back, ...(originalSentence ? { originalSentence } : {}) };
}

export function TeacherFlashcardPanel() {
	const { state, addFlashcard } = useAppStore();
	const [front, setFront] = React.useState("");
	const [back, setBack] = React.useState("");
	const [sentence, setSentence] = React.useState("");
	const [level, setLevel] = React.useState<CefrLevel>("A1");
	const [batchText, setBatchText] = React.useState("");
	const [batchMessage, setBatchMessage] = React.useState("");
	const [audioIndex, setAudioIndex] = React.useState<Map<string, TeacherContentItem>>(new Map());
	const [recordingForId, setRecordingForId] = React.useState<string | null>(null);
	const [pendingAudio, setPendingAudio] = React.useState<Blob | null>(null);
	const [savingAudio, setSavingAudio] = React.useState(false);

	const refreshAudioIndex = React.useCallback(async () => {
		const items = await listTeacherContent();
		const next = new Map<string, TeacherContentItem>();
		for (const item of items) {
			if (item.kind === "flashcard") next.set(item.contextKey, item);
		}
		setAudioIndex(next);
	}, []);

	React.useEffect(() => {
		void refreshAudioIndex();
	}, [refreshAudioIndex]);

	function addSingleCard() {
		if (!front.trim() || !back.trim()) return;
		const card = addFlashcard({
			front,
			back,
			source: "lesson",
			level,
			...(sentence.trim() ? { originalSentence: sentence.trim() } : {}),
		});
		setFront("");
		setBack("");
		setSentence("");
		if (card) {
			setRecordingForId(card.id);
			setPendingAudio(null);
		}
	}

	function addBatch() {
		const lines = batchText.split("\n").map((line) => line.trim()).filter(Boolean);
		let added = 0;
		let skipped = 0;
		for (const line of lines) {
			const parsed = parseBatchLine(line);
			if (!parsed) {
				skipped += 1;
				continue;
			}
			addFlashcard({ ...parsed, source: "lesson", level });
			added += 1;
		}
		setBatchMessage(
			skipped > 0
				? `Added ${added} card(s). Skipped ${skipped} line(s) missing "front | back".`
				: `Added ${added} card(s).`,
		);
		setBatchText("");
	}

	async function saveAudioFor(card: FlashcardItem) {
		if (!pendingAudio) return;
		setSavingAudio(true);
		try {
			const existing = audioIndex.get(flashcardContextKey(card.id));
			const item: TeacherContentItem = {
				id: existing?.id ?? crypto.randomUUID(),
				kind: "flashcard",
				level: card.level ?? "A1",
				title: card.front,
				body: card.back,
				contextKey: flashcardContextKey(card.id),
				audioName: "human-recording",
				audioType: pendingAudio.type,
				updatedAt: new Date().toISOString(),
			};
			await saveTeacherContent(item, pendingAudio);
			await refreshAudioIndex();
			setRecordingForId(null);
			setPendingAudio(null);
		} finally {
			setSavingAudio(false);
		}
	}

	const cardsWithoutAudio = state.flashcards.filter(
		(card) => !audioIndex.has(flashcardContextKey(card.id)),
	);

	return (
		<section className="teacher-editor teacher-flashcards-panel" aria-label="Flashcard authoring">
			<h2>Add flashcards</h2>
			<p className="text-sm text-muted-foreground">
				No JSON or code needed -- add cards one at a time with an optional
				recorded pronunciation, or paste a whole list at once.
			</p>

			<div className="teacher-grid">
				<label>
					Front (word or phrase)
					<input onChange={(event) => setFront(event.target.value)} value={front} />
				</label>
				<label>
					Back (meaning or translation)
					<input onChange={(event) => setBack(event.target.value)} value={back} />
				</label>
			</div>
			<label>
				Original sentence (optional)
				<input onChange={(event) => setSentence(event.target.value)} value={sentence} />
			</label>
			<AccordionSelect
				label="CEFR level"
				onChange={(next) => setLevel(next as CefrLevel)}
				options={LEVELS.map((cefrLevel) => ({ value: cefrLevel, label: cefrLevel }))}
				value={level}
			/>
			<button
				className="teacher-primary-button"
				disabled={!front.trim() || !back.trim()}
				onClick={addSingleCard}
				type="button"
			>
				<Plus aria-hidden /> Add card
			</button>

			{recordingForId ? (
				<fieldset className="mt-3">
					<legend>Record pronunciation for "{front || "this card"}"</legend>
					<label className="teacher-upload">
						<Upload aria-hidden /> Choose audio file
						<input
							accept="audio/*"
							onChange={(event) => setPendingAudio(event.target.files?.[0] ?? null)}
							type="file"
						/>
					</label>
					<HumanAudioRecorder onRecorded={setPendingAudio} />
					<div className="mt-2 flex flex-wrap gap-2">
						<button
							className="teacher-primary-button"
							disabled={!pendingAudio || savingAudio}
							onClick={() => {
								const card = state.flashcards.find((item) => item.id === recordingForId);
								if (card) void saveAudioFor(card);
							}}
							type="button"
						>
							<Mic aria-hidden /> {savingAudio ? "Saving…" : "Save pronunciation"}
						</button>
						<button
							className="teacher-secondary-button"
							onClick={() => {
								setRecordingForId(null);
								setPendingAudio(null);
							}}
							type="button"
						>
							Skip audio for this card
						</button>
					</div>
				</fieldset>
			) : null}

			<h3 className="mt-4">Add many at once</h3>
			<label>
				One card per line: <code>front | back | sentence (optional)</code>
				<textarea
					onChange={(event) => setBatchText(event.target.value)}
					placeholder={"run | to run\nate | ate (past of eat) | She ate breakfast early."}
					rows={5}
					value={batchText}
				/>
			</label>
			<button
				className="teacher-secondary-button"
				disabled={!batchText.trim()}
				onClick={addBatch}
				type="button"
			>
				<Plus aria-hidden /> Add all lines
			</button>
			{batchMessage ? (
				<p className="teacher-message" role="status">{batchMessage}</p>
			) : null}

			{cardsWithoutAudio.length > 0 ? (
				<div className="mt-4">
					<h3>Cards without a recorded pronunciation ({cardsWithoutAudio.length})</h3>
					<div className="teacher-items">
						{cardsWithoutAudio.map((card) => (
							<article key={card.id}>
								<div className="teacher-item-meta">
									<span>{card.level ?? "—"}</span>
									<code>{card.front}</code>
								</div>
								<p>{card.back}</p>
								{recordingForId === card.id ? null : (
									<button
										className="teacher-secondary-button"
										onClick={() => {
											setRecordingForId(card.id);
											setPendingAudio(null);
										}}
										type="button"
									>
										<Mic aria-hidden /> Record pronunciation
									</button>
								)}
							</article>
						))}
					</div>
				</div>
			) : null}

			{state.flashcards.length > cardsWithoutAudio.length ? (
				<div className="mt-4">
					<h3>Cards with pronunciation</h3>
					<div className="teacher-items">
						{state.flashcards
							.filter((card) => audioIndex.has(flashcardContextKey(card.id)))
							.map((card) => {
								const teacherItem = audioIndex.get(flashcardContextKey(card.id))!;
								return (
									<article key={card.id}>
										<div className="teacher-item-meta">
											<span>{card.level ?? "—"}</span>
											<code>{card.front}</code>
										</div>
										<p>{card.back}</p>
										<HumanAudioPlayer compact contentId={teacherItem.id} />
									</article>
								);
							})}
					</div>
				</div>
			) : null}
		</section>
	);
}
