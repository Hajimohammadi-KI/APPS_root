export type SourceDefinition = {
  id: string;
  label: string;
  href?: string;
  driveName?: string;
  priority: "core" | "important" | "support" | "optional" | "course";
};

export type DaySpec = {
  title: string;
  sourceIds: string[];
  recording?: string;
  why: string;
  lookFor: [string, string, string];
  proposal: string[];
  module: string;
  deliverable: string;
  kind?: "course" | "project" | "evaluation" | "writing" | "buffer";
};

export type PlannedDay = DaySpec & {
  id: string;
  date: string;
  week: number;
  phase: string;
  phaseId: string;
  weekTitle: string;
  taskMinutes: [number, number, number];
  tasks: Array<{
    id: string;
    title: string;
    minutes: number;
    items: Array<{ id: string; label: string }>;
  }>;
};

export type PlanWeek = {
  number: number;
  phase: string;
  phaseId: string;
  title: string;
  goal: string;
  days: PlannedDay[];
};

export type NlpCourseSession = {
  number: number;
  date: string;
  berlinTime: "17:30–19:10";
  iranTime: "19:00–20:40";
  title: string;
  topics: string[];
  projectQuestion: string;
  useCase: string;
  sourceIds: string[];
  softwareEngineering: string[];
  deliverables: string[];
  definitionOfDone: string;
};

export const defaultSettings = {
  projectName: "Cross_Repository_Code_Intelligence",
  planName: "Cross Repository Code Intelligence – 25-Wochen-Lernplan",
  planStartDate: "2026-08-07",
  planEndDate: "2027-02-13",
  planStatus: "not_started" as "not_started" | "running" | "paused",
  planPausedAt: "",
  dailyWorkMode: "light" as "rescue" | "light" | "full",
  dailyStart: "09:00",
  driveFolderUrl:
    "https://drive.google.com/drive/folders/1rJmYt-fJrv06HjRntIGJtczYB7yy1GAW",
  githubUrl: "https://github.com/Hajimohammadi-KI/APPS",
  notionUrl:
    "https://app.notion.com/p/c79224871bee405d91ac38fbb85a6716",
  pdfReaderUrl: "/pdf-reader",
  settingsAppUrl: "/settings",
  sourceOverrides: {} as Record<string, string>,
};

export const sources: Record<string, SourceDefinition> = {
  proposal: {
    id: "proposal",
    label: "Cross_Repository_Code_Intelligence Lern-Exposé v2.4",
    href:
      "/pdf-reader?document=expose&name=Cross_Repository_Code_Intelligence%20%E2%80%93%20Expos%C3%A9",
    driveName:
      "Cross_Repository_Code_Intelligence_Lern_Expose_DE_2026_v2_4.pdf",
    priority: "core",
  },
  c4: {
    id: "c4",
    label: "C4 Model: Context-, Container- und Component-Diagramme",
    href: "https://c4model.com/diagrams",
    priority: "support",
  },
  arc42: {
    id: "arc42",
    label: "arc42: Vorlage zur Softwarearchitektur-Dokumentation",
    href: "https://arc42.org/overview/",
    priority: "support",
  },
  adr: {
    id: "adr",
    label: "Microsoft Learn: Architecture Decision Records",
    href: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record",
    priority: "support",
  },
  danphe: {
    id: "danphe",
    label: "Danphe EMR: eingefrorener Commit 0b5d6b8",
    href: "https://github.com/hospital-management-system-emr/hospital-management-system-emr-opensource",
    priority: "core",
  },
  hevner: {
    id: "hevner",
    label: "Hevner et al. 2004: Design Science in IS Research",
    href: "https://drive.google.com/file/d/1HSYD3dBut18RlbXnO_ufdlT8lHXkg0am/view",
    driveName:
      "01_★★★★★_CORE_R01_Hevner_2004_Design_Science_in_Information_Systems.pdf",
    priority: "core",
  },
  nagy: {
    id: "nagy",
    label: "Nagy et al. 2015: Where Was This SQL Query Executed?",
    href: "https://drive.google.com/file/d/1wCjThO0mfOJXrYpWZUUgJEX5ohs0wDOc/view",
    driveName:
      "04_★★★★★_CORE_R06_Nagy_2015_Where_Was_This_SQL_Query_Executed.pdf",
    priority: "core",
  },
  shatnawi: {
    id: "shatnawi",
    label: "Shatnawi et al. 2019: Static Analysis of Multilanguage Systems",
    href: "https://drive.google.com/file/d/14rdyqlM40QBIXIb0KtrvKBFAMTQ6KYRO/view",
    driveName:
      "05_★★★★★_CORE_R04_Shatnawi_2019_Static_Analysis_of_Multilanguage_Systems.pdf",
    priority: "core",
  },
  yamaguchi: {
    id: "yamaguchi",
    label: "Yamaguchi et al. 2014: Code Property Graphs",
    href: "https://drive.google.com/file/d/1SGWMjZA8Im9fXsuZxr6KnKdgijDH4o8r/view",
    driveName: "07_★★★★★_CORE_R02_Yamaguchi_2014_Code_Property_Graphs.pdf",
    priority: "core",
  },
  logiclens: {
    id: "logiclens",
    label: "Usai et al. 2026: LogicLens",
    href: "https://drive.google.com/file/d/1_yzTxjxahfnOH-Q_ZaehvmHN6xxi-3QE/view",
    driveName:
      "03_★★★★★_CORE_R09_Usai_2026_LogicLens_Multi_Repository_Semantic_Code_Graph.pdf",
    priority: "core",
  },
  codefuse: {
    id: "codefuse",
    label: "Xie et al. 2026: CodeFuse Query",
    href: "https://drive.google.com/file/d/1cfU7FbjkIRSamwvWKbL3pTH_EC0V-ObB/view",
    driveName:
      "10_★★★★★_CORE_R05_Xie_2026_CodeFuse_Query_Large_Scale_Code_Analysis.pdf",
    priority: "core",
  },
  sweqa: {
    id: "sweqa",
    label: "Peng et al. 2026: SWE-QA",
    href: "https://drive.google.com/file/d/15eGjHmpQ_YDfCnJBy535PoKQ-TEyWtpj/view",
    driveName:
      "02_★★★★☆_IMPORTANT_R29_Peng_2026_SWE_QA_Repository_Level_Code_Questions.pdf",
    priority: "important",
  },
  alshemaimri: {
    id: "alshemaimri",
    label: "Alshemaimri et al. 2021: Database Code Fragments Survey",
    href: "https://onlinelibrary.wiley.com/doi/full/10.1002/eng2.12441",
    priority: "important",
  },
  allamanis: {
    id: "allamanis",
    label: "Allamanis et al. 2018: Learning to Represent Programs with Graphs",
    href: "https://arxiv.org/pdf/1711.00740",
    driveName:
      "06_★★★★★_CORE_R41_Allamanis_2018_Learning_to_Represent_Programs_with_Graphs.pdf",
    priority: "core",
  },
  kilt: {
    id: "kilt",
    label: "Petroni et al. 2021: KILT",
    href: "https://arxiv.org/pdf/2009.02252",
    driveName:
      "08_★★★★☆_IMPORTANT_R42_Petroni_2021_KILT_Knowledge_Intensive_Language_Tasks.pdf",
    priority: "important",
  },
  draco: {
    id: "draco",
    label: "Cheng et al. 2024: DraCo",
    href: "https://arxiv.org/pdf/2405.19782",
    driveName:
      "09_★★★★☆_IMPORTANT_R43_Cheng_2024_DraCo_Dataflow_Guided_Repository_Retrieval.pdf",
    priority: "important",
  },
  graphcodebert: {
    id: "graphcodebert",
    label: "Guo et al. 2021: GraphCodeBERT",
    href: "https://arxiv.org/pdf/2009.08366",
    driveName: "11_★★☆☆☆_OPTIONAL_R44_Guo_2021_GraphCodeBERT_Data_Flow.pdf",
    priority: "optional",
  },
  roslynWorkspace: {
    id: "roslynWorkspace",
    label: "Microsoft Learn: Roslyn Workspace",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/work-with-workspace",
    priority: "support",
  },
  roslynSyntax: {
    id: "roslynSyntax",
    label: "Microsoft Learn: Roslyn Syntax Analysis",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/syntax-analysis",
    priority: "support",
  },
  roslynSemantic: {
    id: "roslynSemantic",
    label: "Microsoft Learn: Roslyn Semantic Analysis",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/semantic-analysis",
    priority: "support",
  },
  efMapping: {
    id: "efMapping",
    label: "Microsoft Learn: EF Core Entity Mapping",
    href: "https://learn.microsoft.com/en-us/ef/core/modeling/entity-types#table-name",
    priority: "support",
  },
  efQuerying: {
    id: "efQuerying",
    label: "Microsoft Learn: EF Core Querying",
    href: "https://learn.microsoft.com/en-us/ef/core/querying/",
    priority: "support",
  },
  efSaving: {
    id: "efSaving",
    label: "Microsoft Learn: EF Core Saving",
    href: "https://learn.microsoft.com/en-us/ef/core/saving/",
    priority: "support",
  },
  neo4jModeling: {
    id: "neo4jModeling",
    label: "Neo4j: Data Modeling",
    href: "https://neo4j.com/docs/getting-started/data-modeling/",
    priority: "support",
  },
  cypher: {
    id: "cypher",
    label: "Neo4j GraphAcademy: Cypher Fundamentals",
    href: "https://graphacademy.neo4j.com/courses/cypher-fundamentals",
    priority: "support",
  },
  tfidf: {
    id: "tfidf",
    label: "scikit-learn: Text Feature Extraction und TF-IDF",
    href: "https://scikit-learn.org/stable/modules/feature_extraction.html",
    priority: "course",
  },
  cosine: {
    id: "cosine",
    label: "scikit-learn: Cosine Similarity",
    href: "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html",
    priority: "course",
  },
  embeddings: {
    id: "embeddings",
    label: "Keras 3: Embedding Layer",
    href: "https://keras.io/api/layers/core_layers/embedding/",
    priority: "course",
  },
  rnn: {
    id: "rnn",
    label: "Keras 3: SimpleRNN",
    href: "https://keras.io/api/layers/recurrent_layers/simple_rnn/",
    priority: "course",
  },
  lstm: {
    id: "lstm",
    label: "Keras 3: LSTM",
    href: "https://keras.io/api/layers/recurrent_layers/lstm/",
    priority: "course",
  },
  gru: {
    id: "gru",
    label: "Keras 3: GRU",
    href: "https://keras.io/api/layers/recurrent_layers/gru/",
    priority: "course",
  },
  sentiment: {
    id: "sentiment",
    label: "Keras-Beispiel: Bidirectional LSTM on IMDB",
    href: "https://keras.io/examples/nlp/bidirectional_lstm_imdb/",
    priority: "course",
  },
  seq2seq: {
    id: "seq2seq",
    label: "Keras-Beispiel: Character-level Seq2Seq",
    href: "https://keras.io/examples/nlp/lstm_seq2seq/",
    priority: "course",
  },
  attention: {
    id: "attention",
    label: "Vaswani et al. 2017: Attention Is All You Need",
    href: "https://arxiv.org/abs/1706.03762",
    priority: "course",
  },
  bert: {
    id: "bert",
    label: "Devlin et al. 2019: BERT",
    href: "https://aclanthology.org/N19-1423/",
    priority: "course",
  },
  gpt: {
    id: "gpt",
    label: "Radford et al. 2019: Language Models are Unsupervised Multitask Learners",
    href: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
    priority: "course",
  },
  googleLlmCrashCourse: {
    id: "googleLlmCrashCourse",
    label: "Google Machine Learning Crash Course: Introduction to Large Language Models",
    href: "https://developers.google.com/machine-learning/crash-course/llm",
    priority: "course",
  },
  lora: {
    id: "lora",
    label: "Hu et al. 2021: LoRA",
    href: "https://arxiv.org/abs/2106.09685",
    priority: "course",
  },
  qlora: {
    id: "qlora",
    label: "Dettmers et al. 2023: QLoRA",
    href: "https://arxiv.org/abs/2305.14314",
    priority: "course",
  },
  rag: {
    id: "rag",
    label: "Lewis et al. 2020: Retrieval-Augmented Generation",
    href: "https://arxiv.org/abs/2005.11401",
    priority: "course",
  },
  bleu: {
    id: "bleu",
    label: "Papineni et al. 2002: BLEU",
    href: "https://aclanthology.org/P02-1040/",
    priority: "course",
  },
};

export const nlpLabDefinition = {
  name: "NLP Retrieval Lab",
  route: "/nlp-lab",
  courseStart: "2026-08-17",
  courseEnd: "2026-09-07",
  surgeryDate: "2026-09-10",
  problem:
    "Given a natural-language question about one or more C# repositories, produce reproducible top-k code candidates and an answerability decision whose claims reference verifiable Evidence IDs.",
  projectFit:
    "The lab supplies the Flat retrieval baseline and optional neural experiments for RQ2. It does not replace Roslyn extraction, the evidence model, graph traversal, or the verifier.",
  core: [
    "Code-aware preprocessing and tokenization",
    "Bag of Words, TF-IDF, cosine ranking, and deterministic top-k",
    "A versioned RetrievalRun JSON contract",
    "Recall@k, MRR, latency, and reproducible fixtures",
    "Claim, Evidence ID, and NOT_ANSWERABLE output boundaries",
  ],
  deferred: [
    "Training a production RNN, LSTM, GRU, BERT, or GPT model",
    "LoRA or QLoRA fine-tuning without a frozen evaluated dataset",
    "Using attention weights as evidence",
    "Cloud deployment, multi-user accounts, or automatic repository upload",
  ],
  actors: ["Researcher", "Developer", "Architect", "QA reviewer"],
  useCases: [
    "UC-01 Build a code-aware lexical index from a frozen repository corpus",
    "UC-02 Retrieve deterministic top-k candidates for a natural-language question",
    "UC-03 Compare Flat retrieval with Graph retrieval on the same questions",
    "UC-04 Inspect every candidate's score, source location, and Evidence IDs",
    "UC-05 Refuse an answer when required evidence is missing or conflicting",
    "UC-06 Export a versioned RetrievalRun for evaluation and the Cross app",
  ],
  integrationContract: {
    input: "CorpusManifest + QuestionContract + RetrievalConfig",
    output:
      "RetrievalRun { runId, queryId, candidates[], metrics, evidenceIds[], answerStatus }",
    boundary:
      "The lab may propose candidates; only the Cross app verifier may approve claims.",
  },
} as const;

export const nlpCourseSessions: NlpCourseSession[] = [
  {
    number: 1,
    date: "2026-08-17",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Preprocessing and code-aware tokenization",
    topics: ["Preprocessing", "Tokenization", "camelCase", "snake_case"],
    projectQuestion: "Which code tokens must remain searchable without destroying source evidence?",
    useCase: "UC-01 · Build a code-aware lexical index",
    sourceIds: ["roslynSyntax", "allamanis"],
    softwareEngineering: ["Tokenizer contract", "Input/output examples", "Failure taxonomy"],
    deliverables: ["tokenizer-rules.md", "tokenizer.schema.json", "12 tokenizer unit tests"],
    definitionOfDone: "Twelve fixtures pass and every produced token keeps its source span.",
  },
  {
    number: 2,
    date: "2026-08-19",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Bag of Words, TF-IDF, and cosine ranking",
    topics: ["Bag of Words", "TF-IDF", "Vector space", "Cosine similarity"],
    projectQuestion: "What is the simplest reproducible Flat baseline for RQ2?",
    useCase: "UC-02 · Retrieve deterministic top-k candidates",
    sourceIds: ["tfidf", "cosine", "sweqa"],
    softwareEngineering: ["Retriever interface", "Deterministic tie-break ADR", "Golden fixture"],
    deliverables: ["tfidf-config-v1.json", "flat-retriever contract", "top-k golden test"],
    definitionOfDone: "The same corpus and config always return the same ordered top-k list.",
  },
  {
    number: 3,
    date: "2026-08-22",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Word embeddings and the experiment boundary",
    topics: ["Word2Vec", "GloVe", "FastText", "Keras Embedding"],
    projectQuestion: "Can subword semantics improve code retrieval enough to justify added cost?",
    useCase: "UC-03 · Compare an optional semantic candidate generator",
    sourceIds: ["embeddings", "graphcodebert", "allamanis"],
    softwareEngineering: ["Experiment ADR", "Baseline parity rules", "Cost and data constraints"],
    deliverables: ["embedding-mini-lab.ipynb", "ADR-004-embedding-baseline.md", "comparison table"],
    definitionOfDone: "The table records quality, latency, data, and reproducibility against TF-IDF.",
  },
  {
    number: 4,
    date: "2026-08-24",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "RNN and vanishing gradients",
    topics: ["RNN", "Hidden state", "Vanishing gradient"],
    projectQuestion: "Why is sequence memory not equivalent to a repository evidence path?",
    useCase: "UC-03 · Reject an unjustified sequence-model dependency",
    sourceIds: ["rnn", "lstm"],
    softwareEngineering: ["Scope decision", "Model-risk note", "Entry criteria for neural experiments"],
    deliverables: ["rnn-concept-note.md", "vanishing-gradient-one-page.md", "scope decision"],
    definitionOfDone: "Core, optional experiment, and future work are separated without ambiguity.",
  },
  {
    number: 5,
    date: "2026-08-26",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "LSTM and GRU architecture comparison",
    topics: ["LSTM", "GRU", "Gates", "Sequence state"],
    projectQuestion: "What evidence would be required before a recurrent model enters the project?",
    useCase: "UC-03 · Evaluate but do not promote an optional model",
    sourceIds: ["lstm", "gru"],
    softwareEngineering: ["Quality-attribute scenario", "Dataset gate", "Reproducibility checklist"],
    deliverables: ["lstm-vs-gru-table.md", "neural-entry-gate.yaml", "risk register update"],
    definitionOfDone: "A measurable go/no-go gate exists; no model is added only because it is taught.",
  },
  {
    number: 6,
    date: "2026-08-29",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Sentiment pipeline and Seq2Seq contracts",
    topics: ["LSTM sentiment project", "Seq2Seq", "Encoder", "Decoder"],
    projectQuestion: "How can a natural-language question become a constrained JSON QuestionContract?",
    useCase: "UC-02 · Parse a question without allowing invented structural claims",
    sourceIds: ["sentiment", "seq2seq", "kilt"],
    softwareEngineering: ["QuestionContract schema", "Validation errors", "Three sequence examples"],
    deliverables: ["nl-to-contract-schema.json", "three-question-fixture.json", "pipeline map"],
    definitionOfDone: "Valid questions parse; unsupported fields and malformed output are rejected.",
  },
  {
    number: 7,
    date: "2026-08-31",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Self-attention and evidence",
    topics: ["Self-Attention", "Multi-Head Attention", "Q/K/V"],
    projectQuestion: "Where does attention help retrieval, and why can it never certify evidence?",
    useCase: "UC-04 · Inspect model signals separately from verified evidence",
    sourceIds: ["attention", "yamaguchi", "allamanis"],
    softwareEngineering: ["Trust-boundary diagram", "Claim policy", "Attention-vs-evidence ADR"],
    deliverables: ["attention-vs-evidence.md", "trust-boundary.mmd", "claim-policy.yaml"],
    definitionOfDone: "The design cannot expose an attention score as an Evidence ID.",
  },
  {
    number: 8,
    date: "2026-09-02",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "Positional encoding, encoder, and decoder",
    topics: ["Positional Encoding", "Encoder", "Decoder", "Transformer flow"],
    projectQuestion: "How does Transformer flow differ from explicit graph traversal and provenance?",
    useCase: "UC-04 · Present candidate provenance beside neural ranking",
    sourceIds: ["attention", "draco"],
    softwareEngineering: ["Sequence diagram", "Component boundary", "Data-flow comparison"],
    deliverables: ["transformer-flow-notes.md", "graph-vs-transformer.mmd", "component update"],
    definitionOfDone: "The diagrams show where ranking ends and verification begins.",
  },
  {
    number: 9,
    date: "2026-09-05",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "BERT, GPT, and role-safe prompting",
    topics: ["BERT", "GPT", "Prompt Engineering", "Developer/Architect/QA roles"],
    projectQuestion: "How can optional neural retrieval and answer wording remain role-aware and grounded?",
    useCase: "UC-05 · Produce a role-specific answer or refuse it",
    sourceIds: ["googleLlmCrashCourse", "bert", "gpt", "graphcodebert", "sweqa"],
    softwareEngineering: ["Role prompt contract", "Output schema", "Adversarial refusal tests"],
    deliverables: ["bert-retrieval-adr.md", "role-prompts-v1.yaml", "refusal-tests.json"],
    definitionOfDone: "Every answer contains claim, Evidence IDs, role, and answerability status.",
  },
  {
    number: 10,
    date: "2026-09-07",
    berlinTime: "17:30–19:10",
    iranTime: "19:00–20:40",
    title: "PEFT, RAG, and evaluation boundary",
    topics: ["LoRA", "QLoRA", "RAG", "ROUGE", "BLEU"],
    projectQuestion: "Which parts belong in the thesis core, optional experiments, and future work?",
    useCase: "UC-06 · Export and compare a complete RetrievalRun",
    sourceIds: ["lora", "qlora", "rag", "bleu", "kilt"],
    softwareEngineering: ["RetrievalRun schema", "Evaluation protocol", "Integration ADR"],
    deliverables: ["retrieval-run.schema.json", "rag-metrics-boundary.md", "integration-readiness-report.md"],
    definitionOfDone: "The Flat baseline runs end-to-end; deferred neural work has explicit entry criteria.",
  },
];

const d = (
  title: string,
  sourceIds: string[],
  why: string,
  lookFor: [string, string, string],
  proposal: string[],
  module: string,
  deliverable: string,
  kind: DaySpec["kind"] = "project",
  recording?: string,
): DaySpec => ({
  title,
  sourceIds,
  why,
  lookFor,
  proposal,
  module,
  deliverable,
  kind,
  recording,
});

const technicalWeekSpecs: Array<{
  phase: string;
  phaseId: string;
  title: string;
  goal: string;
  days: DaySpec[];
}> = [
  {
    phase: "NLP-Lab Integration 1",
    phaseId: "nlp-foundations",
    title: "Flat Baseline produktionsreif machen",
    goal: "Die Ergebnisse des Live-Kurses werden in einen deterministischen, getesteten Flat Retriever überführt.",
    days: [
      d("Kursartefakte prüfen und einfrieren", ["proposal", "tfidf", "cosine"], "Nur nachvollziehbare Kursartefakte dürfen die Thesis-Baseline beeinflussen.", ["Prüfe alle zehn Definition-of-Done-Gates", "Trenne Notebook, Produktionscode und Bericht", "Versioniere Konfiguration und Fixture"], ["7.2", "11.3", "17"], "NLP Retrieval Lab / Release", "course-artifact-manifest-v1.yaml"),
      d("Code-Aware Tokenizer implementieren", ["roslynSyntax", "allamanis"], "Der produktive Tokenizer muss Source Spans bewahren und reproduzierbar sein.", ["Implementiere camelCase und snake_case", "Bewahre qualifizierte Namen und SourceLocation", "Führe die zwölf Kurs-Fixtures aus"], ["3.1.3 bis 3.1.4", "38.2", "38.4"], "Retrieval.Flat / CodeAwareTokenizer", "CodeAwareTokenizer + 12 passing tests"),
      d("TF-IDF Index bauen", ["tfidf", "proposal"], "Die zentrale Flat Baseline benötigt einen eingefrorenen Corpus und versionierte Parameter.", ["Lade nur CorpusManifest-Einträge", "Versioniere n-gram, min_df und Stop-Tokens", "Speichere ConfigHash und CorpusCommit"], ["9.3", "13.2", "29.3"], "Retrieval.Flat / Index", "tfidf-index-v1 + config hash"),
      d("Cosine Ranker und top-k stabilisieren", ["cosine", "sweqa"], "Ranking muss bei gleichen Scores einen festen Tie-break besitzen.", ["Implementiere cosine score", "Definiere Tie-break über stabile Candidate-ID", "Teste k=1, 5 und 10"], ["14.2", "29.3", "38.10"], "Retrieval.Flat / Ranker", "cosine-ranker + golden ranking tests"),
      d("RetrievalRun-Vertrag implementieren", ["kilt", "proposal"], "Cross App und Evaluation dürfen nicht von internen Klassen des Labs abhängen.", ["Validiere runId, queryId und candidates", "Ergänze Evidence IDs und AnswerStatus", "Erzeuge gültige und ungültige Fixtures"], ["3.2", "3.6", "38.2"], "Contracts / RetrievalRun", "retrieval-run.schema.json + fixtures"),
      d("Flat Baseline Release Gate", ["tfidf", "cosine", "proposal"], "Die Baseline muss unabhängig startbar und testbar sein, bevor Graph-Vergleich beginnt.", ["Führe Clean Build und Tests aus", "Messe Recall@k, MRR und Laufzeit auf dem Pilot", "Dokumentiere bekannte Grenzen"], ["7.2", "14.2", "17"], "NLP Retrieval Lab / Baseline", "flat-baseline-v1-release-report.md"),
    ],
  },
  {
    phase: "NLP-Lab Integration 2",
    phaseId: "nlp-sequences",
    title: "Question Contracts und optionale Semantik",
    goal: "Fragen werden sicher strukturiert; neuronale Optionen erhalten einen messbaren Go/No-Go-Gate.",
    days: [
      d("QuestionContract finalisieren", ["seq2seq", "proposal"], "Natürliche Sprache darf nur in erlaubte, validierbare Query-Felder überführt werden.", ["Definiere role, intent, entities und constraints", "Verbiete unbekannte Felder", "Modelliere Validierungsfehler explizit"], ["3.6.2", "33.3", "38.2"], "QueryContracts", "question-contract.schema.json"),
      d("Question-to-JSON Fixtures", ["sweqa", "kilt"], "Drei Rollen benötigen reproduzierbare Beispiele statt freier Prompt-Ausgabe.", ["Erstelle Developer-Frage", "Erstelle Architect-Frage", "Erstelle QA-Frage plus invalid case"], ["25", "26", "33.3"], "QueryContracts / Fixtures", "question-contract-fixtures.json"),
      d("Embedding-Experiment reproduzieren", ["embeddings", "graphcodebert"], "Ein optionaler semantischer Retriever muss exakt gegen TF-IDF messbar sein.", ["Nutze denselben Corpus und dieselben Fragen", "Fixiere Modell und Seed", "Messe Recall@k, MRR und Laufzeit"], ["7.2", "8.2", "29.3"], "Retrieval.Neural / Experiment", "embedding-vs-tfidf-results.csv"),
      d("RNN/LSTM/GRU Scope Audit", ["rnn", "lstm", "gru"], "Kurswissen darf nicht ohne Datengrundlage zu Thesis-Scope werden.", ["Prüfe Dataset-Größe und Labels", "Prüfe Nutzen für RQ1/RQ2", "Dokumentiere Kosten und Reproduzierbarkeit"], ["8", "31", "37.3"], "Architecture / Scope", "ADR-005-sequence-models.md"),
      d("BERT/GraphCodeBERT Go-No-Go", ["bert", "graphcodebert"], "Neural Retrieval wird nur bei messbarem Mehrwert und vertretbaren Kosten weitergeführt.", ["Vergleiche mit Flat baseline", "Prüfe Data-flow-Nutzen", "Lege Stop-Schwelle vor Ergebnis fest"], ["4.3", "8.2", "37.2"], "Retrieval.Neural / Decision", "bert-retrieval-adr.md"),
      d("Semantic Experiment Gate", ["proposal", "kilt"], "Die Woche endet mit einer Entscheidung, nicht mit mehreren halbfertigen Modellen.", ["Prüfe alle Messdaten", "Entscheide Core, optional oder Future", "Versioniere Config, Ergebnis und ADR"], ["16", "20", "37"], "NLP Retrieval Lab / Decision", "semantic-experiment-gate.md"),
    ],
  },
  {
    phase: "NLP-Lab Integration 3",
    phaseId: "nlp-transformers",
    title: "Grounded Answering und Cross-App-Vertrag",
    goal: "Retriever, Verifier und Antwortformat werden getrennt und über einen getesteten Vertrag verbunden.",
    days: [
      d("Claim-Evidence-Vertrag", ["kilt", "logiclens"], "Jede Antwort benötigt explizite Claims, Evidence IDs und einen AnswerStatus.", ["Definiere Claim und Evidence-Referenz", "Definiere SUPPORTED, PARTIAL und NOT_ANSWERABLE", "Verbiete Text ohne referenzierte Evidenz"], ["3.6", "14.3", "27"], "Answering / Contract", "answer-contract.schema.json"),
      d("Verifier-Grenze implementieren", ["proposal", "nagy"], "Retriever-Scores dürfen keine strukturellen Claims bestätigen.", ["Prüfe Evidence-ID-Auflösung", "Prüfe widersprüchliche Evidence", "Erzeuge Correct-Refusal-Fixtures"], ["3.2", "3.6", "38.9"], "Verifier", "answer-verifier + refusal tests"),
      d("RAG-Orchestrierung ohne Halluzination", ["rag", "kilt"], "Generation darf nur nach Retrieval und Verifikation stattfinden.", ["Trenne Retriever, Verifier und Generator", "Stoppe bei NOT_ANSWERABLE", "Protokolliere verwendete Evidence IDs"], ["7.2", "14.2", "33"], "Answering / RAG", "grounded-rag-flow.mmd + integration test"),
      d("Rollenformat für Developer, Architect und QA", ["gpt", "sweqa"], "Die Darstellung variiert nach Rolle, nicht die zugrunde liegende Evidenz.", ["Definiere drei Output Views", "Nutze denselben RetrievalRun", "Teste Verbot veränderter Claims"], ["25", "26", "33.3"], "Answering / Views", "role-output-contracts.yaml"),
      d("Evaluationsgrenze ROUGE/BLEU", ["bleu", "proposal"], "Textähnlichkeit ist sekundär zu Evidenzvollständigkeit und korrekter Ablehnung.", ["Definiere primäre RQ2-Metriken", "Ordne ROUGE/BLEU als sekundär ein", "Dokumentiere Failure-Beispiele"], ["14.2", "14.3", "29.3"], "Evaluation / Metrics", "rag-metrics-boundary.md"),
      d("Cross-App Integration Gate", ["proposal", "logiclens", "codefuse"], "Das Lab wird nur über einen stabilen Vertrag und bestandene E2E-Prüfung verbunden.", ["Validiere RetrievalRun im Adapter", "Teste Flat, Graph und Refusal", "Erzeuge Installations- und Rollback-Notiz"], ["16", "17", "20"], "Cross App / NLP Adapter", "nlp-lab-integration-readiness.md + E2E test"),
    ],
  },
  {
    phase: "Phase 0: Scope und Corpus",
    phaseId: "scope-corpus",
    title: "Frozen Corpus und Forschungsvertrag",
    goal: "Ein festes Corpus, ein vertretbarer Scope und vorab definierte Fragen werden vorbereitet.",
    days: [
      d("Ziel und zwei Forschungsfragen erneut prüfen", ["proposal", "hevner"], "Jede spätere Implementierung muss eine der beiden Forschungsfragen direkt unterstützen.", ["Formuliere das Ziel des Artefakts in einem Satz", "Extrahiere die Analyseeinheit von RQ1 präzise", "Liste die RQ2-Metriken ohne neue Kriterien auf"], ["6", "7", "11.1"], "Docs / Research Contract", "research-contract-v1.md"),
      d("Danphe einfrieren", ["danphe", "proposal"], "Ohne festen Commit sind die Ergebnisse nicht reproduzierbar.", ["Dokumentiere Commit und Submodule", "Ermittle Lizenz und Build-Anforderungen", "Definiere Pfade außerhalb des Corpus"], ["9.3", "11.3", "38.1"], "Corpus", "corpus-manifest.yaml"),
      d("Corpus Census", ["danphe", "roslynWorkspace"], "Vor dem Extractor muss klar sein, welche Muster im Corpus tatsächlich vorkommen.", ["Ermittle die Anzahl von Solution, Project und File", "Zähle DbContext und DbSet", "Ziehe Stichproben realer READ/WRITE-Muster"], ["3.5.2", "9.2", "28"], "Corpus / Census", "corpus-census.csv"),
      d("Core- und Extension-Scope", ["proposal", "alshemaimri"], "Scope Creep muss vor der Implementierung gestoppt werden.", ["Liste die Core-Fälle auf", "Trenne Fälle, die von Beobachtungen im Corpus abhängen", "Dokumentiere Future-Fälle mit Stop Rule"], ["8", "31", "37"], "Docs / Scope", "scope-and-stop-rules.md"),
      d("Rollenbasierte Use Cases", ["proposal", "sweqa"], "Reale Fragen müssen vor dem Retrieval definiert werden.", ["Überführe den Developer-Bedarf in Evidenzfelder", "Überführe den Architect-Bedarf in Pfade", "Überführe QA/Compliance in Coverage und Gaps"], ["1.6", "25", "26"], "QueryContracts", "use-cases-v1.yaml"),
      d("Erster Gold-Pilot", ["proposal", "danphe"], "Kleine positive, negative und schwierige Beispiele steuern den Extractor-Pfad.", ["Fixiere die Annotationseinheit", "Wähle fünf positive und fünf negative Fälle", "Erstelle drei Hard Negatives aus Namensähnlichkeit"], ["12", "13.3", "29.4"], "Evaluation / Gold", "gold/pilot-v1.jsonl"),
    ],
  },
  {
    phase: "Phase 1: Roslyn Syntax",
    phaseId: "roslyn-syntax",
    title: "Von der Solution zur Declaration",
    goal: "Dateien, Klassen und Methoden werden mit eindeutiger Source Location extrahiert.",
    days: [
      d("Solution Loader", ["roslynWorkspace", "proposal"], "Alle Projekte müssen aus einer reproduzierbaren Eingabe geladen werden.", ["Ermittle die Hierarchie Solution/Project/Document", "Definiere das Verhalten bei Build-Fehlern", "Lege RepositoryId und ProjectId fest"], ["3.1", "10.2", "38.2"], "Extractors.CSharp", "SolutionLoader.cs + tests"),
      d("Syntax Tree und Traversal", ["roslynSyntax", "yamaguchi"], "Strukturierte Traversierung ersetzt fragile reguläre Ausdrücke.", ["Trenne Node, Token und Trivia", "Wähle die passende Traversierung für Deklarationen", "Dokumentiere SourceSpan und LineSpan"], ["3.1.3 bis 3.1.4", "4.1"], "Extractors.CSharp", "SyntaxWalker.cs + fixture"),
      d("File und Namespace", ["roslynSyntax", "allamanis"], "Eine Symbol-ID ist ohne Datei- und Namespace-Kontext unvollständig.", ["Erkenne file-scoped Namespaces", "Decke verschachtelte Namespaces ab", "Trenne Generated Files mit einer dokumentierten Regel"], ["3.1.4", "38.4"], "Extractors.CSharp", "FileNamespaceExtractor.cs"),
      d("Class und Interface", ["roslynSyntax", "yamaguchi"], "Types verbinden Methoden, Vererbung und Mapping.", ["Erkenne class, record und interface", "Dokumentiere verschachtelte Types", "Bewahre partial Types ohne falsche Zusammenführung"], ["3.1.4", "3.3.6", "38.4"], "Extractors.CSharp", "TypeDeclarationExtractor.cs"),
      d("Method und Constructor", ["roslynSyntax", "allamanis"], "Method ist die zentrale Einheit von RQ1 und vieler Evidenzpfade.", ["Erzeuge die vollständige Signatur", "Trenne Konstruktor und lokale Funktion", "Fixiere startLine und endLine"], ["7.1", "12.2", "38.4"], "Extractors.CSharp", "MethodExtractor.cs"),
      d("Golden Tests für Deklarationen", ["proposal", "roslynSyntax"], "Vor dem Semantic Model muss die Syntax-Schicht verlässlich sein.", ["Erstelle minimale Fixtures für jede Deklaration", "Mache die Ausgabereihenfolge deterministisch", "Füge einen negativen Fall für Generated Code hinzu"], ["38.10", "17"], "Tests / CSharp", "declarations.golden.json"),
    ],
  },
  {
    phase: "Phase 1: Roslyn Semantic",
    phaseId: "roslyn-semantic",
    title: "Symbols, Calls und Provenance",
    goal: "Declaration und Invocation werden über das Semantic Model verbunden; Unresolved bleibt explizit.",
    days: [
      d("SemanticModel und Symbol", ["roslynSemantic", "shatnawi"], "Ähnliche Namen dürfen keine falsche semantische Beziehung erzeugen.", ["Trenne DeclaredSymbol und SymbolInfo", "Erzeuge eine vollständig qualifizierte Identität", "Halte Ambiguous und Unresolved explizit"], ["3.1.5 bis 3.1.7", "38.4"], "Extractors.CSharp", "SymbolResolver.cs"),
      d("Invocation Extraction", ["roslynSemantic", "allamanis"], "INVOKES muss den Call Site mit dem Ziel-Symbol und seiner Location verbinden.", ["Finde InvocationExpression", "Löse die Zielmethode auf", "Bewahre die Call-Site-Location"], ["3.3.7", "10.2", "38.4"], "Extractors.CSharp", "InvocationExtractor.cs"),
      d("Constructor und Extension Calls", ["roslynSemantic", "shatnawi"], "Call-Regeln müssen gängige C#-Fälle ohne Vermutungen abdecken.", ["Verbinde Object Creation mit dem Konstruktor", "Löse das Ziel von Extension Methods auf", "Halte Dynamic Dispatch als Unresolved"], ["2.1", "3.1.7", "27.4"], "Extractors.CSharp", "SpecialCallExtractor.cs"),
      d("Globale Symbolidentität", ["logiclens", "proposal"], "Cross-Project-Links sind ohne stabile Identität nicht reproduzierbar.", ["Kombiniere Assembly, Namespace, Type und Signature", "Ergänze RepositoryId und ProjectId", "Erstelle einen Collision-Test für Overloads"], ["3.3.10", "38.4"], "Core / Identity", "SymbolId.cs + collision tests"),
      d("SourceLocation", ["nagy", "proposal"], "Jeder Claim muss auf Datei und Zeile zurückführbar sein.", ["Definiere lineStart und lineEnd", "Trenne Call-Site- und Declaration-Location", "Normalisiere den Dateipfad relativ zum Repository"], ["3.4.5 bis 3.4.7", "10.5", "38.3"], "Core / Provenance", "SourceLocation.cs"),
      d("Call-Graph-Integration", ["logiclens", "codefuse"], "Der erste strukturelle Graph wird mit Fixture und deterministischer Ausgabe abgeschlossen.", ["Verbinde File-, Type- und Method-Nodes", "Zähle ungelöste INVOKES", "Bestätige manuell einen realen Danphe-Pfad"], ["10.2", "10.3", "38.10"], "Extractors.CSharp / Integration", "call-graph-v1.jsonl"),
    ],
  },
  {
    phase: "Phase 2: EF Core READ",
    phaseId: "ef-read",
    title: "Mapping und READ-Evidenz",
    goal: "DbContext und DbSet werden bis zur Tabelle und READ-Operation mit Provenance extrahiert.",
    days: [
      d("DbContext Discovery", ["efMapping", "shatnawi"], "DbContext ist der Einstiegspunkt des EF-Core-Modells.", ["Löse die Vererbung von DbContext auf", "Dokumentiere die Context-Identität", "Markiere unvollständige oder externe Contexts"], ["3.2.2 bis 3.2.3", "38.5"], "Extractors.EFCore", "DbContextExtractor.cs"),
      d("DbSet und Entity", ["efMapping", "alshemaimri"], "Ein DbSet ist ein Mapping-Kandidat, keine ausgeführte READ-Operation.", ["Extrahiere DbSet-Property und generischen Typ", "Löse die Entity-Identität auf", "Trenne Candidate-Status von READ"], ["3.2.4", "28.1", "38.5"], "Extractors.EFCore", "DbSetExtractor.cs"),
      d("Table Mapping", ["efMapping", "shatnawi"], "Ein Tabellen-Claim ist nur mit gültigem Mapping erlaubt.", ["Finde das ToTable-Mapping", "Dokumentiere konventionsbasierte Tabellennamen", "Setze unbekanntes Mapping auf UNRESOLVED"], ["3.2.12 bis 3.2.13", "38.3"], "Extractors.EFCore", "TableMappingResolver.cs"),
      d("LINQ Query Candidate", ["efQuerying", "nagy"], "Das Vorhandensein eines Query-Ausdrucks bedeutet noch keine Ausführung.", ["Verbinde den Query Root mit DbSet", "Dokumentiere Where, Select und Include", "Bestimme die Grenze der verzögerten Ausführung"], ["3.2.5 bis 3.2.6", "28.1"], "Extractors.EFCore", "LinqQueryExtractor.cs"),
      d("Materialization und READ", ["efQuerying", "nagy"], "READ muss mit Materializer und Zieltabelle verbunden sein.", ["Decke ToList, First, Single, Any und Count ab", "Dokumentiere asynchrone Varianten", "Bewahre die SourceLocation der Materialisierung"], ["28.1", "38.5"], "Extractors.EFCore", "ReadMaterializerRules.cs"),
      d("READ Integration Tests", ["proposal", "danphe"], "READ-Regeln werden mit positiven und negativen Fixtures sowie einem Danphe-Beispiel abgeschlossen.", ["Bestätige einen realen READ-End-to-End-Fall", "Markiere DbSet ohne Materialisierung als negativ", "Erzeuge bei unbekanntem Mapping keinen Tabellen-Claim"], ["7.1", "14.1", "38.10"], "Tests / EFCore", "ef-read.golden.json"),
    ],
  },
  {
    phase: "Phase 2: EF Core WRITE",
    phaseId: "ef-write",
    title: "Mutation, Persistence und Vertical Slice",
    goal: "Mutation wird über SaveChanges bis zur Tabelle mit einem erklärbaren Evidenzpfad verbunden.",
    days: [
      d("Add, Update und Remove", ["efSaving", "alshemaimri"], "Ein Mutation-Kandidat muss von Persistence getrennt bleiben.", ["Decke die APIs Add, Update und Remove ab", "Löse Entity und DbSet-Ziel auf", "Dokumentiere die MUTATES-Kante mit Location"], ["3.2.7 bis 3.2.8", "28.2"], "Extractors.EFCore", "MutationExtractor.cs"),
      d("SaveChanges und PERSISTS", ["efSaving", "nagy"], "Eine unterstützte WRITE-Operation benötigt einen erklärbaren Pfad bis SaveChanges.", ["Extrahiere SaveChanges und SaveChangesAsync", "Verbinde Mutation und Persistence in einer Method", "Begrenze die interprozedurale Distanz explizit"], ["28.2", "38.6"], "Extractors.EFCore", "PersistenceExtractor.cs"),
      d("ExecuteUpdate und ExecuteDelete", ["efSaving", "proposal"], "Bulk-APIs besitzen eigene Regeln und dürfen nicht wie Change Tracking behandelt werden.", ["Finde Bulk-Methoden", "Löse die Zielabfrage auf", "Dokumentiere, dass SaveChanges nicht nötig ist"], ["38.6", "27.1"], "Extractors.EFCore", "BulkWriteRules.cs"),
      d("WRITE Target Resolution", ["efMapping", "shatnawi"], "WRITES_TO wird nur bei ausreichendem Mapping erzeugt.", ["Erzeuge den Entity-to-table-Pfad", "Stoppe bei ungelöstem Mapping", "Behaupte Trigger oder Interceptor nicht ohne Evidenz"], ["3.4.8", "38.6"], "Extractors.EFCore", "WriteTargetResolver.cs"),
      d("Realer Vertical Slice", ["danphe", "proposal"], "Ein realer Pfad von Method zu Table zeigt den Wert des Artefakts.", ["Bestimme Method und Call Chain", "Führe Mutation, Persistence und Mapping zusammen", "Prüfe alle SourceLocations manuell"], ["10.2 bis 10.5", "26.2 bis 26.4"], "CLI / End-to-End", "vertical-slice-001.json"),
      d("Capability Matrix", ["alshemaimri", "proposal"], "Transparente Grenzen verhindern überzogene Claims.", ["Klassifiziere jedes EF-Muster als supported, partial oder unsupported", "Dokumentiere ADO.NET und SQL nur, wenn sie beobachtet wurden", "Formuliere eine Stop Decision für Erweiterungen"], ["8", "28.4", "31"], "Docs / Capabilities", "capability-matrix.md"),
    ],
  },
  {
    phase: "Phase 3: Evidence Model",
    phaseId: "evidence-model",
    title: "EvidenceRecord, Provenance und JSONL",
    goal: "Das wissenschaftliche Modell wird vom Storage getrennt; alle Claims bleiben nachvollziehbar.",
    days: [
      d("EvidenceRecord Contract", ["proposal", "kilt"], "Die zentrale Artefakteinheit muss Claim, Rule, Status und Location trennen.", ["Extrahiere die Pflichtfelder des Records", "Trenne ObservationType und ClaimType", "Definiere RuleId und RuleVersion"], ["3.4", "10.5", "38.3"], "Core", "EvidenceRecord.cs"),
      d("Evidence Status", ["proposal", "kilt"], "OBSERVED und DERIVED dürfen nicht mit UNRESOLVED oder CONFLICTING vermischt werden.", ["Formuliere die Bedingung jedes Status", "Definiere erlaubte Übergänge", "Erstelle für jeden Status ein Fixture"], ["3.4.9", "10.6", "27.4"], "Core", "EvidenceStatus.cs + tests"),
      d("Globale IDs und Datenbankziel", ["proposal", "nagy"], "Das Tabellenziel muss mit ausreichender Identität und ohne erfundenes Schema gespeichert werden.", ["Kombiniere Repository-, Project- und Symbol-ID", "Definiere die Identität von Database, Schema und Table", "Markiere partielle Identität explizit"], ["38.4", "28.3"], "Core", "DatabaseTargetId.cs"),
      d("Evidence Path", ["logiclens", "proposal"], "RQ2 benötigt einen validen Pfad, nicht nur eine Ergebnisliste.", ["Definiere die Reihenfolge erforderlicher Kanten", "Bewahre die SourceLocation jedes Schritts", "Mache fehlende Schritte zu Evidence Gaps"], ["3.4.7 bis 3.4.8", "14.2", "38.9"], "Core / Paths", "EvidencePath.cs"),
      d("Deterministisches JSONL", ["proposal", "codefuse"], "Dieselbe Eingabe muss dieselbe Evidenzausgabe erzeugen.", ["Fixiere Feldreihenfolge und Encoding", "Definiere den Sortierschlüssel der Records", "Speichere den Output-Hash im Manifest"], ["11.3", "38.11"], "CLI / Serialization", "evidence-v1.jsonl + hash"),
      d("Evidence Integration Gate", ["proposal", "danphe"], "Vor dem Graphen muss die storageunabhängige Ausgabe valide sein.", ["Validiere READ- und WRITE-Records", "Erlaube keinen Tabellen-Claim ohne Mapping", "Reproduziere den Golden Snapshot"], ["17", "27.3", "38.10"], "Core / Integration", "evidence-contract-v1.md"),
    ],
  },
  {
    phase: "Phase 4: Neo4j Graph",
    phaseId: "neo4j-graph",
    title: "Graph Schema und Import",
    goal: "Das Evidence Model wird nach Neo4j übertragen, ohne seine wissenschaftliche Bedeutung an den Storage zu binden.",
    days: [
      d("Property Graph Modeling", ["neo4jModeling", "yamaguchi"], "Nodes und Relationships müssen Use Cases und Evidenzableitung folgen.", ["Leite die nötigen Nodes aus §38.8 ab", "Dokumentiere die Kardinalität der Beziehungen", "Behandle EvidenceRecord als First-Class-Objekt"], ["3.3", "10.3", "38.8"], "Graph", "graph-schema-v1.md"),
      d("Constraints und Indizes", ["neo4jModeling", "codefuse"], "Globale IDs brauchen Eindeutigkeit; Queries müssen ausführbar bleiben.", ["Definiere Unique Constraints", "Wähle querygetriebene Indizes", "Erstelle Tests für Kollisionen und fehlende IDs"], ["3.3.10", "38.8"], "Graph", "constraints.cypher"),
      d("Cypher CREATE und MERGE", ["cypher"], "Der Importer darf bei wiederholter Ausführung keine Duplikate erzeugen.", ["Erkläre den Unterschied zwischen CREATE und MERGE", "Übe MERGE auf der globalen ID", "Bewahre Relationship-Provenance ohne Überschreiben"], ["3.3.8", "38.8"], "Graph / Import", "cypher-practice.md"),
      d("Node Import", ["neo4jModeling", "proposal"], "Der schrittweise Import muss test- und berichtbar sein.", ["Importiere Repository bis Method", "Importiere DatabaseObject und EvidenceRecord", "Dokumentiere Counts vor und nach dem Import"], ["10.2", "38.8"], "Graph / Import", "NodeImporter.cs"),
      d("Relationship Import", ["logiclens", "proposal"], "Kanten müssen Claim Type und Provenance erhalten.", ["Importiere INVOKES, MAPS_TO, MUTATES und PERSISTS", "Verbinde READS_FROM und WRITES_TO mit Evidenz", "Lösche ungelöste Ziele nicht"], ["3.3.7", "38.8"], "Graph / Import", "RelationshipImporter.cs"),
      d("Idempotenter Graph Build", ["codefuse", "proposal"], "Zwei identische Läufe müssen gleiche Counts und Query-Antworten liefern.", ["Baue den Graphen zweimal", "Prüfe auf doppelte Nodes und Edges", "Vergleiche Run Manifest und Counts"], ["11.3", "17", "38.10"], "Graph / Integration", "graph-build-report.json"),
    ],
  },
  {
    phase: "Phase 4: Retrieval und Query",
    phaseId: "retrieval-query",
    title: "Flat vs. Graph und Query Contracts",
    goal: "Zwei Retrieval-Methoden werden auf derselben Evidenz und mit festen Fragen verglichen.",
    days: [
      d("Question Contract Schema", ["proposal", "sweqa"], "Jede Frage braucht eine definierte Rolle, ein Ziel und Evidenzanforderungen.", ["Leite QuestionTypes aus den Use Cases ab", "Definiere erforderliche Evidenzfelder", "Schreibe die Refusal-Bedingung in den Contract"], ["3.6.2", "13.3", "33.3", "38.9"], "QueryContracts", "question-contract.schema.json"),
      d("Flat Retriever Freeze", ["tfidf", "draco"], "Die Baseline darf nach Sichtung der Testergebnisse nicht verändert werden.", ["Friere Tokenizer und Konfiguration ein", "Dokumentiere Top-k und Tie-break", "Fixiere das Ausgabeformat der Kandidaten"], ["13.2", "29.3"], "Retrieval.Flat", "flat-config-v1.json"),
      d("Graph Query UC1 und UC2", ["cypher", "proposal"], "READ- und WRITE-Queries müssen vollständige Evidenzpfade liefern.", ["Implementiere die Tabellenleser von UC1", "Implementiere Mutationen und Persistence von UC2", "Nimm SourceLocation in die Ausgabe auf"], ["26.1", "26.2", "38.9"], "Retrieval.Graph", "queries/uc1-uc2.cypher"),
      d("Graph Query UC3 und UC4", ["cypher", "logiclens"], "Mechanismus und vollständiger Pfad werden für Architects erklärbar.", ["Frage den Zugriffsmechanismus ab", "Gib den vollständigen Evidenzpfad zurück", "Markiere Projektgrenzen"], ["26.3", "26.4", "26.6"], "Retrieval.Graph", "queries/uc3-uc4.cypher"),
      d("Negative Control und Refusal", ["proposal", "kilt"], "Ähnliche Namen dürfen keine unbelegte Antwort erzeugen.", ["Implementiere fehlende Evidenz für UC5", "Markiere Namensähnlichkeit in UC7 als negativ", "Gib einen NOT_ANSWERABLE-Reason-Code zurück"], ["26.5", "26.7", "14.3"], "Verifier", "negative-controls.json"),
      d("Fair Comparison Harness", ["draco", "proposal"], "Flat und Graph müssen dieselben Fragen, dieselbe Evidenz und dasselbe Budget verwenden.", ["Fixiere das gemeinsame Input Set", "Setze dasselbe Kandidatenbudget", "Speichere Rohdaten unverändert"], ["13.2", "29.3", "38.11"], "Evaluation", "retrieval-harness.cs"),
    ],
  },
  {
    phase: "Phase 5: Goldstandard",
    phaseId: "goldstandard",
    title: "Annotation, Pilot und Data Freeze",
    goal: "Der Goldstandard wird mit klarer Einheit, Qualitätskontrolle und getrennten Pilot-/Testdaten vorbereitet.",
    days: [
      d("Annotationsleitfaden", ["proposal", "kilt"], "Zwei Annotierende müssen dasselbe Evidenzelement gleich verstehen.", ["Definiere die Einheiten von RQ1 und RQ2", "Gib Beispiele für Status- und Pfadregeln", "Definiere die Konfliktauflösung"], ["12.2", "12.3", "29.4"], "Evaluation / Gold", "annotation-guide-v1.md"),
      d("Sampling Strategy", ["proposal", "danphe"], "Die Stichprobe muss EF-Varianten und reale Schwierigkeiten abdecken.", ["Bilde Strata nach Operation Type", "Prüfe die Vielfalt von Projekten und Dateien", "Lege die Hard-Negative-Quote fest"], ["12.1", "18.3"], "Evaluation / Gold", "sampling-plan.csv"),
      d("RQ1-Annotation", ["proposal", "nagy"], "Method, OperationType, DatabaseTarget und Provenance müssen manuell bestätigt werden.", ["Dokumentiere positive Labels", "Bereite FP/FN-Reason-Codes vor", "Öffne und prüfe die zeilengenaue Provenance"], ["7.1", "14.1"], "Evaluation / Gold", "gold-rq1-pilot.jsonl"),
      d("RQ2-Fragensatz", ["sweqa", "proposal"], "Fragen müssen aus Rollen und Answerability Matrix stammen, nicht aus bereits gesehenen Modellantworten.", ["Erstelle Fragen für jeden Use Case", "Balanciere SUPPORTED, PARTIAL und NOT_ANSWERABLE", "Speichere erforderliche Evidenz separat"], ["7.2", "13.3", "14.3"], "Evaluation / Questions", "questions-v1.jsonl"),
      d("Zweitprüfung und Adjudikation", ["proposal"], "15 bis 20 Prozent der Beispiele benötigen eine unabhängige Zweitprüfung.", ["Fixiere die Stichprobe der Zweitprüfung", "Dokumentiere Übereinstimmung und Abweichung", "Bewahre das Adjudikationsprotokoll ohne Löschung von Konflikten"], ["12.3", "18.5"], "Evaluation / Gold", "adjudication-log.csv"),
      d("Pilot/Test Freeze", ["proposal"], "Anpassung am Testset verursacht Leakage.", ["Trenne Development, Pilot und Test", "Dokumentiere den Hash jedes Splits", "Formuliere das Änderungsverbot nach dem Freeze"], ["29.1", "38.11"], "Evaluation / Data", "dataset-manifest.json"),
    ],
  },
  {
    phase: "Phase 6: RQ1-Evaluation",
    phaseId: "rq1-evaluation",
    title: "Precision, Recall und F1 der Extraktion",
    goal: "Genauigkeit und Vollständigkeit des Extractors werden je Operationstyp gemessen.",
    days: [
      d("Experimentkonfiguration RQ1", ["proposal"], "Jeder Lauf benötigt eine eigene Konfiguration und Version.", ["Fixiere die Kategorien", "Definiere Micro- und Macro-Aggregation", "Dokumentiere Tool- und Corpus-Hash"], ["13.1", "14.1", "38.11"], "Evaluation", "rq1-config-v1.yaml"),
      d("READ-Extraktion ausführen", ["danphe", "proposal"], "Rohe READ-Vorhersagen müssen vor der Analyse gespeichert werden.", ["Führe den Extractor auf dem Frozen Corpus aus", "Halte die Vorhersagen unveränderlich", "Dokumentiere Laufzeit und Warnungen"], ["7.1", "13.1"], "Evaluation", "runs/rq1-read/predictions.jsonl"),
      d("WRITE-Extraktion ausführen", ["danphe", "proposal"], "WRITE und Persistence werden getrennt und anschließend kombiniert gemessen.", ["Führe Mutationen aus", "Führe Persistence-Links aus", "Dokumentiere die Anzahl ungelöster Mappings"], ["7.1", "28.2"], "Evaluation", "runs/rq1-write/predictions.jsonl"),
      d("Precision/Recall/F1 berechnen", ["proposal"], "Ergebnisse müssen je Kategorie und aggregiert vorliegen.", ["Ermittle TP, FP und FN", "Berechne Precision, Recall und F1 je Kategorie", "Berichte Micro und Macro getrennt"], ["3.5.8 bis 3.5.13", "14.1"], "Evaluation / Metrics", "rq1-metrics.json"),
      d("RQ1-Fehleranalyse", ["shatnawi", "alshemaimri"], "Eine Zahl ohne Fehlerursache liefert keine Anleitung zur Verbesserung.", ["Klassifiziere False Positives", "Klassifiziere False Negatives", "Trenne Mapping-, Resolution- und Scope-Fehler"], ["15", "18"], "Evaluation / Errors", "rq1-errors.csv"),
      d("RQ1 Freeze und Interpretation", ["hevner", "proposal"], "Eine Regeländerung nach dem Test muss eine neue Experimentversion erzeugen.", ["Beantworte RQ1 mit den Ergebnissen", "Dokumentiere Corpus-Grenzen", "Vermeide überzogene Generalisierung"], ["16", "17", "18"], "Reports", "rq1-result-note.md"),
    ],
  },
  {
    phase: "Phase 6: RQ2-Evaluation",
    phaseId: "rq2-evaluation",
    title: "Flat vs. Graph und Verifier-Ablation",
    goal: "Antwortqualität, Evidenz, Pfad und Refusal werden in zwei kontrollierten Experimenten gemessen.",
    days: [
      d("Vertrag für Experiment A", ["proposal", "draco"], "Flat und Graph werden mit derselben Evidenz und denselben Regeln verglichen.", ["Definiere gemeinsame Fragen", "Gleiche das Retrieval-Budget an", "Halte den Repräsentationsunterschied als einzige Variable"], ["13.2", "29.3"], "Evaluation", "experiment-a.yaml"),
      d("Flat Retrieval ausführen", ["tfidf", "proposal"], "Die rohe Baseline muss ohne Graph-Unterstützung laufen.", ["Führe alle Fragen aus", "Speichere Top-k-Kandidaten", "Dokumentiere Latenz und Coverage"], ["7.2", "14.2"], "Evaluation", "runs/rq2-flat/results.jsonl"),
      d("Graph Retrieval ausführen", ["draco", "cypher"], "Der Graph muss Pfad und Evidenzelement zurückgeben.", ["Führe dieselben Fragen aus", "Speichere zurückgegebene Pfade", "Dokumentiere Latenz und fehlende Pfade"], ["7.2", "14.2"], "Evaluation", "runs/rq2-graph/results.jsonl"),
      d("Experiment B: Verifier-Ablation", ["kilt", "proposal"], "Der Verifier-Effekt muss getrennt vom Graph-Effekt gemessen werden.", ["Führe Graph ohne Verifier aus", "Führe Graph mit Verifier aus", "Vergleiche unbelegte Antworten und Refusals"], ["3.6", "14.3", "29.3"], "Evaluation / Verifier", "experiment-b-results.json"),
      d("RQ2-Metriken", ["proposal", "kilt"], "Die Primärmetriken sind Answer Correctness, Evidence Completeness, Path Validity und Correct Refusal.", ["Berechne alle vier Primärmetriken", "Halte sekundäre Metriken getrennt", "Bewahre die Granularität von Frage, Evidenz und Pfad"], ["14.2", "14.3"], "Evaluation / Metrics", "rq2-metrics.json"),
      d("RQ2-Fehleranalyse", ["sweqa", "proposal"], "Jeder Fehler muss Retrieval, Pfad, Verifier oder Answering zugeordnet werden.", ["Kennzeichne die Fehlerstufe", "Trenne False Refusal und unbelegte Antwort", "Schreibe drei vollständige Fallstudien"], ["15", "18"], "Reports", "rq2-errors-and-cases.md"),
    ],
  },
  {
    phase: "Phase 7: Answerability und Rollen",
    phaseId: "answerability-roles",
    title: "Verlässliche Ausgabe für Developer, Architect und QA",
    goal: "Jede Rolle erhält nur belegte Claims, Evidenzpfade und passende Einschränkungen.",
    days: [
      d("Answerability Matrix", ["proposal", "kilt"], "Das System muss vor der Antwort entscheiden, ob die Evidenz ausreicht.", ["Operationalisiere SUPPORTED", "Operationalisiere PARTIALLY_SUPPORTED", "Fixiere NOT_ANSWERABLE-Gründe"], ["3.6", "14.3"], "Verifier", "answerability-matrix.yaml"),
      d("Developer Output", ["proposal", "sweqa"], "Developer benötigen Method, File, Line und direkte Evidenz.", ["Definiere einen kurzen Claim", "Zeige direkte Source Locations", "Verberge ungelöstes Mapping nicht"], ["1.6", "25.2", "26.1 bis 26.2"], "Answering / Developer", "developer-output.schema.json"),
      d("Architect Output", ["logiclens", "proposal"], "Architects benötigen Pfad, Boundary und Mapping.", ["Zeige den Call Path", "Markiere Projekt- und Repository-Grenzen", "Trenne direkte und abgeleitete Evidenz"], ["1.6", "26.4", "26.6"], "Answering / Architect", "architect-output.schema.json"),
      d("QA/Compliance Output", ["proposal", "nagy"], "QA benötigt Inventar, Coverage und Evidence Gaps.", ["Definiere das READ/WRITE-Inventar", "Zeige Coverage und Unresolved Counts", "Verbinde jeden Claim mit einer SourceLocation"], ["1.5", "1.6", "26.5"], "Answering / QA", "qa-output.schema.json"),
      d("LLM Output Guardrail", ["gpt", "proposal"], "Das LLM darf Text glätten, aber Claims und Evidenz nicht verändern.", ["Mache strukturierte Claims unveränderlich", "Füge eine Citation-Coverage-Prüfung hinzu", "Verwerfe unbelegte Sätze"], ["38.9", "27.1"], "Answering / Guardrails", "answer-validator.cs"),
      d("Rollen-Akzeptanztests", ["sweqa", "proposal"], "Jede Persona muss mit festen Fragen und Erwartungen getestet werden.", ["Führe drei Fragen pro Rolle aus", "Validiere das Ausgabeschema", "Prüfe das Refusal-Verhalten manuell"], ["17", "26"], "Tests / Answering", "role-acceptance-report.md"),
    ],
  },
  {
    phase: "Phase 8: Fehler und Validität",
    phaseId: "validity",
    title: "Fehlertaxonomie und Threats to Validity",
    goal: "Grenzen, Fehler und Generalisierbarkeit werden wissenschaftlich und vertretbar dokumentiert.",
    days: [
      d("Fehlertaxonomie der Extraktion", ["shatnawi", "proposal"], "Syntax-, Symbol-, Mapping- und Persistence-Fehler müssen trennbar sein.", ["Erstelle eine Taxonomie auf Komponentenebene", "Dokumentiere Schweregrad und Behebbarkeit", "Wähle für jede Kategorie ein reales Beispiel"], ["15", "18.1 bis 18.2"], "Reports / Errors", "extraction-error-taxonomy.csv"),
      d("Fehlertaxonomie des Retrievals", ["draco", "sweqa"], "Candidate Miss, Path Miss und Ranking Error haben unterschiedliche Ursachen.", ["Trenne die Fehlerstufen", "Vergleiche flat-only und graph-only", "Kennzeichne mehrdeutige Fragen"], ["15", "18.1"], "Reports / Errors", "retrieval-error-taxonomy.csv"),
      d("Konstrukt- und interne Validität", ["proposal", "hevner"], "Die Metriken müssen tatsächlich das behauptete Konzept messen.", ["Erstelle eine Construct-to-metric Map", "Dokumentiere Leakage- und Tuning-Risiken", "Prüfe Confounder der Experimente A und B"], ["18.1", "18.2"], "Reports / Validity", "validity-internal.md"),
      d("Externe und Schlussfolgerungsvalidität", ["proposal", "danphe"], "Ein Corpus reicht nicht für allgemeine Aussagen über alle C#-Projekte.", ["Dokumentiere Danphe-spezifischen Bias", "Begrenze die Generalisierung auf EF Core", "Berichte statistische Unsicherheit"], ["18.3", "18.4"], "Reports / Validity", "validity-external.md"),
      d("Researcher Bias und Ethik", ["proposal"], "Annotation und Gesundheitsdomäne erfordern Bias-Kontrolle und Lizenzkonformität.", ["Liste manuelle Entscheidungen auf", "Verlinke Evidenz der Zweitprüfung", "Stelle klar, dass keine Patientendaten verwendet werden"], ["18.5", "19"], "Reports / Ethics", "ethics-and-bias.md"),
      d("Validity Review Gate", ["proposal"], "Jeder Ergebnis-Claim benötigt eine entsprechende Einschränkung.", ["Verbinde jeden Ergebnis-Claim mit einem Threat", "Entferne überzogene Formulierungen", "Bereite schwierige Fragen der Betreuung vor"], ["18", "22", "32"], "Reports", "validity-review-checklist.md"),
    ],
  },
  {
    phase: "Phase 9: Schreiben und Abgabe",
    phaseId: "writing-delivery",
    title: "Thesis Draft, Reproduktion und Demo",
    goal: "Artefakt und Ergebnisse werden zu einem reproduzierbaren, mündlich erklärbaren Paket.",
    days: [
      d("Entwurf des Methodenkapitels", ["proposal", "hevner"], "Die Methode muss Corpus, Extractor, Goldstandard und Experiment reproduzierbar erklären.", ["Beschreibe Ein- und Ausgabe jeder Stufe", "Dokumentiere Stop-Regeln und Unsicherheit", "Versioniere die Konfigurationen"], ["11 bis 13", "21"], "Thesis / Method", "method-draft.md", "writing"),
      d("Entwurf des Ergebniskapitels", ["proposal"], "Ergebnisse werden ohne zusätzliche Interpretation und in festen Tabellen berichtet.", ["Tabelliere die RQ1-Metriken", "Tabelliere RQ2 Experiment A und B", "Ergänze Fallstudien mit Evidenzpfad"], ["14", "21"], "Thesis / Results", "results-draft.md", "writing"),
      d("Entwurf der Diskussion", ["proposal", "logiclens"], "Die Diskussion führt zu Forschungsfragen, Related Work und Validität zurück.", ["Beantworte jede Forschungsfrage direkt", "Beschreibe Gemeinsamkeiten und Unterschiede zu verwandten Systemen", "Begrenze Scope und Generalisierung"], ["4 bis 7", "15 bis 18"], "Thesis / Discussion", "discussion-draft.md", "writing"),
      d("Replikationspaket", ["proposal", "codefuse"], "Andere Forschende müssen den Lauf reproduzieren können.", ["Führe Build- und Run-Anweisungen aus", "Prüfe Konfiguration, Hash und Output-Manifest", "Reduziere fehlende Abhängigkeiten auf null"], ["11.3", "17", "38.11"], "Release", "replication-package-v1.zip", "writing"),
      d("Demo und Präsentation", ["proposal"], "Der Wert des Artefakts muss an einem kurzen realen Pfad sichtbar werden.", ["Zeige Problem→Evidenz→Antwort", "Zeige eine korrekte Ablehnung", "Nenne Grenzen auf der Schlussfolie"], ["24", "32"], "Presentation", "demo-script-fa-de-en.md", "writing"),
      d("Finaler Reproduktionslauf", ["proposal", "danphe"], "Die Abgabe ist erst nach einem sauberen, erfolgreichen Lauf valide.", ["Führe den Lauf aus einem sauberen Checkout aus", "Dokumentiere alle Output-Hashes", "Bereite Release Tag und Changelog vor"], ["17", "20.2", "38.11"], "Release", "release-candidate-1", "writing"),
    ],
  },
  {
    phase: "Puffer 1",
    phaseId: "buffer-one",
    title: "Blocker beheben, ohne den Scope zu erweitern",
    goal: "Nur blockierende Fehler, fehlgeschlagene Tests und dokumentierte Lücken werden behoben.",
    days: [
      d("Blocker-Triage", ["proposal"], "Der Puffer ist nicht für neue Funktionen da, sondern beseitigt Abgabehindernisse.", ["Bewerte Blocker nach Schweregrad", "Trenne must-fix und can-document", "Verbinde jeden Punkt mit RQ oder Erfolgskriterium"], ["20.2", "37"], "Project Management", "blocker-board.md", "buffer"),
      d("Extraktionsfehler beheben", ["proposal", "roslynSemantic"], "Der größte RQ1-Fehler wird mit der kleinsten kontrollierten Änderung behoben.", ["Wähle eine Root Cause", "Erstelle vor dem Fix einen Regressionstest", "Erhöhe RuleVersion"], ["14.1", "15"], "Extractors", "extractor-hotfix + test", "buffer"),
      d("Retrieval/Verifier beheben", ["proposal", "draco"], "Nur der im Pilot gezeigte Fehler wird behoben und neu gemessen.", ["Bestätige die Fehlerstufe", "Füge einen festen Test hinzu", "Wiederhole den A/B-Vergleich"], ["14.2 bis 14.3", "15"], "Retrieval / Verifier", "retrieval-hotfix + metrics", "buffer"),
      d("Dokumentationslücke", ["proposal"], "Jedes wichtige Verhalten muss in Methode oder Capability Matrix auffindbar sein.", ["Finde undokumentierte Regeln", "Ergänze Ein- und Ausgabe sowie Grenzen", "Prüfe Links zwischen Code und Text"], ["11", "38"], "Docs", "documentation-gap-log.md", "buffer"),
      d("Fragen der Betreuung", ["proposal"], "Schwierige Fragen sollten vor dem Gespräch sichtbar werden.", ["Formuliere fünf methodische Fragen", "Formuliere fünf Scope-Fragen", "Nimm eine zweiminütige Antwort für jede Frage auf"], ["22", "32"], "Presentation", "supervisor-qa.md", "buffer"),
      d("Puffer-Gate", ["proposal"], "Der Puffer wird erst geschlossen, wenn der Release Candidate wieder grün ist.", ["Schließe alle must-fix-Punkte", "Führe vollständigen Test und Reproduktion aus", "Dokumentiere übrige Punkte als Einschränkung"], ["17", "20.2"], "Release", "release-candidate-2", "buffer"),
    ],
  },
  {
    phase: "Puffer 2 und Abschluss",
    phaseId: "buffer-two",
    title: "Finale Abgabe ohne offene Schulden",
    goal: "Dateien, Präsentation und Fortschrittsbericht werden finalisiert; neuer Scope ist verboten.",
    days: [
      d("Finales Datenaudit", ["proposal"], "Rohdaten, Metriken und Tabellen müssen konsistent sein.", ["Gleiche die Hashes ab", "Vergleiche Zahlen in Text und JSON", "Verbinde jedes Diagramm mit seiner Quelldatei"], ["14", "38.11"], "Evaluation / Audit", "final-data-audit.md", "buffer"),
      d("Finales Quellenaudit", ["proposal", "danphe"], "Versionen von Code, Corpus und Abhängigkeiten müssen exakt dokumentiert sein.", ["Dokumentiere alle Commits", "Prüfe die Lizenzen erneut", "Führe einen Clean Build aus"], ["9.3", "11.3", "19"], "Release / Audit", "source-audit.md", "buffer"),
      d("Finaler Thesis-Quervergleich", ["proposal"], "Jede Forschungsfrage braucht passende Methode, Ergebnis und Diskussion.", ["Prüfe die Traceability von RQ1", "Prüfe die Traceability von RQ2", "Lasse keinen Claim ohne Ergebnis"], ["7", "16", "21"], "Thesis", "thesis-traceability-matrix.csv", "buffer"),
      d("Finale Präsentationsprobe", ["proposal"], "Die Präsentation muss unabhängig vom Text und in kontrollierter Zeit funktionieren.", ["Halte die Präsentation mit Zeitmessung", "Übe den Fallback bei Demo-Ausfall", "Beantworte drei schwierige Fragen frei"], ["24", "32"], "Presentation", "rehearsal-record.md", "buffer"),
      d("Archiv und Übergabe", ["proposal"], "Die Abgabeversion muss von Arbeitsdateien getrennt sein.", ["Liste die Release-Artefakte", "Teste das Schnellstart-README", "Erzeuge Backup und Prüfsumme"], ["17", "20.2"], "Release", "final-handoff.zip", "buffer"),
      d("Programmabschluss und Fortschrittsrückblick", ["proposal", "hevner"], "Der letzte Tag fasst die Evidenz der geleisteten Arbeit zusammen und fügt nichts Neues hinzu.", ["Hake die Ergebnisse jeder Phase ab", "Notiere wichtigste Erkenntnis und Einschränkung", "Formuliere die erste Handlung nach der Abgabe in einem Satz"], ["16", "17", "20"], "Reports", "final-progress-report.md", "buffer"),
    ],
  },
];

type ScheduledWeekSpec = (typeof technicalWeekSpecs)[number] & {
  startDate?: string;
  technicalIndex?: number;
};

const designWeekSpecs: ScheduledWeekSpec[] = [
  {
    phase: "Design 1: Problem und Anforderungen",
    phaseId: "design-requirements",
    title: "Problem, Stakeholder und vertretbarer Scope",
    goal: "Vor dem Coding werden Problem, Nutzende, Anforderungen und Projektgrenzen präzise und testbar.",
    startDate: "2026-08-04",
    days: [
      d("Problemstellung und Projektwert", ["proposal", "hevner"], "Ohne präzises Problem zerfallen Architektur und Implementierung in unverbundene Funktionen.", ["Formuliere das Kernproblem der Cross-Repository-Analyse in einem Satz", "Kläre den Unterschied zwischen Evidenz und Textähnlichkeit", "Beschreibe den Artefaktwert für drei Rollen getrennt"], ["1", "6", "7"], "Design / Problem Framing", "problem-statement-v1.md"),
      d("Stakeholder und Personas", ["proposal", "sweqa"], "Developer, Architect und QA benötigen unterschiedliche Fragen und Evidenzstufen.", ["Extrahiere das Ziel jeder Persona", "Bestimme die Entscheidung, die jede Rolle mit der Antwort trifft", "Dokumentiere Informationen, die einer Rolle nicht gezeigt werden dürfen"], ["1.6", "25", "26"], "Design / Stakeholders", "stakeholders-and-personas.md"),
      d("Funktionale Anforderungen", ["proposal", "logiclens"], "Jede Fähigkeit braucht Eingabe, Ausgabe und Akzeptanzkriterium.", ["Trenne Extract, Map, Persist, Retrieve und Answer", "Definiere Ein- und Ausgabe jeder Fähigkeit", "Verbinde jede Anforderung mit einer Forschungsfrage"], ["3", "7", "10"], "Design / Requirements", "functional-requirements.yaml"),
      d("Nichtfunktionale Anforderungen", ["proposal", "arc42"], "Reproduzierbarkeit, Erklärbarkeit und Sicherheit steuern Architekturentscheidungen.", ["Priorisiere die wichtigsten Qualitätsziele", "Definiere Kriterien für Determinismus und Traceability", "Dokumentiere Zeit-, Daten- und Technologiegrenzen"], ["9", "11.3", "17", "38"], "Design / Quality Attributes", "quality-attribute-scenarios.md"),
      d("Grenze von Core, Extension und Future", ["proposal", "alshemaimri"], "Ein fester Scope verhindert, dass das Projekt vor der Evaluation endlos wird.", ["Fixiere Roslyn, EF Core und Tabellenebene im Core", "Trenne Fähigkeiten, die von Beobachtungen im Corpus abhängen", "Verschiebe ADO.NET, SQL, Stored Procedures und neuronale Ansätze nach Future"], ["8", "31", "37"], "Design / Scope", "scope-boundary-v1.md"),
      d("Anforderungs-Review-Gate", ["proposal", "hevner"], "Die Woche endet erst, wenn jede Anforderung nachvollziehbar und testbar ist.", ["Finde mehrdeutige Anforderungen", "Verbinde jede Anforderung mit RQ und Persona", "Reduziere Anforderungen ohne Akzeptanzkriterium auf null"], ["7", "16", "20"], "Design / Review", "requirements-review-checklist.md"),
    ],
  },
  {
    phase: "Design 2: Systemarchitektur",
    phaseId: "design-architecture",
    title: "C4, Datenfluss und Modulgrenzen",
    goal: "Systemstruktur von Context bis Component sowie Modulverträge werden vor der Implementierung fixiert.",
    startDate: "2026-08-11",
    days: [
      d("System Context Diagram", ["c4", "proposal"], "Das Diagramm zeigt die Beziehungen zu Nutzenden, GitHub/lokalen Repositories, Neo4j und LLM.", ["Bestimme externe Personen und Softwaresysteme", "Definiere Vertrauen und Eigentum jeder Boundary", "Entferne Technologiedetails aus dem Context"], ["1.6", "3", "9"], "Architecture / C4", "c4-context.dsl"),
      d("Container Diagram", ["c4", "arc42"], "Container trennen Ausführung, Speicherung und Benutzeroberfläche.", ["Grenze CLI/API, Extractor, Graph Store und UI ab", "Beschreibe Protokoll und übertragene Daten jeder Beziehung", "Definiere jeden Container als stateful oder stateless"], ["3", "10", "38.2"], "Architecture / C4", "c4-containers.dsl"),
      d("Component Diagram und M1–M3", ["c4", "proposal"], "Extraktion, Evidenzmodellierung und Retrieval benötigen überschneidungsfreie Verantwortungen.", ["Formuliere die Verantwortung von M1, M2 und M3 in je einem Satz", "Richte erlaubte Modulabhängigkeiten aus", "Entferne jeden Abhängigkeitszyklus"], ["3.1 bis 3.6", "10"], "Architecture / Components", "c4-components.dsl"),
      d("End-to-End- und Sequenzfluss", ["proposal", "nagy"], "Ein reales Szenario muss von Source Code bis zur Antwort mit Evidenz verfolgbar sein.", ["Zeichne Repository→Facts→Evidence→Graph→Answer", "Markiere Erzeugungspunkte der SourceLocation", "Dokumentiere Failure- und Refusal-Punkte"], ["3", "10.2", "27"], "Architecture / Dynamic View", "e2e-sequence.mmd"),
      d("Verträge zwischen Modulen", ["proposal", "shatnawi"], "Stabile Verträge ermöglichen unabhängige Tests von Extractor, Storage und Retrieval.", ["Definiere Ein- und Ausgabe-DTOs jedes Moduls", "Lege Versionierung und Rückwärtskompatibilität fest", "Modelliere erwartete Fehler und Unresolved explizit"], ["3.2", "3.5", "38.2"], "Architecture / Contracts", "module-contracts-v1.md"),
      d("ADRs für Architekturentscheidungen", ["adr", "proposal"], "Begründung, verworfene Alternativen und Folgen müssen erhalten bleiben.", ["Erstelle ADRs für Roslyn, Neo4j und JSONL", "Beschreibe Alternativen und Trade-offs", "Dokumentiere Status und Confidence jeder Entscheidung"], ["8", "10", "37"], "Architecture / Decisions", "adr/0001-0003.md"),
    ],
  },
  {
    phase: "Design 3: Domänen- und Evidenzmodell",
    phaseId: "design-evidence-model",
    title: "Gemeinsame Sprache, Program Graph und Provenance",
    goal: "Entitäten, Beziehungen, Evidenz und Unsicherheitsstatus werden schriftlich und in JSON-Beispielen fixiert.",
    startDate: "2026-08-18",
    days: [
      d("Domänenglossar", ["proposal", "allamanis"], "Gemeinsame Begriffe verhindern Bedeutungsunterschiede zwischen Text, Code und Graph.", ["Definiere Fact, Evidence, Claim und Path getrennt", "Präzisiere Repository, Project, File, Type und Method", "Operationalisiere READ, WRITE und Persistence"], ["2", "3.2", "3.3"], "Domain Model", "domain-glossary.md"),
      d("Node Types des Program Graph", ["allamanis", "yamaguchi"], "Nodes sollen Projektfragen dienen und nicht den gesamten AST kopieren.", ["Liste Nodes von Repository bis Table", "Bestimme notwendige Identität und Properties jedes Nodes", "Entferne Nodes ohne Nutzen für die Forschungsfragen"], ["3.3", "10.3"], "Graph Model", "node-catalog-v1.yaml"),
      d("Relationship Types", ["yamaguchi", "nagy"], "Jede Kante benötigt klare Richtung, Bedeutung, Quelle und Erzeugungsregel.", ["Definiere DEFINES, INVOKES und MAPS_TO", "Definiere MUTATES, PERSISTS, READS_FROM und WRITES_TO", "Kennzeichne jede Beziehung als DIRECT oder DERIVED"], ["3.3", "10.3", "38.5"], "Graph Model", "relationship-catalog-v1.yaml"),
      d("EvidenceRecord und SourceLocation", ["proposal", "shatnawi"], "Ohne Datei, Zeile und Regel ist kein Claim prüfbar.", ["Bestimme die Felder des EvidenceRecord", "Mache Repository, Commit, File und Line verpflichtend", "Ergänze RuleId, RuleVersion und ExtractorVersion"], ["3.2", "38.4 bis 38.6"], "Evidence Model", "evidence-record.schema.json"),
      d("Unsicherheit und Answer Status", ["proposal", "kilt"], "Das System muss Nichtwissen modellieren und erfundene Antworten verhindern.", ["Definiere OBSERVED, DERIVED, UNRESOLVED und CONFLICTING", "Definiere SUPPORTED, PARTIALLY_SUPPORTED und NOT_ANSWERABLE", "Formuliere die Regel von Evidenz zu Answer Status"], ["3.6", "14.3", "27"], "Verifier / Status Model", "evidence-and-answer-status.yaml"),
      d("Vertical Slice auf Papier", ["proposal", "danphe"], "Ein Beispielpfad zeigt Modellfehler vor dem Coding.", ["Wähle einen realen Pfad Controller→Service→Repository", "Schreibe alle Nodes, Edges und Evidenzelemente manuell", "Markiere Lücken in Schema und Contract"], ["10.2", "12", "26"], "Design / Walkthrough", "manual-vertical-slice.json"),
    ],
  },
  {
    phase: "Design 4: Test und Evaluation",
    phaseId: "design-evaluation",
    title: "Goldstandard, RQ1/RQ2 und Teststrategie",
    goal: "Vor dem Bau des Artefakts wird die Messung von Erfolg und Scheitern vollständig definiert.",
    startDate: "2026-08-25",
    days: [
      d("Akzeptanzkriterien des Gesamtsystems", ["proposal", "hevner"], "Die Definition of Done muss von Evidenz und Forschungsfragen abhängen, nicht vom guten Eindruck einer Demo.", ["Extrahiere die Erfolgskriterien des Artefakts", "Trenne verpflichtende und sekundäre Metriken", "Markiere Schwellenwerte, die Betreuungsgenehmigung benötigen"], ["16", "17", "20"], "Evaluation / Acceptance", "system-acceptance-criteria.md"),
      d("Annotationsprotokoll entwerfen", ["proposal", "sweqa"], "Der Goldstandard ist nur mit stabiler Annotationseinheit und Anleitung valide.", ["Definiere die Einheiten Method, Table und Relation", "Definiere Positive, Negative und Hard Negative", "Beschreibe Disagreement- und Zweitprüfungsprozess"], ["12", "13.3", "29.4"], "Evaluation / Gold", "annotation-guideline-v1.md"),
      d("Experiment A für RQ1 entwerfen", ["proposal", "shatnawi"], "Precision, Recall und F1 müssen auf zählbaren Fakten berechnet werden.", ["Bestimme die Extraktionseinheiten", "Formuliere TP/FP/FN-Regeln für jede Relation", "Trenne Macro- und Micro-Reporting"], ["7.1", "13", "14.1"], "Evaluation / RQ1", "rq1-experiment-design.md"),
      d("Experiment B für RQ2 entwerfen", ["proposal", "draco", "kilt"], "Flat und Graph müssen mit denselben Fragen, demselben Corpus und k verglichen werden.", ["Definiere unabhängige Variable und Konstanten", "Operationalisiere Answer Correctness und Evidence Completeness", "Definiere Path Validity und Correct Refusal"], ["7.2", "14.2 bis 14.3", "29.3"], "Evaluation / RQ2", "rq2-experiment-design.md"),
      d("Testpyramide und Fixture-Strategie", ["proposal", "roslynSyntax"], "Die meisten Fehler sollen vor dem vollständigen Lauf durch kleine deterministische Tests auffallen.", ["Trenne Unit-, Golden-, Integrations- und E2E-Tests", "Entwirf Fixtures für Roslyn und EF", "Dokumentiere deterministische Reihenfolge und Snapshot-Richtlinie"], ["17", "38.10"], "Quality / Test Design", "test-strategy.md"),
      d("Threats to Validity vor der Ausführung", ["proposal", "hevner"], "Risiken werden vor Sichtung der Ergebnisse festgehalten, um gerichtete Interpretation zu vermeiden.", ["Dokumentiere Construct- und Internal-Threats", "Dokumentiere External- und Conclusion-Threats", "Erfasse Mitigation und Restrisiko jedes Punkts"], ["18"], "Evaluation / Validity", "pre-registered-validity-risks.md"),
    ],
  },
  {
    phase: "Design 5: Umsetzungsplan",
    phaseId: "design-delivery-plan",
    title: "Corpus, Repository-Struktur und technisches Backlog",
    goal: "Das Design wird in einen versionierten, planbaren und eindeutigen Umsetzungsplan überführt.",
    startDate: "2026-09-01",
    days: [
      d("Corpus Manifest und Freeze Plan", ["danphe", "proposal"], "Eine feste Eingabe ist Voraussetzung für reproduzierbare Ergebnisse.", ["Dokumentiere den festen Danphe-Commit", "Bestimme Solutions und Projects im Scope", "Dokumentiere Lizenz, Build und Ausschlüsse"], ["9.2 bis 9.3", "11.3"], "Delivery / Corpus", "corpus-manifest-v1.yaml"),
      d("Repository- und Ordnerstruktur", ["arc42", "proposal"], "Die Dateistruktur muss Architekturgrenzen und Testzyklus widerspiegeln.", ["Entwirf src, tests, corpus, gold und reports", "Ordne jedem Ordner ein verantwortliches Modul zu", "Trenne generierte Ausgabe vom Quellcode"], ["10", "11", "17"], "Delivery / Repository", "repository-layout.md"),
      d("Build, Versionierung und Reproduktion", ["adr", "proposal"], "Jeder Lauf muss vom ersten Tag an mit Konfiguration und Version reproduzierbar sein.", ["Dokumentiere Versionen von Toolchain und Abhängigkeiten", "Entwirf RunId, ConfigHash und CorpusCommit", "Definiere Befehle für Clean Build, Test und Run"], ["11.3", "17", "38.11"], "Delivery / Reproduction", "reproduction-plan.md"),
      d("Abhängigkeitsgraph und Implementierungsreihenfolge", ["c4", "proposal"], "Arbeit wird nach technischen Abhängigkeiten statt nach Technologieattraktivität geordnet.", ["Überführe M1, M2, M3 und Evaluation in Meilensteine", "Zeichne Abhängigkeiten und kritischen Pfad", "Kennzeichne parallele und blockierte Arbeit"], ["10", "20"], "Delivery / Roadmap", "implementation-dependency-map.mmd"),
      d("Backlog mit Definition of Done", ["proposal", "sweqa"], "Jede Story benötigt Ergebnis, Test und Beziehung zu einer Forschungsfrage.", ["Zerlege Epics in Stories von höchstens zwei Tagen", "Ergänze Akzeptanzkriterien und Evidenzartefakt", "Wende die Scope-Labels Core, Extension und Future an"], ["8", "16", "20"], "Delivery / Backlog", "technical-backlog-v1.csv"),
      d("Design Review Version 1", ["arc42", "proposal"], "Ein Gesamtüberblick deckt Widersprüche zwischen Anforderung, Architektur, Modell und Evaluation auf.", ["Führe das End-to-End-Szenario erneut durch", "Liste Traceability Gaps", "Gib offenen Entscheidungen eine verantwortliche Person und Frist"], ["16", "20", "38"], "Design / Review", "design-review-v1.md"),
    ],
  },
  {
    phase: "Design 6: Finalisierung",
    phaseId: "design-freeze",
    title: "Traceability, Baseline und Oktober-Bereitschaft",
    goal: "Bis 9. September wird das Design versioniert; danach sind nur kontrollierte Änderungen erlaubt.",
    startDate: "2026-09-08",
    days: [
      d("Vollständige Traceability Matrix", ["proposal", "hevner"], "Keine Anforderung, kein Modul, kein Test und keine Forschungsfrage darf unverbunden bleiben.", ["Verbinde Requirement→Component", "Verbinde Component→Test/Metric", "Verbinde Metric→RQ/Thesis Section"], ["7", "16", "21"], "Design / Traceability", "traceability-matrix.csv"),
      d("Design Freeze und Readiness Gate", ["proposal", "adr", "arc42"], "Der 9. September beendet das Design; die Ergebnisse müssen für den unabhängigen Start am 1. Oktober ausreichen.", ["Schließe alle Design-Checklisten", "Versioniere ADRs und erlaubte offene Punkte", "Bereite den ersten technischen Oktobertag und seine Eingaben vor"], ["16", "20", "37"], "Design / Baseline", "design-baseline-2026-09-09.zip"),
    ],
  },
];

const technicalOrder = [
  "scope-corpus",
  "roslyn-syntax",
  "roslyn-semantic",
  "ef-read",
  "ef-write",
  "evidence-model",
  "neo4j-graph",
  "nlp-foundations",
  "nlp-sequences",
  "nlp-transformers",
  "retrieval-query",
  "goldstandard",
  "rq1-evaluation",
  "rq2-evaluation",
  "answerability-roles",
  "validity",
  "writing-delivery",
  "buffer-one",
  "buffer-two",
];

const orderedTechnicalWeeks: ScheduledWeekSpec[] = technicalOrder.map(
  (phaseId, technicalIndex) => {
    const week = technicalWeekSpecs.find((item) => item.phaseId === phaseId);
    if (!week) throw new Error(`Missing technical week: ${phaseId}`);
    return { ...week, technicalIndex };
  },
);

const scheduledWeekSpecs: ScheduledWeekSpec[] = [
  ...designWeekSpecs,
  ...orderedTechnicalWeeks,
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export const planWeeks: PlanWeek[] = scheduledWeekSpecs.map((week, weekIndex) => {
  const weekStart = week.startDate
    ? new Date(`${week.startDate}T12:00:00Z`)
    : addUtcDays(
        new Date("2026-10-01T12:00:00Z"),
        (week.technicalIndex ?? 0) * 7,
      );
  const dates: Date[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addUtcDays(weekStart, offset);
    if (candidate.getUTCDay() !== 0) dates.push(candidate);
  }

  const days = week.days.map((spec, dayIndex) => {
    const scheduledDate = dates[dayIndex];
    if (!scheduledDate) {
      throw new Error(
        `Week ${week.phaseId} has ${week.days.length} days but only ${dates.length} schedulable dates`,
      );
    }
    const date = isoDate(scheduledDate);
    const taskMinutes: [number, number, number] = spec.kind === "course" ? [105, 70, 35] : [70, 90, 50];
    const proposalText = spec.proposal.map((item) => `§ ${item}`).join(", ");
    const taskItems = [
      spec.lookFor,
      [
        `Verbinde diese drei Punkte mit ${proposalText}`,
        `Führe ein reales Beispiel oder Fixture in ${spec.module} aus`,
        "Dokumentiere eine SourceLocation oder einen rückverfolgbaren Beleg für das Ergebnis",
      ] as [string, string, string],
      [
        `Erstelle das Tagesergebnis: ${spec.deliverable}`,
        "Führe mindestens einen Test, Sanity Check oder eine unabhängige Prüfung durch",
        "Speichere den kurzen Tagesbericht und setze den Status auf „Erledigt“",
      ] as [string, string, string],
    ];
    const taskTitles = ["1. Finden und verstehen", "2. Mit dem Projekt verbinden", "3. Ergebnis erstellen"];

    return {
      ...spec,
      id: date,
      date,
      week: weekIndex + 1,
      phase: week.phase,
      phaseId: week.phaseId,
      weekTitle: week.title,
      taskMinutes,
      tasks: taskTitles.map((title, taskIndex) => ({
        id: `${date}-task-${taskIndex + 1}`,
        title,
        minutes: taskMinutes[taskIndex],
        items: taskItems[taskIndex].map((label, itemIndex) => ({
          id: `${date}-t${taskIndex + 1}-i${itemIndex + 1}`,
          label,
        })),
      })),
    } satisfies PlannedDay;
  });

  return {
    number: weekIndex + 1,
    phase: week.phase,
    phaseId: week.phaseId,
    title: week.title,
    goal: week.goal,
    days,
  };
});

export const allDays = planWeeks.flatMap((week) => week.days);
export const allTaskItems = allDays.flatMap((day) =>
  day.tasks.flatMap((task) => task.items),
);

export const planMeta = {
  start: "2026-08-04",
  designEnd: "2026-09-09",
  restStart: "2026-09-10",
  restEnd: "2026-09-30",
  technicalStart: "2026-10-01",
  end: allDays[allDays.length - 1]?.date ?? "2027-02-10",
  designDays: planWeeks
    .filter((week) => week.phaseId.startsWith("design-"))
    .reduce((sum, week) => sum + week.days.length, 0),
  technicalDays: planWeeks
    .filter((week) => !week.phaseId.startsWith("design-"))
    .reduce((sum, week) => sum + week.days.length, 0),
  totalWeeks: planWeeks.length,
  totalDays: allDays.length,
  totalItems: allTaskItems.length,
  plannedHours: allDays.length * 4,
};
