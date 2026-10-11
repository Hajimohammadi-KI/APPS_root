import { describe, expect, test } from "bun:test";
import type { AttemptEvent } from "./contracts";
import type { ConstructionUnit, CurriculumPack, PracticeTask } from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import { repairTaskForAttempt, selectDailyTask, selectNextLearningTask } from "./selector";

const at = "2026-10-11T10:00:00.000Z";
const closed: PracticeTask = {
  id: "checked", version: "1", constructionId: "en.c.001", familyId: "G01",
  itemFamily: "checked", contextId: "home", rubricVersion: "1", stage: "retrieve",
  modality: "writing", partition: "practice", transferCondition: "none",
  contentReview: "authored", prompt: "I ___ ready.", answerPolicy: "closed",
  responseKind: "cloze", acceptedAnswers: ["I am ready."], hints: [], solution: "I am ready.",
  normalisation: { nfc: true, whitespace: true, terminalFullStop: true, preserveCase: true },
  sourceId: "fixture",
};
const open: PracticeTask = { ...closed, id: "optional", answerPolicy: "open", acceptedAnswers: undefined };
const speech: PracticeTask = { ...open, id: "speech", modality: "speaking", stage: "produce" };
const unit: ConstructionUnit = {
  id: closed.constructionId, language: "en", title: "Fixture", level: "A1", familyIds: ["G01"],
  prerequisites: [], lessonAlias: "A1::Fixture", rule: "Fixture", examples: [],
  commonError: "Fixture", review: "authored", sources: [], tasks: [open, speech, closed],
};
const pack: CurriculumPack = { version: "1", mappingVersion: "1", language: "en", units: [unit] };
const attempt = (task: PracticeTask): AttemptEvent => ({
  version: 2, type: "attempt", id: `attempt-${task.id}`, language: "en", at, task,
  response: { text: "My original response", sha256: "a".repeat(64), originalTranscriptSha256: null, transcriptEdited: false },
  timing: { startedAt: at, activeMs: null, firstInputMs: null, source: "unavailable" },
  assistance: { hintCount: 0, solutionRevealed: false, exampleSeen: false, selfReportedAssistance: false },
  audio: null, previousAttemptId: null,
});
describe("temporary checked main path", () => {
  test("checked entry and continuation bypass an open first task; all remains compatible", () => {
    const state = reduceAutomaticityEvents([], "en", at);
    expect(selectDailyTask(unit, state, at, "checked").task?.id).toBe(closed.id);
    expect(selectNextLearningTask(pack, state, at, "A1", undefined, "checked")?.task?.id).toBe(closed.id);
    expect(selectDailyTask(unit, state, at).task?.id).toBe(open.id);
  });
  test("construction assessment, empty accepted answers and speaking remain optional", () => {
    const candidates: PracticeTask[] = [open, speech,
      { ...closed, id: "empty", acceptedAnswers: [] },
      { ...closed, id: "parser", constructionAssessment: { constructionId: "en.c.001" } as PracticeTask["constructionAssessment"] },
    ];
    const onlyOptional = { ...unit, tasks: candidates };
    const state = reduceAutomaticityEvents([], "en", at);
    expect(selectDailyTask(onlyOptional, state, at, "checked").task).toBeNull();
    expect(selectNextLearningTask({ ...pack, units: [onlyOptional] }, state, at, "A1", undefined, "checked")).toBeNull();
    expect(selectDailyTask(onlyOptional, state, at, "all").task).not.toBeNull();
  });
  test("open repairs never acquire a checked replacement or a previous-attempt link", () => {
    const original = attempt(open);
    const state = reduceAutomaticityEvents([original], "en", at);
    state.progress[0]!.repairNeeded = true;
    const choice = selectDailyTask(unit, state, at, "checked");
    expect(choice.task?.id).toBe(closed.id);
    expect(choice.previousAttemptId).toBeNull();
    expect(choice.reason).not.toBe("repair");
    expect(repairTaskForAttempt(unit, original, "checked")).toBeNull();
    expect(repairTaskForAttempt(unit, original)?.id).toBe(open.id);
    expect(state.attempts[0]!.attempt.response.text).toBe("My original response");
  });
  test("due optional speech does not suppress a checked writing task", () => {
    const state = reduceAutomaticityEvents([attempt(speech)], "en", at);
    state.progress[0]!.nextReviewAt = "2026-10-10T00:00:00.000Z";
    const choice = selectDailyTask(unit, state, at, "checked");
    expect(choice.task?.id).toBe(closed.id);
    expect(choice.previousAttemptId).toBeNull();
  });
  test("checked repair retains its valid original link and optional scope retains production", () => {
    const original = attempt(closed);
    const state = reduceAutomaticityEvents([original], "en", at);
    state.progress[0]!.repairNeeded = true;
    const repair = { ...closed, id: "closed-repair", stage: "repair" as const };
    const value = { ...unit, tasks: [open, speech, closed, repair] };
    // A rule assessment is required for unresolvedRepairs to contain the original.
    state.attempts[0]!.assessment = {
      version: 2, type: "assessment", id: "failed", language: "en", at,
      attemptId: original.id, responseSha256: original.response.sha256, taskVersion: "1", rubricVersion: "1",
      verdict: "needs_repair", dimensions: { grammar: "fail", target: "unknown", relevance: "unknown", opportunities: null },
      evaluator: { id: "fixture", version: "1", kind: "rule", scopeApproved: false, reviewId: null },
      uncertainty: true, confidence: null, feedback: "Repair", correction: null, spans: [], supersedes: null,
    };
    expect(selectDailyTask(value, state, at, "checked").previousAttemptId).toBe(original.id);
    expect(selectDailyTask({ ...unit, tasks: [speech] }, reduceAutomaticityEvents([], "en", at), at, "all").task?.id).toBe(speech.id);
  });
});
