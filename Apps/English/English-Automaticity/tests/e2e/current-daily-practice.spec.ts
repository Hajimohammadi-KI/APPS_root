import { expect, test } from "@playwright/test";

test("current home and active daily route show one truthful learner state", async ({ page }) => {
  await page.goto("/");
  // The React shell and standalone Daily document must share the same LTR contract.
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Learner/ })).toBeVisible();
  await expect(page.getByText("Your chart will begin after your first saved practice.")).toBeVisible();
  await expect(page.getByText("Local app service ready")).toBeVisible();

  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "Today's 15-minute learning mission" })).toBeVisible();
  await expect(page.getByText("Verb be: am/is/are · A1")).toBeVisible();
  await expect(page.getByText("0 of 7 activities complete")).toBeVisible();
  await expect(page.getByText("0% verified mastery")).toBeVisible();
  await expect(page.getByText("Practice on this device")).toBeVisible();
});

test("phase-three cards keep their status and CTA inside a narrow desktop layout", async ({
  page,
}) => {
  // The fixed sidebar reduces usable content width long before a browser is
  // mobile-sized. This catches status badges and practice buttons escaping
  // cards 5–7 when the desktop window is narrowed.
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/daily");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  const escapedControls = await page.locator(".cards.three .activity").evaluateAll(
    (cards) =>
      cards.flatMap((card) => {
        const cardBox = card.getBoundingClientRect();
        return [...card.querySelectorAll(".tag, .open")].flatMap((control) => {
          const controlBox = control.getBoundingClientRect();
          return controlBox.left < cardBox.left - 0.5 ||
            controlBox.right > cardBox.right + 0.5 ||
            controlBox.bottom > cardBox.bottom + 0.5
            ? [control.textContent?.trim() ?? "unnamed control"]
            : [];
        });
      }),
  );

  expect(escapedControls).toEqual([]);
});

test("daily navigation headings collapse and reopen only their own group", async ({ page }) => {
  await page.goto("/daily");
  const heading = page.getByRole("button", { name: /Grammar and English study/ });
  const linkedItem = page.getByRole("button", { name: "Grammar Lab" });

  await expect(heading).toHaveAttribute("aria-expanded", "true");
  await heading.click();
  await expect(heading).toHaveAttribute("aria-expanded", "false");
  await expect(linkedItem).toBeHidden();
  await heading.click();
  await expect(linkedItem).toBeVisible();
});

test("Integrated Skills uses the canonical app-shell route", async ({ page }) => {
  await page.goto("/daily");
  await page.getByRole("button", { name: "Integrated Skills" }).click();
  await expect(page).toHaveURL(/\/?screen=integrated-skills$/);
});

test("daily hero starts the first practice with return context", async ({ page }) => {
  await page.goto("/daily");
  await page.getByRole("button", { name: "Start today's practice" }).click();

  await expect(page).toHaveURL(/\/grammar\?/);
  const destination = new URL(page.url());
  expect(destination.searchParams.get("from")).toBe("daily");
  expect(destination.searchParams.get("activity")).toBe("1");
  expect(destination.searchParams.get("return")).toBe("/daily");
});

test("interactive boxes show hover and focus while language blocks keep direction", async ({
  page,
}) => {
  await page.goto("/daily");
  const menuItem = page.getByRole("button", { name: "Grammar Lab" });

  // Pointer feedback and keyboard focus are paired so hover is never the only cue.
  await menuItem.hover();
  expect(await menuItem.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  await menuItem.focus();
  expect(await menuItem.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

  const directions = await page.evaluate(() =>
    Object.fromEntries(
      ["en", "de", "fa", "ar"].map((language) => {
        const sample = document.createElement("span");
        sample.lang = language;
        sample.textContent = language;
        document.body.append(sample);
        return [language, getComputedStyle(sample).direction];
      }),
    ),
  );
  expect(directions).toEqual({ en: "ltr", de: "ltr", fa: "rtl", ar: "rtl" });
});

test("local service failure can be retried without reloading the learner page", async ({ page }) => {
  let serviceReady = false;
  await page.route("**/api/health", async (route) => {
    await route.fulfill({
      body: JSON.stringify(serviceReady ? { status: "ok" } : { error: "offline" }),
      contentType: "application/json",
      status: serviceReady ? 200 : 503,
    });
  });
  await page.goto("/");

  const retry = page.getByRole("button", { name: "Retry local app service" });
  await expect(retry).toBeVisible();
  serviceReady = true;
  await retry.click();
  await expect(page.getByRole("button", { name: "Local app service ready" })).toBeVisible();
});

test("microphone failure offers a typing recovery action", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Record", exact: true }).click();

  await expect(page.getByRole("button", { name: "Continue by typing" })).toBeVisible();
  await page.getByRole("button", { name: "Continue by typing" }).click();
  await expect(page.getByRole("textbox", { name: "Your transcript" })).toBeFocused();
});
