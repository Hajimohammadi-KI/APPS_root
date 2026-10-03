# Grammar worksheet implementation review

Reviewed on 2026-09-08. Scope: the existing German and English grammar pages, shared worksheet content and renderer, printable output, device ink input, and Windows delivery packages.

## Design and curriculum

The supplied Learn, Practice and Assess images informed the page sequence, header bands, numbered cards, decision boxes, compact tables and review strip. Reference images and rendered pages were inspected together. The implementation uses cream `#FAF8F4`, indigo `#3D5A9E`, sand `#EFE7DA` and sparse coral `#D96B5A`, with exported Lucide line icons. It contains no green worksheet accents, people or clip art. Typography and writing areas remain legible in the inspected A4 renders.

The shared renderer covers all 144 German and 112 English catalog topics, A1–C2. Each topic has one focused decision across three learner pages, with controlled contrasts, a decision chain, a WHY field for each exercise, reconstruction, transformation, a timed oral drill, personal production, error logging and review on days 1, 3, 7 and 14. Answer keys are separate and include answer, cause, trigger, category and contrast. Optional Persian instructions keep target-language sentences left to right.

This provides a worksheet for every catalog topic; it does not imply that one set exhausts every sub-skill in that topic or demonstrate improved learning outcomes. Grammatically possible alternatives that miss the requested meaning or register are explicitly distinguished from grammatical errors.

The reusable source prompt is [shared/grammar-worksheets/MASTER-PROMPT.md](shared/grammar-worksheets/MASTER-PROMPT.md). Source ownership and regeneration commands are in the [README](shared/grammar-worksheets/README.md).

## Verification

| Check | Result and scope |
| --- | --- |
| Content contracts | PASS: 8 tests, 29,694 assertions; full catalog mapping, unique IDs, target spans and answer-key completeness. |
| Browser interaction | PASS for both languages: stage navigation, instruction language, reconstruction cover, oral timer, typed answers, ink persistence, pressure events, erasing, undo and clear. No mastery-state mutation. |
| Responsive layout | PASS: all three stages at 390, 768 and 1500 px; no horizontal overflow. |
| A4 layout coverage | PASS: 1,536 layouts across 256 topics, three stages and both instruction-language modes. |
| Print output | PASS: the six sample handout/key PDFs contain three A4 pages each. Blank exports remain three pages after long writing and manual field resizing, and omit saved text and ink. Filled exports preserve long text and ink, allowing additional pages. |
| Storage failure | PASS: a simulated quota failure is reported without claiming the draft was saved. |
| English project check | PASS: `bun run check`, including curriculum parity, tests, installer checks and lint. |
| German individual checks | PASS: lint, typecheck, application tests, worksheet tests, installer tests and schema checks. Production build passed. |
| German aggregate verify | BLOCKED at the existing formatting gate in untouched `apps/web/src/features/errors/error-engine.tsx` and `packages/learning-core/src/automaticity/backup.ts`. The required checks were also run individually. |
| Packaged source parity | PASS: each final payload contains the expected embedded web checksum and 16 worksheet-related assets matching current public sources. |

Browser and print evidence is under `artifacts/grammar-worksheets/de` and `artifacts/grammar-worksheets/en`; package parity is recorded in `artifacts/grammar-worksheets/package-verification.json`. Detailed command logs are under `.codex-tmp/grammar-worksheet`.

Pen checks use real browser-dispatched Pointer Events in a disposable Chrome profile. Physical Apple Pencil, Android stylus and Windows pen hardware were not available for certification. Handwriting remains locally saved ink; it is not OCR, automatic grading or cross-device synchronization.

## Windows release verification

Both final packages passed previous-version installation, upgrade, startup, update, repair and uninstall in isolated test directories. A synthetic learner-data marker survived; browser/IndexedDB backup restoration was not part of this lifecycle check. Both setup executables are unsigned and executed successfully on this machine.

| Product | Final version | Previous version | Lifecycle evidence |
| --- | --- | --- | --- |
| DeutschFlow | 20.8.47 | 20.8.45 | `artifacts/installer-cycle/German-20260908-014522-d982d0c4/report.json` |
| English Grammar Automaticity | 27.3.42 | 27.3.41 | `artifacts/installer-cycle/English-20260908-014803-0ea57156/report.json` |

Release archives include the setup and its required payload:

- `releases/DeutschFlowDesktop-20.8.47-Windows.zip` — SHA-256 `7c9604a2b2e5ca4a26a7066bdfffffc804be74bac6e429497c642c7df43bea32`.
- `releases/EnglishGrammarAutomaticityDesktop-27.3.42-Windows.zip` — SHA-256 `f28754417e03600b1e7dbbb0220d45272247a1860714361010f37f277bf6b4bd`.

Verified setup SHA-256 values:

- DeutschFlow: `e4a472a9542c82cb27a0661856b57c360bd4dfa3f841b8128f57d591ad2f0b0f`.
- English Grammar Automaticity: `fe8fb22dcc823b4feb98d17b5b7b6b595fb45f85e6d79d6893b76e71c0f4067c`.

Printable samples are committed under each app's `output/pdf` directory. Runtime evidence and large installer archives stay outside Git.

# Conversation, listening and shared visual refresh

Reviewed on 2026-09-08 after the worksheet release above. The shared implementation is in `shared/conversation-flow`; comments explain recording ownership, transcript confirmation, playback timing and storage boundaries. The English and German web builds synchronise these files automatically.

## Implemented behaviour

Conversation Studio now has three separate views: Prepare, Speak and Feedback. Preparation shows one task and up to two optional phrases. Speaking uses a real microphone waveform and capture timer, with task and hints behind disclosures. Feedback requires transcript confirmation before grammar evaluation and shows one priority correction with its cause; additional corrections and error notes are expandable. Original recognition, edited text and each audio attempt remain separate. A retry preserves the first recording. Day 1, 3, 7 and 14 reviews schedule a new context without exposing the previous answer. Neither scheduling nor repeating a task certifies mastery.

Conversation recordings, teacher recordings and listening controls offer 0.5×, 0.75×, 1×, 1.25×, 1.5× and 2× playback. The setting persists on the current origin. Native audio preserves pitch; device speech uses the selected speed for the next utterance. Changing playback speed does not change captured audio, capture duration or ASR-based word-rate estimates. The Audio Library lists the separate attempts, and complete backup/restore includes their audio blobs.

The app shell, dashboards, daily practice, grammar, resources and other existing learning pages use cream, indigo and sand. The three supplied conversation images were compared with rendered Prepare, Speak and Feedback states. Visual inspection also found and corrected legacy purple styling, overlapping daily-page sidebars and an unreadable active navigation label. Existing worksheet content and the ink renderer remain intact.

## Verification boundaries

The German aggregate `bun run verify` and English `bun run check` passed. The earlier German formatting blockers recorded above were resolved with formatting changes. Both production web builds passed, and the canonical learning-core mirrors match. The focused conversation suite passed 10 tests with 35 assertions, including transcript binding, review/evidence boundaries and malformed provider responses.

Browser interaction tests use the real MediaRecorder with a generated tone in a disposable Chrome profile. Recognition and grammar-provider responses are synthetic fixtures restricted to the test tab. These checks establish application behaviour; they do not establish microphone hardware quality, recognition quality or improved learning outcomes. Physical Apple Pencil, Android stylus and Windows pen testing remains unverified. Handwriting remains locally stored ink, without OCR or automatic grading.

The worksheet regression passed for both languages, including typed and ink persistence, pressure strokes, erasing, undo, phone/tablet/desktop layouts and all 1,536 A4 layouts. The exhaustive print scan now yields between batches of twelve topics to avoid a single long browser-command timeout; it retains every topic and both instruction modes. Browser and print results are in `artifacts/grammar-worksheets/{de,en}/verification.json`.

Conversation browser checks passed all 17 scenarios in each language against production previews, with no uncaught runtime exceptions. Checks include microphone error states, pause timing, autosave before evaluation, provider failure, transcript confirmation and edit invalidation, retained first-attempt audio, backup restoration, review boundaries, playback-speed persistence, the Audio Library, mobile/tablet layouts and Persian instructions. The instruction selector is also checked for unobstructed pointer access at 390, 768 and 1117 px; the English header reserves space for its floating reading-ruler control. The visual audit passed 15 German and 13 English routes with the local services running: no detected green accents, horizontal overflow, overlapping sidebars or unreadable active navigation labels. Reports and screenshots are under `artifacts/conversation-flow/{de,en}`.

## Final Windows packages

These replace the earlier worksheet-only versions in this report. Both final setup files passed previous-version installation, upgrade, startup, update, repair and uninstall in isolated directories. A synthetic data marker survived. Recording backup/restore was checked separately in the browser and compared original audio hashes. Both unsigned setup executables ran on this machine. These are local release archives; no release upload or Git push was performed.

| Product | Final version | Upgrade from | Lifecycle report |
| --- | --- | --- | --- |
| DeutschFlow | 20.8.48 | 20.8.47 | `artifacts/installer-cycle/German-20260908-104632-50a5ea6d/report.json` |
| English Grammar Automaticity | 27.3.43 | 27.3.42 | `artifacts/installer-cycle/English-20260908-110130-bd6efcfd/report.json` |

Setup SHA-256 values verified by those lifecycle runs:

- DeutschFlow: `9f8adb3a65ea665b5d20952f4d41950175e20ce66763b5aa068a5ddc121a894b`.
- English: `796e31a0b187463e1b49b2aee790655c946e9b544aead210e6de55b57afa0d46`.

Complete delivery archives, including setup and required payload:

- `releases/DeutschFlowDesktop-20.8.48-Windows.zip` — SHA-256 `8f4dab6aca2bc605028195d1de4173094f73d956463c54a0d6ffedb992bc6d8b`.
- `releases/EnglishGrammarAutomaticityDesktop-27.3.43-Windows.zip` — SHA-256 `51dba851343bd461f7c34f1eafcdd535b1672076452e1d87cdd058d95c017d33`.

Package parity passed for 39 German and 38 English public/production assets, plus 16 worksheet assets in each language. Embedded web checksums match. Evidence is in `artifacts/conversation-flow/package-verification.json` and `artifacts/grammar-worksheets/package-verification.json`.


## Device access verification, 8 September 2026
The final mobile/tablet update preserves the accepted three-screen conversation specification. Same-origin API requests and cryptographic draft IDs work on LAN HTTP. The managed private gateway serves the existing three links and optional HTTPS recording links. Code comments explain origin migration, ID compatibility, proxy boundaries and certificate handling.
Verified:
- `bun run verify` (German) and `bun run check` (English) passed. The release builds passed. Logs: `artifacts/device-access/de-verify.log` and `en-check.log`.
- Five focused device/ID tests passed with 1,022 assertions; canonical learning-core mirrors match.
- Final browser check: English and German home, grammar, practice and conversation at 390, 768 and 1117 px without overflow; actual same-origin health responses; pen pressure events, undo, typed and ink persistence on LAN HTTP; no runtime exceptions or requests to the mobile device loopback. `artifacts/device-access/browser/verification.json`.
- The roadmap responds at the same widths and remains read-only. Workspace/private key paths and cross-site writes are rejected.
- All three HTTP links returned 200 from WSL Ubuntu, a separate network context. `artifacts/device-access/network.json`. Both private HTTPS app/API links passed IP and certificate-chain verification with the generated CA. Local release-readiness contracts passed for English and German; public deployment was outside this change.
- Both HTTPS conversation suites passed all 17 scenarios, including autosave, raw versus confirmed transcript, failure states, independent retry, original audio hash retention, full backup restoration, new-context review and speed persistence. `artifacts/conversation-flow/devices/{en,de}/verification.json`. These tests use a synthetic tone and stubbed ASR/provider replies in a disposable CDP profile; they do not use the learner microphone or claim ASR quality. The test profile alone bypassed certificate trust; an independent HTTPS client validated the real CA chain.
- Embedded build assets match the verified payloads: 39 German and 38 English public assets/production JS/CSS files, plus 16 worksheet assets per app. `artifacts/conversation-flow/package-verification.json` and `artifacts/grammar-worksheets/package-verification.json`. The verifier now fails if production chunks are missing. The running English preview was restored from the exact verified release payload; an additional build was retained in `artifacts/device-access/additional-preview-build`.
- German 20.8.49: install, previous-version upgrade, startup, update, repair and uninstall passed. Isolated synthetic learner-data marker preserved. Setup SHA-256 `91e17c0d33c33a913a642e8a3995b5dffdb3b359d09ed4fc7b936f4fc9d9f408`. Release `releases/DeutschFlowDesktop-20.8.49-Windows.zip`, SHA-256 `1398380ffed1f4d03fdf1af661e85e454b7e0acfabffe0c660bf81e9ab102b22`. Evidence: `artifacts/installer-cycle/German-20260908-142005-47693362/report.json`.
- English 27.3.44: install, previous-version upgrade, startup, update, repair and uninstall passed. Isolated synthetic learner-data marker preserved. Setup SHA-256 `38ebb5c3fdbef516a6da38a49dc892f64312bc2096f8af0eb97a0deb96d9644a`. Release `releases/EnglishGrammarAutomaticityDesktop-27.3.44-Windows.zip`, SHA-256 `c30cbff471228cc9e4d2c28010bbbc0e1cea4dac8f93b7fe8adbb3250ed781a5`. Evidence: `artifacts/installer-cycle/English-20260908-142124-d6385063/report.json`.

Limits and handoff:
- Physical Apple Pencil, S Pen, Surface Pen, iPad Safari and real microphone checks remain unverified. The automated pen tests inject browser pointer events.
- The generated private certificate is not installed in any trust store automatically. Each actual device needs the one-time trust and microphone-permission steps in `docs/LANGUAGE-DEVICE-ACCESS.md`. No firewall change or automatic Windows logon startup was applied.
- Drafts belong to their browser/origin. HTTP, HTTPS and different devices do not share local storage automatically; export/import before switching. Handwriting has no OCR or automatic grading.
- The original three LAN URLs were restored, using a managed launcher with start/status/stop. Keep the host computer awake. The roadmap source integrity guard was preserved.
