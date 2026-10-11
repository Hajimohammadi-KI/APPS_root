// Opens every learner route at phone and desktop width against a running
// server and fails on a missing title, horizontal overflow, a broken menu
// link or an uncaught page error.
// Usage: node scripts/browser-smoke.mts [http://127.0.0.1:3210]
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:3210").replace(/\/$/, "");
const routes: Array<{ path: string; title: RegExp; staticPage?: boolean }> = [
  { path: "/", title: /./ },
  { path: "/heute", title: /./, staticPage: true },
  { path: "/grammatik", title: /Grammatik/, staticPage: true },
  { path: "/practice", title: /./, staticPage: true },
  { path: "/studio", title: /./ },
  { path: "/fortschritt", title: /./ },
  { path: "/fertigkeiten", title: /./ },
  { path: "/ressourcen", title: /Lernmaterial/ },
  { path: "/wiederholungen", title: /Wiederholungen/ },
  { path: "/fehler", title: /Fehlermotor/ },
  { path: "/audio", title: /Audio-Bibliothek/ },
  { path: "/themen", title: /Themen/ },
  { path: "/einstellungen", title: /Einstellungen/ },
  { path: "/lehrkraft", title: /./ },
  { path: "/privacy", title: /Datenschutz/ },
  { path: "/support", title: /Support/ },
];

const browser = await chromium.launch();
const errors: string[] = [];
let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
};

for (const width of [390, 1280]) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (error) => errors.push(`${width}px ${route.path}: ${error.message}`));
    const response = await page.goto(base + route.path, { waitUntil: "networkidle" });
    check(response?.status() === 200, `${width}px ${route.path} responds 200 (${response?.status()})`);
    const heading = page.locator("h1").first();
    await heading.waitFor({ timeout: 20000 }).catch(() => {});
    const text = (await heading.count()) ? (await heading.innerText()).trim() : "";
    check(route.title.test(text), `${width}px ${route.path} has a title ("${text.slice(0, 40)}")`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(!overflow, `${width}px ${route.path} no horizontal overflow`);
    if (route.staticPage && route.path !== "/practice") {
      const links = await page.locator(".calm-primary-nav a").count();
      const currentHref = await page.locator('.calm-nav-more a[aria-current="page"], .calm-primary-nav a[aria-current="page"]').first().getAttribute("href").catch(() => null);
      check(links === 5, `${width}px ${route.path} static sidebar built from navigation config (${links} primary links)`);
      check(currentHref === route.path, `${width}px ${route.path} marks itself current in the static sidebar (${currentHref})`);
      const dead = await page.locator('.calm-nav-more a[href="/fertigkeiten"]').count();
      check(dead === 1, `${width}px ${route.path} static sidebar links the real Fertigkeiten route`);
    }
    await page.close();
  }
}
const legacy = await (await browser.newPage()).goto(base + "/integrierte-fertigkeiten", { waitUntil: "commit" });
check(legacy?.url().endsWith("/fertigkeiten") === true, `old /integrierte-fertigkeiten link redirects to /fertigkeiten (${legacy?.url()})`);

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(failures ? `\n${failures} smoke check(s) failed` : "\nAll smoke checks passed");
process.exit(failures ? 1 : 0);
