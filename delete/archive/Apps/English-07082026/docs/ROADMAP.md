# English Grammar Automaticity — software roadmap

## Current delivery status

Phases 1–4 are implemented and covered by source-literal equality, unit,
production-build, API, desktop, mobile, deep-link, browser-history, and
source-to-migration parity checks. The original archive is also independently
launchable again. The only intentionally deferred product phase is optional
authenticated multi-user synchronization to Neon; local-first legacy operation
does not depend on it. Cross-platform distribution is now prepared and built:
the stable HTTPS PWA has signed Android APK/AAB output, a Windows MSIX bundle,
and an iOS Xcode project with store metadata, privacy/support URLs,
screenshots, and Android Digital Asset Links. See
`doc/duplicate-markdown/Apps/English/English-07082026/docs/LEGACY-PARITY.md` for
the screen-by-screen evidence and
`doc/duplicate-markdown/Apps/English/English-07082026/distribution/README.md`
for release handoff.

## Product baseline

The v27 repository is a complete, single-file, offline-first PWA rather than a
component application. The migration target therefore includes all of these
behaviours and catalogs:

- 72 A1–C2 conversation topics with cascading path, level, skill, category,
  and topic filters.
- 84 A1–C2 grammar units, 14 derived categories, search, controlled practice,
  open production, exact-topic explanation links, and exact-topic exercises.
- A seven-stage daily automaticity cycle with blocking online assessment,
  correction, spoken repair, transfer, delayed retrieval, streaks, and a
  70-day heat map.
- LanguageTool assessment, corrected-answer speech, browser speech
  recognition, audio recording, error history, audio storage, progress,
  settings, data import/export, and installable/offline PWA behaviour.
- A verified online-resource catalog spanning Test-English and the British
  Council.

## Target architecture

### `apps/web` — Next.js + React + Shadcn

- Next.js App Router owns rendering, metadata, the installable PWA shell, and
  client interaction.
- React client boundaries exist only around interactive learning surfaces.
- Shadcn-style primitives provide buttons, cards, fields, badges, progress,
  dialogs, and accessible navigation without replacing the legacy visual
  identity.
- Versioned browser storage preserves the local-first contract. Audio stays in
  IndexedDB; compact progress/history stays in localStorage.
- The frontend calls the Nest API for online assessment. A failed request
  remains blocking, exactly as in v27.

### `apps/api` — NestJS on Bun

- `GET /api/health` exposes readiness.
- `POST /api/assessment` validates input, calls LanguageTool server-side, and
  returns normalized spelling/grammar matches and a corrected answer.
- The API owns upstream timeouts, error normalization, and endpoint
  configuration so browsers no longer need direct third-party CORS access.

### `packages/content`

- Typed, immutable legacy catalogs extracted verbatim from v27.
- Shared category and target-structure rules.
- Catalog parity tests prevent accidental content loss.

### Neon decision

Neon is not required for v27 parity and must never become a prerequisite for
offline practice. The supplemental `Langauge.md` specification does, however,
define a multi-user mastery model (attempts, topic status, categorized errors,
review queues, daily paths, and audio metadata). That makes Neon appropriate
for the connected product phase. The implementation keeps local storage
authoritative offline and introduces a synchronization boundary for a
Neon-backed repository once an identity provider and privacy/retention policy
are selected. The Supabase-specific `auth.users`, RLS, and Storage statements
in the source document cannot be copied to Neon verbatim.

## Researched CEFR curriculum expansion

The CEFR is a non-prescriptive proficiency framework rather than a mandatory
English grammar syllabus. The software combines Council of Europe proficiency
descriptors, Cambridge English Profile alignment, and British Council /
Test-English lesson inventories.

The original 84 units remain intact. Twenty-eight absent or previously
implicit subjects were added explicitly, producing 112 searchable units:

- A1: 16 units
- A2: 18 units
- B1: 26 units
- B2: 20 units
- C1: 18 units
- C2: 14 competence-focused units

Every unit contains at least five controlled exercises, followed by original
production in Grammar Lab. The full methodology, source links, and
level-by-level additions are in
`doc/duplicate-markdown/Apps/English/English-07082026/docs/CEFR-CURRICULUM.md`.

## Delivery phases

1. **Foundation and parity inventory**
   - Create the Bun/TypeScript workspace.
   - Extract and type all legacy content.
   - Add catalog-count and content-integrity tests.
2. **Functional vertical slice**
   - Build the Next shell, dashboard, grammar lab, state persistence, Nest
     health/assessment API, and proxy-based LanguageTool evaluation.
3. **Full legacy migration**
   - Conversation Studio, recording, speech recognition, metrics, saved audio,
     error engine, seven-step daily path, resource catalog,
     settings, import/export, and offline installability.
4. **Verification and hardening**
   - Typecheck, unit tests, production builds, API smoke tests, desktop/mobile
     browser tests, content-count assertions, keyboard/accessibility checks,
     install/offline checks, browser Back/Forward behavior, durable URL state,
     full assessment-to-error-repair journeys, and exact source-catalog equality.
5. **Optional multi-user productization**
   - Define identity, consent, retention, conflict resolution, and
     synchronization semantics.
   - Add Neon tables and migrations for profiles, grammar topics, speaking
     topics, attempts, attempt errors, aggregated error items, per-topic
     mastery, review queues, daily paths, and optional audio metadata.
   - Add authentication, server-side authorization, observability, backups,
     rate limiting, and deployment environments.

## Multi-platform release status

- Stable app origin:
  `https://english-grammar-automaticity-pwa.vercel.app`
- Stable NestJS API:
  `https://english-grammar-automaticity-api.vercel.app`
- Windows: generated MSIX/MSIXBundle test and Store archive.
- Android: generated signed APK, Play Store AAB, private update key, and
  matching public Digital Asset Links association.
- iOS/iPadOS: generated Xcode workspace and app project. Final archive,
  signing, TestFlight upload, and App Store submission require macOS, Xcode,
  and the owner's Apple Developer team.

The Microsoft Partner Center publisher identity, Google Play App Signing
certificate, Apple Developer Team, public support email, and legal publisher
name are account-owned release inputs and are deliberately not invented or
stored in the repository.

## Supplemental automaticity requirements

The implemented daily learning contract is documented in
`doc/duplicate-markdown/Apps/English/English-07082026/docs/AUTOMATICITY-METHODOLOGY.md`.
The single **Today’s Practice** route now
combines daily training and automaticity evidence around the selected Grammar
Lab lesson instead of maintaining separate routes or a fixed demo topic.

`Langauge.md` defines twelve product improvements on top of legacy parity:

1. Per-topic mastery statuses: `new`, `learning`, `usable`, `stable`, and
   `automatic`.
2. Blocking end-of-level mastery tests.
3. Separate recognition, writing, speaking, repair, and transfer scores.
4. Categorized, diagnostic error records.
5. Multi-stage repair chains generated from the learner's own errors.
6. Review intervals of 1, 3, 7, 14, and 30 days.
7. Mixed old/new grammar review.
8. Timed recall with recorded latency.
9. Adaptive follow-up prompts in the speaking studio.
10. Transfer tasks in fresh contexts.
11. Audio, transcript, corrected transcript, and re-recording comparison.
12. Dashboard metrics based on mastery rather than activity alone.

The first release implements these on the local-first data boundary where they
overlap existing v27 behavior. Connected synchronization and secure
multi-device reporting require the Neon/authentication phase.

## Definition of parity

The migration is complete only when automated checks prove 72 topics, all 84
legacy grammar units plus the researched supplements, at least five exercises
and both resource roles per grammar unit, seven daily tasks, and all eight
public product surfaces are present, and browser tests exercise the
critical learning flows rather than merely asserting that pages render.
