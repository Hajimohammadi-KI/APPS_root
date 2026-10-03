# Version status

Date: 2026-08-07

| Label | Location | Runtime status |
| --- | --- | --- |
| **CURRENT** | `Apps/Cross_Repository_Code_Intelligence-Version2` | The only authoritative source and release candidate. |
| **LEGACY** | Optional historical files under `Apps/deleted` (if still present) | Reference only; never used to build or run Version2. |
| **IPAD PREVIEW** | `Apps/Cross_Repository_Code_Intelligence-Version2/ipad-preview` | Bundled static offline preview with no server or external integrations. |
| **ARCHIVE** | `Apps/deleted` (optional) | May be deleted when no longer needed for recovery; not a source of truth or runtime dependency. |

The old `Cross_Repository_Code_Intelligence`, `Cross_Repository_Code_Intelligence_new`,
and dated release folders are not current applications and do not need to be
recreated. Required tracker, Settings, PDF reader, Exposé, configuration,
migrations, and launcher assets live in Version2.

The local browser fallback key remains
`cross-repository-study-tracker:state:v2`, which prevents accidental reads from
older versions.

## Verified release state

- Local Version2 is installed at
  `%LOCALAPPDATA%\CrossRepositoryCodeIntelligence` and serves the web app on
  `4312` and the NestJS API on `4313`.
- On 2026-08-08 the installed copy was repaired from this authoritative source
  after a stale source Worker was found occupying port `4312`. Repair preserved
  local data, rebuilt dependencies and compiled artifacts, recreated shortcuts,
  closed setup and started the app automatically.
- The local post-repair release gate passes 35 Node contract tests and 18 Bun
  domain tests (53 total), TypeScript 7, lint, Vinext and NestJS builds. Desktop
  and mobile routes, PDF readability and persistence of progress, focus and
  settings all pass.
- The public deployment at
  `https://study-tracker-plan-five.vercel.app` responds correctly and
  passes layout/readability checks, but its progress-persistence check currently
  fails. It is therefore an older deployment and must be redeployed before it is
  labelled equivalent to this current local release.
- Google Drive, Calendar, and Gmail are connected and live-tested for
  `fatemeh.hajimohammadi.DE@gmail.com`. OpenAI, DeepL, and Neon remain
  optional and are not configured. No simulated connected state is used.
