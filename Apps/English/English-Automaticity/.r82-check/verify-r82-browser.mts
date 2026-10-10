// Usage: bun verify-r82-browser.ts http://127.0.0.1:3202
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:3202").replace(/\/$/, "");
const browser = await chromium.launch();
const errors: string[] = [];
let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
};

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));

  await page.goto(`${base}/errors`, { waitUntil: "networkidle" });
  check(/Error Workshop/.test(await page.locator(".app-topbar").innerText()), `${width}px /errors shows the Error Workshop title`);

  if (width === 390) await page.locator("#mobile-menu-trigger").click();
  const more = page.locator(".learning-navigation details.ln-more");
  check((await more.getAttribute("open")) !== null, `${width}px /errors opens the tool group that contains it`);
  if ((await more.getAttribute("open")) === null) await more.locator("summary").click();
  await page.locator('.learning-navigation a[href="/library"]').click();
  await page.waitForURL(`${base}/library`);
  check(/Audio Library/.test(await page.locator(".app-topbar").innerText()), `${width}px menu link opens /library`);

  // In-app navigate() now uses the Next router; /daily is a rewrite to a static page.
  const toolsSummary = page.locator("details.app-tools > summary");
  const box = await toolsSummary.boundingBox();
  const covering = box
    ? await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("summary, label")?.className ?? "", [box.x + box.width / 2, box.y + box.height / 2])
    : "";
  check(!covering.includes("neuro-ruler"), `${width}px "Tools & help" is not covered by the reading-ruler toggle (${covering || "clear"})`);
  await page.locator("details.app-tools").evaluate((node) => { (node as HTMLDetailsElement).open = true; });
  await page.locator('button[aria-label="Open help"]').click();
  await page.locator('button:has-text("Start with Step 1")').click();
  await page.waitForURL(`${base}/daily**`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  check(page.url().startsWith(`${base}/daily`), `${width}px help button lands on /daily (${page.url()})`);
  check((await page.locator("body").innerText()).length > 200, `${width}px /daily rendered content`);

  await page.goto(`${base}/?screen=progress`, { waitUntil: "networkidle" });
  check(page.url() === `${base}/progress`, `${width}px legacy ?screen=progress lands on /progress (${page.url()})`);
  check((await page.locator('.learning-navigation a[aria-current="page"]').getAttribute("href")) === "/progress", `${width}px /progress highlights its menu entry`);

  await page.goBack();
  await page.waitForLoadState("networkidle");
  check(page.url().startsWith(`${base}/daily`), `${width}px browser back returns to the previous page (${page.url()})`);
  await page.close();
}

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(failures ? `\n${failures} browser check(s) failed` : "\nAll browser checks passed");
process.exit(failures ? 1 : 0);
