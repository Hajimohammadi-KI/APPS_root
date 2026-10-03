import { readFile, appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { isRecord } from "../shared/learning-core/src/automaticity/contracts";
import {
  assertTransformerConfig,
  proposeTransformerFeedback,
  transformerConfigurationSha256,
  type TransformerConfig,
} from "../shared/learning-core/src/automaticity/transformer";
const root = resolve(import.meta.dir, ".."),
  config = JSON.parse(
    await readFile(
      resolve(root, "docs/model-evaluation/transformer-candidate.json"),
      "utf8",
    ),
  ) as TransformerConfig;
assertTransformerConfig(config);
const configurationSha256 = await transformerConfigurationSha256(config),
  folder = resolve(root, "artifacts/transformer-local");
await mkdir(folder, { recursive: true });
let busy = false;
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 8082,
  maxRequestBodySize: 20000,
  idleTimeout: 30,
  async fetch(request) {
    const url = new URL(request.url),
      headers = { "Cache-Control": "no-store" };
    if (request.headers.get("origin"))
      return new Response(
        "This diagnostic service accepts server-side requests only.",
        { status: 403, headers },
      );
    if (request.method === "GET" && url.pathname === "/health")
      return Response.json(
        {
          candidate: config.candidateId,
          version: config.version,
          configurationSha256,
          qualified: false,
        },
        { headers },
      );
    if (request.method !== "POST" || url.pathname !== "/assess")
      return new Response("Not found", { status: 404, headers });
    if (busy) return new Response("Candidate busy", { status: 429, headers });
    busy = true;
    const started = performance.now();
    try {
      const value: unknown = await request.json();
      if (
        !isRecord(value) ||
        value.model !== config.version ||
        !["en", "de"].includes(String(value.language)) ||
        value.modality !== "writing" ||
        typeof value.prompt !== "string" ||
        typeof value.response !== "string" ||
        typeof value.constructionId !== "string" ||
        Object.keys(value).some(
          (key) =>
            ![
              "model",
              "language",
              "modality",
              "prompt",
              "response",
              "constructionId",
            ].includes(key),
        )
      )
        return new Response("Invalid or mismatched candidate request", {
          status: 400,
          headers,
        });
      const result = await proposeTransformerFeedback(
        {
          language: value.language as "en" | "de",
          modality: "writing",
          constructionId: value.constructionId,
          prompt: value.prompt,
          response: value.response,
        },
        config,
      );
      await appendFile(
        resolve(folder, "adapter-requests.jsonl"),
        JSON.stringify({
          at: new Date().toISOString(),
          language: value.language,
          constructionId: value.constructionId,
          verdict: result.verdict,
          latencyMs: performance.now() - started,
        }) + "\n",
      );
      return Response.json(
        { version: config.version, configurationSha256, ...result },
        { headers },
      );
    } catch (error) {
      await appendFile(
        resolve(folder, "adapter-requests.jsonl"),
        JSON.stringify({
          at: new Date().toISOString(),
          error: String(error),
          latencyMs: performance.now() - started,
        }) + "\n",
      );
      return Response.json(
        {
          version: config.version,
          configurationSha256,
          verdict: "not_assessed",
          grammar: "unknown",
          targetObserved: null,
          meaningPreserved: null,
          feedback: "The local candidate could not provide a valid assessment.",
          minimalCorrection: null,
          styleRewrite: null,
          spans: [],
          unavailable: true,
        },
        { headers },
      );
    } finally {
      busy = false;
    }
  },
});
console.log(
  JSON.stringify({
    url: server.url.href,
    candidate: config.version,
    configurationSha256,
    qualified: false,
  }),
);
