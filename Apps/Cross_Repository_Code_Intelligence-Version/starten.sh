#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$project_dir"

if [ ! -d node_modules ]; then
  echo "Bitte zuerst ./installieren.sh ausführen." >&2
  exit 1
fi

node scripts/generate-local-env.mjs
(
  sleep 4
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://127.0.0.1:4312
  elif command -v open >/dev/null 2>&1; then
    open http://127.0.0.1:4312
  fi
) >/dev/null 2>&1 &
exec ./node_modules/.bin/bun run dev:all
