# Repository verification — 2026-08-08

## Outcome

The filename-based deletion did not remove active application source or legacy catalogs. One Cross dependency was missing and was restored through the frozen Bun lockfile. The Cross installed payload was then repaired from the authoritative source after a stale source Worker was removed from port 4312.

No files were restored wholesale from the Recycle Bin.

## Verified applications

| Application | Source/build checks | Runtime and journey checks | Result |
| --- | --- | --- | --- |
| Cross Repository Code Intelligence | lint, TypeScript 7, Vinext build, Nest build, 35 contract tests, 18 Bun tests | repaired Windows install; desktop/mobile `/`, `/settings`, `/pdf-reader`; API health; progress/focus/settings persistence | PASS locally |
| English Automaticity | frozen install, lint, typecheck, API/frontend production build, legacy byte-parity, content and installer tests | 22 Playwright journeys including level choice, daily action, all legacy surfaces, backup, Nest API, speaking recording and persistence | PASS |
| DeutschFlow | frozen install, formatting, lint, typecheck, API/frontend production build, strict English/German file parity, v20.8 content inventory | 13 functional Playwright journeys; two optional development-only checks skipped | PASS |
| Einstellungen-APP | lint, typecheck, Vinext production build | settings sharing and origin-safety tests | PASS |
| Reader-PDF-App | lint, typecheck, Vinext production build | PDF marks, reading position and analysis persistence tests | PASS |

## Known limits

1. The canonical Cross legacy file `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html` is still unavailable. Recoverable snapshots are preserved under `Apps/Cross_Repository_Code_Intelligence-Version2/legacy/source-snapshots`; exact parity with a missing file is not claimed.
2. The public Cross Vercel deployment is behind the repaired local release: route and readability checks pass, but online progress persistence currently fails. Redeploy the verified source before treating Vercel as current.
3. German still contains Supabase-named migration scripts. They pass their current schema tests but remain planned migration debt before the optional Neon sync adapter is introduced.

## Clean-code boundary

- Keep only the three authoritative product roots, `Einstellungen-APP`, `Reader-PDF-App`, shared packages, sources and documented legacy snapshots.
- Treat `D:/APPS_root/deleted` as quarantine only. Nothing in it is used to build or run the current applications.
- Do not delete files merely because their names contain `delete`; dependency packages legitimately contain such files.
- Generated runtime logs may be removed after diagnosis. Never move source, lockfiles, migrations, assets, PDFs, legacy snapshots or compiled release payloads without a successful replacement build and journey test.
