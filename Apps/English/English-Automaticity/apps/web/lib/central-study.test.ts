import { afterEach, beforeEach, expect, test } from "bun:test";
import { GET as aiStatus, POST as aiExplain } from "../app/api/ai/route";
import { GET as deeplStatus, POST as deeplTranslate } from "../app/api/deepl/route";
import { CENTRAL_IDENTITY_HEADERS, centralHeaders, centralStudyAppUrl } from "./central-study";

const FORGED = { [CENTRAL_IDENTITY_HEADERS.id]: "attacker", [CENTRAL_IDENTITY_HEADERS.email]: "attacker@example.com" };
const previousFetch = globalThis.fetch;
const previousEnv = { ...process.env };
let forwarded: Headers[] = [];

beforeEach(() => {
  forwarded = [];
  delete process.env.CENTRAL_STUDY_USER_ID;
  delete process.env.CENTRAL_STUDY_USER_EMAIL;
  delete process.env.CENTRAL_STUDY_APP_URL;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    forwarded.push(new Headers(init?.headers));
    if (String(input).endsWith("/api/status")) return Response.json({ openai: true, translation: true });
    return Response.json({ answer: "ok", translation: "ok" });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = previousFetch;
  process.env = { ...previousEnv };
});

function expectNoIdentity(headers: Headers) {
  expect(headers.get(CENTRAL_IDENTITY_HEADERS.id)).toBeNull();
  expect(headers.get(CENTRAL_IDENTITY_HEADERS.email)).toBeNull();
}

test("identity headers sent by the browser never reach the central service", async () => {
  const json = { "Content-Type": "application/json", ...FORGED };
  await aiStatus();
  await aiExplain(new Request("http://127.0.0.1:3201/api/ai", { method: "POST", headers: json, body: JSON.stringify({ content: "lesson", topic: "t" }) }));
  await deeplStatus();
  await deeplTranslate(new Request("http://127.0.0.1:3201/api/deepl", { method: "POST", headers: json, body: JSON.stringify({ text: "hi", target: "DE" }) }));
  expect(forwarded).toHaveLength(4);
  for (const headers of forwarded) expectNoIdentity(headers);
});

test("identity comes only from server configuration", async () => {
  process.env.CENTRAL_STUDY_USER_ID = " learner-1 ";
  process.env.CENTRAL_STUDY_USER_EMAIL = "learner@example.com";
  await deeplTranslate(new Request("http://127.0.0.1:3201/api/deepl", { method: "POST", headers: { "Content-Type": "application/json", ...FORGED }, body: JSON.stringify({ text: "hi", target: "DE" }) }));
  expect(forwarded[0]?.get(CENTRAL_IDENTITY_HEADERS.id)).toBe("learner-1");
  expect(forwarded[0]?.get(CENTRAL_IDENTITY_HEADERS.email)).toBe("learner@example.com");
  expect(forwarded[0]?.get("Content-Type")).toBe("application/json");
});

test("central service URL falls back to the local tracker and trims configuration", () => {
  expect(centralStudyAppUrl()).toBe("http://127.0.0.1:4312");
  process.env.CENTRAL_STUDY_APP_URL = " https://tracker.example.test ";
  expect(centralStudyAppUrl()).toBe("https://tracker.example.test");
  expectNoIdentity(centralHeaders());
});
