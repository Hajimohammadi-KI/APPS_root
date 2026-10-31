import { expect, test } from "bun:test";
import {
  prepareTrainingCandidate,
  TRAINING_CONTRIBUTION_POLICY,
} from "./training-contribution";
import {
  collectAssessmentFeedback,
  type AssessmentFeedback,
} from "./assessment-feedback";
import { sha256 } from "./backup";
import { assessControlledTask } from "./assessment";
import type { AttemptEvent } from "./contracts";
import type { CurriculumPack, PracticeTask } from "./curriculum";

async function fixture(language: "en" | "de", level: string) {
  const task: PracticeTask = {
    id: `${language}.c.001.retrieve.0.writing`,
    version: "synthetic-1",
    constructionId: `${language}.c.001`,
    familyId: "G01",
    itemFamily: "synthetic",
    contextId: "synthetic",
    rubricVersion: "synthetic",
    stage: "retrieve",
    modality: "writing",
    partition: "practice",
    transferCondition: "none",
    contentReview: "authored",
    prompt: "Synthetic test only",
    answerPolicy: "closed",
    responseKind: "cloze",
    acceptedAnswers: ["Synthetic original: name@example.org"],
    hints: [],
    solution: "Synthetic original: name@example.org",
    normalisation: {
      nfc: true,
      whitespace: true,
      terminalFullStop: true,
      preserveCase: true,
    },
    sourceId: "synthetic",
  };
  const pack = {
    language,
    version: "synthetic-pack",
    units: [{ id: task.constructionId, level, tasks: [task] }],
  } as CurriculumPack;
  const at = "2026-10-31T10:00:00.000Z";
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "private-attempt",
    language,
    at,
    task: { ...task, definitionSha256: await sha256(JSON.stringify(task)) },
    response: {
      text: task.acceptedAnswers[0]!,
      sha256: await sha256(task.acceptedAnswers[0]!),
      originalTranscriptSha256: null,
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
    audio: null,
    previousAttemptId: null,
  };
  const automated = assessControlledTask(
    attempt,
    task,
    "2026-10-31T10:00:01.000Z",
    "private-machine",
  );
  const review = {
    ...automated,
    id: "private-review",
    at: "2026-10-31T10:00:02.000Z",
    feedback: "Private Reviewer Name disagrees",
    evaluator: {
      id: "private-person",
      kind: "human" as const,
      version: "1",
      reviewId: "private-reviewer",
      scopeApproved: false,
    },
    supersedes: automated.id,
  };
  const report = await collectAssessmentFeedback(
    [attempt, automated, review],
    pack,
    "2026-10-31T10:01:00.000Z",
  );
  expect(report.cases).toHaveLength(1);
  return {
    pack,
    report,
    input: {
      caseId: review.id,
      responseText: "A redacted example.",
      reviewText: "Please check the agreement.",
      contributionId: "11111111-1111-4111-8111-111111111111",
      at: "2026-10-31T10:02:00.000Z",
      consent: {
        granted: true,
        purpose: "assessment-model-development" as const,
        policyVersion: TRAINING_CONTRIBUTION_POLICY,
      },
    },
  };
}
for (const language of ["en", "de"] as const)
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"])
    test(`R100/R101 ${language}/${level}: only the selected preview is exported; no user feedback becomes a gold label`, async () => {
      const { pack, report, input } = await fixture(language, level);
      const original = JSON.stringify(report);
      const result = await prepareTrainingCandidate(report, pack, input);
      expect(result.language).toBe(language);
      expect(result.level).toBe(level);
      expect(result.response.text).toBe(input.responseText);
      expect(result.response.sha256).toBe(await sha256(input.responseText));
      expect(result.unverifiedFeedback.text).toBe(input.reviewText);
      expect(result.originalJudgment.appliesToPreview).toBe(false);
      expect(result.readyForTraining).toBe(false);
      expect(result.independentReviewEstablished).toBe(false);
      expect(result.label).toBeNull();
      expect(result.partition).toBe("unassigned");
      const bytes = JSON.stringify(result);
      for (const privateValue of [
        "name@example.org",
        "Private Reviewer Name",
        "private-person",
        "private-reviewer",
        "private-attempt",
        "private-review",
      ])
        expect(bytes).not.toContain(privateValue);
      expect(JSON.stringify(report)).toBe(original);
    });
test("R101 consent is separate, current and explicit; text/audio consent cannot substitute", async () => {
  const { report, pack, input } = await fixture("en", "A1");
  for (const consent of [
    undefined,
    { ...input.consent, granted: false },
    { ...input.consent, purpose: "fsrs_shadow" },
    { ...input.consent, policyVersion: "old" },
    { storeAudio: true, allowOnlineAI: true },
  ])
    await expect(
      prepareTrainingCandidate(report, pack, { ...input, consent } as never),
    ).rejects.toThrow("consent");
});
test("R100 rejects stale scopes, wrong languages, unknown levels and unsupported previews", async () => {
  const { report, pack, input } = await fixture("en", "A1");
  await expect(
    prepareTrainingCandidate(report, pack, { ...input, caseId: "missing" }),
  ).rejects.toThrow();
  await expect(
    prepareTrainingCandidate(report, pack, { ...input, responseText: " " }),
  ).rejects.toThrow();
  await expect(
    prepareTrainingCandidate(report, pack, {
      ...input,
      responseText: "a".repeat(8001),
    }),
  ).rejects.toThrow();
  await expect(
    prepareTrainingCandidate(
      { ...report, language: "de" } as AssessmentFeedback,
      pack,
      input,
    ),
  ).rejects.toThrow();
  const changed = structuredClone(pack);
  changed.units[0]!.tasks[0]!.version = "changed";
  await expect(
    prepareTrainingCandidate(report, changed, input),
  ).rejects.toThrow();
  const invalidLevel = structuredClone(pack);
  invalidLevel.units[0]!.level = "C3";
  await expect(
    prepareTrainingCandidate(report, invalidLevel, input),
  ).rejects.toThrow();
  const spoken = structuredClone(report);
  spoken.cases[0]!.attempt.task.modality = "speaking";
  await expect(prepareTrainingCandidate(spoken, pack, input)).rejects.toThrow();
});
