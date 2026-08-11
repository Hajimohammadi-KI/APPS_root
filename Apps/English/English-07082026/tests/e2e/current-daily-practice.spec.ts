import { expect, test } from "@playwright/test";

test("current home and active daily route show one truthful learner state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Learner/ })).toBeVisible();
  await expect(page.getByText("Your chart will begin after your first saved practice.")).toBeVisible();
  await expect(page.getByText("Local app service ready")).toBeVisible();

  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "Today's 15-minute learning mission" })).toBeVisible();
  await expect(page.getByText("Verb be: am/is/are · A1")).toBeVisible();
  await expect(page.getByText("0 of 7 activities complete")).toBeVisible();
  await expect(page.getByText("0% verified mastery")).toBeVisible();
  await expect(page.getByText("Local app service ready")).toBeVisible();
});
