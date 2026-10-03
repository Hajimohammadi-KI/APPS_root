import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/?screen=integrated-skills");
});

test("saves one automaticity step and restores the exact next step", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Integrated Skills Path" }),
  ).toBeVisible();
  await expect(page.getByText("Step 1 of 7", { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="drive.google.com"]')).toHaveCount(0);

  await page
    .getByLabel("Integrated skills evidence")
    .fill("This lesson is about introducing myself clearly.");
  await page
    .getByRole("button", { name: "Save evidence and complete" })
    .click();

  await expect(page.getByText("Step 2 of 7", { exact: true })).toBeVisible();
  await expect(page.getByText(/Evidence saved/)).toBeVisible();

  await page.reload();
  await expect(page.getByText("Step 2 of 7", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "1 of 7 skill stages completed" }),
  ).toBeVisible();
});

test("save for later confirms and restores the exact draft", async ({ page }) => {
  const draft = "My draft stays local until I return to this exact step.";
  const evidence = page.getByLabel("Integrated skills evidence");
  await evidence.fill(draft);
  await page.getByRole("button", { name: "Save and continue later" }).click();

  await expect(
    page.getByText("Saved locally. You can stop and continue from this exact step."),
  ).toBeVisible();
  await page.reload();
  await expect(evidence).toHaveValue(draft);
});

test("keeps the daily mission readable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(
    page.getByRole("heading", { level: 1, name: "Integrated Skills Path" }),
  ).toBeVisible();
  // The mission choices now live in the compact Lesson navigator on small
  // screens, so opening it is part of the responsive learner journey.
  await page.getByText("Lesson navigator", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rescue: one step" }),
  ).toBeVisible();
  await expect(page.getByLabel("Integrated skills evidence")).toBeVisible();

  const bodyWidth = await page
    .locator("body")
    .evaluate((body) => body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});

test("applies the searchable unit multi-select before changing the compact menu", async ({
  page,
}) => {
  await page.getByText("Unit multi-select", { exact: true }).click();
  await expect(page.getByText(/1 of \d+ A1 units selected/)).toBeVisible();

  await page.getByLabel(/^Show Unit 2:/).check();
  await expect(page.getByText(/1 of \d+ A1 units selected/)).toBeVisible();
  await page.getByRole("button", { name: "Apply 2 selected" }).click();

  await expect(page.getByText(/2 of \d+ A1 units selected/)).toBeVisible();
  await expect(page.locator("#integrated-unit option")).toHaveCount(2);
  await expect(
    page.getByText(/2 A1 units shown in the lesson menu/),
  ).toBeVisible();
});

test("plays original listening and opens the exact speaking lesson in the studio", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class TestUtterance {
      lang = "";
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onstart: (() => void) | null = null;
      rate = 1;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: TestUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: () => undefined,
        speak: (utterance: TestUtterance) => utterance.onstart?.(),
      },
    });
  });
  await page.goto("/?screen=integrated-skills");
  await page.getByText("Lesson navigator", { exact: true }).click();

  await page.getByRole("button", { name: "Play original listening" }).click();
  await expect(page.getByText(/Original listening is playing/)).toBeVisible();

  await page
    .getByRole("button", { name: /Speaking/ })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Practise this lesson in Conversation Studio",
    })
    .click();

  await expect(page).toHaveURL(/\/studio\?/);
  await expect(page).toHaveURL(/source=integrated-skills/);
  await expect(page).toHaveURL(/unit=a1-introductions/);
  await expect(
    page.getByText("A1 · Unit 1 · Introduce yourself clearly", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Introducing yourself" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Ava, the speaking coach",
    }),
  ).toBeVisible();

  const historyLength = await page.evaluate(() => window.history.length);
  await page.getByRole("button", { name: "Return to lesson" }).click();

  await expect(page).toHaveURL(/\/?screen=integrated-skills$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Integrated Skills Path" }),
  ).toBeVisible();
  await expect(page.getByText("Step 1 of 7", { exact: true })).toBeVisible();
  // Returning through history must not append another entry and create a loop.
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
});
