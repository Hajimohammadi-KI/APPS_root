import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repoRoot, "scripts", "release-targets.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));

test("every public target declares one explicit Vercel project root", async () => {
  const publicTargets = manifest.targets.filter((target) => target.publicAccess === "public");
  const projectNames = new Set();
  const rootDirectories = new Set();

  assert.equal(publicTargets.length, 4);

  for (const target of publicTargets) {
    const deployment = target.deployment;

    assert.equal(deployment?.provider, "vercel", `${target.id} must declare Vercel`);
    const expectedRoot = ["english", "german"].includes(target.id)
      ? `${target.projectDir}/apps/web`
      : target.projectDir;
    assert.equal(deployment.rootDirectory, expectedRoot, `${target.id} root drifted`);
    assert.ok(deployment.projectName, `${target.id} needs a Vercel project name`);
    assert.ok(deployment.configFile, `${target.id} needs a tracked vercel.json`);

    // A duplicated root or project name usually means Vercel will build the wrong nested app.
    assert.equal(projectNames.has(deployment.projectName), false, `${target.id} project is duplicated`);
    assert.equal(rootDirectories.has(deployment.rootDirectory), false, `${target.id} root is duplicated`);
    projectNames.add(deployment.projectName);
    rootDirectories.add(deployment.rootDirectory);

    const packageJson = await readJson(path.join(deployment.rootDirectory, "package.json"));
    const vercelConfig = await readJson(deployment.configFile);

    assert.ok(packageJson.scripts, `${target.id} root must contain a package.json`);
    assert.equal(vercelConfig.framework, "nextjs", `${target.id} framework must stay explicit`);
    assert.match(vercelConfig.installCommand, /bun install/, `${target.id} install command is missing`);
    assert.ok(vercelConfig.buildCommand, `${target.id} build command is missing`);
    assert.equal(
      Object.hasOwn(vercelConfig, "outputDirectory"),
      false,
      `${target.id} must use the framework output default`,
    );
  }
});

test("the Settings app is deliberately local-only", () => {
  const settings = manifest.targets.find((target) => target.id === "settings");

  assert.equal(settings.publicAccess, "local-only");
  assert.equal(settings.deployment?.provider, "local");
  assert.equal(settings.publicChecks.length, 0);
});

test("nested language workspaces publish Next output at their Vercel project roots", async () => {
  const nestedLanguageConfigs = [
    "Apps/English/English-Automaticity/apps/web/next.config.mjs",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/next.config.ts",
  ];

  for (const configPath of nestedLanguageConfigs) {
    const source = await readFile(path.join(repoRoot, configPath), "utf8");

    // The framework and build command must use the same apps/web output directory.
    assert.match(source, /process\.env\.VERCEL/);
    assert.doesNotMatch(source, /distDir:\s*["']\.\.\//);
  }
});

test("public smoke checks use the canonical production aliases", () => {
  const canonicalAliases = new Map([
    ["english", "https://english-grammar-automaticity-pwa.vercel.app/"],
    ["german", "https://deutschflow-grammar.vercel.app/"],
    ["tracker", "https://study-tracker-plan-five.vercel.app/"],
    ["pdf", "https://research-pdf-studio.vercel.app/"],
  ]);

  for (const target of manifest.targets.filter((candidate) => candidate.publicAccess === "public")) {
    const publicUrls = target.publicChecks.map((check) => check.url);
    assert.ok(publicUrls.includes(canonicalAliases.get(target.id)), `${target.id} canonical alias drifted`);
  }
});
