import { expect, test } from "@playwright/test";

async function expectDailyCardsToContainLongLabels(
  page: import("@playwright/test").Page,
) {
  // Realistic long German labels verify that responsive wrapping protects the
  // title, status, time, and action rather than merely hiding overflow.
  await page.locator(".activity").evaluateAll((cards) => {
    cards.forEach((card) => {
      const title = card.querySelector(".act-head b");
      const status = card.querySelector(".tag");
      const action = card.querySelector(".open");
      if (title)
        title.textContent =
          "Überprüfen, korrigieren und vollständigen Lernnachweis speichern";
      if (status)
        status.textContent = "Noch nicht begonnen — Rückmeldung erforderlich";
      if (action) action.textContent = "Vollständige Übung öffnen";
    });
  });
  const overflow = await page.locator(".activity").evaluateAll((cards) =>
    cards.flatMap((card, index) => {
      const cardBox = card.getBoundingClientRect();
      return Array.from(
        card.querySelectorAll(".act-head b, .tag, .Minuten, .open"),
      ).flatMap((element) => {
        const box = element.getBoundingClientRect();
        const node = element as HTMLElement;
        return box.left < cardBox.left - 1 ||
          box.right > cardBox.right + 1 ||
          node.scrollWidth > node.clientWidth + 1 ||
          node.scrollHeight > node.clientHeight + 1
          ? [`Karte ${index + 1}: ${element.className || element.tagName}`]
          : [];
      });
    }),
  );
  expect(overflow).toEqual([]);
  const pageWidth = await page.locator("body").evaluate((body) => ({
    client: body.clientWidth,
    scroll: body.scrollWidth,
  }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);
}

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
  "/fertigkeiten",
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
    // Covers both Next.js routes and directly served German practice documents.
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
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
    page.getByText("Automatische Übungssignale", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Durch Lehrkraft bestätigte Beherrschung", { exact: true }),
  ).toBeVisible();
  // A fresh learner gets exactly one explained continuation action; saved
  // reviews or completed daily work can change its destination later.
  const continuePlan = page.getByRole("link", {
    name: "Meinen Plan fortsetzen",
  });
  await expect(continuePlan).toHaveCount(1);
  await expect(
    page.getByText("3 Schritte sind im heute gespeicherten Plan noch offen."),
  ).toBeVisible();
  await expect(continuePlan).toHaveAttribute("href", "/heute");
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

  await page.goto("/fortschritt");
  await expect(page.getByText(/Automatische Übungssignale:/)).toBeVisible();
  await expect(
    page
      .getByRole("note")
      .filter({ hasText: "Durch Lehrkraft bestätigte Beherrschung:" }),
  ).toContainText("nicht erfasst");
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

test("grammar lab separates exact recall from honest multilingual open production", async ({
  page,
}) => {
  await page.goto("/grammatik?topic=es%20gibt%20mit%20Akkusativ");

  await expect(page.locator("#lessonTitle")).toHaveText(
    "es gibt mit Akkusativ",
  );
  await expect(page.locator("#exerciseEyebrow")).toContainText(
    "Geschlossene Übung",
  );
  await page.getByText("Erklärungssprache (HONOVR)").click();
  await page.locator('[data-language="فارسی"]').click();
  await expect(page.locator("#exercisePrompt")).toHaveText(
    "این جمله را به آلمانی بنویس: در خیابان من یک سوپرمارکت وجود دارد.",
  );
  await expect(page.locator("#intentField")).toBeHidden();
  await expect(page.locator("#intentInput")).toBeDisabled();
  await expect(page.locator("#exercisePrompt")).not.toContainText(
    "Es gibt ein Supermarkt in meiner Straße.",
  );
  await page
    .locator("#answerInput")
    .fill("Es gibt ein Supermarkt in meiner Straße.");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback li")).toHaveCount(1);
  await expect(page.locator("#feedback")).toContainText("«ein» → «einen»");
  await expect(page.locator("#feedback")).toContainText(
    "Es gibt einen Supermarkt in meiner Straße.",
  );

  await page.locator('[data-language="Deutsch"]').click();
  await page.getByText("Erklärungssprache (HONOVR)").click();
  await page.locator("#answerInput").fill("Es gibt eine Spermarket im Strasse");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback li")).toHaveCount(3);
  await expect(page.locator("#feedback")).toContainText(
    "„Spermarket“ → „Supermarkt“",
  );
  await expect(page.locator("#feedback")).toContainText("einen Supermarkt");
  await expect(page.locator("#feedback")).toContainText("in meiner Straße");

  await page
    .locator("#answerInput")
    .fill("Es gibt einen Supermarkt in meiner Straße.");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toContainText("Richtig");

  for (let index = 0; index < 4; index += 1) {
    await page.locator("#nextBtn").click();
  }
  await expect(page.locator("#exerciseEyebrow")).toContainText(
    "Freie Produktion",
  );
  await expect(page.locator("#exercisePrompt")).toContainText(
    "erst nach deinem ersten Versuch",
  );
  await expect(page.locator("#exercisePrompt")).not.toContainText(
    "In meiner Straße gibt es einen Supermarkt.",
  );
  await expect(page.locator("#intentField")).toBeVisible();

  await page
    .locator("#answerInput")
    .fill("In meiner Stadt gibt es viele Parks.");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toContainText(
    "Schreibe zuerst auf Persisch",
  );
  await page
    .locator("#intentInput")
    .fill("در شهر من پارک‌های زیادی وجود دارد.");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toContainText("Selbstcheck");
  await expect(page.locator("#feedback")).toContainText(
    "nicht mit dem Modellsatz verglichen",
  );
  await expect(page.locator("#feedback li")).toHaveCount(4);

  await page
    .locator("#answerInput")
    .fill("Es gibt ein Supermarkt in meiner Straße.");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toContainText("einen Supermarkt");

  await page.getByText("Erklärungssprache (HONOVR)").click();
  await page.locator('[data-language="English"]').click();
  await expect(page.locator("#exercisePrompt")).toContainText(
    "Write exactly one complete sentence in German",
  );
  await page.locator("#hintBtn").click();
  await expect(page.locator("#feedback")).toContainText(
    "Keep your answer in German",
  );

  await page.locator('[data-language="فارسی"]').click();
  await expect(page.locator("#exercisePrompt")).toContainText("به آلمانی");
  await expect(page.locator("#answerInput")).toHaveAttribute(
    "placeholder",
    "متن خودت را به آلمانی بنویس",
  );
});

test("approved connected AI evaluates a different valid open answer instead of a fixed model", async ({
  page,
}) => {
  let evaluationRequest: Record<string, unknown> | undefined;
  await page.addInitScript(() => {
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({ learner: { allowOnlineAI: true } }),
    );
  });
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ connected: true }),
      });
      return;
    }
    evaluationRequest = route.request().postDataJSON() as Record<
      string,
      unknown
    >;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        text: JSON.stringify({
          verdict: "correct",
          targetUsed: true,
          complete: true,
          correctedGerman: "In meiner Stadt gibt es viele Parks.",
          feedbackPoints: [
            {
              type: "target_grammar",
              message: "The target is used correctly in your own sentence.",
            },
          ],
          issueTypes: [],
        }),
        providerLabel: "Test AI",
        model: "test-model",
      }),
    });
  });

  await page.goto("/grammatik?topic=es%20gibt%20mit%20Akkusativ");
  for (let index = 0; index < 4; index += 1) {
    await page.locator("#nextBtn").click();
  }
  await page
    .locator("#intentInput")
    .fill("در شهر من پارک‌های زیادی وجود دارد.");
  await page
    .locator("#answerInput")
    .fill("In meiner Stadt gibt es viele Parks.");
  await page.locator("#checkBtn").click();

  await expect(page.locator("#feedback")).toContainText(
    "deine eigene Formulierung wurde ausgewertet",
  );
  await expect(page.locator("#feedback")).toContainText(
    "The target is used correctly in your own sentence.",
  );
  await expect(page.locator("#feedback")).toContainText("Test AI · test-model");
  expect(evaluationRequest?.learnerIntentFa).toBe(
    "در شهر من پارک‌های زیادی وجود دارد.",
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

test("integrated skills applies a searchable multi-select without a long catalogue", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fertigkeiten");

  await page.getByText("Lernpfad auswählen", { exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Niveau A1 anzeigen" }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "Niveau B1 anzeigen" }).check();
  await page.getByRole("checkbox", { name: "Niveau A1 anzeigen" }).uncheck();
  await page.getByRole("checkbox", { name: "Schreiben anzeigen" }).uncheck();
  await page.getByRole("button", { name: "Auswahl anwenden" }).click();

  await expect(page.locator('[data-level="A1"]')).toHaveCount(0);
  await expect(page.locator('[data-level="B1"]')).toHaveCount(1);
  await expect(page.getByText(/Angezeigt: B1/)).toBeVisible();
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

test("teacher review queue turns saved evidence into a next action", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        learner: { displayName: "Elahe" },
        errors: [
          {
            id: "error-teacher-test",
            date: new Date().toISOString(),
            topic: "Perfekt",
            original: "Ich habe gegangen.",
            corrected: "Ich bin gegangen.",
            errorClass: "auxiliary",
            explanation: "Bewegungsverben verwenden sein.",
            occurrenceCount: 2,
            lastSeenAt: Date.now(),
            repairStatus: "new",
            nextRepairAt: 0,
            successfulRepairs: 0,
            critical: true,
          },
        ],
        reviews: [],
      }),
    );
  });
  await page.goto("/lehrkraft");

  await expect(
    page.getByRole("heading", { name: "Auf Lernnachweise reagieren" }),
  ).toBeVisible();
  await expect(page.getByText("1 zu prüfen", { exact: true })).toBeVisible();
  const queueItem = page.getByRole("listitem");
  await expect(queueItem.getByText("Elahe", { exact: true })).toBeVisible();
  await expect(
    queueItem.getByText("Korrektur-Nachweis", { exact: true }),
  ).toBeVisible();
  await expect(queueItem.getByText(/automatisches Signal/i)).toBeVisible();
  await expect(
    queueItem.getByText("Ich habe gegangen. → Ich bin gegangen.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    queueItem.getByRole("link", { name: "Nachweis öffnen und handeln" }),
  ).toHaveAttribute("href", "/fehler");
});

test("teacher composes a reviewed local assignment with plain instructions", async ({
  page,
}) => {
  await page.goto("/lehrkraft");
  await page.getByLabel("GER-Niveau").first().selectOption("B1");
  await page.getByLabel("Fertigkeit").selectOption("speaking");
  await page.getByLabel("Thema").selectOption({ label: "Eine Frist klären" });
  await expect(
    page.getByText("Können wir die ursprüngliche Nachricht prüfen?", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Klare Anweisung für Lernende")
    .fill(
      "Nimm vier Sätze auf. Nenne die Frist, bitte um Bestätigung und prüfe vor dem Speichern die Verbformen.",
    );
  const saveAssignment = page.getByRole("button", {
    name: "Aufgabe zur Prüfung speichern",
  });
  await expect(saveAssignment).toBeDisabled();
  await page
    .getByLabel(
      "Ich habe den eigenen App-Inhalt und die Lernanweisung geprüft.",
    )
    .check();
  await saveAssignment.click();

  await expect(
    page.getByText(
      "Aufgabe lokal mit dem Arbeitsstand Zur Prüfung gespeichert.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Aufgabe · Eine Frist klären" }),
  ).toBeVisible();
});

test("teacher reviews evidence and prepares one focused repair assignment within ten minutes", async ({
  page,
}) => {
  const startedAt = Date.now();
  await page.addInitScript(() => {
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        learner: { displayName: "Elahe" },
        errors: [
          {
            id: "error-focused-workflow",
            date: new Date().toISOString(),
            topic: "Perfekt",
            original: "Ich habe gegangen.",
            corrected: "Ich bin gegangen.",
            errorClass: "auxiliary",
            explanation: "Bewegungsverben verwenden sein.",
            occurrenceCount: 2,
            lastSeenAt: Date.now(),
            repairStatus: "new",
            nextRepairAt: 0,
            successfulRepairs: 0,
            critical: true,
          },
        ],
        reviews: [],
      }),
    );
  });
  await page.goto("/lehrkraft");
  await expect(
    page.getByText("Ich habe gegangen. → Ich bin gegangen.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("GER-Niveau").first().selectOption("B1");
  await page.getByLabel("Fertigkeit").selectOption("speaking");
  await page.getByLabel("Thema").selectOption({ label: "Eine Frist klären" });
  await page
    .getByLabel("Klare Anweisung für Lernende")
    .fill(
      "Repariere das Verb und nimm danach vier Sätze über eine abgeschlossene Erfahrung auf.",
    );
  await page
    .getByLabel(
      "Ich habe den eigenen App-Inhalt und die Lernanweisung geprüft.",
    )
    .check();
  await page
    .getByRole("button", { name: "Aufgabe zur Prüfung speichern" })
    .click();
  await expect(
    page.getByText(
      "Aufgabe lokal mit dem Arbeitsstand Zur Prüfung gespeichert.",
    ),
  ).toBeVisible();

  // Der automatisierte Ablauf prüft die Zehn-Minuten-Grenze; eine echte
  // Lehrerbeobachtung bleibt ein eigener Nachweis im Produktfahrplan.
  expect(Date.now() - startedAt).toBeLessThan(10 * 60 * 1000);
});

test("settings explain local backups and restore a validated file with keyboard access", async ({
  page,
}) => {
  await page.goto("/einstellungen");
  await expect(
    page.getByText("1. Kopie exportieren", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/nicht in einen Cloud-Dienst hoch/i),
  ).toBeVisible();
  await expect(
    page.getByText("3. Zum Wiederherstellen importieren", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  const currentState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("GrammarAutomaticityV11_de") || "{}"),
  );
  const backup = {
    kind: "automaticity.learning-data-export",
    schemaVersion: "1.0.0",
    exportedAt: "2026-08-30T08:00:00.000Z",
    language: "de",
    learnerState: {
      ...currentState,
      learner: {
        ...(currentState.learner || {}),
        displayName: "Wiederhergestellt",
      },
    },
    learningEvidence: {
      schemaVersion: "1.0.0",
      contentUnits: [],
      dailyPlans: [],
      responses: [],
      evidence: [],
      events: [],
    },
  };
  page.on("dialog", (dialog) => dialog.accept());
  const importButton = page.getByRole("button", {
    name: "Sicherung importieren",
  });
  await importButton.focus();
  await expect(importButton).toBeFocused();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "deutsch-automaticity-sicherung.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByRole("status")).toContainText("wiederhergestellt");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("GrammarAutomaticityV11_de") || "{}",
        );
        return state.learner?.displayName;
      }),
    )
    .toBe("Wiederhergestellt");
});

test("daily cards contain long labels at all roadmap widths", async ({
  page,
}) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/heute");
    await expect(page.locator(".activity")).toHaveCount(7);
    await expectDailyCardsToContainLongLabels(page);
  }
});
