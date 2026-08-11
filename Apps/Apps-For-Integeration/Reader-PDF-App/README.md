# Research PDF Studio — CURRENT

Standalone PDF reader for research and learning workflows.

## Included

- Open a local PDF or an exact HTTPS PDF passed by `sourceUrl`/`url`
- Restore document, page, zoom, reading position, notes, questions, answers, and translations
- Select text and use the nearby context menu for highlight colors, underline, strike-through, comment, copy, translate, explain, erase, or delete
- Export original and annotated PDFs plus annotation JSON
- Transparent reading ruler with violet borders; switch available on every page
- Ruler height follows the current font/line size
- Responsive desktop and tablet layout
- Optional OpenAI and DeepL connection for the current browser session
- Maximum PDF size: 200 MB

## Run

```powershell
bun install
bun run dev -- --host 127.0.0.1 --port 4322
```

Production:

```powershell
bun run build
bun run start -- --port 4324
```

## Verify

```powershell
bun run typecheck
bun run lint
bun run test
```

## Deep link

```text
http://127.0.0.1:4324/?sourceUrl=https%3A%2F%2Fexample.org%2Fpaper.pdf&name=Paper&page=3
```

Only HTTPS external files are accepted. Local/private network targets are blocked by the public PDF proxy.

## Storage and privacy

Reading state and annotations are stored in the browser on the current device. API keys entered in the reader stay only for the active browser tab unless server-side environment variables are configured. Export annotation JSON and the annotated PDF for a portable backup.

## Offline limitation

The bundled interface and PDF worker can run locally, but a first-time external PDF, Google Drive, OpenAI, or DeepL request still requires network access. Previously opened browser data is not a guaranteed full offline archive; keep the original PDF locally.
