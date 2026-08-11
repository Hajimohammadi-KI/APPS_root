import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const baseUrl = (process.argv[2] ?? "https://cross-repository-code-intelligence.vercel.app").replace(/\/$/, "");
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const verifyPersistence = process.env.VERIFY_PERSISTENCE !== "0";
const outputDirectory = fileURLToPath(new URL("../outputs/vercel-verification/", import.meta.url));

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const checks = [];

try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1440, height: 1000 } },
    { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  ]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push({ text: message.text(), url: message.location().url });
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
    });

    for (const route of ["/", "/settings", "/pdf-reader"]) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForLoadState("load", { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      const state = await page.evaluate(() => ({
        title: document.title,
        textLength: document.body.innerText.trim().length,
        hasErrorOverlay: Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")),
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      const routeName = route === "/" ? "home" : route.slice(1);
      await page.screenshot({ path: join(outputDirectory, `${profile.name}-${routeName}.png`), fullPage: false });
      checks.push({
        profile: profile.name,
        route,
        status: response?.status() ?? 0,
        ...state,
        horizontalOverflow: state.scrollWidth > state.viewportWidth + 1,
      });
    }

    await page.getByRole("button", { name: "Einstellungen", exact: true }).click();
    const codeEditor = page.getByRole("textbox", { name: "Editierbarer Embed-Code" });
    await codeEditor.waitFor({ state: "visible" });
    const editorReadability = await codeEditor.evaluate((element) => {
      const style = getComputedStyle(element);
      const parseRgb = (value) => value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
      const luminance = (rgb) => {
        const channels = rgb.map((value) => {
          const normalized = value / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const foreground = parseRgb(style.color);
      const background = parseRgb(style.backgroundColor);
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: Number.parseFloat(style.fontSize),
        contrastRatio: Number(((light + 0.05) / (dark + 0.05)).toFixed(2)),
      };
    });
    await page.screenshot({ path: join(outputDirectory, `${profile.name}-pdf-reader-settings.png`), fullPage: false });
    checks.push({
      kind: "reader-readability",
      profile: profile.name,
      ...editorReadability,
      passed: editorReadability.fontSize >= 14 && editorReadability.contrastRatio >= 7,
    });

    checks.push({ profile: profile.name, consoleErrors, pageErrors, failedResponses });
    await context.close();
  }

  if (verifyPersistence) {
    const persistenceContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const persistencePage = await persistenceContext.newPage();
    await persistencePage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await persistencePage.waitForTimeout(1_000);
    const firstTask = persistencePage.locator(".today-task-list input[type=checkbox]").first();
    const taskBefore = await firstTask.isChecked();
    await firstTask.setChecked(!taskBefore);
    await persistencePage.waitForTimeout(300);
    await persistencePage.reload({ waitUntil: "domcontentloaded" });
    await persistencePage.waitForTimeout(700);
    const progressPersisted = await persistencePage.locator(".today-task-list input[type=checkbox]").first().isChecked() === !taskBefore;

    const focusButton = persistencePage.locator(".focus-start-button-top");
    await focusButton.click();
    await persistencePage.waitForFunction(() => document.querySelector(".focus-start-button-top")?.textContent?.includes("Fokus öffnen"));
    await persistencePage.reload({ waitUntil: "domcontentloaded" });
    await persistencePage.waitForTimeout(700);
    const focusPersisted = (await persistencePage.locator(".focus-start-button-top").textContent())?.includes("Fokus öffnen") ?? false;

    await persistencePage.goto(`${baseUrl}/settings`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await persistencePage.waitForTimeout(700);
    await persistencePage.getByRole("button", { name: /ADHS- und Dyslexie-Einstellungen/ }).click();
    const firstSetting = persistencePage.locator('input[type="checkbox"]:visible').first();
    const settingBefore = await firstSetting.isChecked();
    await firstSetting.setChecked(!settingBefore);
    await persistencePage.waitForTimeout(900);
    await persistencePage.reload({ waitUntil: "domcontentloaded" });
    await persistencePage.waitForTimeout(700);
    await persistencePage.getByRole("button", { name: /ADHS- und Dyslexie-Einstellungen/ }).click();
    const settingPersisted = await persistencePage.locator('input[type="checkbox"]:visible').first().isChecked() === !settingBefore;
    checks.push({ kind: "persistence", progressPersisted, focusPersisted, settingPersisted });
    await persistenceContext.close();
  }
} finally {
  await browser.close();
}

const failures = checks.filter((check) =>
  ("status" in check && (check.status !== 200 || check.textLength === 0 || check.hasErrorOverlay || check.horizontalOverflow))
  || ("pageErrors" in check && (check.pageErrors.length > 0 || check.consoleErrors.length > 0))
  || (check.kind === "reader-readability" && !check.passed)
  || (check.kind === "persistence" && (!check.progressPersisted || !check.focusPersisted || !check.settingPersisted)),
);

console.log(JSON.stringify({ baseUrl, checks, passed: failures.length === 0 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
