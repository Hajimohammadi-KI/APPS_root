#!/usr/bin/env node
// Guards against silent drift between files that are intentionally duplicated
// across independently-built/deployed apps in this monorepo (each app has its
// own package.json, wrangler config, and build pipeline, so a real shared
// package is not used for these — see the pairs below for why).
//
// Note: this lives in shared/ (not tools/) because the repo-root tools/
// directory is excluded from git via .git/info/exclude on this machine — a
// script placed there would never be committed or seen by CI. shared/ is
// already the tracked, root-level home for cross-app utilities.
//
// Usage: node shared/check-duplicated-files.mjs
// Exits non-zero and prints a diff-style report if any known pair differs.
//
// To add a new pair: append to DUPLICATE_FILE_PAIRS below with paths relative
// to the repo root (the directory this file lives in's parent).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Known file pairs that must be kept byte-identical (ignoring CRLF/LF
 * differences). Each entry: [pathA, pathB, reason].
 */
const DUPLICATE_FILE_PAIRS = [
  [
    "Apps/Apps-For-Integeration/Reader-PDF-App/lib/safe-remote-url.ts",
    "Apps/Study-Tracker/lib/safe-remote-url.ts",
    "SSRF guard for outbound remote-URL fetches; security-critical.",
  ],
  [
    "Apps/Apps-For-Integeration/Reader-PDF-App/lib/model-config.ts",
    "Apps/Apps-For-Integeration/Einstellungen-APP/lib/model-config.ts",
    "Reader must never fall back to a different model than the one shown in settings.",
  ],
];

function normalize(content) {
  return content.replace(/\r\n/g, "\n");
}

function diffLines(a, b) {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const max = Math.max(linesA.length, linesB.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    const lineA = linesA[i];
    const lineB = linesB[i];
    if (lineA !== lineB) {
      out.push(`  line ${i + 1}:`);
      out.push(`    - ${lineA ?? "<no line>"}`);
      out.push(`    + ${lineB ?? "<no line>"}`);
    }
  }
  return out.join("\n");
}

let failures = 0;

for (const [relA, relB, reason] of DUPLICATE_FILE_PAIRS) {
  const pathA = join(REPO_ROOT, relA);
  const pathB = join(REPO_ROOT, relB);

  if (!existsSync(pathA) || !existsSync(pathB)) {
    failures++;
    console.error(`[check-duplicated-files] MISSING FILE in pair:\n  ${relA}\n  ${relB}\n  (${reason})\n`);
    continue;
  }

  const contentA = normalize(readFileSync(pathA, "utf8"));
  const contentB = normalize(readFileSync(pathB, "utf8"));

  if (contentA !== contentB) {
    failures++;
    console.error(
      `[check-duplicated-files] DRIFT DETECTED between duplicated files:\n  ${relA}\n  ${relB}\n  Reason they must match: ${reason}\n${diffLines(contentA, contentB)}\n`,
    );
  }
}

if (failures > 0) {
  console.error(
    `[check-duplicated-files] ${failures} duplicated-file pair(s) have drifted. Sync them (or update shared/check-duplicated-files.mjs if the duplication is no longer intentional).`,
  );
  process.exit(1);
}

console.log(`[check-duplicated-files] OK — ${DUPLICATE_FILE_PAIRS.length} duplicated-file pair(s) match.`);
