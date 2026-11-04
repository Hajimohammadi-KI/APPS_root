import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(
  resolve(
    import.meta.dirname,
    "../Apps/English/English-Automaticity/package.json",
  ),
);
const { chromium, expect } = require("@playwright/test");
const base = process.argv[2] ?? "http://127.0.0.1:3202";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const reports = [];
try {
  for (const width of [390, 1040, 1280]) {
    for (const action of ["Later", "Update now"]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() => {
        // Isolated browser fixture: reproduce an existing profile's waiting update.
        // No real service worker, cache, or learner profile is replaced.
        const container = new EventTarget();
        const applied =
          sessionStorage.getItem("studio-update-test-applied") === "1";
        const registration = new EventTarget();
        registration.waiting = applied
          ? null
          : {
              postMessage(message) {
                sessionStorage.setItem(
                  "studio-update-test-message",
                  JSON.stringify(message),
                );
                sessionStorage.setItem("studio-update-test-applied", "1");
                setTimeout(
                  () => container.dispatchEvent(new Event("controllerchange")),
                  10,
                );
              },
            };
        registration.installing = null;
        container.controller = {};
        container.register = async () => registration;
        Object.defineProperty(navigator, "serviceWorker", {
          configurable: true,
          value: container,
        });
        if (!applied)
          localStorage.setItem(
            "studio-update-test-choice",
            "Keep my explicit saved choice",
          );
      });
      await page.goto(base + "/studio", { waitUntil: "networkidle" });
      const notice = page.getByRole("dialog", {
        name: "Update English Automaticity?",
        exact: true,
      });
      await expect(notice).toBeVisible();
      await page.screenshot({
        path: resolve(
          "artifacts",
          `studio-update-${width}-${action.replaceAll(" ", "-")}.png`,
        ),
      });
      assert.equal(
        await notice.evaluate((node) =>
          Boolean(node.closest("main.studio-main")),
        ),
        true,
        "Update notice must stay inside the content column",
      );
      const header = page.locator("main.studio-main > header");
      await expect(header).toBeInViewport();
      const mainBounds = await page.locator("main.studio-main").boundingBox();
      assert.ok(
        mainBounds && mainBounds.y < 250,
        "Studio must not be pushed below a full sidebar row",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      const storedBefore = await page.evaluate(() =>
        localStorage.getItem("grammar-automaticity:v27"),
      );
      const transcript = page.getByRole("textbox", {
        name: "Your transcript",
        exact: true,
      });
      if (action === "Later")
        await transcript.fill(
          "My manual draft stays after dismissing the update.",
        );
      if (action === "Update now") {
        await Promise.all([
          page.waitForEvent("load"),
          notice.getByRole("button", { name: action, exact: true }).click(),
        ]);
        await expect
          .poll(() =>
            page.evaluate(() =>
              sessionStorage.getItem("studio-update-test-applied"),
            ),
          )
          .toBe("1");
        await expect
          .poll(() =>
            page.evaluate(() =>
              sessionStorage.getItem("studio-update-test-message"),
            ),
          )
          .toBe(JSON.stringify({ type: "SKIP_WAITING" }));
      } else
        await notice.getByRole("button", { name: action, exact: true }).click();
      await expect(notice).toHaveCount(0);
      if (action === "Later")
        await expect(transcript).toHaveValue(
          "My manual draft stays after dismissing the update.",
        );
      await expect(
        page.getByRole("button", { name: "Record", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Record", exact: true })
        .click({ trial: true });
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem("studio-update-test-choice"),
        ),
        "Keep my explicit saved choice",
      );
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem("grammar-automaticity:v27"),
        ),
        storedBefore,
      );
      await page.evaluate(() => scrollTo(0, 0));
      await expect(header).toBeInViewport();
      assert.deepEqual(errors, []);
      reports.push({
        width,
        action,
        studioAccessible: true,
        savedStatePreserved: true,
        passed: true,
      });
      await context.close();
    }
  }
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
}
