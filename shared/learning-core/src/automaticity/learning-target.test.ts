import { describe, expect, test } from "bun:test";
import type {
  AttemptEvent,
  AssessmentEvent,
  AutomaticityEvent,
  Modality,
} from "./contracts";
import type {
  ConstructionUnit,
  CurriculumPack,
  PracticeTask,
} from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import { constructionTargetMet, learningTarget } from "./learning-target";
import { selectNextLearningTask } from "./selector";

const now = "2026-10-02T12:00:00.000Z";
const hash = "a".repeat(64);
const task: PracticeTask = {
  id: "fixture",
  version: "1",
  constructionId: "en.c.001",
  familyId: "G01",
  itemFamily: "fixture",
  contextId: "fixture",
  rubricVersion: "1",
  stage: "transfer",
  modality: "writing",
  partition: "practice",
  transferCondition: "elicited",
  contentReview: "human_reviewed",
  prompt: "Synthetic test only",
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
  sourceId: "synthetic-test",
};
const unit: ConstructionUnit = {
  id: "en.c.001",
  language: "en",
  title: "Fixture",
  level: "A1",
  familyIds: ["G01"],
  prerequisites: [],
  lessonAlias: "fixture",
  rule: "Fixture",
  examples: [],
  commonError: "Fixture",
  review: "human_reviewed",
  sources: [],
  tasks: [task],
};
function sample(
  index: number,
  success = true,
  modality: Modality = "writing",
  step = 2 * 86400000,
): [AttemptEvent, AssessmentEvent] {
  const at = new Date(
    Date.parse("2026-08-01T10:00:00Z") + index * step,
  ).toISOString();
  const id = `${modality}-${index}`;
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id,
    language: "en",
    at,
    task: { ...task, id, itemFamily: id, contextId: id, modality },
    response: {
      text: "Synthetic response",
      sha256: hash,
      originalTranscriptSha256: modality === "speaking" ? hash : null,
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
    audio:
      modality === "speaking"
        ? {
            id: `audio-${id}`,
            sha256: hash,
            bytes: 100,
            durationMs: 3000,
            mime: "audio/webm",
            persisted: true,
          }
        : null,
    previousAttemptId: null,
  };
  const assessment: AssessmentEvent = {
    version: 2,
    type: "assessment",
    id: `check-${id}`,
    language: "en",
    at,
    attemptId: id,
    responseSha256: hash,
    taskVersion: "1",
    rubricVersion: "1",
    verdict: success ? "pass" : "needs_repair",
    dimensions: {
      grammar: success ? "pass" : "fail",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      kind: "human",
      id: "synthetic-reviewer",
      version: "1",
      scopeApproved: true,
      reviewId: "synthetic-review",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic test only",
    correction: null,
    spans: [],
    supersedes: null,
  };
  return [attempt, assessment];
}
const samples = (count = 20, correct = count, mode: Modality = "writing") =>
  Array.from({ length: count }, (_, index) =>
    sample(index, index < correct, mode),
  ).flat();
function reduce(events: AutomaticityEvent[]) {
  const state = reduceAutomaticityEvents(events, "en", now);
  expect(state.rejected).toEqual([]);
  return state;
}
function repairFailures(events: AutomaticityEvent[]): AutomaticityEvent[] {
  const extra: AutomaticityEvent[] = [];
  for (const event of events) {
    if (event.type !== "assessment" || event.verdict !== "needs_repair")
      continue;
    const original = events.find(
      (row): row is AttemptEvent =>
        row.type === "attempt" && row.id === event.attemptId,
    )!;
    const fixed = structuredClone(original);
    fixed.id += "-repair";
    fixed.at = "2026-09-30T10:00:00.000Z";
    fixed.timing.startedAt = fixed.at;
    fixed.previousAttemptId = original.id;
    fixed.assistance.selfReportedAssistance = true;
    extra.push(fixed, {
      ...event,
      id: `check-${fixed.id}`,
      at: fixed.at,
      attemptId: fixed.id,
      verdict: "pass",
      dimensions: { ...event.dimensions, grammar: "pass" },
    });
  }
  return [...events, ...extra];
}

describe("90 percent learning target", () => {
  test("empty evidence and nineteen perfect responses are insufficient", () => {
    expect(learningTarget(reduce([]), unit.id, "writing")).toMatchObject({
      met: false,
      accuracy: null,
      checked: 0,
    });
    expect(
      learningTarget(reduce(samples(19)), unit.id, "writing"),
    ).toMatchObject({ met: false, accuracy: 1, checked: 19 });
  });
  test("18 of 20 reaches the accuracy criterion only after outstanding errors are repaired", () => {
    const events = samples(20, 18);
    expect(learningTarget(reduce(events), unit.id, "writing")).toMatchObject({
      met: false,
      accuracy: 0.9,
      repairs: 2,
    });
    expect(
      learningTarget(reduce(repairFailures(events)), unit.id, "writing"),
    ).toMatchObject({ met: true, accuracy: 0.9, checked: 20, repairs: 0 });
  });
  test("17 of 20 remains below target even after assisted corrections", () => {
    expect(
      learningTarget(
        reduce(repairFailures(samples(20, 17))),
        unit.id,
        "writing",
      ),
    ).toMatchObject({ met: false, accuracy: 0.85, checked: 20 });
  });
  test("older perfect responses cannot hide recent failures", () => {
    expect(
      learningTarget(
        reduce(repairFailures(samples(23, 20))),
        unit.id,
        "writing",
      ),
    ).toMatchObject({ met: false, accuracy: 0.85, checked: 20 });
  });
  test("helped work, unapproved checks and self-checks cannot complete the target", () => {
    for (const reason of ["help", "unapproved", "self"] as const) {
      const events = samples();
      for (const event of events) {
        if (event.type === "attempt" && reason === "help")
          event.assistance.hintCount = 1;
        if (event.type === "assessment" && reason === "unapproved")
          event.evaluator.scopeApproved = false;
        if (event.type === "assessment" && reason === "self")
          event.evaluator.kind = "self";
      }
      expect(learningTarget(reduce(events), unit.id, "writing")).toMatchObject({
        met: false,
        checked: 0,
        accuracy: null,
      });
    }
  });
  test("one sitting does not establish delayed recall", () => {
    const state = reduce(
      Array.from({ length: 20 }, (_, index) =>
        sample(index, true, "writing", 60000),
      ).flat(),
    );
    expect(learningTarget(state, unit.id, "writing")).toMatchObject({
      met: false,
      checked: 20,
      delayedDays: 0,
    });
  });
  test("a prompt naming the grammar does not count as unprompted transfer", () => {
    const events = samples();
    for (const event of events)
      if (event.type === "attempt")
        event.task.transferCondition = "target_named";
    expect(learningTarget(reduce(events), unit.id, "writing")).toMatchObject({
      met: false,
      checked: 20,
      newContexts: 0,
    });
  });
  test("writing cannot fill speaking requirements; typed speech without audio is ineligible", () => {
    const bothModes = {
      ...unit,
      tasks: [
        task,
        { ...task, id: "speech-task", modality: "speaking" as const },
      ],
    };
    expect(constructionTargetMet(reduce(samples()), bothModes)).toBe(false);
    expect(
      constructionTargetMet(
        reduce([...samples(), ...samples(20, 20, "speaking")]),
        bothModes,
      ),
    ).toBe(true);
    const typed = samples(20, 20, "speaking");
    for (const event of typed) if (event.type === "attempt") event.audio = null;
    expect(learningTarget(reduce(typed), unit.id, "speaking").checked).toBe(0);
    expect(constructionTargetMet(reduce(samples()), unit)).toBe(true);
  });
  test("an invalidated check immediately removes target completion", () => {
    const events: AutomaticityEvent[] = [
      ...samples(),
      {
        version: 2,
        type: "invalidation",
        id: "undo",
        language: "en",
        at: now,
        assessmentId: "check-writing-19",
        reason: "review_overturned",
        note: "Synthetic test",
      },
    ];
    expect(learningTarget(reduce(events), unit.id, "writing")).toMatchObject({
      met: false,
      checked: 19,
    });
  });
  test("the next recommendation moves beyond a completed topic while preserving due-review priority", () => {
    const other = {
      ...unit,
      id: "en.c.002",
      tasks: [
        {
          ...task,
          id: "other",
          constructionId: "en.c.002",
          stage: "retrieve" as const,
        },
      ],
    };
    const pack: CurriculumPack = {
      language: "en",
      version: "1",
      mappingVersion: "1",
      units: [
        {
          ...unit,
          tasks: [
            task,
            {
              ...task,
              id: "retention-fixture",
              stage: "retain",
              transferCondition: "none",
            },
          ],
        },
        other,
      ],
    };
    const state = reduce(samples());
    expect(
      selectNextLearningTask(pack, state, now, "A1", unit.id)?.unit.id,
    ).toBe(other.id);
    expect(
      selectNextLearningTask(pack, state, "2026-10-12T12:00:00Z", "A1", unit.id)
        ?.unit.id,
    ).toBe(unit.id);
  });
});
