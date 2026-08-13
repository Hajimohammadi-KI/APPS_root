#!/bin/bash
# Thin wrapper so Starter-App's server.mjs only ever has to invoke a plain
# `wsl.exe -d Ubuntu -u root -- bash <this file>` with no further
# arguments -- avoids stacking cmd.exe / wsl.exe / bash quoting layers for
# a command string that itself needs `&&` and spaces. See
# launch-via-relay.sh for what this actually does.
exec /mnt/d/APPS_root/Apps/Starter-App/wsl/launch-via-relay.sh \
  "/root/apps/tracker" "15312" "4312" \
  "node scripts/fix-wrangler-config.mjs && node_modules/.bin/wrangler dev dist/server/index.js --config dist/server/wrangler.json --persist-to .wrangler/state --port 15312 --ip 127.0.0.1 --log-level warn"
