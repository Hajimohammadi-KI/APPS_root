#!/bin/bash
# Runs this app's web (wrangler dev / workerd) inside WSL and relays it to
# the port Windows/STARTEN-WINDOWS.bat actually targets (4312). See
# tcp-relay.mjs and docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for why
# this indirection exists: workerd's own listening socket is not reachable
# from Windows on this machine, but a plain relay socket in front of it is.
#
# Assumes prepare-wsl.sh has already synced the built app and installed
# node_modules into $WSL_APP_DIR (done once per install/update/repair by
# setup-windows.ps1).
set -euo pipefail

WIN_ROOT="${1:?windows install root in WSL notation is required}"
APP_KEY="$(printf '%s' "$WIN_ROOT" | sha256sum | cut -c1-12)"
WSL_APP_DIR="$HOME/apps/cross-repository-code-intelligence-$APP_KEY"
INTERNAL_PORT=15412
PUBLIC_PORT=4312
LOG_DIR="$WSL_APP_DIR/.wsl-logs"
mkdir -p "$LOG_DIR"

# Clear anything already bound to either port before (re)starting -- the
# single most common failure mode when retrying a previous failed start.
fuser -k "${INTERNAL_PORT}/tcp" 2>/dev/null || true
fuser -k "${PUBLIC_PORT}/tcp" 2>/dev/null || true
sleep 1

export PATH="$HOME/.bun/bin:$PATH"
cd "$WSL_APP_DIR"

if [ ! -x node_modules/.bin/wrangler ]; then
  echo "[run-web] node_modules missing or incomplete -- run SETUP-WINDOWS.bat (Reparieren) first." >> "$LOG_DIR/web.log"
  exit 1
fi

node scripts/fix-wrangler-config.mjs >> "$LOG_DIR/web.log" 2>&1

./node_modules/.bin/wrangler dev dist/server/index.js --config dist/server/wrangler.json \
  --persist-to .wrangler/state --port "$INTERNAL_PORT" --ip 127.0.0.1 --log-level warn \
  >> "$LOG_DIR/web.log" 2>&1 &
BACKEND_PID=$!

# Wait for the backend to actually be listening before starting the relay,
# rather than a fixed sleep -- up to 30s, checked every 500ms.
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${INTERNAL_PORT}/"; then
    break
  fi
  sleep 0.5
done

node scripts/wsl/tcp-relay.mjs "$PUBLIC_PORT" "$INTERNAL_PORT" >> "$LOG_DIR/relay.log" 2>&1 &
RELAY_PID=$!

# Keep this script alive as long as either process is running, so the
# wsl.exe invocation from Windows (start-local-app.ps1) has a live process
# to stay attached to and can detect when the service goes down.
wait -n "$BACKEND_PID" "$RELAY_PID"
