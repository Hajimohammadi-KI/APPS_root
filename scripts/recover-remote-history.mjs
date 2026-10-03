import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const git = (...args) =>
  execFileSync("git", args, { cwd: root, maxBuffer: 20000000 });
const remote = git("rev-parse", "origin/main").toString().trim();
const local = git("rev-parse", "HEAD").toString().trim();
const folder = resolve(
  root,
  "DELETE",
  "20260906-remote-history",
  remote.slice(0, 12),
);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const missing = git(
  "diff",
  "--name-only",
  "--diff-filter=D",
  "-z",
  remote,
  local,
)
  .toString()
  .split("\0")
  .filter(Boolean);
const rows = [];
for (const path of missing) {
  const restore = path === "Apps/English/English-Automaticity/.vercelignore";
  assert(
    restore ||
      path.startsWith("doc/duplicate-markdown/") ||
      path === "Thesis-CrossRepositoryCodeIntelligence/STRATEGY-CORE.md" ||
      /^docs\/LANGUAGE-AUTOMATICITY-ROADMAP\.html\.\d+\.tmp$/.test(path),
    `Unreviewed missing path: ${path}`,
  );
  const destination = resolve(restore ? root : folder, path);
  assert(
    destination.startsWith((restore ? root : folder) + "\\") &&
      !relative(root, destination).startsWith(".."),
  );
  const bytes = git("show", `${remote}:${path}`);
  let canonicalSha256 = null;
  if (path.startsWith("doc/duplicate-markdown/")) {
    try {
      canonicalSha256 = sha(
        await readFile(
          resolve(root, path.slice("doc/duplicate-markdown/".length)),
        ),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await mkdir(dirname(destination), { recursive: true });
  try {
    await writeFile(destination, bytes, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const saved = await readFile(destination);
  if (restore)
    assert.equal(
      saved.toString().replaceAll("\r\n", "\n"),
      bytes.toString().replaceAll("\r\n", "\n"),
    );
  else assert.equal(sha(saved), sha(bytes));
  rows.push({
    original: path,
    destination: relative(root, destination).replaceAll("\\", "/"),
    action: restore
      ? "restored_deployment_configuration"
      : "recovered_remote_archive",
    bytes: saved.length,
    sha256: sha(saved),
    remoteSha256: sha(bytes),
    gitBlob: git("rev-parse", `${remote}:${path}`).toString().trim(),
    canonicalSha256,
    identicalCanonicalCopy: canonicalSha256 === sha(bytes),
  });
}
await mkdir(folder, { recursive: true });
const report = {
  at: new Date().toISOString(),
  remote,
  local,
  status: "verified",
  historyPolicy:
    "Keep both histories; preserve the newer local application tree. Recover every remote-only blob before integration. No force push.",
  rows,
};
await writeFile(
  resolve(folder, "manifest.json"),
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  resolve(root, "docs/GIT-HISTORY-RECOVERY-2026-09-06.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    folder,
    remote,
    local,
    recovered: rows.filter((r) => r.action === "recovered_remote_archive")
      .length,
    restored: rows.filter(
      (r) => r.action === "restored_deployment_configuration",
    ).length,
    exactDuplicates: rows.filter((r) => r.identicalCanonicalCopy).length,
  }),
);
