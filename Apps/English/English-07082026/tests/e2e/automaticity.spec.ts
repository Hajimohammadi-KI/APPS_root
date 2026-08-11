import { expect, test } from "@playwright/test";

test("automaticity mission saves writing evidence and restores it", async ({
  page,
}) => {
  await page.goto("/?screen=automaticity");
  await expect(page).toHaveURL(/screen=daily/);

  await page.goto("/?screen=grammar&topic=Present%20perfect#grammar-topic");
  await expect(
    page.getByRole("heading", { level: 2, name: "Present perfect" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use today" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .toBe("Present perfect");
  await page.goto("/?screen=progress");
  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  const evidence = page;
  await expect(evidence.getByText("Present perfect", { exact: true })).toBeVisible();

  const answers = [
    "I have worked on this project since May",
    "She has already written the report",
    "I have never tried shadowing before",
  ];
  const controlledAnswers = evidence.locator('input:not([type="checkbox"])');
  for (const [index, answer] of answers.entries()) {
    await controlledAnswers.nth(index).fill(answer);
  }
  await evidence.getByRole("button", { name: "Check all three" }).click();
  await expect(
    evidence.getByText("Controlled practice complete."),
  ).toBeVisible();

  const journal =
    "I have worked on my project today. I have written two notes. I have never used this method before. My friend has given me advice. The advice is useful. I feel more confident now.";
  await evidence.getByLabel("Present perfect journal").fill(journal);
  await evidence
    .getByRole("button", { name: "Analyse and save writing" })
    .click();
  await expect(evidence.getByText("Journal saved.")).toBeVisible();

  await page.reload();
  const restoredEvidence = page;
  await expect(restoredEvidence.getByLabel("Present perfect journal")).toHaveValue(
    journal,
  );
  await expect(restoredEvidence.getByText("66% complete")).toBeVisible();
});

test("automaticity mission remains usable on a phone viewport", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?screen=progress");

  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start evidence practice" }),
  ).toBeVisible();
  await expect(page.getByLabel("Present perfect journal")).toBeVisible();
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("automaticity mission follows the lesson selected in Grammar Lab", async ({
  page,
}) => {
  await page.goto("/?screen=grammar");
  const useToday = page.getByRole("button", { name: "Use today" });
  await expect(useToday).toBeVisible();
  const selectedLesson = await useToday
    .locator("xpath=..")
    .getByRole("heading", { level: 2 })
    .innerText();
  expect(selectedLesson).not.toBe("Present perfect");

  await useToday.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .toBe(selectedLesson);
  await page.goto("/?screen=progress");

  await expect(page.getByText(selectedLesson, { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel(`${selectedLesson} journal`)).toBeVisible();
});
