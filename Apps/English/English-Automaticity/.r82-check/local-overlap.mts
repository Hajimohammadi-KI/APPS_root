import { chromium } from "@playwright/test";

const browser = await chromium.launch();
for (const [width, path] of [[1280, "/"], [1280, "/library"], [1280, "/errors"], [1280, "/progress"], [1280, "/resources"], [1280, "/settings"]] as const) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://127.0.0.1:3202${path}`, { waitUntil: "networkidle" });
  const summary = page.locator("details.app-tools > summary");
  const box = await summary.boundingBox();
  const covering = box
    ? await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("summary, label")?.className ?? "", [box.x + box.width / 2, box.y + box.height / 2])
    : "no summary";
  console.log(`${width}px ${path} -> ${page.url()} :: covering=${covering || "clear"}`);
  await page.close();
}
await browser.close();
