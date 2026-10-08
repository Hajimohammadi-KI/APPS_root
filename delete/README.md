# delete/

Staging area for files and code that no longer have a function in this
workspace. Nothing here is built, tested, deployed, or imported by anything
outside this folder. Review, then remove the folder (Git history keeps every
tracked file).

Moved on 2026-10-08, with the reason for each group:

| Path under `delete/` | Why it is no longer needed |
| --- | --- |
| `archive/Apps/English-07082026`, `archive/Apps/Deutsch-V10.08.2026` | Dated snapshots of the two language apps; the active apps live in `Apps/English/English-Automaticity` and `Apps/Deutsch/Deutsch-Automaticity`. |
| `archive/Apps/Deutsch-Automaticity-learning-core-copy` | Stale copy of `learning-core` (41 files behind `shared/learning-core`); every tool now points at the real German app. |
| `archive/Apps/Apps-For-Integeration/App_*`, `index (Today-practice).html.html` | Deprecated prototypes already marked `ARCHIVED.md`; their features live in the active apps. |
| `archive/Apps/Tracker` | Historical Tracker documents and empty test builds; the Tracker is maintained in its own repository. |
| `Apps/Study-Tracker.zip` | Untracked zip of the Tracker from 2026-09-14; the Tracker is not part of this repository. |
| `.git.backup-20261003`, `backups/` | File backups from 2026-10-02/03 made before Git was reliable; all that work is committed. |
| `.codex-tmp/` | Local scratch (document renders, debug copies, 1.2 GB); the README already listed it as safe to clear. |
| `APPS_root/` | Empty leftover folder. |
| `shared/grammar-worksheets` | Imports `packages/content/src/grammar-worksheets` and `worksheet-seeds-a1` from the German app, which do not exist; the feature never landed. |
| `shared/conversation-flow`, `shared/device-access` | Prototype islands from 2026-09-08 with no consumer in either app, launcher, script or roadmap item; the apps have their own studio and device-access assets. |
| `scripts/finalize-*`, `correct-roadmap-completion-claims.ts` | One-shot scripts that wrote roadmap entries for rounds that are already published; running them again would rewrite the roadmap. |
| `scripts/verify-completion-roadmap.mjs`, `verify-feedback-roadmap.mjs`, `verify-l01-roadmap.mjs`, `verify-live-phase6-roadmap.mjs` | Checks for specific past roadmap rounds (R02/R03 era). `verify-language-roadmap.mjs` remains as the generic check. |
| `scripts/recover-remote-history.mjs`, `verify-installed-history-recovery.mjs`, `verify-legacy-fsrs-retirement.mjs`, `verify-legacy-continuity.mjs`, `capture-language-baseline.ts`, `quarantine-obsolete-renders.ps1` | One-shot recovery or migration checks for work that is finished and unreferenced. |
| `scripts/verify-phase3-browser.mjs`, `accessibility-navigation-contract.test.mjs`, `ui-interaction-direction.test.mjs` | Broken: they import or read `Apps/Study-Tracker`, which is not in this repository. |
| `Apps/Deutsch/Deutsch-Automaticity/{index.html,manifest.webmanifest,offline.html}` | Stale copies of the legacy PWA at the project root; the regression reference is `legacy/v20.8-static` and nothing reads the root copies. |
| `Apps/Deutsch/Deutsch-Automaticity/apply_patch_local.bat` | Helper bound to an absolute path of a Windows Store app on one machine. |
| `Apps/*/docs/RELEASE-REPORT-2026-08-07.md`, `SELF-CONTAINED-RECOVERY-AUDIT-2026-08-07.md` | Reports about repositories and `D:\APPS_root` paths that no longer exist; unreferenced. |
| `Apps/*/apps/web/public/downloads/*-Setup-v*.exe.sha256` (older versions) | Checksums of installer builds whose `.exe` files are not kept; the unversioned checksum and the newest version remain. |
