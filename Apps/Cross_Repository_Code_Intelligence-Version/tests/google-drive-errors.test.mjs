import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helper = await readFile(new URL("../lib/google-errors.ts", import.meta.url), "utf8");
const reader = await readFile(new URL("../app/pdf-reader/page.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/google/drive/route.ts", import.meta.url), "utf8");

test("maps a disabled Drive API response to a concise German explanation", () => {
  assert.match(helper, /google drive api has not been used/);
  assert.match(helper, /Die Google Drive API ist in deinem Google-Cloud-Projekt noch nicht aktiviert/);
  assert.match(helper, /console\.cloud\.google\.com\/apis\/api\/drive\.googleapis\.com\/overview/);
  assert.match(helper, /\?project=\$\{encodeURIComponent\(projectNumber\)\}/);
});

test("uses friendly Drive errors on both browser and server paths", () => {
  assert.match(reader, /friendlyGoogleDriveError/);
  assert.match(route, /friendlyGoogleDriveError/);
  assert.match(reader, /Google Drive API ist noch nicht aktiviert/);
  assert.match(reader, /Drive API aktivieren/);
  assert.match(reader, /Erneut prüfen/);
  assert.match(reader, /Angemeldet · Drive API fehlt/);
  assert.match(reader, /role="alert" aria-live="assertive"/);
  assert.match(reader, /response\.status === 403 && isGoogleDriveApiDisabled/);
  assert.doesNotMatch(reader, /showToast\(error instanceof Error \? error\.message : "Drive-Dateien/);
});
