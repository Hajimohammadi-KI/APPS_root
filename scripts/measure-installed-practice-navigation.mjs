import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const output = resolve(
  root,
  `artifacts/installed-navigation/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const report = {
  createdAt: new Date().toISOString(),
  scope:
    "Direct HTTP and fresh isolated Edge navigation observations; not a performance benchmark or a diagnosed root cause",
  cases: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const [language, port, unitId] of [
    ["en", 3202, "en.c.001"],
    ["de", 3210, "de.c.002"],
  ]) {
    const url = `http://127.0.0.1:${port}/practice?task=${unitId}.retrieve.1.writing`;
    const before = performance.now();
    const response = await fetch(url);
    await response.text();
    assert.equal(response.status, 200);
    const directHttpMs = Math.round(performance.now() - before);
    const context = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1280, height: 950 },
    });
    const page = await context.newPage(),
      started = performance.now(),
      requests = [];
    page.on("requestfinished", (request) =>
      requests.push({
        url: request.url(),
        finishedMs: Math.round(performance.now() - started),
        timing: request.timing(),
      }),
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const archived = page.getByRole("textbox", {
      name: language === "en" ? "Archived response" : "Archivierte Antwort",
    });
    await expect(archived).toBeVisible();
    const browserReadyMs = Math.round(performance.now() - started);
    await page.screenshot({
      path: resolve(output, `${language}-archive-full.png`),
      fullPage: true,
    });
    report.cases.push({
      language,
      url,
      directHttpMs,
      browserReadyMs,
      requests,
    });
    await context.close();
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      output,
      status: report.status,
      observations: report.cases.map(
        ({ language, directHttpMs, browserReadyMs }) => ({
          language,
          directHttpMs,
          browserReadyMs,
        }),
      ),
    }),
  );
}
