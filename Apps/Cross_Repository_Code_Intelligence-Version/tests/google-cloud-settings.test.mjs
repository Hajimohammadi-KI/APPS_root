import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const defaults = await readFile(new URL("../lib/werkzeug-settings.ts", import.meta.url), "utf8");
const provider = await readFile(new URL("../components/provider-setup.tsx", import.meta.url), "utf8");
const example = JSON.parse(await readFile(new URL("../public/einstellungen-settings.v1.example.json", import.meta.url), "utf8"));

test("stores the complete local Google Cloud setup without secrets", () => {
  const links = example.integration.links;
  assert.equal(links.googleProjectNumber, "651587486187");
  assert.equal(links.googleTestUserEmail, "fatemeh.hajimohammadi.DE@gmail.com");
  assert.equal(links.googleJavaScriptOrigin, "http://127.0.0.1:4312");
  assert.equal(links.googleCallbackUrl, "http://127.0.0.1:4312/api/google/callback");
  assert.match(links.googleAudienceUrl, /auth\/audience\?project=651587486187$/);
  assert.match(links.googleDriveApiUrl, /drive\.googleapis\.com\/overview\?project=651587486187$/);
  assert.doesNotMatch(JSON.stringify(example), /clientSecret|GOOGLE_CLIENT_SECRET|sk-[A-Za-z0-9]/i);
});

test("keeps Google Cloud metadata without exposing technical setup to learners", () => {
  for (const key of [
    "googleProjectNumber",
    "googleTestUserEmail",
    "googleJavaScriptOrigin",
    "googleAudienceUrl",
    "googleCredentialsUrl",
    "googleDriveApiUrl",
    "googleCalendarApiUrl",
    "googleGmailApiUrl",
  ]) {
    assert.match(defaults, new RegExp(`${key}:`));
  }
  assert.match(provider, /Mit Google verbinden/);
  assert.match(provider, /\/api\/google\/auth/);
  assert.match(provider, /returnTo: "\/settings"/);
  assert.doesNotMatch(provider, /Google Client-ID|Google Client-Secret|googleSetup\./);
  assert.match(provider, /niemals dein Google-Passwort/);
});
