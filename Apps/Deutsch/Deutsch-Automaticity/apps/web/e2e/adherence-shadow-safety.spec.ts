import { expect, test } from "@playwright/test";

const protectedLearningData = {
  sentinel: "keep-german-learning-data",
  evidence: JSON.stringify({ schemaVersion: "1.0", responses: ["sentinel"] }),
  learnerState: JSON.stringify({ settings: { dailyStudyMinutes: 15 } }),
};

test("Adherence-Shadow bleibt unsichtbar, reversibel und von Lerndaten getrennt", async ({
  page,
}) => {
  await page.addInitScript((seed) => {
    localStorage.setItem("shadow-safety:learning-data", seed.sentinel);
    localStorage.setItem("automaticity:learning-evidence:v1", seed.evidence);
    localStorage.setItem("GrammarAutomaticityV11_de", seed.learnerState);
    localStorage.setItem("deutsch-automaticity:daily-duration:v1", "15");
    localStorage.setItem(
      "deutsch-automaticity:daily-session:v1",
      JSON.stringify({
        completedActivities: [1],
        mistakes: ["sentinel-error"],
        startedAt: "2026-08-21T08:00:00.000Z",
      }),
    );
  }, protectedLearningData);

  await page.goto("/heute");
  const visiblePlan = await page
    .locator(".activity .Minuten")
    .allTextContents();
  const disabled = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __automaticityAdherenceShadow?: Record<string, unknown>;
        }
      ).__automaticityAdherenceShadow,
  );
  expect(disabled).toMatchObject({
    status: "disabled",
    featureFlagEnabled: false,
    proposedPlan: null,
    appliedToLearnerPlan: false,
    persisted: false,
    learningOutcome: "not-evaluated",
  });

  await page.goto("/heute?adherence-shadow=1");
  await expect(page.locator(".activity .Minuten")).toHaveText(visiblePlan);
  const computed = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __automaticityAdherenceShadow?: {
            status: string;
            currentPlan: {
              planDuration: number;
              blockMinutes: Record<string, number>;
            };
            proposedPlan: {
              planDuration: number;
              blockMinutes: Record<string, number>;
            };
            appliedToLearnerPlan: boolean;
            persisted: boolean;
            learningOutcome: string;
          };
        }
      ).__automaticityAdherenceShadow,
  );
  expect(computed).toMatchObject({
    status: "computed",
    appliedToLearnerPlan: false,
    persisted: false,
    learningOutcome: "not-evaluated",
    currentPlan: {
      planDuration: 15,
      blockMinutes: {
        grammar: 2,
        mixed_practice: 4,
        conversation_studio: 3,
        review: 2,
        automatization: 4,
      },
    },
  });
  expect(
    Object.values(computed?.proposedPlan.blockMinutes ?? {}).reduce(
      (sum, value) => sum + value,
      0,
    ),
  ).toBe(15);
  await expect(page.locator("body")).not.toContainText("Adherence-Shadow");

  expect(
    await page.evaluate(() => ({
      sentinel: localStorage.getItem("shadow-safety:learning-data"),
      evidence: localStorage.getItem("automaticity:learning-evidence:v1"),
      learnerState: localStorage.getItem("GrammarAutomaticityV11_de"),
      shadowStorage: localStorage.getItem("adherence-core-shadow-v1"),
    })),
  ).toEqual({ ...protectedLearningData, shadowStorage: null });

  await page.locator(".time[data-min='30']").click();
  await expect(
    page.getByRole("heading", { name: "Deine heutige 30-Minuten-Lernmission" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (
          window as typeof window & {
            __automaticityAdherenceShadow?: {
              status: string;
              currentPlan: { planDuration: number };
              appliedToLearnerPlan: boolean;
            };
          }
        ).__automaticityAdherenceShadow,
    ),
  ).toMatchObject({
    status: "computed",
    currentPlan: { planDuration: 30 },
    appliedToLearnerPlan: false,
  });
});
