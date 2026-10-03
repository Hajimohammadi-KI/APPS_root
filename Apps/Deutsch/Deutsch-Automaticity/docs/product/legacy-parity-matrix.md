# Legacy v20.8 parity matrix

The frozen source in `legacy/v20.8-static/index.html` is the authoritative
behavioral specification until every row below is proven in the Next/Nest
implementation. Catalog counts alone do not constitute parity.

## Shared state and platform

| Capability              | Legacy evidence                                             | React/Nest implementation                                       | Status |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| Versioned learner state | `GrammarAutomaticityV11_de` in localStorage                 | Compatible, normalized client store with cross-tab updates      | DONE   |
| Audio persistence       | IndexedDB `GrammarAutomaticityV11_de`, store `audio`        | Typed IndexedDB blob repository, playback, and deletion         | DONE   |
| PWA install/offline     | Manifest, service worker, install prompt, standalone status | Next manifest, scoped worker, install status, and offline E2E   | DONE   |
| Data portability        | JSON export/import and reload                               | Validated compatible import/export with reset confirmation      | DONE   |
| Speech output           | `speechSynthesis`, `de-DE`, rate `0.92`                     | Shared accessible listen controls using the same locale/rate    | DONE   |
| Evaluation              | LanguageTool plus offline and target-grammar checks         | Nest proxy plus deterministic evaluator and safe offline result | DONE   |

## Screens and workflows

| Screen                   | Required legacy behavior                                                                                                                                                  | Status |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Start                    | Banner artwork, progress ring, next tasks, streak/error/session statistics, offline-content message                                                                       | DONE   |
| Gesprächsstudio          | Five cascading filters, 79 topics, avatars, start/record/pause/stop/evaluate/end, speech recognition, manual transcript, chat, metrics, correction, error/audio saving    | DONE   |
| Täglicher Automatik-Pfad | A2 default migration, seven ordered gated exercises, saved answers, focus, evaluation, due reviews, streak and 70-day heatmap                                             | DONE   |
| Grammatik-Labor          | Level/category/search filters, all 84 units, controlled exercises, free production, target evidence, spoken confirmation, hints, solutions, mastery and review scheduling | DONE   |
| Online-Ressourcen        | 15 skill/exam groups, skill and level filtering, direct explanation/exercise links                                                                                        | DONE   |
| Fehlermotor              | Persisted corrections rendered newest first with changed-word emphasis                                                                                                    | DONE   |
| Audio-Bibliothek         | IndexedDB recordings, transcript, playback and deletion                                                                                                                   | DONE   |
| Einstellungen            | Minimum words, save-audio setting, LanguageTool endpoint, PWA/storage status, save, export and import                                                                     | DONE   |

## Learning invariants

- Daily steps must remain ordered; later steps cannot complete early.
- A grammar unit is mastered only after controlled, free, and spoken gates.
- Reviews use 1, 3, 7, 14, and 30 day intervals.
- An unavailable online evaluator cannot mark an answer as passed.
- Three-sentence tasks reject duplicate sentences.
- Conversation evaluation enforces the configured minimum word count.
- Existing v20.8 learner data must remain readable without manual conversion.

## Regression reference

The exact legacy application is published at `/legacy/index.html` and embedded
at `/klassik`. It remains available after parity as a stable comparison target
for content, behavior, and future regression testing.

## Verification

- Content tests enforce 79 complete topics, 84 unique units, 14 units per
  CEFR level, three or more exercises per unit, and both direct links.
- Domain tests cover ordered daily work, spaced reviews, malformed legacy
  imports, target-grammar checks, and failure-safe evaluation.
- Browser tests cover every product route, catalog filters, Studio word gates,
  settings persistence, responsive navigation, and the exact legacy fallback.
- The opt-in production PWA test verifies service-worker control and an offline
  reload.
