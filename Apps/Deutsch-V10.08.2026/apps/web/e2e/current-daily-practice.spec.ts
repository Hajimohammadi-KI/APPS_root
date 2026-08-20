import { expect, test } from "@playwright/test";

test("Startseite und aktiver Tagesweg zeigen denselben ehrlichen Lernstand", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Guten (Morgen|Tag|Abend), Lernende/,
    }),
  ).toBeVisible();
  await expect(page.getByText("Heutige adaptive Mission")).toBeVisible();

  await page.goto("/heute");
  await expect(
    page.getByRole("heading", {
      name: "Dein vollständiges tägliches Automatikprogramm",
    }),
  ).toBeVisible();
  await expect(page.locator(".daily-auto-program__grid > li")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "15 Min." })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
