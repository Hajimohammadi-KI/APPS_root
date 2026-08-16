# Release report — English Automaticity 27.0.6

Authoritative repository: `Apps/English/English-07082026`

## Release decision

The English application is independently runnable and release-candidate ready.
The Next.js frontend, NestJS API, immutable legacy source, local persistence,
tests, and Windows offline installer are present in this repository. Tracker and
German checks are optional cross-product tests, not startup dependencies.

## Delivery checklist

- [x] Authoritative repository selected and legacy inventory frozen.
- [x] Current startup, test coupling, and installer failures reproduced and repaired.
- [x] Product boundary and independent ports documented: web `3201`, API `4201`.
- [x] NestJS source is available under `apps/api/src`.
- [x] English A1–C2 content, grammar, vocabulary, search, review, speaking,
      writing, error repair, and progress surfaces are migrated.
- [x] The former branded skills section is replaced by the independently
      authored Integrated Skills Path: 24 units, 96 four-skill paths, and 672
      evidence stages from A1 to C2.
- [x] Every Integrated Skills path uses Understand, Recognise, Recall,
      Supported Use, Independent Use, Transfer, and Delayed Review gates.
- [x] Spoken instructions, speech-to-text, large high-contrast controls,
      low-stimulation defaults, untimed work, and a one-step rescue mission are
      available for older learners and learners with attention or literacy
      difficulties.
- [x] Settings, progress, assessment evidence, audio, and review state persist
      locally; folder backup and validated import remain available.
- [x] `bun run check` and `bun run build` pass type checks, unit/API tests, lint,
      and production builds.
- [x] Installed-build Playwright verification passes: 19 of 19 tests,
      including Integrated Skills persistence and narrow-mobile layout.
- [x] Automaticity Mission follows the exact Grammar Lab lesson selected for
      today and keeps lesson-specific practice, writing, speaking, shadowing,
      error, and review evidence separate.
- [x] Persian hover guidance is rendered in Persian and remains available
      after React state updates.
- [x] Fresh isolated Windows installation succeeds.
- [x] Installer update succeeds and preserves an independently hashed data file.
- [x] The installed 27.0.5 application updates to 27.0.6 without changing the
      existing 155 data files or their total byte count.
- [x] The installed Electron renderer uses the accessible purple desktop
      palette and contains no retired green desktop highlight.
- [x] Offline Windows executable, Bun runtime, compiled web/API, dependencies,
      content, assets, and configuration are included in the payload.

## Persistence boundary

The application is local-first. `localStorage` stores normalized learner state,
settings, progress, attempts, and analysis evidence; IndexedDB stores recordings
and the chosen backup directory. The optional Neon schema is included, but a
remote database remains disabled until identity, authorization, consent, and
retention choices are made. No mock status is presented as a live connection.
“Notes” means the persisted assessor note and writing evidence; there is no
separate notebook. PDF reading position is outside this language application's
product boundary.

## Windows artifacts

- `EnglishGrammar-Setup.exe` — 98,304 bytes — SHA-256
  `D5F7268E45F15F426378C050B4E0CA5D853B332F0BCC10FC64AE16615AFFE441`
- `EnglishGrammar-Setup.payload.zip` — 236,795,904 bytes — SHA-256
  `6F715E4C2111382ADF8AAB949032CECFD5937A259D2BF44525BDF76B4102B620`

The small setup manager and adjacent payload ZIP must be distributed together.
