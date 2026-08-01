import { expect, test } from "@playwright/test";

const installedApps = [
  ["Study Tracker", "http://127.0.0.1:3100/"],
  ["English Automaticity", "http://127.0.0.1:3201/"],
  ["DeutschFlow", "http://127.0.0.1:3000/"],
] as const;

for (const [name, url] of installedApps) {
  test(`${name} exposes the shared accessible UI and Persian hover help`, async ({
    page,
  }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first()).toBeVisible();

    const tooltipTargets = page.locator("[data-persian-tooltip]");
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
      .locator('[role="tooltip"][lang="fa"]:visible')
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
