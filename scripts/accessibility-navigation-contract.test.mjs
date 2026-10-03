import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

async function source(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

test("canonical app shells expose one reusable keyboard entry contract", async () => {
  const [englishShell, englishDashboard, germanShell, germanDashboard, tracker, settings, pdf] = await Promise.all([
    source("Apps/English/English-Automaticity/apps/web/features/app-shell.tsx"),
    source("Apps/English/English-Automaticity/apps/web/features/screens/dashboard-v2-screen.tsx"),
    source("Apps/Deutsch-Automaticity/apps/web/src/components/app-shell.tsx"),
    source("Apps/Deutsch-Automaticity/apps/web/src/features/dashboard/dashboard.tsx"),
    // Keep the accessibility contract attached to the same Tracker directory used by release tooling.
    source("Apps/Study-Tracker/app/study-tracker.tsx"),
    source("Apps/Apps-For-Integeration/Einstellungen-APP/components/settings-app.tsx"),
    source("Apps/Apps-For-Integeration/Reader-PDF-App/app/page.tsx"),
  ]);

  for (const [name, appSource] of [
    ["English", englishShell],
    ["German", germanShell],
    ["Tracker", tracker],
    ["Settings", settings],
    ["PDF Studio", pdf],
  ]) {
    // A stable target keeps Tab + Enter behavior identical across products.
    assert.match(appSource, /className="skip-link" href="#main-content"/, `${name} needs a skip link`);
    assert.match(appSource, /id="main-content"/, `${name} needs a main-content target`);
    assert.match(appSource, /tabIndex=\{-1\}/, `${name} skip target must accept programmatic focus`);
  }

  assert.doesNotMatch(englishDashboard, /<main className="home-v2-main"/, "English must not nest main landmarks");
  assert.doesNotMatch(germanDashboard, /<main className="home-v2-main"/, "German must not nest main landmarks");
});

test("navigation landmarks and async states have accessible names", async () => {
  const [germanNavigation, tracker, settings, pdf] = await Promise.all([
    source("Apps/Deutsch-Automaticity/apps/web/src/components/app-navigation.tsx"),
    source("Apps/Study-Tracker/app/study-tracker.tsx"),
    source("Apps/Apps-For-Integeration/Einstellungen-APP/components/settings-app.tsx"),
    source("Apps/Apps-For-Integeration/Reader-PDF-App/app/page.tsx"),
  ]);

  assert.match(germanNavigation, /<nav aria-label=\{ariaLabel\}>/, "German navigation groups need distinct labels");
  assert.match(tracker, /<nav className="side-nav" aria-label="Arbeitsbereiche">/, "Tracker navigation needs a name");
  assert.match(settings, /<nav className="header-status" aria-label="App-Navigation">/, "Settings navigation needs a name");
  assert.match(pdf, /<nav className="sidebar" aria-label="Dokumentbereiche">/, "PDF navigation needs a name");
  assert.match(tracker, /role="status" aria-live="polite"/, "Tracker loading must be announced");
  assert.match(settings, /className="toast" role="status" aria-live="polite"/, "Settings notices must be announced");
});

test("PDF settings dialog supports Escape, focus containment, and focus restoration", async () => {
  const pdf = await source("Apps/Apps-For-Integeration/Reader-PDF-App/app/page.tsx");

  assert.match(pdf, /event\.key === "Escape"/, "PDF dialog must close with Escape");
  assert.match(pdf, /event\.key !== "Tab"/, "PDF dialog must trap Tab navigation");
  assert.match(pdf, /settingsReturnFocusRef\.current\?\.focus\(\)/, "PDF dialog must restore focus");
  assert.match(pdf, /ref=\{settingsDialogRef\}/, "PDF dialog must expose its focus scope");
});

test("narrow layouts do not require horizontal scrolling for essential controls", async () => {
  const [englishFoundation, germanResponsive, settingsResponsive] = await Promise.all([
    source("Apps/English/English-Automaticity/apps/web/app/styles/00-foundation.css"),
    source("Apps/Deutsch-Automaticity/apps/web/src/app/styles/90-responsive.css"),
    source("Apps/Apps-For-Integeration/Einstellungen-APP/app/styles/90-responsive.css"),
  ]);

  // Fixed minimum page widths and one-line filter rails both fail reflow at 320 CSS pixels.
  assert.match(englishFoundation, /body\s*\{[\s\S]*?min-width:\s*0;/, "English body must shrink below 320 physical pixels at zoom");
  // German dashboard headings and actions must stack before long localized words become clipped.
  assert.match(germanResponsive, /@media \(max-width: 560px\)[\s\S]*?\.home-v2\s*\{[\s\S]*?padding-inline:\s*14px;/, "German dashboard needs a narrow-screen content gutter");
  assert.match(germanResponsive, /\.home-v2-heading,[\s\S]*?\.home-v2-card-head\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/, "German dashboard headings must stack at narrow widths");
  assert.match(settingsResponsive, /\.werkzeug \.settings-category-bar\s*\{[\s\S]*?flex-wrap:\s*wrap;/, "Settings filters must wrap");
  assert.match(settingsResponsive, /\.settings-category-bar > \*\s*\{[\s\S]*?white-space:\s*normal;/, "Long filter labels must wrap");
});
