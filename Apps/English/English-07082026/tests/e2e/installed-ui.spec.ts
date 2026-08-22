import { expect, test } from "@playwright/test";

const installedApps: Array<readonly [string, string]> = [
  [
    "English Automaticity",
    process.env.E2E_BASE_URL ?? "http://127.0.0.1:3201/",
  ],
];

// English must remain independently testable. Cross-app visual consistency is
// useful, but Tracker and DeutschFlow are separate products with separate
// ports and release lifecycles, so only require them in the explicit suite.
if (process.env.CROSS_APP_E2E === "1") {
  installedApps.unshift([
    "Study Tracker",
    process.env.E2E_TRACKER_URL ?? "http://127.0.0.1:4312/",
  ]);
  installedApps.push([
    "DeutschFlow",
    process.env.E2E_GERMAN_URL ?? "http://127.0.0.1:3199/",
  ]);
}

for (const [name, url] of installedApps) {
  test(`${name} exposes the shared accessible UI and contextual hover help`, async ({
    page,
  }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first()).toBeVisible();
    // The help targets are server-rendered, while their pointer listener is
    // attached after the client store hydrates. Wait for that stable signal
    // before hovering so the test cannot dispatch its only pointer event early.
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem("grammar-automaticity:v27"),
        ),
      )
      .not.toBeNull();

    const tooltipTargets = page.locator(
      "[data-context-help], [data-persian-tooltip]",
    );
    let targetIndex = -1;
    await expect
      .poll(async () => {
        targetIndex = await tooltipTargets.evaluateAll((elements) =>
          elements.findIndex((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= window.innerHeight &&
              rect.right <= window.innerWidth
            );
          }),
        );
        return targetIndex;
      })
      .toBeGreaterThanOrEqual(0);
    const interactive = tooltipTargets.nth(targetIndex);
    await interactive.hover();
    const tooltip = page
      .locator('[role="tooltip"][lang="en"]:visible, [role="tooltip"][lang="fa"]:visible')
      .last();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toHaveText("");

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      )
      .toBe(false);
  });
}
