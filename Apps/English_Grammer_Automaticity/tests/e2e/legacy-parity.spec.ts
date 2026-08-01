import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const legacyUrl = process.env.E2E_LEGACY_URL ?? "http://localhost:3301";
const migratedUrl = process.env.E2E_BASE_URL ?? "http://localhost:3201";

async function openNavigationLink(
  page: Page,
  label: string,
  group: string,
) {
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

test("keeps the legacy archive loadable as the migration source of truth", async ({
  page,
}) => {
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${legacyUrl}/index.html`);
  await expect(
    page.getByRole("heading", { name: "English Grammar Automaticity" }),
  ).toBeVisible();
  await expect(page.locator(".nav")).toHaveCount(8);
  expect(failedAssets).toEqual([]);
});

test("preserves legacy content while applying the shared accessible theme", async ({
  page,
}) => {
  await page.goto(`${legacyUrl}/index.html`);
  const legacyTheme = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      background: styles.getPropertyValue("--bg").trim(),
      card: styles.getPropertyValue("--card").trim(),
      foreground: styles.getPropertyValue("--text").trim(),
      muted: styles.getPropertyValue("--muted").trim(),
      border: styles.getPropertyValue("--line").trim(),
      primary: styles.getPropertyValue("--primary").trim(),
    };
  });
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-legacy-dashboard.png",
  });

  await page.goto(migratedUrl);
  for (const text of [
    "Englisch sicher und automatisch anwenden",
    "Vom Abruf zum sicheren Sprechen",
    "Heutigen Pfad starten",
    "Gesprächsstudio öffnen",
  ]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByText("Nächste 3 Aufgaben", { exact: true }),
  ).not.toBeAttached();

  const migratedTheme = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      background: styles.getPropertyValue("--background").trim(),
      card: styles.getPropertyValue("--card").trim(),
      foreground: styles.getPropertyValue("--foreground").trim(),
      muted: styles.getPropertyValue("--muted-foreground").trim(),
      border: styles.getPropertyValue("--border").trim(),
      primary: styles.getPropertyValue("--primary").trim(),
    };
  });
  expect(legacyTheme).toEqual({
    background: "#f4f7fb",
    border: "#dce4ee",
    card: "#fff",
    foreground: "#182238",
    muted: "#697386",
    primary: "#1760df",
  });
  expect(migratedTheme).toEqual({
    background: "#f8f7fc",
    border: "#e2dfeb",
    card: "#fff",
    foreground: "#1c1b2d",
    muted: "#686579",
    primary: "#6254e8",
  });
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-dashboard.png",
  });
});

test("keeps every legacy surface, catalog, and primary control available", async ({
  page,
}) => {
  await page.goto(`${legacyUrl}/index.html`);
  await expect(page.locator("html")).toHaveAttribute("data-selftest", "PASS");
  await expect(page.locator(".nav")).toHaveCount(8);
  await expect(page.locator(".controlAction")).toHaveCount(6);
  await expect(page.locator("#dailySteps .dailyExercise")).toHaveCount(7);
  await expect(page.locator("#grammarList .grammarBtn")).toHaveCount(84);
  await expect(page.locator("#resourceGrid .learningCard")).toHaveCount(43);

  await page.goto(migratedUrl);
  const navigation = page.getByRole("navigation", {
    name: "Produktnavigation",
  });
  await expect(navigation.getByRole("link")).toHaveCount(3);
  await expect(navigation.getByRole("button")).toHaveCount(4);

  await openNavigationLink(page, "Gesprächsstudio", "Tägliche Praxis");
  for (const label of [
    "Lernweg",
    "Niveau",
    "Fertigkeit",
    "Kategorie",
    "Thema",
    "Sitzung starten",
    "Antwort aufnehmen",
    "Pausieren",
    "Aufnahme beenden",
    "Antwort auswerten",
    "Sitzung beenden",
    "Grammatikkorrektur",
    "Aktuelle Nachweise",
    "In der Fehlerwerkstatt speichern",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator(".control-button")).toHaveCount(6);
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-conversation.png",
  });

  await openNavigationLink(page, "Tägliches Training", "Tägliche Praxis");
  await expect(page.locator(".daily-step")).toHaveCount(7);
  for (const title of [
    "Aktiver Regelabruf",
    "Drei Sätze bilden",
    "Gespräch mit Avatar",
    "Eine Korrektur verstehen",
    "Laut verbessern",
    "Vermitteln und übertragen",
    "Zeitversetzter Abruf",
    "Fällige Wiederholungen",
  ]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await openNavigationLink(page, "Grammatiklabor", "Lernwege");
  await expect(page.getByText("112 Einheiten", { exact: true })).toBeVisible();
  for (const label of [
    "Grammatik suchen",
    "Grammatikkategorie",
    "Niveau",
    "Antwort prüfen",
    "Hinweis",
    "Nächste Übung",
    "Heute verwenden",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-grammar.png",
  });

  await openNavigationLink(page, "Lernressourcen", "Lernwege");
  await expect(page.locator(".resource-card")).toHaveCount(43);

  await openNavigationLink(page, "Fehlerwerkstatt", "Lernnachweise");
  await expect(
    page.getByRole("heading", { level: 1, name: "Fehlerwerkstatt" }),
  ).toBeVisible();

  await openNavigationLink(page, "Audiothek", "Lernnachweise");
  await expect(
    page.getByRole("heading", { level: 1, name: "Audiothek" }),
  ).toBeVisible();

  await openNavigationLink(page, "Einstellungen", "App und Einstellungen");
  for (const label of [
    "Mindestwortzahl der Antwort",
    "Audio speichern",
    "Grammatik-Engine",
    "Offline-Grundprüfung + freiwilliges LanguageTool online",
    "LanguageTool-Endpunkt",
    "PWA / App",
    "Browserspeicher",
    "Daten exportieren",
    "Daten importieren",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});
