// lib/recall/useRecallEntries.ts
//
// Zentraler Hook für das Recall-Check-Feature.
// Rufe `addEntry(...)` am Ende eines "Finden und verstehen"-Blocks auf,
// um ein neues Konzept in die Wiederholungs-Pipeline aufzunehmen.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RecallEntry, ConfidenceLevel } from './types';
import { loadRecallEntries, saveRecallEntries } from './storage';
import { computeNextInterval, addDays, isDueToday } from './scheduler';

export function useRecallEntries() {
  const [entries, setEntries] = useState<RecallEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadRecallEntries());
    setHydrated(true);
  }, []);

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
      setEntries((prev) => {
        const next = [...prev, entry];
        saveRecallEntries(next);
        return next;
      });
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
      setEntries((prev) => {
        const next = prev.map((e) => {
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
        return next;
      });
    },
    []
  );

  return { entries, dueToday, hydrated, addEntry, submitReview };
}
