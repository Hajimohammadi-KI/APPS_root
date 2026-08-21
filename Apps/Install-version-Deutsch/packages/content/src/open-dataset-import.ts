import {
  getOpenLanguageDataset,
  type DatasetLanguage,
  type FourLanguageSkill,
  type LocalDatasetImporter,
} from "./open-language-datasets";

export interface ImportedOpenDatasetItem {
  readonly datasetId: string;
  readonly sourceId: string;
  readonly language: DatasetLanguage;
  readonly skills: readonly FourLanguageSkill[];
  readonly text: string;
  readonly audioPath?: string;
  readonly sourceUpdatedAt?: string;
  readonly licenseSpdx: string;
  readonly officialUrl: string;
}

export interface ImportOpenDatasetOptions {
  readonly datasetId: string;
  readonly language: DatasetLanguage;
  readonly input: string;
  readonly limit?: number;
}

const TATOEBA_LANGUAGE_CODES: Readonly<Record<DatasetLanguage, string>> = {
  en: "eng",
  de: "deu",
};

function normalizedLimit(value: number | undefined): number {
  if (value === undefined) return 5_000;
  if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) {
    throw new Error("Import limit must be an integer from 1 to 100000.");
  }
  return value;
}

function normalizedText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function safeRelativeAudioPath(value: string): string {
  const path = value.trim().replace(/\\/gu, "/");
  if (
    !path ||
    path.startsWith("/") ||
    /^[A-Za-z]:\//u.test(path) ||
    path.split("/").includes("..")
  ) {
    throw new Error(`Unsafe Common Voice audio path: ${value}`);
  }
  return path;
}

function nonEmptyLines(input: string): readonly string[] {
  return input
    .replace(/^\uFEFF/u, "")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0);
}

function importTatoebaCc0(
  options: ImportOpenDatasetOptions,
): readonly ImportedOpenDatasetItem[] {
  const dataset = getOpenLanguageDataset(options.datasetId);
  const expectedLanguage = TATOEBA_LANGUAGE_CODES[options.language];
  const items: ImportedOpenDatasetItem[] = [];
  const seen = new Set<string>();
  const limit = normalizedLimit(options.limit);

  for (const line of nonEmptyLines(options.input)) {
    const [sourceId, language, rawText, sourceUpdatedAt] = line.split("\t");
    if (!sourceId || language !== expectedLanguage || !rawText) continue;
    if (seen.has(sourceId)) continue;
    const text = normalizedText(rawText);
    if (!text) continue;
    seen.add(sourceId);
    items.push({
      datasetId: dataset.id,
      sourceId,
      language: options.language,
      skills: ["reading", "writing"],
      text,
      ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}),
      licenseSpdx: dataset.license.spdx,
      officialUrl: dataset.officialUrl,
    });
    if (items.length >= limit) break;
  }

  return items;
}

function importCommonVoice(
  options: ImportOpenDatasetOptions,
): readonly ImportedOpenDatasetItem[] {
  const dataset = getOpenLanguageDataset(options.datasetId);
  const lines = nonEmptyLines(options.input);
  const header = lines[0]?.split("\t").map((value) => value.trim()) ?? [];
  const pathIndex = header.indexOf("path");
  const sentenceIndex = header.indexOf("sentence");
  const localeIndex = header.indexOf("locale");
  if (pathIndex < 0 || sentenceIndex < 0) {
    throw new Error("Common Voice TSV must include path and sentence columns.");
  }

  const items: ImportedOpenDatasetItem[] = [];
  const seen = new Set<string>();
  const limit = normalizedLimit(options.limit);
  for (const line of lines.slice(1)) {
    const columns = line.split("\t");
    const locale = localeIndex >= 0 ? columns[localeIndex]?.trim() : undefined;
    if (locale && locale !== options.language) continue;
    const rawPath = columns[pathIndex];
    const rawSentence = columns[sentenceIndex];
    if (!rawPath || !rawSentence) continue;
    const audioPath = safeRelativeAudioPath(rawPath);
    if (seen.has(audioPath)) continue;
    const text = normalizedText(rawSentence);
    if (!text) continue;
    seen.add(audioPath);
    items.push({
      datasetId: dataset.id,
      sourceId: audioPath,
      language: options.language,
      skills: ["listening", "speaking"],
      text,
      audioPath,
      licenseSpdx: dataset.license.spdx,
      officialUrl: dataset.officialUrl,
    });
    if (items.length >= limit) break;
  }

  return items;
}

const IMPORTERS: Readonly<
  Record<
    LocalDatasetImporter,
    (options: ImportOpenDatasetOptions) => readonly ImportedOpenDatasetItem[]
  >
> = {
  "common-voice-tsv": importCommonVoice,
  "tatoeba-cc0-tsv": importTatoebaCc0,
};

export function importOpenDatasetText(
  options: ImportOpenDatasetOptions,
): readonly ImportedOpenDatasetItem[] {
  const dataset = getOpenLanguageDataset(options.datasetId);
  if (!dataset.languages.includes(options.language)) {
    throw new Error(
      `${dataset.id} does not declare ${options.language} coverage.`,
    );
  }
  if (!dataset.localImporter) {
    throw new Error(
      `${dataset.id} has no safe local importer. Keep it metadata-only.`,
    );
  }
  return IMPORTERS[dataset.localImporter](options);
}

export function importedItemsToJsonLines(
  items: readonly ImportedOpenDatasetItem[],
): string {
  return (
    items.map((item) => JSON.stringify(item)).join("\n") +
    (items.length > 0 ? "\n" : "")
  );
}
