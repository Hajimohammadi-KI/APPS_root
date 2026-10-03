import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { sha256 } from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, ".."),
  at = new Date().toISOString(),
  folder = resolve(
    root,
    `artifacts/installed-language-completion/${at.replace(/[:.]/g, "-")}`,
  );
await mkdir(folder, { recursive: true });
const commands = [
  [
    "scheduler-pilot",
    "scripts/verify-scheduler-pilot-browser.mjs",
    "--installed",
  ],
  ["human-review", "scripts/verify-human-review-browser.mjs", "--installed"],
  ["all-curriculum-cells", "scripts/verify-curriculum-routes.mjs"],
  [
    "assessment-feedback",
    "scripts/verify-assessment-feedback-browser.mjs",
    "--installed",
  ],
  [
    "representative-cycle",
    "scripts/verify-representative-browser.mjs",
    "--installed",
  ],
  ["practice", "scripts/verify-automaticity-practice.mjs", "--installed"],
  [
    "prospective-recall",
    "scripts/verify-prospective-recall.mjs",
    "--installed",
  ],
  ["review-drafts", "scripts/verify-review-drafts.mjs", "--installed"],
  ["daily-plan", "scripts/verify-daily-plan-browser.mjs", "--installed"],
  ["backup-audio-routes", "scripts/verify-installed-automaticity-browser.mjs"],
  ["transformer", "scripts/verify-transformer-browser.mjs", "--installed"],
];
let index = 0,
  failed = false;
const checks: unknown[] = [];
async function findReceipt(stdout: string): Promise<string> {
  let path: string | undefined;
  for (const chunk of [
    stdout.trim(),
    stdout.slice(stdout.lastIndexOf("\n{") + 1).trim(),
  ]) {
    try {
      const result = JSON.parse(chunk);
      path = result.folder ?? result.output;
      if (typeof path === "string") break;
    } catch {}
  }
  if (!path) {
    const line = stdout
      .trim()
      .split(/\r?\n/)
      .reverse()
      .find(
        (line) =>
          line.startsWith("Evidence: ") ||
          /^[A-Z]:\\.*\\report\.json$/i.test(line),
      );
    if (line) path = line.replace(/^Evidence: /, "");
  }
  assert.equal(typeof path, "string", "No report path in verifier output");
  const receipt = relative(
    root,
    resolve(root, path!, path!.endsWith("report.json") ? "" : "report.json"),
  ).replaceAll("\\", "/");
  assert(
    receipt.startsWith("artifacts/") && !receipt.includes("/../"),
    "Verifier receipt is outside workspace artifacts",
  );
  const result = JSON.parse(await readFile(resolve(root, receipt), "utf8"));
  if (result.status !== undefined)
    assert(
      ["passed", "verified"].includes(result.status),
      `Failed receipt: ${receipt}`,
    );
  assert(
    Array.isArray(result.cases) && result.cases.length > 0,
    `Missing cases: ${receipt}`,
  );
  assert(
    result.cases.every((row: { status: string } | string) =>
      typeof row === "string"
        ? row.trim().length > 0 &&
          ["passed", "verified"].includes(result.status)
        : ["passed", "verified"].includes(row.status),
    ),
    `Failed case: ${receipt}`,
  );
  return receipt;
}
async function record(id: string, args: string[], exit: number, log: string) {
  await writeFile(resolve(folder, `${id}.log`), log, { flag: "wx" });
  let receipt: string | null = null,
    receiptError: string | null = null;
  try {
    receipt = await findReceipt(log.split("\nSTDERR\n")[0]!);
  } catch (error) {
    receiptError = String(error);
  }
  const passed = exit === 0 && receipt !== null;
  if (!passed) failed = true;
  checks.push({
    id,
    command: ["node", ...args],
    exit,
    status: passed ? "passed" : "failed",
    receipt,
    receiptError,
    log: `${id}.log`,
    logSha256: sha256(log),
  });
  console.log(
    JSON.stringify({
      id,
      status: passed ? "passed" : "failed",
      receipt,
      receiptError,
    }),
  );
}
async function worker() {
  while (index < commands.length) {
    const [id, ...args] = commands[index++]!,
      child = Bun.spawn(["node", ...args], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      });
    const [stdout, stderr, exit] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]),
      log = stdout + "\nSTDERR\n" + stderr;
    await record(id!, args, exit, log);
  }
}
const collect = Bun.argv.find((arg) => arg.startsWith("--collect="))?.slice(10);
let recollectedFrom: { path: string; sha256: string } | null = null;
if (collect) {
  const originalBytes = await readFile(resolve(root, collect, "report.json")),
    original = JSON.parse(originalBytes.toString("utf8"));
  assert.equal(original.checks.length, commands.length);
  for (const [id, ...args] of commands) {
    const matches = original.checks.filter(
      (row: { id: string }) => row.id === id,
    );
    assert.equal(matches.length, 1);
    const check: {
      command: string[];
      exit: number;
      log: string;
      logSha256: string;
    } = matches[0];
    assert.deepEqual(check.command, ["node", ...args]);
    assert(Number.isInteger(check.exit));
    const log: string = await readFile(
      resolve(root, collect, check.log),
      "utf8",
    );
    assert.equal(sha256(log), check.logSha256);
    await record(id!, args, check.exit, log);
  }
  recollectedFrom = {
    path: `${collect}/report.json`,
    sha256: sha256(originalBytes),
  };
} else await Promise.all([worker(), worker(), worker()]);
const report = {
  at,
  finishedAt: new Date().toISOString(),
  status: failed ? "failed" : "passed",
  scope:
    "Installed English and German apps, isolated synthetic browser profiles; no real learner outcomes or independent language reviews are created.",
  checks,
  recollectedFrom,
};
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(
  JSON.stringify({ folder, status: report.status, checks: checks.length }),
);
if (failed) process.exitCode = 1;
