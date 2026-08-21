#!/bin/bash
# Prepares a WSL-native copy of this app's web build so `wrangler dev`
# (workerd) can run inside WSL instead of natively on Windows.
#
# Why: on this machine, `wrangler dev` crashes natively on Windows with a
# native std::terminate() inside workerd.exe, reproducibly, using the exact
# command this app's own "start" script runs. It does not happen under
# WSL2/Linux with the same source. See
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for the full
# investigation (written for the monorepo's dev launcher; the same fix is
# applied here to this app's own standalone installer so a real end user
# hitting STARTEN-WINDOWS.bat doesn't hit the crash).
#
# Only node_modules needs a real install here (for workerd's Linux-native
# binary) -- dist/server and apps/api/dist are plain built JS, already
# produced by the Windows-side build, and are just synced over as-is.
#
# Usage: prepare-wsl.sh <windows_install_root_as_wsl_path> [--migrate-legacy]
set -euo pipefail

WIN_ROOT="$1"
APP_KEY="$(printf '%s' "$WIN_ROOT" | sha256sum | cut -c1-12)"
WSL_APP_DIR="$HOME/apps/cross-repository-code-intelligence-$APP_KEY"
LEGACY_APP_DIR="$HOME/apps/cross-repository-code-intelligence-installed"
mkdir -p "$WSL_APP_DIR"

# The production install used one fixed WSL directory before 0.5.6. Migrate
# that state only for the real installation, never for lifecycle test roots.
if [ "${2:-}" = "--migrate-legacy" ] && [ ! -d "$WSL_APP_DIR/.wrangler" ] && [ -d "$LEGACY_APP_DIR/.wrangler" ]; then
  cp -a "$LEGACY_APP_DIR/.wrangler" "$WSL_APP_DIR/.wrangler"
fi

rsync -a --delete \
  --exclude node_modules --exclude .git --exclude .next --exclude .wrangler \
  --exclude .npm-cache --exclude '.wsl-logs' --exclude 'runtime-*.log' --exclude .runtime \
  "$WIN_ROOT"/ "$WSL_APP_DIR"/

export PATH="$HOME/.bun/bin:$PATH"
cd "$WSL_APP_DIR"

if [ ! -x node_modules/.bin/wrangler ]; then
  install_ok=false
  for attempt in 1 2; do
    if bun install; then
      install_ok=true
      break
    fi
    sleep 2
  done
  if [ "$install_ok" != "true" ]; then
    echo "WSL dependency installation failed after two attempts." >&2
    exit 1
  fi
fi

echo "OK: WSL copy prepared at $WSL_APP_DIR"
