// lib/recall/useRecallEntries.ts
//
// Zentraler Hook für das Recall-Check-Feature.
// Rufe `addEntry(...)` am Ende eines "Finden und verstehen"-Blocks auf,
// um ein neues Konzept in die Wiederholungs-Pipeline aufzunehmen.

'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { RecallEntry, ConfidenceLevel } from './types';
import {
  getRecallServerSnapshot,
  getRecallSnapshot,
  loadRecallEntries,
  saveRecallEntries,
  subscribeToRecallEntries,
} from './storage';
import { computeNextInterval, addDays, isDueToday } from './scheduler';

export function useRecallEntries() {
  // Der externe Store wird direkt gelesen; kein setState im Effekt und damit
  // auch kein Auseinanderlaufen, wenn die Karte mehrfach eingehängt ist.
  const entries = useSyncExternalStore(
    subscribeToRecallEntries,
    getRecallSnapshot,
    getRecallServerSnapshot,
  );

  // Auf dem Server false, im Browser true — so lässt sich das kurze
  // Aufblitzen von "keine Wiederholung fällig" vermeiden.
  const hydrated = useSyncExternalStore(
    subscribeToRecallEntries,
    () => true,
    () => false,
  );

  const dueToday = useMemo(
    () => entries.filter((e) => isDueToday(e.nextReviewDate)),
    [entries]
  );

  /** Neues Konzept nach dem Lernen (Tag 0) registrieren. Fällig ab morgen. */
  const addEntry = useCallback(
    (params: {
      concept: string;
      sourceId?: string;
      sourceTitle?: string;
      originalNoteFA?: string;
      originalNoteDE?: string;
    }) => {
      const now = new Date().toISOString();
      const entry: RecallEntry = {
        id: crypto.randomUUID(),
        concept: params.concept,
        sourceId: params.sourceId,
        sourceTitle: params.sourceTitle,
        originalNoteFA: params.originalNoteFA,
        originalNoteDE: params.originalNoteDE,
        createdAt: now,
        reviews: [],
        nextReviewDate: addDays(now, 1), // Tag 1 = erste Wiederholung
      };
      saveRecallEntries([...loadRecallEntries(), entry]);
      return entry;
    },
    []
  );

  /** Eine Wiederholung abschließen und das nächste Intervall berechnen. */
  const submitReview = useCallback(
    (
      entryId: string,
      recallFA: string,
      recallDE: string,
      confidence: ConfidenceLevel
    ) => {
      const next = loadRecallEntries().map((e) => {
        if (e.id !== entryId) return e;
        const lastInterval =
          e.reviews.length > 0
            ? e.reviews[e.reviews.length - 1].intervalDay
            : 0;
        const nextInterval = computeNextInterval(lastInterval, confidence);
        const nowIso = new Date().toISOString();
        return {
          ...e,
          reviews: [
            ...e.reviews,
            {
              date: nowIso,
              intervalDay: nextInterval,
              recallFA,
              recallDE,
              confidence,
            },
          ],
          nextReviewDate: addDays(nowIso, nextInterval),
        };
      });
      saveRecallEntries(next);
    },
    []
  );

  return { entries, dueToday, hydrated, addEntry, submitReview };
}
