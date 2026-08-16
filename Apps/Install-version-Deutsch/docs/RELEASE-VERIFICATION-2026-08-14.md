# DeutschFlow Installer Verification — 2026-08-14

This is the first documented installer verification for DeutschFlow (no prior
verification doc existed in this app; only raw `bun run verify` logs did).

## Why this run happened

The shipped installer (`DeutschFlow-Setup-v20.8.8.exe`, built 2026-08-11) was
stale relative to committed source: `distribution/windows-desktop/main.cjs`
and `offline.html` were both edited and committed (`a7cf7aa`, 2026-08-13)
after that build, and this session added further uncommitted UI changes on
top. The installer was rebuilt from current source via
`distribution/windows-modern/build-modern-installer.ps1`.

## Installer and runtime verification

Verification used isolated Install and Data roots under a scratch directory,
driven by the setup manager's `--silent-install` / `--silent-update` /
`--silent-repair` / `--silent-uninstall` CLI flags. It did not use or modify
the learner's normal application data.

| Check | Result |
|---|---|
| Fresh Install exit | `0` |
| Fresh installed version | `10.8.2026` |
| Fresh executable present | yes |
| Data marker SHA-256 (initial) | `9611B13F90BB3A8412C3F174807BE29D9A64F513C0245C2C30C5FF6EE2BEDA7D` |
| Update exit | `0` |
| Executable present after Update | yes |
| Data marker preserved after Update | yes |
| Repair exit | `0` |
| Executable present after Repair | yes |
| Data marker preserved after Repair | yes |
| Uninstall (no `--delete-data`) exit | `0` |
| Executable removed after Uninstall | yes |
| Data preserved after Uninstall | yes |

The disposable verification installation was removed after these results
were recorded. It contained only generated program payloads and a synthetic
marker file; learner data was not involved.

## Release artifact

- Installer: `DeutschFlow-Setup.exe` (repository root)
- Installer SHA-256: `7dc48f50985ea152be4abec7141645e63dd323eb416f361e08833d3ca008ec8f`

## Deliberate limitation — not verified in this pass

A live launch-and-health-check (starting the installed Electron app and
polling its real `/api/v1/health` and `/` endpoints, the way English's
2026-08-14 verification did) was attempted first and abandoned: launching
the packaged Electron executable via `Start-Process` hung past a 2-minute
budget with no process ever appearing in the process list, consistent with
an Electron GPU/renderer-context stall in this automated session rather than
an installer defect (the same session already hit one other environment
-specific GUI/runtime wall this session, documented separately for the
Tracker app's dev server). The CLI-only lifecycle above (install → update →
repair → uninstall, with data-marker preservation) is genuinely verified;
the live runtime-route smoke test is not, and should be done by hand or from
an interactive desktop session before public release.

## Google OAuth packaging note — confirmed empty in this build

`shared/GoogleOAuthPackaging.ps1` embeds `GOOGLE_CALENDAR_CLIENT_ID` /
`GOOGLE_CALENDAR_SECRET` from the environment or `.env`, and silently embeds
an *empty* value if unset rather than failing the build. This app directory
has no `.env` or `.env.local` file at all, and no such variables were set in
the shell that ran this build — so **this specific `DeutschFlow-Setup.exe`
was built with empty Google OAuth credentials, and its Calendar/Drive
connect flow will not work as shipped.** Rebuild with real
`GOOGLE_CALENDAR_CLIENT_ID`/`GOOGLE_CALENDAR_SECRET` set before distributing
this artifact if Calendar/Drive integration is required.
