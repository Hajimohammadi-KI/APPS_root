import { expect, test } from "@playwright/test";

test("uses a searchable multi-select and applies choices deliberately", async ({
  page,
}) => {
  await page.goto("/fertigkeiten");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Deutsch in realen Situationen verwenden",
    }),
  ).toBeVisible();
  await page.getByText("Lernpfad auswählen", { exact: true }).click();
  await page.getByLabel("Niveau A2 anzeigen").check();

  // Pending choices stay reversible until the learner presses Apply.
  await expect(page.getByText(/1 von 6 Niveaus/)).toBeVisible();
  await page.getByRole("button", { name: "Auswahl anwenden" }).click();
  await expect(page.getByText(/2 von 6 Niveaus/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Ausgewählte Lernpfade" }),
  ).toContainText("A2");
});
