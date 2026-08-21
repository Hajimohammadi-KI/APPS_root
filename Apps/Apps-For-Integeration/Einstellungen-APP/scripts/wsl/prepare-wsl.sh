#!/bin/bash
# Prepares a WSL-native copy of this app's web build so `wrangler dev`
# (workerd) can run inside WSL instead of natively on Windows.
#
# Why: `wrangler dev` crashes natively on Windows on this machine with a
# native std::terminate() inside workerd.exe. It does not happen under
# WSL2/Linux with the same source. See
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for the full
# investigation (originally written for the monorepo's dev launcher and
# Tracker's own installer; the same fix is applied here).
#
# Only node_modules needs a real install here (for workerd's Linux-native
# binary) -- dist/server is plain built JS, already produced by the
# Windows-side build, and is just synced over as-is.
#
# Usage: prepare-wsl.sh <windows_install_root_as_wsl_path>
set -euo pipefail

WIN_ROOT="$1"
WSL_APP_DIR="$HOME/apps/settings-installed"
mkdir -p "$WSL_APP_DIR"

rsync -a --delete \
  --exclude node_modules --exclude .git --exclude .next --exclude .wrangler \
  --exclude .sites-runtime --exclude '.wsl-logs' --exclude 'runtime-*.log' \
  "$WIN_ROOT"/ "$WSL_APP_DIR"/

export PATH="$HOME/.bun/bin:$PATH"
cd "$WSL_APP_DIR"

if [ ! -x node_modules/.bin/wrangler ]; then
  bun install
fi

echo "OK: WSL copy prepared at $WSL_APP_DIR"
