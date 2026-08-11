# Migration and runtime verification report

Date: 2026-08-11

## Result

The authoritative English, German, Tracker, PDF Reader, and Settings applications build successfully and are running from their correct repository roots. The English and German Daily Practice mobile layout regression was fixed in the active runtime documents. The standalone PDF Reader and Settings applications now use independent fixed ports.

## Authoritative repository roots

| Product | Repository root | Runtime |
|---|---|---|
| English Automaticity | `D:\APPS_root\Apps\English\English-07082026` | `http://127.0.0.1:3201/` |
| German Automaticity | `D:\APPS_root\Apps\Deutsch-V10.08.2026` | `http://127.0.0.1:3210/` |
| Cross Repository Tracker | `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version` | `http://127.0.0.1:4312/` |
| PDF Reader component | `D:\APPS_root\Apps\Apps-For-Integeration\Reader-PDF-App` | `http://127.0.0.1:4322/` |
| Settings component | `D:\APPS_root\Apps\Apps-For-Integeration\Einstellungen-APP` | `http://127.0.0.1:4323/` |

## Files changed in this pass

- `D:\APPS_root\Apps\English\English-07082026\apps\web\public\replacements\en\daily.html`
  - Restored responsive sidebar and content sizing after a late shared CSS reset overrode the mobile variables.
- `D:\APPS_root\Apps\Deutsch-V10.08.2026\apps\web\public\replacements\de\heute.html`
  - Applied the equivalent German responsive correction.
- `D:\APPS_root\Apps\Apps-For-Integeration\Reader-PDF-App\package.json`
  - Assigned the standalone PDF Reader to port 4322.
- `D:\APPS_root\Apps\Apps-For-Integeration\Einstellungen-APP\package.json`
  - Assigned the standalone Settings app to port 4323.
- `D:\APPS_root\MIGRATION-AUDIT-ROADMAP-2026-08-11.md`
  - Recorded authoritative roots, active route mapping, risks, sequence, and acceptance criteria.

No source file was permanently deleted or moved in this pass. No candidate was moved merely because its name contained `err`, `delete`, `backup`, or `recovery`; these names can belong to active source and generated dependencies. Moving requires proof that the file is not imported, routed, packaged, or needed for recovery.

## Build and test evidence

The following commands completed successfully from the corresponding repository roots:

| Product | Successful commands |
|---|---|
| English | `bun run typecheck`, `bun run build`, `bun run test` |
| German | `bun run typecheck`, `bun run build`, `bun run test` |
| Tracker | `bun run typecheck`, `bun run build:all`, `bun run test` |
| PDF Reader | `bun run typecheck`, `bun run build`, `bun run test` |
| Settings | `bun run typecheck`, `bun run build`, `bun run test` |

German emitted a non-blocking Turbopack warning about broad file tracing in `apps/web/src/app/api/materials/[file]/route.ts`; the production build still passed.

## Live health verification

All checks returned HTTP 200:

| Service | Verified URL |
|---|---|
| English Web | `http://127.0.0.1:3201/` |
| English API | `http://127.0.0.1:4201/api/health` |
| German Web | `http://127.0.0.1:3210/` |
| German API | `http://127.0.0.1:4210/api/v1/health` |
| Tracker Web | `http://127.0.0.1:4312/` |
| Tracker API | `http://127.0.0.1:4313/v1/health` |
| PDF Reader | `http://127.0.0.1:4322/` |
| Settings | `http://127.0.0.1:4323/` |

## Browser verification

- English Daily Practice: verified at 1440 x 900 and 390 x 844. The page stacks on mobile without horizontal page overflow.
- German Daily Practice: verified at 390 x 844. The active page is German and stacks correctly.
- Tracker PDF Reader: verified at 390 x 844. The document fits the viewport; the dense toolbar remains horizontally scrollable rather than clipping controls.
- Standalone PDF Reader: verified at mobile width with the same responsive behavior.
- Settings: verified without horizontal page overflow at the browser's effective compact width.
- No console error was observed on the checked English, German, Tracker PDF, or standalone PDF pages.

## Runtime commands

Run each command from its repository root:

```text
English: bun run start
German:  bun run start
Tracker web: bun run start
Tracker API: bun run start:api
PDF Reader: bun run start
Settings: bun run start
```

## Remaining limitations (not hidden)

1. Settings can show an HTTP 401 for a protected provider-status request until the relevant credentials or signed local session exists. The page itself remains operational and should display the provider as disconnected, not connected.
2. Physical microphone/speaker behavior and live Google/OpenAI/translation OAuth require user permission and valid secrets; build and HTTP health checks cannot certify those external flows.
3. Exact historical legacy parity cannot be certified because a single canonical legacy source is not available. The current route map is documented in the roadmap.
4. Neon was not added. Existing local persistence remains authoritative because a remote database requirement has not been established and adding one would expand data/security scope.
5. Completion must not be presented as mastery without delayed independent recall. This remains an educational acceptance rule across both language apps.

## Acceptance checklist

- [x] Authoritative roots identified.
- [x] Active apps launched from those roots.
- [x] Web and API health endpoints verified.
- [x] Production builds and available tests passed.
- [x] English and German Daily Practice responsive regression repaired.
- [x] Tracker and standalone PDF compact layouts checked.
- [x] Standalone PDF and Settings ports separated.
- [x] No source file permanently deleted.
- [ ] Live provider credentials and OAuth tested with user-granted access.
- [ ] Physical microphone, playback, and speech recognition manually accepted and tested.
- [ ] Canonical legacy parity certified after the missing authoritative legacy source is supplied.

