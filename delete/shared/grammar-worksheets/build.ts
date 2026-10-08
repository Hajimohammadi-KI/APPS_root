import { resolve } from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { buildWorksheet, type WorksheetSeed } from "./seed-builder";
import type { GrammarWorksheet } from "./model";

export function catalogWorksheets(
  units: readonly { title: string; level: string }[],
  seeds: readonly WorksheetSeed[],
  language: "en" | "de",
  specialist: readonly GrammarWorksheet[] = [],
): GrammarWorksheet[] {
  const result = units.map((unit) => {
    const fixed = specialist.find(
      (w) => w.topic === unit.title && w.level === unit.level,
    );
    if (fixed) return fixed;
    const candidates = seeds.filter(
      (s) => s.topic === unit.title && (!s.level || s.level === unit.level),
    );
    if (candidates.length !== 1)
      throw new Error(
        `${language}: expected one worksheet seed for ${unit.level} / ${unit.title}, found ${candidates.length}`,
      );
    return buildWorksheet({ ...candidates[0]!, level: unit.level }, language);
  });
  if (new Set(result.map((w) => w.id)).size !== result.length)
    throw new Error("Worksheet IDs must be unique.");
  // Never silently fall back to a title-based or unrelated generic grammar exercise.
  const unknown = seeds.filter((s) => !units.some((u) => u.title === s.topic));
  if (unknown.length)
    throw new Error(
      `Unknown worksheet topics: ${unknown.map((s) => s.topic).join(", ")}`,
    );
  return result;
}

export async function emitSharedAssets(out: string): Promise<void> {
  for (const [source, destination] of [
    ["runtime.js", "grammar-worksheet-runtime.js"],
    ["ink.js", "grammar-worksheet-ink.js"],
    ["worksheets.css", "grammar-worksheets.css"],
  ]) {
    await copyFile(
      resolve(import.meta.dir, source!),
      resolve(out, destination!),
    );
  }
  // SVGs are exports of the installed Lucide icon library, shared by both apps.
  await mkdir(resolve(out, "worksheet-icons"), { recursive: true });
  await copyFile(resolve(import.meta.dir, "worksheet-icons/LICENSE"), resolve(out, "worksheet-icons/LICENSE"));
  for (const name of [
    "book",
    "repeat",
    "timer",
    "pencil",
    "search",
    "clipboard",
    "calendar",
    "arrow",
    "printer",
  ]) {
    await copyFile(
      resolve(import.meta.dir, `worksheet-icons/${name}.svg`),
      resolve(out, `worksheet-icons/${name}.svg`),
    );
  }
}
