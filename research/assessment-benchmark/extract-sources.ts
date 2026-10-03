import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
// bsdtar handles both official zip and tar releases. Validate both member types
// and paths before extraction; dataset scripts are retained but never executed.
const root = resolve(import.meta.dir, "data");
for (const [archive, folder] of [["wi-locness.tar.gz", "english"], ["falko-merlin.tar.gz", "german"], ["llama-vulkan.zip", "runtime"], ["speechocean762.tar.gz", "speech"]]) {
  if (!await Bun.file(resolve(root, archive)).exists()) continue;
  const destination = resolve(root, folder);
  if (await Bun.file(resolve(destination, ".extracted")).exists()) continue;
  const list = Bun.spawn(["tar", "-tf", resolve(root, archive)], { stdout: "pipe", stderr: "pipe" });
  const names = (await new Response(list.stdout).text()).trim().split(/\r?\n/);
  if (await list.exited !== 0 || names.some(name => !name || /(^[\\/]|:|\\|(^|\/)\.\.(\/|$))/.test(name))) throw Error(`Unsafe member: ${archive}`);
  const detail = Bun.spawn(["tar", "-tvf", resolve(root, archive)], { stdout: "pipe", stderr: "pipe" });
  const entries = (await new Response(detail.stdout).text()).trim().split(/\r?\n/);
  if (await detail.exited !== 0 || entries.some(line => !/^[d-]/.test(line))) throw Error(`Non-regular member: ${archive}`);
  await mkdir(destination, { recursive: true });
  const extract = Bun.spawn(["tar", "-xf", resolve(root, archive), "-C", destination], { stdout: "ignore", stderr: "inherit" });
  if (await extract.exited !== 0) throw Error(`Extraction failed: ${archive}`);
  await Bun.write(resolve(destination, ".extracted"), JSON.stringify({ archive, entries: names.length }));
  console.log(JSON.stringify({ archive, entries: names.length }));
}
