# Learning-Integrity Remediation and Release Evidence

**Updated:** 2026-08-19  
**Products:** English Grammar Automaticity 27.3.0 and DeutschFlow 20.8.9  
**Rule:** a claim is `VERIFIED` only when the source change and its relevant automated or live journey passed. External journeys that were not available remain `N/A` or `BLOCKED`; they are not converted into a score.

## Outcome

All code-addressable defects listed in the supplied audit were fixed and verified in the real repositories. Both language applications now pass their complete source gates, production builds, current browser suites, responsive checks, and compiled Windows installer lifecycle tests. The installer lifecycle includes fresh install, installed-app startup, update from the preserved previous release, repair after deliberate corruption, uninstall, and byte-for-byte user-data preservation.

This document does **not** claim a universal 10/10. A truthful independent 10/10 still requires the external evidence listed under **Honest limits**. The earlier scores must be re-issued by a fresh read-only audit; implementation work does not self-award them.

## Remediation status

| Finding / area | Status | Verified result |
|---|---|---|
| C-1 closed-exercise grading | VERIFIED | Wrong marker-word and wrong-subject answers no longer pass; regression tests cover the confirmed exploits. |
| C-2 automaticity validity | VERIFIED | Highest status requires delayed novel-context transfer; automaticity is now calculated from independent evidence rather than the mastery average. |
| C-3 topic-switch draft isolation | VERIFIED | German Mission state restores by topic key and cannot save the previous topic's draft under a new topic. |
| C-4 German Settings route | VERIFIED | `/einstellungen` performs a bounded live companion check and presents retry/back/details when unavailable instead of a broken redirect. |
| C-5 database status integrity | VERIFIED | Failed database health no longer falls back to `reachable: true`; device storage and database availability are separate states. |
| H-1 copy-typing leakage | VERIFIED | Both curriculum pipelines exclude the leaking prompt family before practice; content floors remain enforced. |
| H-2 stale speaking evidence | VERIFIED | New recordings invalidate prior transcript/evaluation/audio evidence in both apps. |
| H-3 improvement evidence | VERIFIED | Improve-and-save compares original attempt with the genuine second attempt and does not certify unchanged resubmission. |
| H-4 speaking WPM | VERIFIED | WPM is shown only from decoded active-speech duration; unavailable analysis is displayed as unavailable, never replaced by wall-clock time. |
| H-5 installer lifecycle | VERIFIED | Both compiled setup EXEs passed fresh install/startup/update/repair/uninstall and user-data preservation. |
| H-6 German state migration | VERIFIED | Versioned migration preserves attempts, mastery counts, schedules, and recordings without orphaning legacy state. |
| H-7 version ordering risk | VERIFIED | German release now uses monotonic semver `20.8.9`, updated consistently in package, desktop identity, setup config, and artifact. |
| M-1/M-2 Daily Practice consistency | VERIFIED | Completion is computed/committed through shared atomic helpers rather than duplicated display conventions. |
| M-3/M-4 provider transparency | VERIFIED | Summary states retain provider-specific detail and unavailable services remain unavailable; no false success fallback. |
| M-5 reduced motion | VERIFIED | Consolidated reduced-motion behavior exists; the duplicate English rule was removed. |
| M-6 narrow sidebar | VERIFIED | Sidebar width is guarded on narrow viewports. |
| M-7 stale Tracker comment | VERIFIED | Comment now matches stable schedule-position behavior. |
| M-8 coverage visibility | VERIFIED | The learner-facing progress view shows coverage independently from mastery and automaticity. |
| M-9 measurement independence | VERIFIED | Coverage, mastery, and automaticity have distinct inputs and gates; incorrect evidence cannot inflate automaticity. |
| L-1 Tracker migration write-back | VERIFIED | Remapped legacy IDs write back through local, server, and D1 paths; collision/idempotence tests pass. |
| L-2 duplicate CSS | VERIFIED | Duplicate reduced-motion rule removed. |
| L-3 PDF/Tracker responsive proof | VERIFIED | Controlled local harness passed `/`, `/settings`, and `/pdf-reader` at 375, 768, 1024, and 1440 px without overflow. |
| Exercise depth | VERIFIED | English: 112 units, 11–12 distinct deduplicated answers per unit, zero units at three or fewer. German: 144 units, minimum nine. |
| Vocabulary/SRS journey | VERIFIED | Both browser suites cover add, active recall, reschedule, persistence, and restore. |
| Speaking Studio journey | VERIFIED | Both browser suites cover record, evaluate, correct, improve, re-record, and save with deterministic MediaRecorder and provider-shaped responses. |

## Source and browser verification

### English — `D:\APPS_root\Apps\English\English-07082026`

- `bun run check` — PASSED: typecheck, lint with zero errors, package/web/domain tests (131), API tests (2), and installer tests.
- `bun run build` — PASSED: production build with a 26-route manifest.
- `bun run test:e2e` — PASSED: 24/24, no fixme/skip, including Speaking Studio and full SRS persistence.

### German — `D:\APPS_root\Apps\Deutsch-V10.08.2026`

- `bun run verify` — PASSED: format, lint, strict typecheck, unit/integration/installer/schema tests, and production build with a 29-route manifest.
- `PLAYWRIGHT_PWA=1 PLAYWRIGHT_VISUAL=1 bun run test:e2e` — PASSED: 19/19, no skipped tests, including offline/PWA, all 144 grammar units, responsive UI, Speaking Studio, and SRS persistence.

### Companion applications

- Central Settings — typecheck, lint, build, and 9 status tests PASSED.
- Tracker/PDF application — typecheck, lint, build, 57 Bun tests plus 41 Node tests PASSED.
- Tracker/PDF responsive harness — three routes at four viewports PASSED; no horizontal overflow. PDF body text measured 14 px with 14.11:1 contrast.

## Release artifacts and lifecycle evidence

The versioned artifacts, root install copies, payload ZIPs, and SHA sidecars match.

| Product | Current installer | SHA-256 | Verified update path |
|---|---|---|---|
| English 27.3.0 | `D:\APPS_root\Apps\English\English-07082026\artifacts\windows-installer\EnglishGrammar-Setup-v27.3.0.exe` | `127ae3ab0bfb1257e6cb6ff86c0f33728c10df1f5c6f4fdde71b89632759dfc2` | 27.2.0 → 27.3.0 |
| DeutschFlow 20.8.9 | `D:\APPS_root\Apps\Deutsch-V10.08.2026\artifacts\windows-installer\DeutschFlow-Setup-v20.8.9.exe` | `77d2f92ae616cd5072ee02b9b30c7c4a4c8d9036f2928f27c9a9dfb3232feeb9` | 20.8.8 → 20.8.9 |

Final lifecycle runs:

- English: `D:\APPS_root\artifacts\installer-cycle\English-27.3.0-final-shared-20260819-002557-6e55944a`
  - fresh installed web `200`, API `/api/health` `200`
  - post-update/repair web `200`, API `/api/health` `200`
- German: `D:\APPS_root\artifacts\installer-cycle\DeutschFlow-20.8.9-final-shared-20260819-002504-cb9f79ae`
  - fresh installed web `200`, API `/api/v1/health` `200`
  - post-update/repair web `200`, API `/api/v1/health` `200`
- Both runs preserved the synthetic learner-data file exactly: SHA-256 `35196FB18ABDDCDC1B4D4E59EF27129A9C6796F40711A17366E70935A3259705` before/after update, repair, and uninstall.

The lifecycle harness uses isolated per-run installer/data roots, a short isolated runtime-extraction cache, and clears `ELECTRON_RUN_AS_NODE`. The same runtime cache is retained between the fresh and post-repair launches, matching normal update/repair behavior while still starting the installed EXE and rechecking both HTTP services. The preservation hash above applies to the installer-controlled `DataRoot`; it is not a claim about an unmeasured external profile directory.

## Honest limits

| Evidence | Status | Reason |
|---|---|---|
| Physical microphone pronunciation journey | N/A — not sufficiently verified | The headless browser uses a deterministic MediaRecorder. Real audio decoding/active-speech algorithms and evidence gates are tested, but no physical microphone was available in this run. |
| Live OpenAI/DeepL/Google account calls | BLOCKED — credentials not supplied | Provider gates and failure states are verified; deterministic UI tests use provider-shaped responses. No external-account success is claimed. |
| Tracker live D1 API under local Next | BLOCKED — Cloudflare/D1 bindings unavailable | Responsive pages and source tests pass. Local API calls without bindings return 500 and are not presented as working. |
| Independent post-fix 20-area score | N/A — fresh audit required | A remediation session cannot truthfully grade its own work as 10/10. The evidence above is ready for a new read-only audit. |

## Release conclusion

The two language-app releases are **VERIFIED for the code, automated browser, build, compiled installer, update, repair, startup, and data-preservation scope exercised above**. No known addressable finding from the supplied audit remains open. Universal 10/10 is not asserted until the three external evidence gaps are independently exercised or explicitly scored as N/A.
