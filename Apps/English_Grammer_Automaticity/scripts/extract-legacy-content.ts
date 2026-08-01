import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const generatedDir = resolve(root, "packages/content/src/generated");

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Missing marker: ${start}`);
  const valueStart = startIndex + start.length;
  const endIndex = source.indexOf(end, valueStart);
  if (endIndex < 0) throw new Error(`Missing marker: ${end}`);
  return source.slice(valueStart, endIndex);
}

function evaluateLiteral<T>(literal: string): T {
  // The input is the repository's own immutable catalog, not user input.
  return Function(`"use strict"; return (${literal});`)() as T;
}

async function writeGenerated(
  filename: string,
  typeName: string,
  exportName: string,
  value: unknown,
) {
  const file = resolve(generatedDir, filename);
  const body = [
    "/* Generated verbatim from the v27 legacy PWA. Do not edit by hand. */",
    `import type { ${typeName} } from "../types";`,
    "",
    `export const ${exportName}: ${typeName}[] = ${JSON.stringify(value, null, 2)};`,
    "",
  ].join("\n");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body, "utf8");
}

const [indexHtml, resourcesJs] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "resources.js"), "utf8"),
]);

const topics = evaluateLiteral<unknown[]>(
  sliceBetween(indexHtml, 'TOPICS=', ', GRAMMAR='),
);
const grammar = evaluateLiteral<unknown[]>(
  sliceBetween(indexHtml, 'GRAMMAR=', ', T='),
);
const resources = evaluateLiteral<unknown[]>(
  sliceBetween(resourcesJs, "const ONLINE_RESOURCE_GROUPS = ", ";\n\nfunction"),
);
await Promise.all([
  writeGenerated("topics.ts", "ConversationTopic", "conversationTopics", topics),
  writeGenerated("grammar.ts", "GrammarUnit", "grammarUnits", grammar),
  writeGenerated("resources.ts", "OnlineResource", "onlineResources", resources),
]);

console.log(
  `Extracted ${topics.length} topics, ${grammar.length} grammar units, ` +
    `and ${resources.length} resources.`,
);
