import { expect, test } from "@playwright/test";

test("Startseite und aktiver Tagesweg zeigen denselben ehrlichen Lernstand", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Willkommen" })).toBeVisible();
  await expect(
    page.getByText(
      "Nach deiner ersten gespeicherten Übung beginnt hier dein echtes Diagramm.",
    ),
  ).toBeVisible();

  await page.goto("/heute");
  await expect(
    page.getByRole("heading", { name: "Automatik-Mission" }),
  ).toBeVisible();
  await expect(page.getByText("Personalpronomen und sein · A1")).toBeVisible();
  await expect(page.getByText(/0 von 3 erledigt/)).toBeVisible();
  await expect(page.getByText("Bestätigte Automatik: 0%")).toBeVisible();
  await expect(
    page.getByText("Lokaler App-Dienst nicht erreichbar"),
  ).toBeVisible();
});
