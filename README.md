# APPS_root_new

Workspace for the two language learning apps and their supporting products and
tooling. The authoritative list of active products, local ports, Vercel
projects, and what is archived is `docs/CANONICAL-APP-MAP.md`; this file is
just the map to get there.

## Layout

| Path | What it is |
| --- | --- |
| `Apps/English/English-Automaticity` | English Automaticity (active, self-contained) |
| `Apps/Deutsch/Deutsch-Automaticity` | DeutschFlow / Deutsch Automaticity (active, self-contained) |
| `Apps/Apps-For-Integeration/Reader-PDF-App` | Research PDF Studio (active, own Vercel project) |
| `Apps/Apps-For-Integeration/Einstellungen-APP` | Settings (active, local-only) |
| `Apps/Starter-App` | Local launcher that starts the products together |
| `archive/` | Dated snapshots and retired prototypes kept for reference; nothing builds or reads from here |
| `research/cefr-classification` | Standalone CEFR text-difficulty research pipeline (own venv, own tests) |
| `docs/` | Governance: canonical app map, release readiness, the Persian roadmap and its JSON source, audits |
| `scripts/` | Cross-app tooling (`release-readiness.mjs`, `language-apps-roadmap.mjs`, sync helpers) and dated verification scripts |
| `shared/` | Authoring copies synchronized into the apps by script, plus Windows release helpers used by Research PDF Studio |
| `artifacts/`, `backups/`, `tmp/` | Build and scratch output, not source |

Each language app folder is self-contained: copying it is enough to install,
test, build, and deploy it. See the "Self-contained project folder" section of
each app's README.

The Cross Repository Tracker is not in this repository; it lives in
`D:\Bachelor-Thesis\Thesis-Study-Workspace\Study-Tracker`.

## Start here

```powershell
# Opens the workspace in VS Code
.\OPEN-APPS-ROOT-IN-VSCODE.bat

# Starts the products through the launcher
.\START-APPS.cmd
```

Before shipping a change, follow `docs/RELEASE-READINESS.md`.

## Local-only scratch (gitignored, not part of the product)

`.codex-tmp/` and `.audit/` hold local working files (document drafts, ad hoc
review screenshots) that are not tracked in git and are not required by any
product build. Safe to clear by hand when no longer needed.
