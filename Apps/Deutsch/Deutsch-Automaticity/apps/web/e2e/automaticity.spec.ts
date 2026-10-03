import { expect, test, type Page } from "@playwright/test";

const JOURNAL =
  "Ich übe heute, weil ich sicherer sprechen möchte. Ich schreibe Beispiele, weil ich die Regel behalten will. Ich höre zu, weil gute Aussprache wichtig ist. Ich wiederhole den Text, weil mir das Rhythmus gibt. Danach spreche ich frei. Morgen mache ich weiter.";

async function selectWeilMission(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("GrammarAutomaticityV11_de")) return;
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        learningLevel: "A2",
        todayGrammar: {
          date: new Date().toISOString().slice(0, 10),
          level: "A2",
          title: "Nebensatz mit weil",
        },
      }),
    );
  });
}

test("Automatik-Mission speichert den Schreibnachweis dauerhaft", async ({
  page,
}) => {
  await selectWeilMission(page);
  await page.goto("/automatik");

  await expect(
    page.getByRole("heading", { name: "Automatik-Mission" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();
  await page.getByLabel("Nebensatz mit weil-Tagebuch").fill(JOURNAL);
  await page
    .getByRole("button", { name: "Schreiben analysieren und speichern" })
    .click();
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Tagebuch gespeichert/)).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  const writingStep = page.getByRole("button", {
    name: /2\. Automatisieren & schreiben/,
  });
  await writingStep.click();
  await expect(writingStep).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Nebensatz mit weil-Tagebuch")).toHaveValue(
    JOURNAL,
  );
});

test("Automatik-Mission bleibt auf dem Smartphone bedienbar", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    // Browser-only CI intentionally runs without the optional local companion API.
    if (
      message.type() === "error" &&
      !message.text().includes("net::ERR_CONNECTION_REFUSED")
    ) {
      consoleErrors.push(message.text());
    }
  });
  await selectWeilMission(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/automatik");

  await expect(page).toHaveURL(/\/automatik$/);
  await expect(
    page.getByRole("heading", { name: "Automatik-Mission" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nachweis starten" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /2\. Automatisieren & schreiben/ }),
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
