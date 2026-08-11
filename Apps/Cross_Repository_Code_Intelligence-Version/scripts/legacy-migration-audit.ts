import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const expectedName = "StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html";
const configured = process.env.LEGACY_SOURCE_PATH?.trim();
const candidates = [
  configured,
  resolve(repo, expectedName),
  resolve(repo, "legacy", expectedName),
  resolve(repo, "..", "Cross_Repository_Code_Intelligence7.5", expectedName),
  resolve(repo, "..", "..", "..", "Sources", expectedName),
].filter((value): value is string => Boolean(value));

let sourcePath: string | null = null;
for (const candidate of candidates) {
  try {
    await access(candidate);
    sourcePath = candidate;
    break;
  } catch {
    // Continue through the explicit candidate list.
  }
}

const artifacts = {
  packageManifest: resolve(repo, "package.json"),
  bunLockfile: resolve(repo, "bun.lock"),
  compiledFrontend: resolve(repo, "dist", "client"),
  compiledApi: resolve(repo, "apps", "api", "dist", "main.js"),
  dependencies: resolve(repo, "node_modules"),
  exposePdf: resolve(repo, "public", "expose.pdf"),
  migrationDocs: resolve(repo, "docs", "LEGACY-MIGRATION-AUDIT.md"),
};

const artifactStatus = await Promise.all(
  Object.entries(artifacts).map(async ([name, path]) => {
    try {
      await access(path);
      return [name, true] as const;
    } catch {
      return [name, false] as const;
    }
  }),
);

console.log(JSON.stringify({
  legacySource: sourcePath,
  expectedLegacyFile: expectedName,
  artifacts: Object.fromEntries(artifactStatus),
}, null, 2));

if (!sourcePath) {
  console.error(`Missing canonical legacy source: ${expectedName}`);
  console.error("Supply the file or set LEGACY_SOURCE_PATH before claiming parity.");
  process.exitCode = 2;
}
