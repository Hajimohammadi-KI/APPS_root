import { expect, test } from "@playwright/test";

const legacyUrl = process.env.E2E_LEGACY_URL ?? "http://localhost:3301";
const migratedUrl = process.env.E2E_BASE_URL ?? "http://localhost:3201";

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
    "Personal learning dashboard",
    "Small, measurable practice that turns English into a usable skill.",
    "Select a course",
    "Master Everyday Conversations",
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
  await expect(navigation.getByRole("link")).toHaveCount(13);
  await expect(navigation.getByRole("button")).toHaveCount(4);

  await page.goto(`${migratedUrl}/studio`);
  for (const label of [
    "Level",
    "Skill",
    "Category",
    "Topic",
    "Grammar correction",
    "Real speaking evidence",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Record", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Evaluate my answer/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save practice/ })).toBeVisible();
  await expect(page.locator(".record-controls button")).toHaveCount(5);
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-conversation.png",
  });

  await page.goto(`${migratedUrl}/daily`);
  await expect(page.locator(".activity")).toHaveCount(7);
  for (const title of [
    "Activate & use accurately",
    "Automate aloud",
    "Speak freely & transfer",
    "Review & save evidence",
  ]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await page.goto(`${migratedUrl}/grammar`);
  await expect(
    page.getByText("112 CEFR-aligned units · 672 tracked exercises"),
  ).toBeVisible();
  for (const label of [
    "Search topics",
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

  await page.goto(`${migratedUrl}/?screen=resources`);
  await expect(page.locator(".resource-card")).toHaveCount(43);

  await page.goto(`${migratedUrl}/?screen=errors`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();

  await page.goto(`${migratedUrl}/?screen=library`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Audio Library" }),
  ).toBeVisible();

  await page.goto(`${migratedUrl}/settings`);
  for (const label of [
    "Reading style",
    "Text size",
    "Require correct spelling for grammar mastery",
    "Allow optional online grammar checks",
    "Export data",
    "Choose backup folder",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});
