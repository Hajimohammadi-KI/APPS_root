import { describe, expect, it } from "bun:test";
import { grammarUnits } from "@grammar/content";
import {
  createEmptyMasteryRecord,
  createInitialLearnerState,
  type LearnerState,
  type MasteryRecord,
} from "@grammar/domain";

import { getDailyPlan, getTodayKey } from "@grammar/domain";

import {
  advanceDailyGrammar,
  applyCompleteDailyStep,
  CEFR_ORDER,
  pickNextGrammarUnit,
} from "./learner-state-provider";

function automaticMastery(): MasteryRecord {
  return { ...createEmptyMasteryRecord(), status: "automatic" };
}

function baseState(level: (typeof CEFR_ORDER)[number]): LearnerState {
  const initial = createInitialLearnerState();
  return {
    ...initial,
    learner: {
      ...initial.learner,
      selfDeclaredLevel: level,
      verifiedLevel: null,
    },
    learningLevel: level,
  };
}

describe("daily grammar auto-progression (German)", () => {
  it("does nothing for a topic that is still in progress", () => {
    const state = baseState("A1");
    const [firstA1] = grammarUnits.filter((unit) => unit.level === "A1");
    const withTopic: LearnerState = {
      ...state,
      todayGrammar: { title: firstA1!.title, level: "A1", date: "2026-01-01" },
      mastery: {
        [firstA1!.title]: { ...automaticMastery(), status: "learning" },
      },
    };

    const result = advanceDailyGrammar(withTopic, null);

    expect(result.todayGrammar?.title).toBe(firstA1!.title);
  });

  it("moves to the next un-mastered unit once the current one is automatic", () => {
    const state = baseState("A1");
    const a1Units = grammarUnits.filter((unit) => unit.level === "A1");
    expect(a1Units.length).toBeGreaterThan(1);
    const withTopic: LearnerState = {
      ...state,
      todayGrammar: {
        title: a1Units[0]!.title,
        level: "A1",
        date: "2026-01-01",
      },
      mastery: { [a1Units[0]!.title]: automaticMastery() },
    };

    const result = advanceDailyGrammar(withTopic, null);

    expect(result.todayGrammar?.title).not.toBe(a1Units[0]!.title);
    expect(result.todayGrammar?.level).toBe("A1");
  });

  it("advances the learning level once every unit in it is verified automatic", () => {
    const state = baseState("A1");
    const a1Units = grammarUnits.filter((unit) => unit.level === "A1");
    const mastery: Record<string, MasteryRecord> = {};
    for (const unit of a1Units) mastery[unit.title] = automaticMastery();
    const last = a1Units[a1Units.length - 1]!;
    const withTopic: LearnerState = {
      ...state,
      todayGrammar: { title: last.title, level: "A1", date: "2026-01-01" },
      mastery,
    };

    const result = advanceDailyGrammar(withTopic, "A1");

    const nextLevel = CEFR_ORDER[CEFR_ORDER.indexOf("A1") + 1]!;
    expect(result.learningLevel).toBe(nextLevel);
    expect(result.todayGrammar?.level).toBe(nextLevel);
  });

  it("pickNextGrammarUnit returns null once the whole catalogue is mastered", () => {
    const state = baseState("C2");
    const mastery: Record<string, MasteryRecord> = {};
    for (const unit of grammarUnits) mastery[unit.title] = automaticMastery();
    expect(pickNextGrammarUnit({ ...state, mastery })).toBeNull();
  });
});

describe("applyCompleteDailyStep", () => {
  // Regression coverage for a real bug: completeDailyStep -- the only
  // function that ever writes to plan.completed, which Home's "heutige
  // Uebung" progress percentage reads -- had zero call sites anywhere in
  // automaticity-lab.tsx. A learner could finish all three real Mission
  // steps and Home would still show 0% forever.
  it("records the first completed step and updates today's activity count", () => {
    const state = baseState("A1");
    const next = applyCompleteDailyStep(state, 0);
    const plan = getDailyPlan(next, getTodayKey());
    expect(plan.completed).toEqual([0]);
    expect(next.activity[getTodayKey()]).toBe(1);
  });

  it("accumulates completed steps in order, matching Home's completed.length / 3 progress calculation", () => {
    let state = baseState("A1");
    state = applyCompleteDailyStep(state, 0);
    state = applyCompleteDailyStep(state, 1);
    state = applyCompleteDailyStep(state, 2);
    const plan = getDailyPlan(state, getTodayKey());
    expect(plan.completed).toEqual([0, 1, 2]);
  });

  it("does not record a later step out of order (matches canCompleteDailyStep's sequential gate)", () => {
    const state = baseState("A1");
    // Step 2 requires 0 and 1 to already be complete -- neither is here.
    const next = applyCompleteDailyStep(state, 2);
    const plan = getDailyPlan(next, getTodayKey());
    expect(plan.completed).toEqual([]);
  });

  it("is idempotent -- completing the same step twice does not double-count it", () => {
    let state = baseState("A1");
    state = applyCompleteDailyStep(state, 0);
    state = applyCompleteDailyStep(state, 0);
    const plan = getDailyPlan(state, getTodayKey());
    expect(plan.completed).toEqual([0]);
    expect(state.activity[getTodayKey()]).toBe(1);
  });
});
