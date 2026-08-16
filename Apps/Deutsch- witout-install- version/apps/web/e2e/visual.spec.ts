import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

const outputDirectory = resolve(process.cwd(), "../../.tmp/visual");

test("capture desktop and mobile QA views", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_VISUAL !== "1", "Visual capture is opt-in.");

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sicher und automatisch sprechen" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "dashboard-desktop.png"),
    fullPage: true,
  });

  await page.goto("/studio?topic=36");
  await expect(
    page.getByRole("heading", { name: "Gesprächsstudio" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "studio-desktop.png"),
    fullPage: true,
  });

  await page.goto("/grammatik");
  await expect(
    page.getByRole("heading", { name: "Vollständige Erklärung" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "grammar-explanation-desktop.png"),
    fullPage: true,
  });

  await page.goto("/einstellungen");
  await expect(
    page.getByRole("heading", { name: "Auf deinem Gerät installieren" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "settings-install-desktop.png"),
    fullPage: true,
  });

  await page.goto("/ressourcen");
  await expect(
    page.getByRole("heading", { name: "Lernmaterial & direkte Themenlinks" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "ressourcen-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sicher und automatisch sprechen" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "dashboard-mobile.png"),
    fullPage: true,
  });

  await page.goto("/grammatik");
  await expect(
    page.getByRole("heading", { name: "Vollständige Erklärung" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "grammar-explanation-mobile.png"),
    fullPage: true,
  });

  await page.goto("/einstellungen");
  await expect(
    page.getByRole("heading", { name: "Auf deinem Gerät installieren" }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(outputDirectory, "settings-install-mobile.png"),
    fullPage: true,
  });
});
