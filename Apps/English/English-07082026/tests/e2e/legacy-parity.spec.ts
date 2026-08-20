import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const legacyUrl = process.env.E2E_LEGACY_URL ?? "http://localhost:3301";
const migratedUrl = process.env.E2E_BASE_URL ?? "http://localhost:3201";

async function openNavigationLink(page: Page, label: string, group: string) {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  const directLink = navigation.getByRole("link", { name: label, exact: true });
  if ((await directLink.count()) === 0) {
    const trigger = navigation.getByRole("button", {
      name: new RegExp(`^${group}\\b`),
    });
    if ((await trigger.getAttribute("aria-expanded")) !== "true") {
      await trigger.click();
    }
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
  // The dashboard has been fully redesigned (DashboardV2Screen) since this
  // list was written -- "Use English confidently and automatically", "From
  // recall to confident speaking", and "Open Conversation Studio" no longer
  // appear anywhere on this page (confirmed via a full-tree grep; "Choose
  // your level" survives, but moved to Integrated Skills, a different page
  // this test never visits). Updated to the current dashboard's own
  // onboarding copy, keeping this test's actual purpose intact: the
  // migrated page still carries real welcoming/orienting copy, not blank
  // space, under the shared accessible theme.
  for (const text of [
    "Your automaticity workspace",
    "Build accurate, confident English through one focused path.",
    "Adaptive daily program",
    "One guided route, five required modules",
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
    background: "#fbfafc",
    border: "#e7e3ef",
    card: "#fff",
    foreground: "#111638",
    muted: "#666b86",
    primary: "#5b2fd0",
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
  await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Today’s Practice" }),
  ).toBeVisible();
  await expect(navigation.getByRole("button")).toHaveCount(4);

  // Every content list from here on was checked against source code that
  // has since been substantially rewritten -- Conversation Studio's old
  // field layout, an earlier "daily-step"-based Today's Practice mockup, a
  // Grammar Lab that used to have its own search/filter/hint UI (removed --
  // see app.spec.ts's "preserves catalog counts" comment), and a much
  // longer Settings page. Replaced with the pages' actual current content,
  // verified by reading each component's source rather than guessed;
  // Conversation Studio also verified against a real failing-run page
  // snapshot. Also see the STANDALONE_CHROME_ROUTES note above: once on
  // Conversation Studio, `navigation` no longer resolves, so this returns to
  // "/" before continuing the nav-based walk (mirrors app.spec.ts's fix for
  // the same issue).
  await openNavigationLink(page, "Conversation Studio", "Practice");
  await expect(
    page.getByRole("heading", { level: 1, name: "Speaking Studio" }),
  ).toBeVisible();
  for (const label of [
    "Choose your conversation",
    "Guided conversation",
    "Record answer",
    "Real speaking evidence",
    "Session evidence",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-conversation.png",
  });
  await page.goto("/");

  // "Today's Practice" used to land on a static daily.html mockup with a
  // fixed, fake 7-".activity" list disconnected from the real app -- fixed
  // by routing /daily to the same real, 3-step Mission component
  // /progress uses. Checking against that mockup's invented step names
  // was never real legacy parity; these are this Mission's actual step
  // headings (automaticity-screen.tsx).
  await openNavigationLink(page, "Today’s Practice", "");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Your complete daily automaticity program",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("One guided route, five required modules", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".daily-auto-program__grid > li")).toHaveCount(5);
  await page.goto("/");

  await openNavigationLink(page, "Grammar Lab", "Learn");
  await expect(
    page.getByText(`${112} units, A1 to C2`, { exact: true }),
  ).toBeVisible();
  for (const label of ["Choose a unit", "CEFR Level", "Unit", "Practice Mode"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({
    fullPage: true,
    path: "test-results/parity-migrated-grammar.png",
  });

  await openNavigationLink(page, "Learning Resources", "Learn");
  // Resources now render inside a per-CEFR-level accordion with only the
  // default level (A1) expanded, so raw .resource-card elements aren't all
  // simultaneously in the DOM to count -- the "N direct resources" badge is
  // a robust total regardless of expand state (mirrors app.spec.ts's
  // already-correct check of the same badge).
  await expect(
    page.getByText("43 direct resources", { exact: true }),
  ).toBeVisible();

  await openNavigationLink(page, "Error Workshop", "Progress");
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();

  await openNavigationLink(page, "Audio Library", "Progress");
  await expect(
    page.getByRole("heading", { level: 1, name: "Audio Library" }),
  ).toBeVisible();

  await openNavigationLink(page, "Settings", "Settings");
  for (const label of [
    "Reading & focus",
    "Grammar accuracy",
    "Online grammar check",
    "Backup your progress",
    "Export data",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});
