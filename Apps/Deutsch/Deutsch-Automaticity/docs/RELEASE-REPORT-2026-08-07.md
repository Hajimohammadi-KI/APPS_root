# Release report — DeutschFlow 20.8.5

Authoritative repository: `Apps/Deutsch/German-07082026`

## Release decision

The German application is independently runnable and release-candidate ready.
The Next.js frontend, NestJS API, legacy archive, local persistence, tests, and
Windows offline installer are present in this repository. It does not share a
route, port, storage key, or curriculum identity with the English product.

## Delivery checklist

- [x] Authoritative repository selected and legacy inventory frozen.
- [x] Current startup and installer failures reproduced and repaired.
- [x] Product boundary and independent ports documented: development/desktop
      web `3000`, source production preview `3199`, API `4000`.
- [x] NestJS source is available under `apps/api/src`.
- [x] German A1–C2 content, grammar, vocabulary, search, review, speaking,
      writing, error repair, and progress surfaces are migrated.
- [x] Settings, progress, assessment evidence, audio, and review state persist
      locally; validated JSON backup/import remains available.
- [x] `bun run verify` passes formatting, lint, type checks, unit/integration
      tests, database schema checks, and production builds.
- [x] Installed-build Playwright verification passes: 13 passed, 2 optional
      tests skipped (offline-PWA and screenshot capture).
- [x] Fresh isolated Windows installation succeeds.
- [x] Installer update succeeds and preserves an independently hashed data file.
- [x] Offline Windows executable, Bun runtime, compiled web/API, dependencies,
      content, assets, and configuration are included in the payload.

## Persistence boundary

The application is local-first. `localStorage` stores normalized learner state
and settings; IndexedDB stores audio. The Supabase migration, seed, RLS, and
schema tests are included, but cloud synchronization remains opt-in and is not
reported as connected without real credentials and user consent. “Notes” means
the persisted assessor note and writing evidence; there is no separate notebook.
PDF reading position is outside this language application's product boundary.

## Windows artifacts

- `DeutschFlow-Setup.exe` — 97,280 bytes — SHA-256
  `5867BA1A4ED97668A7C0CAB58BCDA437E14DA5CB0C5F7F550C00DB3C77E848C8`
- `DeutschFlow-Setup.payload.zip` — 195,799,090 bytes — SHA-256
  `2D1144E270D9E096FE7C2F70ADC1FB978854B29DEA38631E0C75228E8CDFB029`

The small setup manager and adjacent payload ZIP must be distributed together.
