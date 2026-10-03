# APPS_root_new

A monorepo of five canonical products plus supporting research and tooling. See
[`docs/CANONICAL-APP-MAP.md`](docs/CANONICAL-APP-MAP.md) for the authoritative
list of active products, their local ports, and Vercel projects — this file is
just the map to get there.

## Layout

| Path | What it is |
| --- | --- |
| `Apps/English/English-Automaticity` | English Automaticity (canonical) |
| `Apps/Deutsch-Automaticity` | Deutsch Automaticity (canonical) |
| `Apps/Study-Tracker` | Cross Repository Tracker (canonical) |
| `Apps/Apps-For-Integeration/Einstellungen-APP` | Settings (canonical, local-only) |
| `Apps/Apps-For-Integeration/Reader-PDF-App` | Research PDF Studio (canonical) |
| `Apps/Apps-For-Integeration/App_*` | Deprecated duplicate prototypes — do not extend, see the archive plan in `docs/CANONICAL-APP-MAP.md` |
| `Apps/Starter-App` | Local launcher that starts the five canonical products together |
| `research/cefr-classification` | Standalone CEFR text-difficulty research pipeline (own venv, own tests) — not shipped by any product above |
| `docs/` | Governance: canonical app map, release readiness gate, product roadmap, event catalog |
| `scripts/` | Cross-app checks (`release-readiness.mjs` and its tests) |
| `shared/` | Code shared across the canonical apps |
| `artifacts/`, `tmp/` | Build/scratch output, not source |

## Start here

```powershell
# Opens the workspace in VS Code
.\OPEN-APPS-ROOT-IN-VSCODE.bat

# Starts the five canonical products through the launcher
.\START-APPS.cmd
```

Before shipping a change, run the release readiness gate — see
[`docs/RELEASE-READINESS.md`](docs/RELEASE-READINESS.md).

## Local-only scratch (gitignored, not part of the product)

`.codex-tmp/` and `.audit/` hold local working files (document drafts, ad hoc
review screenshots) that are not tracked in git and are not required by any
product build. Safe to clear by hand when no longer needed.
