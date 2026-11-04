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
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const reports = [];
const referenceText = "Hello. Hello. Hello. Hello.";
const observation = {
  kind: "audio_observation",
  provider: "Microsoft Azure Speech",
  variant: "en-US",
  referenceText,
  recognizedText: referenceText,
  spokenPhonemesAvailable: true,
  words: Array.from({ length: 4 }, (_, index) => ({
    word: "hello",
    offsetSeconds: index * 0.3,
    durationSeconds: 0.25,
    phonemes: [
      {
        expected: "ɛ",
        heard: "ɑ",
        offsetSeconds: index * 0.3 + 0.05,
        durationSeconds: 0.1,
      },
    ],
  })),
  pronunciationScore: null,
  verified: false,
};
try {
  for (const width of [390, 1280]) {
    for (const available of [false, true]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        permissions: ["microphone"],
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      let posts = 0;
      let deferResponse = false;
      let releaseResponse;
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.testRecognizers = [];
        class Recognition {
          constructor() {
            window.testRecognizers.push(this);
          }
          start() {
            setTimeout(
              () =>
                this.onresult?.({
                  results: Array.from({ length: 4 }, () => ({
                    0: { transcript: "Hello.", confidence: 0.99 },
                    length: 1,
                    isFinal: true,
                  })),
                }),
              100,
            );
          }
          stop() {}
          abort() {}
        }
        window.SpeechRecognition = Recognition;
        window.webkitSpeechRecognition = Recognition;
      });
      await page.route("**/api/conversation/pronunciation", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            json: {
              available,
              provider: "Microsoft Azure Speech",
              maxSeconds: 30,
              supportedVariants: ["en-US", "en-GB"],
            },
          });
          return;
        }
        posts++;
        const request = route.request();
        const form = await new Response(request.postDataBuffer(), {
          headers: { "content-type": request.headers()["content-type"] },
        }).formData();
        assert.equal(form.get("consent"), "true");
        assert.equal(form.get("referenceText"), referenceText);
        assert.equal(form.get("variant"), "en-US");
        const wav = Buffer.from(await form.get("audio").arrayBuffer());
        assert.equal(wav.toString("ascii", 0, 4), "RIFF");
        assert.equal(wav.readUInt32LE(24), 16000);
        assert.equal(wav.readUInt16LE(22), 1);
        assert.equal(wav.readUInt16LE(34), 16);
        assert.ok(wav.length > 44);
        if (deferResponse)
          await new Promise((done) => {
            releaseResponse = done;
          });
        await route.fulfill({ json: observation }).catch(() => {});
      });
      await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
      const panel = page.getByRole("region", {
        name: "Pronunciation from recording",
        exact: true,
      });
      await expect(panel).toBeVisible();
      const target = panel.getByLabel("Words you intended to say", {
        exact: true,
      });
      const consent = panel.getByRole("checkbox", {
        name: "Send this recording to Microsoft Azure Speech",
        exact: true,
      });
      const check = panel.getByRole("button", {
        name: "Check pronunciation from recording",
        exact: true,
      });
      await expect(target).toHaveValue("");
      await page.getByRole("button", { name: "Record", exact: true }).click();
      await expect(
        page.getByRole("textbox", { name: "Your transcript", exact: true }),
      ).toHaveValue(referenceText);
      await page.waitForTimeout(1800);
      await page
        .locator(".record-controls button", { hasText: /Stop/ })
        .click();
      const download = panel.getByRole("link", {
        name: "Download original recording",
        exact: true,
      });
      await expect(download).toBeVisible();
      const downloaded = page.waitForEvent("download");
      await download.click();
      assert.ok((await downloaded).suggestedFilename());
      assert.equal(posts, 0);
      await expect(target).toHaveValue("");
      await target.fill(referenceText);
      await expect(check).toBeDisabled();
      if (available) {
        await consent.check();
        await expect(check).toBeEnabled();
        await check.click();
        await expect(
          panel.getByText("/ɑ/", { exact: true }).first(),
        ).toBeVisible();
        await expect(
          panel.getByText("/ɛ/", { exact: true }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole("textbox", { name: "Your transcript", exact: true }),
        ).toHaveValue(referenceText);
        assert.equal(posts, 1);
        const oldPlayer = await panel
          .getByLabel("Original recording for pronunciation")
          .elementHandle();
        await panel
          .getByRole("button", { name: "Replay this word", exact: true })
          .first()
          .click();
        await expect
          .poll(() => oldPlayer.evaluate((audio) => audio.paused))
          .toBe(false);
        await target.fill("Hello again.");
        assert.equal(await oldPlayer.evaluate((audio) => audio.paused), true);
        await expect(consent).not.toBeChecked();
        await expect(panel.getByText("/ɑ/", { exact: true })).toHaveCount(0);
        await target.fill(referenceText);
        await consent.check();
        deferResponse = true;
        await check.click();
        await expect.poll(() => posts).toBe(2);
        await expect.poll(() => typeof releaseResponse).toBe("function");
        await target.fill("A different target.");
        releaseResponse?.();
        await page.waitForTimeout(200);
        await expect(panel.getByText("/ɑ/", { exact: true })).toHaveCount(0);
        await expect(consent).not.toBeChecked();
        await page.getByRole("button", { name: "Record", exact: true }).click();
        await expect(download).toHaveCount(0);
        await expect(check).toBeDisabled();
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          window.testRecognizers[0].onresult?.({
            results: [
              {
                0: {
                  transcript: "OLD RECORDING MUST NOT REPLACE NEW TEXT",
                  confidence: 1,
                },
                length: 1,
                isFinal: true,
              },
            ],
          });
        });
        await expect(
          page.getByRole("textbox", { name: "Your transcript", exact: true }),
        ).toHaveValue(referenceText);
        await page
          .locator(".record-controls button", { hasText: /Stop/ })
          .click();
      } else {
        await expect(panel).toContainText(
          /unavailable|not configured|not connected|not switched on/i,
        );
        assert.equal(posts, 0);
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      reports.push({
        width,
        provider: available
          ? "fixture only; not real audio validation"
          : "unavailable fixture",
        posts,
        passed: true,
      });
      await context.close();
    }
  }
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
}
