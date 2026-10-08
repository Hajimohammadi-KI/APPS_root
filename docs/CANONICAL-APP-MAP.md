# Canonical app map

This is the authoritative list of what is active in this repository, where it
lives, and how it reaches production. Anything not listed under "Active" is
not built, tested, or deployed by any tool in this repository.

## Active products

| Product | Folder | Local ports | Vercel project | Canonical URL |
| --- | --- | --- | --- | --- |
| English Automaticity | `Apps/English/English-Automaticity` | web 3202, API 4201 | `english-grammar-automaticity-pwa` (root directory `Apps/English/English-Automaticity/apps/web`) | https://english-grammar-automaticity-pwa.vercel.app/ |
| DeutschFlow (Deutsch Automaticity) | `Apps/Deutsch/Deutsch-Automaticity` | web 3210, API 4210 | `deutschflow-grammar` (root directory `Apps/Deutsch/Deutsch-Automaticity/apps/web`) | https://deutschflow-grammar.vercel.app/ |
| Research PDF Studio | `Apps/Apps-For-Integeration/Reader-PDF-App` | 4332 | `research-pdf-studio-old` | https://research-pdf-studio.vercel.app/ |
| Settings | `Apps/Apps-For-Integeration/Einstellungen-APP` | 4323 | none (local only) | none |
| Starter | `Apps/Starter-App` | launcher | none | none |

Both language apps are self-contained: copying the app folder is enough to
install, test, build, and deploy it (see each app's README, "Self-contained
project folder"). The Vercel root directories above are paths inside this
repository, so production deployments are uploaded from the repository root
(see `docs/RELEASE-READINESS.md`); the root `.vercelignore` limits that upload
to the two app folders.

## Shared sources

`shared/learning-core`, `shared/language-home`, and `shared/language-web` are
authoring copies. They are copied into both apps by
`shared/learning-core/sync-workspaces.mjs`, `scripts/sync-language-home.ts`,
and `scripts/sync-language-web.mjs`; each script has a `--check` mode. The
apps build from their own copies and never import `shared/`.
`learning-home.css` is per app since R67 and is not synchronized.

`shared/windows-release` and the `shared/*.cjs` bridges are used by
Research PDF Studio; the language apps carry their own copies under
`distribution/windows-release`.

## Not in this repository

The Cross Repository Tracker (https://study-tracker-plan-five.vercel.app/)
lives in `D:\Bachelor-Thesis\Thesis-Study-Workspace\Study-Tracker` and is not
built or released from here.

## Staged for deletion

`delete/` holds everything that no longer has a function: dated snapshots
(`English-07082026`, `Deutsch-V10.08.2026`), the stale `learning-core` copy
that used to sit at `Apps/Deutsch-Automaticity`, the `App_*` prototypes, the
Tracker's historical documents, unused shared prototypes, one-shot scripts
from finished rounds, and local backups. `delete/README.md` lists each group
with its reason. The folder is gitignored, so its contents are already out
of the repository (Git history keeps them); empty it when the review is done.
