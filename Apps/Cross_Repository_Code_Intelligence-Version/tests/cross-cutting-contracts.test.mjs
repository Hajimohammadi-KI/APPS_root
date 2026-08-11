import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tracker = await readFile(new URL("../app/study-tracker.tsx", import.meta.url), "utf8");
const pdfPage = await readFile(new URL("../app/pdf-reader/page.tsx", import.meta.url), "utf8");
const pdfDocument = await readFile(new URL("../app/pdf-reader/components/PdfDocument.tsx", import.meta.url), "utf8");
const navigation = await readFile(new URL("../app/local-navigation.tsx", import.meta.url), "utf8");
const rootLayout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const cssFiles = [
  "../app/globals.css",
  "../app/styles/00-foundation.css",
  "../app/styles/01-app-shell.css",
  "../app/styles/pages/tracker.css",
  "../app/styles/pages/dashboard.css",
  "../app/styles/90-responsive.css",
  "../app/styles/components/hover-help-and-course.css",
  "../app/styles/91-accessibility.css",
];
const css = (
  await Promise.all(
    cssFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
  )
).join("\n");
const pdfCss = await readFile(new URL("../app/pdf-reader/pdf-reader.css", import.meta.url), "utf8");
const settingsCss = await readFile(new URL("../app/settings/settings-modern.css", import.meta.url), "utf8");
const settingsBaseCss = await readFile(new URL("../app/settings/settings-base.css", import.meta.url), "utf8");
const settingsModuleCss = await readFile(new URL("../app/settings/settings-module.css", import.meta.url), "utf8");
const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
const preparePdfWorker = await readFile(new URL("../scripts/prepare-pdf-worker.mjs", import.meta.url), "utf8");
const exposeRoute = await readFile(new URL("../app/api/expose/route.ts", import.meta.url), "utf8");
const manifest = await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8");
const shadcn = await readFile(new URL("../components.json", import.meta.url), "utf8");
const actualSoftwareRoadmap = await readFile(new URL("../docs/ACTUAL-SOFTWARE-ROADMAP.md", import.meta.url), "utf8");

test("tracker has API and local persistence boundaries", () => {
  assert.match(tracker, /fetch\("\/api\/state"/);
  assert.match(tracker, /LOCAL_STATE_KEY/);
  assert.match(tracker, /readLocalState/);
  assert.match(tracker, /writeLocalState/);
  assert.match(tracker, /normalizeState/);
  assert.match(tracker, /validItemIds\.has/);
});

test("plan lifecycle and daily work mode are synchronized with central settings", () => {
  assert.match(tracker, /saveCentralPlanning/);
  assert.match(tracker, /planStatus: nextSettings\.planStatus/);
  assert.match(tracker, /planPausedAt: nextSettings\.planPausedAt/);
  assert.match(tracker, /dailyWorkMode: nextSettings\.dailyWorkMode/);
  assert.match(tracker, /setDailyWorkMode/);
  assert.match(tracker, /12 Minuten Rettungsmodus/);
});

test("an unstarted or paused plan cannot record task or focus progress", () => {
  assert.match(tracker, /const planCanRecordToday = settings\.planStatus === "running"/);
  assert.match(tracker, /disabled=\{!planCanRecordToday\}/);
  assert.match(tracker, /if \(action === "start" && settings\.planStatus !== "running"\)/);
  assert.match(tracker, /const planIsRunning = settings\.planStatus === "running"/);
  assert.match(tracker, /disabled=\{!planIsRunning\}/);
});

test("PDF selection and annotation persistence are wired", () => {
  assert.match(pdfDocument, /window\.getSelection\(\)/);
  assert.match(pdfDocument, /textLayer/);
  assert.match(pdfDocument, /getClientRects/);
  assert.match(pdfPage, /validatePdfMarks/);
  assert.match(pdfPage, /localStorage\.setItem\(MARK_STORE/);
  assert.match(pdfPage, /localStorage\.getItem\(MARK_STORE/);
  assert.match(pdfPage, /READER_STATE_STORE/);
  assert.match(pdfPage, /sanitizePdfReaderStateStore/);
});

test("PDF.js worker is compatible with local Vinext and Next.js builds", () => {
  assert.match(pdfDocument, /const workerUrl = "\/pdf\.worker\.min\.mjs"/);
  assert.doesNotMatch(pdfDocument, /new URL\("pdfjs-dist\/build\/pdf\.worker\.min\.mjs"/);
  assert.match(packageJson, /"prepare:pdf-worker"/);
  assert.match(packageJson, /prepare:pdf-worker && vinext build/);
  assert.match(packageJson, /prepare:pdf-worker && next build/);
  assert.match(preparePdfWorker, /node_modules\/pdfjs-dist\/build\/pdf\.worker\.min\.mjs/);
  assert.match(preparePdfWorker, /open\(lockPath, "wx"\)/);
  assert.match(preparePdfWorker, /sourceBytes\.equals\(destinationBytes\)/);
  assert.match(exposeRoute, /import \{ DEVICE_ONLY_STORAGE \}/);
  assert.match(exposeRoute, /if \(DEVICE_ONLY_STORAGE\) return null/);
  assert.match(exposeRoute, /source: "bundled"/);
});

test("navigation supports routes and hash-driven tracker views", () => {
  assert.match(navigation, /window\.history\.back/);
  assert.match(navigation, /window\.location\.assign\("\/"\)/);
  assert.match(navigation, /window\.history\.forward/);
  assert.match(tracker, /addEventListener\("hashchange"/);
  assert.match(tracker, /window\.location\.hash === "#plan"/);
  assert.match(tracker, /getElementById\("plan"\)/);
});

test("desktop, tablet, mobile, and touch layout contracts exist", () => {
  assert.match(rootLayout, /export const viewport: Viewport/);
  assert.match(rootLayout, /width: "device-width"/);
  assert.match(rootLayout, /initialScale: 1/);
  assert.match(css, /grid-template-columns:\s*255px\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /@media \(max-width: 1080px\)/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 590px\)/);
  assert.match(css, /\.start-dashboard \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(pdfCss, /@media \(max-width: 920px\)/);
  assert.match(pdfCss, /overflow/);
});

test("the accessible purple palette replaces the legacy green interface", () => {
  assert.match(css, /--teal-800:\s*#675080/);
  assert.match(css, /--green:\s*#5f4691/);
  assert.match(css, /activity-level-2 i \{ background:\s*#ad94cc/);
  assert.doesNotMatch(css, /#2b8f61|#70b7ad|#e9f0ed/i);
  assert.match(pdfCss, /\.green \{ --marker:\s*#c7afe2/);
  assert.doesNotMatch(pdfCss, /#0f766e|#126e68|#77d5b4/i);
  assert.match(settingsCss, /\.settings-platform-icon[^}]*background:\s*#5f4691/);
  assert.doesNotMatch(settingsCss, /#176966|#267347|#effaf6/i);
  assert.match(manifest, /"theme_color": "#675080"/);
});

test("rhythm weekdays follow the shifted Version2 plan dates", () => {
  assert.match(tracker, /shiftedPlanDate\(day\.date, settings\.planStartDate\)\}\T12:00:00Z/);
});

test("PDF integration editor uses high-contrast readable colors", () => {
  assert.match(pdfCss, /\.code-editor \{[^}]*background:\s*#faf7fd/);
  assert.match(pdfCss, /\.code-editor \{[^}]*color:\s*#29233d !important/);
  assert.match(pdfCss, /-webkit-text-fill-color:\s*#29233d/);
  assert.match(pdfCss, /font:\s*600 14px\/1\.7/);
  assert.doesNotMatch(pdfCss, /\.code-editor \{[^}]*background:\s*#241b31/);
});

test("tracker branding remains readable when route styles are bundled together", () => {
  assert.match(css, /\.app-shell > \.topbar \.brand > \.brand-mark/);
  assert.match(css, /\.app-shell > \.topbar \.brand > span:last-child/);
  assert.match(css, /background:\s*transparent/);
  assert.match(css, /\.app-shell > \.topbar \.brand strong[\s\S]*?color:\s*var\(--ink\)/);
  assert.match(settingsBaseCss, /\.werkzeug\{--ink:/);
  assert.match(settingsBaseCss, /@scope \(\.werkzeug\) \{/);
  assert.doesNotMatch(settingsBaseCss, /:root\{--ink:/);
  assert.match(settingsCss, /@scope \(\.werkzeug\) \{/);
  assert.match(settingsCss, /\.werkzeug \{[\s\S]*?--ink:/);
  assert.doesNotMatch(settingsCss, /:root\s*\{/);
  assert.match(settingsModuleCss, /@scope \(\.werkzeug\) \{/);
  assert.match(settingsCss, /\.settings-platform-items \{ grid-template-columns: 1fr; \}/);
  assert.match(settingsCss, /\.header-status \.header-link:last-child \{ display: none; \}/);
});

test("the frontend has an owned Shadcn configuration and an executable roadmap", () => {
  const configuration = JSON.parse(shadcn);
  assert.equal(configuration.style, "new-york");
  assert.equal(configuration.rsc, true);
  assert.equal(configuration.tailwind.css, "app/globals.css");
  assert.equal(configuration.aliases.ui, "@/components/ui");
  assert.match(actualSoftwareRoadmap, /React 19 and Next\.js 16/);
  assert.match(actualSoftwareRoadmap, /TypeScript 7/);
  assert.match(actualSoftwareRoadmap, /NestJS 11/);
  assert.match(actualSoftwareRoadmap, /Resilient project schedule/);
  assert.match(actualSoftwareRoadmap, /bun run audit:legacy passes/);
});
