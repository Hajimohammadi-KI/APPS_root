import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseAutomaticityEvent,
  isRecord,
} from "../shared/learning-core/src/automaticity/contracts";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import {
  parseLearningStudy,
  evaluateLearningStudy,
  type OpportunityScore,
} from "./lib/learning-study";
import {
  sha256,
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
import { loadStudyProbeCatalog } from "./lib/study-probe-catalog";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
import { qualifyHumanReview } from "../shared/learning-core/src/automaticity/human-review";
const root = resolve(import.meta.dir, ".."),
  path = Bun.argv[2],
  now = new Date().toISOString();
if (!path)
  throw Error(
    "Provide an explicit study export, or --empty for a no-data readiness report.",
  );
const runtime = await loadRepresentativeRuntime(root),
  folder = resolve(
    root,
    `artifacts/learning-study/${now.replace(/[:.]/g, "-")}`,
  );
let report: unknown;
if (path === "--empty")
  report = {
    at: now,
    status: "awaiting_human_evidence",
    actualObservations: 0,
    automaticMasteryGranted: false,
    causalBenefitEstablished: false,
    remaining: [
      "Reviewed unseen baseline and follow-up tasks",
      "Prospective participant consent and authored baseline",
      "Actual writing/audio, independent reviews and elapsed 24-hour/7-day/30-day windows",
    ],
    packHashes: runtime.packHashes,
  };
else {
  const bytes = await readFile(resolve(root, path), "utf8");
  if (bytes.length > 100_000_000) throw Error("Study export is too large");
  const input: unknown = JSON.parse(bytes);
  if (
    !isRecord(input) ||
    !Array.isArray(input.events) ||
    !Array.isArray(input.audio)
  )
    throw Error("Study export needs study, events and audio arrays");
  if (
    input.opportunityScores !== undefined &&
    !Array.isArray(input.opportunityScores)
  )
    throw Error("Opportunity scores must be an array of reviewed counts");
  const audio = new Map<string, Uint8Array>();
  for (const row of input.audio) {
    if (
      !isRecord(row) ||
      typeof row.sha256 !== "string" ||
      typeof row.base64 !== "string" ||
      audio.has(row.sha256)
    )
      throw Error("Invalid or repeated study recording");
    const data = Buffer.from(row.base64, "base64");
    if (sha256(data) !== row.sha256)
      throw Error("Study recording checksum mismatch");
    audio.set(row.sha256, data);
  }
  const reviews = parseReviewLedger(
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
    reviews,
    now,
  );
  const privateCatalog =
    input.probeCatalog === undefined
      ? null
      : await loadStudyProbeCatalog(
          root,
          input.probeCatalog,
          runtime.packs,
          now,
        );
  const packs = privateCatalog?.packs ?? runtime.packs,
    allReviews = [...reviews, ...(privateCatalog?.reviews ?? [])];
  const study = parseLearningStudy(input.study, packs, now),
    events = input.events.map((row) => parseAutomaticityEvent(row));
  const approvedAssessmentIds = new Set<string>();
  for (const pack of packs) {
    const manifest = buildHumanReviewManifest(pack, allReviews);
    for (const assessment of events) {
      if (
        assessment.type !== "assessment" ||
        assessment.language !== pack.language ||
        assessment.evaluator.kind !== "human" ||
        !assessment.evaluator.scopeApproved
      )
        continue;
      const attempt = events.find(
        (event) =>
          event.type === "attempt" && event.id === assessment.attemptId,
      );
      if (!attempt || attempt.type !== "attempt") continue;
      const scope = manifest.scopes.find(
        (scope) =>
          scope.taskId === attempt.task.id &&
          scope.evaluatorId === assessment.evaluator.id &&
          scope.evaluatorVersion === assessment.evaluator.version &&
          scope.reviewId === assessment.evaluator.reviewId,
      );
      if (
        scope &&
        (await qualifyHumanReview(
          attempt,
          pack,
          manifest,
          scope.reviewerName,
          assessment.at,
          attempt.audio
            ? { sha256: attempt.audio.sha256, confirmed: true }
            : null,
        ))
      )
        approvedAssessmentIds.add(assessment.id);
    }
  }
  report = {
    ...evaluateLearningStudy(
      study,
      events,
      packs,
      now,
      audio,
      approvedAssessmentIds,
      (input.opportunityScores ?? []) as OpportunityScore[],
    ),
    inputSha256: sha256(bytes),
    privateProbeCatalogSha256:
      input.probeCatalog === undefined
        ? null
        : sha256(JSON.stringify(input.probeCatalog)),
    packHashes: runtime.packHashes,
  };
}
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify({ folder, report }));
