import { expect, test } from "bun:test";
import { GET, POST } from "../app/api/deepl/route";

test("English app proxies translation through the central DeepL provider", async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    calls.push(String(input));
    if (String(input).endsWith("/api/status")) return Response.json({ translation: true });
    return Response.json({ translation: "Guten Tag", provider: "deepl" });
  }) as typeof fetch;
  try {
    expect(await (await GET(new Request("http://127.0.0.1:3201/api/deepl"))).json()).toMatchObject({ connected: true, provider: "deepl" });
    const response = await POST(new Request("http://127.0.0.1:3201/api/deepl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Good morning", target: "DE" }) }));
    expect(await response.json()).toMatchObject({ translation: "Guten Tag", provider: "deepl" });
    expect(calls.some((url) => url.endsWith("/api/translate"))).toBe(true);
  } finally { globalThis.fetch = previousFetch; }
});
