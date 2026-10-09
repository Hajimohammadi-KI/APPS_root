import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "Apps/English/English-Automaticity/package.json"));
const { chromium, expect } = require("@playwright/test");
const baseline = process.argv.includes("--baseline");
const online = process.argv.includes("--online");
assert(!(online && baseline), "Baseline is only captured from local builds.");
const output = resolve(root, "artifacts", baseline ? "worksheet-baseline" : online ? "worksheet-online" : "worksheet-local");
await mkdir(output, { recursive: true });
const apps = [
  { id: "en", base: online ? "https://english-grammar-automaticity-pwa.vercel.app" : "http://127.0.0.1:3202", routes: ["/", "/practice", "/grammar", "/daily", "/studio", "/settings", "/?screen=progress", "/resources"] },
  { id: "de", base: online ? "https://deutschflow-grammar.vercel.app" : "http://127.0.0.1:3210", routes: ["/", "/practice", "/grammatik", "/heute", "/studio", "/einstellungen", "/fortschritt", "/ressourcen"] },
];
const report = { scope: "Isolated browser contexts; no existing learner profile or data is accessed.", online, baseline, pages: [], interactions: [] };
const browser = await chromium.launch({ channel: "msedge", headless: true, timeout: 30_000 });
try {
  for (const app of apps) {
    for (const width of baseline ? [1280] : [390, 768, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      page.setDefaultNavigationTimeout(30_000);
      try {
        for (const [index, route] of app.routes.entries()) {
          if (baseline && index > 3) continue;
          const errors = [];
          const onError = (error) => errors.push(error.message);
          page.on("pageerror", onError);
          const response = await page.goto(app.base + route, { waitUntil: "domcontentloaded" });
          assert.equal(response?.status(), 200, `${app.id} ${route} responds successfully`);
          // Static grammar and today pages carry their visible title in an h2 at phone width.
          await expect(page.locator("h1:visible, h2:visible").first()).toBeVisible();
          if (route === "/practice") await expect(page.locator("#practice-response")).toBeVisible();
          const measures = await page.evaluate(() => ({
            width: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            background: getComputedStyle(document.body).backgroundColor,
            heading: getComputedStyle(document.querySelector("h1, h2")).color,
            primary: getComputedStyle(document.documentElement).getPropertyValue("--calm-primary").trim(),
          }));
          assert(measures.scrollWidth <= measures.width + 1, `${app.id} ${route} fits width ${width}`);
          if (!baseline) assert.equal(measures.primary.toLowerCase(), "#007f83", `${app.id} ${route} uses worksheet teal`);
          const file = `${app.id}-${width}-${index}.png`;
          await page.screenshot({ path: resolve(output, file), fullPage: true });
          page.off("pageerror", onError);
          report.pages.push({ app: app.id, route, width, ...measures, errors, screenshot: file });
          assert.equal(errors.length, 0, `${app.id} ${route} has no browser exceptions`);
          console.log(`PASS ${app.id} ${width} ${route}`);
        }
      } finally { await context.close(); }
    }
  }
} finally {
  await browser.close();
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
}
