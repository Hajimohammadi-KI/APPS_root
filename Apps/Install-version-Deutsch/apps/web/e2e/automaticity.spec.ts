import { expect, test } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
}

test("Tagesprogramm speichert die gewählte Lernzeit dauerhaft", async ({
  page,
}) => {
  await page.goto("/heute");
  await waitForHydration(page);
  await page.getByRole("button", { name: "30 Min." }).click();
  await expect(page.getByRole("button", { name: "30 Min." })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await waitForHydration(page);
  await expect(page.getByRole("button", { name: "30 Min." })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".daily-auto-program__grid > li")).toHaveCount(5);
});

test("Automatisierungstrainer bleibt auf dem Smartphone bedienbar", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/automatik");

  await expect(page).toHaveURL(/\/automatik$/);
  await expect(
    page.getByRole("heading", { name: "Automatik gezielt aufbauen" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Abrufübung/ })).toBeVisible();
  await expect(
    page.getByText("Trainingsparameter", { exact: true }),
  ).toBeVisible();
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
