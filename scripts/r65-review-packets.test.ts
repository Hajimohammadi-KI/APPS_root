import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PracticeTask } from "../shared/learning-core/src/automaticity/curriculum";
import { caseDigest, digest } from "./lib/model-benchmark";
import {
  blankCorpusReview,
  blankTaskReview,
  buildBlindPacket,
  taskDevelopmentManifest,
  taskIntakeTemplate,
  taskReviewMaterials,
  validateBlindPacket,
  validateCorpusReview,
  validateTaskReviews,
} from "./lib/r65-review-packets";
import { offlineForm } from "./prepare-r65-human-review";

const at = "2026-10-03T09:00:00.000Z",
  now = "2026-10-03T12:00:00.000Z";
// Test transport fixtures only. No real learner, reviewer or corpus labels are synthesized.
const inputs = [
  {
    id: "source-clean",
    language: "en",
    source: "private-source",
    sourceSplit: "train",
    text: "She writes.",
    before: "Before.",
    after: "After.",
    label: "clean",
    types: ["HIDDEN-TYPE"],
    reference: { correction: "HIDDEN-GOLD" },
    modelVerdict: "HIDDEN-MODEL",
  },
  {
    id: "source-error",
    language: "de",
    source: "private-source",
    sourceSplit: "train",
    text: "Ich lerne.",
    before: "Davor.",
    after: "Danach.",
    label: "error",
    types: [],
    reference: { correction: "HIDDEN-GOLD-2" },
  },
];
const source = inputs.map((row) => JSON.stringify(row)).join("\n") + "\n";
const makePacket = () =>
  buildBlindPacket(
    source,
    { count: 2, sha256: digest(source) },
    "test-opaque-seed",
    at,
  );

describe("R65 blinded development packets", () => {
  test("whitelists original context and leaves every judgment and identity blank", () => {
    const built = makePacket(),
      form = blankCorpusReview(built.packet);
    const visible = JSON.stringify({ packet: built.packet, form });
    for (const hidden of [
      "HIDDEN-GOLD",
      "HIDDEN-MODEL",
      "HIDDEN-TYPE",
      "source-clean",
      "source-error",
      "private-source",
      '"expected"',
      '"reference"',
    ])
      expect(visible).not.toContain(hidden);
    expect(built.packet.cases.map((row) => row.target).sort()).toEqual([
      "Ich lerne.",
      "She writes.",
    ]);
    expect(form.reviewerId).toBeNull();
    expect(form.provenance).toBeNull();
    expect(
      form.labels.every(
        (label) =>
          label.grammar === null &&
          label.contextSufficient === null &&
          label.minimalCorrection === null &&
          label.note === "",
      ),
    ).toBe(true);
    expect(
      blankCorpusReview(built.packet, "adjudication").reviewerId,
    ).toBeNull();
    expect(built.publicSummary).toMatchObject({
      count: 2,
      completedHumanReviews: 0,
      adjudications: 0,
      taskLinkedCases: 0,
      automaticallyApproved: false,
    });
    expect(JSON.stringify(built.publicSummary)).not.toContain("She writes");
    expect(JSON.stringify(built.publicSummary)).not.toContain("source-clean");
    expect(built.coordinator.mappings).toHaveLength(2);
    expect(digest(source)).toBe(built.coordinator.developmentSha256);
    expect(makePacket()).toEqual(built);
  });

  test("rejects stale hashes, duplicate cases and non-development source partitions", () => {
    expect(() =>
      buildBlindPacket(
        source + " ",
        { count: 2, sha256: digest(source) },
        "seed",
        at,
      ),
    ).toThrow("snapshot");
    for (const rows of [
      [inputs[0], inputs[0]],
      [{ ...inputs[0], sourceSplit: "dev" }],
    ]) {
      const bytes = rows.map((row) => JSON.stringify(row)).join("\n");
      expect(() =>
        buildBlindPacket(
          bytes,
          { count: rows.length, sha256: digest(bytes) },
          "seed",
          at,
        ),
      ).toThrow();
    }
    const packet = makePacket().packet;
    expect(() =>
      validateBlindPacket({
        ...packet,
        cases: [{ ...packet.cases[0], label: "clean" }],
      }),
    ).toThrow("Unblinded");
    expect(() =>
      validateBlindPacket({
        ...packet,
        cases: [{ ...packet.cases[0], target: "Changed" }],
      }),
    ).toThrow("altered");
  });

  test("rejects blank and stale reviews; preserves explicit uncertainty and binds corrections", () => {
    const packet = makePacket().packet,
      draft = blankCorpusReview(packet);
    expect(() => validateCorpusReview(packet, draft, now)).toThrow();
    const label = {
      ...draft.labels[0]!,
      grammar: "uncertain",
      contextSufficient: false,
      note: "Context does not resolve the intended reading.",
    };
    const review = {
      ...draft,
      provenance: "human_review",
      reviewerId: "test-reviewer-a",
      role: "transport-test-only",
      reviewedAt: now,
      independentlyReviewed: true,
      sourceCorrectionsHidden: true,
      modelPredictionsHidden: true,
      labels: [label],
    };
    expect(validateCorpusReview(packet, review, now)).toMatchObject({
      count: 1,
      approved: false,
    });
    for (const change of [
      { reviewerId: "Codex" },
      { reviewedAt: "2099-01-01T00:00:00Z" },
      { modelPredictionsHidden: false },
      { labels: [label, label] },
      { labels: [{ ...label, caseSha256: "0".repeat(64) }] },
      {
        labels: [{ ...label, grammar: "acceptable", contextSufficient: false }],
      },
      {
        labels: [
          {
            ...label,
            grammar: "needs_repair",
            contextSufficient: true,
            minimalCorrection: "Changed.",
            correctionSha256: digest("Wrong."),
          },
        ],
      },
    ])
      expect(() =>
        validateCorpusReview(packet, { ...review, ...change }, now),
      ).toThrow();
    const correction = "A necessary test correction.";
    expect(
      validateCorpusReview(
        packet,
        {
          ...review,
          labels: [
            {
              ...label,
              grammar: "needs_repair",
              contextSufficient: true,
              minimalCorrection: correction,
              correctionSha256: digest(correction),
            },
          ],
        },
        now,
      ).count,
    ).toBe(1);
  });

  test("offline form treats corpus HTML as text and never embeds label canaries", () => {
    const rows = [
      { ...inputs[0], text: "</script><img src=x onerror=alert(1)>" },
    ];
    const bytes = JSON.stringify(rows[0]) + "\n";
    const packet = buildBlindPacket(
      bytes,
      { count: 1, sha256: digest(bytes) },
      "seed",
      at,
    ).packet;
    const html = offlineForm(packet, "Independent reviewer A");
    expect(html).not.toContain("</script><img");
    expect(html).toContain("\\u003c/script>");
    expect(html).not.toContain("HIDDEN-GOLD");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("el.textContent=value");
  });
});

const task: PracticeTask = {
  id: "en.c.001.test",
  version: "test",
  constructionId: "en.c.001",
  familyId: "G01",
  itemFamily: "test-family",
  contextId: "test-context",
  rubricVersion: "test-rubric",
  stage: "produce",
  modality: "writing",
  partition: "practice",
  transferCondition: "none",
  contentReview: "authored",
  prompt: "Say that she writes every day.",
  answerPolicy: "open",
  responseKind: "free_output",
  acceptedAnswers: [],
  hints: [],
  solution: null,
  normalisation: {
    nfc: true,
    whitespace: true,
    terminalFullStop: true,
    preserveCase: true,
  },
  sourceId: "synthetic-test-only",
};
const intake = {
  ...taskIntakeTemplate(),
  createdAt: at,
  authoredBy: "test-case-author",
  language: "en",
  contentVersion: "test-content",
  taskId: task.id,
  taskSha256: digest(JSON.stringify(task)),
  response: "She write every day.",
  responseSha256: digest("She write every day."),
  intendedMeaning: "She writes daily.",
  intendedMeaningSource: "learner_supplied",
  intendedMeaningSha256: digest("She writes daily."),
  proposedCorrection: "She writes every day.",
  correctionSha256: digest("She writes every day."),
  sourceId: "test-source",
  license: "test-fixture-only",
  consentEvidence: "test-fixture-no-real-person",
};

async function evidenceRoot() {
  await mkdir(resolve(import.meta.dir, "../artifacts"), { recursive: true });
  return mkdtemp(resolve(import.meta.dir, "../artifacts/r65-review-test-"));
}
async function save(root: string, name: string, value: unknown) {
  const bytes = JSON.stringify(value);
  await writeFile(resolve(root, name), bytes, { flag: "wx" });
  return { path: name, sha256: digest(bytes) };
}
async function reviewFixture(
  root: string,
  id: string,
  correctionMeaning = true,
) {
  const materials = taskReviewMaterials(intake, task, "test-content");
  const label: ReviewLabelForTest = {
    verdict: "needs_repair",
    targetObserved: true,
    meaningPreserved: true,
    note: "Synthetic transport label, not human review evidence.",
  };
  const original = {
    ...materials.originalStage,
    provenance: "human_review",
    independentlyReviewed: true,
    reviewerId: id,
    role: "transport-test-only",
    reviewedAt: "2026-10-03T10:00:00.000Z",
    judgment: label,
  };
  const originalJudgmentEvidence = await save(
    root,
    `${id}-original.json`,
    original,
  );
  const draft = materials.combinedReviewTemplate;
  return {
    ...draft,
    provenance: "human_review",
    reviewerId: id,
    role: "transport-test-only",
    reviewedAt: "2026-10-03T11:00:00.000Z",
    independentlyReviewed: true,
    originalJudgedBeforeCorrection: true,
    originalJudgmentEvidence,
    labels: [
      {
        ...draft.labels[0]!,
        label,
        correction: {
          correctionSha256: intake.correctionSha256,
          grammatical: true,
          meaningPreserved: correctionMeaning,
          targetObserved: true,
          minimal: true,
          note: "Synthetic correction hash transport check.",
        },
      },
    ],
  };
}
interface ReviewLabelForTest {
  verdict: "needs_repair";
  targetObserved: boolean;
  meaningPreserved: boolean;
  note: string;
}

describe("R65 actual-task review intake", () => {
  test("blank intake cannot fabricate task evidence; exact task/meaning/correction hashes are required", () => {
    expect(() =>
      taskDevelopmentManifest(taskIntakeTemplate(), task, "test-content"),
    ).toThrow();
    const manifest = taskDevelopmentManifest(intake, task, "test-content");
    expect(manifest.cases[0]).toMatchObject({
      partition: "development",
      expected: "not_assessed",
      reviews: [],
      adjudicated: false,
    });
    for (const change of [
      { response: "Different" },
      { intendedMeaning: "Different" },
      { proposedCorrection: "Different" },
      { taskSha256: "a".repeat(64) },
      { consentEvidence: null },
    ])
      expect(() =>
        taskDevelopmentManifest({ ...intake, ...change }, task, "test-content"),
      ).toThrow();
    expect(() =>
      taskDevelopmentManifest(
        intake,
        { ...task, partition: "evaluation" },
        "test-content",
      ),
    ).toThrow();
    const materials = taskReviewMaterials(intake, task, "test-content");
    expect(JSON.stringify(materials.originalStage)).not.toContain(
      intake.proposedCorrection,
    );
    expect(materials.originalStage.judgment.verdict).toBeNull();
    expect(materials.correctionStage.originalJudgmentEvidence).toBeNull();
    expect(materials.combinedReviewTemplate.reviewerId).toBeNull();
    expect(caseDigest(manifest.cases[0]!)).toBe(
      materials.originalStage.caseSha256,
    );
  });

  test("reuses recorded two-reviewer validation and refuses missing, duplicated or changed proof", async () => {
    const root = await evidenceRoot();
    const first = await reviewFixture(root, "reviewer-a"),
      second = await reviewFixture(root, "reviewer-b");
    const firstRef = await save(root, "first.json", first),
      secondRef = await save(root, "second.json", second);
    const run = (refs: (typeof firstRef)[]) =>
      validateTaskReviews(root, intake, task, "test-content", refs, null, now);
    await expect(run([firstRef])).rejects.toThrow("Two distinct");
    await expect(run([firstRef, firstRef])).rejects.toThrow("Two distinct");
    expect((await run([firstRef, secondRef])).approved).toBe(false);
    const changed = structuredClone(second);
    changed.labels[0]!.correction.correctionSha256 = "0".repeat(64);
    await expect(
      run([firstRef, await save(root, "changed.json", changed)]),
    ).rejects.toThrow("correction judgment");
    const originalChanged = {
      ...second,
      originalJudgmentEvidence: {
        ...second.originalJudgmentEvidence,
        sha256: "0".repeat(64),
      },
    };
    await expect(
      run([firstRef, await save(root, "proof-changed.json", originalChanged)]),
    ).rejects.toThrow("hash mismatch");
    const draft = blankTaskReview(
      taskDevelopmentManifest(intake, task, "test-content"),
      intake.correctionSha256,
    );
    await expect(
      run([firstRef, await save(root, "blank.json", draft)]),
    ).rejects.toThrow();
  });

  test("a correction disagreement requires a third reviewer rather than silent majority selection", async () => {
    const root = await evidenceRoot();
    const first = await save(
      root,
      "a.json",
      await reviewFixture(root, "reviewer-a"),
    );
    const second = await save(
      root,
      "b.json",
      await reviewFixture(root, "reviewer-b", false),
    );
    await expect(
      validateTaskReviews(
        root,
        intake,
        task,
        "test-content",
        [first, second],
        null,
        now,
      ),
    ).rejects.toThrow("adjudication");
    await expect(
      validateTaskReviews(
        root,
        intake,
        task,
        "test-content",
        [first, second],
        first,
        now,
      ),
    ).rejects.toThrow("third independent");
    const adjudication = await save(
      root,
      "c.json",
      await reviewFixture(root, "reviewer-c"),
    );
    expect(
      (
        await validateTaskReviews(
          root,
          intake,
          task,
          "test-content",
          [first, second],
          adjudication,
          now,
        )
      ).approved,
    ).toBe(false);
  });
});
