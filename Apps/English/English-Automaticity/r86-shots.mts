// Usage: node r86-shots.mts <outDir> [compareDir]
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [outDir, compareDir] = [process.argv[2], process.argv[3]];
mkdirSync(outDir, { recursive: true });
const apps = {
  en: { base: "http://127.0.0.1:3202", routes: ["/", "/progress", "/integrated-skills", "/resources", "/errors", "/library", "/settings", "/studio", "/flashcards", "/teacher", "/privacy", "/support"] },
  de: { base: "http://127.0.0.1:3210", routes: ["/", "/fortschritt", "/fertigkeiten", "/ressourcen", "/wiederholungen", "/fehler", "/audio", "/einstellungen", "/studio", "/themen", "/lehrkraft", "/klassik", "/automatik", "/deutsch-mit-marija", "/privacy", "/support"] },
};
const browser = await chromium.launch();
const report: Record<string, string> = {};
for (const [lang, app] of Object.entries(apps)) {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    for (const route of app.routes) {
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date("2026-10-11T10:00:00"));
      await page.goto(app.base + route, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(800);
      const name = `${lang}-${width}-${route.replace(/\//g, "_") || "_"}.png`;
      const buffer = await page.screenshot({ fullPage: true, animations: "disabled" }).catch(() => Buffer.alloc(0));
      writeFileSync(join(outDir, name), buffer);
      report[name] = createHash("sha1").update(buffer).digest("hex");
      await page.close();
    }
    await context.close();
  }
}
await browser.close();
writeFileSync(join(outDir, "hashes.json"), JSON.stringify(report, null, 2));
if (compareDir && existsSync(join(compareDir, "hashes.json"))) {
  const before = JSON.parse(readFileSync(join(compareDir, "hashes.json"), "utf8"));
  const changed = Object.keys(report).filter((name) => before[name] !== report[name]);
  console.log(`${Object.keys(report).length} screenshots, ${changed.length} differ from ${compareDir}:`);
  for (const name of changed) console.log("  " + name);
} else {
  console.log(`${Object.keys(report).length} screenshots saved to ${outDir}`);
}
