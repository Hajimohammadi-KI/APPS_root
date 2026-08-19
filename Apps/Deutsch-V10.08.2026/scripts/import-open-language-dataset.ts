import {
  importOpenDatasetText,
  importedItemsToJsonLines,
  type DatasetLanguage,
} from "../packages/content/src";

function readArgument(name: string): string | undefined {
  const index = Bun.argv.indexOf(name);
  return index >= 0 ? Bun.argv[index + 1] : undefined;
}

function usage(): never {
  console.error(
    [
      "Usage:",
      "  bun scripts/import-open-language-dataset.ts --dataset <id> --language <en|de> --input <file> --output <jsonl> [--limit <n>]",
      "",
      "Safe local importers:",
      "  common-voice-25  validated.tsv from Common Voice",
      "  tatoeba-cc0      CC0 sentences TSV export from Tatoeba",
      "",
      "The importer never downloads data and deliberately drops Common Voice contributor identifiers and demographic columns.",
    ].join("\n"),
  );
  process.exit(2);
}

const datasetId = readArgument("--dataset");
const languageValue = readArgument("--language");
const inputPath = readArgument("--input");
const outputPath = readArgument("--output");
const limitValue = readArgument("--limit");

if (
  !datasetId ||
  (languageValue !== "en" && languageValue !== "de") ||
  !inputPath ||
  !outputPath ||
  inputPath === outputPath
) {
  usage();
}

const language: DatasetLanguage = languageValue;
const inputFile = Bun.file(inputPath);
if (!(await inputFile.exists())) {
  throw new Error(`Input file does not exist: ${inputPath}`);
}

const limit = limitValue === undefined ? undefined : Number(limitValue);
const items = importOpenDatasetText({
  datasetId,
  language,
  input: await inputFile.text(),
  ...(limit === undefined ? {} : { limit }),
});

await Bun.write(outputPath, importedItemsToJsonLines(items));
console.log(
  `Imported ${items.length} ${language} items from ${datasetId} into ${outputPath}.`,
);
