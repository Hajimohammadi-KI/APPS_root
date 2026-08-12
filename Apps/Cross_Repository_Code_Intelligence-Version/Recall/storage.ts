// lib/recall/storage.ts
//
// Persistenz über localStorage — konsistent mit dem "local-first" Ansatz
// des PDF-Readers. Kein Server, keine neue Datenbank nötig.

import type { RecallEntry } from './types';

const STORAGE_KEY = 'cri_recall_entries_v1';

export function loadRecallEntries(): RecallEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecallEntry[];
  } catch {
    console.warn('[recall] Konnte gespeicherte Einträge nicht lesen — setze zurück.');
    return [];
  }
}

export function saveRecallEntries(entries: RecallEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
