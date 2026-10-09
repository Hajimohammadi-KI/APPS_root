import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
for (const [entry, file] of [
  ["browser-entry.ts", "automaticity-v2.js"],
  ["practice-entry.ts", "practice.js"],
  ["overview-entry.ts", "overview.js"],
  // R77: explanation-language guide for the static grammar and today pages.
  ["support-language-entry.ts", "support-language.js"],
]) {
  const result = await Bun.build({
    entrypoints: [
      resolve(root, `shared/learning-core/src/automaticity/${entry}`),
    ],
    target: "browser",
    format: "iife",
    minify: true,
    outdir: resolve(root, "shared/learning-core/browser"),
    naming: file,
  });
  if (!result.success)
    throw new AggregateError(result.logs, "Automaticity browser build failed");
}
for (const command of [
  ["bun", "scripts/build-automaticity-curriculum.ts"],
  ["bun", "scripts/prepare-assessment-readiness.ts"],
  ["bun", "shared/learning-core/sync-workspaces.mjs"],
]) {
  const child = Bun.spawn(command, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await child.exited) !== 0)
    throw new Error(`Failed ${command.join(" ")}`);
}

