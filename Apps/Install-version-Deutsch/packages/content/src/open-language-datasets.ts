export const DATASET_LANGUAGES = ["en", "de"] as const;
export type DatasetLanguage = (typeof DATASET_LANGUAGES)[number];

export const FOUR_LANGUAGE_SKILLS = [
  "listening",
  "speaking",
  "reading",
  "writing",
] as const;
export type FourLanguageSkill = (typeof FOUR_LANGUAGE_SKILLS)[number];

export type LocalDatasetImporter = "common-voice-tsv" | "tatoeba-cc0-tsv";

export interface OpenDatasetLicense {
  readonly spdx: string;
  readonly scope: string;
  readonly attributionRequired: boolean;
  readonly shareAlike: boolean;
}

export interface OpenLanguageDataset {
  readonly id: string;
  readonly title: string;
  readonly languages: readonly DatasetLanguage[];
  readonly skills: readonly FourLanguageSkill[];
  readonly officialUrl: string;
  readonly license: OpenDatasetLicense;
  readonly verifiedOn: string;
  readonly release: string;
  readonly sizeByLanguage?: Readonly<Partial<Record<DatasetLanguage, string>>>;
  readonly suitableUse: string;
  readonly limitations: string;
  readonly localImporter: LocalDatasetImporter | null;
  readonly distributionPolicy: "metadata-only";
}

export interface OpenDatasetSkillPlan {
  readonly language: DatasetLanguage;
  readonly skill: FourLanguageSkill;
  readonly method: string;
  readonly neuralRole: string;
  readonly evidenceRule: string;
  readonly caveat: string;
  readonly datasets: readonly OpenLanguageDataset[];
}

type OpenDatasetSkillPlanRow = Omit<
  OpenDatasetSkillPlan,
  "language" | "datasets"
> & {
  readonly datasetIds: readonly string[];
};

export const OPEN_LANGUAGE_DATASETS = [
  {
    id: "common-voice-25",
    title: "Mozilla Common Voice Scripted Speech 25.0",
    languages: ["en", "de"],
    skills: ["listening", "speaking"],
    officialUrl: "https://commonvoice.mozilla.org/en/datasets",
    license: {
      spdx: "CC0-1.0",
      scope: "Audio and released dataset metadata",
      attributionRequired: false,
      shareAlike: false,
    },
    verifiedOn: "2026-08-19",
    release: "Scripted Speech 25.0",
    sizeByLanguage: {
      en: "87.84 GB",
      de: "34.69 GB",
    },
    suitableUse:
      "Multilingual ASR evaluation or fine-tuning and diverse read-speech listening material after editorial review.",
    limitations:
      "Read speech is not a learner-pronunciation benchmark and cannot by itself justify a pronunciation score.",
    localImporter: "common-voice-tsv",
    distributionPolicy: "metadata-only",
  },
  {
    id: "mls-94",
    title: "Multilingual LibriSpeech (OpenSLR 94)",
    languages: ["en", "de"],
    skills: ["listening", "speaking"],
    officialUrl: "https://www.openslr.org/94/",
    license: {
      spdx: "CC-BY-4.0",
      scope: "MLS dataset release",
      attributionRequired: true,
      shareAlike: false,
    },
    verifiedOn: "2026-08-19",
    release: "Single maintained MLS release",
    sizeByLanguage: {
      en: "651 GB compressed Opus",
      de: "29 GB compressed Opus",
    },
    suitableUse:
      "Large-scale multilingual ASR baselines and read-aloud alignment experiments, including limited-supervision subsets.",
    limitations:
      "Audiobook speech is read, not spontaneous learner speech; the full corpus is too large for an application installer.",
    localImporter: null,
    distributionPolicy: "metadata-only",
  },
  {
    id: "tatoeba-cc0",
    title: "Tatoeba CC0 sentence subset",
    languages: ["en", "de"],
    skills: ["reading", "writing"],
    officialUrl: "https://tatoeba.org/en/downloads",
    license: {
      spdx: "CC0-1.0",
      scope:
        "Only the separately published CC0 sentence export; audio is excluded unless its own license explicitly permits reuse",
      attributionRequired: false,
      shareAlike: false,
    },
    verifiedOn: "2026-08-19",
    release: "Weekly export",
    suitableUse:
      "Short-sentence retrieval, bilingual contrast, controlled reading, and learner-authored transformation prompts.",
    limitations:
      "Sentence quality and difficulty vary; use the CC0 export only and keep audio out unless its per-file license is verified.",
    localImporter: "tatoeba-cc0-tsv",
    distributionPolicy: "metadata-only",
  },
  {
    id: "c4-200m-gec",
    title: "C4 200M synthetic grammatical-error-correction data",
    languages: ["en", "de"],
    skills: ["writing"],
    officialUrl:
      "https://github.com/google-research-datasets/C4_200M-synthetic-dataset-for-grammatical-error-correction",
    license: {
      spdx: "CC-BY-4.0",
      scope: "Released corruption edits and dataset repository",
      attributionRequired: true,
      shareAlike: false,
    },
    verifiedOn: "2026-08-19",
    release: "English BEA 2021 and multilingual BEA 2024 release",
    suitableUse:
      "Offline neural GEC pre-training or evaluation before human-reviewed learner feedback.",
    limitations:
      "Synthetic errors are not authentic learner errors and must never be treated as gold-standard feedback or CEFR evidence.",
    localImporter: null,
    distributionPolicy: "metadata-only",
  },
  {
    id: "merlin-german",
    title: "MERLIN German written learner corpus",
    languages: ["de"],
    skills: ["writing"],
    officialUrl: "https://www.merlin-platform.eu/C_data.php",
    license: {
      spdx: "CC-BY-SA-4.0",
      scope: "Released learner texts, metadata, ratings, and annotations",
      attributionRequired: true,
      shareAlike: true,
    },
    verifiedOn: "2026-08-19",
    release: "MERLIN corpus download",
    suitableUse:
      "German learner-error retrieval, CEFR-aware writing analysis, and evaluation of repair suggestions.",
    limitations:
      "Learner texts are evidence for research and model evaluation, not templates that should be copied into learner answers.",
    localImporter: null,
    distributionPolicy: "metadata-only",
  },
  {
    id: "ud-english-ewt",
    title: "Universal Dependencies English EWT 2.18",
    languages: ["en"],
    skills: ["reading", "writing"],
    officialUrl: "https://github.com/UniversalDependencies/UD_English-EWT",
    license: {
      spdx: "CC-BY-SA-4.0",
      scope:
        "Annotations and database rights; underlying web texts have mixed rights documented by the project",
      attributionRequired: true,
      shareAlike: true,
    },
    verifiedOn: "2026-08-19",
    release: "UD 2.18 (2026-05-15)",
    suitableUse:
      "Syntax-aware retrieval, transparent sentence analysis, and grammar-feature evaluation.",
    limitations:
      "Do not redistribute underlying texts as app content without a separate rights review.",
    localImporter: null,
    distributionPolicy: "metadata-only",
  },
  {
    id: "ud-german-gsd",
    title: "Universal Dependencies German GSD",
    languages: ["de"],
    skills: ["reading", "writing"],
    officialUrl: "https://github.com/UniversalDependencies/UD_German-GSD",
    license: {
      spdx: "CC-BY-SA-4.0",
      scope:
        "Annotations; the project documents separate caveats for portions of the underlying text",
      attributionRequired: true,
      shareAlike: true,
    },
    verifiedOn: "2026-08-19",
    release: "Current UD German GSD release",
    suitableUse:
      "German morphology and dependency-aware retrieval, especially case, gender, number, and word-order features.",
    limitations:
      "Use annotations for analysis; do not assume every underlying sentence is freely redistributable.",
    localImporter: null,
    distributionPolicy: "metadata-only",
  },
] as const satisfies readonly OpenLanguageDataset[];

export function getOpenLanguageDataset(id: string): OpenLanguageDataset {
  const dataset = OPEN_LANGUAGE_DATASETS.find(
    (candidate) => candidate.id === id,
  );
  if (!dataset) throw new Error(`Unknown open language dataset: ${id}`);
  return dataset;
}

export function getOpenDatasetSkillPlans(
  language: DatasetLanguage,
): readonly OpenDatasetSkillPlan[] {
  const syntaxDataset = language === "en" ? "ud-english-ewt" : "ud-german-gsd";
  const writingDatasets =
    language === "en"
      ? ["tatoeba-cc0", "c4-200m-gec", syntaxDataset]
      : ["tatoeba-cc0", "c4-200m-gec", "merlin-german", syntaxDataset];

  const rows: readonly OpenDatasetSkillPlanRow[] = [
    {
      skill: "listening",
      method: "Neural multilingual ASR plus retrieval-based comprehension",
      neuralRole:
        "ASR may create a transcript and timestamps; comprehension still needs explicit meaning and recall tasks.",
      evidenceRule:
        "Store the source, transcript, learner recall, and delayed comprehension separately.",
      caveat:
        "A correct transcript is not proof that the learner understood the audio.",
      datasetIds: ["common-voice-25", "mls-94"],
    },
    {
      skill: "speaking",
      method: "Neural ASR plus forced alignment and auditable fluency features",
      neuralRole:
        "ASR supports transcript alignment; duration, pauses, target form, replay, and new-context transfer remain explicit evidence.",
      evidenceRule:
        "Require a real audio blob, transcript, replay, repair, and delayed transfer before mastery.",
      caveat:
        "Common Voice and MLS cannot by themselves produce a valid learner-pronunciation score.",
      datasetIds: ["common-voice-25", "mls-94"],
    },
    {
      skill: "reading",
      method: "Syntax-aware retrieval with transparent CEFR heuristics",
      neuralRole:
        "A small embedding model may improve retrieval, but sentence length, syntax, vocabulary, and teacher review stay visible.",
      evidenceRule:
        "Measure meaning, evidence selection, explanation, and delayed recall rather than page completion.",
      caveat:
        "Corpus frequency is not a CEFR label; selected material requires editorial review.",
      datasetIds: ["tatoeba-cc0", syntaxDataset],
    },
    {
      skill: "writing",
      method: "Neural GEC suggestions plus learner-corpus retrieval and repair",
      neuralRole:
        "A correction model may propose edits, while the learner must compare, explain, repair, and transfer the form.",
      evidenceRule:
        "Keep original text, provider result, accepted repair, independent rewrite, and delayed transfer as separate records.",
      caveat:
        "Synthetic GEC data must not silently overwrite learner writing or count as verified mastery.",
      datasetIds: writingDatasets,
    },
  ];

  return rows.map(({ datasetIds, ...row }) => ({
    ...row,
    language,
    datasets: datasetIds.map(getOpenLanguageDataset),
  }));
}

export function validateOpenDatasetCatalog(): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const dataset of OPEN_LANGUAGE_DATASETS) {
    if (ids.has(dataset.id)) errors.push(`Duplicate dataset id: ${dataset.id}`);
    ids.add(dataset.id);
    if (!dataset.officialUrl.startsWith("https://")) {
      errors.push(`${dataset.id} does not use an HTTPS official URL`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataset.verifiedOn)) {
      errors.push(`${dataset.id} has an invalid verifiedOn date`);
    }
    if (dataset.distributionPolicy !== "metadata-only") {
      errors.push(`${dataset.id} must not be bundled automatically`);
    }
    if (!dataset.license.spdx.trim()) {
      errors.push(`${dataset.id} is missing a license identifier`);
    }
  }

  for (const language of DATASET_LANGUAGES) {
    const plans = getOpenDatasetSkillPlans(language);
    for (const skill of FOUR_LANGUAGE_SKILLS) {
      const plan = plans.find((candidate) => candidate.skill === skill);
      if (!plan || plan.datasets.length < 2) {
        errors.push(`${language}/${skill} needs at least two reviewed sources`);
      }
    }
  }

  return errors;
}
