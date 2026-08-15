// lib/recall/storage.ts
//
// Persistenz über localStorage — konsistent mit dem "local-first" Ansatz
// des PDF-Readers. Kein Server, keine neue Datenbank nötig.
//
// Der Zwischenspeicher und die Abonnentenliste machen daraus einen echten
// externen Store: `useSyncExternalStore` kann ihn ohne setState-im-Effekt
// lesen, und mehrere gleichzeitig eingehängte Karten teilen sich denselben
// Stand, statt sich gegenseitig zu überschreiben.

import type { RecallEntry } from './types';

const STORAGE_KEY = 'cri_recall_entries_v1';

/** Stabile Referenz: Snapshots dürfen sich nicht bei jedem Aufruf ändern. */
const EMPTY: readonly RecallEntry[] = Object.freeze([]);

let cache: readonly RecallEntry[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly RecallEntry[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as RecallEntry[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    console.warn('[recall] Konnte gespeicherte Einträge nicht lesen — setze zurück.');
    return EMPTY;
  }
}

export function loadRecallEntries(): readonly RecallEntry[] {
  if (cache === null) cache = read();
  return cache;
}

export function saveRecallEntries(entries: readonly RecallEntry[]): void {
  cache = entries;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
  for (const listener of listeners) listener();
}

export function subscribeToRecallEntries(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client-Snapshot: nach dem ersten Lesen immer dieselbe Referenz. */
export const getRecallSnapshot = loadRecallEntries;

/** Server-Snapshot: auf dem Server gibt es keinen localStorage. */
export function getRecallServerSnapshot(): readonly RecallEntry[] {
  return EMPTY;
}

/** Nur für Tests: setzt Zwischenspeicher und Abonnenten zurück. */
export function resetRecallStoreForTests(): void {
  cache = null;
  listeners.clear();
}
