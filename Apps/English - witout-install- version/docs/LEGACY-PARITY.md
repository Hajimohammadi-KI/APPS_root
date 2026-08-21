# Legacy parity matrix

This matrix is the migration contract between the root v27 PWA and the
Next.js/NestJS software. “Parity” means that the original content and primary
workflow remain available; it does not prevent the migrated product from
adding stricter assessment, mastery evidence, or researched curriculum units.

| Surface | Legacy contract | Migrated implementation | Automated evidence |
| --- | --- | --- | --- |
| Start | Original banner, Dashboard, circular 7-step progress, Next 3 tasks, quote, streak/errors/sessions, installed-content card | Same banner asset and color tokens, restored dashboard content and ring, plus mastery and recurring-error signals | Dashboard text/theme comparison and paired screenshots |
| Conversation Studio | 72 topics; path → level → skill → category → topic filters; six recording/session controls; transcript, correction, live metrics | All 72 topics and filters; MediaRecorder, speech recognition/synthesis, six controls, blocking Nest/LanguageTool assessment, grammar-correction panel, explicit and automatic error capture, safe session shutdown, and audio evidence | Control/count parity, saved-assessment/error-repair journey, and browser screenshot |
| Daily Automaticity Path | Seven gated tasks, due reviews, streak, 70-day heat map | Same seven named tasks and evidence gates, due review queue, spaced intervals, streak and heat map | Seven-task count and label assertions |
| Grammar Lab | 84 A1–C2 units, 14 categories, search/level filters, controlled and original production, rule/examples/exact-topic links | All 84 legacy units plus 28 researched supplements; 112 searchable units; at least five controlled exercises per unit; original production and mastery evidence | Content tests, 112 rendered-unit assertion, exercise flow, browser screenshot |
| Online Resources | 43 exact Test-English/British Council collections and IELTS tests with skill/level filtering | All 43 typed resources plus search, provider/level/skill labels, and exact external destinations | 43-item source and migrated DOM counts |
| Error Engine | Saved personal corrections | Categorized recurring errors, occurrence counts, blocking six-stage repair chain, scheduled review | Screen/navigation test and state-backed repair implementation |
| Audio Library | IndexedDB recordings, playback, transcript, deletion | IndexedDB recordings, playback, transcript, corrected model, speech, repetition status, deletion | Screen/navigation test and browser-storage implementation |
| Settings | Minimum words, save audio, LanguageTool engine/endpoint, PWA/storage status, import/export | Same recognizable controls, with LanguageTool routed through the Nest API; API connectivity test, versioned v27 import/export and legacy backup migration | Label parity and Nest health browser test |
| PWA shell | Manifest, icons, service worker, offline page, install prompt | Next manifest, same icon assets, service worker, offline route, install prompt and local-first persistence | Production build and desktop/mobile browser tests |

Every migrated surface is also represented in the URL through
`?screen=<surface>`. Reload, Back, Forward, and direct links preserve the active
surface without sacrificing the legacy single-shell interaction model.

## Preserved source archive

The root archive is independently runnable with:

```powershell
bun run legacy:preview
```

It opens at `http://localhost:3301/legacy/index.html`. The parity suite verifies that
all required archive files exist and that the legacy self-test reports
`PASS`.

## Verification commands

```powershell
bun run check
bun run build
bun run test:e2e
```

The parity browser tests also exercise saved assessments, explicit error
capture and repair, daily gates, durable local state, deep links,
and browser history. They write reviewable screenshots under `test-results/`,
including both legacy and migrated dashboards.
