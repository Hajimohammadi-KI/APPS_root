import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = resolve(sourceRoot, "../..");
const targets = [
  resolve(
    repositoryRoot,
    "Apps/English/English-07082026/packages/learning-core",
  ),
  resolve(repositoryRoot, "Apps/Deutsch-V10.08.2026/packages/learning-core"),
];
const files = [
  "package.json",
  "tsconfig.json",
  "src/index.ts",
  "src/index.test.ts",
  "src/adherence/feature-flags.ts",
  "src/adherence/adherence.test.ts",
  "src/adherence/index.ts",
  "src/adherence/plan-adjustment.ts",
  "src/adherence/readiness.ts",
  "src/adherence/storage.ts",
  "src/adherence/streak.ts",
  "src/adherence/types.ts",
  "schemas/learning-vertical-slice.schema.json",
];
const checkOnly = process.argv.includes("--check");

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

for (const targetRoot of targets) {
  if (!targetRoot.startsWith(`${repositoryRoot}\\Apps\\`)) {
    throw new Error(`Refusing to sync outside app workspaces: ${targetRoot}`);
  }
  for (const relativePath of files) {
    const source = join(sourceRoot, relativePath);
    const target = join(targetRoot, relativePath);
    if (checkOnly) {
      if (!existsSync(target) || digest(source) !== digest(target)) {
        throw new Error(`Learning-core mirror is stale: ${target}`);
      }
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

console.log(
  checkOnly
    ? "Learning-core workspace mirrors match the canonical source."
    : "Learning-core workspace mirrors synchronized.",
);
