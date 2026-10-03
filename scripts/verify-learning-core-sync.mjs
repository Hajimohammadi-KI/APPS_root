import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, `artifacts/learning-core-sync/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const check = () => execFileSync(process.execPath, ["shared/learning-core/sync-workspaces.mjs", "--check"], { cwd: root, encoding: "utf8", stdio: "pipe" });
check();
const report = { createdAt: new Date().toISOString(), cases: [], status: "running" };
try {
  const unlisted=resolve(root,`shared/learning-core/src/unlisted-sync-fixture-${process.pid}.ts`);
  await writeFile(unlisted,'// Synthetic canonical source to verify inventory coverage.\n',{flag:'wx'});
  try { assert.throws(check,/missing from sync manifest/);report.cases.push({path:unlisted,unlistedSourceRejected:true}); }
  finally { await unlink(unlisted); }
  for (const relative of [
    "Apps/English/English-Automaticity/packages/learning-core/src/automaticity/evidence.ts",
    "Apps/Deutsch-Automaticity/apps/web/public/learning-core/automaticity-v2.js",
  ]) {
    const target = resolve(root, relative);
    assert(target.startsWith(root + "\\") || target.startsWith(root + "/"));
    const original = await readFile(target);
    const sha256 = createHash("sha256").update(original).digest("hex");
    // The exact bytes are also kept on disk if the verification process is interrupted.
    const backup = resolve(output, `original-${report.cases.length}.bin`);
    await writeFile(backup, original, { flag: "wx" });
    const row = { path: relative, originalSha256: sha256, backup, staleRejected: false, missingRejected: false, restored: false };
    report.cases.push(row);
    try {
      await writeFile(target, Buffer.concat([original, Buffer.from("\n// Deliberately stale verification fixture\n")]));
      assert.throws(check, /stale/); row.staleRejected = true;
      await unlink(target);
      assert.throws(check, /stale/); row.missingRejected = true;
    } finally {
      await writeFile(target, original);
      assert.equal(createHash("sha256").update(await readFile(target)).digest("hex"), sha256);
      row.restored = true;
    }
  }
  check(); report.status = "passed";
} catch (error) { report.status = "failed"; report.error = String(error); throw error; }
finally { await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2)); console.log(`Evidence: ${output}`); }
