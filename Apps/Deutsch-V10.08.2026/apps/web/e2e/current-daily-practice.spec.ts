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
    page.getByRole("heading", { name: "Deine heutige 15-Minuten-Lernmission" }),
  ).toBeVisible();
  await expect(page.getByText("sein: bin/ist/sind · A1")).toBeVisible();
  await expect(page.getByText("0 von 7 Aktivitäten erledigt")).toBeVisible();
  await expect(page.getByText("0% geprüfte Beherrschung")).toBeVisible();
  await expect(page.getByText("Lokaler App-Dienst bereit")).toBeVisible();
});
