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

## 5. Learner comments (optional service)

Comments on a checked answer are stored as issues in one private GitHub
repository. Without the variables below both apps show "not switched on yet"
and send nothing. Set them in both Vercel projects (Production), then redeploy:

- `LEARNER_FEEDBACK_GITHUB_REPO`: `<owner>/<repository>` of the private repository.
- `LEARNER_FEEDBACK_GITHUB_TOKEN`: a fine-grained token limited to that
  repository with Issues read/write. The learner's text is kept only in issue
  comments, because GitHub deletes comments completely but keeps the edit
  history of issue bodies. A withdrawal deletes those comments and closes the
  text-free issue (with admin rights it deletes the whole issue).
- `LEARNER_FEEDBACK_REVIEW_KEY`: a random string of at least 24 characters for
  the review page `<canonical URL>/learning-core/feedback-review.html`.

Check `<canonical URL>/api/learner-feedback` returns `{"available":true}`.
The comment section stays hidden in the app until then. The routes refuse
requests from other sites, repeats, and more than 60 comments per hour per
server instance; for stronger protection against bots, enable the Vercel
firewall or bot protection for `/api/learner-feedback` on both projects.
Decisions on the review page change nothing until they are imported and
released:

```powershell
$env:LEARNER_FEEDBACK_GITHUB_TOKEN = "<token>"
$env:LEARNER_FEEDBACK_GITHUB_REPO = "<owner>/<repository>"
bun scripts/import-learner-decisions.ts
bun scripts/build-automaticity-curriculum.ts
```

The import writes `shared/learning-core/content/learner-decisions-{en,de}.json`
(accepted answers and reviewed wrong forms only) and lists "fix the exercise"
requests for authoring. The build adds a new version of each affected exercise
and keeps the old one for saved work; a decision whose exercise text changed
since the comment is reported and not applied. Then follow sections 1–4.

## 6. Independent content review

A reviewer opens `<canonical URL>/learning-core/content-review.html` (English
or German app), enters a name and role, and checks each unit and exercise.
Drafts stay in the reviewer's browser. "Download approved reviews" gives the
file the import takes; "Download findings" lists what is wrong for authoring.
Nothing changes in the app until the owner imports and releases:

```powershell
bun scripts/import-curriculum-review.ts <approved-reviews.json>
```

The import stages validated output under `artifacts/curriculum-review-import/`
and refuses an incomplete review, a changed unit or a non-human reviewer ID.
Findings become a reviewed content change (a new task version), then sections
1–4. `node scripts/verify-content-review-browser.mjs` checks the page.

## 7. Windows desktop update channel

The desktop apps read `Apps/<app>/releases/<name>-update.json` from the
`main` branch of `Hajimohammadi-KI/APPS_root` and download the package from
that repository's GitHub releases. Until a manifest is committed, the update
check reports that no update is published. To publish one (owner, with GitHub
release rights):

1. In the app folder run `bun run package:windows-exe` after the installer
   lifecycle check (`scripts/verify-language-installer-cycle.ps1`) passes.
2. Create the release `<slug>-v<version>` (`english-grammar` or `deutschflow`)
   and attach `releases/<ProductId>-<version>-Windows.zip`.
3. Commit `Apps/<app>/releases/<name>-update.json`; the zip stays out of git.
