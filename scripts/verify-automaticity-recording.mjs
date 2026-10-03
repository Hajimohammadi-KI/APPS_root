import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  `artifacts/automaticity-recording/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const report = {
  createdAt: new Date().toISOString(),
  scope:
    "Real browser MediaRecorder with a synthetic microphone; simulated permission denial; isolated profiles, no physical microphone or learner speech",
  cases: [],
};
try {
  for (const language of ["en", "de"]) {
    const context = await browser.newContext({
      permissions: ["microphone"],
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    const row = { language, status: "running" };
    report.cases.push(row);
    try {
      await page.goto(
        `http://127.0.0.1:${language === "en" ? 3202 : 3210}/practice`,
        { waitUntil: "domcontentloaded" },
      );
      await page.locator("#practice-response").waitFor();
      await page
        .getByRole("button", {
          name: language === "en" ? "Speak" : "Sprechen",
          exact: true,
        })
        .click();
      await page
        .locator("#practice-response")
        .fill("Synthetic retained transcript draft");
      await page.evaluate(() => {
        const native = navigator.mediaDevices.getUserMedia.bind(
          navigator.mediaDevices,
        );
        navigator.mediaDevices.getUserMedia = async (...args) => {
          navigator.mediaDevices.getUserMedia = native;
          throw new DOMException(
            "Synthetic permission denial",
            "NotAllowedError",
          );
        };
      });
      await page
        .getByRole("button", {
          name: language === "en" ? "Start recording" : "Aufnahme starten",
          exact: true,
        })
        .click();
      await expect(
        page.getByText(
          language === "en"
            ? /microphone is unavailable or permission was denied/
            : /Mikrofon ist nicht verfügbar/,
        ),
      ).toBeVisible();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic retained transcript draft",
      );
      await page.evaluate(() => {
        const native = navigator.mediaDevices.getUserMedia.bind(
          navigator.mediaDevices,
        );
        navigator.mediaDevices.getUserMedia = async (...args) => {
          navigator.mediaDevices.getUserMedia = native;
          await new Promise((resolve) => {
            window.releaseSyntheticPermission = resolve;
          });
          return native(...args);
        };
      });
      await page
        .getByRole("button", {
          name: language === "en" ? "Start recording" : "Aufnahme starten",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        () => typeof window.releaseSyntheticPermission === "function",
      );
      await page
        .getByRole("button", {
          name: language === "en" ? "Finish for now" : "Für heute pausieren",
          exact: true,
        })
        .click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic retained transcript draft",
      );
      await expect(page.getByRole("alert")).toContainText(
        language === "en"
          ? "wait for it to save before pausing"
          : "bevor du pausierst",
      );
      await page.evaluate(() => window.releaseSyntheticPermission());
      await page
        .getByRole("button", {
          name: language === "en" ? "Stop recording" : "Aufnahme beenden",
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("button", {
          name: language === "en" ? "Finish for now" : "Für heute pausieren",
          exact: true,
        })
        .click();
      await expect(page.locator("#practice-response")).toHaveValue(
        "Synthetic retained transcript draft",
      );
      await page.waitForTimeout(800);
      await page
        .getByRole("button", {
          name: language === "en" ? "Stop recording" : "Aufnahme beenden",
          exact: true,
        })
        .click();
      await expect(
        page.getByText(
          language === "en"
            ? /Recording saved\. Listen/
            : /Aufnahme gespeichert\. Höre/,
        ),
      ).toBeVisible();
      await page
        .getByRole("button", {
          name: language === "en" ? "Finish for now" : "Für heute pausieren",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: language === "en" ? "Resume practice" : "Weiterüben",
          exact: true,
        })
        .click();
      await expect(page.locator(".task-panel audio")).toHaveCount(1);
      await page.locator(".task-panel audio").evaluate(async (audio) => {
        await audio.play();
      });
      await page.waitForFunction(() => {
        const audio = document.querySelector(".task-panel audio");
        return audio && audio.readyState >= 2 && audio.currentTime > 0;
      });
      await page
        .locator(".task-panel audio")
        .evaluate((audio) => audio.pause());
      await page
        .getByRole("button", {
          name: language === "en" ? "Save and check" : "Speichern und prüfen",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (language) =>
          Object.keys(localStorage)
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .some((event) => event.type === "assessment"),
        language,
      );
      row.evidence = await page.evaluate((language) => {
        const events = Object.keys(localStorage)
          .filter((key) => key.startsWith(`automaticity:v2:${language}:event:`))
          .map((key) => JSON.parse(localStorage.getItem(key)));
        const attempt = events.find((event) => event.type === "attempt"),
          assessment = events.find((event) => event.type === "assessment");
        return {
          audio: attempt.audio,
          response: attempt.response,
          verdict: assessment.verdict,
          scopeApproved: assessment.evaluator.scopeApproved,
        };
      }, language);
      assert.equal(row.evidence.audio.persisted, true);
      assert(row.evidence.audio.bytes > 0);
      assert(row.evidence.audio.durationMs >= 500);
      assert.equal(row.evidence.verdict, "not_assessed");
      assert.equal(
        row.evidence.response.text,
        "Synthetic retained transcript draft",
      );
      assert.equal(row.evidence.response.originalTranscriptSha256, null);
      assert.equal(row.evidence.scopeApproved, false);
      await page.addScriptTag({
        url: `http://127.0.0.1:${language === "en" ? 3202 : 3210}/learning-core/automaticity-v2.js`,
      });
      const valid = await page.evaluate(
        async ({ language, id, sha256 }) => {
          const core = window.AutomaticityV2;
          const stored = await core.readRecording(indexedDB, language, id);
          return (
            stored &&
            (await core.sha256(await stored.blob.arrayBuffer())) === sha256
          );
        },
        {
          language,
          id: row.evidence.audio.id,
          sha256: row.evidence.audio.sha256,
        },
      );
      assert.equal(valid, true);
      row.microphoneDenialPreservedDraft = true;
      row.pendingPermissionAndActiveRecordingBlockPause = true;
      row.pausedRecordingRemainsPlayable = true;
      row.keyboardSubmit = true;
      row.storedHashVerified = true;
      row.status = "passed";
    } catch (error) {
      row.status = "failed";
      row.error = error.message;
      row.stack = error.stack;
    }
    await page.screenshot({
      path: resolve(output, `${language}.png`),
      fullPage: true,
    });
    await context.close();
    console.log(JSON.stringify(row));
  }
} finally {
  await browser.close();
  report.status = report.cases.every((row) => row.status === "passed")
    ? "passed"
    : "failed";
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Evidence: ${output}`);
}
assert.equal(report.status, "passed");
