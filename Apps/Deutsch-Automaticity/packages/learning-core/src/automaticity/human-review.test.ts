import { expect, test } from "bun:test";
import { qualifyHumanReview, type HumanReviewManifest } from "./human-review";
import { sha256 } from "./backup";
import type { AttemptEvent, Language } from "./contracts";
import type { CurriculumPack, PracticeTask } from "./curriculum";
async function fixture(language: Language = "en", speaking = false) {
  const task: PracticeTask = {
    id: "reviewed-task",
    version: "1",
    constructionId: `${language}.c.001`,
    familyId: "G01",
    itemFamily: "family",
    contextId: "context",
    rubricVersion: "1",
    stage: "produce",
    modality: speaking ? "speaking" : "writing",
    partition: "practice",
    transferCondition: "none",
    contentReview: "human_reviewed",
    prompt: "Synthetic engineering test",
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
    sourceId: "test",
  };
  const pack: CurriculumPack = {
    language,
    version: "1",
    mappingVersion: "1",
    units: [
      {
        id: task.constructionId,
        language,
        title: "Test",
        level: "A1",
        familyIds: ["G01"],
        prerequisites: [],
        lessonAlias: "test",
        rule: "test",
        examples: [],
        commonError: "test",
        review: "human_reviewed",
        sources: [],
        tasks: [task],
      },
    ],
  };
  const at = "2026-09-05T12:00:00Z",
    hash = await sha256("Synthetic answer"),
    attempt: AttemptEvent = {
      version: 2,
      type: "attempt",
      id: "answer",
      language,
      at,
      task: { ...task, definitionSha256: await sha256(JSON.stringify(task)) },
      response: {
        text: "Synthetic answer",
        sha256: hash,
        originalTranscriptSha256: speaking ? hash : null,
        transcriptEdited: false,
      },
      timing: {
        startedAt: at,
        activeMs: null,
        firstInputMs: null,
        source: "unavailable",
      },
      assistance: {
        hintCount: 0,
        solutionRevealed: false,
        exampleSeen: false,
        selfReportedAssistance: false,
      },
      audio: speaking
        ? {
            id: "audio",
            sha256: "a".repeat(64),
            bytes: 3,
            durationMs: 1000,
            mime: "audio/webm",
            persisted: true,
          }
        : null,
      previousAttemptId: null,
    };
  const manifest: HumanReviewManifest = {
    schemaVersion: 1,
    language,
    contentVersion: "1",
    mappingVersion: "1",
    curriculumSha256: await sha256(JSON.stringify(pack) + "\n"),
    scopes: [
      {
        taskId: task.id,
        taskVersion: "1",
        rubricVersion: "1",
        definitionSha256: attempt.task.definitionSha256!,
        reviewerName: "Independent reviewer",
        evaluatorId: "documented-procedure",
        evaluatorVersion: "1",
        reviewId: "synthetic-review-only",
        approvedAt: "2026-09-04T12:00:00Z",
      },
    ],
  };
  return { task, pack, attempt, manifest, at };
}
for (const language of ["en", "de"] as const)
  test(`${language}: exact reviewed definition and named approved procedure can qualify human feedback`, async () => {
    const f = await fixture(language),
      before = JSON.stringify(f),
      result = await qualifyHumanReview(
        f.attempt,
        f.pack,
        f.manifest,
        "Independent reviewer",
        f.at,
      );
    expect(result).toEqual({
      id: "documented-procedure",
      version: "1",
      kind: "human",
      scopeApproved: true,
      reviewId: "synthetic-review-only",
    });
    expect(JSON.stringify(f)).toBe(before);
  });
test("flags, wrong reviewer, changed content, stale scopes, duplicated approvals and retrospective approval cannot qualify", async () => {
  const changes = [
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.scopes = [];
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.language = "de";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.contentVersion = "2";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.mappingVersion = "2";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.scopes[0]!.reviewerName = "someone else";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.scopes.push(f.manifest.scopes[0]!);
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.manifest.scopes[0]!.approvedAt = "2026-09-06T12:00:00Z";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.task.prompt += " changed";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.attempt.task.definitionSha256 = undefined;
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.attempt.task.contentReview = "authored";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.attempt.task.modality = "speaking";
    },
    (f: Awaited<ReturnType<typeof fixture>>) => {
      f.attempt.response.text = "changed";
    },
  ];
  for (const change of changes) {
    const f = await fixture();
    change(f);
    expect(
      await qualifyHumanReview(
        f.attempt,
        f.pack,
        f.manifest,
        "Independent reviewer",
        f.at,
      ),
    ).toBeNull();
  }
});
test("speaking requires original audio review and an unedited bound transcript", async () => {
  const f = await fixture("en", true),
    review = { sha256: f.attempt.audio!.sha256, confirmed: true };
  expect(
    await qualifyHumanReview(
      f.attempt,
      f.pack,
      f.manifest,
      "Independent reviewer",
      f.at,
    ),
  ).toBeNull();
  expect(
    (
      await qualifyHumanReview(
        f.attempt,
        f.pack,
        f.manifest,
        "Independent reviewer",
        f.at,
        review,
      )
    )?.scopeApproved,
  ).toBe(true);
  expect(
    await qualifyHumanReview(
      f.attempt,
      f.pack,
      f.manifest,
      "Independent reviewer",
      f.at,
      { ...review, sha256: "b".repeat(64) },
    ),
  ).toBeNull();
  f.attempt.response.transcriptEdited = true;
  expect(
    await qualifyHumanReview(
      f.attempt,
      f.pack,
      f.manifest,
      "Independent reviewer",
      f.at,
      review,
    ),
  ).toBeNull();
});
