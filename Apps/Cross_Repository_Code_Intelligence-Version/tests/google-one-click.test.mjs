import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authRoute = await readFile(new URL("../app/api/google/auth/route.ts", import.meta.url), "utf8");
const callbackRoute = await readFile(new URL("../app/api/google/callback/route.ts", import.meta.url), "utf8");
const calendarRoute = await readFile(new URL("../app/api/google/calendar/route.ts", import.meta.url), "utf8");
const reader = await readFile(new URL("../app/pdf-reader/page.tsx", import.meta.url), "utf8");
const generator = await readFile(new URL("../scripts/generate-local-env.mjs", import.meta.url), "utf8");

test("Google one-click OAuth requests Calendar and Drive and returns to the calling page", () => {
  assert.match(authRoute, /calendar,drive/);
  assert.match(authRoute, /calendar\.events/);
  assert.match(authRoute, /drive\.readonly/);
  assert.match(authRoute, /include_granted_scopes/);
  assert.match(authRoute, /werkzeug_google_state/);
  assert.match(authRoute, /werkzeug_google_return/);
  assert.match(callbackRoute, /safeReturnTo/);
  assert.match(callbackRoute, /werkzeug_google_return/);
  assert.match(callbackRoute, /target\.searchParams\.set\("google", result\)/);
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
