// Mirrors the canonical learning-core package into both language apps
// (roadmap R93). Each app builds and deploys from its own folder, so the
// package is copied rather than linked; this script is the only writer of
// those copies and `--check` proves they still match.
//
// Usage (from anywhere):
//   node shared/learning-core/sync-workspaces.mjs          copy source -> apps
//   node shared/learning-core/sync-workspaces.mjs --check  fail on any drift
//
// The mirrored set is discovered from the folders below instead of a
// hand-kept list, so a new canonical file can never be silently skipped.
// Text is compared with CRLF normalized to LF, so a Windows checkout and a
// Linux CI runner agree.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = resolve(sourceRoot, "../..");
const appsRoot = resolve(repositoryRoot, "Apps");
const apps = [
  "Apps/English/English-Automaticity",
  "Apps/Deutsch/Deutsch-Automaticity",
].map((app) => resolve(repositoryRoot, app));

const MIRRORED_FILES = ["package.json", "tsconfig.json"];
const MIRRORED_DIRECTORIES = ["src", "schemas", "browser"];
const IGNORED_NAMES = new Set(["node_modules", ".turbo", "dist", ".DS_Store"]);

// Canonical files intentionally kept out of the app copies. Each entry needs
// a reason and must still exist in the source, so the list cannot go stale.
const PENDING = new Map([
  [
    "src/automaticity/selection-scope.test.ts",
    "R88 RED test: reproduces unchecked responses in the main path; mirror it with the R88 implementation.",
  ],
]);

function walk(root, directory, out) {
  if (!existsSync(directory)) return out;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(root, path, out);
    else if (entry.isFile()) out.push(relative(root, path).replaceAll("\\", "/"));
  }
  return out;
}

function packageFiles(root) {
  const files = MIRRORED_FILES.filter((name) => existsSync(join(root, name)));
  for (const directory of MIRRORED_DIRECTORIES) walk(root, join(root, directory), files);
  return files.sort();
}

function normalized(path) {
  return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

function assertInsideApps(path) {
  const inside = relative(appsRoot, path);
  if (inside === "" || inside.startsWith("..") || isAbsolute(inside))
    throw new Error(`Refusing to sync outside app workspaces: ${path}`);
}

const checkOnly = process.argv.includes("--check");
const problems = [];
const sourceFiles = packageFiles(sourceRoot);

for (const pending of PENDING.keys()) {
  if (!sourceFiles.includes(pending))
    problems.push(`Pending entry no longer exists in the source; remove it from PENDING: ${pending}`);
}
const mirrored = sourceFiles.filter((file) => !PENDING.has(file));
const browserBundles = mirrored.filter((file) => file.startsWith("browser/"));

function syncFile(source, target) {
  assertInsideApps(target);
  if (checkOnly) {
    if (!existsSync(target)) problems.push(`Missing: ${relative(repositoryRoot, target)}`);
    else if (normalized(source) !== normalized(target)) problems.push(`Stale: ${relative(repositoryRoot, target)}`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

for (const app of apps) {
  const mirrorRoot = join(app, "packages/learning-core");
  for (const file of mirrored) syncFile(join(sourceRoot, file), join(mirrorRoot, file));
  // Files left in a copy after their source was removed or never existed.
  const expected = new Set(mirrored);
  for (const extra of packageFiles(mirrorRoot).filter((file) => !expected.has(file))) {
    const reason = PENDING.get(extra);
    problems.push(
      `${reason ? "Pending file must not be mirrored yet" : "Not in the canonical source"}: ${relative(repositoryRoot, join(mirrorRoot, extra))}`,
    );
  }
  for (const bundle of browserBundles) {
    const name = bundle.slice("browser/".length);
    syncFile(join(sourceRoot, bundle), join(app, "apps/web/public/learning-core", name));
  }
}

if (problems.length) {
  console.error(
    `Learning-core ${checkOnly ? "check" : "sync"} found ${problems.length} problem(s):\n${problems.map((p) => `- ${p}`).join("\n")}`,
  );
  if (!checkOnly) console.error("Remove extra files from the app copies by hand after reviewing them.");
  process.exit(1);
}

console.log(
  `${checkOnly ? "Learning-core copies match the canonical source" : "Learning-core copies synchronized"}: ${mirrored.length} package files and ${browserBundles.length} browser bundles in ${apps.length} apps${PENDING.size ? `; ${PENDING.size} pending file(s) held back` : ""}.`,
);
