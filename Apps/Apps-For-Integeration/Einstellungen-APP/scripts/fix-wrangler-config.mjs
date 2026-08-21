/**
 * vinext's build writes dist/server/wrangler.json with a hardcoded
 * `"legacy_env": true` field (a default baked into the version of wrangler's
 * config-serialization code vinext bundles internally — not something this
 * app's own source controls). Newer wrangler CLIs (>=4.something) reject that
 * field outright: "The legacy_env field is no longer supported."
 *
 * This runs after `build` and before `wrangler dev`/`wrangler deploy` and
 * strips the field from the generated file, so an upgraded wrangler can
 * still read vinext's output.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const configPath = 'dist/server/wrangler.json';

if (!existsSync(configPath)) {
  // Nothing to fix yet — a build hasn't produced this file. Not this
  // script's job to fail the command; whatever runs next (wrangler) will
  // report a clearer "file not found" if that's actually the problem.
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));

if ('legacy_env' in config) {
  delete config.legacy_env;
  writeFileSync(configPath, JSON.stringify(config));
  console.log('[fix-wrangler-config] Removed unsupported "legacy_env" field from dist/server/wrangler.json.');
}
