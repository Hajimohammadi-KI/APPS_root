#!/bin/bash
# Starts one app's backend on an internal-only port inside WSL, then puts
# tcp-relay.mjs in front of it on the public port Windows/Starter-App
# actually targets. See tcp-relay.mjs for why this indirection exists.
#
# Usage: launch-via-relay.sh <app_dir> <internal_port> <public_port> <backend_command>
#
# app_dir is a WSL-native path (e.g. ~/apps/tracker), NOT the /mnt/d
# Windows-mounted source -- running `bun install` against a Windows-mounted
# directory resolves platform-specific optional dependencies (like
# workerd) inconsistently, since Windows and WSL need different native
# binaries for the same package. See
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for the full story and
# for how to resync an app_dir's source after a code change.
#
# backend_command is a single shell command string (may use &&, quoting,
# etc. -- it's run via `bash -c`, not exec'd as an argv array), since e.g.
# Tracker's start script chains a config-fix step before wrangler.
set -euo pipefail

APP_DIR="$1"
INTERNAL_PORT="$2"
PUBLIC_PORT="$3"
BACKEND_COMMAND="$4"

RELAY_SCRIPT="/mnt/d/APPS_root/Apps/Starter-App/wsl/tcp-relay.mjs"
LOG_DIR="/var/log/starter-app"
mkdir -p "$LOG_DIR"

APP_LOG="$LOG_DIR/$(basename "$APP_DIR")-backend.log"
RELAY_LOG="$LOG_DIR/$(basename "$APP_DIR")-relay.log"

# Clear anything already bound to either port before (re)starting -- a
# stale process from a previous launch is the single most common failure
# mode found during tonight's investigation.
fuser -k "${INTERNAL_PORT}/tcp" 2>/dev/null || true
fuser -k "${PUBLIC_PORT}/tcp" 2>/dev/null || true
sleep 1

export PATH="$HOME/.bun/bin:$PATH"
cd "$APP_DIR"

echo "[launch] starting backend on internal port $INTERNAL_PORT: $BACKEND_COMMAND" >> "$APP_LOG"
bash -c "$BACKEND_COMMAND" >> "$APP_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for the backend to actually be listening before starting the relay,
# rather than a fixed sleep -- up to 30s, checked every 500ms.
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${INTERNAL_PORT}/"; then
    break
  fi
  sleep 0.5
done

echo "[launch] starting relay: 0.0.0.0:$PUBLIC_PORT -> 127.0.0.1:$INTERNAL_PORT" >> "$RELAY_LOG"
node "$RELAY_SCRIPT" "$PUBLIC_PORT" "$INTERNAL_PORT" >> "$RELAY_LOG" 2>&1 &
RELAY_PID=$!

echo "backend_pid=$BACKEND_PID relay_pid=$RELAY_PID"

# Keep this script itself alive as long as either process is running, so
# whatever launched it (wsl.exe from Windows) has a live process to stay
# attached to -- a background process whose parent wsl.exe invocation has
# already exited does not reliably survive on this machine.
wait -n "$BACKEND_PID" "$RELAY_PID"
