# Actual-software roadmap

Date: 2026-08-07
Authoritative repository: D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version2

## Product boundary

Version2 is one independent Cross-Repository Code Intelligence study tracker.
It does not depend on the English or German learning applications. Its complete
local user flow is:

Tracker UI -> Next.js route handlers -> local D1/R2-compatible storage

The NestJS API on port 4313 supplies health, integration capabilities, and the
future domain-service boundary. Neon remains optional until authenticated
cross-device sync is deliberately enabled.

## Current executable baseline

- React 19 and Next.js 16 App Router frontend.
- Shadcn new-york configuration with owned Button, Card, and Badge source.
- Bun workspace and Bun lockfile.
- TypeScript 7 checks for web and NestJS source.
- NestJS 11 with Fastify, compiled source, and health endpoint.
- Compiled local frontend and API, dependencies, migrations, bundled Exposé,
  Windows setup/update/repair, and offline iPad preview.
- Persistent progress, notes, settings, focus sessions, attachments, reading
  position, PDF marks, and analysis results.
- Central Google connection shared by Tracker, Settings, and PDF Visual.

## Delivery order

### 1. Resilient project schedule

Separate stable task identity, schedule, and progress. Add:

- selectable project start date;
- calculated end date and a separate university deadline;
- pause/resume intervals that preserve completed work;
- plan revisions for professor-directed changes;
- impact preview before rescheduling future work;
- immutable history and stable task IDs.

Acceptance: changing the start date or adding a pause moves only scheduled
dates. Completed tasks, notes, evidence, PDFs, and progress remain attached to
the same IDs.

### 2. Freeze the recoverable legacy contract

Use the recoverable intermediate repositories and iPad preview as supporting
evidence. Do not call them the canonical legacy source. When
StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html is recovered:

1. hash the file and referenced assets;
2. place read-only fixtures under legacy/fixtures;
3. extract labels, content, interactions, storage keys, and visual states;
4. add fixture-driven parity tests;
5. migrate any confirmed missing behavior without replacing newer features.

Acceptance: bun run audit:legacy passes and every extracted legacy capability
has either a passing replacement test or an explicitly approved archive record.

### 3. Complete the NestJS domain boundary

Move state, focus, attachment, provider, Google, AI, and translation domain
logic behind typed NestJS services. Keep Next.js route handlers as a temporary
same-origin compatibility layer for the browser and local Cloudflare runtime.

Acceptance: no permanent mock status, Zod validation at every mutation,
structured errors, and integration tests across UI -> API -> storage.

### 4. Persistence and optional Neon sync

Keep local-first operation as the default. Add Neon only with authentication,
schema migrations, conflict handling, and explicit import/export.

Acceptance: update and repair preserve local data; cloud sync can be disabled;
backup JSON contains no API keys or OAuth tokens.

### 5. Incremental frontend standardization

Replace repeated raw controls with owned Shadcn primitives in small,
regression-tested slices. Preserve the light-purple accessible design, large
targets, reduced-motion option, German content, and responsive layouts.

Acceptance: no big-bang rewrite, no content loss, keyboard navigation works,
and desktop/tablet/mobile browser checks remain clean.

### 6. Release gate

- Bun install and lockfile verification.
- TypeScript 7, lint, unit, integration, and end-to-end tests.
- Vinext local build, Next.js/Vercel build, and NestJS build.
- Fresh Windows install plus update preserving .env.local and .wrangler.
- Tracker, Settings, PDF selection/annotation, backup/import, Google, and
  offline iPad-preview verification.

## Non-negotiable rule

A legacy feature is removed only after the current app can read its data,
perform the same user goal, and pass an automated regression test. Missing
canonical evidence must be reported as a blocker, never guessed.
