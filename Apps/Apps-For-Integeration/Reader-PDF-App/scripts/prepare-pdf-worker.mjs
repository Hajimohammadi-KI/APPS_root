import { copyFile, mkdir, open, readFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(projectRoot, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destination = resolve(projectRoot, "public/pdf.worker.min.mjs");
const lockPath = resolve(projectRoot, "public/.pdf-worker.prepare.lock");

async function isCurrent() {
  try {
    const [sourceBytes, destinationBytes] = await Promise.all([
      readFile(source),
      readFile(destination),
    ]);
    return sourceBytes.equals(destinationBytes);
  } catch {
    return false;
  }
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

await mkdir(dirname(destination), { recursive: true });
if (await isCurrent()) {
  console.log("PDF.js worker is already current at public/pdf.worker.min.mjs");
  process.exit(0);
}

let lock;
for (let attempt = 0; attempt < 100 && !lock; attempt += 1) {
  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (await isCurrent()) {
      console.log("PDF.js worker was prepared by another build process");
      process.exit(0);
    }
    await wait(50);
  }
}

if (!lock) throw new Error("Timed out while waiting to prepare the PDF.js worker");

try {
  if (!(await isCurrent())) await copyFile(source, destination);
  console.log("PDF.js worker prepared at public/pdf.worker.min.mjs");
} finally {
  await lock.close();
  await unlink(lockPath).catch(() => undefined);
}
