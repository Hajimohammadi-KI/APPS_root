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

test("Phase drei hält Status und Öffnen-Aktion im schmalen Desktop-Kartenrahmen", async ({
  page,
}) => {
  // The sidebar narrows the usable desktop space before mobile media queries
  // apply. Catch escaped German status labels and CTA controls in cards 5–7.
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/heute");

  const escapedControls = await page
    .locator(".cards.three .activity")
    .evaluateAll((cards) =>
      cards.flatMap((card) => {
        const cardBox = card.getBoundingClientRect();
        return [...card.querySelectorAll(".tag, .open")].flatMap((control) => {
          const controlBox = control.getBoundingClientRect();
          return controlBox.left < cardBox.left - 0.5 ||
            controlBox.right > cardBox.right + 0.5 ||
            controlBox.bottom > cardBox.bottom + 0.5
            ? [control.textContent?.trim() ?? "unbenanntes Steuerelement"]
            : [];
        });
      }),
    );

  expect(escapedControls).toEqual([]);
});

test("Navigationsüberschriften falten nur ihre eigene Linkgruppe", async ({
  page,
}) => {
  await page.goto("/heute");
  const heading = page.getByRole("button", {
    name: /Grammatik und Deutsch lernen/,
  });
  const linkedItem = page.getByRole("button", { name: "Grammatik-Labor" });

  await expect(heading).toHaveAttribute("aria-expanded", "true");
  await heading.click();
  await expect(heading).toHaveAttribute("aria-expanded", "false");
  await expect(linkedItem).toBeHidden();
  await heading.click();
  await expect(linkedItem).toBeVisible();
});

test("Integrierte Fertigkeiten verwendet den kanonischen App-Pfad", async ({
  page,
}) => {
  await page.goto("/heute");
  await page.getByRole("button", { name: "Integrierte Fertigkeiten" }).click();
  await expect(page).toHaveURL(/\/fertigkeiten$/);
});

test("Gesprächsstudio kehrt ohne Verlaufsschleife zum Tageskontext zurück", async ({
  page,
}) => {
  await page.goto("/heute");
  await page.evaluate(() =>
    window.location.assign(
      "/studio?from=daily&activity=2&return=%2Fheute&level=A1&topic=Vorstellung",
    ),
  );
  await page.waitForURL(/\/studio\?/);
  await expect(
    page.getByText("Heutige Sprechübung · Aktivität 2"),
  ).toBeVisible();

  const historyLength = await page.evaluate(() => window.history.length);
  await page.getByRole("button", { name: "Zum heutigen Training" }).click();

  await expect(page).toHaveURL(/\/heute$/);
  await expect(
    page.getByRole("heading", { name: "Deine heutige 15-Minuten-Lernmission" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
});

test("Interaktive Kästen zeigen Hover und Fokus bei korrekter Schreibrichtung", async ({
  page,
}) => {
  await page.goto("/heute");
  const menuItem = page.getByRole("button", { name: "Grammatik-Labor" });

  // Hover and keyboard focus use the same semantic control instead of a mouse-only effect.
  await menuItem.hover();
  expect(
    await menuItem.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toBe("none");
  await menuItem.focus();
  expect(
    await menuItem.evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    ),
  ).not.toBe("none");

  const directions = await page.evaluate(() =>
    Object.fromEntries(
      ["en", "de", "fa", "ar"].map((language) => {
        const sample = document.createElement("span");
        sample.lang = language;
        sample.textContent = language;
        document.body.append(sample);
        return [language, getComputedStyle(sample).direction];
      }),
    ),
  );
  expect(directions).toEqual({ en: "ltr", de: "ltr", fa: "rtl", ar: "rtl" });
});

test("Lokaler Dienst kann ohne Seitenverlust erneut geprüft werden", async ({
  page,
}) => {
  let serviceReady = false;
  await page.route("**/api/v1/health", async (route) => {
    await route.fulfill({
      body: JSON.stringify(
        serviceReady ? { status: "ok" } : { error: "offline" },
      ),
      contentType: "application/json",
      status: serviceReady ? 200 : 503,
    });
  });
  await page.goto("/");

  const retry = page.getByRole("button", {
    name: "Lokalen App-Dienst erneut prüfen",
  });
  await expect(retry).toBeVisible();
  serviceReady = true;
  await retry.click();
  await expect(
    page.getByRole("button", { name: "Lokaler App-Dienst bereit" }),
  ).toBeVisible();
});

test("Mikrofonfehler bietet Tippen als Wiederherstellung an", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Record", exact: true }).click();

  await expect(
    page.getByRole("button", { name: "Durch Tippen fortfahren" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Durch Tippen fortfahren" }).click();
  await expect(
    page.getByRole("textbox", { name: "Dein Transkript" }),
  ).toBeFocused();
});
