# Einstellungen — CURRENT

Standalone central settings app for the tracker, English app, German app, and PDF reader.

## Included

- Accessible purple theme with strong contrast and responsive accordion sections
- Reading ruler switch available on every page; transparent guide with violet borders
- Font size, line spacing, reduced motion, focus mode, breaks, and timing preferences
- Project title, start date, plan length, working days, pause/resume, and source management
- Local-device mode or persistent D1-backed settings
- Backup export/import
- One-click Google Calendar and Drive authorization through Google OAuth
- OpenAI and DeepL provider configuration and connection tests
- Platform/API status without permanent mock data

Google passwords are entered only on Google's own sign-in page. This app never asks for or stores a Google password.

## Run

```powershell
bun install
bun run dev -- --host 127.0.0.1 --port 4323
```

Production:

```powershell
bun run build
bun run start -- --port 4325
```

## Verify

```powershell
bun run typecheck
bun run lint
bun run test
```

## Google administrator setup

Copy `.env.example` to `.env.local` and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the exact standalone callback URL. Add that same callback URL to the OAuth client in Google Cloud. After this one-time administrator setup, the user connects Calendar and Drive with one button.

Never commit `.env.local` or provider secrets.

## Storage

- `NEXT_PUBLIC_STORAGE_MODE=device`: settings stay on this device.
- D1 mode: settings and encrypted provider data use the configured database.
- Export a JSON backup before reinstalling or moving to another computer.

## Boundaries

This app centralizes reusable settings. It does not contain language curriculum or PDF rendering code.
