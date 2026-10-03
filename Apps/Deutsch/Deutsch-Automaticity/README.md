# DeutschFlow V10.08.2026

Production rewrite of the Deutsch Grammatik-Automatik v20.8 PWA.

## Stack

- Bun workspaces, runtime, package manager, scripts, and tests
- TypeScript 7
- Next.js App Router, React, Tailwind CSS, and shadcn/ui
- NestJS API
- PostgreSQL foundation prepared for a later opt-in Neon synchronization

The original static PWA remains available under `legacy/v20.8-static/` and at
`/klassik` as an immutable regression reference.

## Implemented product

- Responsive Next.js/shadcn dashboard and all legacy learning routes
- 79 conversation topics integrated into Daily Practice and Studio, plus 144 CEFR-aligned grammar units
- Complete, source-informed explanations for every grammar unit: formation,
  usage, word order, exceptions, memory aid, examples, and error contrast
- Seven-step gated daily path, grammar practice, mastery, errors, and spaced
  reviews
- Five-dimensional mastery (`recognition`, `writing`, `speaking`, `repair`,
  `transfer`) with `new` → `learning` → `usable` → `stable` → `automatic`
  gates; automatic status requires two delayed reviews and fast recall
- Categorized, deduplicated personal errors with repair chains and parallel
  error/topic reviews; failed reviews shorten the interval
- Conversation Studio with recording, speech recognition, transcript editing,
  diagnostic evaluation, adaptive follow-ups, correction, audio persistence,
  and session history
- Curated Google Drive learning library covering the supplied A1–C1 books,
  four-part B2–C1 grammar course, 24-day B2–C2 idiom program, and C1
  discussion audio without redistributing copyrighted pages
- Compatible `GrammarAutomaticityV11_de` localStorage and IndexedDB data
- NestJS health, bootstrap, and LanguageTool evaluation endpoints
- Offline PWA, install prompt, validated JSON import/export, and exact legacy
  fallback
- Bun unit, HTTP integration, Playwright parity, responsive, and offline tests

## Requirements

- Bun 1.3.14 or newer
- A modern browser
- Supabase is optional until account synchronization is enabled

## Commands

```powershell
bun install
bun run dev
bun run verify
bun run test:integration
bun run test:e2e
```

The independent development ports are `http://127.0.0.1:3210` for the web app
and `http://127.0.0.1:4210/api/v1` for the API. The legacy application remains
available only as a regression reference under `/klassik`; it is not the
active start page or navigation target.

## App installieren

Im Bereich **Einstellungen → Auf deinem Gerät installieren** stehen
gerätespezifische Hinweise:

- Windows: in Edge oder Chrome das Installationssymbol beziehungsweise
  **Diese Website als App installieren** wählen.
- Android: in Chrome **Zum Startbildschirm hinzufügen → Installieren** wählen.
- iPhone/iPad: in Safari **Teilen → Zum Home-Bildschirm**, dann
  **Als Web-App öffnen → Hinzufügen** wählen.

Außerhalb der lokalen Entwicklung muss die Website über HTTPS bereitgestellt
werden, damit Browser sie sicher installieren und offline betreiben können.

### Ein-Klick-Setup für Windows

Für nichttechnische Windows-Nutzer wird eine eigenständige Desktop-App gebaut:

```powershell
bun run package:windows-exe
```

Die zu teilende Datei heißt `DeutschFlow-Setup.exe`. Sie installiert
DeutschFlow pro Benutzer ohne Administratorrechte, erstellt Verknüpfungen für
Desktop und Startmenü und registriert die Deinstallation in Windows. Eine
zweite Erstinstallation wird nicht erstellt oder ersetzt. Für eine vorhandene
Installation bietet der Setup-Manager Aktualisieren, Reparieren und
Deinstallieren an; lokale Lerndaten werden bei Updates und normaler
Deinstallation beibehalten.

Use `PLAYWRIGHT_PWA=1` to include the production service-worker/offline test,
and `PLAYWRIGHT_VISUAL=1` to create desktop and mobile visual captures.

TypeScript 7 is used for project checks and Nest emit. TypeScript 6 remains a
tooling-only dependency because ESLint and current framework tooling still
require the legacy compiler API.

The app remains anonymous and local-first by default. A secure Supabase
migration, RLS/RPC layer, private audio bucket, and reproducible 144/79 catalog
seed are ready under `supabase/`; no learner data is uploaded until a future
sign-in and consent flow explicitly enables synchronization.

## Plans and decisions

- `docs/ROADMAP-V10.08.2026.md`
- `docs/product/real-learning-roadmap.md`
- `docs/LEGACY-INVENTORY-V10.08.2026.md`
- `plans/001-production-roadmap.md`
- `docs/adr/0001-platform-stack.md`
- `docs/architecture/supabase-sync.md`
- `docs/product/beta-scope.md`
- `docs/product/grammar-material-sources.md`
