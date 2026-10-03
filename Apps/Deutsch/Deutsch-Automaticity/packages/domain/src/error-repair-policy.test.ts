import { describe, expect, it } from "bun:test";

import {
  applyErrorRepairHelp,
  applyErrorRepairResult,
  closeErrorRepairHelp,
  normalizeLearnerState,
  STRICT_REPAIR_POLICY_VERSION,
  type ErrorRecord,
} from "./learner-state";
import { createEmptyMasteryRecord } from "./mastery";

const legacyError: ErrorRecord = {
  id: "capitalization",
  date: "2026-10-03T10:00:00.000Z",
  topic: "Nominalisierung",
  original: "Vor dem schlafen liest er zehn Minuten.",
  corrected: "Vor dem Schlafen liest er zehn Minuten.",
  errorClass: "spelling",
  explanation: "Substantivierte Infinitive werden großgeschrieben.",
  occurrenceCount: 3,
  lastSeenAt: 1_791_021_600_000,
  repairStatus: "fixed",
  nextRepairAt: 1_791_108_000_000,
  successfulRepairs: 4,
  critical: true,
};

const DAY = 86_400_000;

function strictResult(
  error: ErrorRecord,
  successful = true,
  checkedAt = error.nextRepairAt,
) {
  return applyErrorRepairResult(error, {
    source: "strict_reference",
    successful,
    checkedAt,
    nextRepairAt: checkedAt + DAY,
  });
}

describe("strict repair policy migration", () => {
  it("preserves old evidence without carrying it into a fresh repair streak", () => {
    const state = normalizeLearnerState({ errors: [legacyError] });
    const migrated = state.errors[0]!;
    expect(migrated.id).toBe(legacyError.id);
    expect(migrated.original).toBe(legacyError.original);
    expect(migrated.corrected).toBe(legacyError.corrected);
    expect(migrated.occurrenceCount).toBe(3);
    expect(migrated.nextRepairAt).toBe(legacyError.nextRepairAt);
    expect(migrated.repairPolicyVersion).toBe(STRICT_REPAIR_POLICY_VERSION);
    expect(migrated.successfulRepairs).toBe(0);
    expect(migrated.repairStatus).toBe("scheduled");
    expect(migrated.repairHistory).toEqual([
      {
        policyVersion: "legacy-unversioned",
        successfulRepairs: 4,
        repairStatus: "fixed",
      },
    ]);
    expect(normalizeLearnerState(JSON.parse(JSON.stringify(state)))).toEqual(
      state,
    );
  });

  it("requires two fresh strict successes even when called on an unmigrated record", () => {
    const once = strictResult(legacyError);
    expect(once.successfulRepairs).toBe(1);
    expect(once.repairStatus).toBe("improving");
    const reloaded = normalizeLearnerState({ errors: [once] }).errors[0]!;
    const twice = strictResult(reloaded);
    expect(twice.successfulRepairs).toBe(2);
    expect(twice.repairStatus).toBe("fixed");
    expect(twice.repairHistory).toEqual(once.repairHistory);
    expect(normalizeLearnerState({ errors: [twice] }).errors[0]).toEqual(twice);
    expect(legacyError.successfulRepairs).toBe(4);
  });

  it("resets a failed strict streak while preserving its historical evidence", () => {
    const once = strictResult(legacyError);
    const failed = strictResult(once, false);
    expect(failed.successfulRepairs).toBe(0);
    expect(failed.repairStatus).toBe("scheduled");
    expect(failed.repairHistory).toEqual(once.repairHistory);
    expect(strictResult(failed).repairStatus).toBe("improving");
  });

  it("legacy review confidence cannot supply the missing strict success", () => {
    const once = strictResult(legacyError);
    const reviewed = applyErrorRepairResult(once, {
      source: "legacy_review",
      successful: true,
      checkedAt: once.nextRepairAt,
      nextRepairAt: once.nextRepairAt + 1_000,
    });
    expect(reviewed.successfulRepairs).toBe(1);
    expect(reviewed.repairStatus).toBe("improving");
    expect(reviewed.nextRepairAt).toBe(once.nextRepairAt + 1_000);
    expect(strictResult(reviewed).repairStatus).toBe("fixed");
    const legacyReviewed = applyErrorRepairResult(legacyError, {
      source: "legacy_review",
      successful: true,
      checkedAt: once.nextRepairAt,
      nextRepairAt: once.nextRepairAt,
    });
    expect(legacyReviewed.successfulRepairs).toBe(0);
    expect(legacyReviewed.repairStatus).toBe("scheduled");
    const earlierReview = applyErrorRepairResult(once, {
      source: "legacy_review",
      successful: true,
      checkedAt: once.nextRepairAt - DAY,
      nextRepairAt: once.nextRepairAt - 1_000,
    });
    expect(earlierReview.nextRepairAt).toBe(once.nextRepairAt);
    expect(
      strictResult(earlierReview, true, once.nextRepairAt - 1)
        .successfulRepairs,
    ).toBe(1);
  });

  it("does not count repeated same-day checks, including after a reload", () => {
    const checkedAt = legacyError.nextRepairAt;
    const once = strictResult(legacyError, true, checkedAt);
    expect(once.successfulRepairs).toBe(1);
    expect(once.nextRepairAt).toBe(checkedAt + DAY);
    expect(strictResult(once, true, checkedAt + 1)).toEqual(once);
    const reloaded = normalizeLearnerState({ errors: [once] }).errors[0]!;
    expect(strictResult(reloaded, true, checkedAt + DAY - 1)).toEqual(once);
    const due = strictResult(reloaded, true, checkedAt + DAY);
    expect(due.successfulRepairs).toBe(2);
    expect(due.repairStatus).toBe("fixed");
    expect(due.nextRepairAt).toBe(checkedAt + 2 * DAY);
  });

  it("a failed same-day check resets the streak before the next repair date", () => {
    const checkedAt = legacyError.nextRepairAt;
    const once = strictResult(legacyError, true, checkedAt);
    const failed = strictResult(once, false, checkedAt + 1_000);
    expect(failed.successfulRepairs).toBe(0);
    expect(failed.repairStatus).toBe("scheduled");
    expect(failed.nextRepairAt).toBe(checkedAt + 1_000 + DAY);
    expect(
      strictResult(failed, true, checkedAt + 2_000).successfulRepairs,
    ).toBe(0);
    const reloaded = normalizeLearnerState({ errors: [failed] }).errors[0]!;
    expect(strictResult(reloaded, true, failed.nextRepairAt - 1)).toEqual(
      reloaded,
    );
    expect(strictResult(reloaded).successfulRepairs).toBe(1);
  });

  it("help blocks first-success copying and reloads until a delayed fresh check", () => {
    const helpedAt = legacyError.nextRepairAt;
    const helped = applyErrorRepairHelp(legacyError, helpedAt);
    expect(helped.lastRepairHelpAt).toBe(helpedAt);
    expect(helped.successfulRepairs).toBe(0);
    expect(helped.nextRepairAt).toBe(helpedAt + DAY);
    expect(strictResult(helped, true, helpedAt + 1)).toEqual(helped);
    expect(
      strictResult({ ...helped, nextRepairAt: helpedAt }, true, helpedAt + 1)
        .successfulRepairs,
    ).toBe(0);
    const reloaded = normalizeLearnerState(
      JSON.parse(JSON.stringify({ errors: [helped] })),
    ).errors[0]!;
    expect(reloaded.lastRepairHelpAt).toBe(helpedAt);
    expect(strictResult(reloaded, true, helpedAt + DAY - 1)).toEqual(reloaded);
    expect(strictResult(reloaded).successfulRepairs).toBe(0);
    const closed = closeErrorRepairHelp(reloaded, helpedAt + 1_000);
    expect(strictResult(closed, true, closed.nextRepairAt - 1)).toEqual(closed);
    expect(strictResult(closed).successfulRepairs).toBe(1);
    expect(strictResult(closed).repairStatus).toBe("improving");
  });

  it("help preserves an earlier valid success and history without shortening its delay", () => {
    const once = strictResult(legacyError);
    const helpedAt = once.nextRepairAt - DAY + 1_000;
    const helped = applyErrorRepairHelp(once, helpedAt);
    expect(helped.successfulRepairs).toBe(1);
    expect(helped.repairStatus).toBe("improving");
    expect(helped.repairHistory).toEqual(once.repairHistory);
    expect(helped.nextRepairAt).toBe(helpedAt + DAY);
    const helpedAgain = applyErrorRepairHelp(helped, helpedAt + 1_000);
    expect(helpedAgain.nextRepairAt).toBe(helpedAt + 1_000 + DAY);
    expect(
      strictResult(helpedAgain, true, helped.nextRepairAt).successfulRepairs,
    ).toBe(1);
    const imported = normalizeLearnerState({
      errors: [{ ...helpedAgain, nextRepairAt: 0 }],
    }).errors[0]!;
    expect(imported.nextRepairAt).toBe(helpedAgain.nextRepairAt);
    expect(strictResult(imported).repairStatus).toBe("improving");
    const closed = closeErrorRepairHelp(imported, helpedAt + 2_000);
    expect(strictResult(closed).repairStatus).toBe("fixed");
  });

  it("keeps overnight open help unqualified through reload and starts recall delay on closing", () => {
    const openedAt = legacyError.nextRepairAt;
    const open = applyErrorRepairHelp(legacyError, openedAt);
    expect(open.repairHelpOpen).toBe(true);
    const tomorrow = openedAt + DAY + 60_000;
    expect(strictResult(open, true, tomorrow).successfulRepairs).toBe(0);
    const reloaded = normalizeLearnerState(
      JSON.parse(JSON.stringify({ errors: [open] })),
    ).errors[0]!;
    expect(reloaded.repairHelpOpen).toBe(true);
    expect(strictResult(reloaded, true, tomorrow).successfulRepairs).toBe(0);
    const closed = closeErrorRepairHelp(reloaded, tomorrow);
    expect(closed.repairHelpOpen).toBe(false);
    expect(closed.lastRepairHelpAt).toBe(tomorrow);
    expect(closed.nextRepairAt).toBe(tomorrow + DAY);
    expect(strictResult(closed, true, tomorrow + 1).successfulRepairs).toBe(0);
    const closedReload = normalizeLearnerState({ errors: [closed] }).errors[0]!;
    expect(closeErrorRepairHelp(closedReload, tomorrow + 2_000)).toEqual(
      closedReload,
    );
    expect(strictResult(closedReload).successfulRepairs).toBe(1);
    expect(closedReload.repairHistory).toEqual(open.repairHistory);
  });

  it("exposing a newly created or recurring correction blocks immediate repair credit", () => {
    const now = legacyError.nextRepairAt;
    for (const repairStatus of ["new", "scheduled"] as const) {
      const error: ErrorRecord = {
        ...legacyError,
        repairPolicyVersion: STRICT_REPAIR_POLICY_VERSION,
        repairStatus,
        successfulRepairs: 0,
        nextRepairAt: now,
      };
      const exposed = applyErrorRepairHelp(error, now);
      expect(exposed.repairHelpOpen).toBe(true);
      expect(exposed.nextRepairAt).toBe(now + DAY);
      expect(strictResult(exposed, true, now + 1).successfulRepairs).toBe(0);
      expect(strictResult(exposed, true, now + 2 * DAY).successfulRepairs).toBe(
        0,
      );
    }
  });

  it("recomputes cached critical errors when historical fixed errors reopen", () => {
    const state = normalizeLearnerState({
      errors: [
        legacyError,
        { ...legacyError, id: "noncritical", critical: false },
      ],
      mastery: {
        Nominalisierung: {
          ...createEmptyMasteryRecord(),
          activeCriticalErrors: 0,
        },
        Other: { ...createEmptyMasteryRecord(), activeCriticalErrors: 5 },
      },
    });
    expect(state.mastery.Nominalisierung?.activeCriticalErrors).toBe(1);
    expect(state.mastery.Other?.activeCriticalErrors).toBe(5);
    const fixed = strictResult(strictResult(state.errors[0]!));
    const updated = normalizeLearnerState({ ...state, errors: [fixed] });
    expect(updated.mastery.Nominalisierung?.activeCriticalErrors).toBe(0);
    expect(updated.errors).toHaveLength(1);
  });

  it("does not promote imported mastery when its historical critical errors lack detail", () => {
    const imported = {
      errors: [],
      mastery: {
        Perfekt: {
          ...createEmptyMasteryRecord(),
          status: "stable",
          scores: {
            recognition: 100,
            writing: 100,
            speaking: 100,
            repair: 100,
            transfer: 100,
            automaticity: 90,
          },
          successfulReviews: 2,
          responseLatenciesMs: [1_000],
          activeCriticalErrors: 5,
        },
      },
    };
    const state = normalizeLearnerState(imported);
    expect(state.mastery.Perfekt?.activeCriticalErrors).toBe(5);
    expect(state.mastery.Perfekt?.status).toBe("stable");
    expect(normalizeLearnerState(JSON.parse(JSON.stringify(state)))).toEqual(
      state,
    );
  });

  it("archives another policy once and rejects malformed current fixed evidence", () => {
    const prior = { ...legacyError, repairPolicyVersion: "reference-v0" };
    const migrated = normalizeLearnerState({ errors: [prior] }).errors[0]!;
    expect(migrated.repairHistory?.[0]?.policyVersion).toBe("reference-v0");
    const current = normalizeLearnerState({
      errors: [{ ...migrated, successfulRepairs: 1, repairStatus: "fixed" }],
    }).errors[0]!;
    expect(current.repairStatus).toBe("improving");
    expect(current.repairHistory).toEqual(migrated.repairHistory);
  });
});
