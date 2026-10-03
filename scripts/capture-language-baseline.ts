import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { grammarUnits as englishUnits } from "../Apps/English/English-Automaticity/packages/content/src/index";
import { grammarUnits as germanUnits } from "../Apps/Deutsch-Automaticity/packages/content/src/index";

// Source catalogs contain authored teaching material, never learner responses.
// This capture probes HTTP but does not start services, edit profiles or install.
const root = resolve(import.meta.dir, "..");
const capturedAt = new Date().toISOString();
const defaultOutput = `artifacts/language-automaticity/baseline-${capturedAt.replace(/[:.]/g, "-")}.json`;
const outputArgument = Bun.argv.find((arg) => arg.startsWith("--output="));
const outputPath = resolve(root, outputArgument?.slice("--output=".length) ?? defaultOutput);
const artifactRoot = resolve(root, "artifacts/language-automaticity");
if (!outputPath.startsWith(artifactRoot + sep)) {
  throw new Error("Baseline output must stay inside artifacts/language-automaticity.");
}

const targets = [
  {
    id: "english",
    language: "en",
    path: "Apps/English/English-Automaticity",
    configPath: "apps/web/next.config.mjs",
    web: "http://127.0.0.1:3202",
    api: "http://127.0.0.1:4201/api/health",
    expectedService: "grammar-automaticity-api",
    routes: ["/", "/daily", "/grammar", "/studio"],
    units: englishUnits,
  },
  {
    id: "german",
    language: "de",
    path: "Apps/Deutsch-Automaticity",
    configPath: "apps/web/next.config.ts",
    web: "http://127.0.0.1:3210",
    api: "http://127.0.0.1:4210/api/v1/health",
    expectedService: "grammar-api",
    routes: ["/", "/heute", "/grammatik", "/studio"],
    units: germanUnits,
  },
] as const;

async function jsonFile(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid metadata object: ${relative(root, path)}`);
  }
  return value as Record<string, unknown>;
}

async function probe(url: string, expectedService?: string) {
  const started = performance.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
      headers: { Accept: expectedService ? "application/json" : "text/html" },
    });
    const body = await response.text();
    let contractMatched = /<html\b/i.test(body) && /dir=["']ltr["']/i.test(body);
    if (expectedService) {
      const value: unknown = JSON.parse(body);
      const data = value && typeof value === "object" ? value as Record<string, unknown> : null;
      contractMatched = data?.service === expectedService && data?.status === "ok";
    }
    return {
      url, finalUrl: response.url, status: response.status,
      ready: response.ok && contractMatched,
      responseBytes: Buffer.byteLength(body),
      elapsedMs: Math.round(performance.now() - started),
      // Do not persist response HTML, health details, or browser state.
    };
  } catch (error) {
    return { url, ready: false, status: null, error: error instanceof Error ? error.message : "Probe failed" };
  }
}

const products = await Promise.all(targets.map(async (target) => {
  const project = resolve(root, target.path);
  const [packageInfo, setup, routeConfig, checks] = await Promise.all([
    jsonFile(resolve(project, "package.json")),
    jsonFile(resolve(project, "distribution/windows-modern/setup.config.json")),
    readFile(resolve(project, target.configPath), "utf8"),
    Promise.all([
      ...target.routes.map((path) => probe(target.web + path)),
      probe(target.api, target.expectedService),
    ]),
  ]);
  const aliases = target.units.map((unit) => ({
    legacyAlias: `${unit.level}::${unit.title}`,
    level: unit.level,
    title: unit.title,
    constructionMapping: "not-yet-reviewed",
    exerciseCount: unit.exercises.length,
  }));
  if (new Set(aliases.map((unit) => unit.legacyAlias)).size !== aliases.length) {
    throw new Error(`Duplicate source identity in ${target.id}.`);
  }
  return {
    id: target.id, language: target.language, sourcePath: project,
    packageVersion: packageInfo.version, desktopReleaseVersion: setup.version,
    routeConfigPath: relative(root, resolve(project, target.configPath)),
    routeConfigSha256: createHash("sha256").update(routeConfig).digest("hex"),
    staticRewrites: Array.from(routeConfig.matchAll(/source:\s*"([^"]+)"\s*,\s*destination:\s*"([^"]+)"/g),
      (match) => ({ source: match[1], destination: match[2] })),
    catalog: { count: aliases.length, sourceSha256: createHash("sha256").update(JSON.stringify(target.units)).digest("hex"), units: aliases },
    checks,
  };
}));
const snapshot = {
  schemaVersion: 1, capturedAt, snapshotKind: "source-and-http-baseline",
  containsLearnerData: false,
  revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  worktree: execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean),
  evidenceLimits: ["HTTP is not browser verification", "Catalog presence is not reviewed grammar coverage", "Installed profiles and learner outcomes are not inspected"],
  products,
};
await mkdir(dirname(outputPath), { recursive: true });
// Preserve earlier captures even when the same explicit filename is requested.
await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ output: outputPath, products: products.map((product) => ({
  id: product.id, units: product.catalog.count,
  ready: product.checks.filter((check) => check.ready).length,
  checked: product.checks.length,
})) }, null, 2));
