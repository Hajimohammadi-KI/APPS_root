import { expect, test } from "@playwright/test";

test("current home and active daily route show one truthful learner state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Learner/ })).toBeVisible();
  await expect(page.getByText("Your chart will begin after your first saved practice.")).toBeVisible();
  await expect(page.getByText("Local app service ready")).toBeVisible();

  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "Today's 15-minute learning mission" })).toBeVisible();
  // The level used to be plain text appended after the topic name
  // ("Topic · A1"); it's a real <select> now (added earlier this session
  // so the learner can actually change their level here), so topic and
  // level are two separate elements, not one concatenated string.
  await expect(page.locator("#mission-topic")).toHaveText("Verb be: am/is/are");
  await expect(page.getByLabel("Your English level")).toHaveValue("A1");
  await expect(page.getByText("0 of 7 activities complete")).toBeVisible();
  await expect(page.getByText("0% verified mastery")).toBeVisible();
  await expect(page.getByText("Local app service ready")).toBeVisible();
});
