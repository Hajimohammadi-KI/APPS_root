# Roadmap to actual software — 2026-08-11

## Authoritative repositories

| Product | Repository root | Current runtime |
| --- | --- | --- |
| English Automaticity | `D:\APPS_root\Apps\English\English-07082026` | Web `3202`, Nest API `4201` |
| German Automaticity | `D:\APPS_root\Apps\Deutsch-V10.08.2026` | Web `3210`, Nest API `4210` |
| Cross Repository Tracker | `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version` | Web `4312`, Nest API `4313` |
| PDF side application | `D:\APPS_root\Apps\Apps-For-Integeration\Reader-PDF-App` | Web/API `4322` |
| Settings side application | `D:\APPS_root\Apps\Apps-For-Integeration\Einstellungen-APP` | Web/API `4323` |

`D:\APPS_root\Apps\Apps-For-Integeration` is a source and integration library, not a fourth authoritative product runtime.

## Current verified foundation

- English and German use React, Next.js, Shadcn-compatible components, Bun, TypeScript 7, and NestJS source.
- Tracker uses React, Next.js, Shadcn-compatible components, Bun, NestJS, and Drizzle. Its TypeScript configuration still contains a TypeScript 5.9 compatibility dependency alongside the TypeScript 7 alias; this must be normalized before claiming “TS7 everywhere”.
- English, German, and Tracker pass typecheck, tests, and production builds.
- PDF Reader and Settings pass typecheck, tests, production builds, and live health checks.
- All listed live routes return HTTP 200 when launched from the authoritative roots.

## Known migration boundary

The runtime is functional, but “full legacy migrated” is not yet proven.

1. English retains its legacy source and catalog evidence, including 72 conversation topics.
2. German retains `legacy/v20.8-static`, database migrations, RLS, and seed material.
3. Tracker is missing the canonical legacy file `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html`. The legacy audit cannot prove complete migration without that source or an equivalent frozen inventory.
4. The English/German strict parity audit reports 12 structural filename differences. Some are intentional language-specific route and style splits; each needs classification before copying or removal.
5. Some English browser tests still assert the former dashboard wording. They are migration-contract tests for the old UI and must be rewritten against the current active dashboard instead of being treated as current runtime failures.

## Target architecture

```text
Next.js + React + Shadcn frontend
        |
        v
NestJS domain API (health, learning, evidence, files, integrations)
        |
        +--> local-first storage for offline use
        |
        +--> Neon Postgres only when account sync/multi-device use is enabled
        |
        +--> provider adapters (Google, OpenAI, translation, GitHub)
```

Neon should not be added merely because a database is mentioned. Local-first storage is required for offline installation. Neon becomes appropriate for authenticated multi-device synchronization. German already contains Supabase-era migrations, so the data model must be consolidated before selecting or migrating to Neon.

## Execution roadmap

### Phase 0 — one authoritative runtime

- Keep one web/API port pair per product and one starter definition.
- Retire stale launchers only after import and shortcut checks.
- Make the starter show the exact repository and process it launched.
- Add a runtime build/version endpoint so an old server cannot masquerade as the current app.

Exit evidence: one running instance per product, direct URLs and navigation agree, refresh does not reveal a legacy page.

### Phase 1 — freeze and classify legacy parity

- Produce a route-by-route, feature-by-feature legacy inventory for English, German, and Tracker.
- Classify the 12 English/German structural differences as intentional, missing, or obsolete.
- Recover the missing canonical Tracker legacy source, or approve the recovered inventory as the new frozen baseline.
- Map legacy content, styles, assets, persistence keys, imports/exports, PDF behavior, notes, progress, settings, reading position, and analysis results.

Exit evidence: every legacy capability has one status: migrated, intentionally retired, or blocked with an identified source.

### Phase 2 — durable domain and persistence

- Define shared contracts for profile, CEFR level, lesson, attempt, review, recording, note, PDF annotation, setting, and backup.
- Move progress calculations out of page components into tested domain modules.
- Persist attempts and evidence transactionally; completion must not equal mastery.
- Add schema migrations and import/export compatibility tests.
- Introduce Neon only behind a sync adapter; keep offline local storage authoritative until sync succeeds.

Exit evidence: close/reopen preserves data; export/import round-trip is lossless; migrations work on an older installed dataset.

### Phase 3 — real service integrations

- Keep secrets only in the local server or deployment secret store, never browser storage.
- Use OAuth for Google Drive/Calendar and GitHub; never collect provider passwords inside the app.
- Separate health states: app, database, AI, translation, Google, GitHub.
- Replace display-only “online” badges with provider-backed checks and useful recovery messages.

Exit evidence: connect, revoke, token refresh, offline fallback, and failure recovery tests pass.

### Phase 4 — complete learning and tracker vertical slices

- English/German: `Recall -> Automate aloud -> Transfer -> delayed review`, with real recording, transcript, correction, and evidence invalidation on a new attempt.
- Validate CEFR topic coverage and four-skill outputs per level; human-review generated examples and explanations.
- Tracker: implement one complete thesis slice from repository extraction through EvidenceRecord, retrieval, answerability, and evaluation rather than reporting tracker completion as thesis completion.
- PDF: open the exact requested file, preserve reading position, editable notes/comments, annotations, export, and review queue.

Exit evidence: one real user journey passes end-to-end without mock status or canned evaluation.

### Phase 5 — quality and accessibility gate

- Rewrite outdated E2E tests for the active pages.
- Test desktop, tablet, iPad preview, and mobile widths.
- Test keyboard navigation, focus, reading ruler, large text, RTL explanation mode, reduced motion, and contrast.
- Manually verify microphone, speaker, PDF selection, annotation, and reopen behavior on the target Windows device.

Exit evidence: unit, integration, E2E, build, accessibility, and manual hardware checklist pass.

### Phase 6 — installation and update release

- Produce compiled frontend, compiled Nest API, bundled dependencies, assets/PDFs, migrations, and configuration templates.
- Installer must start the correct ports, close after success, and open the product.
- Update must preserve user data and provide repair/uninstall modes.
- Test fresh install, update from previous release, repair, uninstall, and reinstall on a clean Windows user profile.

Exit evidence: signed release checklist, exact artifact hashes, preserved-data upgrade test, and release report.

## Immediate next blockers, in priority order

1. Recover or formally replace the missing canonical Tracker legacy source.
2. Replace outdated English E2E expectations with tests for the current dashboard and routes.
3. Classify the 12 English/German parity differences.
4. Normalize Tracker to one TypeScript 7 toolchain.
5. Add runtime version identity and prevent duplicate/stale servers.
6. Run manual microphone, speaker, PDF selection, annotation, and installed-update checks.

## Current release judgement

The repositories are now buildable and launchable development software. They are not yet honestly “full legacy complete” or ready for an unattended public installer because the Tracker legacy baseline is missing, browser tests partly target the former UI, and hardware/update preservation checks remain open.
