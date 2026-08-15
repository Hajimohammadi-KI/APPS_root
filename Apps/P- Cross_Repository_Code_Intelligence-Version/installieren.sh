#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$project_dir"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22.13.0 oder neuer ist nicht installiert oder nicht im PATH." >&2
  exit 127
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm ist nicht installiert oder nicht im PATH." >&2
  exit 127
fi

echo "Installiere Projektabhängigkeiten..."
npm install

echo "Erstelle die sichere lokale Konfiguration..."
node scripts/generate-local-env.mjs

echo "Starte Web-App und NestJS-API mit Bun ..."
(
  sleep 4
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://127.0.0.1:4312
  elif command -v open >/dev/null 2>&1; then
    open http://127.0.0.1:4312
  fi
) >/dev/null 2>&1 &
exec ./node_modules/.bin/bun run dev:all
