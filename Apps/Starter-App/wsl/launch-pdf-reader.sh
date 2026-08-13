#!/bin/bash
exec /mnt/d/APPS_root/Apps/Starter-App/wsl/launch-via-relay.sh \
  "/root/apps/pdf-reader" "15322" "4322" \
  "node_modules/.bin/wrangler dev dist/server/index.js --config dist/server/wrangler.json --persist-to .wrangler/state --ip 127.0.0.1 --port 15322"
