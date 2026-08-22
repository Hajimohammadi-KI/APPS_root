import {
  filterDailyPlanEligibleMediationContent,
  type MediationContentPilotItem,
} from "@automaticity/learning-core";

/**
 * Authored B1 mediation pilot. It is intentionally quarantined from daily
 * planning until two independent humans complete the fixed QA rubric.
 */
export const englishMediationB1Pilot = [
  {
    schemaVersion: "1.0.0",
    id: "en:authored:b1:mediation:library-workshop-change",
    version: "1.0.0-draft.1",
    language: "en",
    cefrLevel: "B1",
    title: "Relay a workshop change",
    targetForm: "Select and relay essential information in your own words",
    prompt:
      "Explain the schedule change and the required preparation to a classmate who missed the notice.",
    modes: ["mediation", "speaking", "writing", "transfer"],
    provenance: {
      kind: "authored",
      sourceId: "automaticity-b1-mediation-pilot-en",
      license: "proprietary-authored",
      humanReviewed: false,
    },
    mediation: {
      activity: "relaying-specific-information",
      sourceText:
        "Saturday's library workshop has moved from 10:00 to 11:30 because the main room is unavailable. Participants should bring a charged laptop. Registration remains valid.",
      guidedPrompt:
        "First identify the new time, the reason for the change, what participants need, and what has not changed.",
      independentPrompt:
        "Now explain the notice naturally in two or three sentences without copying it.",
      novelTransferPrompt:
        "A friend missed a sports-club update. Ask for a short new notice, then relay only the changes that affect the friend.",
    },
    quality: {
      rubricVersion: "1.0.0",
      status: "awaiting-human-review",
      reviews: [],
    },
  },
] as const satisfies readonly MediationContentPilotItem[];

/** Empty by design until the human-review gate passes. */
export const releasedEnglishMediationB1 =
  filterDailyPlanEligibleMediationContent(englishMediationB1Pilot);
