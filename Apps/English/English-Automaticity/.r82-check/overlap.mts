import { chromium } from "@playwright/test";

const base = process.argv[2];
const paths = process.argv.slice(3);
const browser = await chromium.launch();
for (const path of paths) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base + path, { waitUntil: "load" });
  const summary = page.locator("details.app-tools > summary");
  let covering = "no summary";
  try {
    await summary.waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);
    const box = await summary.boundingBox();
    covering = box
      ? await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("summary, label")?.className ?? "", [box.x + box.width / 2, box.y + box.height / 2])
      : "no box";
  } catch {}
  const standalone = await page.locator(".standalone-neuro-ruler-toggle").count();
  console.log(`${path} -> ${page.url()} :: covering=${covering || "clear"} standaloneToggle=${standalone}`);
  await page.close();
}
await browser.close();
