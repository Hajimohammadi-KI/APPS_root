import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const manifestPath = resolve(scriptDirectory, "release-targets.json");

export async function loadTargets() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.targets)) {
    throw new Error("Release target manifest does not match schema version 1.");
  }
  return manifest.targets;
}

function matchesExpected(payload, expected = {}) {
  return Object.entries(expected).every(([key, value]) => payload?.[key] === value);
}

export async function probeCheck(check, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(check.url, {
      headers: { Accept: check.kind === "json" ? "application/json" : "text/html" },
      redirect: "follow",
      signal: controller.signal,
    });
    const body = await response.text();
    let contractPassed = true;
    if (check.kind === "json") {
      try {
        contractPassed = matchesExpected(JSON.parse(body), check.expected);
      } catch {
        contractPassed = false;
      }
    }
    if (check.includes) {
      contractPassed = contractPassed && check.includes.every((value) => body.includes(value));
    }
    return {
      url: check.url,
      status: response.status,
      passed: response.status === 200 && body.trim().length > 0 && contractPassed,
      contractPassed,
    };
  } catch (error) {
    return {
      url: check.url,
      status: null,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function runBuild(target) {
  const projectDirectory = resolve(repositoryRoot, target.projectDir);
  const result = spawnSync(target.build.command, target.build.args, {
    cwd: projectDirectory,
    encoding: "utf8",
    shell: false,
    stdio: "inherit",
  });
  return { passed: result.status === 0, exitCode: result.status };
}

function parseArguments(argv) {
  const only = argv.find((value) => value.startsWith("--only="))?.slice("--only=".length);
  const buildOnly = argv.includes("--build-only");
  const runtimeOnly = argv.includes("--runtime-only");
  if (buildOnly && runtimeOnly) throw new Error("Choose either --build-only or --runtime-only, not both.");
  return {
    only,
    skipBuild: runtimeOnly || argv.includes("--skip-build"),
    skipLocal: buildOnly || argv.includes("--skip-local"),
    skipPublic: buildOnly || argv.includes("--skip-public"),
    json: argv.includes("--json"),
  };
}

export async function verifyReleaseReadiness(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const allTargets = await loadTargets();
  const targets = options.only
    ? allTargets.filter((target) => target.id === options.only)
    : allTargets;
  if (targets.length === 0) throw new Error(`Unknown release target: ${options.only}`);

  const results = [];
  for (const target of targets) {
    // A target is green only when every applicable build/runtime/public contract passes.
    const result = { id: target.id, name: target.name, checks: [] };
    if (!options.skipBuild) result.build = runBuild(target);
    if (!options.skipLocal) {
      result.checks.push(...(await Promise.all(target.localChecks.map((check) => probeCheck(check)))).map((check) => ({ ...check, scope: "local" })));
    }
    if (!options.skipPublic && target.publicAccess === "public") {
      result.checks.push(...(await Promise.all(target.publicChecks.map((check) => probeCheck(check)))).map((check) => ({ ...check, scope: "public" })));
    } else if (!options.skipPublic && target.publicAccess === "local-only") {
      result.public = { status: "N/A", reason: "This product is intentionally local-only." };
    }
    result.passed = (result.build?.passed ?? true) && result.checks.every((check) => check.passed);
    results.push(result);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    passed: results.every((result) => result.passed),
    results,
  };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else {
    for (const result of results) {
      console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}`);
      for (const check of result.checks) {
        console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.scope} ${check.url} ${check.status ?? check.error ?? "error"}`);
      }
      if (result.public?.status === "N/A") console.log(`  N/A public ${result.public.reason}`);
    }
    console.log(report.passed ? "RELEASE READINESS PASSED" : "RELEASE READINESS FAILED");
  }
  return report;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  try {
    const report = await verifyReleaseReadiness();
    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
