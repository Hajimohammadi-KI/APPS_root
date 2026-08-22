import { resolve } from "node:path";

import { grammarUnits } from "../packages/content/src/index";

const root = resolve(import.meta.dir, "..");
const outputPath = resolve(
  root,
  "apps/web/public/replacements/en/grammar-curriculum.js",
);
const checkOnly = process.argv.includes("--check");

const serialized = [
  "/* Generated from @grammar/content. Run `bun run content:sync`; do not edit by hand. */",
  `window.__ENGLISH_GRAMMAR_UNITS__ = ${JSON.stringify(grammarUnits, null, 2)};`,
  "",
].join("\n");

const identities = grammarUnits.map((unit) => `${unit.level}::${unit.title}`);
if (new Set(identities).size !== identities.length) {
  throw new Error("Grammar catalog contains duplicate level/title identities.");
}

if (checkOnly) {
  // Git may check the generated browser artifact out as CRLF on Windows while
  // CI uses LF. Compare normalized text so the gate detects content drift, not
  // an operating-system line-ending conversion.
  const current = (await Bun.file(outputPath).text()).replaceAll("\r\n", "\n");
  if (current !== serialized) {
    throw new Error(
      "Grammar replacement catalog is stale. Run `bun run content:sync` and commit the result.",
    );
  }
  console.log(`Grammar replacement parity verified: ${grammarUnits.length} units.`);
} else {
  await Bun.write(outputPath, serialized);
  console.log(`Generated ${grammarUnits.length} grammar units at ${outputPath}.`);
}
