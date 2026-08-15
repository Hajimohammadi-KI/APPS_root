// components/RecallCheck.tsx
//
// UI-Karte "Was solltest du heute wiederholen?" — im Stil der
// bestehenden Tages-Karten (Design 1, Woche 1, ...).
//
// Einbindung z. B. im Dashboard, direkt unter der Fokus-Karte:
//   import { RecallCheck } from '@/components/RecallCheck';
//   <RecallCheck />

'use client';

import { useState } from 'react';
import { useRecallEntries } from '@/lib/recall/useRecallEntries';
import type { ConfidenceLevel } from '@/lib/recall/types';

export function RecallCheck() {
  const { dueToday, hydrated, submitReview } = useRecallEntries();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [recallFA, setRecallFA] = useState('');
  const [recallDE, setRecallDE] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  const activeEntry = dueToday.find((e) => e.id === activeId) ?? null;

  function handleSubmit(confidence: ConfidenceLevel) {
    if (!activeEntry) return;
    submitReview(activeEntry.id, recallFA, recallDE, confidence);
    setShowOriginal(true);
  }

  function resetAndClose() {
    setActiveId(null);
    setRecallFA('');
    setRecallDE('');
    setShowOriginal(false);
  }

  // Die Einträge liegen im localStorage und stehen erst nach dem ersten
  // Client-Render bereit. Ohne diese Prüfung blitzt "keine Wiederholung"
  // kurz auf, obwohl Konzepte fällig sind.
  if (!hydrated) return null;

  if (dueToday.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Heute keine Wiederholung fällig.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-white shadow-sm">
      <div className="border-b border-purple-100 px-4 py-3">
        <h3 className="font-semibold text-purple-900">
          Was solltest du heute wiederholen?
        </h3>
        <p className="text-xs text-slate-500">
          {dueToday.length} Konzept(e) fällig
        </p>
      </div>

      {!activeEntry ? (
        <ul className="divide-y divide-slate-100">
          {dueToday.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {entry.concept}
                </p>
                {entry.sourceId && (
                  <p className="text-xs text-slate-400">{entry.sourceId}</p>
                )}
              </div>
              <button
                onClick={() => setActiveId(entry.id)}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                Wiederholung starten
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {activeEntry.concept}
            </p>
            {activeEntry.sourceId && (
              <p className="text-xs text-slate-400">{activeEntry.sourceId}</p>
            )}
          </div>

          {!showOriginal ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  فارسی
                </label>
                <textarea
                  value={recallFA}
                  onChange={(e) => setRecallFA(e.target.value)}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="بدون نگاه به متن، از حافظه بنویس..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Deutsch
                </label>
                <textarea
                  value={recallDE}
                  onChange={(e) => setRecallDE(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="Schreibe es auf Deutsch, ohne nachzuschauen..."
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  Wie sicher warst du?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmit('weak')}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Schwach
                  </button>
                  <button
                    onClick={() => handleSubmit('medium')}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  >
                    Mittel
                  </button>
                  <button
                    onClick={() => handleSubmit('good')}
                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Gut
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-slate-500">
                  Deine Antwort
                </p>
                <p dir="rtl" className="text-slate-700">
                  {recallFA || '—'}
                </p>
                <p className="mt-1 text-slate-700">{recallDE || '—'}</p>
              </div>

              {(activeEntry.originalNoteFA || activeEntry.originalNoteDE) && (
                <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-purple-600">
                    Originalnotiz (Tag 0)
                  </p>
                  {activeEntry.originalNoteFA && (
                    <p dir="rtl" className="text-slate-700">
                      {activeEntry.originalNoteFA}
                    </p>
                  )}
                  {activeEntry.originalNoteDE && (
                    <p className="mt-1 text-slate-700">
                      {activeEntry.originalNoteDE}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={resetAndClose}
                className="w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
