# Active migration audit and implementation roadmap

Date: 2026-08-11

## Authoritative repositories

| Product | Repository root | Active web entry |
|---|---|---|
| English Automaticity | `D:\APPS_root\Apps\English\English-07082026` | `apps/web` on port 3201 |
| German Automaticity | `D:\APPS_root\Apps\Deutsch-V10.08.2026` | `apps/web` on port 3210 |
| Cross Repository Tracker | `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version` | root Next.js app on port 4312 |
| PDF Reader component | `D:\APPS_root\Apps\Apps-For-Integeration\Reader-PDF-App` | root Next.js app on port 4322 |
| Settings component | `D:\APPS_root\Apps\Apps-For-Integeration\Einstellungen-APP` | root Next.js app on port 4323 |

## Reference-to-runtime mapping

| Reference source | English runtime target | German runtime target | Current state | Required action |
|---|---|---|---|---|
| `App_english-automaticity-dashboard-complete` and `App_english-automaticity-routed-HOME` | `/` | `/` with German labels | Migrated into active application shells | Keep one shared state source; verify empty state and persistence |
| `App_english-daily-practice-complete-source` | `/daily` | `/heute` | Active through Next rewrites to `public/replacements` | Verify one-open-step behavior, daily hand-off, completion return, responsive layout |
| `App_grammar-lab-responsive` | `/grammar` | `/grammatik` | Active through Next rewrites to `public/replacements` | Verify complete CEFR catalog, progress counters, navigation and mobile width |
| `App_english-conversation-studio-source` | `/studio` | `/studio` translated to German | Migrated as React source | Verify live microphone, attempt isolation, transcript and provider evaluation |
| `Reader-PDF-App` | `/pdf-reader`, `/notebook` | `/pdf-reader`, `/notizbuch` | Linked by routes; Tracker also owns an embedded reader | Restore CSS/runtime integrity, editable comments, selection menu, responsive panels |
| `App_Rememberry - Translate and Memorize with Flashcards` | `/flashcards` | vocabulary/flashcard route | English route exists; German parity needs verification | Verify decks, spaced repetition, import/export and persistence |
| `Einstellungen-APP` | `/settings` | `/einstellungen` | English redirect and German native route | Verify shared service status, secure server-side secrets and project lifecycle controls |

## Confirmed working

- The five current applications start from their authoritative roots and their primary URLs respond.
- English and German have Bun workspaces, TypeScript, Next.js web applications and NestJS APIs.
- The active English and German navigation points to current routes rather than the old root `index.html` files.
- The Cross Tracker exposes planning, settings, PDF and NLP routes with a NestJS API.
- Existing build, typecheck and unit-test commands have passed in the current repositories.

## Partial or risky

1. English `/daily` and `/grammar`, and German `/heute` and `/grammatik`, are static replacement documents behind Next rewrites. They are active, but they must be tested as real runtime pages rather than assumed integrated.
2. Home and daily state can diverge if the replacement pages and React store use different local-storage contracts.
3. Provider status must distinguish app health from OpenAI, translation, Google and database connectivity.
4. PDF Reader exists in both Tracker and the standalone component; behavior and styles can drift.
5. Some English E2E expectations target an older interface and do not prove the current replacement pages.
6. English/German structural parity is not yet complete even where the visual shell looks similar.
7. The exact canonical legacy Tracker HTML is still unavailable, so exact historical parity cannot be honestly certified.

## Implementation order

1. Capture desktop and mobile screenshots of every active replacement route and record console/runtime failures.
2. Run focused English and German E2E suites against the already-running correct repositories; update obsolete expectations only after proving the current behavior.
3. Repair active-route integration and shared state first: Home, Daily Practice, Grammar, Conversation Studio.
4. Repair PDF Reader and Settings shared contracts, then verify Tracker embedding.
5. Verify CEFR catalog coverage and language purity with automated contracts.
6. Verify persistence, provider truthfulness, microphone/recording and import/export paths.
7. Rebuild all five products, clear only generated caches, relaunch from authoritative roots and repeat desktop/tablet/mobile checks.
8. Move only proven-unused legacy source to `D:\APPS_root\deleted\<application>\<relative-path>`; keep `.git`, dependencies, environment files, databases and user data untouched.

## Acceptance criteria

- Direct URL, refresh, sidebar, header, buttons and internal links open only current pages.
- English pages contain English product text; German pages contain German product text.
- At 1440, 1024, 768 and 390 CSS pixels there is no clipped action, horizontal page overflow or unusable fixed panel.
- Home and Daily Practice show the same level, topic, completed steps, streak and progress.
- Completing a daily task records evidence, offers review/repeat/errors, and returns to the daily route when requested.
- A completion event does not become mastery until verified and later recalled.
- Provider badges report individual real states and never label generic app health as AI or database connectivity.
- PDF selection, highlight, editable comment, save/reopen, reading position and import/export work.
- Bun install, lint/check, typecheck, unit/integration tests, production builds and focused E2E tests pass from the authoritative roots.
- No source file is permanently deleted.
