#!/bin/bash
# Tracker's API is plain NestJS/Fastify, not wrangler/workerd -- it likely
# doesn't have the socket-visibility problem the relay works around, but it
# runs through the same relay pattern anyway for consistency with the
# other three services and because the portproxy setup already covers this
# port uniformly.
exec /mnt/d/APPS_root/Apps/Starter-App/wsl/launch-via-relay.sh \
  "/root/apps/tracker/apps/api" "15313" "4313" \
  "API_PORT=15313 bun run start"
