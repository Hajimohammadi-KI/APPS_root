import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import playwright from "../Apps/Study-Tracker/node_modules/playwright-core/index.js";

const { chromium } = playwright;

// This audit targets the canonical local URLs from release-targets.json.
// A 320 CSS-pixel layout is the reflow width produced when a 640px viewport is
// zoomed to 200%; DPR 2 keeps the saved screenshots sharp without changing CSS.
const targets = [
  { id: "english", name: "English Automaticity", url: "http://127.0.0.1:3202/daily", integratedUrl: "http://127.0.0.1:3202/?screen=integrated-skills", openPractice: /Open practice/i },
  { id: "german", name: "Deutsch Automaticity", url: "http://127.0.0.1:3210/", integratedUrl: "http://127.0.0.1:3210/fertigkeiten" },
  { id: "tracker", name: "Cross Repository Tracker", url: "http://127.0.0.1:4312/" },
  { id: "settings", name: "Settings", url: "http://127.0.0.1:4323/settings" },
  { id: "pdf", name: "Research PDF Studio", url: "http://127.0.0.1:4332/" },
];

const languageStressCases = [
  { lang: "en", dir: "ltr", label: "Open the complete focused practice activity and continue with learner evidence" },
  { lang: "de", dir: "ltr", label: "Die vollständige fokussierte Übung öffnen und mit dem Lernnachweis fortfahren" },
  { lang: "fa", dir: "rtl", label: "تمرین کامل و متمرکز را باز کنید و سپس ثبت شواهد یادگیری را ادامه دهید" },
  { lang: "ar", dir: "rtl", label: "افتح نشاط التدريب الكامل والمركّز ثم تابع تسجيل دليل التعلّم" },
];

const outputDirectory = resolve("artifacts", "phase3-accessibility-audit-20260904");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function closeBlockingDialog(page) {
  const dialog = page.locator("dialog[open], [role='dialog'][aria-modal='true']").first();
  if (!(await dialog.isVisible().catch(() => false))) return;
  const close = dialog.getByRole("button", { name: /close|schließen|dismiss|later/i }).first();
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
}

async function inspectSemantics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const actionSelector = "button:not(:disabled), a[href], summary, input:not([type='hidden']):not(:disabled), select:not(:disabled), textarea:not(:disabled)";
    const unnamedActions = [...document.querySelectorAll(actionSelector)]
      .filter(visible)
      .filter((element) => {
        const name = (
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          [...(element.labels || [])].map((label) => label.textContent || "").join(" ") ||
          element.textContent ||
          element.getAttribute("placeholder") ||
          ""
        ).trim();
        return name.length === 0;
      })
      .map((element) => element.outerHTML.slice(0, 180));
    const unnamedNavigation = [...document.querySelectorAll("nav")]
      .filter(visible)
      .filter((element) => !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby"))
      .map((element) => element.outerHTML.slice(0, 180));
    const liveRegions = document.querySelectorAll("[aria-live], [role='status'], [role='alert']").length;
    return {
      title: document.title,
      mainLandmarks: document.querySelectorAll("main").length,
      navigationLandmarks: document.querySelectorAll("nav").length,
      unnamedActions,
      unnamedNavigation,
      liveRegions,
      direction: getComputedStyle(document.documentElement).direction,
    };
  });
}

async function keyboardActivate(page, locator, expectation) {
  if (!(await locator.isVisible().catch(() => false))) return { status: "not-applicable" };
  await locator.focus();
  const before = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 2_000) }));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 2_000) }));
  return { status: expectation(before, after) ? "passed" : "failed", beforeUrl: before.url, afterUrl: after.url };
}

async function runKeyboardChecks(page, target) {
  const results = [];
  // Tabbing from the document proves that a visible, named native control is in the keyboard sequence.
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("Tab");
  results.push(await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return { check: "first-tab-stop", status: "failed" };
    const name = (
      active.getAttribute("aria-label") || active.getAttribute("title") || active.textContent || ""
    ).trim();
    return { check: "first-tab-stop", status: name ? "passed" : "failed", element: active.tagName, name };
  }));

  const summary = page.locator("summary:visible").first();
  if (await summary.isVisible().catch(() => false)) {
    const details = summary.locator("xpath=ancestor::details[1]");
    const wasOpen = await details.evaluate((element) => element.open);
    await summary.focus();
    await page.keyboard.press("Enter");
    const isOpen = await details.evaluate((element) => element.open);
    results.push({ check: "accordion-enter", status: wasOpen !== isOpen ? "passed" : "failed" });
  }

  if (target.id === "settings") {
    const filter = page.locator(".settings-category-bar button:visible").nth(1);
    if (await filter.isVisible().catch(() => false)) {
      const before = await filter.evaluate((element) => ({ className: element.className, pressed: element.getAttribute("aria-pressed") }));
      await filter.focus();
      await page.keyboard.press("Enter");
      const after = await filter.evaluate((element) => ({ className: element.className, pressed: element.getAttribute("aria-pressed") }));
      results.push({ check: "filter-enter", status: JSON.stringify(before) !== JSON.stringify(after) ? "passed" : "failed" });
    }
  }

  if (target.id === "pdf") {
    const settingsButton = page.getByRole("button", { name: /Einstellungen/ }).first();
    await settingsButton.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Integrationen und Exporte" });
    const opened = await dialog.isVisible().catch(() => false);
    await page.keyboard.press("Escape");
    const closed = !(await dialog.isVisible().catch(() => false));
    results.push({ check: "dialog-enter-escape", status: opened && closed ? "passed" : "failed" });
  }

  if (target.openPractice) {
    const openPractice = page.getByRole("button", { name: target.openPractice }).first();
    results.push({ check: "open-practice-enter", ...(await keyboardActivate(page, openPractice, (before, after) => before.url !== after.url || before.text !== after.text)) });
  }
  return results;
}

async function measureReflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const overflow = Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth;
    const pageScale = Number.parseFloat(document.documentElement.style.zoom || "1") || 1;
    const visualViewportWidth = root.clientWidth * pageScale;
    const visibleActions = [...document.querySelectorAll("button:not(:disabled), a[href], summary, input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight * pageScale && rect.right > 0 && rect.left < visualViewportWidth && style.display !== "none" && style.visibility !== "hidden";
      });
    const clippedActions = visibleActions
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > visualViewportWidth + 1 || rect.left < -1;
      })
      .map((element) => ({
        tag: element.tagName,
        name: (
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          [...(element.labels || [])].map((label) => label.textContent || "").join(" ") ||
          element.textContent ||
          element.getAttribute("placeholder") ||
          ""
        ).trim(),
        rect: element.getBoundingClientRect().toJSON(),
      }));
    return { clientWidth: root.clientWidth, pageScale, visualViewportWidth, scrollWidth: Math.max(root.scrollWidth, body.scrollWidth), overflow, clippedActions };
  });
}

async function stressLongLabels(page) {
  const results = [];
  for (const [index, stressCase] of languageStressCases.entries()) {
    await page.evaluate(({ lang, dir, label }) => {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      const candidates = [...document.querySelectorAll("button, a[href], summary")];
      const target = candidates.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 80 && rect.height > 20 && rect.top >= 0 && rect.bottom <= innerHeight && rect.right > 0 && rect.left < innerWidth && !element.hasAttribute("aria-label");
      });
      if (target) {
        target.setAttribute("data-phase3-stress-label", lang);
        target.textContent = label;
      }
    }, stressCase);
    const measurement = await measureReflow(page);
    const direction = await page.evaluate(() => getComputedStyle(document.documentElement).direction);
    results.push({
      language: stressCase.lang,
      expectedDirection: stressCase.dir,
      direction,
      status: measurement.overflow <= 1 && measurement.clippedActions.length === 0 && direction === stressCase.dir ? "passed" : "failed",
      measurement,
    });
    // Reload between languages so one injected label cannot influence the next result.
    if (index < languageStressCases.length - 1) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await closeBlockingDialog(page);
    }
  }
  return results;
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  methodology: "320 CSS pixels, equivalent to a 640px viewport at 200% zoom; DPR 2 is screenshot resolution only",
  targets: [],
  passed: false,
};

try {
  for (const target of targets) {
    const errors = [];
    const context = await browser.newContext({ viewport: { width: 320, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const networkFailures = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(`console: ${message.text()}`);
    });
    page.on("response", (item) => {
      if (item.status() >= 400) networkFailures.push({ status: item.status(), url: item.url() });
    });
    const response = await page.goto(target.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await closeBlockingDialog(page);
    const semantics = await inspectSemantics(page);
    const reflow320 = await measureReflow(page);
    const keyboard = await runKeyboardChecks(page, target);
    await page.screenshot({ path: resolve(outputDirectory, `${target.id}-320-dpr2.png`), fullPage: false });

    if (target.integratedUrl) {
      await page.goto(target.integratedUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await closeBlockingDialog(page);
      const summary = page.locator("summary:visible").first();
      if (await summary.isVisible().catch(() => false)) {
        const details = summary.locator("xpath=ancestor::details[1]");
        const before = await details.evaluate((element) => element.open);
        await summary.focus();
        await page.keyboard.press("Enter");
        const after = await details.evaluate((element) => element.open);
        keyboard.push({ check: "integrated-skills-accordion-enter", status: before !== after ? "passed" : "failed" });
      } else {
        keyboard.push({ check: "integrated-skills-accordion-enter", status: "failed" });
      }
    }

    // Keep the layout at the 320px reflow width; CSS zoom would scale geometry
    // after layout and would not reproduce the browser's 200% reflow condition.
    await page.goto(target.url, { waitUntil: "domcontentloaded" });
    await closeBlockingDialog(page);
    const longLabels = await stressLongLabels(page);
    await page.screenshot({ path: resolve(outputDirectory, `${target.id}-200-percent.png`), fullPage: false });

    const result = {
      id: target.id,
      name: target.name,
      requestedUrl: target.url,
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
      semantics,
      reflow320,
      keyboard,
      longLabels,
      errors,
      networkFailures,
    };
    result.passed =
      result.httpStatus === 200 &&
      semantics.mainLandmarks === 1 &&
      semantics.unnamedActions.length === 0 &&
      semantics.unnamedNavigation.length === 0 &&
      reflow320.overflow <= 1 &&
      reflow320.clippedActions.length === 0 &&
      keyboard.every((check) => check.status === "passed" || check.status === "not-applicable") &&
      longLabels.every((entry) => entry.status === "passed") &&
      errors.length === 0;
    report.targets.push(result);
    await context.close();
  }
} finally {
  await browser.close();
}

report.passed = report.targets.every((target) => target.passed);
await writeFile(resolve(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const target of report.targets) {
  console.log(`${target.passed ? "PASS" : "FAIL"} ${target.name}`);
  if (!target.passed) {
    console.log(JSON.stringify({ semantics: target.semantics, reflow320: target.reflow320, keyboard: target.keyboard, longLabels: target.longLabels, errors: target.errors }, null, 2));
  }
}
console.log(`Evidence: ${resolve(outputDirectory, "report.json")}`);
if (!report.passed) process.exitCode = 1;
