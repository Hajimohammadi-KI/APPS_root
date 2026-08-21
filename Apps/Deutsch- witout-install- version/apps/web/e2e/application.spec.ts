import { expect, test } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
}

// These journeys intentionally use roles and current learner-visible copy.
// They gate the SelectMenu/Accordion UI rather than the retired native-select
// and legacy iframe implementation.
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
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response?.ok(), `${route} should return a successful response`).toBe(
      true,
    );
    await expect(page.locator("main h1").first()).toBeVisible();
  }
});

test("dashboard exposes the current learning journey and migrates legacy state", async ({
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
    page.getByRole("heading", {
      name: /Guten (Morgen|Tag|Abend), Lernende/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Personalpronomen und sein · A1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Zeit wählen und alle fünf Schritte bearbeiten",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hilfe zur Benutzung öffnen" })
    .click();
  const help = page.getByRole("dialog", {
    name: "So benutzt du DeutschFlow",
  });
  await expect(help).toBeVisible();
  await expect(help.getByText(/Fortschritt.*Gerät gespeichert/i)).toBeVisible();
  await help.getByRole("button", { name: "Schließen" }).click();
  await expect(help).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Windows-App installieren" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Grammatik-Labor/ }).first(),
  ).toHaveAttribute("href", /\/grammatik\?from=daily/);
  await expect(
    page.getByRole("link", { name: /Gesprächsstudio/ }).first(),
  ).toHaveAttribute("href", /\/studio\?from=daily&step=3/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("GrammarAutomaticityV12_de");
        if (!raw) return null;
        const state = JSON.parse(raw) as {
          version?: number;
          errors?: unknown[];
        };
        return { version: state.version, errors: state.errors?.length ?? 0 };
      }),
    )
    .toEqual({ version: 2, errors: 1 });
});

test("grammar lab uses a single-open vertical unit menu and selects an advanced topic", async ({
  page,
}) => {
  await page.goto("/grammatik");
  await waitForHydration(page);

  const a1Trigger = page.getByRole("button", { name: "A1 · 24 Einheiten" });
  const a2Trigger = page.getByRole("button", { name: "A2 · 24 Einheiten" });
  await expect(a1Trigger).toHaveAttribute("aria-expanded", "true");
  await expect(a2Trigger).toHaveAttribute("aria-expanded", "false");

  const a1List = page.getByRole("list", { name: "A1 Einheiten" });
  const a1Rows = a1List.locator('[data-slot="grammar-unit-row"]');
  await expect(a1Rows).toHaveCount(24);
  await expect(
    a1Trigger.locator('[data-slot="accordion-trigger-icon"]'),
  ).toHaveCSS("rotate", "180deg");
  const verticalLayout = await a1List.evaluate((list) => {
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>('[data-slot="grammar-unit-row"]'),
    );
    const rowRects = rows.map((row) => row.getBoundingClientRect());
    const itemRects = rows.map((row) =>
      row.parentElement?.getBoundingClientRect(),
    );
    const listStyle = getComputedStyle(list);
    return {
      display: listStyle.display,
      flexWrap: listStyle.flexWrap,
      allRowsFullWidth: rows.every((row, index) => {
        const parentWidth =
          row.parentElement?.getBoundingClientRect().width ?? 0;
        return Math.abs(rowRects[index]!.width - parentWidth) < 1;
      }),
      allItemsFullWidth: itemRects.every(
        (rect) => rect && Math.abs(rect.width - list.clientWidth) < 1,
      ),
      allRowsVertical: rowRects.every(
        (rect, index) => index === 0 || rect.top >= rowRects[index - 1]!.bottom,
      ),
    };
  });
  expect(verticalLayout).toEqual({
    display: "block",
    flexWrap: "nowrap",
    allRowsFullWidth: true,
    allItemsFullWidth: true,
    allRowsVertical: true,
  });

  await a2Trigger.click();
  await expect(a1Trigger).toHaveAttribute("aria-expanded", "false");
  await expect(a2Trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    a1Trigger.locator('[data-slot="accordion-trigger-icon"]'),
  ).toHaveCSS("rotate", "none");
  await expect(
    a2Trigger.locator('[data-slot="accordion-trigger-icon"]'),
  ).toHaveCSS("rotate", "180deg");
  await expect(
    page.getByRole("list", { name: "A2 Einheiten" }).getByRole("button"),
  ).toHaveCount(24);
  await a2Trigger.click();
  await expect(a2Trigger).toHaveAttribute("aria-expanded", "false");

  const c2Trigger = page.getByRole("button", { name: "C2 · 24 Einheiten" });
  await c2Trigger.focus();
  await c2Trigger.press("Enter");
  await expect(c2Trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("list", { name: "C2 Einheiten" }).getByRole("button"),
  ).toHaveCount(24);

  const advancedTopic = page.getByRole("button", {
    name: /Modalität und Evidentialität/,
  });
  await expect(advancedTopic).toBeVisible();
  await advancedTopic.click();
  await expect(
    page.getByText("Modalität und Evidentialität", { exact: true }).first(),
  ).toBeVisible();
  await expect(advancedTopic).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", { name: /3\. Frei sprechen & übertragen/ }),
  ).toHaveAttribute(
    "href",
    /level=C2&grammar=Modalit%C3%A4t%20und%20Evidentialit%C3%A4t/,
  );
});

test("grammar catalog stays usable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/grammatik");

  await expect(
    page.getByRole("heading", { name: "Grammatik-Labor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "A1 · 24 Einheiten" }),
  ).toBeVisible();
  const dimensions = await page.locator("body").evaluate((body) => ({
    clientWidth: body.clientWidth,
    scrollWidth: body.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("studio resets stale transcript evidence when the topic changes", async ({
  page,
}) => {
  await page.goto("/studio?topic=12");

  const topicMenu = page.getByRole("combobox", { name: "Thema" });
  await expect(topicMenu).toBeVisible();
  const transcript = page.getByLabel("Dein Transkript");
  await transcript.fill("Dieser Entwurf gehört nur zum ersten Thema.");
  await expect(
    page.getByRole("button", { name: /Antwort auswerten/ }),
  ).toBeEnabled();
  await topicMenu.click();
  await page.getByRole("option").nth(1).click();
  await expect(page.getByLabel("Dein Transkript")).toHaveValue("");
  await expect(page.getByText(/Keine Bewertung wird angezeigt/)).toBeVisible();
});

test("studio records, improves, evaluates, and saves a real session flow", async ({
  page,
}) => {
  await page.route("**/api/conversation/evaluate", async (route) => {
    const { text } = route.request().postDataJSON() as { text: string };
    const offset = text.indexOf("habe");
    const hasIssue = offset >= 0;
    await route.fulfill({
      contentType: "application/json",
      json: {
        original: text,
        corrected: hasIssue ? text.replace("habe", "bin") : text,
        provider: "LanguageTool",
        checkedAt: new Date().toISOString(),
        issues: hasIssue
          ? [
              {
                message: "Bei gehen wird das Perfekt mit sein gebildet.",
                offset,
                length: 4,
                replacements: ["bin"],
                ruleId: "PERFEKT_AUXILIARY",
                category: "Grammatik",
              },
            ]
          : [],
      },
    });
  });
  await page.addInitScript(() => {
    class TestMediaRecorder {
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      state: RecordingState = "inactive";
      private stopListeners: Array<() => void> = [];

      addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) {
        if (type !== "stop") return;
        this.stopListeners.push(() => {
          if (typeof listener === "function") listener(new Event("stop"));
          else listener.handleEvent(new Event("stop"));
        });
      }
      pause() {
        this.state = "paused";
      }
      resume() {
        this.state = "recording";
      }
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["recorded German answer"], {
            type: this.mimeType,
          }),
        } as BlobEvent);
        this.onstop?.();
        this.stopListeners.forEach((listener) => listener());
      }
    }
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: TestMediaRecorder,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined }],
        }),
      },
    });
  });

  await page.goto("/studio");
  const transcript = page.getByLabel("Dein Transkript");
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await transcript.fill(
    "Ich habe gestern gegangen und danach Freunde besucht.",
  );
  await page.getByRole("button", { name: "■ Stop" }).click();
  await expect(page.getByLabel("Recorded answer")).toBeVisible();
  await expect(page.getByText("Höre deine echte Aufnahme")).toBeVisible();

  await page.getByRole("button", { name: /Antwort auswerten/ }).click();
  await expect(
    page.getByText("Prüfe deine Antwort", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Corrections →" }).click();
  await expect(
    page.getByText("Bei gehen wird das Perfekt mit sein gebildet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Improve →" }).click();

  await page.getByRole("button", { name: /Neue Aufnahme/ }).click();
  await expect(transcript).toHaveValue("");
  await transcript.fill(
    "Ich bin gestern gegangen und habe danach Freunde besucht.",
  );
  await page.getByRole("button", { name: "■ Stop" }).click();
  await page.getByRole("button", { name: /Antwort auswerten/ }).click();
  await page.getByRole("button", { name: "Corrections →" }).click();
  await page.getByRole("button", { name: "Improve →" }).click();
  await expect(page.getByText("FIRST ATTEMPT", { exact: true })).toBeVisible();
  await expect(
    page.getByText("NEW VERIFIED ATTEMPT", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Active-speech analysis unavailable"),
  ).toBeVisible();

  await page.getByRole("button", { name: /Save practice/ }).click();
  await page
    .getByRole("button", { name: "✓ Save session", exact: true })
    .click();
  await expect(
    page
      .getByText("Sitzung wurde auf diesem Gerät gespeichert.", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "✓ Saved" })).toBeDisabled();
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
  await expect(
    page.getByRole("combobox", { name: "Lernbereich" }),
  ).toContainText(/Lernbereich\s*Grammatik/);
  const levelMenu = page.getByRole("combobox", { name: "Niveau" });
  await expect(levelMenu).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Thema" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Erklärung & Übungen öffnen" }).first(),
  ).toBeVisible();
  await levelMenu.click();
  await page.getByRole("option", { name: "A2", exact: true }).click();
  await expect(levelMenu).toContainText(/Niveau\s*A2/);
  await expect(page.getByText(/genaue Themen/)).toBeVisible();

  await page.goto("/themen");
  await expect(page).toHaveURL(/\/studio$/);
  await expect(
    page.getByRole("heading", { name: "Gesprächsstudio" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Thema" })).toBeVisible();
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

test("settings route stays local without changing learner data", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("settings-route-marker", "preserve"),
  );
  await page.goto("/einstellungen");
  await expect(
    page.getByRole("heading", { name: "Einstellungen" }),
  ).toBeVisible();
  await expect(
    page.getByText(/ohne separates Einstellungsmodul/),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("settings-route-marker")),
  ).toBe("preserve");
});

test("settings controls persist locally after reload", async ({ page }) => {
  await page.goto("/einstellungen");
  await waitForHydration(page);

  await expect(page).toHaveURL(/\/einstellungen$/);
  await page.getByRole("radio", { name: /125 %/ }).check();
  await page
    .getByRole("checkbox", { name: "Leselineal auf Seiten anzeigen" })
    .check();
  await page.reload();
  await waitForHydration(page);
  await expect(page.getByRole("radio", { name: /125 %/ })).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Leselineal auf Seiten anzeigen" }),
  ).toBeChecked();
});

test("retired v20.8 route returns to the maintained dashboard", async ({
  page,
}) => {
  await page.goto("/klassik");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      name: /Guten (Morgen|Tag|Abend), Lernende/,
    }),
  ).toBeVisible();
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
    page.getByRole("heading", {
      name: /Guten (Morgen|Tag|Abend), Lernende/,
    }),
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
      name: "Dein vollständiges tägliches Automatikprogramm",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Zeit wählen und alle fünf Schritte bearbeiten",
    }),
  ).toBeVisible();
});

test("daily path exposes all five modules with valid deep links", async ({
  page,
}) => {
  await page.goto("/heute");
  const modules = page.locator(".daily-auto-program__grid > li");
  await expect(modules).toHaveCount(5);
  const studioLink = page
    .getByRole("link", { name: /Gesprächsstudio/ })
    .first();
  await expect(studioLink).toHaveAttribute(
    "href",
    /\/studio\?from=daily&step=3&session=15&minutes=4&units=1/,
  );
  expect(await studioLink.getAttribute("href")).not.toContain("?from=daily?");
});

test("vocabulary adds, recalls, reschedules, and restores a card", async ({
  page,
}) => {
  await page.goto("/vokabelkarten");
  await expect(
    page.getByRole("heading", { name: "Vokabelkarten" }),
  ).toBeVisible();
  await page.getByLabel("Vorderseite (Wort oder Ausdruck)").fill("verschieben");
  await page
    .getByLabel("Rückseite (Bedeutung oder Übersetzung)")
    .fill("auf einen späteren Zeitpunkt legen");
  await page
    .getByLabel("Originalsatz (optional)")
    .fill("Wir müssen den Termin auf Freitag verschieben.");
  await page.getByRole("button", { name: "Karte hinzufügen" }).click();

  await expect(page.getByText("1 Karten · 1 heute fällig")).toBeVisible();
  await expect(
    page
      .getByText("auf einen späteren Zeitpunkt legen", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Getippte Antwort").fill("verschieben");
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.getByText("Richtig", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Richtig und leicht" }).click();
  await expect(page.getByText("1 Karten · 0 heute fällig")).toBeVisible();

  const scheduled = await page.evaluate(() => {
    const raw = localStorage.getItem("GrammarAutomaticityV12_de");
    if (!raw) return null;
    const state = JSON.parse(raw) as {
      flashcards?: Array<{
        front?: string;
        production?: { dueAt?: number; successStreak?: number };
      }>;
    };
    const card = state.flashcards?.find((item) => item.front === "verschieben");
    return card
      ? {
          dueInFuture: (card.production?.dueAt ?? 0) > Date.now(),
          streak: card.production?.successStreak,
        }
      : null;
  });
  expect(scheduled).toEqual({ dueInFuture: true, streak: 1 });

  await page.reload();
  await expect(page.getByText("1 Karten · 0 heute fällig")).toBeVisible();
  await expect(page.getByText(/verschieben.*späteren Zeitpunkt/)).toBeVisible();
});
