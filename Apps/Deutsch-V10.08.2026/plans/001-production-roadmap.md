# Plan 001: Turn the static PWA into a production learning platform

> **Executor instructions**: This is a multi-milestone roadmap, not a single
> pull request. Implement one milestone at a time and run every verification
> gate before continuing. Keep the v20.8 static app runnable until the parity
> and data-migration gates pass. If a STOP condition occurs, stop and report;
> do not silently change frameworks, persistence semantics, or learning rules.
>
> **Baseline note**: Git was initialized on 2026-07-27 and the untouched v20.8
> source was captured in commit `d4809a3`. The legacy files now live under
> `legacy/v20.8-static/`. Compare those files with the SHA-256 snapshot below
> if migration evidence appears to drift:
>
> ```powershell
> Get-FileHash -Algorithm SHA256 README.md,index.html,manifest.webmanifest,service-worker.js,offline.html
> ```
>
> Expected hashes:
>
> | File                   | SHA-256                                                            |
> | ---------------------- | ------------------------------------------------------------------ |
> | `README.md`            | `89F8C452105F21810AA0DA9C24AF77531C59F424D4BAE25E6E19AC67CC2C1820` |
> | `index.html`           | `8DD5C6772EDD6B7B86E0177B128DD9FF1C134BF6E7CF1540D6D9A2349A6A0749` |
> | `manifest.webmanifest` | `65A02123FF6D79BEB7A0817A9DFCBF113953B33B9C06D460E5F2EAC0C62DFB71` |
> | `service-worker.js`    | `B4D45A0BA7BC3A7300B118C344617028E065D43065B41AC957771E85F205A616` |
> | `offline.html`         | `70C8FBEE1D8B76820999D00FBACF631DDADA9E0EE5E29ECB40795F5120985615` |
>
> If a hash differs, inspect the diff or obtain a fresh snapshot before using
> the file/line evidence in this plan.

## Status

- **Priority**: P1
- **Effort**: L — approximately 35–55 focused engineering days for one
  experienced full-stack developer, excluding content review
- **Risk**: HIGH — this is a rewrite of a working stateful learning engine
- **Depends on**: none
- **Category**: direction / migration / architecture
- **Planned at**: unversioned workspace snapshot, 2026-07-27

### Implementation progress

| Milestone | Status      | Implemented so far                                                   |
| --------- | ----------- | -------------------------------------------------------------------- |
| 0         | DONE        | Git baseline, Bun workspace, TS7, formatting, lint, tests, build, CI |
| 1         | DONE        | Complete catalogs, typed contracts, evaluator, plan, and reviews     |
| 2         | DONE        | Next/shadcn shell and all responsive legacy product routes           |
| 3         | DONE        | Interactive local-first parity and compatible persistence            |
| 4         | PARTIAL     | NestJS health/bootstrap/evaluation; identity and Neon are deferred   |
| 5         | DONE        | Speech, recording, local audio, correction, and session history      |
| 6         | PARTIAL     | Offline PWA and import complete; cloud synchronization is deferred   |
| 7         | IN PROGRESS | Automated parity suite complete; deployment hardening remains        |

## Outcome

The result is an installable, responsive German-grammar learning application
with:

- a React frontend built with Next.js App Router and shadcn/ui;
- typed, testable learning-domain modules independent of React;
- the existing 79 conversation topics, 84 grammar units, daily automaticity
  loop, target-grammar checks, reviews, error history, audio, and import/export;
- guest/local-first use plus an optional account with cross-device sync;
- Neon Postgres for user-owned learning records;
- server-side evaluation orchestration, validation, authorization, rate limits,
  and operational visibility;
- an offline-capable PWA with an explicit synchronization model;
- automated unit, integration, accessibility, and end-to-end verification.

The first beta is feature parity plus reliability. It is not a redesign that
quietly drops learning rules.

## Architecture decision: Next.js frontend and NestJS backend

The stack is now explicit and accepted:

1. Use **Next.js App Router, React, Tailwind, and shadcn/ui** in `apps/web`.
2. Use a separate **NestJS** HTTP API in `apps/api`, running on Bun.
3. Use **TypeScript 7.0.2** for project checking and API emit. Keep the
   TypeScript 6 API installed only for framework tools that have not adopted
   the new TypeScript 7 programmatic API.
4. Put learning rules in framework-independent workspace packages so neither
   application owns duplicate scheduler or mastery logic.
5. Add **Neon Postgres** only with identity and synchronization; static
   curriculum remains versioned and offline-capable.

Nuxt and Nitro are no longer candidates for this implementation.

Relevant official references:

- Next.js App Router:
  <https://nextjs.org/docs/app>
- Next.js backend-for-frontend guidance and limitations:
  <https://nextjs.org/docs/app/guides/backend-for-frontend>
- shadcn/ui for Next.js:
  <https://ui.shadcn.com/docs/installation/next>
- Nuxt is a Vue framework:
  <https://nuxt.com/docs/4.x/getting-started/introduction>
- Nuxt/Nitro server handlers:
  <https://nuxt.com/docs/4.x/directory-structure/server>
- Standalone Nitro:
  <https://nitro.build/>
- NestJS controllers and request validation:
  <https://docs.nestjs.com/controllers> and
  <https://docs.nestjs.com/techniques/validation>
- Neon serverless driver and branching:
  <https://neon.com/docs/serverless/serverless-driver> and
  <https://neon.com/docs/guides/branching-intro>

## Why this matters

The current app contains real product value, not merely a mockup. Its learning
loop is already opinionated about controlled practice, free transfer, spoken
production, error repair, and spaced review. The risk is losing those rules
during a visual rewrite.

At the same time, the current delivery shape cannot be maintained as production
software: nearly all markup, styling, 163 content records, browser integration,
evaluation, state mutation, and rendering live in one 249 KB HTML file. There
is no package manifest, typechecker, test runner, CI pipeline, server-owned
data, user identity, or deployable backend.

The roadmap therefore uses a strangler migration:

`freeze and characterize → extract pure rules/content → build new UI beside legacy → reach local parity → add server sync → migrate users → cut over`

## Current state

### Repository shape

The root contains only:

- `index.html` — 248,902 bytes and 602 displayed source lines; seven style
  blocks, one script block, static screen markup, all product data and logic;
- `manifest.webmanifest` — install metadata and two app icons;
- `service-worker.js` — hand-written cache-first/network-fallback behavior;
- `offline.html` — static offline fallback;
- `assets/dashboard-banner.svg`, `icons/icon-192.png`, `icons/icon-512.png`;
- `README.md` — feature history and static-server instructions.

There is no `package.json`, lockfile, TypeScript configuration, application
framework, test directory, CI configuration, environment example, or Git
metadata in this folder.

### Existing product inventory

`index.html:156-223` defines eight primary screens:

1. dashboard;
2. conversation studio;
3. seven-step daily automaticity path;
4. grammar laboratory;
5. online resources;
6. error engine;
7. audio library;
8. settings, backup, and restore.

`index.html:227` contains:

- 79 conversation topics across general German, university/academic German,
  DSH, and digital TestDaF tracks;
- 84 grammar units, exactly 14 for each level A1–C2;
- rules, examples, common errors, exercises, resource links, and test answers.

Each conversation topic currently has:

```text
track, level, skill, category, topic, task, modelAnswer, targetGrammar
```

Each grammar unit currently has:

```text
level, title, rule, examples, commonError, exercises, links,
testAnswer, recallTest, repairTest, transferTest
```

### Current persistence and learning rules

- `index.html:229-232` stores the main state under
  `GrammarAutomaticityV11_de` in `localStorage`; audio blobs use an IndexedDB
  database with the same name and one `audio` object store.
- The local state includes settings, errors, activity, reviews, sessions,
  mastery, daily plans, and the selected grammar unit.
- `index.html:293` sends learner text directly from the browser to a
  user-configurable LanguageTool endpoint.
- `index.html:294-345` combines LanguageTool matches with deterministic
  target-grammar checks and accepts an answer only when the online request
  succeeds and no issues remain.
- `index.html:353` records a conversation attempt, schedules a correction
  review, updates daily progress, and optionally stores audio.
- `index.html:376-383` enforces ordered daily steps and review intervals of
  1, 3, 7, 14, and 30 days.
- `index.html:390-424` renders the seven-step daily loop: active recall, three
  original sentences, conversation, explanation of correction, spoken repair,
  transfer, and delayed review.
- `index.html:508-543` enforces controlled exercise, free production, and
  spoken confirmation before mastery.
- `index.html:549-550` exports/imports the local state as arbitrary JSON without
  a versioned schema.
- `index.html:563-577` contains an embedded catalog/self-test, but no external
  automated test runner.

### Existing verification

These checks succeeded against the planned snapshot:

```text
inline JavaScript parse: PASS
manifest JSON parse: PASS
service-worker JavaScript parse: PASS
catalog: 79 unique topics
grammar: 84 unique titles, 14 per A1/C2 level
all grammar units have exercises and links
```

There is no one-command build, lint, typecheck, unit test, integration test, or
end-to-end test.

## Target repository structure

Use Bun as the workspace manager, runtime, test runner, and script host. Pin the
exact Bun version in `packageManager`; Node is not the application runtime.

```text
/
├─ apps/
│  ├─ web/                       # Next.js App Router, React, shadcn/ui
│  │  ├─ src/app/
│  │  ├─ src/components/
│  │  ├─ src/features/
│  │  ├─ src/lib/
│  │  └─ public/
│  └─ api/                       # NestJS HTTP API
├─ packages/
│  ├─ content/                   # Typed offline grammar/topics/resources
│  ├─ domain/                    # Pure learning/evaluation/review state machines
│  ├─ contracts/                 # Versioned request/response schemas
│  ├─ db/                        # Drizzle schema, migrations, repositories
│  ├─ config/                    # Shared TS/lint settings
│  └─ testing/                   # Factories and shared test corpus
├─ legacy/
│  └─ v20.8-static/              # Frozen reference app after baseline commit
├─ docs/
│  ├─ adr/
│  ├─ product/
│  └─ runbooks/
├─ scripts/
├─ plans/
├─ package.json
├─ bunfig.toml
├─ tsconfig.base.json
└─ .github/workflows/ci.yml
```

The API exists from the first slice, but domain rules still belong in packages,
not Nest providers.

## Target route and component map

Use real URLs so screens are linkable, refresh-safe, and testable:

| Route             | Responsibility                                        | Rendering boundary                                   |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `/`               | dashboard, today summary, due reviews                 | Server shell plus interactive cards                  |
| `/today`          | ordered seven-step automaticity plan                  | Client feature island backed by domain state machine |
| `/studio`         | topic selection, recording, transcript, evaluation    | Client component because it uses media/browser APIs  |
| `/grammar`        | searchable/filterable catalog                         | Server-rendered initial catalog plus client filters  |
| `/grammar/[slug]` | rule, examples, controlled and free practice          | Server content plus client practice runner           |
| `/reviews`        | due queue, error repair, review history               | Server data plus client review actions               |
| `/resources`      | curated external resources                            | Server component                                     |
| `/library`        | local/cloud audio and transcript records              | Client media list with authenticated metadata        |
| `/settings`       | learning, privacy, export/delete, install/sync status | Mixed                                                |
| `/offline`        | explicit offline fallback and sync status             | Static                                               |

Build domain components around shadcn primitives rather than using generic
cards everywhere:

- `AppShell`, `PrimaryNav`, `MobileNav`;
- `TodayProgress`, `DailyStepCard`, `ReviewQueue`;
- `GrammarCatalog`, `GrammarPracticeRunner`, `MasteryBadge`;
- `RecordingControls`, `TranscriptEditor`, `EvaluationReport`;
- `ErrorItem`, `AudioLibraryItem`, `SyncStatus`;
- `DataExportDialog`, `DeleteAccountDialog`.

Use shadcn `Sidebar`, `Card`, `Progress`, `Form`, `Select`, `Command`,
`Textarea`, `Alert`, `Badge`, `Accordion`, `Dialog`, `Sheet`, `Tooltip`,
`Skeleton`, and `Sonner` where they fit. Use Lucide icons with accessible text;
do not encode navigation meaning only in emoji.

Preserve the existing calm green/blue identity, but define it as semantic CSS
variables. Meet WCAG 2.2 AA contrast, keyboard operation, visible focus, form
labels, reduced-motion preferences, and 44px touch targets. The recorder must
always offer manual text input when speech APIs are absent.

## Target domain boundaries

`packages/domain` must contain pure TypeScript with no React, Next, database,
HTTP, browser, or clock globals. Inject the clock/timezone and providers.

Required modules:

- `daily-plan` — seven named steps and legal transitions;
- `practice` — controlled/free/spoken gates and mastery transition;
- `review-scheduler` — 1/3/7/14/30-day scheduling and mastery;
- `evaluation` — provider-neutral result shape and deterministic target checks;
- `activity` — day summaries and streak calculation using the learner timezone;
- `sync` — event IDs, idempotency, merge rules, and cursor semantics;
- `catalog` — stable slugs, content version, level/category filters;
- `migration` — legacy v11 local-state schemas and transformation.

Represent learning progress as explicit state, not several booleans:

```text
not_started
→ controlled_in_progress
→ controlled_passed
→ free_in_progress
→ free_passed
→ spoken_confirmed
→ mastered
```

Invalid transitions must return a typed domain error. The server is authoritative
for account users; the client uses the same rules optimistically.

## Target data ownership

### Keep in versioned source initially

- grammar units and exercises;
- conversation topics;
- resource links;
- category definitions;
- evaluator rule metadata;
- the content version and migration notes.

These records are small, read-heavy, and required offline. Move them to a CMS
or database only when non-developers need authoring and review workflows.

### Store in Neon Postgres

Use UUID/UUIDv7 identifiers, UTC timestamps, an explicit learner timezone, and
stable content slugs. A recommended initial schema:

| Table                    | Required responsibility / constraint                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| `user_profiles`          | auth subject, locale, CEFR start level, timezone, consent versions               |
| `user_settings`          | one row per user; no arbitrary LanguageTool endpoint                             |
| `learning_sessions`      | topic/grammar slug, content version, start/end, client event ID                  |
| `attempts`               | kind, source text, corrected text, verdict, evaluation JSON, spoken confirmation |
| `error_items`            | source attempt, correction, status, next action                                  |
| `daily_plans`            | unique `(user_id, local_date)`, selected grammar slug, status                    |
| `daily_step_completions` | unique `(daily_plan_id, step_index)`, validated payload                          |
| `review_items`           | due time, interval stage, source attempt/grammar, mastered time                  |
| `mastery_records`        | unique `(user_id, grammar_slug)`, controlled/free/spoken timestamps              |
| `activity_days`          | unique `(user_id, local_date)`, completed steps and sessions                     |
| `audio_assets`           | object-storage key, mime type, size, duration, retention state; no blob          |
| `sync_clients`           | device/client identifier and last acknowledged cursor                            |
| `sync_events`            | unique `(user_id, client_event_id)` for idempotent offline writes                |

Every user-owned query must include the authenticated user ID on the server.
Do not trust a `user_id` supplied in a request body. Add indexes for due-review
and chronological history queries after measuring them:

```text
review_items(user_id, due_at) WHERE mastered_at IS NULL
learning_sessions(user_id, started_at DESC)
attempts(user_id, created_at DESC)
sync_events(user_id, sequence)
```

Use Drizzle migrations in `packages/db`. Use a Neon branch for development,
one protected production branch, and ephemeral branches for integration tests
or preview deployments. Never expose `DATABASE_URL` to browser code.

### Store outside Postgres

Audio is optional personal data. Keep it locally in IndexedDB by default. If
cloud backup is enabled with explicit consent, upload through a short-lived
signed URL to EU-region S3-compatible object storage, then store only metadata
in `audio_assets`. Define retention, deletion, maximum duration, allowed MIME
types, and maximum size before enabling uploads.

## API contract

Version public contracts under `/api/v1`. Whether handlers live in Next.js,
NestJS, or Nitro, keep these contracts stable:

```text
GET    /api/v1/bootstrap
GET    /api/v1/catalog/version
POST   /api/v1/evaluations
POST   /api/v1/sync/push
GET    /api/v1/sync/pull?cursor=...
GET    /api/v1/reviews/due
POST   /api/v1/reviews/:id/complete
GET    /api/v1/export
DELETE /api/v1/account
POST   /api/v1/audio/upload-url
DELETE /api/v1/audio/:id
```

`POST /evaluations` must:

- require authentication for synced accounts and use a rate-limited guest
  policy otherwise;
- validate content type, payload size, language, grammar slug, and attempt kind;
- use a fixed server-side LanguageTool configuration with a timeout;
- map upstream matches into the app's own stable result schema;
- run deterministic target-grammar checks in `packages/domain`;
- return `passed=false` when the provider is unavailable unless a documented
  offline policy says otherwise;
- never log raw learner text by default;
- include a provider status and trace ID, but not internal stack traces.

All mutating endpoints must validate schemas, enforce ownership, and support
idempotency via `client_event_id`.

## Offline and synchronization model

Replace `localStorage` as the primary database with a versioned IndexedDB
store. Local storage may contain only tiny non-sensitive UI preferences.

Use an outbox pattern:

1. Generate a client event ID for each local mutation.
2. Apply the domain transition locally and persist it in IndexedDB.
3. Add the mutation to an ordered outbox.
4. Push batches when online.
5. The server validates and applies each event idempotently.
6. Pull server events after the last cursor.
7. Mark acknowledged outbox items complete.

Conflict policy:

- attempts, sessions, errors, and step completions are append-only;
- settings use explicit field-level last-write-wins with timestamps;
- duplicate completions collapse by server uniqueness constraints;
- mastery and review state are server-derived from accepted events;
- rejected transitions stay visible to the user and go to a retry/dead-letter
  state rather than disappearing;
- the learner's IANA timezone determines the daily-plan date and streak.

Do not use `new Date().toISOString().slice(0, 10)` for learner-local days; the
current code does this at `index.html:357-376` and can roll the day at UTC
midnight rather than local midnight.

## Legacy data migration

Existing users may have valuable progress. Implement a one-time migration for:

- localStorage key `GrammarAutomaticityV11_de`;
- IndexedDB database `GrammarAutomaticityV11_de`, store `audio`.

Create strict schemas for the current fields:

```text
settings, errors, activity, reviews, sessions, mastery,
dailyPlans, todayGrammar, a2StartMigration
```

Migration behavior:

1. Detect legacy state without modifying it.
2. Validate and show a preview: sessions, errors, mastery, reviews, and audio
   counts.
3. Offer a downloadable backup.
4. Transform to versioned v1 import events with stable generated IDs.
5. Import locally for a guest or push idempotently after sign-in.
6. Verify server/local counts and record a migration receipt.
7. Leave legacy data intact until the user confirms success.

Malformed imported JSON must never replace current state. The current
`index.html:550` behavior reloads arbitrary parsed JSON and is not acceptable
for the new app.

## Delivery roadmap

### Milestone 0 — Establish an executable baseline (1–2 days)

**Goal**: versioned source, reproducible toolchain, and protected legacy
reference.

Actions:

1. Confirm this folder is not supposed to be a subdirectory of an existing Git
   repository. Initialize Git only after that check.
2. Commit the current files unchanged as the v20.8 baseline.
3. Move the static reference into `legacy/v20.8-static/` in a dedicated commit,
   while keeping a simple way to serve it.
4. Add the Bun workspace, pinned Bun version, shared TypeScript, ESLint,
   Prettier, Bun test, and browser-test configuration.
5. Add root scripts:

   ```json
   {
     "dev": "...",
     "build": "...",
     "lint": "...",
     "format:check": "...",
     "typecheck": "...",
     "test": "...",
     "test:e2e": "..."
   }
   ```

6. Add `.env.example`, `AGENTS.md`, architecture/product docs, and CI.
7. Add `scripts/verify-legacy.mts` that parses the embedded script without
   executing it and asserts the catalog counts and shapes.

Verification:

```text
bun install --frozen-lockfile  → exit 0
bun run format:check               → exit 0
bun run lint                       → exit 0
bun run typecheck                  → exit 0
bun run test                       → legacy catalog checks pass
bun run build                      → exit 0
```

The initial test count may be small, but every command must exist and be green
before the rewrite starts.

### Milestone 1 — Extract content and pure domain behavior (3–5 days)

**Goal**: current learning rules are typed and characterized before UI work.

Actions:

1. Parse `TOPICS` and `GRAMMAR` from the legacy JavaScript AST; do not use
   `eval` or execute repository content.
2. Generate human-reviewable JSON/TypeScript records with stable slugs and
   `contentVersion: "20.8"`.
3. Validate records at build time and test:
   - 79 unique topic slugs;
   - 84 unique grammar slugs;
   - 14 grammar units per A1–C2 level;
   - at least three exercises per grammar unit;
   - one explanation and one exercise link per unit;
   - valid HTTPS resource URLs and matching topic metadata.
4. Port the daily-plan, practice gate, review scheduler, evaluator result
   contract, target checks, streak calculation, and legacy migration schemas
   to `packages/domain`.
5. Build a golden test corpus from the embedded self-test and add boundary
   cases: empty responses, duplicate sentences, unavailable evaluator, local
   date around DST/midnight, final review interval, repeated event IDs, and
   invalid state transitions.

Verification:

```text
bun run --cwd packages/content test   → all catalog invariants pass
bun run --cwd packages/domain test    → all state-machine and evaluator tests pass
bun run typecheck                    → exit 0, no `any` in public domain APIs
```

### Milestone 2 — Build the Next.js and shadcn application shell (4–6 days)

**Goal**: responsive, accessible routes and design system with no business-rule
duplication.

Actions:

1. Scaffold `apps/web` with the stable Next.js App Router, React, strict
   TypeScript, Tailwind, and shadcn/ui.
2. Add the semantic color/type/spacing tokens and responsive app shell.
3. Implement every target route with typed mock/read-only data.
4. Port the dashboard, catalog, grammar detail, resource hub, error list,
   library empty state, and settings shell.
5. Add loading, empty, error, offline, and unsupported-browser states.
6. Add keyboard and screen-reader tests for navigation, dialogs, forms, and
   practice controls.

Client components are required only for browser APIs, event-driven practice,
offline stores, and interactive filters. Keep static content and page shells as
Server Components.

Verification:

```text
bun run --cwd apps/web lint
bun run --cwd apps/web typecheck
bun run --cwd apps/web test
bun run --cwd apps/web build
bun run test:e2e -- --project=chromium --grep "navigation|catalog|accessibility"
```

Expected: all routes return 200, mobile navigation is keyboard-operable, and
there are no serious automated accessibility violations.

### Milestone 3 — Reach local-first feature parity (7–10 days)

**Goal**: a learner can use the new app on one device without an account.

Port in this order:

1. grammar controlled practice;
2. free production and spoken-confirmation gate;
3. mastery and review scheduling;
4. daily seven-step plan and ordered transition checks;
5. conversation topic selection and manual transcript evaluation;
6. error engine and due-review queue;
7. local settings, export, and validated import;
8. IndexedDB audio library;
9. activity heatmap and streak.

Use the pure domain package for every transition. Persist versioned domain
events and projections in IndexedDB; do not recreate the monolithic mutable
`state` object.

Create parity E2E tests for:

- completing one controlled and one free grammar unit;
- blocking “next” until correct plus spoken confirmation;
- completing all seven daily steps in order;
- rejecting three identical production sentences;
- scheduling and advancing 1/3/7/14/30-day reviews with a fake clock;
- saving an error and showing it in the review engine;
- exporting, clearing a test profile, importing, and recovering equal counts;
- using manual text when microphone/speech recognition is unavailable.

Verification:

```text
bun run test
bun run test:e2e -- --project=chromium --grep "feature parity"
bun run --cwd apps/web build
```

Do not begin the cloud migration until this milestone is green.

### Milestone 4 — Add identity, Neon, and complete the backend (7–12 days)

**Goal**: optional accounts and secure cross-device data without breaking guest
mode.

The NestJS service boundary is accepted and already scaffolded. This milestone
extends its read-only bootstrap slice with authenticated, user-owned state.

Actions:

1. Select an established authentication solution; do not implement password
   storage from scratch. Document session, CSRF, cookie, token, and account
   deletion behavior in an ADR.
2. Create Neon dev/staging/production branches and Drizzle migrations.
3. Implement repositories and ownership tests for the schema above.
4. Implement `/bootstrap`, sync push/pull, due reviews, export, and account
   deletion.
5. Add idempotency and transaction boundaries for batches.
6. Proxy LanguageTool through `/evaluations`; remove the editable endpoint from
   the learner settings UI.
7. Add per-user and per-IP rate limits, input-size limits, upstream timeout,
   structured error codes, request IDs, and redacted logs.
8. Generate an OpenAPI document and a typed web client if a separate API is
   used.

Verification:

```text
bun db:check
bun db:migrate:test
bun run test:integration
bun run test:e2e -- --grep "account|sync|ownership|evaluation unavailable"
bun run build
```

Run integration tests against an isolated Neon branch. Tests must prove user A
cannot read or mutate user B's rows and that replaying a sync batch does not
duplicate records.

### Milestone 5 — Productionize speech, audio, and evaluation (5–8 days)

**Goal**: browser capability differences and upstream failures are explicit,
recoverable states.

Actions:

1. Wrap MediaRecorder, speech recognition, speech synthesis, and manual input
   behind feature-detected adapters.
2. Clean up streams, recognition sessions, object URLs, and speech synthesis on
   navigation/unmount.
3. Keep the transcript editable and require learner confirmation before
   evaluation.
4. Add an evaluation-provider interface with LanguageTool as the first
   implementation and deterministic target checks after provider normalization.
5. Add retry/timeout states and prevent unavailable online evaluation from
   falsely granting mastery.
6. Keep audio local by default. Add signed cloud upload only after privacy and
   retention decisions are approved.
7. Test Chrome/Edge fully; test Safari/iOS with manual transcript fallback;
   document unsupported speech-recognition behavior rather than hiding it.

Verification:

```text
bun run test -- --grep "media|evaluation"
bun run test:e2e -- --grep "manual transcript|recording lifecycle|provider timeout"
```

Add at least one real-device smoke checklist for iOS Safari and Android Chrome.

### Milestone 6 — PWA, offline synchronization, and legacy import (4–6 days)

**Goal**: installable offline use with safe upgrades and recoverable sync.

Actions:

1. Generate the web manifest from the Next app and preserve install icons,
   theme, German locale, and standalone mode.
2. Replace the hand-written service worker with a versioned, tested caching
   strategy:
   - precache the app shell and content version;
   - network-first for authenticated dynamic data;
   - stale-while-revalidate for immutable catalog assets;
   - never cache mutation responses, auth responses, or evaluation POSTs;
   - show an update-ready prompt before activating a new incompatible version.
3. Implement the IndexedDB outbox and sync status/retry UI.
4. Implement the v11 legacy migration wizard and a corrupted-import test.
5. Test upgrade from one content/schema version to the next.

Verification:

```text
bun run test:e2e -- --grep "offline|outbox|legacy migration|service worker update"
bun run build
```

Use a production build for PWA tests. Expected: a learner can complete supported
local work offline, reload, reconnect, sync once, and retain equal counts.

### Milestone 7 — Security, privacy, observability, and beta release (5–8 days)

**Goal**: a small real-user beta can be operated safely.

Required release work:

- Content Security Policy, security headers, secure cookies, origin/CSRF
  controls, schema validation, rate limiting, and dependency audit.
- GDPR-oriented privacy notice, lawful basis/consent for optional audio,
  retention rules, data export, account deletion, and processor inventory.
- Redacted structured logs, error monitoring, health/readiness endpoints,
  uptime checks, and alerts for evaluation failure rate and sync backlog.
- Privacy-preserving product metrics: daily-plan started/completed, practice
  retry count, review completion, sync errors, and capability fallback. Do not
  send raw transcripts or audio to analytics.
- Database backup/restore test and runbooks for rollback, provider outage,
  migration failure, and account deletion.
- Lighthouse and Web Vitals budgets, bundle analysis, accessibility audit, and
  supported-browser matrix.
- Seeded staging account and repeatable smoke test.

Release gates:

```text
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run test:integration
bun run test:e2e
bun run build
```

Additionally:

- no critical/high reachable production dependency advisory;
- no serious accessibility violation in core flows;
- successful database restore drill;
- successful legacy import and account deletion in staging;
- no raw learner text/audio in standard application logs;
- monitored staged rollout with a documented rollback.

## MVP and post-beta boundaries

### Production beta includes

- guest/local mode;
- optional account and sync;
- dashboard;
- grammar catalog and practice;
- seven-step daily plan;
- conversation studio with manual and supported speech input;
- evaluation and correction;
- error/review engine;
- installable/offline PWA;
- validated backup/import, server export, and account deletion.

### Defer until beta evidence justifies it

- teacher/classroom dashboards;
- payments/subscriptions;
- real-time multi-user interaction;
- generative avatars;
- automatic pronunciation scoring;
- native iOS/Android applications;
- public API;
- CMS/editorial workflow;
- LLM evaluation or chat.

## Verification commands after milestone 0

These root commands are the permanent quality contract:

| Purpose          | Command                         | Expected success              |
| ---------------- | ------------------------------- | ----------------------------- |
| Install          | `bun install --frozen-lockfile` | exit 0                        |
| Format           | `bun run format:check`          | exit 0, no changes            |
| Lint             | `bun run lint`                  | exit 0                        |
| Typecheck        | `bun run typecheck`             | exit 0                        |
| Unit tests       | `bun run test`                  | all tests pass                |
| DB integration   | `bun run test:integration`      | all tests pass on isolated DB |
| E2E              | `bun run test:e2e`              | core Chromium suite passes    |
| Production build | `bun run build`                 | exit 0                        |

CI must run all applicable commands on every pull request. A milestone is not
done if its new behavior lacks automated coverage.

## Git and pull-request workflow

There is no observed Git convention. After confirming no outer repository
exists:

- initialize a repository and commit the untouched snapshot first;
- use one branch and pull request per milestone slice;
- use Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`);
- never combine content extraction, UI rewrite, schema migration, and legacy
  deletion in one pull request;
- do not push or open a pull request unless the operator instructs it.

Recommended branch sequence:

```text
chore/baseline-tooling
refactor/extract-learning-domain
feat/next-app-shell
feat/local-feature-parity
feat/account-sync
feat/speech-evaluation
feat/pwa-migration
chore/production-beta
```

## Done criteria

All must hold before the static v20.8 root is retired:

- [ ] Legacy source is preserved in version control with its hashes.
- [ ] Catalog extraction proves 79 topics and 84 grammar units with all
      invariants.
- [ ] Domain state machines cover daily order, practice gates, reviews,
      evaluation, timezone, sync idempotency, and legacy migration.
- [ ] Every primary legacy screen has a route in the Next app.
- [ ] Local guest mode passes the parity E2E suite.
- [ ] Account sync is ownership-safe, idempotent, and recoverable.
- [ ] Existing v11 state and audio can be previewed, backed up, migrated, and
      verified without destructive replacement.
- [ ] LanguageTool is called server-side with validation, rate limit, timeout,
      and stable error behavior.
- [ ] Audio is local by default and cloud storage has approved privacy and
      retention controls.
- [ ] Offline reload, outbox sync, and service-worker upgrade tests pass.
- [ ] Formatting, lint, typecheck, unit, integration, E2E, and production build
      commands all pass in CI.
- [ ] Accessibility, security, privacy, observability, backup, and rollback
      beta gates are complete.
- [ ] `plans/README.md` marks this roadmap `DONE`.

## STOP conditions

Stop and report instead of improvising if:

- the legacy file hashes differ and the changes have not been reconciled;
- this folder belongs inside an existing repository that was not included;
- catalog extraction does not produce exactly 79 topics and 84 grammar units;
- a proposed “simplification” removes a daily/practice/mastery gate;
- the product owner confirms full Nuxt/Vue is required while React/Next/shadcn
  is also still required;
- a separate backend is scaffolded without an extraction trigger or explicit
  product-owner decision;
- authentication or hosting constraints make the chosen session design
  invalid;
- the app would upload audio before retention, consent, deletion, and storage
  region are decided;
- legacy import cannot be validated without overwriting the source data;
- a milestone verification fails twice after a reasonable correction attempt;
- meeting a milestone requires modifying an explicitly deferred feature.

## Maintenance notes

- Treat the content version independently from the application version.
  Learner records must always retain the grammar/topic slug and content version
  used at the time.
- Keep domain rules pure and framework-independent. Review any import from
  React, Next, Nest, Nitro, database, or browser packages into
  `packages/domain` as an architecture regression.
- Review service-worker and IndexedDB migrations like database migrations; they
  can strand offline users if activated without compatibility tests.
- Review evaluator changes against the fixed German test corpus. A provider
  improvement must not silently change mastery semantics.
- Do not infer pedagogical validity from code completeness. The extracted
  German content should receive a separate expert language/pedagogy review
  before a public learning claim.
