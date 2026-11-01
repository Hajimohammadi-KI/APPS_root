import { browserGrammarCatalog } from "../packages/content/src/index";

const outputPath = new URL(
  "../apps/web/public/replacements/de/grammar-catalog.js",
  import.meta.url,
);

await Bun.write(
  outputPath,
  `window.GERMAN_GRAMMAR_UNITS = ${JSON.stringify(browserGrammarCatalog)};\n`,
);

console.log(`Generated ${browserGrammarCatalog.length} German grammar units.`);
