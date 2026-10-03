import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  isRecord,
  parseAutomaticityEvent,
  type Language,
  type AttemptEvent,
} from "../shared/learning-core/src/automaticity/contracts";
// Use the synchronized application mirror so ts-fsrs resolves from its pinned application dependency.
import {
  buildQualifiedFsrsCandidates,
  evaluateFsrsShadowHistory,
} from "../Apps/Deutsch-Automaticity/packages/learning-core/src/fsrs-shadow";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { sha256 } from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, ".."),
  inputPath = Bun.argv[2],
  now = new Date().toISOString();
if (!inputPath)
  throw Error(
    "Pass an explicit consented FSRS export or --empty. No profile is read automatically.",
  );
const runtime = await loadRepresentativeRuntime(root),
  folder = resolve(
    root,
    `artifacts/fsrs-shadow-evaluation/${now.replace(/[:.]/g, "-")}`,
  );
let result: unknown;
if (inputPath === "--empty")
  result = {
    status: "awaiting_human_evidence",
    actualReviews: 0,
    predictions: 0,
    brierScore: null,
    logLoss: null,
    learnerScheduleApplied: false,
    learnerBenefitEstablished: false,
    remaining: [
      "Prospective consent and explicit recall ratings",
      "Reviewed exact-item outcomes on separate days",
      "Prospective workload and learning-benefit comparison",
    ],
  };
else {
  const source = await readFile(resolve(root, inputPath), "utf8");
  if (source.length > 50_000_000) throw Error("FSRS export too large");
  const input: unknown = JSON.parse(source);
  if (
    !isRecord(input) ||
    !["en", "de"].includes(String(input.language)) ||
    !Array.isArray(input.events) ||
    !Array.isArray(input.ratings)
  )
    throw Error("Invalid FSRS export");
  const language = input.language as Language,
    events = input.events.map((row) => parseAutomaticityEvent(row, language));
  const tasks = runtime.packs
    .filter((pack) => pack.language === language)
    .flatMap((pack) => pack.units.flatMap((unit) => unit.tasks));
  const invalid = events
    .filter((row): row is AttemptEvent => row.type === "attempt")
    .filter((row) => {
      const task = tasks.find((task) => task.id === row.task.id);
      return (
        !task ||
        sha256(JSON.stringify(task)) !== row.task.definitionSha256 ||
        sha256(row.response.text) !== row.response.sha256
      );
    })
    .map((row) => row.id);
  const trusted = events.filter(
    (row) => row.type !== "attempt" || !invalid.includes(row.id),
  );
  const qualified = buildQualifiedFsrsCandidates(
    trusted,
    language,
    now,
    input.consent as Parameters<typeof buildQualifiedFsrsCandidates>[3],
    input.ratings as Parameters<typeof buildQualifiedFsrsCandidates>[4],
  );
  const histories = qualified.cards.map((card) => ({
    cardId: card.cardId,
    ...evaluateFsrsShadowHistory(card.history),
  }));
  const predictions = histories.flatMap((row) => row.predictions),
    mean = (key: "squaredError" | "logLoss") =>
      predictions.length
        ? predictions.reduce((sum, row) => sum + row[key], 0) /
          predictions.length
        : null;
  result = {
    status: predictions.length
      ? "descriptive_shadow_only"
      : "awaiting_human_evidence",
    inputSha256: sha256(source),
    ...qualified,
    invalidAttemptIds: invalid,
    histories,
    actualReviews: qualified.cards.reduce(
      (sum, card) => sum + card.history.length,
      0,
    ),
    predictionCount: predictions.length,
    brierScore: mean("squaredError"),
    logLoss: mean("logLoss"),
    dueWithinSevenDays: qualified.cards.filter(
      (card) =>
        Date.parse(card.candidate.dueAt) <= Date.parse(now) + 7 * 86_400_000,
    ).length,
    learnerBenefitEstablished: false,
    workloadBenefitEstablished: false,
    limit:
      "Candidate due counts are descriptive, not observed study burden. No learner schedule is changed. Empty histories provide no calibration evidence.",
  };
}
const report = { at: now, packHashes: runtime.packHashes, result };
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify({ folder, ...report }));
