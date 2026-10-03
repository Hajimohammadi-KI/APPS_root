import { createReadStream } from "node:fs";
import { rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const candidates = {
"qwen3-14b": {
  id: "qwen3-14b-q5", name: "Qwen3-14B-Q5_K_M.gguf", license: "Apache-2.0",
  repository: "Qwen/Qwen3-14B-GGUF", baseModel: "Qwen/Qwen3-14B",
  revision: "530227a7d994db8eca5ab5ced2fb692b614357fd",
  sha256: "e7c9aba1129ca2936be9eca01419d9f86af40e08caa01230d5574b34d08e3e31",
  bytes: 10514569568,
},
"qwen35-9b": {
  id: "qwen35-9b-q5", name: "Qwen3.5-9B-Q5_K_M.gguf", license: "Apache-2.0",
  repository: "unsloth/Qwen3.5-9B-GGUF", baseModel: "Qwen/Qwen3.5-9B",
  revision: "3885219b6810b007914f3a7950a8d1b469d598a5",
  sha256: "dc2a39aef291f91a9116ad214058da0d86eb648743a124bd8c333787c4b9c91c",
  bytes: 6577841376,
},
};
const id = Bun.argv[2] ?? "qwen3-14b";
if (!(id in candidates)) throw Error("Unknown pinned candidate");
const candidate = candidates[id as keyof typeof candidates];
const url = `https://huggingface.co/${candidate.repository}/resolve/${candidate.revision}/${candidate.name}`;
const path = resolve(import.meta.dir, "data", candidate.name);
const exists = await Bun.file(path).exists(), downloadPath = exists ? path : path + ".partial";
if (!exists) {
  const transfer = Bun.spawn(["curl.exe", "--fail", "--location", "--silent", "--show-error", "--retry", "2", "--connect-timeout", "30", "--max-time", "1800", "--output", path + ".partial", url], { stdout: "ignore", stderr: "inherit" });
  if (await transfer.exited !== 0) throw Error("Candidate download failed");
}
const digest = createHash("sha256");
for await (const chunk of createReadStream(downloadPath)) digest.update(chunk);
if (digest.digest("hex") !== candidate.sha256 || Bun.file(downloadPath).size !== candidate.bytes) throw Error("Candidate artifact mismatch");
if (!exists) await rename(downloadPath, path);
await Bun.write(resolve(import.meta.dir, `data/${id}.receipt.json`), JSON.stringify({ ...candidate, url, publisherHashVerified: true, retrievedAt: new Date().toISOString() }, null, 2) + "\n");
console.log(JSON.stringify({ id: candidate.id, bytes: candidate.bytes, verified: true }));
