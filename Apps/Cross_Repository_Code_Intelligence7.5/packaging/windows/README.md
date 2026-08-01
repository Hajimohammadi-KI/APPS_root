# Windows setup

Build the complete, per-user Windows installer from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\packaging\windows\build-installer.ps1
```

The distributable file is written to:

```text
release\windows\Study-Tracker-Setup-<version>.exe
```

The setup:

- installs without administrator rights;
- embeds Bun, the standalone Next.js frontend, the bundled NestJS API, and all
  legacy research content;
- embeds the shared Google OAuth application configuration without printing it
  in the build log;
- creates Desktop and Start-menu shortcuts;
- registers an uninstall entry in Windows Installed apps;
- keeps exactly one installation per Windows user and treats a repeated
  first-time install as a no-op;
- opens with install, update, repair, and uninstall choices;
- keeps local research data and evidence files during update, repair, and normal uninstall;
- can optionally remove local research data during uninstall.

Automated smoke-test switches:

```text
--silent-install
--silent-uninstall
--delete-data
```

The following environment overrides are intended for build verification:

```text
CRCI_INSTALL_ROOT
CRCI_DATA_ROOT
CRCI_NO_SHORTCUTS=1
CRCI_NO_LAUNCH=1
```
