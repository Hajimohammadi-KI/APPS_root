# English Grammar Automaticity v27

The legacy single-file PWA is now a runnable Bun monorepo with a Next.js 16 /
React 19 frontend, Shadcn-style UI primitives, a NestJS 11 backend, and a
typed shared content package. The original page is retained at `legacy/index.html` as
the source-of-truth public legacy archive.

## Run the software

Install dependencies and start the frontend and API:

```powershell
bun install
bun run dev
```

Open `http://localhost:3201`. The Nest API runs at
`http://localhost:4201/api/health`.

For a production build:

```powershell
bun run build
bun run start
```

## Free Vercel deployment

The repository root contains `vercel.json` for the English production site.
It declares `Apps/English/English-07082026` as Vercel's root directory,
because `APPS_root_new` holds several independent apps and has no root
`package.json`. Do not override that root directory in the Vercel dashboard.

To run the preserved source application independently:

```powershell
bun run legacy:preview
```

Open `http://localhost:3301/legacy/index.html`.

The app must be served through HTTPS or `localhost` for microphone, service
worker, PWA installation, speech, and online assessment features.

## Verify the migration

```powershell
bun run check
bun run build
bun run test:e2e
```

The unit suite proves exact source-literal parity for 72 conversation topics,
all 84 original grammar units and 43 online resource collections, plus 28
researched CEFR supplements. Every one of the resulting 112
grammar units contains at least five controlled exercises. The Edge browser
suite opens all eight public product surfaces, runs grammar and saved-assessment
journeys, repairs a captured error, advances daily gates, validates
deep links, Back/Forward behavior, desktop and mobile navigation, calls the
live Nest assessment API, and compares source/migrated catalogs, primary
controls, dashboard content, theme tokens, and screenshots.

## Architecture

- `apps/web`: Next.js App Router frontend, local-first mastery engine, speech,
  recording, IndexedDB audio, import/export, and installable/offline PWA.
- `apps/api`: NestJS/Fastify health and LanguageTool assessment endpoints.
- `packages/content`: immutable typed legacy content plus the researched CEFR
  curriculum supplement and five-exercise guarantee.
- `apps/api/database`: optional Neon PostgreSQL connected-mode schema.
- `docs/ROADMAP.md`: inventory, architecture decisions, delivery phases, and
  the twelve supplemental automaticity requirements from `Langauge.md`.
- `doc/duplicate-markdown/Apps/English/English-07082026/docs/CEFR-CURRICULUM.md`: internet-source methodology, level counts, and
  the complete list of added grammar subjects.
- `doc/duplicate-markdown/Apps/English/English-07082026/docs/INTEGRATED-SKILLS-CURRICULUM.md`: the original A1-C2 four-skills
  automaticity ladder, evidence gates, accessibility contract, and content
  provenance.
- `doc/duplicate-markdown/Apps/English/English-07082026/docs/AUTOMATICITY-METHODOLOGY.md`: the daily lesson-to-automatic-speech
  method, CEFR adaptation, motivation rules, and accessibility safeguards.
- `doc/duplicate-markdown/Apps/English/English-07082026/docs/LEGACY-PARITY.md`: screen-by-screen source-to-software migration
  contract and automated evidence.
- `tests/e2e`: real browser journeys.

Neon is deliberately optional: all legacy practice remains usable offline.
The connected schema is ready for the later authenticated sync phase, but
should not be deployed until identity, authorization, consent, and audio
retention policies are selected.

## PWA installation

- Android / Windows: open the HTTPS address in Chrome or Edge and choose
  Install.
- iPhone / iPad: open in Safari, choose Share, then Add to Home Screen.

## Distributable app packages

The project can also produce a signed Android APK/AAB, a Windows package, and
an iOS Xcode project from the same hosted PWA:

```powershell
bun run package:stores
```

See `doc/duplicate-markdown/Apps/English/English-07082026/distribution/README.md` for direct sharing, store submission, signing-key
handling, and the macOS/Xcode handoff required by Apple.

### One-click Windows setup

Build the desktop installer for a non-technical Windows user:

```powershell
bun run package:windows-exe
```

Share only `EnglishGrammar-Setup.exe`. It installs per user without
administrator rights, creates Desktop and Start-menu shortcuts, and registers
an uninstall entry in Windows. Setup permits one installation per Windows user;
running first-time setup again does not create or replace another copy. The
setup manager offers Update, Repair, and Uninstall for an existing installation.
Learning data is isolated from the German app and remains available after
updates and normal uninstall.

## Included offline

- Conversation topics
- Grammar explanations and exercises
- Daily automaticity path
- Original Integrated Skills Path: 24 units, 96 skill paths, and 672 evidence
  stages from A1 to C2
- Spaced reviews
- Error history
- Settings and progress
- IndexedDB audio storage where supported
- User-selected backup folders in Chromium browsers, with a normal download
  fallback in other browsers

## Online assessment

LanguageTool is routed through the NestJS backend. If it is unavailable, the
app can still show a small set of offline corrections, but a blocking learning
gate cannot pass until the full online assessment succeeds.

## Version 16 complete content

- 72 conversation topics
- 84 grammar units from A1 to C2
- Test-answer button for every writing or speaking task
- Test answers can be inserted and read aloud

## v17

- Conversation topics use cascading dropdown menus.
- Test buttons evaluate the learner’s own text instead of inserting model answers.
- Open-ended grammar production corrects the learner’s sentence.

## Version 18

- Smaller, more refined buttons across desktop and mobile.
- Grammar resource links are no longer generic home-page links.
- Only verified exact-topic pages are shown; each link includes a description of the exact explanation and practice it contains.
- When no exact verified external page is stored, the app keeps the built-in explanation and exercises instead of showing a generic link.

## Version 19

- Complete English Path A1–C2 and Academic English B1–C2 have been added as first-class learning paths.
- The default path now exposes every available level instead of stopping at A2.

## Version 20

- All 84 Grammar Lab units from A1 to C2 now contain two clearly labelled resources.
- “Online explanation” opens the exact-topic rule and examples.
- “Online exercises” opens the interactive practice area for the same exact topic.
- Generic home-page and search-page links are not used.
- The built-in self-test checks that every unit has both resource roles.

## Version 21

- Adds a dedicated Online Resources screen.
- Adds free-text grammar search plus category and level filters across all 84 units.
- Includes 14 complete grammar categories, such as tenses, modals, conditionals, passive voice, clauses, word order, and academic style.
- Includes direct level collections for Test-English Writing, Vocabulary, Listening and Use of English.
- Includes the four exact Test-English IELTS Exam 1 tests.
- Adds matching free British Council level collections for Writing, Listening, Vocabulary and Grammar.
- Skill and level filters make the resource list easy to navigate.

## Version 22

- Adds free-text Grammar Lab search with simultaneous level and topic filters.
- Organizes all 84 units into 14 complete grammar categories.

## Version 27

- Replaces word-count-only completion with a blocking full-answer assessment.
- Reports spelling, grammar, exact LanguageTool reasons, corrected output, target-structure use, and answer completeness separately.
- Shows exact-topic explanation and exercise links with each assessment when the lesson provides them.
- Reads every corrected answer aloud on request.
- Applies the same assessment contract to guided transfer, free production, daily sentences, conversation, transfer, delayed review, and final completion.
- A failed or interrupted online assessment cannot unlock or complete a stage.
- Controlled multiple-choice items remain deterministic: an incorrect option cannot pass.
