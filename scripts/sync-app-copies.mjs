#!/usr/bin/env node
// Replaces the ad hoc `robocopy /MIR /XD dev cache node_modules` invocations
// that used to be typed by hand into a terminal after every change to a
// canonical app tree. Those excluded dev/cache/node_modules by name, which
// is fragile -- it silently mirrors anything else that happens to sit next
// to source (stray local scratch files, half-finished experiments). This
// script instead mirrors exactly what `git ls-files` says belongs in the
// tree: tracked files, plus untracked files that .gitignore doesn't
// exclude. That is the same rule git itself uses to decide what "source"
// means here, so it can never drift from .gitignore the way a hand-typed
// exclude list can.
//
// Usage (from the repo root, D:\APPS_root):
//   node scripts/sync-app-copies.mjs [--dry-run] [--pair=english|deutsch]

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const PAIRS = [
  {
    name: "english",
    canonical: "Apps/English/English-07082026",
    copies: [
      "Apps/Install-version English",
      "Apps/English - witout-install- version",
    ],
  },
  {
    name: "deutsch",
    canonical: "Apps/Deutsch-V10.08.2026",
    copies: [
      "Apps/Install-version-Deutsch",
      "Apps/Deutsch- witout-install- version",
    ],
  },
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pairFilter = args
  .find((arg) => arg.startsWith("--pair="))
  ?.split("=")[1];

function trackedFiles(dir) {
  const out = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", dir],
    { cwd: ROOT, encoding: "utf8" },
  );
  return new Set(out.split("\n").filter(Boolean).map((p) => p.replace(/\\/g, "/")));
}

function syncPair({ name, canonical, copies }) {
  const canonicalFiles = trackedFiles(canonical);
  for (const copy of copies) {
    let written = 0;
    let removed = 0;
    let skippedMissing = 0;
    const copyFilesBefore = trackedFiles(copy);
    const wantedInCopy = new Set();

    for (const file of canonicalFiles) {
      const rel = relative(canonical, file);
      const destRel = join(copy, rel).replace(/\\/g, "/");
      wantedInCopy.add(destRel);
      const src = join(ROOT, file);
      if (!existsSync(src) || !statSync(src).isFile()) {
        // Tracked-but-deleted-in-working-tree (not yet committed) -- there
        // is nothing to copy; treat the destination the same as if the
        // source were absent so the mirror still converges.
        skippedMissing += 1;
        continue;
      }
      const dest = join(ROOT, destRel);
      if (dryRun) {
        written += 1;
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      written += 1;
    }

    // True mirror semantics: a file this script previously placed in the
    // copy but that no longer exists (or is no longer tracked) in
    // canonical must be removed, or the copy silently accumulates stale
    // files forever.
    for (const file of copyFilesBefore) {
      if (wantedInCopy.has(file)) continue;
      removed += 1;
      if (dryRun) continue;
      rmSync(join(ROOT, file), { force: true });
    }

    console.log(
      `[${name}] ${canonical} -> ${copy}: ${written} file(s) synced, ${removed} removed${
        skippedMissing ? `, ${skippedMissing} skipped (deleted, uncommitted)` : ""
      }${dryRun ? " (dry run)" : ""}`,
    );
  }
}

for (const pair of PAIRS) {
  if (pairFilter && pair.name !== pairFilter) continue;
  syncPair(pair);
}
