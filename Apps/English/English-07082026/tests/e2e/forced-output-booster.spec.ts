import { expect, test } from "@playwright/test";

const FEATURE_FLAGS_KEY = "automaticity-feature-flags-v1";
const ATTEMPTS_KEY = "automaticity-booster-attempts-v1";

test("booster is absent from the normal daily journey unless the learner explicitly enables it", async ({
  page,
}) => {
  await page.goto("/daily?mode=booster");

  await expect(page.locator("#forced-output-booster")).toBeHidden();
  await expect(page.locator(".phase").first()).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (
          window as Window & {
            __automaticityBooster?: { active?: boolean };
          }
        ).__automaticityBooster?.active,
    ),
  ).toBe(false);
});

test("enabled booster uses automatization time and stores bounded practice evidence", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) =>
      window.localStorage.setItem(key, JSON.stringify({ booster_mode: true })),
    { key: FEATURE_FLAGS_KEY },
  );
  await page.goto("/daily?mode=booster");

  const booster = page.locator("#forced-output-booster");
  await expect(booster).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Use one structure repeatedly under gentle time pressure",
    }),
  ).toBeVisible();
  await expect(page.locator(".phase").first()).toBeHidden();

  const plan = await page.evaluate(() => {
    const controller = (
      window as Window & {
        __automaticityBooster?: {
          active?: boolean;
          plan?: {
            sourceBlock?: string;
            sessionMinutes?: number;
            allocatedAutomatizationMinutes?: number;
            rounds?: unknown[];
            learningOutcome?: string;
          };
        };
      }
    ).__automaticityBooster;
    return { active: controller?.active, ...controller?.plan };
  });
  expect(plan).toMatchObject({
    active: true,
    sourceBlock: "automatization",
    sessionMinutes: 15,
    allocatedAutomatizationMinutes: 5,
    learningOutcome: "not-evaluated",
  });
  expect(plan.rounds).toHaveLength(3);

  await page.getByRole("button", { name: "Type instead" }).click();
  const response = page.getByLabel("Your response or corrected transcript");
  await response.fill("I am ready for work. They are ready for class.");
  await page.waitForTimeout(1_050);
  await page.getByRole("button", { name: "Save this practice round" }).click();

  await expect(
    page.getByText("Practice evidence saved locally.", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        "Practice feedback only — not mastery, a level change, or proof of automaticity.",
      )
      .last(),
  ).toBeVisible();

  const persisted = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key) ?? "[]";
    return { raw, rows: JSON.parse(raw) as Array<Record<string, unknown>> };
  }, ATTEMPTS_KEY);
  expect(persisted.rows).toHaveLength(1);
  expect(persisted.rows[0]).toMatchObject({
    inputMode: "typing",
    typingFallback: true,
    speakingEvidence: false,
    masteryEligible: false,
    automaticityClaim: "insufficient-longitudinal-evidence",
    learningOutcome: "not-evaluated",
    metrics: {
      validatedStructureUses: 2,
      productionCount: 2,
    },
  });
  expect(persisted.rows[0]?.attemptId).toMatch(/^booster-attempt-/);
  expect(persisted.rows[0]?.planId).toMatch(/^booster-plan-/);
  expect(persisted.rows[0]?.roundId).toContain(":round-1");
  expect(persisted.rows[0]?.targetStructureId).toMatch(/^en:a1:/);
  expect(persisted.raw).not.toContain("I am ready for work");
  expect(persisted.raw).not.toMatch(/responseText|transcript|audioBlob/i);

  for (const viewport of [
    { width: 800, height: 1_280 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(booster).toBeVisible();
  }
});
