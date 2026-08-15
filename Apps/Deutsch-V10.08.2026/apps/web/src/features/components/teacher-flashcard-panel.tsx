"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, Plus, Upload } from "lucide-react";
import { HumanAudioPlayer, HumanAudioRecorder } from "@/components/human-audio-player";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import {
  listTeacherContent,
  saveTeacherContent,
  type TeacherContentItem,
} from "@/lib/teacher-content";
import type { FlashcardRecord } from "@grammar/domain";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Same lookup convention Automatik-Mission's speak() uses (contextKey
// "grammar-<unit title>"): a flashcard's pronunciation audio is stored as
// a regular TeacherContentItem keyed by "flashcard-<flashcard id>", not a
// new storage mechanism. One audio system for the whole app, not two.
function flashcardContextKey(cardId: string) {
  return `flashcard-${cardId}`;
}

export function parseBatchLine(
  line: string,
): { front: string; back: string; originalSentence?: string } | null {
  const parts = line.split("|").map((part) => part.trim());
  const [front, back, originalSentence] = parts;
  if (!front || !back) return null;
  return { front, back, ...(originalSentence ? { originalSentence } : {}) };
}

export function TeacherFlashcardPanel() {
  const { state, addFlashcard } = useLearnerState();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sentence, setSentence] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("A1");
  const [batchText, setBatchText] = useState("");
  const [batchMessage, setBatchMessage] = useState("");
  const [audioIndex, setAudioIndex] = useState<Map<string, TeacherContentItem>>(new Map());
  const [recordingForId, setRecordingForId] = useState<string | null>(null);
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);
  const [savingAudio, setSavingAudio] = useState(false);

  const refreshAudioIndex = useCallback(async () => {
    const items = await listTeacherContent();
    const next = new Map<string, TeacherContentItem>();
    for (const item of items) {
      if (item.kind === "flashcard") next.set(item.contextKey, item);
    }
    setAudioIndex(next);
  }, []);

  useEffect(() => {
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
        ? `${added} Karte(n) hinzugefügt. ${skipped} Zeile(n) ohne "Vorderseite | Rückseite" übersprungen.`
        : `${added} Karte(n) hinzugefügt.`,
    );
    setBatchText("");
  }

  async function saveAudioFor(card: FlashcardRecord) {
    if (!pendingAudio) return;
    setSavingAudio(true);
    try {
      const existing = audioIndex.get(flashcardContextKey(card.id));
      const item: TeacherContentItem = {
        id: existing?.id ?? crypto.randomUUID(),
        kind: "flashcard",
        level: (card.level as (typeof LEVELS)[number] | null) ?? "A1",
        title: card.front,
        body: card.back,
        contextKey: flashcardContextKey(card.id),
        audioName: "menschliche-aufnahme",
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
    <section className="teacher-editor teacher-flashcards-panel" aria-label="Vokabelkarten-Autoring">
      <h2>Vokabelkarten hinzufügen</h2>
      <p className="text-sm text-muted-foreground">
        Kein JSON und kein Code nötig -- füge Karten einzeln mit optionaler
        Ausspracheaufnahme hinzu oder füge eine ganze Liste auf einmal ein.
      </p>

      <div className="teacher-grid">
        <label>
          Vorderseite (Wort oder Ausdruck)
          <input onChange={(event) => setFront(event.target.value)} value={front} />
        </label>
        <label>
          Rückseite (Bedeutung oder Übersetzung)
          <input onChange={(event) => setBack(event.target.value)} value={back} />
        </label>
      </div>
      <label>
        Originalsatz (optional)
        <input onChange={(event) => setSentence(event.target.value)} value={sentence} />
      </label>
      <label>
        GER-Niveau
        <select
          onChange={(event) => setLevel(event.target.value as (typeof LEVELS)[number])}
          value={level}
        >
          {LEVELS.map((cefrLevel) => (
            <option key={cefrLevel}>{cefrLevel}</option>
          ))}
        </select>
      </label>
      <button
        className="teacher-primary-button"
        disabled={!front.trim() || !back.trim()}
        onClick={addSingleCard}
        type="button"
      >
        <Plus aria-hidden /> Karte hinzufügen
      </button>

      {recordingForId ? (
        <fieldset className="mt-3">
          <legend>Aussprache aufnehmen für „{front || "diese Karte"}“</legend>
          <label className="teacher-upload">
            <Upload aria-hidden /> Audiodatei wählen
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
              <Mic aria-hidden /> {savingAudio ? "Speichert…" : "Aussprache speichern"}
            </button>
            <button
              className="teacher-secondary-button"
              onClick={() => {
                setRecordingForId(null);
                setPendingAudio(null);
              }}
              type="button"
            >
              Ohne Audio für diese Karte
            </button>
          </div>
        </fieldset>
      ) : null}

      <h3 className="mt-4">Mehrere auf einmal hinzufügen</h3>
      <label>
        Eine Karte pro Zeile: <code>Vorderseite | Rückseite | Satz (optional)</code>
        <textarea
          onChange={(event) => setBatchText(event.target.value)}
          placeholder={"laufen | to run\ngegessen | Partizip von essen | Sie hat früh gegessen."}
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
        <Plus aria-hidden /> Alle Zeilen hinzufügen
      </button>
      {batchMessage ? (
        <p className="teacher-message" role="status">{batchMessage}</p>
      ) : null}

      {cardsWithoutAudio.length > 0 ? (
        <div className="mt-4">
          <h3>Karten ohne Ausspracheaufnahme ({cardsWithoutAudio.length})</h3>
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
                    <Mic aria-hidden /> Aussprache aufnehmen
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {state.flashcards.length > cardsWithoutAudio.length ? (
        <div className="mt-4">
          <h3>Karten mit Aussprache</h3>
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
