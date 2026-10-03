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
bun run dev -- --host 127.0.0.1 --port 4332
```

Production:

```powershell
bun run build
bun run start:local -- --hostname 127.0.0.1 --port 4332
```

Readiness is not inferred from the listening port. The local runtime exposes an
exact contract at `http://127.0.0.1:4332/api/health`; App Starter and the
English Windows launcher require `service=research-pdf-studio`, `ready=true`,
and `contractVersion=1` before enabling the Reader.

## Verify

```powershell
bun run typecheck
bun run lint
bun run test
```

## Deep link

```text
http://127.0.0.1:4332/?sourceUrl=https%3A%2F%2Fexample.org%2Fpaper.pdf&name=Paper&page=3
```

Only HTTPS external files are accepted. Local/private network targets are blocked by the public PDF proxy.

## Storage and privacy

Reading state and annotations are stored in the browser on the current device. API keys entered in the reader stay only for the active browser tab unless server-side environment variables are configured. Export annotation JSON and the annotated PDF for a portable backup.

The English desktop handoff copies a selected PDF into its preserved user-data
folder under a SHA-256 name and opens `?localPdf=<sha256>`. The runtime accepts
only a 64-character hexadecimal identifier and serves that file only to a
loopback client; it never accepts a filesystem path from a URL. This allows the
same document, highlights, comments, and reading position to reopen after a
desktop restart without exposing the local PDF to the private network.

To authorize the interface on a same-Wi-Fi tablet, bind the runtime to
`0.0.0.0` and open `http://<PC-private-IP>:4332` on the tablet. The tablet can
select its own local PDF in the browser. Desktop-imported PDFs remain
loopback-only.

## Offline limitation

The bundled interface and PDF worker can run locally, but a first-time external PDF, Google Drive, OpenAI, or DeepL request still requires network access. Previously opened browser data is not a guaranteed full offline archive; keep the original PDF locally.
