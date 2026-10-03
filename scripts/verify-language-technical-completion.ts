import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256 } from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, ".."),
  at = new Date().toISOString(),
  folder = resolve(
    root,
    `artifacts/language-technical-checks/${at.replace(/[:.]/g, "-")}`,
  );
await mkdir(folder, { recursive: true });
const commands: [
  string,
  string[],
  "pass" | "human_full" | "human_representative",
][] = [
  [
    "tool-types",
    [
      "node",
      "Apps/Deutsch-Automaticity/node_modules/typescript/bin/tsc",
      "-p",
      "scripts/tsconfig.language-tools.json",
    ],
    "pass",
  ],
  [
    "new-tool-regressions",
    [
      "bun",
      "test",
      "./scripts/learning-study.test.ts",
      "./scripts/reviewed-curriculum.test.ts",
      "./scripts/review-output-transaction.test.ts",
      "./scripts/practice-bandit.test.ts",
    ],
    "pass",
  ],
  [
    "shared-new-regressions",
    [
      "bun",
      "test",
      "./Apps/Deutsch-Automaticity/packages/learning-core/src/automaticity/assessment-boundary.test.ts",
      "./Apps/Deutsch-Automaticity/packages/learning-core/src/automaticity/prospective.test.ts",
      "./Apps/Deutsch-Automaticity/packages/learning-core/src/automaticity/human-review.test.ts",
      "./Apps/Deutsch-Automaticity/packages/learning-core/src/fsrs-shadow/evaluation.test.ts",
    ],
    "pass",
  ],
  ["scope", ["bun", "scripts/build-grammar-scope.ts", "--check"], "pass"],
  [
    "curriculum-reproduction",
    ["bun", "scripts/build-automaticity-curriculum.ts", "--check"],
    "pass",
  ],
  [
    "mirror-parity",
    ["node", "shared/learning-core/sync-workspaces.mjs", "--check"],
    "pass",
  ],
  [
    "all-task-boundaries",
    ["bun", "scripts/verify-curriculum-engineering.ts"],
    "pass",
  ],
  [
    "review-integrity",
    ["bun", "scripts/verify-automaticity-release-reviews.ts"],
    "pass",
  ],
  [
    "review-packet-files",
    [
      "node",
      "scripts/verify-content-review-packets.mjs",
      "artifacts/content-review-packets/all-20260905-feedback38-42",
      "--files-only",
    ],
    "pass",
  ],
  [
    "model-evaluation-integrity",
    ["bun", "scripts/verify-model-evaluation.ts"],
    "pass",
  ],
  ["model-adapters", ["bun", "scripts/verify-model-adapters.ts"], "pass"],
  [
    "transformer-qualification",
    ["bun", "scripts/verify-transformer-release.ts"],
    "pass",
  ],
  [
    "feedback-import",
    [
      "bun",
      "scripts/verify-feedback-import.ts",
      Bun.argv[2] ??
        "artifacts/assessment-feedback-browser/2026-09-05T19-42-55-822Z",
    ],
    "pass",
  ],
  [
    "study-no-data",
    ["bun", "scripts/evaluate-learning-study.ts", "--empty"],
    "pass",
  ],
  [
    "fsrs-no-data",
    ["bun", "scripts/evaluate-fsrs-shadow.ts", "--empty"],
    "pass",
  ],
  [
    "representative-assessment",
    ["bun", "scripts/verify-representative-assessment.ts"],
    "pass",
  ],
  [
    "scheduler-pilot-unit",
    [
      "bun",
      "test",
      "./shared/learning-core/src/automaticity/scheduler-pilot.test.ts",
      "./scripts/scheduler-pilot-evaluation.test.ts",
    ],
    "pass",
  ],
  [
    "scheduler-pilot-empty-release",
    ["bun", "scripts/compile-scheduler-pilot.ts", "--empty"],
    "pass",
  ],
  [
    "scheduler-pilot-empty-study",
    ["bun", "scripts/evaluate-scheduler-pilot.ts", "--empty"],
    "pass",
  ],
  [
    "full-human-gate",
    ["bun", "scripts/check-automaticity-coverage.ts", "--release"],
    "human_full",
  ],
  [
    "representative-human-gate",
    ["bun", "scripts/check-representative-review.ts", "--release"],
    "human_representative",
  ],
];
const results: unknown[] = [];
let index = 0,
  failed = false;
async function worker() {
  while (index < commands.length) {
    const [id, command, expectation] = commands[index++]!,
      child = Bun.spawn(command, { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    const log = stdout + "\nSTDERR\n" + stderr;
    await writeFile(resolve(folder, `${id}.log`), log, { flag: "wx" });
    let passed = exit === 0;
    if (expectation !== "pass")
      try {
        const data = JSON.parse(stdout);
        passed =
          exit === 2 &&
          (expectation === "human_full"
            ? data.structuralCoverage === "verified" &&
              data.missingExpandedScopeCells === 0 &&
              data.unqualifiedCells === 3906
            : data.status === "pending_independent_review" &&
              data.requiredCells === 168 &&
              data.reviewedCells === 0);
      } catch {
        passed = false;
      }
    if (!passed) failed = true;
    results.push({
      id,
      command,
      exit,
      expectation,
      status: passed ? "passed" : "failed",
      log: `${id}.log`,
      logSha256: sha256(log),
    });
    console.log(
      JSON.stringify({ id, status: passed ? "passed" : "failed", exit }),
    );
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
const ledger = await readFile(
  resolve(root, "docs/automaticity-release-reviews.json"),
  "utf8",
);
const report = {
  at,
  finishedAt: new Date().toISOString(),
  status: failed ? "failed" : "passed",
  scope:
    "Required engineering checks and verified refusal of unsupported release claims. Human-language review, actual learner participation and prospective benefit remain unmeasured.",
  checks: results,
  realReviewCount: JSON.parse(ledger).reviews.length,
  realReviewLedgerSha256: sha256(ledger),
};
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(
  JSON.stringify({ folder, status: report.status, checks: results.length }),
);
if (failed) process.exitCode = 1;
