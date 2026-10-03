import { afterEach, expect, test } from "bun:test";
import { POST as german } from "../../Apps/Deutsch-Automaticity/apps/web/src/app/api/conversation/evaluate/route";
import { POST as english } from "../../Apps/English/English-Automaticity/apps/web/app/api/conversation/evaluate/route";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
for (const [language, post] of [
  ["de", german],
  ["en", english],
] as const) {
  test(`${language}: incomplete provider payloads cannot masquerade as error-free speech`, async () => {
    for (const payload of [
      {},
      { matches: null },
      { matches: [{ offset: 0, length: 2 }] },
      { matches: [{ message: "test", offset: 100, length: 3 }] },
    ]) {
      globalThis.fetch = (async () => Response.json(payload)) as typeof fetch;
      const response = await post(
        new Request("http://localhost/api/conversation/evaluate", {
          method: "POST",
          body: JSON.stringify({ text: "A short sentence.", language }),
        }),
      );
      expect(response.status).toBe(502);
    }
  });
  test(`${language}: a valid empty match array is retained as actual provider evidence`, async () => {
    globalThis.fetch = (async () =>
      Response.json({ matches: [] })) as typeof fetch;
    const response = await post(
      new Request("http://localhost/api/conversation/evaluate", {
        method: "POST",
        body: JSON.stringify({ text: "A short sentence.", language }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).issues).toEqual([]);
  });
}
