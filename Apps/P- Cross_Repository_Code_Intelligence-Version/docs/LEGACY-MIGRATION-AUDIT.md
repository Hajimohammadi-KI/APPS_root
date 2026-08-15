# Legacy migration audit

Date: 2026-08-07

## Current repository truth

Version2 is the only authoritative application. It contains:

- React 19 with Next.js 16 App Router; standard Next/Vercel and local Vinext builds.
- Bun workspace and Bun 1.3.14 lockfile.
- TypeScript 7.0.2 checks for the web app and NestJS 11 API source.
- NestJS/Fastify API at `http://127.0.0.1:4313/v1`; web UI at
  `http://127.0.0.1:4312`.
- Local persistence with optional Neon connectivity.
- The 25-week plan, tracker, notes, uploads, focus sessions, PDF reader,
  annotations, reading position, analysis results, Settings, backup/import,
  PWA assets, Exposé PDF, local launchers, and Windows setup tooling.

## Exact legacy-parity blocker

The canonical legacy source is still missing:

```text
StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html
```

A workspace-wide search, including `Apps/deleted`, found no verified copy.
Consequently, Version2 is a tested product migration, but exact source-to-source
parity for every old string, style, asset, event, and storage key cannot be
claimed.

Run the gate with:

```powershell
bun run audit:legacy
```

It must keep failing clearly until the canonical HTML and all referenced assets
are supplied. `LEGACY_SOURCE_PATH` may point to a verified copy when available.

## Verified runtime status

- `bun run lint`: passed.
- `bun run typecheck`: passed with TypeScript 7.
- `bun run test`: passed (30 Node contract tests and 15 Bun unit tests).
- Local Vinext frontend, standard Next/Vercel frontend, and NestJS API builds:
  passed.
- Automated desktop and 390 px mobile browser checks cover `/`, `/settings`,
  `/pdf-reader`, responsive overflow, console/network errors, local persistence,
  and PDF integration-editor contrast.
- The official Windows Update completed and preserved the exact `.env.local`
  and `.wrangler` file fingerprints while rebuilding and restarting both
  services.
- Vercel production verification passed; the final deployment error scan was
  clean after preventing the device-only Exposé fallback from loading the
  Cloudflare runtime.
- The central Google connection is live for
  `fatemeh.hajimohammadi.DE@gmail.com`; Drive, Calendar, and Gmail require reauthorization after the account change
  real API checks.

## Remaining migration order

1. Acquire and hash the canonical legacy HTML and every local asset it loads.
2. Extract its data, routes, styles, storage keys, and behavior into fixtures.
3. Add fixture-driven parity tests without weakening current regression tests.
4. Add Neon migrations and a tested local-backup importer only when cloud sync
   is explicitly brought into scope.
5. Repeat fresh-install testing on a separate clean Windows account before a
   broadly distributed installer release. The in-place Update path is verified.

Legacy parity is complete only when the canonical fixture suite passes. The
current app remains usable and releasable without falsely marking that gate as
complete.
