# APPS_root Starter

Double-click `START-APPS.cmd` in the repository root.

The Starter uses the existing Bun/Node runtimes and existing production builds. It does not install or package the applications. It starts only services that are not already listening and opens the current runtime URL. A listening port is not treated as readiness: the PDF Reader must return its exact JSON health contract from `/api/health`.

The Starter itself listens on 4300. For isolated testing, `STARTER_PORT` and
`PDF_READER_PORT` can override 4300 and 4332 without changing the production
defaults.

Included applications:

- English Automaticity: web 3202, API 4201
- Deutsch Automaticity: web 3210, API 4210
- Cross Repository Tracker: web 4312, API 4313
- Settings: 4323
- PDF Reader: 4332

The PDF Reader is loopback-only by default. To authorize access from a tablet on the same private Wi-Fi, set `PDF_READER_ALLOW_LAN=1` before starting the Starter, then open `http://<this-PC-private-IP>:4332` on the tablet. Local PDFs imported by the Windows desktop handoff remain loopback-only even in LAN mode; a tablet can select its own local PDF in its browser.

```powershell
$env:PDF_READER_ALLOW_LAN = '1'
.\START-APPS.cmd
```

Runtime logs are written to `Apps/Starter-App/logs`.
