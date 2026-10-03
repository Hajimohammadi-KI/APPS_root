import { resolve } from "node:path";
import { hash } from "./core";

export async function attestLocalLaunch() {
  const query = "$pidsForModel = @(Get-NetTCPConnection -LocalPort 8769 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique); if ($pidsForModel.Count -ne 1) { throw 'Unexpected listeners' }; Get-CimInstance Win32_Process -Filter ('ProcessId=' + $pidsForModel[0]) | Select-Object ProcessId,ExecutablePath,CommandLine,CreationDate | ConvertTo-Json -Compress";
  const process = Bun.spawn(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", query], { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(process.stdout).text();
  if (await process.exited !== 0) throw Error("Unable to attest local model launch");
  const row = JSON.parse(stdout) as { ProcessId: number; ExecutablePath: string; CommandLine: string; CreationDate: string };
  const executable = resolve(import.meta.dir, "data/runtime/llama-server.exe"), args = row.CommandLine;
  if (row.ExecutablePath.toLowerCase() !== executable.toLowerCase() || !/--ctx-size\s+16384\b/.test(args) || !/--parallel\s+4\b/.test(args) || !/--reasoning-budget\s+768\b/.test(args) || !/--host\s+127\.0\.0\.1\b/.test(args) || !/--reasoning-format\s+deepseek\b/.test(args) || /--api-key\s/.test(args)) throw Error("Unexpected local server launch settings");
  return { pid: row.ProcessId, createdAt: row.CreationDate, executableSha256: hash(new Uint8Array(await Bun.file(executable).arrayBuffer())), argumentsSha256: hash(args), contextPerSlot: 4096, reasoningBudget: 768 };
}
