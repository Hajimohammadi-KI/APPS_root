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
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
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
    page.getByRole("heading", { name: "Willkommen, Lernende" }),
  ).toBeVisible();
  await expect(page.getByText("Persönliches Lern-Dashboard")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Leistungsdiagramm" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lernweg auswählen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /App installieren|App ist installiert/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Starke Grammatik aufbauen/i }),
  ).toHaveAttribute("href", "/grammatik");
  await expect(
    page.getByRole("link", { name: /Alltagsgespräche sicher meistern/i }),
  ).toHaveAttribute("href", "/studio");
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
    /topic=Modalit%C3%A4t(?:%20|\+)und(?:%20|\+)Evidentialit%C3%A4t/,
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

  // The shared application shell owns navigation and route controls. The
  // imported studio prototype keeps only its page heading, not an overlapping
  // sidebar or duplicate status/install controls.
  await expect(page.locator(".app-shell > .sidebar")).toBeHidden();
  await expect(
    page.locator(".app-shell > main > header .header-actions"),
  ).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Gesprächsstudio", level: 1 }),
  ).toBeVisible();
  await expect(page.getByLabel("Thema")).toBeVisible();
  await page.getByLabel("Dein Transkript").fill("Zu kurz");
  const evaluateButton = page.getByRole("button", {
    name: "Antwort auswerten",
  });
  await expect(evaluateButton).toBeEnabled();
  await evaluateButton.click();
  await expect(page.getByText(/2\/12 Wörter/)).toBeVisible();

  await page.getByLabel("Thema").selectOption({ index: 1 });
  await expect(page.getByLabel("Dein Transkript")).toHaveValue("");
  await expect(
    page.getByText(
      "Thema geändert. Die vorige Antwort wurde verworfen; es wird keine alte Bewertung übernommen.",
    ),
  ).toBeVisible();
});

test("studio controls stay reachable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio?topic=12");

  const dimensions = await page.locator("body").evaluate((body) => ({
    clientWidth: body.clientWidth,
    scrollWidth: body.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  await page.getByLabel("Dein Transkript").fill("Zu kurz");
  const evaluateButton = page.getByRole("button", {
    name: "Antwort auswerten",
  });
  await evaluateButton.scrollIntoViewIfNeeded();
  await evaluateButton.click();
  await expect(page.getByText(/2\/12 Wörter/)).toBeVisible();
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
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("GrammarAutomaticityV11_de") ?? "{}",
        ) as { settings?: { minWords?: number } };
        return state.settings?.minWords;
      }),
    )
    .toBe(18);
  await page.reload();
  await expect(
    page.getByLabel("Mindestwörter pro Gesprächsantwort"),
  ).toHaveValue("18");
});

test("settings explain installation on every supported device family", async ({
  page,
}) => {
  await page.goto("/einstellungen");

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
  await expect(page.getByText(/Im Browser „App installieren“/)).toBeVisible();
});

test("retired classic route returns to the supported dashboard", async ({
  page,
}) => {
  await page.goto("/klassik");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Willkommen/ })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
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
    page.getByRole("heading", { name: "Willkommen, Lernende" }),
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
      name: "Deine heutige 15-Minuten-Lernmission",
    }),
  ).toBeVisible();
  for (const duration of [15, 30, 45]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${duration}`) }),
    ).toBeVisible();
  }
});

test("daily path scales and persists the workload", async ({ page }) => {
  await page.goto("/heute");

  await expect(page.locator(".activity")).toHaveCount(7);
  await page.getByRole("button", { name: /^45/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Deine heutige 45-Minuten-Lernmission",
    }),
  ).toBeVisible();
  const workload = await page.locator(".activity").evaluateAll((cards) => ({
    minutes: cards.reduce(
      (sum, card) => sum + Number((card as HTMLElement).dataset.minutes),
      0,
    ),
    units: cards.reduce(
      (sum, card) => sum + Number((card as HTMLElement).dataset.units),
      0,
    ),
  }));
  expect(workload).toEqual({ minutes: 45, units: 21 });

  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Deine heutige 45-Minuten-Lernmission",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^45/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const writingCard = page.locator(".activity", {
    hasText: "Tägliches Schreiben",
  });
  await writingCard.getByRole("button", { name: "Übung öffnen" }).click();
  await expect(page).toHaveURL(
    /\/automatik\?from=daily&activity=5&session=45&minutes=6&units=3/,
  );
});
