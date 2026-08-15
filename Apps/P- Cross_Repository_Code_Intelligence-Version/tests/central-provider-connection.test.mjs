import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reader = await readFile(new URL("../app/pdf-reader/page.tsx", import.meta.url), "utf8");
const aiRoute = await readFile(new URL("../app/api/ai/route.ts", import.meta.url), "utf8");
const translateRoute = await readFile(new URL("../app/api/translate/route.ts", import.meta.url), "utf8");

test("PDF Visual uses central AI and translation settings", () => {
  assert.match(reader, /fetch\("\/api\/status"/);
  assert.match(reader, /In Einstellungen bearbeiten/);
  assert.doesNotMatch(reader, /setOpenAiKey|setDeepLKey|localStorage\.setItem\([^\n]*openai.*key/i);
  assert.doesNotMatch(reader, /body:\s*JSON\.stringify\(\{[^}]*apiKey/s);
});

test("AI routes do not accept provider secrets from browser request bodies", () => {
  assert.doesNotMatch(aiRoute, /body\.apiKey|body\.model/);
  assert.doesNotMatch(translateRoute, /body\.apiKey/);
  assert.match(aiRoute, /getProviderSecretForRequest/);
  assert.match(translateRoute, /getProviderSecretForRequest/);
  assert.match(translateRoute, /api-free\.deepl\.com/);
  assert.match(translateRoute, /DeepL-Auth-Key/);
});
