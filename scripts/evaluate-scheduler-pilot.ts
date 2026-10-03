import { evaluateSchedulerPilot } from "./lib/scheduler-pilot-evaluation";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCompleteBackup } from "../shared/learning-core/src/automaticity/backup";
import {
  parseAutomaticityEvent,
  isRecord,
} from "../shared/learning-core/src/automaticity/contracts";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import {
  sha256,
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
const root = resolve(import.meta.dir, ".."),
  at = new Date().toISOString(),
  argument = Bun.argv[2],
  folder = resolve(
    root,
    `artifacts/scheduler-pilot-evaluation/${at.replace(/[:.]/g, "-")}`,
  );
if (!argument)
  throw Error(
    "Pass a declaration with planPath and consented backupPath, or --empty.",
  );
let result: unknown;
if (argument === "--empty")
  result = {
    status: "awaiting_human_evidence",
    actualResponses: 0,
    causalBenefitEstablished: false,
    remaining: [
      "Reviewed, delivered prospective comparison",
      "Explicit learner participation and actual due reviews",
      "Independent outcome review and elapsed follow-up time",
    ],
  };
else {
  const input: unknown = JSON.parse(
    await readFile(resolve(root, argument), "utf8"),
  );
  assert(
    isRecord(input) &&
      input.consentToAnalyse === true &&
      typeof input.planPath === "string" &&
      typeof input.backupPath === "string",
  );
  const envelope = JSON.parse(
    await readFile(resolve(root, input.planPath), "utf8"),
  );
  assert(envelope.schemaVersion === 1 && isRecord(envelope.plan));
  const backupBytes = await readFile(resolve(root, input.backupPath));
  assert(backupBytes.length < 100000000);
  const backup = await validateCompleteBackup(
    JSON.parse(backupBytes.toString("utf8")),
    envelope.plan.language,
  );
  const runtime = await loadRepresentativeRuntime(root);
  const pack = runtime.packs.find((pack) => pack.language === backup.language)!;
  const ledger = parseReviewLedger(
    JSON.parse(
      await readFile(
        resolve(root, "docs/automaticity-release-reviews.json"),
        "utf8",
      ),
    ),
  );
  const coverage = JSON.parse(
    await readFile(resolve(root, "docs/automaticity-coverage.json"), "utf8"),
  ) as { cells: CoverageCell[] };
  await validateReleaseReviews(
    root,
    coverage.cells,
    new Map(runtime.packs.map((pack) => [pack.language, pack])),
    ledger,
    at,
  );
  const approvals = buildHumanReviewManifest(pack, ledger);
  const entries = new Map(backup.localStorage),
    prefix = `automaticity:v2:${backup.language}:`,
    events = backup.localStorage
      .filter(([key]) => key.startsWith(prefix + "event:"))
      .map(([, value]) =>
        parseAutomaticityEvent(JSON.parse(value), backup.language),
      );
  result = {
    ...(await evaluateSchedulerPilot(
      pack,
      approvals,
      envelope.plan,
      events,
      entries,
      at,
    )),
    backupSha256: sha256(backupBytes),
  };
}
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify({ at, ...(result as object) }, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify({ folder, ...(result as object) }));
