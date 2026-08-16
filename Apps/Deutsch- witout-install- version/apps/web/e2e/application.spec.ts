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

test("dashboard exposes the automaticity journey, full inventory, and live state", async ({
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
    page.getByRole("heading", { name: "Sicher und automatisch sprechen" }),
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
    page.getByRole("link", { name: /Starke Grammatik aufbauen/i }),
  ).toHaveAttribute("href", "/grammatik");
  await expect(
    page.getByRole("link", { name: /Alltagsgespräche sicher meistern/i }),
  ).toHaveAttribute("href", "/studio");
  await expect(page.getByText(/1 Fehlerdatensätze/)).toBeVisible();
});

test("grammar lab exposes all 144 CEFR units and working search", async ({
  page,
}) => {
  await page.goto("/grammatik");

  await expect(page.locator("#unitCount")).toHaveText("144");
  await expect(page.locator("#levelList details.level")).toHaveCount(6);
  await expect(page.locator("#levelList button.topic")).toHaveCount(144);

  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    const group = page.locator("#levelList details.level").filter({
      has: page.locator("summary", { hasText: `${level} · GER` }),
    });
    await expect(group.locator("button.topic")).toHaveCount(24);
  }

  await page.locator("#topicSearch").fill("Modalität und Evidentialität");
  const advancedTopic = page.getByRole("button", {
    name: /Modalität und Evidentialität/,
  });
  await expect(advancedTopic).toBeVisible();
  await advancedTopic.click();
  await expect(page.locator("#lessonTitle")).toHaveText(
    "Modalität und Evidentialität",
  );
  await expect(page).toHaveURL(
    /topic=Modalit%C3%A4t\+und\+Evidentialit%C3%A4t/,
  );
});

test("grammar catalog stays usable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/grammatik");

  await expect(page.locator("#levelList")).toBeVisible();
  await expect(page.locator("#levelList details.level")).toHaveCount(6);
  const dimensions = await page.locator("body").evaluate((body) => ({
    clientWidth: body.clientWidth,
    scrollWidth: body.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
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

  await page.getByLabel("Thema").selectOption({ index: 1 });
  await expect(page.getByLabel("Dein Transkript")).toHaveValue("");
  await expect(
    page.getByText(
      "Thema geändert. Starte eine neue Sitzung vor der Aufnahme.",
    ),
  ).toBeVisible();
});

test("resources remain complete and the old topic route opens the studio", async ({
  page,
}) => {
  await page.goto("/ressourcen");
  await expect(
    page.getByRole("heading", {
      name: "Lernmaterial & direkte Themenlinks",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Lernbereich")).toHaveValue("Grammatik");
  await expect(page.getByLabel("Niveau")).toHaveValue("A1");
  await expect(page.getByLabel("Thema")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Erklärung & Übungen öffnen" }).first(),
  ).toBeVisible();
  await page.getByLabel("Niveau").selectOption("A2");
  await expect(page.getByLabel("Thema").locator("option")).not.toHaveCount(1);

  await page.goto("/themen");
  await expect(page).toHaveURL(/\/studio$/);
  await expect(
    page.getByRole("heading", { name: "Gesprächsstudio" }),
  ).toBeVisible();
  await expect(page.getByLabel("Thema")).toBeVisible();
});

test("private course routes redirect to learner-facing practice", async ({
  page,
}) => {
  await page.goto("/deutsch-mit-marija");
  await expect(page).toHaveURL(/\/ressourcen$/);
  await expect(
    page.getByRole("heading", { name: "Lernmaterial & direkte Themenlinks" }),
  ).toBeVisible();
  await expect(page.locator('a[href*="drive.google.com"]')).toHaveCount(0);
  await expect(
    page
      .locator('[data-slot="card-title"]')
      .filter({ hasText: /^Begegnungen A1\+ · öffentliche Übungen$/ }),
  ).toBeVisible();
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
  await page.getByRole("link", { name: "Heutiges Training" }).click();

  await expect(page).toHaveURL(/\/heute$/);
  await expect(
    page.getByRole("heading", {
      name: "Mit welchem Niveau möchtest du starten?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^A1/ }).click();
  await expect(page.getByText("Heutiges Training · 15 Minuten")).toBeVisible();
});

test("daily path offers every CEFR start level", async ({ page }) => {
  await page.goto("/heute");

  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${level}`) }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: /^B2/ }).click();
  await expect(
    page.getByRole("heading", { name: "Heutige Lernmission: 15 Minuten" }),
  ).toBeVisible();
  await expect(page.locator(".daily-overview-hero h2")).toContainText("B2");
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
