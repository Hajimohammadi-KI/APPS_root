import { expect, test } from "@playwright/test";

test("current home and active daily route show one truthful learner state", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Learner/ })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Performance chart" })).toBeVisible();
	await expect(page.getByText("Local app service ready")).toBeVisible();

  // /daily used to be rewritten (next.config.ts) to a static HTML mockup --
  // a fixed 7-item list with hardcoded "0 of 7 activities"/"0% verified
  // mastery" stats no script ever updated, and its own separate
	// localStorage key that could never agree with Home above. The rewrite
	// is gone; /daily now renders the real adaptive five-module program and
	// reads the same store as Home.
	await page.goto("/daily");
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Your complete daily automaticity program",
		}),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Start 15-minute program" }),
	).toBeVisible();
});
