# Canonical route ownership

This matrix records which implementation owns each compatibility-sensitive
German route. It prevents tests from drifting back to retired screens while
keeping redirects and replacement pages explicit.

| Route            | Canonical UI                            | Runtime contract                                                                                                                                                                     |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/heute`         | `public/replacements/de/heute.html`     | Next.js `beforeFiles` rewrite; the daily 15/30/45-minute mission is the supported screen.                                                                                            |
| `/grammatik`     | `public/replacements/de/grammatik.html` | Next.js `beforeFiles` rewrite; all 144 CEFR units and the searchable A1-C2 catalog remain available.                                                                                 |
| `/studio`        | React App Router page                   | The shared `AppShell` owns navigation and route controls. The embedded studio prototype keeps its page heading, while its duplicate sidebar and status/install controls stay hidden. |
| `/einstellungen` | React App Router page                   | Learner settings, installation guidance, evidence export, and local persistence remain canonical.                                                                                    |
| `/klassik`       | Redirect to `/`                         | The retired iframe screen must not return.                                                                                                                                           |

## Verification

- `apps/web/e2e/application.spec.ts` checks every route for a successful
  response, validates the replacement inventories, confirms the retired route
  redirects, and exercises the Studio minimum-word gate with a real click.
- The Studio test also asserts that its duplicate prototype sidebar and header
  actions are hidden, so they cannot obscure practice controls or confuse
  learners.
- `.github/workflows/deutsch-automaticity-ci.yml` runs the complete non-opt-in
  Chromium suite whenever German runtime files change. PWA and visual snapshot
  checks remain explicit opt-in jobs because they require a production build or
  approved baseline updates.
