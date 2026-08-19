import { expect, test } from "@playwright/test";

test("Automatik-Mission speichert den Schreibnachweis dauerhaft", async ({
  page,
}) => {
  await page.goto("/heute");
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();

  const journal =
    "Ich übe heute, weil ich sicherer sprechen möchte. Ich schreibe Beispiele, weil ich die Regel behalten will. Ich höre zu, weil gute Aussprache wichtig ist. Ich wiederhole den Text, weil mir das Rhythmus gibt. Danach spreche ich frei. Morgen mache ich weiter.";
  const journalField = page.getByLabel("Personalpronomen und sein-Tagebuch");
  await journalField.fill(journal);
  await page
    .getByRole("button", { name: "Schreiben analysieren und speichern" })
    .click();
  await expect(
    page.getByText(
      "Tagebuch gespeichert. Du hast die Zielstruktur selbst produziert.",
    ),
  ).toBeVisible();

  await page.reload();
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();
  await expect(
    page.getByLabel("Personalpronomen und sein-Tagebuch"),
  ).toHaveValue(journal);
});

test("Automatik-Mission bleibt auf dem Smartphone bedienbar", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/automatik");

  await expect(page).toHaveURL(/\/heute$/);
  await expect(
    page.getByRole("heading", { name: "Automatik-Mission" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nachweis starten" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();
  await expect(
    page.getByLabel("Personalpronomen und sein-Tagebuch"),
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
