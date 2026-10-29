// Deterministic browser regression: fake microphone/ASR, real UI and storage.
// node scripts/language-feedback-browser-check.mjs <base-url> <en|de>
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const language = process.argv[3];
assert.ok(language === "en" || language === "de");
const app =
  language === "en"
    ? "English/English-Automaticity"
    : "Deutsch/Deutsch-Automaticity";
const require = createRequire(
  new URL(`../Apps/${app}/package.json`, import.meta.url),
);
const { chromium } = require("@playwright/test");
const base = process.argv[2].replace(/\/$/u, "");
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      permissions: ["microphone"],
      serviceWorkers: "block",
    });
    await context.addInitScript(() => {
      window.SpeechRecognition = class {
        start() {
          window.__testRecognition = this;
        }
        stop() {}
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/conversation/evaluate", async (route) => {
      const request = route.request().postDataJSON();
      assert.equal(request.consent, true);
      await route.fulfill({
        json: {
          original: request.text,
          corrected: request.text,
          provider: "LanguageTool",
          checkedAt: "2026-10-29T12:00:00.000Z",
          issues: [],
        },
      });
    });
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    const panel = page.getByRole("region", {
      name: language === "en" ? "Read aloud practice" : "Laut lesen",
    });
    await panel.waitFor();
    assert.ok(await panel.locator("input").evaluate(input => input.getBoundingClientRect().width >= 200 && parseFloat(getComputedStyle(input).borderTopWidth) >= 1 && input.parentElement.parentElement.getBoundingClientRect().width >= input.getBoundingClientRect().width), "Target input remains visible and usable on mobile and desktop");
    await page
      .locator(".record-controls button", { hasText: "Record" })
      .click();
    await page.waitForFunction(() => !!window.__testRecognition);
    const recognized =
      language === "en" ? "I gone home" : "Ich nach Hause gegangen";
    await page.evaluate((text) => {
      const event = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            length: 2,
            0: { transcript: text, confidence: 0.6 },
            1: { transcript: `${text} alternative`, confidence: 0.4 },
          },
        ],
      };
      window.__testRecognition.onresult(event);
      window.__testRecognition.onresult(event);
    }, recognized);
    await page.waitForFunction(
      (text) => document.querySelector(".transcript textarea")?.value === text,
      recognized,
    );
    assert.match(await panel.innerText(), /uncertain|unsicher/u);
    await panel
      .locator("input")
      .fill(
        language === "en" ? "I have gone home" : "Ich bin nach Hause gegangen",
      );
    await page.waitForFunction(() =>
      /Reference adds|Vorlage ergänzt/u.test(document.body.innerText),
    );
    await panel.locator("input").fill(language === "en" ? "thin" : "schön");
    await page.waitForFunction(() => /θɪn|ʃøːn/u.test(document.body.innerText));
    const reviewed =
      language === "en"
        ? "I have gone home. I think rest helps because I feel tired."
        : "Ich bin nach Hause gegangen. Ich denke, Ruhe hilft, weil ich müde bin.";
    await page.locator(".transcript textarea").fill(reviewed);
    await page.evaluate(() =>
      window.__testRecognition.onresult({
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: {
              transcript: "replacement from late recognition",
              confidence: 1,
            },
          },
        ],
      }),
    );
    assert.equal(
      await page.locator(".transcript textarea").inputValue(),
      reviewed,
    );
    await page.waitForTimeout(700);
    await page.locator(".record-controls button", { hasText: "Stop" }).click();
    await page.locator(".audio-player").waitFor();
    await page.locator(".record-controls button.primary").click();
    await page.locator(".online-consent").waitFor();
    await page.locator(".online-consent").click();
    await page.locator(".review-panel").waitFor();
    await page.locator("footer button.save-lite").click();
    await page.locator(".save-panel button.primary").click();
    await page.waitForFunction(
      () =>
        JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") || "{}",
        ).evidence?.length > 0,
    );
    const ledger = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("automaticity:learning-evidence:v1")),
    );
    const evidence = ledger.evidence.at(-1);
    assert.equal(evidence.verification.status, "unverified");
    assert.equal(evidence.masteryEligible, false);
    assert.equal(evidence.metrics.fluencyScore, null);
    assert.equal(evidence.metrics.targetHit, false);
    assert.ok(
      ledger.responses.some(
        (response) =>
          response.inputText === reviewed || response.text === reviewed,
      ),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "No horizontal overflow",
    );
    assert.deepEqual(errors, []);
    await page.goto(
      `${base}/replacements/${language}/${language === "en" ? "grammar" : "grammatik"}.html`,
      { waitUntil: "networkidle" },
    );
    const normalized = await page.evaluate(() =>
      window.AutomaticityText.normalizeText("  Grüße\t Welt?.  ", {
        allowOptionalFinalPeriod: true,
      }),
    );
    assert.equal(normalized, "Grüße Welt?.");
    await context.close();
    console.log(
      `PASS ${language} ${width}px: ASR alternatives, no duplicate finals, explicit edits preserved, target alignment, sound practice, unverified storage, shared browser normalization`,
    );
  }
} finally {
  await browser.close();
}
