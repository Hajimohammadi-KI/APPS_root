import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("ships a consent-based per-user Windows release lifecycle", async () => {
  const [setup, start, packageScript, updateConfig, updater] = await Promise.all([
    readFile(resolve(projectRoot, "scripts/setup-windows.ps1"), "utf8"),
    readFile(resolve(projectRoot, "scripts/start-windows.ps1"), "utf8"),
    readFile(resolve(projectRoot, "scripts/package-windows-release.ps1"), "utf8"),
    readFile(resolve(projectRoot, "resources/update/update-config.json"), "utf8").then(JSON.parse),
    readFile(resolve(projectRoot, "../../../shared/windows-release/check-for-updates.ps1"), "utf8"),
  ]);

  assert.equal(updateConfig.productId, "ResearchPDFStudio");
  assert.equal(updateConfig.packageKind, "powershell");
  for (const action of ["Install", "Update", "Repair", "Uninstall"]) {
    assert.match(setup, new RegExp(`\\"${action}\\"`));
  }
  assert.match(setup, /QuietUninstallString/);
  assert.match(setup, /NoRepair -Value 0/);
  assert.match(start, /api\/health/);
  assert.match(start, /contractVersion -eq 1/);
  assert.match(packageScript, /runtime\\bun\.exe/);
  assert.match(packageScript, /codeSigningStatus = \"not-signed\"/);
  assert.match(updater, /MessageBoxButtons\]::YesNo/);
  assert.match(updater, /Expand-SafeArchive/);
  assert.match(updater, /setupSha256/);
  assert.match(updater, /payloadSha256/);
});
