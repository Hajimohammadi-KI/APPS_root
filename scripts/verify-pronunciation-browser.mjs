import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const require = createRequire(
  resolve(
    import.meta.dirname,
    "../Apps/English/English-Automaticity/package.json",
  ),
);
const { chromium, expect } = require("@playwright/test");
const base = process.argv[2] ?? "http://127.0.0.1:3202";
// Public OpenSLR audio, never a private learner recording.
const wav =
  process.argv[3] ??
  "C:/Users/Elahe/AppData/Local/Temp/language-w26-experiment/speechocean762/WAVE/SPEAKER0001/000010011.WAV";
assert.ok(
  existsSync(wav),
  "Supply a public-corpus WAV path as the second argument.",
);
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--use-file-for-fake-audio-capture=" + wav,
  ],
});
const reports = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      permissions: ["microphone"],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    context.on("request", (request) =>
      requests.push({
        method: request.method(),
        url: request.url(),
        body: request.postDataBuffer()?.length ?? 0,
      }),
    );
    await page.addInitScript(() => {
      window.recognitionStarts = 0;
      class ForbiddenRecognition {
        constructor() {
          window.recognitionStarts++;
          throw new Error("Cloud speech recognition must not start");
        }
      }
      window.SpeechRecognition = ForbiddenRecognition;
      window.webkitSpeechRecognition = ForbiddenRecognition;
      window.workerMessages = [];
      window.lastLocalResult = null;
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args);
          this.addEventListener("message", (event) => {
            if (event.data?.type === "result")
              window.lastLocalResult = event.data.result;
          });
        }
        postMessage(message, ...args) {
          window.workerMessages.push(Object.keys(message).sort());
          return super.postMessage(message, ...args);
        }
      };
    });
    await page.goto(base + "/studio", { waitUntil: "networkidle" });
    await expect
      .poll(
        () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
        {
          timeout: 30000,
          message: "A direct Studio visit must enable offline assets",
        },
      )
      .toBe(true);
    const panel = page.getByRole("region", {
      name: "Pronunciation from recording",
      exact: true,
    });
    const transcript = page.getByRole("textbox", {
      name: "Your transcript",
      exact: true,
    });
    const load = panel.getByRole("button", {
      name: "Load local speech model",
      exact: true,
    });
    const analyse = panel.getByRole("button", {
      name: "Analyze sounds on this device",
      exact: true,
    });
    const notes = panel.getByLabel("Words you intended to say", {
      exact: true,
    });
    await expect(panel).toBeVisible();
    await expect(notes).toHaveValue("");
    await expect(load).toBeDisabled();
    assert.equal(
      requests.filter((r) => r.url.includes("/local-phoneme/assets/")).length,
      0,
    );
    const ownText = "My manually entered words must remain unchanged.";
    await transcript.fill(ownText);
    await page.getByRole("button", { name: "Record", exact: true }).click();
    await page.waitForTimeout(1600);
    await page.locator(".record-controls button", { hasText: /Pause/ }).click();
    await page
      .locator(".record-controls button", { hasText: /Resume/ })
      .click();
    await page.waitForTimeout(1600);
    await page.locator(".record-controls button", { hasText: /Stop/ }).click();
    const download = panel.getByRole("link", {
      name: "Download original recording",
      exact: true,
    });
    await expect(download).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await download.click();
    assert.ok((await downloaded).suggestedFilename());
    await expect(transcript).toHaveValue(ownText);
    assert.equal(await page.evaluate(() => window.recognitionStarts), 0);
    await notes.fill("These notes must never enter the acoustic model.");
    await load.click();
    await expect(analyse).toBeEnabled({ timeout: 60000 });
    await analyse.click();
    const result = panel.getByRole("region", {
      name: "Acoustic observations",
      exact: true,
    });
    await expect(result).toBeVisible({ timeout: 60000 });
    const first = await page.evaluate(() => window.lastLocalResult);
    assert.equal(first.source, "local_phoneme_model");
    assert.equal(first.verified, false);
    assert.equal(first.pronunciationScore, null);
    assert.ok(first.phonemes.length > 0);
    await expect(transcript).toHaveValue(ownText);
    const oldPlayer = await panel
      .getByLabel("Original recording for pronunciation")
      .elementHandle();
    const longest = first.spans.reduce(
      (best, span, i, spans) =>
        span.endMs - span.startMs > spans[best].endMs - spans[best].startMs
          ? i
          : best,
      0,
    );
    await result
      .getByRole("button", { name: "Replay this sound", exact: true })
      .nth(longest)
      .click();
    await expect
      .poll(() => oldPlayer.evaluate((audio) => audio.paused))
      .toBe(false);
    await page.getByRole("button", { name: "Record", exact: true }).click();
    assert.equal(await oldPlayer.evaluate((audio) => audio.paused), true);
    await expect(result).toHaveCount(0);
    await expect(analyse).toBeDisabled();
    await page.waitForTimeout(3000);
    await page.locator(".record-controls button", { hasText: /Stop/ }).click();
    await expect(download).toBeVisible();
    await context.setOffline(true);
    await load.click();
    await expect(analyse).toBeEnabled({ timeout: 60000 });
    await analyse.click();
    await expect(result).toBeVisible({ timeout: 60000 });
    await expect(transcript).toHaveValue(ownText);
    assert.equal(await page.evaluate(() => window.recognitionStarts), 0);
    for (const keys of await page.evaluate(() => window.workerMessages))
      assert.ok(
        JSON.stringify(keys) === JSON.stringify(["requestId", "type"]) ||
          JSON.stringify(keys) ===
            JSON.stringify(["requestId", "sampleRate", "samples", "type"]),
      );
    assert.equal(
      requests.filter((r) => r.method !== "GET" || r.body > 0).length,
      0,
      "No uploads during local speech analysis",
    );
    // Edge opens its internal download manager after the original audio download.
    // These edge: resources are browser UI, not network requests from the app.
    const external = requests.filter((r) => {
      const url = new URL(r.url);
      return url.protocol !== "edge:" && url.origin !== new URL(base).origin;
    });
    assert.deepEqual(external, [], "No external requests from the app");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    await panel.screenshot({
      path: resolve("artifacts", `pronunciation-local-${width}.png`),
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(panel).toBeVisible();
    await page.getByRole("button", { name: "Record", exact: true }).click();
    await page.waitForTimeout(3000);
    await page.locator(".record-controls button", { hasText: /Stop/ }).click();
    await expect(download).toBeVisible();
    await load.click();
    await expect(analyse).toBeEnabled({ timeout: 60000 });
    await analyse.click();
    await expect(result).toBeVisible({ timeout: 60000 });
    assert.equal(await page.evaluate(() => window.recognitionStarts), 0);
    for (const keys of await page.evaluate(() => window.workerMessages))
      assert.ok(
        JSON.stringify(keys) === JSON.stringify(["requestId", "type"]) ||
          JSON.stringify(keys) ===
            JSON.stringify(["requestId", "sampleRate", "samples", "type"]),
      );
    assert.equal(
      requests.filter((r) => r.method !== "GET" || r.body > 0).length,
      0,
    );
    assert.deepEqual(
      requests.filter((r) => {
        const url = new URL(r.url);
        return url.protocol !== "edge:" && url.origin !== new URL(base).origin;
      }),
      [],
    );
    assert.deepEqual(errors, []);
    reports.push({
      width,
      realPublicCorpusInput: true,
      estimatedPhones: first.phonemes.length,
      offlineNewWorker: true,
      offlinePageReload: true,
      speechRecognitionCalls: 0,
      uploads: 0,
      passed: true,
    });
    await context.close();
  }
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
}
