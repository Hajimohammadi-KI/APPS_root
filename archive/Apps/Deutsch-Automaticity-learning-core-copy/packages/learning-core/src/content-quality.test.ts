import { describe, expect, test } from "bun:test";
import {
  assessMediationContentRelease,
  calculateQuadraticWeightedKappa,
  CONTENT_AGREEMENT_METHOD,
  filterDailyPlanEligibleMediationContent,
  hasVerbatimPhraseOverlap,
  type ContentHumanReview,
  type MediationContentPilotItem,
} from "./content-quality";

const baseReview: ContentHumanReview = {
  reviewerId: "reviewer-native-01",
  roles: ["native-speaker"],
  reviewedAt: "2026-08-22T09:00:00.000Z",
  decision: "approve",
  scores: {
    naturalness: 4,
    cefrFit: 4,
    taskValidity: 4,
    culturalSafety: 4,
  },
};

function reviewedFixture(
  overrides: Partial<MediationContentPilotItem["quality"]> = {},
): MediationContentPilotItem {
  return {
    schemaVersion: "1.0.0",
    id: "en:authored:b1:mediation:test",
    version: "1.0.0",
    language: "en",
    cefrLevel: "B1",
    title: "Relay a schedule change",
    targetForm: "Report essential information in your own words",
    prompt: "Explain the important change to a classmate.",
    modes: ["mediation", "speaking", "writing", "transfer"],
    provenance: {
      kind: "authored",
      sourceId: "automaticity-b1-mediation-pilot-en",
      license: "proprietary-authored",
      humanReviewed: true,
    },
    mediation: {
      activity: "relaying-specific-information",
      sourceText:
        "The workshop now begins at nine and participants must bring a notebook.",
      guidedPrompt: "Tell a classmate the new time and what to bring.",
      independentPrompt: "Relay the two essential details without quoting.",
      novelTransferPrompt:
        "A friend missed a community notice. Explain its essential changes in your own words.",
    },
    quality: {
      rubricVersion: "1.0.0",
      status: "approved",
      reviews: [
        baseReview,
        {
          ...baseReview,
          reviewerId: "reviewer-pedagogy-02",
          roles: ["language-pedagogy"],
        },
      ],
      ...overrides,
    },
  };
}

describe("content quality release gate", () => {
  test("ships a parseable versioned JSON schema for the mediation pilot", async () => {
    const schema = JSON.parse(
      await Bun.file(
        new URL(
          "../schemas/mediation-content-pilot.schema.json",
          import.meta.url,
        ),
      ).text(),
    ) as {
      readonly $id?: string;
      readonly properties?: {
        readonly modes?: { readonly contains?: { readonly const?: string } };
      };
    };

    expect(schema.$id).toBe(
      "https://automaticity.local/schemas/mediation-content-pilot-1.0.0.json",
    );
    expect(schema.properties?.modes?.contains?.const).toBe("mediation");
  });

  test("accepts a synthetic fixture only after two independent passing reviews", () => {
    const assessment = assessMediationContentRelease(reviewedFixture());

    expect(assessment.readyForDailyPlan).toBe(true);
    expect(assessment.agreement).toEqual({
      method: CONTENT_AGREEMENT_METHOD,
      threshold: 0.6,
      value: 1,
      status: "pass",
    });
  });

  test("keeps an unreviewed pilot out of the daily plan", () => {
    const item = reviewedFixture({
      status: "awaiting-human-review",
      reviews: [],
    });
    const unreviewed = {
      ...item,
      provenance: { ...item.provenance, humanReviewed: false },
    };

    const assessment = assessMediationContentRelease(unreviewed);
    expect(assessment.readyForDailyPlan).toBe(false);
    expect(assessment.agreement.status).toBe("not-available");
    expect(filterDailyPlanEligibleMediationContent([unreviewed])).toEqual([]);
  });

  test("duplicate reviewer identifiers are not independent evidence", () => {
    const item = reviewedFixture();
    const duplicate = {
      ...item,
      quality: {
        ...item.quality,
        reviews: [baseReview, { ...baseReview, roles: ["language-pedagogy"] }],
      },
    } satisfies MediationContentPilotItem;

    const assessment = assessMediationContentRelease(duplicate);
    expect(assessment.readyForDailyPlan).toBe(false);
    expect(assessment.errors).toContain(
      "two independent reviewers are required",
    );
  });

  test("detects source leakage in a nominally novel transfer prompt", () => {
    expect(
      hasVerbatimPhraseOverlap(
        "The workshop now begins at nine and participants must bring a notebook.",
        "Explain that the workshop now begins at nine and participants must bring a notebook.",
      ),
    ).toBe(true);

    const item = reviewedFixture();
    const leaking = {
      ...item,
      mediation: {
        ...item.mediation,
        novelTransferPrompt:
          "Explain that the workshop now begins at nine and participants must bring a notebook.",
      },
    } satisfies MediationContentPilotItem;
    expect(assessMediationContentRelease(leaking).readyForDailyPlan).toBe(
      false,
    );
  });

  test("does not manufacture agreement from missing or unusable ratings", () => {
    expect(calculateQuadraticWeightedKappa([], [])).toBeNull();
    expect(calculateQuadraticWeightedKappa([4], [4, 3])).toBeNull();
  });
});
