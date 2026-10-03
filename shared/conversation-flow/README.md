# Conversation flow and adjustable playback

The shared source implements the accepted English/German conversation specification using the three supplied Prepare, Speak and Feedback images. It preserves the 72 English and 79 German topic catalogs and optional Persian instructions. The grammar worksheet prompt, curriculum and pen renderer remain in [../grammar-worksheets](../grammar-worksheets).

## Learner flow

1. Prepare: one task, an optional teacher recording, two optional phrases and the choice of a monologue or a fixed guided exchange. Teacher audio is only shown when an actual recording exists.
2. Speak: start, pause, resume and finish; elapsed recording time and a waveform derived from microphone samples. Task and selected hints are closed disclosures. Device speech is labelled as a fixed practice partner and pauses recording so it is not captured as learner speech.
3. Feedback: replay and correct recognition errors, confirm the transcript, then request grammar feedback. Evaluation collapses the transcript editor and prioritises one grammar correction; remaining corrections, the error note and recording details are expandable. Retry returns to Speak and creates another attempt.

Playback offers 0.5, 0.75, 1, 1.25, 1.5 and 2 times normal speed. The selected rate persists on the current origin and applies to conversation recordings, teacher recordings and listening controls. Native audio retains pitch. Device speech uses the selected rate when starting the next utterance. Captured audio, elapsed recording time and ASR-based word-rate estimates are unaffected.

## Persistence and evidence

`conversation-studio` IndexedDB version 2 adds `attempts-v2` and `reviews-v2`, preserving the old `sessions` store. Each recording gets a separate ID and Blob. Periodic chunks save drafts while recording, and finishing saves without requiring recognition, grammar evaluation or a retry. Original recognition and edited/confirmed text remain separate. Editing invalidates confirmation and feedback. A response from an older evaluation cannot replace a newer attempt.

Only the explicit completion button updates a daily checklist. It does not certify accuracy, transfer, fluency, pronunciation or mastery. Word counts and word-rate estimates use original ASR and capture time excluding manual pauses; manually entered transcripts have no invented word-rate result. Immediate repetition remains immediate practice. Review checkboxes schedule new-context prompts on days 1, 3, 7 and 14; they do not mark a review completed. Starting a due review hides the previous answer, corrections and hints.

Recordings also appear in the existing Audio Library. Complete backup/restore includes the new database and original audio bytes. Existing legacy media remains preserved. The shared backup source retains the apps' SHA-256 fallback for environments without Web Crypto.

## Source ownership and verification

Edit this directory, then run `bun run worksheets:build` in either app. That existing build entry point synchronises the flow and `editorial.css` into the respective web package so standalone Windows builds resolve React locally. Canonical learning-core changes require `bun run --cwd shared/learning-core build:automaticity` followed by `bun shared/learning-core/sync-workspaces.mjs`.

Run `bun test shared/conversation-flow` for transcript binding, evidence boundaries, review scheduling and malformed provider responses. Each app's normal verification command includes these tests.

Browser tests use a disposable Chrome profile with debugging on port 9337. They generate a tone through the real MediaRecorder and stub recognition/provider results only inside the isolated test tab. They never access a personal microphone. Build the backup test adapter first:

```powershell
bun build shared/learning-core/src/automaticity/backup.ts --target=browser --format=esm --outfile=.codex-tmp/conversation-flow/backup-test.js
$env:CONVERSATION_LANGUAGE = 'de' # or en
$env:CONVERSATION_TEST_URL = 'http://127.0.0.1:3250' # English preview: 3251
bun shared/conversation-flow/verify-browser.mjs
bun shared/conversation-flow/verify-theme.mjs
```

Reports and screenshots go to `artifacts/conversation-flow/<language>`. The tests cover separated screens, microphone failure messages, pause timing, autosave, provider failure, transcript editing, retry preservation, delayed review, backup round-trip, audio-library integration, playback preference and responsive layouts. Synthetic fixtures are not demonstrations of recognition quality or learner improvement. Physical microphone, Apple Pencil, Android stylus and Windows pen checks remain separate device checks.
