import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const legacyUrl = process.env.E2E_LEGACY_URL ?? "http://localhost:3301";
const migratedUrl = process.env.E2E_BASE_URL ?? "http://localhost:3201";

async function openNavigationLink(page: Page, label: string, group: string) {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
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

  await page.goto(`${legacyUrl}/legacy/index.html`);
  await expect(
    page.getByRole("heading", { name: "English Grammar Automaticity" }),
  ).toBeVisible();
  await expect(page.locator(".nav")).toHaveCount(8);
  expect(failedAssets).toEqual([]);
});

test("preserves legacy content while applying the shared accessible theme", async ({
  page,
}) => {
  await page.goto(`${legacyUrl}/legacy/index.html`);
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
    "Use English confidently and automatically",
    "From recall to confident speaking",
    "Choose your level",
    "Open Conversation Studio",
  ]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByText("Next 3 tasks", { exact: true }),
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
    background: "#f7f4fb",
    border: "#ded4e7",
    card: "#fffefe",
    foreground: "#21182f",
    muted: "#655d70",
    primary: "#7651b4",
  });
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-dashboard.png",
  });
});

test("keeps every legacy surface, catalog, and primary control available", async ({
  page,
}) => {
  await page.goto(`${legacyUrl}/legacy/index.html`);
  await expect(page.locator("html")).toHaveAttribute("data-selftest", "PASS");
  await expect(page.locator(".nav")).toHaveCount(8);
  await expect(page.locator(".controlAction")).toHaveCount(6);
  await expect(page.locator("#dailySteps .dailyExercise")).toHaveCount(7);
  await expect(page.locator("#grammarList .grammarBtn")).toHaveCount(84);
  await expect(page.locator("#resourceGrid .learningCard")).toHaveCount(43);

  await page.goto(migratedUrl);
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  await expect(navigation.getByRole("link")).toHaveCount(3);
  await expect(navigation.getByRole("button")).toHaveCount(4);

  await openNavigationLink(page, "Conversation Studio", "Daily Practice");
  for (const label of [
    "Learning path",
    "Level",
    "Skill",
    "Category",
    "Topic",
    "Start session",
    "Record answer",
    "Pause",
    "Stop recording",
    "Evaluate answer",
    "End session",
    "Grammar Correction",
    "Current Evidence",
    "Save to error workshop",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator(".control-button")).toHaveCount(6);
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-conversation.png",
  });

  await openNavigationLink(page, "Today’s Practice", "Daily Practice");
  await expect(page.locator(".daily-step")).toHaveCount(3);
  for (const title of [
    "1. Activate & use accurately",
    "2. Automate aloud",
    "3. Speak freely & transfer",
    "Due Reviews",
  ]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await openNavigationLink(page, "Grammar Lab", "Learning Paths");
  await expect(page.getByText("112 units", { exact: true })).toBeVisible();
  for (const label of [
    "Search grammar",
    "Grammar category",
    "Level",
    "Check answer",
    "Hint",
    "Next task",
    "Use today",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-grammar.png",
  });

  await openNavigationLink(page, "Learning Resources", "Learning Paths");
  await expect(page.locator(".resource-card")).toHaveCount(43);

  await openNavigationLink(page, "Error Workshop", "Learning Evidence");
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();

  await openNavigationLink(page, "Audio Library", "Learning Evidence");
  await expect(
    page.getByRole("heading", { level: 1, name: "Audio Library" }),
  ).toBeVisible();

  await openNavigationLink(page, "Settings", "App and Settings");
  for (const label of [
    "Minimum words per answer",
    "Save audio",
    "Grammar engine",
    "Offline baseline check + optional LanguageTool online",
    "LanguageTool endpoint",
    "PWA / App",
    "Browser storage",
    "Export data",
    "Import data",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});
