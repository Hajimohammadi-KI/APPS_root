import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openNavigationLink(page: Page, label: string, group: string) {
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });
  const trigger = navigation.getByRole("button", {
    name: new RegExp(`^${group}`),
  });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
  await navigation.getByRole("link", { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.indexedDB.deleteDatabase("grammar-automaticity-audio");
  });
  await page.goto("/");
});

test("loads the focused dashboard and complete product navigation", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Englisch sicher und automatisch anwenden",
    }),
  ).toBeAttached();
  const heroProof = page.locator(".dashboard-hero-proof");
  await expect(
    heroProof.getByText("112 Grammatikeinheiten", { exact: true }),
  ).toBeVisible();
  await expect(
    heroProof.getByText("72 Gesprächsthemen", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Produktnavigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sicher in drei Schritten beginnen" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hilfe zur Bedienung öffnen" })
    .click();
  const help = page.getByRole("dialog", {
    name: "So nutzt du English Automaticity",
  });
  await expect(help).toBeVisible();
  await expect(
    help.getByText(/Fortschritt wird automatisch auf diesem Gerät gespeichert/),
  ).toBeVisible();
  await help.getByRole("button", { name: "Hilfe schließen" }).click();

  await page.screenshot({
    fullPage: true,
    path: "test-results/dashboard-desktop.png",
  });
});

test("opens every legacy product surface", async ({ page }) => {
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });
  const surfaces = [
    ["Gesprächsstudio", "Tägliche Praxis", "Gesprächsstudio"],
    ["Tägliches Training", "Tägliche Praxis", "Täglicher Automatisierungspfad"],
    ["Grammatiklabor", "Lernwege", "Grammatiklabor"],
    ["Lernressourcen", "Lernwege", "Online-Lernressourcen"],
    ["Fehlerwerkstatt", "Lernnachweise", "Fehlerwerkstatt"],
    ["Audiothek", "Lernnachweise", "Audiothek"],
    ["Einstellungen", "App und Einstellungen", "Einstellungen"],
    [
      "Startseite",
      "Tägliche Praxis",
      "Englisch sicher und automatisch anwenden",
    ],
  ] as const;

  for (const [button, group, heading] of surfaces) {
    await openNavigationLink(page, button, group);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeAttached();
  }
});

test("preserves catalog counts and supports grammar practice", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });

  await openNavigationLink(page, "Gesprächsstudio", "Tägliche Praxis");
  await expect(page.getByText("72 Themen", { exact: true })).toBeVisible();

  await openNavigationLink(page, "Grammatiklabor", "Lernwege");
  await expect(page.getByText("112 Einheiten", { exact: true })).toBeVisible();
  await page.getByLabel("Grammatik suchen").fill("Word order in phrasal verbs");
  await expect(
    page.getByText("1 von 112 Einheiten", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Word order in phrasal verbs",
    }),
  ).toBeVisible();
  await expect(page.getByText("1/8", { exact: true })).toBeVisible();

  const answer = page.getByPlaceholder("Englische Antwort eingeben");
  await answer.fill("Turn it down.");
  await page.getByRole("button", { name: "Antwort prüfen" }).click();
  await expect(
    page.getByText(
      "Richtig. Sprich die vollständige Antwort laut und fahre dann fort.",
    ),
  ).toBeVisible();

  await openNavigationLink(page, "Lernressourcen", "Lernwege");
  await expect(
    page.getByText("43 direkte Ressourcen", { exact: true }),
  ).toBeVisible();

  await expect(navigation.locator('a[href*="screen=thesis"]')).toHaveCount(0);
});

test("is usable through the compact mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });

  await expect(
    page.getByRole("heading", { name: "Vom Abruf zum sicheren Sprechen" }),
  ).toBeVisible();
  await expect(page.locator(".progress-story-card")).toHaveCount(3);
  await expect(
    page
      .locator(".dashboard-hero-image")
      .evaluate(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0,
      ),
  ).resolves.toBe(true);
  await page.screenshot({
    fullPage: true,
    path: "test-results/dashboard-mobile.png",
  });

  await expect(navigation).not.toBeVisible();
  await page.getByRole("button", { name: "Navigation öffnen" }).click();
  await expect(navigation).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/accordion-mobile.png",
  });
  await navigation.getByRole("link", { name: "Tägliches Training" }).click();
  await expect(
    page.getByRole("heading", { name: "Täglicher Automatisierungspfad" }),
  ).toBeVisible();
  await expect(navigation).not.toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: "test-results/daily-mobile.png",
  });
});

test("provides accordion navigation and cross-platform installation", async ({
  page,
  request,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });
  const practiceGroup = navigation.getByRole("button", {
    name: /^Tägliche Praxis/,
  });

  await expect(practiceGroup).toHaveAttribute("aria-expanded", "true");
  await practiceGroup.press("Enter");
  await expect(practiceGroup).toHaveAttribute("aria-expanded", "false");
  await expect(
    navigation.getByRole("link", { name: "Startseite", exact: true }),
  ).not.toBeAttached();
  await practiceGroup.press("Enter");
  await expect(
    navigation.getByRole("link", { name: "Startseite", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Installationsanleitung öffnen" })
    .press("Enter");
  const guide = page.getByRole("dialog", {
    name: "English Automaticity installieren",
  });
  await expect(guide).toBeVisible();
  await expect(
    guide.getByText(
      "Slack, Vercel, kostenpflichtige Software und zusätzliche Entwicklerwerkzeuge sind nicht erforderlich.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(guide.locator('a[href*="slack.com"]')).toHaveCount(0);
  await expect(
    guide.getByRole("heading", {
      name: "1. Ordner für Sicherungen wählen",
    }),
  ).toBeVisible();
  await expect(
    guide.getByText(
      "Das Betriebssystem wählt den geschützten Installationsort.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    guide.getByRole("heading", {
      name: "2. Auf diesem Gerät installieren",
    }),
  ).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Windows" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Android" })).toBeVisible();
  await expect(
    guide.getByRole("heading", { name: "iPhone / iPad" }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/install-guide-desktop.png",
  });
  await guide
    .getByRole("button", { name: "Installationsanleitung schließen" })
    .click();
  await expect(guide).not.toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "English Automaticity installieren" })
    .press("Enter");
  await expect(guide).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/install-guide-mobile.png",
  });
  await guide
    .getByRole("button", { name: "Installationsanleitung schließen" })
    .click();

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    id: "/",
    scope: "/",
    start_url: "/",
  });
  expect(manifest.icons).toHaveLength(4);
  expect(
    manifest.icons.map((icon: { purpose: string }) => icon.purpose),
  ).toEqual(expect.arrayContaining(["any", "maskable"]));
  expect(manifest.shortcuts).toHaveLength(3);

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBeTruthy();
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toContain("grammar-automaticity-v27-focus-accordion-v5");
  expect(serviceWorker).toContain('"/?screen=daily"');
});

test("writes progress backups to the folder selected during setup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const storage = navigator.storage as StorageManager & {
          getDirectory: () => Promise<{
            getDirectoryHandle: (
              name: string,
              options: { create: boolean },
            ) => Promise<FileSystemDirectoryHandle>;
          }>;
        };
        const root = await storage.getDirectory();
        return root.getDirectoryHandle("Grammar Backups", { create: true });
      },
    });
  });
  await page.reload();

  await page
    .getByRole("button", { name: "English Automaticity installieren" })
    .click();
  const guide = page.getByRole("dialog", {
    name: "English Automaticity installieren",
  });
  await guide.getByRole("button", { name: "Ordner wählen" }).click();
  await expect(
    guide.getByText("Grammar Backups", { exact: true }),
  ).toBeVisible();
  await guide
    .getByRole("button", { name: "Installationsanleitung schließen" })
    .click();

  await page.goto("/?screen=settings");
  await page.getByRole("button", { name: "Daten exportieren" }).click();
  await expect(
    page.getByText("Sicherung in „Grammar Backups“ gespeichert.", {
      exact: true,
    }),
  ).toBeVisible();

  const backup = await page.evaluate(async () => {
    const storage = navigator.storage as StorageManager & {
      getDirectory: () => Promise<FileSystemDirectoryHandle>;
    };
    const root = await storage.getDirectory();
    const directory = await root.getDirectoryHandle("Grammar Backups");
    const handle = await directory.getFileHandle(
      "grammar-automaticity-v27-backup.json",
    );
    return JSON.parse(await (await handle.getFile()).text()) as {
      version?: number;
    };
  });
  expect(backup.version).toBe(27);
});

test("deep-links every screen and preserves browser navigation", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });

  await openNavigationLink(page, "Grammatiklabor", "Lernwege");
  await expect(page).toHaveURL(/\?screen=grammar$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammatiklabor" }),
  ).toBeVisible();

  await openNavigationLink(page, "Einstellungen", "App und Einstellungen");
  await expect(page).toHaveURL(/\?screen=settings$/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammatiklabor" }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: "Einstellungen" }),
  ).toBeVisible();
});

test("retires the private route and removes its old local data", async ({
  page,
}) => {
  await page.evaluate(() => {
    const current = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") ?? "{}",
    );
    localStorage.setItem(
      "grammar-automaticity:v27",
      JSON.stringify({
        ...current,
        thesis: { selected: "private-unit", units: { "private-unit": {} } },
      }),
    );
    localStorage.setItem("thesis-b2-sprint-v24", '{"selected":"private-unit"}');
  });

  await page.goto("/?screen=thesis");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Englisch sicher und automatisch anwenden",
    }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const current = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        );
        return {
          retired: localStorage.getItem("thesis-b2-sprint-v24"),
          hasPrivateState: Object.hasOwn(current, "thesis"),
        };
      }),
    )
    .toEqual({ retired: null, hasPrivateState: false });
});

test("runs saved assessment, error repair, and daily gates", async ({
  page,
}) => {
  await page.route("**/api/assessment", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON() as { text: string };
    const original = payload.text;
    const errorOffset = original.indexOf("don't");
    const hasError = errorOffset >= 0;
    const corrected = hasError
      ? original.replace("don't", "doesn't")
      : original;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      json: {
        changed: hasError,
        corrected,
        matches: hasError
          ? [
              {
                context: {
                  length: 5,
                  offset: errorOffset,
                  text: original,
                },
                length: 5,
                message: "Use third-person singular agreement.",
                offset: errorOffset,
                replacements: [{ value: "doesn't" }],
                rule: {
                  category: { name: "Grammar" },
                  id: "HE_VERB_AGR",
                },
              },
            ]
          : [],
        online: true,
        original,
      },
    });
  });

  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });
  await openNavigationLink(page, "Einstellungen", "App und Einstellungen");
  await page.getByLabel(/Freiwillige Online-KI erlauben/).check();
  await openNavigationLink(page, "Gesprächsstudio", "Tägliche Praxis");
  await page.getByRole("button", { name: "Sitzung starten" }).click();
  const answer = page.getByLabel("Gesprächsantwort");
  await answer.fill(
    "I am a student. I am ready today. I am interested in research. I am tired after work. Are you a student?",
  );
  await page.getByRole("button", { name: "Antwort auswerten" }).click();
  await expect(
    page.getByText(
      "Antwort ausgewertet und gespeichert. Fahre mit der Rückfrage fort.",
    ),
  ).toBeVisible();

  await answer.fill(
    "She don't work here. I am a student. I am ready today. I feel tired after work. Are you ready?",
  );
  await page.getByRole("button", { name: "Antwort auswerten" }).click();
  await expect(
    page.getByText(
      "Noch nicht bestanden. Verbessere die genauen Fehler und werte erneut aus.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "In der Fehlerwerkstatt speichern" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Fehlerwerkstatt" }),
  ).toBeVisible();
  await expect(
    page.getByText("Use third-person singular agreement.").first(),
  ).toBeVisible();

  await page
    .getByPlaceholder(
      "Schreibe einen neuen englischen Satz mit der korrigierten Struktur in einem anderen Kontext.",
    )
    .fill("She does not work there because the office closes early.");
  await page
    .getByLabel("Ich habe die korrigierte Form laut wiederholt.")
    .check();
  await page.getByLabel("Dies ist ein neuer Kontext und keine Kopie.").check();
  await page.getByRole("button", { name: "Reparatur auswerten" }).click();
  await expect(page.getByText("Keine Fehler in dieser Ansicht")).toBeVisible();

  await openNavigationLink(page, "Tägliches Training", "Tägliche Praxis");
  await page
    .getByPlaceholder(
      "Erkläre die Regel auf Englisch aus dem Gedächtnis, bevor du das Grammatiklabor öffnest.",
    )
    .fill("Use the verb be to identify and describe people or conditions.");
  await page.getByRole("button", { name: "Regelabruf auswerten" }).click();
  await expect(page.getByText("2/7 erledigt", { exact: true })).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}"),
  );
  expect(stored.sessions).toHaveLength(1);
  expect(stored.dailyPlans).toBeTruthy();
  expect(stored.errors[0].repairStatus).toBe("fixed");
});

test("connects to the Nest assessment API", async ({ request }) => {
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:4201";
  const health = await request.get(`${apiUrl}/api/health`);
  expect(health.ok()).toBeTruthy();
  await expect(health.json()).resolves.toMatchObject({
    service: "grammar-automaticity-api",
    status: "ok",
  });

  const assessment = await request.post(`${apiUrl}/api/assessment`, {
    data: {
      language: "en-US",
      text: "She don't work here.",
    },
  });
  expect(assessment.ok()).toBeTruthy();
  await expect(assessment.json()).resolves.toMatchObject({
    corrected: "She doesn't work here.",
    online: true,
  });
});
