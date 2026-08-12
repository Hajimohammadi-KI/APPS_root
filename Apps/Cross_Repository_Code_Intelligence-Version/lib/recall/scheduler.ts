// lib/recall/scheduler.ts
//
// Einfache, feste Intervall-Logik (kein SM-2 nötig für den Start).
// 1 -> 3 -> 7 -> 14 -> 30 Tage; bei "weak" wird auf 1 Tag zurückgesetzt.

import type { ConfidenceLevel } from './types';

export const INTERVALS = [1, 3, 7, 14, 30] as const;

/**
 * Berechnet das nächste Intervall (in Tagen) basierend auf dem
 * aktuellen Intervall und der Selbsteinschätzung der letzten Wiederholung.
 */
export function computeNextInterval(
  currentIntervalDay: number,
  confidence: ConfidenceLevel
): number {
  if (confidence === 'weak') return INTERVALS[0];

  const idx = INTERVALS.indexOf(currentIntervalDay as (typeof INTERVALS)[number]);
  if (idx === -1) return INTERVALS[0];

  return INTERVALS[Math.min(idx + 1, INTERVALS.length - 1)];
}

/** Addiert `days` Tage zu einem ISO-Datum und gibt ein neues ISO-Datum zurück. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Prüft, ob ein Eintrag heute (oder überfällig) zur Wiederholung fällig ist. */
export function isDueToday(nextReviewDate: string): boolean {
  return new Date(nextReviewDate) <= new Date();
}
