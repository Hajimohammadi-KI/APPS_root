# LingoBridge: Deutsch · فارسی · English

LingoBridge is an original, local-first Chrome/Edge extension. It uses general learning methods such as active recall and spaced repetition, but it does not copy Rememberry code, text, icons, branding, or paid services.

## Included in version 2

- Save selected text from the page toolbar or right-click menu.
- German, Persian, and English card directions.
- Multiple decks with search, edit, delete, and move actions.
- Text, listening, and typing study modes.
- Reverse practice and optional answer pronunciation.
- Adaptive spaced repetition or unrestricted manual practice.
- Daily streak and review statistics.
- Open Google Translate only after an explicit click.
- Optional highlighting of learned words on web pages.
- Optional automatic capture and a per-domain disable list.
- Popup and Chrome/Edge side-panel layouts.
- Local JSON import/export without an account or subscription.
- Local connection to the German app, English app, and project tracker.
- Accessible purple palette, strong contrast, keyboard focus, and reduced-motion support.

## Build and verify

```powershell
bun install
bun run verify
```

The verification checks TypeScript, builds the browser package, validates all interface bindings and required files, and runs the learning-data tests.

## Load in Chrome or Edge

1. Double-click `OPEN-LINGOBRIDGE-IN-CHROME.bat`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this exact folder:

`D:\APPS_root_new\Apps\Apps-For-Integeration\App_Rememberry - Translate and Memorize with Flashcards\dist`

LingoBridge is a supported companion, not a sixth Starter/Vercel release
target. Its product status and accountable owner are recorded in
[`docs/CANONICAL-APP-MAP.md`](../../../docs/CANONICAL-APP-MAP.md).

Browsers require this final confirmation for security; an application installer must not silently install an unpacked extension.

## Privacy

Cards, decks, progress, streak, and settings are stored in the browser's local extension storage. LingoBridge sends no learning data to its own server. Google Translate receives text only when the learner presses the explicit translation button.

## Local project bridge

On `127.0.0.1` or `localhost`, **Mit Apps teilen** writes the current cards to `lingobridge.flashcards.v1` and raises `lingobridge:flashcards-updated`. This keeps the three local apps independent while giving them a common, documented flashcard payload.
