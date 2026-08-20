import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const baseUrl = (process.argv[2] ?? "https://cross-repository-code-intelligence.vercel.app").replace(/\/$/, "");
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const verifyPersistence = process.env.VERIFY_PERSISTENCE !== "0";
const allowLocalApiFailures = process.env.ALLOW_LOCAL_API_FAILURES === "1";
const outputDirectory = fileURLToPath(new URL("../outputs/vercel-verification/", import.meta.url));

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const checks = [];

try {
  for (const profile of [
    { name: "desktop-1440", viewport: { width: 1440, height: 1000 } },
    { name: "compact-946", viewport: { width: 946, height: 900 } },
    { name: "laptop-1024", viewport: { width: 1024, height: 900 } },
    { name: "tablet-768", viewport: { width: 768, height: 1024 }, hasTouch: true },
    { name: "mobile-390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    {
      name: "android-pixel-412",
      viewport: { width: 412, height: 915 },
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    { name: "mobile-375", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
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

    for (const route of ["/", "/nlp-lab", "/settings", "/pdf-reader"]) {
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

    await page.getByRole("button", { name: "Bibliothek", exact: true }).click();
    const researchLibrary = page.getByRole("region", { name: "Bibliotheksübersicht" });
    await researchLibrary.waitFor({ state: "visible" });
    const libraryLayout = await page.evaluate(() => {
      const panel = document.querySelector(".study-panel")?.getBoundingClientRect();
      return {
        panelWidth: panel?.width ?? 0,
        panelRight: panel?.right ?? 0,
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasMetadataAction: [...document.querySelectorAll("button")].some((button) => button.textContent?.includes("Metadaten bearbeiten")),
        hasJsonBackup: [...document.querySelectorAll("button")].some((button) => button.textContent?.includes("Backup JSON")),
      };
    });
    await page.screenshot({ path: join(outputDirectory, `${profile.name}-pdf-research-library.png`), fullPage: false });
    checks.push({
      kind: "pdf-research-library",
      profile: profile.name,
      ...libraryLayout,
      passed: libraryLayout.panelWidth > 0
        && libraryLayout.panelRight <= libraryLayout.viewportWidth + 1
        && libraryLayout.scrollWidth <= libraryLayout.viewportWidth + 1
        && libraryLayout.hasMetadataAction
        && libraryLayout.hasJsonBackup,
    });

    await page.getByRole("button", { name: "Panel schließen", exact: true }).last().click();
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
  || ("pageErrors" in check && (check.pageErrors.length > 0 || (!allowLocalApiFailures && check.consoleErrors.length > 0)))
  || (check.kind === "reader-readability" && !check.passed)
  || (check.kind === "pdf-research-library" && !check.passed)
  || (check.kind === "persistence" && (!check.progressPersisted || !check.focusPersisted || !check.settingPersisted)),
);

console.log(JSON.stringify({
  baseUrl,
  checks,
  apiFailurePolicy: allowLocalApiFailures ? "reported-but-not-responsive-gating" : "gating",
  passed: failures.length === 0,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
