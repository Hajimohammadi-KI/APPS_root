# Release readiness

How a language app change reaches its canonical URL. The two production URLs
never change: https://english-grammar-automaticity-pwa.vercel.app/ and
https://deutschflow-grammar.vercel.app/.

## 1. Verify locally

Inside the app folder:

```powershell
# English
bun run check
bun run build

# German
bun run verify
```

## 2. Stamp the release

Pick a release id `YYYY.MM.DD.N` and set it in each app's
`apps/web/public/web-release.json`, `apps/web/public/release-manifest.json`
(`webRelease`, `publishedAt`, `changes`), and the `CACHE` constant in
`apps/web/public/sw.js`. Set the same id as `release` in
`docs/language-apps-roadmap.json`, then regenerate the roadmap pages:

```powershell
bun scripts/language-apps-roadmap.mjs
```

## 3. Deploy

The Vercel projects build a root directory inside this repository, so deploy
from the repository root with the project chosen through the environment
(`.vercelignore` keeps the upload to the two app folders):

```powershell
$env:VERCEL_ORG_ID = "team_otdThuqNbScnhrkeeLKWmoAq"
$env:VERCEL_PROJECT_ID = "prj_aZq86djXxrAiJIBxYgkuuB8QfpFu"   # english-grammar-automaticity-pwa
bun x vercel deploy --prod --yes
$env:VERCEL_PROJECT_ID = "prj_HSS6qoLFIE52MzTl06B105rdKTXK"   # deutschflow-grammar
bun x vercel deploy --prod --yes
```

## 4. Confirm the release marker on the canonical URL

```powershell
bun scripts/release-readiness.mjs --only=english --skip-build --skip-local
bun scripts/release-readiness.mjs --only=german --skip-build --skip-local
```

and check that `<canonical URL>/web-release.json` returns the new release id.
Only then set the roadmap item to `published` and record the confirmation in
the roadmap history. If deployment access is unavailable, finish the local
work, keep the item at `tested`, and record the exact outstanding step.
