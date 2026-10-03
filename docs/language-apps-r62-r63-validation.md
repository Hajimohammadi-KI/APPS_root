# R62/R63 — reference matching and independent error repair

Checked 2026-10-03 in connected Chrome against the local source later prepared for release. These are application regressions, not evidence that the general language model is qualified.

## Automated evidence

- Case and punctuation regressions cover English `I/i`, German noun capitalization, negation, internal punctuation and malformed terminal sequences. Optional sentence-final period handling rejects `?.`, `!.`, `. .` and `... .` while preserving legitimate `?`, `!` and ellipses.
- The final punctuation suite passed 72 tests / 192 assertions, including the actual German static runtime handler. Six new cases failed before the fix. Shared browser assets were rebuilt and synchronized to both applications.
- Repair policy and related domain suites passed 23 tests / 127 assertions. They cover archived legacy confirmations, unchanged learner history, unsupported aggregate critical-error counts, due dates, persisted help exposure, closing help after an overnight session, repeated checking and self-reported review confidence.
- Separate code review approved the matcher, React integration and repair policy changes without outstanding findings.
- Final English `bun run check` and `bun run build`, German `bun run verify`, shared-workspace mirror checks and report-provenance tests all passed after the final source changes.

## Browser evidence

Fresh test origins `http://r62.localhost:3337` and `http://r63.localhost:3338` isolated authored QA records from production and existing learner storage. Data was entered through normal application forms. No production learner data was changed.

| Flow | Input or action | Observed result |
| --- | --- | --- |
| English progress, A1 controlled practice | `i agree.`, `i am a student.`, `She is tired!!!` | All three rejected; recognition and verified mastery remained zero. |
| English progress, correct answers | `I agree.`, `I am a student.`, `She is tired.` | All three accepted; recognition reached 100%, verified mastery remained zero. |
| German Automatik, controlled practice | `ich bin müde.` instead of `Ich bin müde.` | Incorrect capitalization rejected; correcting it changed the result from 2/3 to 3/3. |
| German authored writing | `Ich habe gegangen. Ich bin Studentin. Du bist freundlich. Wir sind zu Hause.` | Existing offline auxiliary rule supplied `Ich bin gegangen…`; the error was saved through the normal flow. |
| German error repair | Lowercase initial `ich` in the corrected text | Rejected. Correction and diagnosis were initially hidden. |
| German repair after viewing help | Exact correction and repeated checks | Accepted as practice, but zero errors were marked stably repaired. |
| German reload | Reload and recheck the correction | Help was hidden again; the persisted message required an independent check after 04.10.2026, 21:28. Reload and repeated checks did not award an independent success. |
| Responsive layouts | 390×844 and 768×1024 | No horizontal document overflow in either tested flow; buttons and feedback remained readable. |

Saved browser screenshots are under `artifacts/language-audit-20261003/`: `r62-en-mobile.png`, `r62-en-tablet.png`, `r63-de-mobile.png`, `r63-de-tablet.png`.

## Published release

Release `2026.10.03.11` was verified on both unchanged canonical URLs after the final roadmap deployment: English 11 matching asset hashes and six successful HTML routes; German 12 matching hashes and seven routes, including `/automatik`, `/fehler` and the changed German static runtime. Both release markers and manifests matched. Both evaluator endpoints returned `enabled: false` with no approvals.

Connected Chrome showed the new aggregate report on the canonical German site at a 390×844 viewport without horizontal overflow. Screenshot: `artifacts/language-audit-20261003/r61-production-report-mobile.png`. The application fixes are published; the general evaluator remains unqualified.

## Limits

- File-chooser fixture import was unavailable because Chrome's extension file-URL access was disabled. The browser test used authored form input instead; migration edge cases were checked by domain tests.
- Chrome injected a `data-qb-installed` attribute and produced a development hydration warning. No app-wide suppression was added.
- This browser run did not advance the physical clock to the next day; due-date and overnight-help transitions were checked in the pure domain tests.
- Recognition practice, memorized correction and repeating a sample do not establish independent grammatical production or speech automaticity. R36 and independent model qualification remain separate.
