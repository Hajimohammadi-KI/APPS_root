import { mkdir, rename } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "data");
await mkdir(root, { recursive: true });
const sources = [
  { id: "wi-locness", name: "wi-locness.tar.gz", url: "https://www.cl.cam.ac.uk/research/nl/bea2019st/data/wi%2Blocness_v2.1.bea19.tar.gz", license: "non-commercial research only", sha256: null },
  { id: "falko-merlin", name: "falko-merlin.tar.gz", url: "https://github.com/adrianeboyd/boyd-wnut2018/releases/download/wnut2018/data.tar.gz", license: "Falko CC-BY-3.0; MERLIN CC-BY-SA-4.0; bundled Wikipedia CC-BY-SA-3.0", sha256: null },
  { id: "speechocean762", name: "speechocean762.tar.gz", url: "https://openslr.trmal.net/resources/101/speechocean762.tar.gz", license: "CC-BY-4.0", sha256: null },
  { id: "llama-runtime", name: "llama-vulkan.zip", url: "https://github.com/ggml-org/llama.cpp/releases/download/b11146/llama-b11146-bin-win-vulkan-x64.zip", license: "MIT", sha256: "55a378aa095b466979d85075234f66d7655c7a7483222af0c006c0e55b4d7bd6" },
  { id: "qwen3-4b", name: "Qwen3-4B-Q4_K_M.gguf", url: "https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/bc640142c66e1fdd12af0bd68f40445458f3869b/Qwen3-4B-Q4_K_M.gguf", license: "Apache-2.0", sha256: "7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5" },
];
const results = await Promise.allSettled(sources.map(async source => {
  const path = resolve(root, source.name);
  if (!(await Bun.file(path).exists())) {
    const transfer = Bun.spawn(["curl.exe", "--fail", "--location", "--silent", "--show-error", "--connect-timeout", "30", "--max-time", "1200", "--output", path + ".partial", source.url], { stdout: "ignore", stderr: "inherit" });
    if (await transfer.exited !== 0) throw Error(`${source.id}: download failed`);
    await rename(path + ".partial", path);
  }
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  const sha256 = digest.digest("hex");
  if (source.sha256 && sha256 !== source.sha256) throw Error(`${source.id}: hash mismatch`);
  const receipt = { ...source, sha256, publisherHashVerified: !!source.sha256, bytes: Bun.file(path).size, retrievedAt: new Date().toISOString() };
  await Bun.write(resolve(root, source.id + ".receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ id: source.id, bytes: receipt.bytes, sha256 }));
}));
for (const row of results) if (row.status === "rejected") { console.error(String(row.reason)); process.exitCode = 1; }
