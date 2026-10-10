import { chromium } from "@playwright/test";

const browser = await chromium.launch();
for (const [width, path] of [[1280, "/?screen=library"], [1280, "/"], [1117, "/"], [1500, "/"]] as const) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`https://english-grammar-automaticity-pwa.vercel.app${path}`, { waitUntil: "networkidle" });
  const summary = page.locator("details.app-tools > summary");
  const box = await summary.boundingBox();
  const covering = box
    ? await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("summary, label")?.className ?? "", [box.x + box.width / 2, box.y + box.height / 2])
    : "no summary";
  console.log(`${width}px ${path} -> ${page.url()} :: covering=${covering || "clear"}`);
  await page.close();
}
await browser.close();
