import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

const contractFiles = [
  "Apps/English/English-Automaticity/apps/web/app/styles/100-interaction-direction.css",
  "Apps/Deutsch-Automaticity/apps/web/src/app/styles/100-interaction-direction.css",
  // The active Tracker was restored under its original Study-Tracker folder so release and UI checks use one canonical source.
  "Apps/Study-Tracker/app/styles/100-interaction-direction.css",
  "Apps/Apps-For-Integeration/Einstellungen-APP/app/styles/100-interaction-direction.css",
  "Apps/Apps-For-Integeration/Reader-PDF-App/app/styles/100-interaction-direction.css",
];

const standaloneFiles = [
  "Apps/English/English-Automaticity/apps/web/public/replacements/en/daily.html",
  "Apps/English/English-Automaticity/apps/web/public/replacements/en/grammar.html",
  "Apps/Deutsch-Automaticity/apps/web/public/replacements/de/heute.html",
  "Apps/Deutsch-Automaticity/apps/web/public/replacements/de/grammatik.html",
  "Apps/Starter-App/public/styles.css",
];

function assertContract(source, file) {
  // These assertions keep hover, keyboard focus, reduced motion, and both
  // writing directions together so one app cannot silently drift.
  assert.match(source, /html\[lang="en"\]/, `${file} must declare English direction`);
  assert.match(source, /html\[lang="de"\]/, `${file} must declare German direction`);
  assert.match(source, /html\[lang="fa"\]/, `${file} must declare Persian direction`);
  assert.match(source, /html\[lang="ar"\]/, `${file} must declare Arabic direction`);
  assert.match(source, /\[dir="rtl"\]/, `${file} must support scoped RTL content`);
  assert.match(source, /:hover/, `${file} must expose hover feedback`);
  assert.match(source, /:focus-visible/, `${file} must expose keyboard focus`);
}

test("every canonical app imports the shared interaction and direction contract", async () => {
  for (const file of contractFiles) {
    const source = await readFile(resolve(root, file), "utf8");
    assertContract(source, file);
    assert.match(source, /\.skip-link/, `${file} must style the shared keyboard skip link`);
    assert.match(source, /overflow-wrap:\s*anywhere/, `${file} must wrap long localized control labels`);
    assert.match(source, /white-space:\s*normal/, `${file} must not force localized controls onto one line`);
    assert.match(source, /prefers-reduced-motion/, `${file} must protect reduced-motion users`);
  }
});

test("standalone practice and launcher pages carry the same contract", async () => {
  for (const file of standaloneFiles) {
    const source = await readFile(resolve(root, file), "utf8");
    assertContract(source, file);
  }
});
