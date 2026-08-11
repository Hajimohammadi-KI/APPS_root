# Actual Software Roadmap — 2026-08-08

## Authoritative applications

Only these three folders are active product repositories:

| Product | Authoritative folder | Web | API | Product boundary |
| --- | --- | ---: | ---: | --- |
| Cross Repository Code Intelligence | `Apps/Cross_Repository_Code_Intelligence-Version2` | 4312 | 4313 | Thesis planning, research evidence, PDF work and project progress. It remains independent from the language apps. |
| English Automaticity | `Apps/English/English-07082026` | 3201 | 4201 | CEFR English learning from knowledge to accurate, fluent and automatic use. |
| DeutschFlow | `Apps/Deutsch/German-07082026` | 3199 | 4000 | German-specific CEFR learning, grammar, cases, speaking and automaticity. |

Anything under `D:/APPS_root/deleted` is quarantined, not authoritative, and may be restored until the user deletes it.

## Recovery verification after filename-based deletion

- On 2026-08-08 all five active repositories were reinstalled with their frozen Bun lockfiles. Cross restored one missing dependency; English, German, Settings and PDF Reader required no dependency changes.
- Nothing was restored indiscriminately from the Windows Recycle Bin. Names such as `delete.js`, `DeletePropertyOrThrow.js` and `no-dynamic-delete.js` belong to normal third-party packages and are not evidence of obsolete application code.
- No superseded product repository remains under `Apps`: the only active product roots are the three authoritative folders above plus the reusable `Einstellungen-APP` and `Reader-PDF-App` components.
- Generated top-level runtime logs are quarantined under `D:/APPS_root/deleted/runtime-logs-2026-08-08`; source, legacy snapshots, compiled releases, dependencies, configuration and user data remain in place.

## Target architecture

- Frontend: Next.js App Router, React and a standard shadcn component registry with shared design tokens.
- Backend: NestJS is the only application API. Next route handlers are limited to web-only concerns such as OAuth callbacks or streaming a local file; business rules move to NestJS.
- Runtime and tooling: Bun is the package manager, workspace runner, test runner and normal server launcher. TypeScript 7 is the canonical compiler configuration. Browser automation may run through Node when Playwright is incompatible with Bun on Windows.
- Persistence: local-first storage remains mandatory so an offline learner does not lose work. Neon Postgres is added only for authenticated backup and multi-device sync; it must not make the offline path dependent on the cloud.
- Content: authored course data lives in typed content packages. Commercial PDFs remain references or user-owned files; exercises and explanations are newly written.
- Deployment: each app has an independent identity, route, port, environment and release artifact. There are no shared ports or accidental English/German content.

## Current evidence

### Cross Repository Code Intelligence

- React/Next, standard shadcn configuration, Bun, TypeScript 7 and a NestJS API are present.
- Production Worker startup is the correct local release path. `vinext start` serves HTML but not client assets in this repository and must not be used as the Windows release launcher.
- The installed Windows copy was repaired from the verified source after one stale source Worker was found occupying port 4312. The repair preserved user data, rebuilt dependencies and compiled artifacts, recreated shortcuts and restarted the app automatically.
- Post-repair local verification passes for `/`, `/settings` and `/pdf-reader` on desktop and mobile: HTTP 200, no error overlay, no horizontal overflow, no failed requests, 14.11:1 reader contrast, and persistent progress, focus and settings.
- Lint, TypeScript 7 typecheck, 35 contract tests, 18 Bun domain tests and the compiled frontend/API build pass.
- The public Vercel deployment still passes layout, route and readability checks, but its progress-persistence check fails while the repaired local release passes. Vercel must be redeployed from this verified source before it can be called equivalent to the current release.
- The canonical legacy file `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html` is absent from the active repository, source snapshots and the searched local archive. All recoverable legacy snapshots remain preserved under `legacy/source-snapshots`; exact parity with the missing file cannot be claimed or fabricated.

### English Automaticity

- The original legacy `index.html` remains preserved and its extracted content is covered by parity tests.
- Typecheck, lint, 30 content/domain tests, two API tests, five installer tests, production frontend/API builds and 22 end-to-end tests pass after the deletion recovery check.
- The service-worker end-to-end assertion was updated to the current unified-daily-practice cache version.

### DeutschFlow

- The exact v20.8 legacy application remains under `legacy/v20.8-static`.
- Strict English/German parity now reports zero missing required files.
- Formatting, lint, TypeScript 7 typecheck, unit/integration checks, installer checks and the production build pass.
- The current end-to-end journey passes 13 tests. The development-only PWA install check and optional visual-capture check are intentionally skipped; all functional journeys pass.
- The remaining Supabase-named seed/schema scripts are migration debt. They are not the target cloud architecture and must be replaced by a provider-neutral schema plus Neon adapter before cloud sync is enabled.

### Reusable Settings and PDF Reader

- `Einstellungen-APP` passes lint, TypeScript 7 typecheck, production build and its settings-boundary tests.
- `Reader-PDF-App` passes lint, TypeScript 7 typecheck, production build, PDF mark validation and reading-position/analysis persistence tests.

## Delivery sequence

### Phase 1 — Release baseline (now)

1. Keep the three authoritative folders above and quarantine only proven superseded artifacts.
2. Keep every legacy source and snapshot until its parity inventory is signed off.
3. Use the fixed independent ports and expose a real Nest health endpoint for each app.
4. Require lint, TypeScript 7 typecheck, unit/integration tests, production build and end-to-end smoke tests before packaging.

### Phase 2 — Clean boundaries

1. Move business API handlers from Next into Nest feature modules.
2. Create shared domain contracts for progress, notes, settings, reading position, analysis results and backup manifests.
3. Replace German Supabase-specific names and scripts with provider-neutral migrations.
4. Split oversized screens into route-level compositions, feature components and pure domain services without changing visible behavior.

### Phase 3 — Durable persistence

1. Keep IndexedDB/local storage as the offline write path.
2. Add Neon tables and migrations for authenticated backup/sync only.
3. Implement an outbox, stable IDs, timestamps, conflict handling and restore tests.
4. Prove reinstall and upgrade preserve progress, notes, settings, audio/PDF reading position and analysis results.

### Phase 4 — Legacy completion

1. English: maintain automated inventory coverage for all legacy topics, content, routes and styles.
2. German: maintain v20.8 route/content parity while continuing copyright-safe authored exercises.
3. Cross: import the canonical V6.3.1 file if a surviving copy is recovered; until then, preserve and test every available source snapshot and document the unavoidable gap.
4. Never replace missing legacy behavior with a placeholder while calling it migrated.

### Phase 5 — Product-quality UX

1. One primary action per page; daily training and automaticity are one adaptive journey, not competing routes.
2. Reuse shadcn primitives, accessible contrast, the optional reading ruler and responsive accordion/select patterns.
3. Keep English completely English and German completely German; optional explanations may be selected in the learner's support language.
4. Add loading, empty, error, offline, locked and recovery states to every critical workflow.

### Phase 6 — Release and installation

1. Build frontend, Nest API, dependencies, assets, PDFs/configuration and migrations into a versioned payload.
2. Test a fresh Windows install and an in-place update on a clean destination.
3. Require the setup/update window to close automatically and open the installed app only after health checks pass.
4. Publish checksums, a recovery procedure, a legacy-parity report and a release report matching the actual binaries.

## Definition of done

An app is release-ready only when installation/startup, API health, navigation, language identity, daily practice, speaking/recording, PDF selection/annotation, persistence/reopen, settings, backup export/import and update preservation all pass against the packaged build. Green unit tests alone are not release proof.
