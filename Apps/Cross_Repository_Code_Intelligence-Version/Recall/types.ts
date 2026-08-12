// lib/recall/types.ts
//
// Datenmodell für das "Recall Check" Feature.
// Wird lokal im Browser gespeichert (localStorage) — kein Server nötig,
// passend zum "local-first" Prinzip des restlichen PDF-Readers.

export type ConfidenceLevel = 'weak' | 'medium' | 'good';

export interface RecallReview {
  /** ISO-Zeitstempel, wann diese Wiederholung stattfand */
  date: string;
  /** Das Intervall (in Tagen), das NACH dieser Wiederholung gilt */
  intervalDay: number;
  /** Freie Antwort auf Farsi, ohne in den Text zu schauen */
  recallFA: string;
  /** Freie Antwort auf Deutsch, ohne in den Text zu schauen */
  recallDE: string;
  confidence: ConfidenceLevel;
}

export interface RecallEntry {
  id: string;
  /** z. B. "§1, §6, §7" — Bezug zum Exposé, wie in den bestehenden Tages-Karten */
  sourceId?: string;
  /** z. B. "Cross_Repository_Code_Intelligence_Lern_Expose_DE_2026_v2_4.pdf" */
  sourceTitle?: string;
  /** Kurzer Titel des Konzepts, z. B. "Kernproblem der Cross-Repository-Analyse" */
  concept: string;
  /** Die ursprüngliche Antwort vom Lerntag (Tag 0), zum späteren Vergleich */
  originalNoteFA?: string;
  originalNoteDE?: string;
  createdAt: string;
  reviews: RecallReview[];
  /** ISO-Datum, wann die nächste Wiederholung fällig ist */
  nextReviewDate: string;
}
