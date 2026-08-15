import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authRoute = await readFile(new URL("../app/api/google/auth/route.ts", import.meta.url), "utf8");
const callbackRoute = await readFile(new URL("../app/api/google/callback/route.ts", import.meta.url), "utf8");
const calendarRoute = await readFile(new URL("../app/api/google/calendar/route.ts", import.meta.url), "utf8");
const reader = await readFile(new URL("../app/pdf-reader/page.tsx", import.meta.url), "utf8");
const generator = await readFile(new URL("../scripts/generate-local-env.mjs", import.meta.url), "utf8");

test("Google one-click OAuth defaults to Calendar only and returns to the calling page", () => {
  // Drive and Gmail are sensitive/restricted scopes that trigger a Google
  // security assessment and a far more alarming consent screen, so they are
  // no longer part of the default. Callers that need them ask explicitly.
  assert.match(authRoute, /"services"\) \|\| "calendar"/);
  assert.match(authRoute, /calendar\.events/);
  assert.match(authRoute, /drive\.readonly/);
  assert.match(authRoute, /include_granted_scopes/);
  assert.match(authRoute, /werkzeug_google_state/);
  assert.match(authRoute, /werkzeug_google_return/);
  assert.match(callbackRoute, /safeReturnTo/);
  assert.match(callbackRoute, /werkzeug_google_return/);
  assert.match(callbackRoute, /target\.searchParams\.set\("google", result\)/);
});

test("the connect flow uses PKCE so no per-learner client secret is needed", () => {
  assert.match(authRoute, /code_challenge_method/);
  assert.match(authRoute, /S256/);
  assert.match(authRoute, /werkzeug_google_verifier/);
  // The gate must not demand a client secret any more.
  assert.doesNotMatch(authRoute, /!client\.clientSecret/);
  assert.match(callbackRoute, /code_verifier/);
  // A secret is still forwarded when a legacy Web client provides one.
  assert.match(callbackRoute, /client\.clientSecret \? \{ client_secret/);
  assert.match(callbackRoute, /werkzeug_google_verifier/);
});

test("the over-broad cloud-platform scope is not requested", () => {
  // `cloud-platform` would grant this app full control of the learner's
  // entire Google Cloud account; translation needs only cloud-translation.
  assert.doesNotMatch(authRoute, /auth\/cloud-platform/);
});

test("the PDF Reader uses verified Google service status and the Calendar API", () => {
  assert.match(reader, /fetch\("\/api\/google\/status"/);
  assert.match(reader, /googleStatus\.services\?\.calendar/);
  assert.match(reader, /googleStatus\.services\?\.drive/);
  assert.match(reader, /services: "calendar,drive", returnTo: "\/pdf-reader"/);
  assert.match(reader, /fetch\("\/api\/google\/calendar"/);
  assert.match(calendarRoute, /export async function POST/);
  assert.match(calendarRoute, /CALENDAR_WRITE_SCOPE/);
  assert.match(calendarRoute, /isSameOriginMutation/);
});

test("local setup detects OAuth configuration without overwriting explicit local credentials or printing secrets", () => {
  assert.match(generator, /findStoredGoogleOAuthClient/);
  assert.match(generator, /provider_secrets/);
  assert.match(generator, /setDefault\("GOOGLE_CLIENT_ID"/);
  assert.match(generator, /setDefault\("GOOGLE_CLIENT_SECRET"/);
  assert.doesNotMatch(generator, /setValue\("GOOGLE_CLIENT_ID"/);
  assert.doesNotMatch(generator, /setValue\("GOOGLE_CLIENT_SECRET"/);
  assert.match(generator, /Schlüsselwerte werden nicht ausgegeben/);
  assert.doesNotMatch(generator, /console\.log\([^\n]*(clientId|clientSecret)/);
});
