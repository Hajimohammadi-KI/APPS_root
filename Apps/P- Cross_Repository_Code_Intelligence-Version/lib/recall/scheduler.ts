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

/**
 * Addiert `days` Tage und setzt die Uhrzeit auf den Beginn des lokalen Tages.
 *
 * Ohne die Normalisierung würde eine Wiederholung um 21:00 Uhr erst am
 * Folgetag um 21:00 Uhr fällig — die Tageskarte bliebe morgens leer, obwohl
 * die Wiederholung für "morgen" geplant war.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Prüft, ob ein Eintrag heute oder früher fällig ist — verglichen wird der
 * lokale Kalendertag, nicht der genaue Zeitstempel.
 */
export function isDueToday(nextReviewDate: string, now: Date = new Date()): boolean {
  const due = new Date(nextReviewDate);
  if (Number.isNaN(due.getTime())) return false;
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return due <= endOfToday;
}
