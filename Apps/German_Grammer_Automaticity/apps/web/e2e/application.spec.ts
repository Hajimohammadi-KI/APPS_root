import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/heute",
  "/studio",
  "/grammatik",
  "/wiederholungen",
  "/fehler",
  "/audio",
  "/themen",
  "/deutsch-mit-marija",
  "/ressourcen",
  "/einstellungen",
  "/klassik",
] as const;

test("all product and compatibility routes render successfully", async ({
  page,
}) => {
  for (const route of routes) {
    const response = await page.goto(route);

    expect(response?.ok(), `${route} should return a successful response`).toBe(
      true,
    );
    await expect(page.locator("main h1").first()).toBeVisible();
  }
});

test("dashboard exposes blue artwork, full inventory, and live state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        settings: {
          minWords: 12,
          saveAudio: true,
          grammarEngine: "languagetool",
          ltEndpoint: "https://api.languagetool.org/v2/check",
        },
        errors: [
          {
            date: new Date().toISOString(),
            topic: "Perfekt",
            original: "Ich habe gegangen.",
            corrected: "Ich bin gegangen.",
          },
        ],
        activity: {},
        reviews: [],
        sessions: [],
        mastery: {},
        dailyPlans: {},
      }),
    );
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dein Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "Eine Lernende entwickelt sich vom Grammatiklernen über das Sprechen bis zur sicheren Präsentation",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sicher und automatisch sprechen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vom Abruf zum sicheren Sprechen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "In drei Schritten sicher starten" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hilfe zur Benutzung öffnen" })
    .click();
  const help = page.getByRole("dialog", {
    name: "So benutzt du DeutschFlow",
  });
  await expect(help).toBeVisible();
  await expect(
    help.getByText(
      "Dein Fortschritt wird automatisch auf diesem Gerät gespeichert.",
    ),
  ).toBeVisible();
  await help.getByRole("button", { name: "Schließen" }).click();
  await expect(help).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Windows-App installieren" }),
  ).toBeVisible();
  await expect(
    page.getByText("84 Grammatikthemen", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("79 Sprechthemen", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/1 Fehlerdatensätze/)).toBeVisible();
});

test("grammar lab exposes all units and working filters", async ({ page }) => {
  await page.goto("/grammatik");

  await expect(page.getByText("84 von 84 Themen")).toBeVisible();
  await page.getByLabel("Niveau").selectOption("B1");
  await page.getByLabel("Themenbereich").selectOption("Verben & Verbformen");
  await expect(page.getByText("0 von 84 Themen")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Infinitiv mit zu/i }),
  ).toBeVisible();

  await page.getByLabel("Niveau").selectOption("B2");
  await page.getByLabel("Themenbereich").selectOption("Verben & Verbformen");
  await expect(page.getByText("0 von 84 Themen")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Verben mit Präpositionen/i }),
  ).toBeVisible();
  await expect(page.getByText("Aufgabe 1 von 11")).toBeVisible();

  await page.getByLabel("Themenbereich").selectOption("Alle");
  await expect(page.getByText(/von 84 Themen/)).toBeVisible();
  await page.getByLabel("Thema suchen").fill("Passiv");
  await expect(
    page.getByRole("button", { name: /Passiv/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vollständige Erklärung" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bildung und Formen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Satzbau und Position" }),
  ).toBeVisible();
  await page
    .getByText("Materialbasis und weiterführende Übungen", { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Deine Kursmaterialien in Google Drive/ }),
  ).toHaveAttribute("href", /1isE3OWBFZcr9eRDwWvNXHWb5vo0qmGAF/);
  await expect(page.getByRole("button", { name: "Prüfen" })).toBeVisible();

  await page.getByLabel("Niveau").selectOption("C2");
  await page.getByLabel("Thema suchen").fill("Idiomatizität");
  await expect(
    page.getByText("Idiomatizität und Kollokation", { exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText(/Kollokation: eine Entscheidung/)).toBeVisible();
});

test("studio supports topic selection, sessions, and minimum-word gate", async ({
  page,
}) => {
  await page.goto("/studio?topic=12");

  await expect(page.getByLabel("Thema")).toBeVisible();
  await page.getByRole("button", { name: "Sitzung starten" }).click();
  await page.getByLabel("Dein Transkript").fill("Zu kurz");
  const evaluateButton = page.getByRole("button", { name: "Auswerten" });
  await expect(evaluateButton).toBeEnabled();
  await evaluateButton.click();
  await expect(page.getByText(/2\/12 Wörter/)).toBeVisible();
});

test("resources and topic catalog contain the complete legacy catalogs", async ({
  page,
}) => {
  await page.goto("/ressourcen");
  await expect(
    page.getByRole("heading", { name: "Lernbibliothek aus Google Drive" }),
  ).toBeVisible();
  await expect(page.getByText("24 Einträge anzeigen")).toBeVisible();
  await expect(page.getByText("7 Einträge anzeigen")).toBeVisible();
  await expect(
    page.getByText("15 passende direkte Lernressourcen"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Erklärung/ })).toHaveCount(15);
  await expect(page.getByRole("link", { name: /Übungen/ })).toHaveCount(15);

  await page.goto("/themen");
  await expect(page.getByText("79 von 79 Themen")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Sprechthemen A1/i }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Im Studio öffnen" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: /Sprechthemen A1/i }).click();
  await expect(
    page.getByRole("button", { name: /Sprechthemen A1/i }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /Sprechthemen A2/i }).click();
  await expect(
    page.getByRole("button", { name: /Sprechthemen A2/i }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Im Studio öffnen" }),
  ).toHaveCount(1);
});

test("Deutsch mit Marija exposes every shared course family", async ({
  page,
}) => {
  await page.goto("/deutsch-mit-marija");

  await expect(
    page.getByRole("heading", { name: "Deutsch mit Marija" }),
  ).toBeVisible();
  const scope = page.getByRole("region", {
    name: "Umfang der Kursmaterialien",
  });
  await expect(scope.getByText("24", { exact: true })).toBeVisible();
  await expect(
    scope.getByText("Idiomatik-Tage", { exact: true }),
  ).toBeVisible();
  await expect(scope.getByText("127 + 4", { exact: true })).toBeVisible();
  await expect(
    scope.getByText("PDFs + Originalarchive", { exact: true }),
  ).toBeVisible();
  await expect(scope.getByText("7", { exact: true })).toBeVisible();
  await expect(scope.getByText("Hörmodelle", { exact: true })).toBeVisible();
  await expect(scope.getByText("2", { exact: true })).toBeVisible();
  await expect(scope.getByText("Fehlerkurse", { exact: true })).toBeVisible();
  await expect(
    page.getByText("24 Einträge anzeigen", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("12 Einträge anzeigen", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("33 Einträge anzeigen", { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText("34 Einträge anzeigen", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText("31 Einträge anzeigen", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText("2 Einträge anzeigen", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("24-Tage-Training · Redewendungen, Sprichwörter & Zitate", {
      exact: true,
    })
    .click();
  await expect(page.getByRole("link", { name: /Tag 1 ·/ })).toBeVisible();
});

test("settings persist in the legacy-compatible local state", async ({
  page,
}) => {
  await page.goto("/einstellungen");
  await page.getByLabel("Mindestwörter pro Gesprächsantwort").fill("18");
  await page.getByRole("button", { name: "Einstellungen speichern" }).click();
  await expect(page.getByText("Einstellungen gespeichert.")).toBeVisible();

  const storedMinWords = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("GrammarAutomaticityV11_de") ?? "{}",
    ) as { settings?: { minWords?: number } };
    return state.settings?.minWords;
  });
  expect(storedMinWords).toBe(18);
});

test("settings explain installation on every supported device family", async ({
  page,
}) => {
  await page.goto("/einstellungen");

  await expect(
    page.getByText(
      /Slack, Vercel, kostenpflichtige Software und separate Entwicklerwerkzeuge sind nicht nötig/,
    ),
  ).toBeVisible();
  await expect(page.locator('a[href*="slack.com"]')).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Auf deinem Gerät installieren" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Windows" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Android" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "iPhone & iPad" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", {
        name: /App installieren|Windows-App installieren|Android-App installieren|App ist installiert/,
      })
      .first(),
  ).toBeVisible();
  await expect(page.getByText(/Safari öffnen/)).toBeVisible();
  await expect(
    page.getByText(/Windows fragt im Setup nach dem Installationsordner/),
  ).toBeVisible();
});

test("exact v20.8 fallback remains fully loaded", async ({ page }) => {
  await page.goto("/klassik");
  const legacy = page.frameLocator(
    'iframe[title="Deutsch Grammatik-Automatik v20.8"]',
  );
  await expect(
    legacy.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible();
  await legacy.getByRole("button", { name: /Gesprächsstudio/ }).click();
  await expect(legacy.getByText("79 Gesprächsthemen").first()).toBeVisible();
  await expect(legacy.getByText("84 Grammatikthemen").first()).toBeVisible();
});

test("production PWA installs its worker and reloads offline", async ({
  context,
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_PWA !== "1",
    "Production service-worker check is opt-in.",
  );

  const [manifestResponse, workerResponse] = await Promise.all([
    page.request.get("/manifest.webmanifest"),
    page.request.get("/sw.js"),
  ]);
  expect(manifestResponse.ok()).toBe(true);
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["cache-control"]).toContain("no-cache");

  const manifest = (await manifestResponse.json()) as {
    readonly id?: string;
    readonly scope?: string;
    readonly display?: string;
    readonly theme_color?: string;
    readonly icons?: readonly { readonly purpose?: string }[];
  };
  expect(manifest).toMatchObject({
    id: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#38bdf8",
  });
  expect(manifest.icons?.some((icon) => icon.purpose === "maskable")).toBe(
    true,
  );

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Dein Dashboard" }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("mobile navigation opens and changes route", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Navigation öffnen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Tagespfad" }).click();

  await expect(page).toHaveURL(/\/heute$/);
  await expect(
    page.getByRole("heading", {
      name: "Mit welchem Niveau möchtest du starten?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^A1/ }).click();
  await expect(
    page.getByText("Jeder Schritt enthält eine konkrete Aufgabe"),
  ).toBeVisible();
});

test("daily path offers every CEFR start level", async ({ page }) => {
  await page.goto("/heute");

  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${level}`) }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: /^B2/ }).click();
  await expect(page.getByText("Heutiger Grammatikfokus")).toBeVisible();
  await expect(page.getByText("B2", { exact: true }).first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("GrammarAutomaticityV11_de");
        if (!raw) {
          return null;
        }
        return (JSON.parse(raw) as { learningLevel?: string }).learningLevel;
      }),
    )
    .toBe("B2");
});
