import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const workspaceRoot = join(import.meta.dir, "..");
const legacySourcePath = join(
  workspaceRoot,
  "legacy",
  "v20.8-static",
  "index.html",
);
const outputDirectory = join(
  workspaceRoot,
  "packages",
  "content",
  "src",
  "data",
);

function readJsonLiteral(source: string, assignment: string): unknown {
  const assignmentIndex = source.indexOf(assignment);
  if (assignmentIndex === -1) {
    throw new Error(`Could not find ${assignment} in the legacy source.`);
  }

  let cursor = assignmentIndex + assignment.length;
  while (/\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }

  const openingCharacter = source[cursor];
  if (openingCharacter !== "[" && openingCharacter !== "{") {
    throw new Error(
      `${assignment} does not start with a JSON array or object.`,
    );
  }

  const closingCharacter = openingCharacter === "[" ? "]" : "}";
  const start = cursor;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (; cursor < source.length; cursor += 1) {
    const character = source[cursor];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === openingCharacter) {
      depth += 1;
    } else if (character === closingCharacter) {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(source.slice(start, cursor + 1)) as unknown;
      }
    }
  }

  throw new Error(`Could not find the end of ${assignment}.`);
}

const source = await Bun.file(legacySourcePath).text();
const topics = readJsonLiteral(source, "TOPICS=");
const grammar = readJsonLiteral(source, "GRAMMAR=");

if (!Array.isArray(topics) || !Array.isArray(grammar)) {
  throw new TypeError("The legacy catalogs must both be arrays.");
}

mkdirSync(outputDirectory, { recursive: true });

await Promise.all([
  Bun.write(
    join(outputDirectory, "topics.json"),
    `${JSON.stringify(topics, null, 2)}\n`,
  ),
  Bun.write(
    join(outputDirectory, "grammar.json"),
    `${JSON.stringify(grammar, null, 2)}\n`,
  ),
]);

console.log(
  `Extracted ${topics.length} topics and ${grammar.length} grammar units.`,
);
