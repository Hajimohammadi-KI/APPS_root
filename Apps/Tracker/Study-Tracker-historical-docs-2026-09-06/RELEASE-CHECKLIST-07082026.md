# Cross Repository Code Intelligence — release checklist

Date: 2026-08-07  
Release target: `Cross_Repository_Code_Intelligence-Version2`

Version2 is the only authoritative tracker application. English and German
language-learning applications remain independent and are not connected.

## Version map

| Label | Status |
| --- | --- |
| `Apps/Cross_Repository_Code_Intelligence-Version2` | **CURRENT** |
| Recoverable cleanup under `D:/APPS_root/deleted` | **LEGACY** — reference only; not required |
| `Apps/Cross_Repository_Code_Intelligence-Version2/ipad-preview` | **IPAD PREVIEW** — static offline preview |
| `D:/APPS_root/deleted` | **ARCHIVE** — safe to omit from builds and runtime |

## Completed verification

- [x] Bun dependencies install and the PDF.js worker is prepared from the
  installed package.
- [x] A clean rebuild succeeds without reading any old application folder.
- [x] Concurrent builds safely share PDF-worker preparation without Windows
  `EBUSY` copy failures.
- [x] TypeScript 7 typecheck passes for web and NestJS source.
- [x] ESLint passes.
- [x] Local Vinext frontend build passes.
- [x] Standard Next.js/Vercel frontend build passes.
- [x] NestJS API build passes.
- [x] Test suite passes: 30 Node contract tests + 15 Bun unit tests = 45.
- [x] Windows Update preserves local configuration/data, rebuilds both
  artifacts, recreates shortcuts, restarts the app, and waits for both services.
- [x] Local web `/api/state` and NestJS `/v1/health` return HTTP 200 on ports
  4312 and 4313.
- [x] The Windows launcher checks both ports before reusing an already-running
  installation; a stopped API can no longer be mistaken for a healthy app.
- [x] `/`, `/settings`, and `/pdf-reader` return HTTP 200 locally and on Vercel.
- [x] Desktop 1440 px and mobile 390 px browser checks have no horizontal
  overflow, page errors, console errors, or failed network responses.
- [x] Progress, focus session, and accessibility settings persist after reload
  in the production browser check.
- [x] PDF Reader opens locally after update; the previous Vinext SSR
  `Invalid URL string` failure is fixed.
- [x] PDF integration editor uses 14 px dark text on light lavender with a
  measured contrast ratio of 14.11:1.
- [x] Tracker and Windows Setup use the accessible purple/lavender palette;
  selected controls on dark backgrounds use white text.
- [x] Shifted Version2 dates and weekday labels agree (7 August 2026 is shown
  as Friday), and the installed PWA theme uses the same purple palette.
- [x] PDF marks, reading position, analysis results, notes, progress, settings,
  focus sessions, backup/import boundaries, and timer state have regression
  coverage.
- [x] Production deployed at
  `https://study-tracker-plan-five.vercel.app`.
- [x] Production persistence passed for progress, focus session, and
  accessibility settings in an isolated browser context.
- [x] Final Vercel deployment `dpl_5RWUB6pd5EhoNQutmpehxZeuUqbb` is `READY`;
  its post-verification error scan returned no logs.
- [x] Device-only production avoids importing `cloudflare:workers`; the bundled
  Exposé fallback remains available without a Cloudflare runtime.

## External connection status

- [ ] Google OAuth must be reconnected to `fatemeh.hajimohammadi.DE@gmail.com` after the account change.
- [x] Google Drive, Google Calendar, and Gmail passed live API checks.
- [x] PDF Visual lists private Drive PDFs through the central server-side
  connection without storing a second browser token.
- [ ] OpenAI and DeepL remain optional and are not configured.
- [ ] Neon remains optional; the local D1-compatible database is active.

Local tracking, Settings, PDF reading/annotation, and backups continue to work
without optional AI, translation, or Neon services.

## Known limitation

Exact legacy parity remains unverified because
`StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html` and its referenced
assets are absent, including from the archive. `bun run audit:legacy` is kept as
an intentional release gate and must not be bypassed or marked successful.

A fresh-install test on a separate clean Windows account remains a packaging
hardening task. The existing installation's official Update path is verified.

## iPad preview limitations

`ipad-preview` is a static offline preview only. It has no NestJS server,
server-side persistence, cloud sync, Google, OpenAI, DeepL, microphone speaking
assessment, or Windows update mechanism. Use Version2 for the complete local or
web application.
