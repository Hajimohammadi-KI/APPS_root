# Cross-repository code intelligence study plan

The legacy V6.3.1 single-file study plan is now a complete local web application:

- Next.js 16 + React 19 + shadcn/ui frontend
- NestJS 11 persistence API
- Bun 1.3 for installation, scripts, tests, and runtime
- TypeScript 7.0.2 for both applications
- Neon Postgres when `DATABASE_URL` is configured; atomic local-file persistence otherwise
- All 40 legacy paper PDFs and the original project documents served locally
- English–Persian and German–Persian vocabulary tables
- Daily text plus image, Word, audio, video, and PDF evidence files
- Multiple university courses with 14–16 weekly lessons and exam preparation
- Per-course Google Drive folders with automatic weekly material assignment
- Google Calendar consent, manual sync, and automatic updates
- Installable PWA shell for Windows, Android, and iOS with offline startup

The original [HTML application](StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html) remains untouched as the migration source of truth. Its storage key, `crci-studyplan-v610-full`, is preserved so existing browser progress can be read by the new frontend.

## Start

Double-click `start-studyplan.bat`, or run:

```powershell
bun install
bun run dev
```

Open:

- Frontend: <http://127.0.0.1:3100>
- API health: <http://127.0.0.1:4100/api/health>

The PowerShell launcher builds both production applications, launches them, verifies both health endpoints, and opens the frontend.

## Install as an app

Use the **Installieren** button in the application header or the **Als App installieren** card in the accordion menu.

- **Windows:** Start the local application, open it in Microsoft Edge or Chrome, and select **App installieren**. The localhost origin is valid for PWA installation.
- **Android:** Open the deployed HTTPS address in Chrome, choose **App installieren**, and add it to the Home screen.
- **iPhone/iPad:** Export an existing JSON backup first, open the deployed HTTPS address, select **Share**, then **Add to Home Screen**. iOS does not expose the automatic install prompt used by Chromium, and the installed web app can use a separate storage context.

The local Windows build is installable immediately. Android and iOS require this same application to be hosted at an HTTPS address reachable from the device. The manifest, maskable icons, Apple touch icon, standalone mode, and service worker are already included.

## One-click Windows setup

For a non-technical Windows user, send only:

```text
release/windows/Study-Tracker-Setup-7.5.5.exe
```

The German-language setup installs per user without administrator rights or Bun. Its first page offers **Erstinstallation**, **Aktualisieren**, **Reparieren**, and **Deinstallieren**. Update and repair preserve local research data and daily evidence files. Normal uninstall also preserves them unless you select the separate data-deletion option.

Build a fresh setup after an application change:

```powershell
bun run build:setup
```

The matching SHA-256 checksum is written next to the setup file.

## Connect Google Calendar

The Windows setup embeds the application OAuth configuration from the workspace
`.env` file. Open **Kalender und Kapazität**, select **Mit Google verbinden**,
and approve access on the Google consent page. Study Tracker encrypts the user
tokens in the local data directory. The JSON backup never includes them.

The Google Cloud credential should be an OAuth client of type **Desktop app**.
Each installed user still grants access to their own calendar.

You can also provide the app credentials before launch:

```powershell
$env:GOOGLE_CALENDAR_CLIENT_ID = "your_client_id_here.apps.googleusercontent.com"
$env:GOOGLE_CALENDAR_CLIENT_SECRET = "your_client_secret_here"
```

## Plan courses and import handouts

Open **Lernen → Kurse & Prüfungen** and create a course with its first
teaching week, a 14–16 week duration, and an optional exam date. Connect one
Google Drive folder to each course. The app recursively reads supported
handouts while Google Drive remains the source of truth; it stores only file
metadata, links, week assignments, and learning progress.

Folders and files containing names such as `Week 03`, `Woche 3`, `Lecture 3`,
or `هفته ۳` are assigned automatically. Everything else appears in the
**Drive-Eingang**, where the user chooses the correct week. Each week has four
learning gates: read, summarize, practice, and active review. Course weeks and
exam dates join the existing Google Calendar sync when automatic sync is
enabled.

## If the app does not start

Double-click `repair-studyplan.bat`. The repair flow:

1. Detects whether the app is already running.
2. Reports an exact process and PID when ports 3100 or 4100 are blocked.
3. Repairs Bun dependencies.
4. Runs TypeScript, lint, all parity tests, and both production builds.
5. Restarts and opens the verified application.

Your progress is offline-first. Export a JSON backup regularly from **Datensicherung**. The JSON file contains attachment metadata, but the attached files remain in the Study Tracker data directory.

## Verify

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
```

Or run the enforceable full-stack gate:

```powershell
bun run verify
```

## Persistence

Without configuration, NestJS writes atomically to `apps/api/.data/study-plan-state.json`. It stores daily files in `apps/api/.data/attachments`. Set `DATABASE_URL` to a Neon connection string to use the automatically created `study_plan_state` table. The frontend remains offline-first and mirrors every change to the original local-storage key.

See [docs/SOFTWARE_ROADMAP.md](docs/SOFTWARE_ROADMAP.md) for the architecture, parity inventory, and production roadmap.
