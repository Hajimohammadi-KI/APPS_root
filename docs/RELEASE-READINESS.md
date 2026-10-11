# Release readiness

How a language app change reaches its canonical URL. The two production URLs
never change: https://english-grammar-automaticity-pwa.vercel.app/ and
https://deutschflow-grammar.vercel.app/.

## 1. Stamp the release and finalize the roadmap

Pick a release id `YYYY.MM.DD.N` and set it in each app's
`apps/web/public/web-release.json`, `apps/web/public/release-manifest.json`
(`webRelease`, `publishedAt`, `changes`), and the `CACHE` constant in
`apps/web/public/sw.js`. Set the same id as `release` in
`docs/language-apps-roadmap.json`. Finish its status, evidence, publication
notes, and history for this deployment before generating or building. Keep
new changes at `tested` until the canonical release marker is confirmed;
previously verified changes can retain `published`. Then regenerate all
three roadmap pages and the Markdown copy:

```powershell
bun scripts/language-apps-roadmap.mjs
bun scripts/language-apps-roadmap.mjs --check
```

`--check` compares all four outputs byte for byte with the JSON and never
writes files. It fails with the stale or missing paths and the regeneration
command. Each app's build runs `--check --app=en` or `--check --app=de`, which
checks only that app's public roadmap page. App selection is available only
for checks; generation always updates every output.

## 2. Verify locally

Inside the app folder:

```powershell
# English
bun run check
bun run build

# German
bun run verify
```

Run `bun test scripts/language-apps-roadmap.test.mjs` from the repository root
when changing the generator, build guard, or upload rules. Any subsequent
roadmap JSON change requires regeneration and another check before deployment.

## 3. Deploy

The Vercel projects build a root directory inside this repository, so deploy
from the repository root with the project chosen through the environment
(`.vercelignore` includes the two app folders plus only
`docs/language-apps-roadmap.json` and `scripts/language-apps-roadmap.mjs` from
the root docs and scripts folders so remote builds can run the guard):

```powershell
$env:VERCEL_ORG_ID = "team_otdThuqNbScnhrkeeLKWmoAq"
$env:VERCEL_PROJECT_ID = "prj_aZq86djXxrAiJIBxYgkuuB8QfpFu"   # english-grammar-automaticity-pwa
bun x vercel deploy --prod --yes
$env:VERCEL_PROJECT_ID = "prj_HSS6qoLFIE52MzTl06B105rdKTXK"   # deutschflow-grammar
bun x vercel deploy --prod --yes
```

Keep `outputFileTracingRoot` in each app's Next config as it is: the app
folder locally, five levels up (the container root) when `VERCEL` is set. The
Vercel Next builder fails its page-data and output-tracing steps with a
narrower root (seen on 2026-10-08).

## 4. Confirm the release marker and hosted roadmap on the canonical URLs

```powershell
bun scripts/release-readiness.mjs --only=english --skip-build --skip-local
bun scripts/release-readiness.mjs --only=german --skip-build --skip-local
```

Check that `<canonical URL>/web-release.json` returns the new release id, then
fetch `<canonical URL>/roadmap.html` with a cache-busting query and compare it
with that app's local `apps/web/public/roadmap.html`. Check both canonical
domains when shared roadmap content changes. A successful build or Vercel
alias alone does not establish publication.

Only after confirming the release marker set the roadmap item to `published`
and record the confirmation in its history. Finalize these notes together,
regenerate and check all outputs, and redeploy both projects to publish the
updated roadmap. Verify both markers and hosted roadmap pages again. Do not
append another history line after this final regeneration unless it will be
included in another deployment; that causes the hosted copy to lag again.

If deployment access is unavailable, finish the local work, keep the item at
`tested`, and record the exact outstanding publication and verification steps.
