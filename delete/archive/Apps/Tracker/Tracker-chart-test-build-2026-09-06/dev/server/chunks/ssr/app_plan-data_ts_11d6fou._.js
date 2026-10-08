module.exports = [
"[project]/app/plan-data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ARTICLE_READING_POLICIES",
    ()=>ARTICLE_READING_POLICIES,
    "LEGACY_ID_MIGRATION",
    ()=>LEGACY_ID_MIGRATION,
    "PLAN_VERSION",
    ()=>PLAN_VERSION,
    "PLAN_VERSION_HISTORY",
    ()=>PLAN_VERSION_HISTORY,
    "PREVIOUS_PLAN_DAY_DATES",
    ()=>PREVIOUS_PLAN_DAY_DATES,
    "allDays",
    ()=>allDays,
    "allTaskItems",
    ()=>allTaskItems,
    "articleReadingPolicy",
    ()=>articleReadingPolicy,
    "articleReadings",
    ()=>articleReadings,
    "courseTransferForSession",
    ()=>courseTransferForSession,
    "defaultSettings",
    ()=>defaultSettings,
    "extractionSections",
    ()=>extractionSections,
    "isNlpCatchUpSession",
    ()=>isNlpCatchUpSession,
    "isNlpRemainingLiveSession",
    ()=>isNlpRemainingLiveSession,
    "learningResourceIdsForDay",
    ()=>learningResourceIdsForDay,
    "learningResources",
    ()=>learningResources,
    "learningResourcesForDay",
    ()=>learningResourcesForDay,
    "migrateLegacyId",
    ()=>migrateLegacyId,
    "migrateLegacyIds",
    ()=>migrateLegacyIds,
    "nlpCourseFileNames",
    ()=>nlpCourseFileNames,
    "nlpCourseMeta",
    ()=>nlpCourseMeta,
    "nlpCourseSessions",
    ()=>nlpCourseSessions,
    "nlpCourseTransferPlans",
    ()=>nlpCourseTransferPlans,
    "nlpLabDefinition",
    ()=>nlpLabDefinition,
    "nlpSessionsRelatedToPlanDay",
    ()=>nlpSessionsRelatedToPlanDay,
    "planMeta",
    ()=>planMeta,
    "planWeeks",
    ()=>planWeeks,
    "plannedWorkMode",
    ()=>plannedWorkMode,
    "sourceReadingPolicy",
    ()=>sourceReadingPolicy,
    "sources",
    ()=>sources,
    "trackerRestartPlan",
    ()=>trackerRestartPlan
]);
const nlpCourseMeta = {
    name: "Advanced Deep Learning – Natural Language Processing",
    instructor: "Farshid Shirafkan",
    platform: "Google Meet",
    schedule: "Saturday, Monday, and Wednesday",
    berlinTime: "19:30–21:10",
    iranTime: "21:00–22:40",
    sessionCount: 10,
    sessionMinutes: 100,
    startDate: "2026-08-17",
    endDate: "2026-09-07"
};
const ARTICLE_READING_POLICIES = {
    DEEP: {
        scope: "full",
        label: "Vollständig lesen",
        requiredSections: [
            "Gesamter Artikel – vom Abstract bis zur Conclusion einschließlich Evaluation und Limitations"
        ]
    },
    TARGET: {
        scope: "sections",
        label: "Nur diese Abschnitte lesen",
        requiredSections: [
            "Abstract",
            "Method / Approach",
            "Data / Evaluation",
            "Results",
            "Limitations / Threats"
        ]
    },
    REVIEW: {
        scope: "sections",
        label: "Nur diese Abschnitte lesen",
        requiredSections: [
            "Abstract",
            "Taxonomy / Overview",
            "Limitations / Open Problems",
            "Conclusion"
        ]
    },
    RELATED: {
        scope: "sections",
        label: "Nur diese Abschnitte lesen",
        requiredSections: [
            "Abstract",
            "Method / Approach",
            "Conclusion / Limitations"
        ]
    }
};
function articleReadingPolicy(reading) {
    return ARTICLE_READING_POLICIES[reading.mode];
}
const learningResources = {
    researchProcess: {
        id: "researchProcess",
        title: "Conducting Research",
        provider: "Purdue Online Writing Lab",
        href: "https://owl.purdue.edu/owl/research_and_citation/conducting_research/index.html",
        read: "Starting the Research Process und Choosing a Topic; nutze nur die Schritte von Problem zu fokussierbarer Frage.",
        apply: "Formuliere Problem, Ziel und geplanten Beleg getrennt, bevor du das Tagesartefakt beginnst.",
        minutes: 15
    },
    researchQuestion: {
        id: "researchQuestion",
        title: "How to Write a Research Question",
        provider: "George Mason University Writing Center",
        href: "https://writingcenter.gmu.edu/writing-resources/research-based-writing",
        read: "What is a research question?, Why is it essential? und Steps to developing a research question.",
        apply: "Prüfe RQ1/RQ2 auf Fokus, Messbarkeit, Machbarkeit und Bezug zu einem einzigen Problem.",
        minutes: 12
    },
    personas: {
        id: "personas",
        title: "Personas: Study Guide",
        provider: "Nielsen Norman Group",
        href: "https://www.nngroup.com/articles/personas-study-guide/",
        read: "What Is a Persona? sowie die ersten Hinweise unter How to Create Personas.",
        apply: "Beschreibe Developer, Architect und QA anhand von Ziel, Entscheidung, Kontext und Informationsbedarf statt nur anhand ihrer Jobtitel.",
        minutes: 15
    },
    userNeeds: {
        id: "userNeeds",
        title: "Learning about users and their needs",
        provider: "GOV.UK Service Manual",
        href: "https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs",
        read: "Understanding user needs, Writing user needs und Linking user needs to user stories.",
        apply: "Schreibe jeden Bedarf als Ziel und Nutzen; behandle unbelegte Annahmen ausdrücklich als Annahmen.",
        minutes: 15
    },
    userStories: {
        id: "userStories",
        title: "User stories with examples and a template",
        provider: "Atlassian Agile Coach",
        href: "https://www.atlassian.com/agile/project-management/user-stories",
        read: "What is in a user story?, die 3 C's und User story template.",
        apply: "Überführe Persona, Ziel und Nutzen in As a / I want / so that und ergänze testbare Bestätigung.",
        minutes: 12
    },
    acceptanceCriteria: {
        id: "acceptanceCriteria",
        title: "Acceptance criteria: definition, examples and tips",
        provider: "Atlassian",
        href: "https://www.atlassian.com/work-management/project-management/acceptance-criteria",
        read: "Acceptance criteria vs. user story und die Beispiele für klare, messbare Bedingungen.",
        apply: "Formuliere Erfolg als beobachtbare Bedingung; vermeide Formulierungen wie ‚funktioniert gut‘.",
        minutes: 12
    },
    definitionDone: {
        id: "definitionDone",
        title: "What is the Definition of Done?",
        provider: "Atlassian",
        href: "https://www.atlassian.com/agile/project-management/definition-of-done",
        read: "Build a completion checklist und Assign acceptance criteria to user stories.",
        apply: "Beende die Arbeit erst mit Artefakt, Test oder Sanity Check und rückverfolgbarem Beleg.",
        minutes: 10
    },
    qualityScenarios: {
        id: "qualityScenarios",
        title: "How to specify quality requirements",
        provider: "arc42 Quality Model",
        href: "https://quality.arc42.org/articles/specify-quality-requirements",
        read: "Quality Attribute Scenarios: stimulus, artifact, environment, response und metric.",
        apply: "Mache Reproduzierbarkeit, Erklärbarkeit oder Sicherheit mit einer messbaren Reaktion prüfbar.",
        minutes: 15
    },
    c4Model: {
        id: "c4Model",
        title: "C4 model diagrams",
        provider: "C4 Model",
        href: "https://c4model.com/diagrams",
        read: "System Context, Container und Component diagram; Code diagram nur bei echtem Mehrwert.",
        apply: "Wähle genau die Zoomstufe des Tages und beschrifte Personen, Systeme, Container und Beziehungen.",
        minutes: 15
    },
    architectureDecision: {
        id: "architectureDecision",
        title: "Maintain an architecture decision record",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record",
        read: "Implement an ADR und Suggested characteristics of an individual record.",
        apply: "Dokumentiere Kontext, Optionen, Entscheidung, Trade-offs, Status und Confidence.",
        minutes: 15
    },
    roslynModel: {
        id: "roslynModel",
        title: ".NET Compiler Platform SDK concepts and object model",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/compiler-api-model",
        read: "Compiler pipeline functional areas und API layers, besonders Syntax und Workspaces.",
        apply: "Ordne die Tagesaufgabe der richtigen Roslyn-Schicht zu, bevor du APIs auswählst.",
        minutes: 18
    },
    roslynSemantics: {
        id: "roslynSemantics",
        title: "Work with the Roslyn semantic model",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/work-with-semantics",
        read: "Compilation, Symbols und Semantic model.",
        apply: "Nutze Symbolidentität statt Textnamen, wenn Aufrufe, Typen oder projektübergreifende Referenzen gemeint sind.",
        minutes: 18
    },
    efCoreOverview: {
        id: "efCoreOverview",
        title: "Overview of Entity Framework Core",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/ef/core/",
        read: "The model, Querying und Saving data.",
        apply: "Unterscheide DbContext, DbSet, Entity, Query und persistierende Operation, bevor du Evidenzregeln formulierst.",
        minutes: 15
    },
    efCoreQuerying: {
        id: "efCoreQuerying",
        title: "Querying Data with EF Core",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/ef/core/querying/",
        read: "Loading, filtering und den Hinweis zur Übersetzung von LINQ in providerspezifische Queries.",
        apply: "Markiere Query-Kandidat, Materialisierung und tatsächlichen READ-Beleg getrennt.",
        minutes: 15
    },
    efCoreSaving: {
        id: "efCoreSaving",
        title: "Saving Data with EF Core",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/ef/core/saving/",
        read: "Change tracking and SaveChanges sowie ExecuteUpdate and ExecuteDelete.",
        apply: "Trenne Mutation im Speicher von der Operation, die wirklich in die Datenbank persistiert.",
        minutes: 18
    },
    jsonSchema: {
        id: "jsonSchema",
        title: "Creating your first JSON Schema",
        provider: "JSON Schema",
        href: "https://json-schema.org/learn/getting-started-step-by-step",
        read: "Create a schema definition, Define properties und Validate JSON data.",
        apply: "Definiere Pflichtfelder, Typen und ungültige Beispiele für den Vertrag des Tages.",
        minutes: 18
    },
    jsonLines: {
        id: "jsonLines",
        title: "JSON Lines format",
        provider: "JSONLines.org",
        href: "https://jsonlines.org/",
        read: "Die drei Regeln: UTF-8, genau ein gültiger JSON-Wert pro Zeile und Zeilenabschluss.",
        apply: "Serialisiere deterministisch und teste jede Zeile unabhängig als gültiges JSON.",
        minutes: 8
    },
    graphConcepts: {
        id: "graphConcepts",
        title: "What is a graph database?",
        provider: "Neo4j Documentation",
        href: "https://neo4j.com/docs/getting-started/graph-database/",
        read: "Nodes, relationships, properties, data model, indexes und constraints.",
        apply: "Entscheide, was Entität, Beziehung oder Property ist, und begründe es mit einer Projektfrage.",
        minutes: 15
    },
    cypher: {
        id: "cypher",
        title: "Get started with Cypher",
        provider: "Neo4j Documentation",
        href: "https://neo4j.com/docs/getting-started/cypher/intro-tutorial/",
        read: "Create the Movie Graph und die ersten MATCH-, CREATE- und MERGE-Beispiele.",
        apply: "Übertrage das Muster auf Evidence-Nodes und gerichtete Beziehungen; teste Idempotenz mit MERGE.",
        minutes: 20
    },
    graphAcademy: {
        id: "graphAcademy",
        title: "Cypher Fundamentals",
        provider: "Neo4j GraphAcademy",
        href: "https://graphacademy.neo4j.com/courses/cypher-fundamentals",
        read: "Für den heutigen Tag nur die passenden 5-Minuten-Lektionen zu Nodes, Relationships, Traversal oder MERGE.",
        apply: "Führe mindestens ein kleines Beispiel aus, bevor du die Thesis-Query schreibst.",
        minutes: 15
    },
    unitTesting: {
        id: "unitTesting",
        title: "Best practices for writing unit tests",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices",
        read: "Characteristics of a good unit test, naming und Arrange-Act-Assert.",
        apply: "Baue einen kleinen deterministischen Test mit verständlichem Namen und nur einem klaren Verhalten.",
        minutes: 15
    },
    annotationGuide: {
        id: "annotationGuide",
        title: "Configure a labeling interface",
        provider: "Label Studio Documentation",
        href: "https://labelstud.io/guide/setup",
        read: "Set up the labeling interface und Example labeling config.",
        apply: "Definiere Einheit, Labels, Positiv/Negativ-Beispiele und erlaubte Entscheidungen vor der Annotation.",
        minutes: 15
    },
    irEvaluation: {
        id: "irEvaluation",
        title: "Evaluation in information retrieval",
        provider: "Stanford IR Book",
        href: "https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-in-information-retrieval-1.html",
        read: "Test collection, relevance judgments, precision/recall und ranked retrieval evaluation.",
        apply: "Fixiere Corpus, Fragen und Relevanzurteile, bevor du Systeme oder Metriken vergleichst.",
        minutes: 20
    },
    metricBasics: {
        id: "metricBasics",
        title: "Accuracy, precision and recall",
        provider: "Google Machine Learning Crash Course",
        href: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",
        read: "True/false positives, precision, recall und F1; bearbeite die kurzen Verständnisfragen.",
        apply: "Schreibe TP, FP und FN für die konkrete Extraktionsrelation aus, bevor du F1 berechnest.",
        minutes: 18
    },
    huggingFaceCourse: {
        id: "huggingFaceCourse",
        title: "Hugging Face LLM Course introduction",
        provider: "Hugging Face",
        href: "https://huggingface.co/docs/course/chapter1/1",
        read: "Nur Introduction und die Übersicht zu Transformers, Datasets und Tokenizers.",
        apply: "Nutze die Begriffe, um den optionalen Modellversuch zu verstehen; erweitere damit nicht automatisch den Thesis-Scope.",
        minutes: 15
    },
    ragBasics: {
        id: "ragBasics",
        title: "Retrieval augmented generation and indexes",
        provider: "Microsoft Learn",
        href: "https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation",
        read: "What is RAG?, Retrieve–Augment–Generate und Limitations and troubleshooting.",
        apply: "Trenne Retrieval, Grounding, Generation, Citation und Verhalten bei unzureichender Evidenz.",
        minutes: 18
    },
    ragSecurity: {
        id: "ragSecurity",
        title: "LLM01: Prompt Injection",
        provider: "OWASP GenAI Security Project",
        href: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
        read: "Description, attack scenarios und prevention/mitigation; beachte, dass RAG Prompt Injection nicht beseitigt.",
        apply: "Behandle Dokumentinhalt als nicht vertrauenswürdige Daten und teste einen Refusal- oder Guardrail-Fall.",
        minutes: 15
    },
    reproducibleBuilds: {
        id: "reproducibleBuilds",
        title: "When is a build reproducible?",
        provider: "Reproducible Builds",
        href: "https://reproducible-builds.org/docs/definition/",
        read: "Definition, build environment, instructions, artifacts und bit-by-bit verification.",
        apply: "Fixiere Source-Revision, Toolchain, Konfiguration und prüfe das Ergebnis mit einem Hash.",
        minutes: 10
    },
    githubCi: {
        id: "githubCi",
        title: "Continuous integration with GitHub Actions",
        provider: "GitHub Docs",
        href: "https://docs.github.com/en/actions/get-started/continuous-integration",
        read: "About continuous integration und About CI using GitHub Actions.",
        apply: "Definiere den automatischen Build/Test-Schritt und das Artefakt, das bei Fehlern geprüft werden muss.",
        minutes: 12
    },
    thesisMethod: {
        id: "thesisMethod",
        title: "The Methodology",
        provider: "USC Libraries Research Guide",
        href: "https://libguides.usc.edu/writingguide/methodology",
        read: "Definition, Importance of a Good Methodology Section und Structure and Writing Style.",
        apply: "Beschreibe Auswahl, Werkzeug, Ablauf, Messung und Begründung so, dass der Versuch wiederholbar ist.",
        minutes: 15
    },
    thesisResults: {
        id: "thesisResults",
        title: "The Results",
        provider: "USC Libraries Research Guide",
        href: "https://libguides.usc.edu/writingguide/results",
        read: "Definition, Importance of a Good Results Section und Structure and Writing Style.",
        apply: "Berichte Zahlen und Beobachtungen ohne neue Interpretation; verweise auf RQ und Tabelle.",
        minutes: 15
    },
    thesisDiscussion: {
        id: "thesisDiscussion",
        title: "The Discussion",
        provider: "USC Libraries Research Guide",
        href: "https://libguides.usc.edu/writingguide/discussion",
        read: "Definition, Importance of a Good Discussion und Organization and Structure.",
        apply: "Interpretiere die Resultate gegenüber RQ, Related Work und Validitätsgrenzen, ohne neue Daten einzuführen.",
        minutes: 15
    }
};
function learningResourceIdsForDay(day, phaseId) {
    const text = `${day.title} ${day.module} ${phaseId}`.toLocaleLowerCase();
    const has = (...terms)=>terms.some((term)=>text.includes(term.toLocaleLowerCase()));
    if (has("stakeholder", "persona", "rollenbasierte", "rollenformat", "developer output", "architect output", "qa/compliance output")) {
        return [
            "personas",
            "userNeeds"
        ];
    }
    if (has("problemstellung", "projektwert")) return [
        "researchProcess",
        "userNeeds"
    ];
    if (has("forschungsfrage", "research contract")) return [
        "researchQuestion",
        "researchProcess"
    ];
    if (has("funktionale anforderungen")) return [
        "userStories",
        "acceptanceCriteria"
    ];
    if (has("nichtfunktionale", "quality attribute", "qualitäts")) return [
        "qualityScenarios"
    ];
    if (has("anforderungs-review", "akzeptanzkriterien", "definition of done", "readiness gate", "review gate")) {
        return [
            "acceptanceCriteria",
            "definitionDone"
        ];
    }
    if (phaseId === "design-architecture") {
        return has("adr", "entscheidung") ? [
            "architectureDecision"
        ] : [
            "c4Model",
            "architectureDecision"
        ];
    }
    if (phaseId === "roslyn-syntax") return [
        "roslynModel",
        "unitTesting"
    ];
    if (phaseId === "roslyn-semantic") return [
        "roslynSemantics",
        "unitTesting"
    ];
    if (phaseId === "ef-read") return [
        "efCoreOverview",
        "efCoreQuerying"
    ];
    if (phaseId === "ef-write") return [
        "efCoreSaving",
        "efCoreOverview"
    ];
    if (has("node types", "relationship types", "graph model", "property graph")) {
        return [
            "graphConcepts",
            "cypher"
        ];
    }
    if (phaseId === "neo4j-graph" || has("graph query", "retrieval.graph")) return [
        "graphConcepts",
        "cypher"
    ];
    if (has("cypher", "node import", "relationship import", "graph build")) return [
        "cypher",
        "graphAcademy"
    ];
    if (phaseId === "evidence-model" || phaseId === "design-evidence-model" || has("schema", "contract", "evidencerecord", "sourcelocation")) {
        return has("jsonl", "serial") ? [
            "jsonLines",
            "jsonSchema"
        ] : [
            "jsonSchema",
            "jsonLines"
        ];
    }
    if (phaseId === "goldstandard" || has("annotation", "gold", "sampling", "adjudikation")) {
        return [
            "annotationGuide",
            "irEvaluation"
        ];
    }
    if (phaseId === "rq1-evaluation" || has("precision", "recall", "f1", "metriken")) {
        return [
            "metricBasics",
            "irEvaluation"
        ];
    }
    if (phaseId === "rq2-evaluation" || phaseId === "retrieval-query" || has("retriever", "tf-idf", "cosine", "ranking")) {
        return [
            "irEvaluation",
            "metricBasics"
        ];
    }
    if (phaseId === "nlp-sequences" || has("embedding", "rnn", "lstm", "gru", "bert", "graphcodebert")) {
        return [
            "huggingFaceCourse",
            "irEvaluation"
        ];
    }
    if (phaseId === "nlp-transformers" || phaseId === "answerability-roles" || has("rag", "guardrail", "verifier", "refusal")) {
        return [
            "ragBasics",
            "ragSecurity"
        ];
    }
    if (phaseId === "validity" || has("validität", "validity", "bias", "ethik")) return [
        "thesisMethod",
        "researchProcess"
    ];
    if (has("methodenkapitel")) return [
        "thesisMethod",
        "reproducibleBuilds"
    ];
    if (has("ergebniskapitel")) return [
        "thesisResults",
        "metricBasics"
    ];
    if (has("diskussion", "thesis-quervergleich")) return [
        "thesisDiscussion",
        "researchQuestion"
    ];
    if (has("reproduktion", "replikation", "release", "build", "versionierung", "archiv", "übergabe", "freeze", "corpus")) {
        return [
            "reproducibleBuilds",
            "githubCi"
        ];
    }
    if (phaseId === "writing-delivery" || has("thesis", "präsentation", "demo")) return [
        "thesisResults",
        "thesisDiscussion"
    ];
    if (phaseId === "design-evaluation") return [
        "irEvaluation",
        "unitTesting"
    ];
    if (phaseId === "design-delivery-plan" || phaseId === "design-freeze" || phaseId.startsWith("buffer-")) {
        return [
            "definitionDone",
            "githubCi"
        ];
    }
    if (phaseId === "scope-corpus") return [
        "researchProcess",
        "reproducibleBuilds"
    ];
    if (phaseId === "nlp-foundations") return [
        "irEvaluation",
        "unitTesting"
    ];
    return [
        "definitionDone"
    ];
}
function learningResourcesForDay(day) {
    return day.learningResourceIds.map((id)=>learningResources[id]).filter(Boolean);
}
const extractionSections = [
    "Problem",
    "Method",
    "Data / Evaluation",
    "Findings",
    "Limitations",
    "Verbindung mit RQ / Projektarchitektur"
];
const defaultSettings = {
    projectName: "Cross_Repository_Code_Intelligence",
    planName: "Cross Repository Code Intelligence – 37-Wochen-Vollzeitplan",
    planStartDate: "2026-10-15",
    planEndDate: "2027-05-27",
    planStatus: "running",
    planPausedAt: "",
    dailyWorkMode: "full",
    dailyStart: "15:00",
    driveFolderUrl: "https://drive.google.com/drive/folders/1rJmYt-fJrv06HjRntIGJtczYB7yy1GAW",
    githubUrl: "https://github.com/Hajimohammadi-KI/Cross-Repository-Code-Intelligence",
    notionUrl: "https://app.notion.com/p/c79224871bee405d91ac38fbb85a6716",
    pdfReaderUrl: "/pdf-reader",
    settingsAppUrl: "/settings",
    sourceOverrides: {}
};
const trackerRestartPlan = {
    calendarReviewedAt: "2026-08-30",
    remainingLiveSessionNumbers: [
        8,
        9,
        10
    ],
    catchUpSessionNumbers: [
        1,
        2,
        3,
        4,
        5,
        6,
        7
    ],
    protectedBreakStart: "2026-09-10",
    protectedBreakEnd: "2026-10-13",
    gentleRestartStart: "2026-10-14",
    gentleRestartEnd: "2026-10-18",
    mainPlanStart: "2026-08-30",
    screenBreaks: [
        {
            procedureDate: "2026-09-10",
            fullRestEnd: "2026-09-16",
            paperOnlyStart: "2026-09-17",
            screenRestrictionEnd: "2026-09-24"
        },
        {
            procedureDate: "2026-09-29",
            fullRestEnd: "2026-10-05",
            paperOnlyStart: "2026-10-06",
            screenRestrictionEnd: "2026-10-13"
        }
    ],
    dailyStart: "15:00",
    liveSessionPolicy: {
        mode: "observer_only",
        preparationMinutes: 0,
        noteLineLimit: 3,
        missedSessionRule: "do_not_catch_up_before_restart"
    },
    catchUpPolicy: {
        countsAsBacklog: false,
        earliestDate: "2026-10-19",
        maxSessionsPerWeek: 1,
        requiresWeeklyCoreOutput: true,
        relevanceQuestion: "Blockiert diese Sitzung Artefakt, Test oder Evidence der aktuellen Woche?"
    },
    recoveryPolicy: {
        minimumFullRestDays: 7,
        screenFreeDays: 14,
        paperOnlyFromDay: 8,
        gentleDailyMinutes: 12,
        mainDailyMaxMinutes: 480,
        shiftWholePlanIfNotReady: true,
        compressWeeks: false,
        clinicalAdviceOverridesPlan: true
    }
};
function plannedWorkMode(date) {
    return trackerRestartPlan.screenBreaks.some((window)=>date >= window.paperOnlyStart && date <= window.screenRestrictionEnd) ? "paper" : "screen";
}
function isNlpCatchUpSession(sessionNumber) {
    return trackerRestartPlan.catchUpSessionNumbers.includes(sessionNumber);
}
function isNlpRemainingLiveSession(sessionNumber) {
    return trackerRestartPlan.remainingLiveSessionNumbers.includes(sessionNumber);
}
const nlpCourseFileNames = {
    logiclens: "C01-O06_DEEP_Read-MultiRepo-Graph-Eval_★★★★★_CORE_R09_Usai_2026_LogicLens_Multi_Repository_Semantic_Code_Graph__DEEP_Read-MultiRepository-Graph-Evaluation (2).pdf",
    draco: "C02-O07_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R43_Cheng_2024_DraCo_Dataflow_Guided_Repository_Retrieval__TARGET_Read-Method-Evaluation-Limitations.pdf",
    gandhiRetrieval: "C03-O08_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R10_Gandhi_2025_Repository_Level_Code_Search_Neural_Retrieval__TARGET_Read-Method-Evaluation-Limitations.pdf",
    kilt: "C04-O15_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R42_Petroni_2021_KILT_Knowledge_Intensive_Language_Tasks__TARGET_Read-Method-Evaluation-Limitations.pdf",
    repocoder: "C05-O18_TARGET_Read-Method-Eval_★★★☆☆_SUPPORT_R11_Zhang_2023_RepoCoder_Iterative_Retrieval_and_Generation__RELATED_Read-Abstract-Method-Conclusion.pdf",
    ranger: "C06-O19_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R17_Shah_2025_RANGER_Graph_Enhanced_Repository_Retrieval__TARGET_Read-Method-Evaluation-Limitations.pdf",
    allamanis: "C07-O09_TARGET_Read-Data-Metrics-Threats_★★★★★_CORE_R41_Allamanis_2018_Learning_to_Represent_Programs_with_Graphs__TARGET_Read-Method-Evaluation-Limitations.pdf",
    codebert: "C08-O10_REVIEW_Read-Taxonomy-Limits_★★★☆☆_NEW_BASELINE_CodeBERT_Pretrained_Model_for_Code_and_Natural_Language__REVIEW_Read-Taxonomy-Comparison-Limitations.pdf",
    graphcodebert: "C09-O14_TARGET_Read-Data-Metrics-Threats_★★☆☆☆_Guo_2021_GraphCodeBERT_Data_Flow__RELATED_Read-Abstract-Method-Conclusion.pdf",
    zhangLlmSurvey: "C10-O11_REVIEW_Read-Taxonomy-Limits_★★☆☆☆_Zhang_2024_Survey_on_LLMs_for_Software_Engineering__REVIEW_Read-Taxonomy-Comparison-Limitations.pdf",
    houLlmReview: "C11-O12_REVIEW_Read-Taxonomy-Limits_★★★☆☆_SUPPORT_R24_Hou_2024_LLMs_for_Software_Engineering_Systematic_Review__REVIEW_Read-Taxonomy-Comparison-Limitations.pdf",
    rag: "C12-O13_TARGET_Read-Method-Eval_★★★☆☆_SUPPORT_R03_Lewis_2020_Retrieval_Augmented_Generation__RELATED_Read-Abstract-Method-Conclusion.pdf",
    ragCodeSurvey: "C13-O20_REVIEW_Read-Taxonomy-Limits_★★★☆☆_SUPPORT_R27_Tao_2026_Retrieval_Augmented_Code_Generation_Survey__REVIEW_Read-Taxonomy-Comparison-Limitations.pdf",
    codeGraphModel: "C14-O21_RELATED_Read-Abstract-Method-Conclusion_★★★☆☆_SUPPORT_R16_Tao_2025_Code_Graph_Model_CGM_NeurIPS__RELATED_Read-Abstract-Method-Conclusion.pdf",
    llmxCpg: "C15-O23_RELATED_Read-Abstract-Method-Conclusion_★★★☆☆_SUPPORT_R14_Lekssays_2025_LLMxCPG_Context_Aware_Program_Analysis__RELATED_Read-Abstract-Method-Conclusion.pdf",
    oleaPrompting: "C16-O16_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R23_Olea_2024_Persona_Prompting_for_Question_Answering__TARGET_Read-Method-Evaluation-Limitations.pdf",
    abeduKgQa: "C17-O17_DEEP_Read-KG-QA-Pipeline-Eval_★★★★★_CORE_R15_Abedu_2025_LLM_Knowledge_Graph_Repository_QA__DEEP_Read-KG-QA-Pipeline-Evaluation.pdf",
    codebadger: "C18-O22_TARGET_Read-Data-Metrics-Threats_★★★★☆_IMPORTANT_R13_Lekssays_2026_Bridging_CPGs_and_Language_Models__TARGET_Read-Method-Evaluation-Limitations.pdf"
};
const sources = {
    proposal: {
        id: "proposal",
        label: "Cross_Repository_Code_Intelligence Lern-Exposé v2.4",
        href: "/pdf-reader?document=expose&name=Cross_Repository_Code_Intelligence%20%E2%80%93%20Expos%C3%A9",
        driveName: "Cross_Repository_Code_Intelligence_Lern_Expose_DE_2026_v2_4.pdf",
        priority: "core"
    },
    c4: {
        id: "c4",
        label: "C4 Model: Context-, Container- und Component-Diagramme",
        href: "https://c4model.com/diagrams",
        priority: "support"
    },
    arc42: {
        id: "arc42",
        label: "arc42: Vorlage zur Softwarearchitektur-Dokumentation",
        href: "https://arc42.org/overview/",
        priority: "support"
    },
    adr: {
        id: "adr",
        label: "Microsoft Learn: Architecture Decision Records",
        href: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record",
        priority: "support"
    },
    danphe: {
        id: "danphe",
        label: "Danphe EMR: eingefrorener Commit 0b5d6b8",
        href: "https://github.com/hospital-management-system-emr/hospital-management-system-emr-opensource",
        priority: "core"
    },
    hevner: {
        id: "hevner",
        label: "Hevner et al. 2004: Design Science in IS Research",
        href: "https://drive.google.com/file/d/1HSYD3dBut18RlbXnO_ufdlT8lHXkg0am/view",
        driveName: "01_DEEP_Read-Framework-Guidelines-Eval_★★★★★_CORE_R01_Hevner_2004_Design_Science_in_Information_Systems__DEEP_Read-Framework-Guidelines-Evaluation.pdf",
        priority: "core",
        thesisRole: "cite"
    },
    nagy: {
        id: "nagy",
        label: "Nagy et al. 2015: Where Was This SQL Query Executed?",
        href: "https://drive.google.com/file/d/1wCjThO0mfOJXrYpWZUUgJEX5ohs0wDOc/view",
        driveName: "04_DEEP_Read-StaticSQL-Method-Eval_★★★★★_CORE_R06_Nagy_2015_Where_Was_This_SQL_Query_Executed__DEEP_Read-StaticSQL-Method-Evaluation.pdf",
        priority: "core",
        thesisRole: "cite"
    },
    shatnawi: {
        id: "shatnawi",
        label: "Shatnawi et al. 2019: Static Analysis of Multilanguage Systems",
        href: "https://drive.google.com/file/d/14rdyqlM40QBIXIb0KtrvKBFAMTQ6KYRO/view",
        driveName: "05_DEEP_Read-Multilang-Method-Limits_★★★★★_CORE_R04_Shatnawi_2019_Static_Analysis_of_Multilanguage_Systems__DEEP_Read-Multilanguage-Method-Limitations.pdf",
        priority: "core",
        thesisRole: "background"
    },
    yamaguchi: {
        id: "yamaguchi",
        label: "Yamaguchi et al. 2014: Code Property Graphs",
        href: "https://drive.google.com/file/d/1SGWMjZA8Im9fXsuZxr6KnKdgijDH4o8r/view",
        driveName: "07_DEEP_Read-CPG-Model-Construction_★★★★★_CORE_R02_Yamaguchi_2014_Code_Property_Graphs__DEEP_Read-CPG-Model-Graph-Construction.pdf",
        priority: "core",
        thesisRole: "background"
    },
    logiclens: {
        id: "logiclens",
        label: "Usai et al. 2026: LogicLens",
        href: "https://drive.google.com/file/d/1_yzTxjxahfnOH-Q_ZaehvmHN6xxi-3QE/view",
        driveName: nlpCourseFileNames.logiclens,
        priority: "core",
        thesisRole: "related-work"
    },
    codefuse: {
        id: "codefuse",
        label: "Xie et al. 2026: CodeFuse Query",
        href: "https://drive.google.com/file/d/1cfU7FbjkIRSamwvWKbL3pTH_EC0V-ObB/view",
        driveName: "10_TARGET_Read-Data-Metrics-Threats_★★★★★_CORE_R05_Xie_2026_CodeFuse_Query_Large_Scale_Code_Analysis__TARGET_Read-Method-Evaluation-Limitations.pdf",
        priority: "core",
        thesisRole: "related-work"
    },
    sweqa: {
        id: "sweqa",
        label: "Peng et al. 2026: SWE-QA",
        href: "https://drive.google.com/file/d/15eGjHmpQ_YDfCnJBy535PoKQ-TEyWtpj/view",
        driveName: "02_DEEP_Read-Dataset-Metrics-Threats_★★★★☆_IMPORTANT_R29_Peng_2026_SWE_QA_Repository_Level_Code_Questions__DEEP_Read-Dataset-Metrics-Threats.pdf",
        priority: "important",
        thesisRole: "related-work"
    },
    alshemaimri: {
        id: "alshemaimri",
        label: "Alshemaimri et al. 2021: Database Code Fragments Survey",
        href: "https://onlinelibrary.wiley.com/doi/full/10.1002/eng2.12441",
        priority: "important",
        thesisRole: "related-work"
    },
    allamanis: {
        id: "allamanis",
        label: "Allamanis et al. 2018: Learning to Represent Programs with Graphs",
        href: "https://arxiv.org/pdf/1711.00740",
        driveName: nlpCourseFileNames.allamanis,
        priority: "core",
        thesisRole: "background"
    },
    kilt: {
        id: "kilt",
        label: "Petroni et al. 2021: KILT",
        href: "https://arxiv.org/pdf/2009.02252",
        driveName: nlpCourseFileNames.kilt,
        priority: "important",
        thesisRole: "related-work"
    },
    draco: {
        id: "draco",
        label: "Cheng et al. 2024: DraCo",
        href: "https://arxiv.org/pdf/2405.19782",
        driveName: nlpCourseFileNames.draco,
        priority: "important",
        thesisRole: "related-work"
    },
    graphcodebert: {
        id: "graphcodebert",
        label: "Guo et al. 2021: GraphCodeBERT",
        href: "https://arxiv.org/pdf/2009.08366",
        driveName: nlpCourseFileNames.graphcodebert,
        priority: "optional",
        thesisRole: "background"
    },
    gandhiRetrieval: {
        id: "gandhiRetrieval",
        label: "Gandhi et al. 2025: Repository-Level Code Search",
        driveName: nlpCourseFileNames.gandhiRetrieval,
        priority: "important",
        thesisRole: "related-work"
    },
    codebert: {
        id: "codebert",
        label: "Feng et al. 2020: CodeBERT",
        href: "https://aclanthology.org/2020.findings-emnlp.139/",
        driveName: nlpCourseFileNames.codebert,
        priority: "important",
        thesisRole: "background"
    },
    zhangLlmSurvey: {
        id: "zhangLlmSurvey",
        label: "Zhang et al. 2024: Survey on LLMs for Software Engineering",
        driveName: nlpCourseFileNames.zhangLlmSurvey,
        priority: "support",
        thesisRole: "background"
    },
    houLlmReview: {
        id: "houLlmReview",
        label: "Hou et al. 2024: LLMs for Software Engineering Review",
        driveName: nlpCourseFileNames.houLlmReview,
        priority: "support",
        thesisRole: "related-work"
    },
    oleaPrompting: {
        id: "oleaPrompting",
        label: "Olea et al. 2024: Persona Prompting for Question Answering",
        driveName: nlpCourseFileNames.oleaPrompting,
        priority: "important",
        thesisRole: "related-work"
    },
    abeduKgQa: {
        id: "abeduKgQa",
        label: "Abedu et al. 2025: LLM + Knowledge Graph Repository QA",
        driveName: nlpCourseFileNames.abeduKgQa,
        priority: "core",
        thesisRole: "related-work"
    },
    repocoder: {
        id: "repocoder",
        label: "Zhang et al. 2023: RepoCoder",
        driveName: nlpCourseFileNames.repocoder,
        priority: "support",
        thesisRole: "related-work"
    },
    ranger: {
        id: "ranger",
        label: "Shah et al. 2025: RANGER",
        driveName: nlpCourseFileNames.ranger,
        priority: "important",
        thesisRole: "related-work"
    },
    ragCodeSurvey: {
        id: "ragCodeSurvey",
        label: "Tao et al. 2026: Retrieval-Augmented Code Generation Survey",
        driveName: nlpCourseFileNames.ragCodeSurvey,
        priority: "support",
        thesisRole: "related-work"
    },
    codeGraphModel: {
        id: "codeGraphModel",
        label: "Tao et al. 2025: Code Graph Model",
        driveName: nlpCourseFileNames.codeGraphModel,
        priority: "support",
        thesisRole: "related-work"
    },
    codebadger: {
        id: "codebadger",
        label: "Lekssays 2026: Bridging CPGs and Language Models",
        driveName: nlpCourseFileNames.codebadger,
        priority: "important",
        thesisRole: "related-work"
    },
    llmxCpg: {
        id: "llmxCpg",
        label: "Lekssays 2025: LLMxCPG",
        driveName: nlpCourseFileNames.llmxCpg,
        priority: "support",
        thesisRole: "related-work"
    },
    roslynWorkspace: {
        id: "roslynWorkspace",
        label: "Microsoft Learn: Roslyn Workspace",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/work-with-workspace",
        priority: "support"
    },
    roslynSyntax: {
        id: "roslynSyntax",
        label: "Microsoft Learn: Roslyn Syntax Analysis",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/syntax-analysis",
        priority: "support"
    },
    roslynSemantic: {
        id: "roslynSemantic",
        label: "Microsoft Learn: Roslyn Semantic Analysis",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/semantic-analysis",
        priority: "support"
    },
    efMapping: {
        id: "efMapping",
        label: "Microsoft Learn: EF Core Entity Mapping",
        href: "https://learn.microsoft.com/en-us/ef/core/modeling/entity-types#table-name",
        priority: "support"
    },
    efQuerying: {
        id: "efQuerying",
        label: "Microsoft Learn: EF Core Querying",
        href: "https://learn.microsoft.com/en-us/ef/core/querying/",
        priority: "support"
    },
    efSaving: {
        id: "efSaving",
        label: "Microsoft Learn: EF Core Saving",
        href: "https://learn.microsoft.com/en-us/ef/core/saving/",
        priority: "support"
    },
    neo4jModeling: {
        id: "neo4jModeling",
        label: "Neo4j: Data Modeling",
        href: "https://neo4j.com/docs/getting-started/data-modeling/",
        priority: "support"
    },
    cypher: {
        id: "cypher",
        label: "Neo4j GraphAcademy: Cypher Fundamentals",
        href: "https://graphacademy.neo4j.com/courses/cypher-fundamentals",
        priority: "support"
    },
    tfidf: {
        id: "tfidf",
        label: "scikit-learn: Text Feature Extraction und TF-IDF",
        href: "https://scikit-learn.org/stable/modules/feature_extraction.html",
        priority: "course"
    },
    cosine: {
        id: "cosine",
        label: "scikit-learn: Cosine Similarity",
        href: "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html",
        priority: "course"
    },
    embeddings: {
        id: "embeddings",
        label: "Keras 3: Embedding Layer",
        href: "https://keras.io/api/layers/core_layers/embedding/",
        priority: "course"
    },
    rnn: {
        id: "rnn",
        label: "Keras 3: SimpleRNN",
        href: "https://keras.io/api/layers/recurrent_layers/simple_rnn/",
        priority: "course"
    },
    lstm: {
        id: "lstm",
        label: "Keras 3: LSTM",
        href: "https://keras.io/api/layers/recurrent_layers/lstm/",
        priority: "course"
    },
    gru: {
        id: "gru",
        label: "Keras 3: GRU",
        href: "https://keras.io/api/layers/recurrent_layers/gru/",
        priority: "course"
    },
    sentiment: {
        id: "sentiment",
        label: "Keras-Beispiel: Bidirectional LSTM on IMDB",
        href: "https://keras.io/examples/nlp/bidirectional_lstm_imdb/",
        priority: "course"
    },
    seq2seq: {
        id: "seq2seq",
        label: "Keras-Beispiel: Character-level Seq2Seq",
        href: "https://keras.io/examples/nlp/lstm_seq2seq/",
        priority: "course"
    },
    attention: {
        id: "attention",
        label: "Vaswani et al. 2017: Attention Is All You Need",
        href: "https://arxiv.org/abs/1706.03762",
        priority: "course"
    },
    bert: {
        id: "bert",
        label: "Devlin et al. 2019: BERT",
        href: "https://aclanthology.org/N19-1423/",
        priority: "course"
    },
    gpt: {
        id: "gpt",
        label: "Radford et al. 2019: Language Models are Unsupervised Multitask Learners",
        href: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
        priority: "course"
    },
    googleLlmCrashCourse: {
        id: "googleLlmCrashCourse",
        label: "Google Machine Learning Crash Course: Introduction to Large Language Models",
        href: "https://developers.google.com/machine-learning/crash-course/llm",
        priority: "course"
    },
    lora: {
        id: "lora",
        label: "Hu et al. 2021: LoRA",
        href: "https://arxiv.org/abs/2106.09685",
        priority: "course"
    },
    qlora: {
        id: "qlora",
        label: "Dettmers et al. 2023: QLoRA",
        href: "https://arxiv.org/abs/2305.14314",
        priority: "course"
    },
    rag: {
        id: "rag",
        label: "Lewis et al. 2020: Retrieval-Augmented Generation",
        href: "https://arxiv.org/abs/2005.11401",
        driveName: nlpCourseFileNames.rag,
        priority: "course"
    },
    bleu: {
        id: "bleu",
        label: "Papineni et al. 2002: BLEU",
        href: "https://aclanthology.org/P02-1040/",
        priority: "course"
    }
};
const articleReadings = [
    {
        id: "reading-06",
        courseOrder: 1,
        order: 6,
        sourceId: "logiclens",
        mode: "DEEP",
        status: "in_progress",
        sessionNumbers: [
            8,
            9,
            10
        ],
        fileName: nlpCourseFileNames.logiclens,
        readingFocus: [
            "Semantic code graph and cross-repository links",
            "Provenance and evaluation design",
            "Differences from Evidence Record and Evidence Path"
        ],
        projectConnection: "RQ1/RQ2: compare LogicLens multi-repository graphs and provenance with the thesis Evidence Record, Evidence Path, and answerability boundary."
    },
    {
        id: "reading-07",
        courseOrder: 2,
        order: 7,
        sourceId: "draco",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            1,
            2,
            8,
            10
        ],
        fileName: nlpCourseFileNames.draco,
        readingFocus: [
            "Data-flow-aware token and context selection",
            "Retrieval method and metrics",
            "Threats and repository-level limits"
        ],
        projectConnection: "RQ2: supplies a data-flow-guided retrieval comparison point and clarifies which structural signals belong in Graph rather than Flat Retrieval."
    },
    {
        id: "reading-08",
        courseOrder: 3,
        order: 8,
        sourceId: "gandhiRetrieval",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            2,
            4,
            9
        ],
        fileName: nlpCourseFileNames.gandhiRetrieval,
        readingFocus: [
            "Lexical baseline",
            "Neural reranking",
            "Repository-level evaluation metrics"
        ],
        projectConnection: "RQ2: anchors the Flat lexical baseline and the optional neural-reranking comparison without weakening evidence traceability."
    },
    {
        id: "reading-09",
        courseOrder: 7,
        order: 9,
        sourceId: "allamanis",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            3,
            4,
            5,
            8
        ],
        fileName: nlpCourseFileNames.allamanis,
        readingFocus: [
            "Sequential versus graph code representation",
            "Embedding and message passing",
            "Evaluation limits"
        ],
        projectConnection: "RQ1/RQ2: explains why token sequences alone cannot replace explicit code structure and Evidence Paths."
    },
    {
        id: "reading-10",
        courseOrder: 8,
        order: 10,
        sourceId: "codebert",
        mode: "REVIEW",
        status: "planned",
        sessionNumbers: [
            1,
            4,
            8,
            9
        ],
        fileName: nlpCourseFileNames.codebert,
        readingFocus: [
            "Natural-language/code pretraining",
            "Encoder embeddings",
            "Code-search use and limits"
        ],
        projectConnection: "RQ2: provides a Transformer encoder baseline for matching questions to code candidates; verification still requires Evidence Records."
    },
    {
        id: "reading-11",
        courseOrder: 10,
        order: 11,
        sourceId: "zhangLlmSurvey",
        mode: "REVIEW",
        status: "planned",
        sessionNumbers: [
            5,
            6,
            9,
            10
        ],
        fileName: nlpCourseFileNames.zhangLlmSurvey,
        readingFocus: [
            "Model taxonomy",
            "Fine-tuning and prompting",
            "Software-engineering limitations"
        ],
        projectConnection: "Positions the thesis against LLM-based software engineering and helps justify a retrieval-and-evidence architecture rather than model-only answers."
    },
    {
        id: "reading-12",
        courseOrder: 11,
        order: 12,
        sourceId: "houLlmReview",
        mode: "REVIEW",
        status: "planned",
        sessionNumbers: [
            5,
            6,
            9,
            10
        ],
        fileName: nlpCourseFileNames.houLlmReview,
        readingFocus: [
            "RNN/LSTM/GRU position",
            "LLM use in software engineering",
            "Validity and open problems"
        ],
        projectConnection: "Defines why recurrent models are course context, not thesis core, and supports the limitations discussion for RQ2."
    },
    {
        id: "reading-13",
        courseOrder: 12,
        order: 13,
        sourceId: "rag",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            7,
            10
        ],
        fileName: nlpCourseFileNames.rag,
        readingFocus: [
            "Seq2Seq RAG architecture",
            "Parametric versus retrieved memory",
            "Evaluation setup"
        ],
        projectConnection: "RQ2: motivates separating retrieval evidence from parametric generation and keeping answerability dependent on retrieved Evidence IDs."
    },
    {
        id: "reading-14",
        courseOrder: 9,
        order: 14,
        sourceId: "graphcodebert",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            4,
            8,
            9
        ],
        fileName: nlpCourseFileNames.graphcodebert,
        readingFocus: [
            "Data-flow-guided self-attention",
            "Encoder representation",
            "Code-search evaluation"
        ],
        projectConnection: "RQ2: shows how structural data flow can guide attention while remaining distinct from a verifiable Evidence Path."
    },
    {
        id: "reading-15",
        courseOrder: 4,
        order: 15,
        sourceId: "kilt",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            2,
            7,
            10
        ],
        fileName: nlpCourseFileNames.kilt,
        readingFocus: [
            "Provenance requirements",
            "Seq2Seq knowledge tasks",
            "Retrieval versus generation metrics"
        ],
        projectConnection: "RQ2/Answerability: supports provenance-aware evaluation and explains why BLEU/ROUGE cannot replace retrieval and evidence metrics."
    },
    {
        id: "reading-16",
        courseOrder: 16,
        order: 16,
        sourceId: "oleaPrompting",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            9,
            10
        ],
        fileName: nlpCourseFileNames.oleaPrompting,
        readingFocus: [
            "Persona prompt design",
            "QA evaluation",
            "Role effects and threats"
        ],
        projectConnection: "Supports role-specific Developer, Architect, and QA prompts while preserving a shared evidence and answerability contract."
    },
    {
        id: "reading-17",
        courseOrder: 17,
        order: 17,
        sourceId: "abeduKgQa",
        mode: "DEEP",
        status: "planned",
        sessionNumbers: [
            9,
            10
        ],
        fileName: nlpCourseFileNames.abeduKgQa,
        readingFocus: [
            "Repository QA pipeline",
            "Knowledge-graph grounding",
            "Prompting and evaluation"
        ],
        projectConnection: "Closest RQ2 comparison: repository QA over a Knowledge Graph, evaluated against the thesis Evidence Path and refusal boundary."
    },
    {
        id: "reading-18",
        courseOrder: 5,
        order: 18,
        sourceId: "repocoder",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            2,
            7,
            10
        ],
        fileName: nlpCourseFileNames.repocoder,
        readingFocus: [
            "Iterative retrieval",
            "Repository context",
            "Retrieval-generation feedback"
        ],
        projectConnection: "RQ2: provides an iterative repository-level retrieval comparison while the thesis keeps generation outside evidence verification."
    },
    {
        id: "reading-19",
        courseOrder: 6,
        order: 19,
        sourceId: "ranger",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            2,
            8,
            10
        ],
        fileName: nlpCourseFileNames.ranger,
        readingFocus: [
            "Graph-enhanced retrieval",
            "Flat/Graph comparison",
            "Data, metrics, and threats"
        ],
        projectConnection: "Directly informs the RQ2 comparison between Flat Retrieval and Graph Retrieval on the same frozen questions and evidence corpus."
    },
    {
        id: "reading-20",
        courseOrder: 13,
        order: 20,
        sourceId: "ragCodeSurvey",
        mode: "REVIEW",
        status: "planned",
        sessionNumbers: [
            7,
            10
        ],
        fileName: nlpCourseFileNames.ragCodeSurvey,
        readingFocus: [
            "RAG-for-code taxonomy",
            "Retrieval and generation stages",
            "Open limitations"
        ],
        projectConnection: "Frames the thesis within retrieval-augmented code systems and sharpens the boundary between candidate retrieval and answer verification."
    },
    {
        id: "reading-21",
        courseOrder: 14,
        order: 21,
        sourceId: "codeGraphModel",
        mode: "RELATED",
        status: "planned",
        sessionNumbers: [
            8,
            9,
            10
        ],
        fileName: nlpCourseFileNames.codeGraphModel,
        readingFocus: [
            "Graph-aware attention",
            "Adapter strategy",
            "PEFT/QLoRA boundary"
        ],
        projectConnection: "RQ2: supplies graph-aware neural context and helps keep adapter tuning optional rather than a prerequisite for Evidence Paths."
    },
    {
        id: "reading-22",
        courseOrder: 18,
        order: 22,
        sourceId: "codebadger",
        mode: "TARGET",
        status: "planned",
        sessionNumbers: [
            9,
            10
        ],
        fileName: nlpCourseFileNames.codebadger,
        readingFocus: [
            "CPG-constrained context",
            "Language-model integration",
            "Traceability and evaluation"
        ],
        projectConnection: "RQ1/RQ2: shows how CPG structure can constrain context and improve traceability without treating generated text as evidence."
    },
    {
        id: "reading-23",
        courseOrder: 15,
        order: 23,
        sourceId: "llmxCpg",
        mode: "RELATED",
        status: "planned",
        sessionNumbers: [
            8,
            9,
            10
        ],
        fileName: nlpCourseFileNames.llmxCpg,
        readingFocus: [
            "LLM and CPG integration",
            "Multi-function context",
            "Method result and limits"
        ],
        projectConnection: "RQ1/RQ2: connects multi-function CPG context to Graph Retrieval and explicit Evidence Paths across repository boundaries."
    }
];
function sourceReadingPolicy(sourceId, dailyFocus) {
    const courseReading = articleReadings.find((reading)=>reading.sourceId === sourceId);
    if (courseReading) return articleReadingPolicy(courseReading);
    const source = sources[sourceId];
    if (source?.driveName?.includes("_DEEP_")) {
        return ARTICLE_READING_POLICIES.DEEP;
    }
    return {
        scope: "sections",
        label: "Nur diese Abschnitte lesen",
        requiredSections: dailyFocus
    };
}
const nlpLabDefinition = {
    name: "NLP Retrieval Lab",
    route: "/nlp-lab",
    courseStart: "2026-08-17",
    courseEnd: "2026-09-07",
    catchUpStart: trackerRestartPlan.catchUpPolicy.earliestDate,
    problem: "Read the course-aligned thesis literature and extract reusable evidence about retrieval, code graphs, provenance, prompting, and answerability.",
    projectFit: "Before the protected break, sessions 8–10 are observer-only live appointments with no preparation. Sessions 1–7 and every former reading or transfer deadline are optional reference material from 19 October, after the weekly core output, and never create backlog, reduce progress, or break the streak.",
    core: [
        "Attend live sessions 8–10 as an observer without preparation when health and energy allow",
        "After an attended live session, write at most three lines: understood point, thesis relevance, open question",
        "Keep article numbers 06–23 stable and preserve the original PDF files"
    ],
    deferred: [
        "Sessions 1–7 unless one directly blocks the current week's artifact, test, or evidence",
        "All assigned reading and course-transfer deliverables before the main plan starts",
        "All dated technical implementation tasks from 19 August through 7 September",
        "Training RNN, LSTM, GRU, BERT, or GPT models",
        "LoRA or QLoRA fine-tuning and production RAG implementation",
        "Treating attention, generated text, or model confidence as verified evidence"
    ],
    actors: [
        "Researcher",
        "Developer",
        "Architect",
        "QA reviewer"
    ],
    useCases: [
        "Identify a paper's research problem and method",
        "Record its dataset, evaluation design, and metrics",
        "Separate findings from limitations and threats",
        "Map usable claims to RQ1 or RQ2",
        "Decide whether the paper informs Flat Retrieval, Graph Retrieval, Evidence Path, or Answerability",
        "Carry the extracted evidence into the thesis literature matrix"
    ],
    integrationContract: {
        input: "Course session + ArticleReading + current Exposé",
        output: "Six-section extraction note with an explicit RQ/architecture connection",
        boundary: "A paper can motivate a design choice; only project Evidence Records and Evidence Paths can verify repository claims."
    }
};
const nlpCourseSessions = [
    {
        number: 1,
        date: "2026-08-17",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Introduction to NLP, preprocessing, and tokenization",
        topics: [
            "Introduction to Natural Language Processing",
            "Text Preprocessing",
            "Basic Text Representation",
            "Tokenization"
        ],
        projectQuestion: "Which code tokens must remain searchable without destroying source evidence?",
        useCase: "Read how code and natural language are tokenized for retrieval",
        readingIds: [
            "reading-07",
            "reading-10"
        ],
        readingFocus: [
            "Tokenization choices",
            "Code and natural-language representation",
            "Effect on retrieval context"
        ],
        projectConnection: "Links input representation to Flat Retrieval while source spans remain in the Evidence Record.",
        extractionGoal: "Extract tokenization decisions and their likely effects on recall, context length, and traceability.",
        classQuestionsFa: [
            "برای کدهای camelCase و snake_case چه نوع توکنیزیشنی مناسب‌تر است؟",
            "چگونه هنگام پیش‌پردازش، SourceLocation و مرز دقیق کد را حفظ کنم؟",
            "کدام خطاهای توکنیزیشن بیشترین کاهش Recall را در بازیابی کد ایجاد می‌کنند؟"
        ],
        whyThisMattersFa: "چون کیفیت توکنیزیشن تعیین می‌کند کدام بخش‌های کد قابل جست‌وجو بمانند، بدون اینکه مسیر شواهد و محل منبع از بین برود.",
        plannedActionFa: "یک tokenizer آگاه از ساختار کد می‌سازم، spanها را حفظ می‌کنم و آن را با fixtureهای ثابت آزمایش می‌کنم.",
        relatedDayTitles: [
            "Kursartefakte prüfen und einfrieren",
            "Code-Aware Tokenizer implementieren"
        ]
    },
    {
        number: 2,
        date: "2026-08-19",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Bag-of-Words, TF-IDF, vector space, and cosine similarity",
        topics: [
            "Bag-of-Words Model",
            "TF-IDF",
            "Vector Space Models",
            "Cosine Similarity"
        ],
        projectQuestion: "What is the simplest reproducible Flat baseline for RQ2?",
        useCase: "Compare lexical, iterative, and graph-enhanced repository retrieval",
        readingIds: [
            "reading-07",
            "reading-08",
            "reading-15",
            "reading-18",
            "reading-19"
        ],
        readingFocus: [
            "Lexical baseline",
            "Retrieval metrics and provenance",
            "Flat versus graph-enhanced ranking"
        ],
        projectConnection: "Direct RQ2 basis for the Flat/Graph Retrieval comparison and provenance-aware evaluation.",
        extractionGoal: "Extract comparable retrieval methods, datasets, metrics, and threats for the RQ2 evaluation table.",
        classQuestionsFa: [
            "برای corpus کوچک پایان‌نامه، پارامترهای TF-IDF را چگونه انتخاب و ثابت کنم؟",
            "در cosine similarity با بردار صفر و امتیازهای مساوی چه رفتاری درست و قابل بازتولید است؟",
            "برای مقایسه baseline با بازیابی گرافی، Recall@k و MRR را چگونه گزارش کنم؟"
        ],
        whyThisMattersFa: "چون TF-IDF و cosine ساده‌ترین baseline قابل بازتولید برای پاسخ به RQ2 و مقایسه منصفانه با روش گرافی هستند.",
        plannedActionFa: "یک index نسخه‌بندی‌شده و ranker پایدار می‌سازم و baseline را با Recall@k، MRR و زمان اجرا ثبت می‌کنم.",
        relatedDayTitles: [
            "TF-IDF Index bauen",
            "Cosine Ranker und top-k stabilisieren",
            "RetrievalRun-Vertrag implementieren",
            "Flat Baseline Release Gate"
        ]
    },
    {
        number: 3,
        date: "2026-08-22",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Word2Vec, CBOW, and Skip-Gram",
        topics: [
            "Word2Vec",
            "Continuous Bag-of-Words (CBOW)",
            "Skip-Gram"
        ],
        projectQuestion: "Can subword semantics improve code retrieval enough to justify added cost?",
        useCase: "Understand learned code representations without implementing a model",
        readingIds: [
            "reading-09"
        ],
        readingFocus: [
            "Token embeddings",
            "Context learning",
            "Loss of explicit graph structure"
        ],
        projectConnection: "Clarifies why learned embeddings may rank candidates but cannot replace an explicit Evidence Path.",
        extractionGoal: "Extract how the paper represents programs and where sequential embedding assumptions break down.",
        classQuestionsFa: [
            "برای واژه‌ها و شناسه‌های کد، CBOW بهتر است یا Skip-gram و چرا؟",
            "حداقل اندازه corpus برای یادگیری embedding قابل اتکا چقدر است؟",
            "چگونه Word2Vec را منصفانه و با همان داده‌ها با TF-IDF مقایسه کنم؟"
        ],
        whyThisMattersFa: "چون embedding ممکن است شباهت معنایی را بهتر پیدا کند، اما باید نشان دهد هزینه اضافه‌اش نسبت به baseline واقعاً ارزش دارد.",
        plannedActionFa: "یک آزمایش کوچک با seed و corpus ثابت اجرا می‌کنم و نتیجه را فقط در صورت بهبود قابل اندازه‌گیری نگه می‌دارم.",
        relatedDayTitles: [
            "Embedding-Experiment reproduzieren",
            "Semantic Experiment Gate"
        ]
    },
    {
        number: 4,
        date: "2026-08-24",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "GloVe, FastText, and embedding layers in Keras",
        topics: [
            "GloVe",
            "FastText",
            "Using Embedding Layers in Keras"
        ],
        projectQuestion: "Which embedding representations are useful retrieval baselines for code and text?",
        useCase: "Compare word, subword, code-language, and graph-aware embeddings",
        readingIds: [
            "reading-08",
            "reading-09",
            "reading-10",
            "reading-14"
        ],
        readingFocus: [
            "Embedding input and objective",
            "Subword and code structure",
            "Code-search evaluation"
        ],
        projectConnection: "RQ2 comparison point for optional semantic ranking while Evidence Records remain the verification source.",
        extractionGoal: "Extract representation choices, evaluation setup, and the architectural boundary between embedding and evidence.",
        classQuestionsFa: [
            "FastText برای شناسه‌های ناآشنا و زیرواژه‌های کد چه مزیتی دارد؟",
            "ورودی، خروجی و روش آموزش لایه Embedding در Keras دقیقاً چگونه تعریف می‌شود؟",
            "GloVe، FastText و embeddingهای مخصوص کد را با چه معیار مشترکی مقایسه کنم؟"
        ],
        whyThisMattersFa: "چون انتخاب نوع embedding روی پوشش شناسه‌های ناشناخته، هزینه اجرا و کیفیت بازیابی معنایی اثر مستقیم دارد.",
        plannedActionFa: "نمایش‌های مختلف را از نظر داده، هزینه و معیار ارزیابی مقایسه می‌کنم و برای ادامه یا توقف یک تصمیم مستند می‌نویسم.",
        relatedDayTitles: [
            "Embedding-Experiment reproduzieren",
            "BERT/GraphCodeBERT Go-No-Go"
        ]
    },
    {
        number: 5,
        date: "2026-08-26",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Recurrent neural networks and the vanishing-gradient problem",
        topics: [
            "Recurrent Neural Networks (RNNs)",
            "The Vanishing Gradient Problem"
        ],
        projectQuestion: "Why is recurrent sequence memory outside the thesis core?",
        useCase: "Place recurrent architectures within the software-engineering model taxonomy",
        readingIds: [
            "reading-09",
            "reading-11",
            "reading-12"
        ],
        readingFocus: [
            "Sequential model assumptions",
            "Software-engineering uses",
            "Limitations versus graph structure"
        ],
        projectConnection: "Supports the scope decision that repository Evidence Paths need explicit structure rather than hidden recurrent state.",
        extractionGoal: "Extract evidence for treating RNNs as background rather than a required project component.",
        classQuestionsFa: [
            "محو شدن گرادیان در RNN دقیقاً چگونه حافظه توالی‌های بلند را محدود می‌کند؟",
            "RNN در چه نوع مسئله‌ای از تحلیل مخزن کد واقعاً مناسب است؟",
            "برای وارد کردن RNN به دامنه پایان‌نامه چه شواهد و داده‌ای لازم دارم؟"
        ],
        whyThisMattersFa: "چون باید روشن کنم آیا حافظه توالی‌دار برای RQهای پایان‌نامه ضروری است یا فقط دانش زمینه‌ای محسوب می‌شود.",
        plannedActionFa: "دامنه و هزینه RNN را در یک تصمیم معماری ثبت می‌کنم و بدون داده کافی آن را به کار اجباری تبدیل نمی‌کنم.",
        relatedDayTitles: [
            "RNN/LSTM/GRU Scope Audit",
            "Semantic Experiment Gate"
        ]
    },
    {
        number: 6,
        date: "2026-08-29",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "LSTM, GRU, and sentiment analysis",
        topics: [
            "Advanced Recurrent Architectures: LSTM and GRU",
            "Sentiment Analysis Project Using LSTM"
        ],
        projectQuestion: "What does the recurrent-model literature contribute to scope and limitations?",
        useCase: "Distinguish course examples from thesis-relevant architecture",
        readingIds: [
            "reading-11",
            "reading-12"
        ],
        readingFocus: [
            "LSTM/GRU positioning",
            "Task-specific evaluation",
            "Why the thesis does not train them"
        ],
        projectConnection: "Creates a defensible scope boundary: reading is required, recurrent-model implementation is optional and not backlog.",
        extractionGoal: "Extract taxonomy and limitations only; do not create a mandatory sentiment-analysis implementation.",
        classQuestionsFa: [
            "برای داده محدود، تفاوت عملی LSTM و GRU در دقت، سرعت و overfitting چیست؟",
            "مثال تحلیل احساسات از نظر نوع label چه تفاوتی با داده‌های پایان‌نامه من دارد؟",
            "چه آزمایشی ثابت می‌کند یک مدل بازگشتی ارزش اضافه شدن به پروژه را دارد؟"
        ],
        whyThisMattersFa: "چون مثال کلاسی تحلیل احساسات مفید است، اما مسئله و برچسب‌های آن با شواهد ساختاری مخزن کد یکسان نیست.",
        plannedActionFa: "LSTM و GRU را فقط از نظر تناسب با مسئله مقایسه می‌کنم و در صورت نبود داده مناسب، آن‌ها را خارج از هسته پروژه نگه می‌دارم.",
        relatedDayTitles: [
            "RNN/LSTM/GRU Scope Audit",
            "BERT/GraphCodeBERT Go-No-Go"
        ]
    },
    {
        number: 7,
        date: "2026-08-31",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Sequence-to-Sequence and introduction to Transformers",
        topics: [
            "Sequence-to-Sequence Architecture (Seq2Seq)",
            "Introduction to the Transformer Architecture"
        ],
        projectQuestion: "How should retrieval remain separated from parametric generation?",
        useCase: "Trace the transition from Seq2Seq generation to retrieval-augmented systems",
        readingIds: [
            "reading-13",
            "reading-15",
            "reading-18",
            "reading-20"
        ],
        readingFocus: [
            "Seq2Seq architecture",
            "Parametric and retrieved memory",
            "Iterative repository retrieval"
        ],
        projectConnection: "RQ2/Answerability: generation may consume retrieved context, but only Evidence Records can support a repository claim.",
        extractionGoal: "Extract the retrieval-generation boundary, provenance expectations, and evaluation limitations.",
        classQuestionsFa: [
            "در Seq2Seq و Transformer مرز encoder و decoder دقیقاً چه مسئولیتی دارد؟",
            "چگونه سؤال طبیعی را به JSON معتبر و قابل کنترل تبدیل کنم؟",
            "هنگام تولید پاسخ، منبع و شناسه evidence را چگونه بدون تغییر حفظ کنم؟"
        ],
        whyThisMattersFa: "چون سامانه باید سؤال طبیعی را به قرارداد قابل اعتبارسنجی تبدیل کند و تولید متن را از شواهد بازیابی‌شده جدا نگه دارد.",
        plannedActionFa: "QuestionContract و fixtureها را می‌سازم و مرز روشن retrieval، verification و generation را تعریف می‌کنم.",
        relatedDayTitles: [
            "QuestionContract finalisieren",
            "Question-to-JSON Fixtures",
            "RAG-Orchestrierung ohne Halluzination"
        ]
    },
    {
        number: 8,
        date: "2026-09-02",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Self-attention, multi-head attention, and positional encoding",
        topics: [
            "Self-Attention",
            "Multi-Head Attention",
            "Positional Encoding"
        ],
        projectQuestion: "How can attention use structure without becoming evidence?",
        useCase: "Compare graph-aware attention with explicit graph traversal and provenance",
        readingIds: [
            "reading-06",
            "reading-07",
            "reading-09",
            "reading-14",
            "reading-19",
            "reading-21",
            "reading-23"
        ],
        readingFocus: [
            "Attention and data-flow signals",
            "Graph-aware context",
            "Provenance versus latent weights"
        ],
        projectConnection: "RQ1/RQ2: relates attention-guided retrieval to Graph Retrieval while preserving explicit Evidence Paths.",
        extractionGoal: "Extract where graph or data-flow structure enters attention and where traceability is lost or preserved.",
        classQuestionsFa: [
            "وزن‌های attention چه چیزی را نشان می‌دهند و چه چیزی را اثبات نمی‌کنند؟",
            "Positional Encoding چگونه با ساختار گراف و جریان داده کد تفاوت دارد؟",
            "چرا attention به‌تنهایی نمی‌تواند جای Evidence Path قابل بررسی را بگیرد؟"
        ],
        whyThisMattersFa: "چون attention می‌تواند بازیابی را هدایت کند، اما وزن پنهان آن نباید به‌عنوان مدرک یک ادعای ساختاری تلقی شود.",
        plannedActionFa: "attention و مسیر گراف صریح را مقایسه می‌کنم و verifier را طوری می‌سازم که فقط evidence قابل حل را بپذیرد.",
        relatedDayTitles: [
            "BERT/GraphCodeBERT Go-No-Go",
            "Claim-Evidence-Vertrag",
            "Verifier-Grenze implementieren"
        ]
    },
    {
        number: 9,
        date: "2026-09-05",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Transformer encoder/decoder, BERT, and GPT",
        topics: [
            "Transformer Encoder and Decoder",
            "BERT Family—Encoder-Based Models",
            "GPT Family—Decoder-Based Models"
        ],
        projectQuestion: "How can optional neural retrieval and answer wording remain role-aware and grounded?",
        useCase: "Position encoder retrieval, decoder generation, role prompts, and graph context",
        readingIds: [
            "reading-08",
            "reading-10",
            "reading-11",
            "reading-12",
            "reading-14",
            "reading-16",
            "reading-17",
            "reading-21",
            "reading-22",
            "reading-23"
        ],
        readingPlan: {
            required: [
                "reading-17",
                "reading-22",
                "reading-10",
                "reading-14"
            ],
            reuse: [],
            optional: [
                "reading-08",
                "reading-11",
                "reading-12",
                "reading-16",
                "reading-21",
                "reading-23"
            ],
            deliverables: [
                {
                    id: "session-09-kg-qa-note",
                    title: "DEEP-Notiz: Knowledge-Graph Repository QA",
                    readingIds: [
                        "reading-17"
                    ],
                    mode: "DEEP",
                    acceptance: "Pipeline, Graph-Grounding, Evaluationsaufbau und Abgrenzung zur Evidence-Path-Prüfung sind festgehalten."
                },
                {
                    id: "session-09-cpg-lm-note",
                    title: "TARGET-Notiz: CPG-beschränkter LLM-Kontext",
                    readingIds: [
                        "reading-22"
                    ],
                    mode: "TARGET",
                    acceptance: "CPG-Kontext, Traceability, Evaluationsgrenze und Bezug zu RQ1/RQ2 sind als sechs Abschnitte extrahiert."
                },
                {
                    id: "session-09-encoder-go-no-go",
                    title: "Go/No-Go: CodeBERT gegenüber GraphCodeBERT",
                    readingIds: [
                        "reading-10",
                        "reading-14"
                    ],
                    mode: "COMPARE",
                    acceptance: "Eine begründete Entscheidung nennt Nutzen, Messkriterien, Kosten und die unveränderte Evidence-Record-Grenze."
                }
            ]
        },
        readingFocus: [
            "Encoder versus decoder role",
            "Code/repository QA",
            "Role-aware grounded answers"
        ],
        projectConnection: "RQ2/Answerability: encoders may retrieve and decoders may phrase answers, but both remain downstream of verifiable evidence.",
        extractionGoal: "Extract architecture comparisons, QA pipelines, prompting effects, and limitations relevant to role-specific answers.",
        classQuestionsFa: [
            "برای retrieval چه زمانی encoderهایی مثل BERT مناسب‌تر از decoder هستند؟",
            "GPT را چگونه فقط برای بیان پاسخ و نه ساختن evidence به کار ببرم؟",
            "چگونه پاسخ Developer، Architect و QA متفاوت باشد ولی ادعاها و شواهد یکسان بمانند؟"
        ],
        whyThisMattersFa: "چون نقش encoder در بازیابی و decoder در نگارش پاسخ باید از منبع شواهد جدا و قابل کنترل باقی بماند.",
        plannedActionFa: "برای BERT/GraphCodeBERT تصمیم Go/No-Go می‌گیرم و خروجی نقش‌ها را روی یک RetrievalRun و evidence مشترک می‌سازم.",
        relatedDayTitles: [
            "BERT/GraphCodeBERT Go-No-Go",
            "Rollenformat für Developer, Architect und QA",
            "Cross-App Integration Gate"
        ]
    },
    {
        number: 10,
        date: "2026-09-07",
        berlinTime: "19:30–21:10",
        iranTime: "21:00–22:40",
        title: "Prompt engineering, PEFT, RAG, BLEU, and ROUGE",
        topics: [
            "Prompt Engineering",
            "Parameter-Efficient Fine-Tuning (PEFT)",
            "LoRA and QLoRA",
            "Retrieval-Augmented Generation (RAG)",
            "BLEU and ROUGE"
        ],
        projectQuestion: "Which parts belong in the thesis core, optional experiments, and future work?",
        useCase: "Synthesize retrieval, graph grounding, prompting, provenance, and evaluation",
        readingIds: [
            "reading-06",
            "reading-07",
            "reading-11",
            "reading-12",
            "reading-13",
            "reading-15",
            "reading-16",
            "reading-17",
            "reading-18",
            "reading-19",
            "reading-20",
            "reading-21",
            "reading-22",
            "reading-23"
        ],
        readingPlan: {
            required: [
                "reading-15",
                "reading-19",
                "reading-13"
            ],
            reuse: [
                "reading-06",
                "reading-17",
                "reading-22"
            ],
            optional: [
                "reading-07",
                "reading-11",
                "reading-12",
                "reading-16",
                "reading-18",
                "reading-20",
                "reading-21",
                "reading-23"
            ],
            deliverables: [
                {
                    id: "session-10-provenance-contract",
                    title: "KILT-Vertrag: Provenance und Evaluation",
                    readingIds: [
                        "reading-15"
                    ],
                    mode: "TARGET",
                    acceptance: "Recall@k, MRR, Evidence Coverage und korrekte Ablehnung sind Primärmetriken; BLEU/ROUGE bleiben sekundär."
                },
                {
                    id: "session-10-flat-graph-protocol",
                    title: "RANGER-Protokoll: Flat gegen Graph Retrieval",
                    readingIds: [
                        "reading-19"
                    ],
                    mode: "COMPARE",
                    acceptance: "Beide Retriever verwenden dieselben eingefrorenen Fragen, denselben Corpus und dieselben Evidence-IDs."
                },
                {
                    id: "session-10-rag-refusal-contract",
                    title: "RAG-Vertrag: Grounding und NOT_ANSWERABLE",
                    readingIds: [
                        "reading-13"
                    ],
                    mode: "SYNTHESIS",
                    acceptance: "Generierung startet erst nach Retrieval und Verifikation; bei unzureichender Evidenz endet der Ablauf mit NOT_ANSWERABLE."
                }
            ]
        },
        readingFocus: [
            "RAG and PEFT boundaries",
            "Retrieval and generation metrics",
            "Grounding, provenance, and answerability"
        ],
        projectConnection: "Synthesizes RQ1/RQ2 and fixes the boundary: BLEU/ROUGE assess generated text, not retrieval completeness or Evidence Path validity.",
        extractionGoal: "Complete the six-section notes and record a final architecture decision for each paper: core, comparison, background, or future work.",
        classQuestionsFa: [
            "چه زمانی LoRA یا QLoRA برای این پروژه واقعاً توجیه دارد؟",
            "RAG در نبود evidence کافی چگونه باید پاسخ ندادن درست را اجرا کند؟",
            "محدودیت BLEU و ROUGE برای سنجش درستی ادعا و کامل بودن شواهد چیست؟"
        ],
        whyThisMattersFa: "چون هسته پروژه باید پاسخ grounded و قابل ردگیری بدهد؛ معیار شباهت متن یا fine-tuning به‌تنهایی درستی evidence را تضمین نمی‌کند.",
        plannedActionFa: "قرارداد RAG grounded و refusal را پیاده می‌کنم، مرز معیارها را ثبت می‌کنم و PEFT را فقط با منفعت سنجش‌پذیر به آینده یا آزمایش اختیاری می‌برم.",
        relatedDayTitles: [
            "RAG-Orchestrierung ohne Halluzination",
            "Rollenformat für Developer, Architect und QA",
            "Evaluationsgrenze ROUGE/BLEU",
            "Cross-App Integration Gate"
        ]
    }
];
const nlpCourseTransferPlans = [
    {
        sessionNumber: 1,
        relevance: "core",
        noteDue: "2026-08-18",
        artifactDue: "2026-08-24",
        maxMinutes: 45,
        artifact: "nlp-tokenization-decision.md",
        acceptance: "Code-aware Tokenisierung gegen die Anforderungen des Repository-Corpus abgrenzen.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 2,
        relevance: "core",
        noteDue: "2026-08-20",
        artifactDue: "2026-08-26",
        maxMinutes: 45,
        artifact: "tfidf-baseline-contract.md",
        acceptance: "Input, top-k, Cosine-Metrik und einen NOT_ANSWERABLE-Fall festhalten.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 3,
        relevance: "experiment",
        noteDue: "2026-08-23",
        artifactDue: "2026-08-29",
        maxMinutes: 30,
        artifact: "word2vec-go-no-go.md",
        acceptance: "Nur Nutzen, Messgröße und Abbruchkriterium dokumentieren; kein Modelltraining als Pflicht.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 4,
        relevance: "experiment",
        noteDue: "2026-08-25",
        artifactDue: "2026-08-31",
        maxMinutes: 30,
        artifact: "embedding-layer-relevance.md",
        acceptance: "GloVe, FastText und trainierbare Embeddings als Core, Extension oder Future einstufen.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 5,
        relevance: "scope",
        noteDue: "2026-08-27",
        artifactDue: "2026-09-02",
        maxMinutes: 20,
        artifact: "rnn-scope-decision.md",
        acceptance: "Begründen, warum RNN für die Thesis Kern, Vergleich oder außerhalb des Scope ist.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 6,
        relevance: "scope",
        noteDue: "2026-08-30",
        artifactDue: "2026-09-05",
        maxMinutes: 20,
        artifact: "lstm-gru-scope-decision.md",
        acceptance: "Eine prüfbare Scope-Entscheidung ohne zusätzliche Implementierung treffen.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 7,
        relevance: "core",
        noteDue: "2026-09-01",
        artifactDue: "2026-09-07",
        maxMinutes: 45,
        artifact: "question-contract-v0.md",
        acceptance: "Eine reale Repository-Frage mit erwarteter Evidenz und Refusal-Fall definieren.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 8,
        relevance: "core",
        noteDue: "2026-09-03",
        artifactDue: "2026-09-09",
        maxMinutes: 45,
        artifact: "attention-to-evidence-note.md",
        acceptance: "Attention nicht als Provenance missverstehen und die Evidence-Grenze explizit machen.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 9,
        relevance: "core",
        noteDue: "2026-09-06",
        artifactDue: "2026-09-12",
        maxMinutes: 45,
        artifact: "codebert-graphcodebert-go-no-go.md",
        acceptance: "Nutzen, Messkriterien, Kosten und unveränderte Evidence-Record-Grenze dokumentieren.",
        replacesDailyOutput: true
    },
    {
        sessionNumber: 10,
        relevance: "core",
        noteDue: "2026-09-08",
        artifactDue: "2026-09-14",
        maxMinutes: 45,
        artifact: "rag-refusal-contract-v0.md",
        acceptance: "Retrieval, Verifier, Generator und NOT_ANSWERABLE als testbaren Vertrag festhalten.",
        replacesDailyOutput: true
    }
];
function courseTransferForSession(sessionNumber) {
    return nlpCourseTransferPlans.find((plan)=>plan.sessionNumber === sessionNumber) ?? null;
}
function nlpSessionsRelatedToPlanDay(dayTitle) {
    return nlpCourseSessions.filter((session)=>session.relatedDayTitles.includes(dayTitle));
}
const d = (title, sourceIds, why, lookFor, proposal, module, deliverable, kind = "project", recording)=>({
        title,
        sourceIds,
        why,
        lookFor,
        proposal,
        module,
        deliverable,
        kind,
        recording
    });
const technicalWeekSpecs = [
    {
        phase: "NLP-Lab Integration 1",
        phaseId: "nlp-foundations",
        title: "Flat Baseline produktionsreif machen",
        goal: "Die Ergebnisse des Live-Kurses werden in einen deterministischen, getesteten Flat Retriever überführt.",
        days: [
            d("Kursartefakte prüfen und einfrieren", [
                "proposal",
                "tfidf",
                "cosine"
            ], "Nur nachvollziehbare Kursartefakte dürfen die Thesis-Baseline beeinflussen.", [
                "Prüfe alle zehn Definition-of-Done-Gates",
                "Trenne Notebook, Produktionscode und Bericht",
                "Versioniere Konfiguration und Fixture"
            ], [
                "7.2",
                "11.3",
                "17"
            ], "NLP Retrieval Lab / Release", "course-artifact-manifest-v1.yaml"),
            d("Code-Aware Tokenizer implementieren", [
                "roslynSyntax",
                "allamanis"
            ], "Der produktive Tokenizer muss Source Spans bewahren und reproduzierbar sein.", [
                "Implementiere camelCase und snake_case",
                "Bewahre qualifizierte Namen und SourceLocation",
                "Führe die zwölf Kurs-Fixtures aus"
            ], [
                "3.1.3 bis 3.1.4",
                "38.2",
                "38.4"
            ], "Retrieval.Flat / CodeAwareTokenizer", "CodeAwareTokenizer + 12 passing tests"),
            d("TF-IDF Index bauen", [
                "tfidf",
                "proposal"
            ], "Die zentrale Flat Baseline benötigt einen eingefrorenen Corpus und versionierte Parameter.", [
                "Lade nur CorpusManifest-Einträge",
                "Versioniere n-gram, min_df und Stop-Tokens",
                "Speichere ConfigHash und CorpusCommit"
            ], [
                "9.3",
                "13.2",
                "29.3"
            ], "Retrieval.Flat / Index", "tfidf-index-v1 + config hash"),
            d("Cosine Ranker und top-k stabilisieren", [
                "cosine",
                "sweqa"
            ], "Ranking muss bei gleichen Scores einen festen Tie-break besitzen.", [
                "Implementiere cosine score",
                "Definiere Tie-break über stabile Candidate-ID",
                "Teste k=1, 5 und 10"
            ], [
                "14.2",
                "29.3",
                "38.10"
            ], "Retrieval.Flat / Ranker", "cosine-ranker + golden ranking tests"),
            d("RetrievalRun-Vertrag implementieren", [
                "kilt",
                "proposal"
            ], "Cross App und Evaluation dürfen nicht von internen Klassen des Labs abhängen.", [
                "Validiere runId, queryId und candidates",
                "Ergänze Evidence IDs und AnswerStatus",
                "Erzeuge gültige und ungültige Fixtures"
            ], [
                "3.2",
                "3.6",
                "38.2"
            ], "Contracts / RetrievalRun", "retrieval-run.schema.json + fixtures"),
            d("Flat Baseline Release Gate", [
                "tfidf",
                "cosine",
                "proposal"
            ], "Die Baseline muss unabhängig startbar und testbar sein, bevor Graph-Vergleich beginnt.", [
                "Führe Clean Build und Tests aus",
                "Messe Recall@k, MRR und Laufzeit auf dem Pilot",
                "Dokumentiere bekannte Grenzen"
            ], [
                "7.2",
                "14.2",
                "17"
            ], "NLP Retrieval Lab / Baseline", "flat-baseline-v1-release-report.md")
        ]
    },
    {
        phase: "NLP-Lab Integration 2",
        phaseId: "nlp-sequences",
        title: "Question Contracts und optionale Semantik",
        goal: "Fragen werden sicher strukturiert; neuronale Optionen erhalten einen messbaren Go/No-Go-Gate.",
        days: [
            d("QuestionContract finalisieren", [
                "seq2seq",
                "proposal"
            ], "Natürliche Sprache darf nur in erlaubte, validierbare Query-Felder überführt werden.", [
                "Definiere role, intent, entities und constraints",
                "Verbiete unbekannte Felder",
                "Modelliere Validierungsfehler explizit"
            ], [
                "3.6.2",
                "33.3",
                "38.2"
            ], "QueryContracts", "question-contract.schema.json"),
            d("Question-to-JSON Fixtures", [
                "sweqa",
                "kilt"
            ], "Drei Rollen benötigen reproduzierbare Beispiele statt freier Prompt-Ausgabe.", [
                "Erstelle Developer-Frage",
                "Erstelle Architect-Frage",
                "Erstelle QA-Frage plus invalid case"
            ], [
                "25",
                "26",
                "33.3"
            ], "QueryContracts / Fixtures", "question-contract-fixtures.json"),
            d("Embedding-Experiment reproduzieren", [
                "embeddings",
                "graphcodebert"
            ], "Ein optionaler semantischer Retriever muss exakt gegen TF-IDF messbar sein.", [
                "Nutze denselben Corpus und dieselben Fragen",
                "Fixiere Modell und Seed",
                "Messe Recall@k, MRR und Laufzeit"
            ], [
                "7.2",
                "8.2",
                "29.3"
            ], "Retrieval.Neural / Experiment", "embedding-vs-tfidf-results.csv"),
            d("RNN/LSTM/GRU Scope Audit", [
                "rnn",
                "lstm",
                "gru"
            ], "Kurswissen darf nicht ohne Datengrundlage zu Thesis-Scope werden.", [
                "Prüfe Dataset-Größe und Labels",
                "Prüfe Nutzen für RQ1/RQ2",
                "Dokumentiere Kosten und Reproduzierbarkeit"
            ], [
                "8",
                "31",
                "37.3"
            ], "Architecture / Scope", "ADR-005-sequence-models.md"),
            d("BERT/GraphCodeBERT Go-No-Go", [
                "bert",
                "graphcodebert"
            ], "Neural Retrieval wird nur bei messbarem Mehrwert und vertretbaren Kosten weitergeführt.", [
                "Vergleiche mit Flat baseline",
                "Prüfe Data-flow-Nutzen",
                "Lege Stop-Schwelle vor Ergebnis fest"
            ], [
                "4.3",
                "8.2",
                "37.2"
            ], "Retrieval.Neural / Decision", "bert-retrieval-adr.md"),
            d("Semantic Experiment Gate", [
                "proposal",
                "kilt"
            ], "Die Woche endet mit einer Entscheidung, nicht mit mehreren halbfertigen Modellen.", [
                "Prüfe alle Messdaten",
                "Entscheide Core, optional oder Future",
                "Versioniere Config, Ergebnis und ADR"
            ], [
                "16",
                "20",
                "37"
            ], "NLP Retrieval Lab / Decision", "semantic-experiment-gate.md")
        ]
    },
    {
        phase: "NLP-Lab Integration 3",
        phaseId: "nlp-transformers",
        title: "Grounded Answering und Cross-App-Vertrag",
        goal: "Retriever, Verifier und Antwortformat werden getrennt und über einen getesteten Vertrag verbunden.",
        days: [
            d("Claim-Evidence-Vertrag", [
                "kilt",
                "logiclens"
            ], "Jede Antwort benötigt explizite Claims, Evidence IDs und einen AnswerStatus.", [
                "Definiere Claim und Evidence-Referenz",
                "Definiere SUPPORTED, PARTIAL und NOT_ANSWERABLE",
                "Verbiete Text ohne referenzierte Evidenz"
            ], [
                "3.6",
                "14.3",
                "27"
            ], "Answering / Contract", "answer-contract.schema.json"),
            d("Verifier-Grenze implementieren", [
                "proposal",
                "nagy"
            ], "Retriever-Scores dürfen keine strukturellen Claims bestätigen.", [
                "Prüfe Evidence-ID-Auflösung",
                "Prüfe widersprüchliche Evidence",
                "Erzeuge Correct-Refusal-Fixtures"
            ], [
                "3.2",
                "3.6",
                "38.9"
            ], "Verifier", "answer-verifier + refusal tests"),
            d("RAG-Orchestrierung ohne Halluzination", [
                "rag",
                "kilt"
            ], "Generation darf nur nach Retrieval und Verifikation stattfinden.", [
                "Trenne Retriever, Verifier und Generator",
                "Stoppe bei NOT_ANSWERABLE",
                "Protokolliere verwendete Evidence IDs"
            ], [
                "7.2",
                "14.2",
                "33"
            ], "Answering / RAG", "grounded-rag-flow.mmd + integration test"),
            d("Rollenformat für Developer, Architect und QA", [
                "gpt",
                "sweqa"
            ], "Die Darstellung variiert nach Rolle, nicht die zugrunde liegende Evidenz.", [
                "Definiere drei Output Views",
                "Nutze denselben RetrievalRun",
                "Teste Verbot veränderter Claims"
            ], [
                "25",
                "26",
                "33.3"
            ], "Answering / Views", "role-output-contracts.yaml"),
            d("Evaluationsgrenze ROUGE/BLEU", [
                "bleu",
                "proposal"
            ], "Textähnlichkeit ist sekundär zu Evidenzvollständigkeit und korrekter Ablehnung.", [
                "Definiere primäre RQ2-Metriken",
                "Ordne ROUGE/BLEU als sekundär ein",
                "Dokumentiere Failure-Beispiele"
            ], [
                "14.2",
                "14.3",
                "29.3"
            ], "Evaluation / Metrics", "rag-metrics-boundary.md"),
            d("Cross-App Integration Gate", [
                "proposal",
                "logiclens",
                "codefuse"
            ], "Das Lab wird nur über einen stabilen Vertrag und bestandene E2E-Prüfung verbunden.", [
                "Validiere RetrievalRun im Adapter",
                "Teste Flat, Graph und Refusal",
                "Erzeuge Installations- und Rollback-Notiz"
            ], [
                "16",
                "17",
                "20"
            ], "Cross App / NLP Adapter", "nlp-lab-integration-readiness.md + E2E test")
        ]
    },
    {
        phase: "Phase 0: Scope und Corpus",
        phaseId: "scope-corpus",
        title: "Frozen Corpus und Forschungsvertrag",
        goal: "Ein festes Corpus, ein vertretbarer Scope und vorab definierte Fragen werden vorbereitet.",
        days: [
            d("Ziel und zwei Forschungsfragen erneut prüfen", [
                "proposal",
                "hevner"
            ], "Jede spätere Implementierung muss eine der beiden Forschungsfragen direkt unterstützen.", [
                "Formuliere das Ziel des Artefakts in einem Satz",
                "Extrahiere die Analyseeinheit von RQ1 präzise",
                "Liste die RQ2-Metriken ohne neue Kriterien auf"
            ], [
                "6",
                "7",
                "11.1"
            ], "Docs / Research Contract", "research-contract-v1.md"),
            d("Danphe einfrieren", [
                "danphe",
                "proposal"
            ], "Ohne festen Commit sind die Ergebnisse nicht reproduzierbar.", [
                "Dokumentiere Commit und Submodule",
                "Ermittle Lizenz und Build-Anforderungen",
                "Definiere Pfade außerhalb des Corpus"
            ], [
                "9.3",
                "11.3",
                "38.1"
            ], "Corpus", "corpus-manifest.yaml"),
            d("Corpus Census", [
                "danphe",
                "roslynWorkspace"
            ], "Vor dem Extractor muss klar sein, welche Muster im Corpus tatsächlich vorkommen.", [
                "Ermittle die Anzahl von Solution, Project und File",
                "Zähle DbContext und DbSet",
                "Ziehe Stichproben realer READ/WRITE-Muster"
            ], [
                "3.5.2",
                "9.2",
                "28"
            ], "Corpus / Census", "corpus-census.csv"),
            d("Core- und Extension-Scope", [
                "proposal",
                "alshemaimri"
            ], "Scope Creep muss vor der Implementierung gestoppt werden.", [
                "Liste die Core-Fälle auf",
                "Trenne Fälle, die von Beobachtungen im Corpus abhängen",
                "Dokumentiere Future-Fälle mit Stop Rule"
            ], [
                "8",
                "31",
                "37"
            ], "Docs / Scope", "scope-and-stop-rules.md"),
            d("Rollenbasierte Use Cases", [
                "proposal",
                "sweqa"
            ], "Reale Fragen müssen vor dem Retrieval definiert werden.", [
                "Überführe den Developer-Bedarf in Evidenzfelder",
                "Überführe den Architect-Bedarf in Pfade",
                "Überführe QA/Compliance in Coverage und Gaps"
            ], [
                "1.6",
                "25",
                "26"
            ], "QueryContracts", "use-cases-v1.yaml"),
            d("Erster Gold-Pilot", [
                "proposal",
                "danphe"
            ], "Kleine positive, negative und schwierige Beispiele steuern den Extractor-Pfad.", [
                "Fixiere die Annotationseinheit",
                "Wähle fünf positive und fünf negative Fälle",
                "Erstelle drei Hard Negatives aus Namensähnlichkeit"
            ], [
                "12",
                "13.3",
                "29.4"
            ], "Evaluation / Gold", "gold/pilot-v1.jsonl")
        ]
    },
    {
        phase: "Phase 1: Roslyn Syntax",
        phaseId: "roslyn-syntax",
        title: "Von der Solution zur Declaration",
        goal: "Dateien, Klassen und Methoden werden mit eindeutiger Source Location extrahiert.",
        days: [
            d("Solution Loader", [
                "roslynWorkspace",
                "proposal"
            ], "Alle Projekte müssen aus einer reproduzierbaren Eingabe geladen werden.", [
                "Ermittle die Hierarchie Solution/Project/Document",
                "Definiere das Verhalten bei Build-Fehlern",
                "Lege RepositoryId und ProjectId fest"
            ], [
                "3.1",
                "10.2",
                "38.2"
            ], "Extractors.CSharp", "SolutionLoader.cs + tests"),
            d("Syntax Tree und Traversal", [
                "roslynSyntax",
                "yamaguchi"
            ], "Strukturierte Traversierung ersetzt fragile reguläre Ausdrücke.", [
                "Trenne Node, Token und Trivia",
                "Wähle die passende Traversierung für Deklarationen",
                "Dokumentiere SourceSpan und LineSpan"
            ], [
                "3.1.3 bis 3.1.4",
                "4.1"
            ], "Extractors.CSharp", "SyntaxWalker.cs + fixture"),
            d("File und Namespace", [
                "roslynSyntax",
                "allamanis"
            ], "Eine Symbol-ID ist ohne Datei- und Namespace-Kontext unvollständig.", [
                "Erkenne file-scoped Namespaces",
                "Decke verschachtelte Namespaces ab",
                "Trenne Generated Files mit einer dokumentierten Regel"
            ], [
                "3.1.4",
                "38.4"
            ], "Extractors.CSharp", "FileNamespaceExtractor.cs"),
            d("Class und Interface", [
                "roslynSyntax",
                "yamaguchi"
            ], "Types verbinden Methoden, Vererbung und Mapping.", [
                "Erkenne class, record und interface",
                "Dokumentiere verschachtelte Types",
                "Bewahre partial Types ohne falsche Zusammenführung"
            ], [
                "3.1.4",
                "3.3.6",
                "38.4"
            ], "Extractors.CSharp", "TypeDeclarationExtractor.cs"),
            d("Method und Constructor", [
                "roslynSyntax",
                "allamanis"
            ], "Method ist die zentrale Einheit von RQ1 und vieler Evidenzpfade.", [
                "Erzeuge die vollständige Signatur",
                "Trenne Konstruktor und lokale Funktion",
                "Fixiere startLine und endLine"
            ], [
                "7.1",
                "12.2",
                "38.4"
            ], "Extractors.CSharp", "MethodExtractor.cs"),
            d("Golden Tests für Deklarationen", [
                "proposal",
                "roslynSyntax"
            ], "Vor dem Semantic Model muss die Syntax-Schicht verlässlich sein.", [
                "Erstelle minimale Fixtures für jede Deklaration",
                "Mache die Ausgabereihenfolge deterministisch",
                "Füge einen negativen Fall für Generated Code hinzu"
            ], [
                "38.10",
                "17"
            ], "Tests / CSharp", "declarations.golden.json")
        ]
    },
    {
        phase: "Phase 1: Roslyn Semantic",
        phaseId: "roslyn-semantic",
        title: "Symbols, Calls und Provenance",
        goal: "Declaration und Invocation werden über das Semantic Model verbunden; Unresolved bleibt explizit.",
        days: [
            d("SemanticModel und Symbol", [
                "roslynSemantic",
                "shatnawi"
            ], "Ähnliche Namen dürfen keine falsche semantische Beziehung erzeugen.", [
                "Trenne DeclaredSymbol und SymbolInfo",
                "Erzeuge eine vollständig qualifizierte Identität",
                "Halte Ambiguous und Unresolved explizit"
            ], [
                "3.1.5 bis 3.1.7",
                "38.4"
            ], "Extractors.CSharp", "SymbolResolver.cs"),
            d("Invocation Extraction", [
                "roslynSemantic",
                "allamanis"
            ], "INVOKES muss den Call Site mit dem Ziel-Symbol und seiner Location verbinden.", [
                "Finde InvocationExpression",
                "Löse die Zielmethode auf",
                "Bewahre die Call-Site-Location"
            ], [
                "3.3.7",
                "10.2",
                "38.4"
            ], "Extractors.CSharp", "InvocationExtractor.cs"),
            d("Constructor und Extension Calls", [
                "roslynSemantic",
                "shatnawi"
            ], "Call-Regeln müssen gängige C#-Fälle ohne Vermutungen abdecken.", [
                "Verbinde Object Creation mit dem Konstruktor",
                "Löse das Ziel von Extension Methods auf",
                "Halte Dynamic Dispatch als Unresolved"
            ], [
                "2.1",
                "3.1.7",
                "27.4"
            ], "Extractors.CSharp", "SpecialCallExtractor.cs"),
            d("Globale Symbolidentität", [
                "logiclens",
                "proposal"
            ], "Cross-Project-Links sind ohne stabile Identität nicht reproduzierbar.", [
                "Kombiniere Assembly, Namespace, Type und Signature",
                "Ergänze RepositoryId und ProjectId",
                "Erstelle einen Collision-Test für Overloads"
            ], [
                "3.3.10",
                "38.4"
            ], "Core / Identity", "SymbolId.cs + collision tests"),
            d("SourceLocation", [
                "nagy",
                "proposal"
            ], "Jeder Claim muss auf Datei und Zeile zurückführbar sein.", [
                "Definiere lineStart und lineEnd",
                "Trenne Call-Site- und Declaration-Location",
                "Normalisiere den Dateipfad relativ zum Repository"
            ], [
                "3.4.5 bis 3.4.7",
                "10.5",
                "38.3"
            ], "Core / Provenance", "SourceLocation.cs"),
            d("Call-Graph-Integration", [
                "logiclens",
                "codefuse"
            ], "Der erste strukturelle Graph wird mit Fixture und deterministischer Ausgabe abgeschlossen.", [
                "Verbinde File-, Type- und Method-Nodes",
                "Zähle ungelöste INVOKES",
                "Bestätige manuell einen realen Danphe-Pfad"
            ], [
                "10.2",
                "10.3",
                "38.10"
            ], "Extractors.CSharp / Integration", "call-graph-v1.jsonl")
        ]
    },
    {
        phase: "Phase 2: EF Core READ",
        phaseId: "ef-read",
        title: "Mapping und READ-Evidenz",
        goal: "DbContext und DbSet werden bis zur Tabelle und READ-Operation mit Provenance extrahiert.",
        days: [
            d("DbContext Discovery", [
                "efMapping",
                "shatnawi"
            ], "DbContext ist der Einstiegspunkt des EF-Core-Modells.", [
                "Löse die Vererbung von DbContext auf",
                "Dokumentiere die Context-Identität",
                "Markiere unvollständige oder externe Contexts"
            ], [
                "3.2.2 bis 3.2.3",
                "38.5"
            ], "Extractors.EFCore", "DbContextExtractor.cs"),
            d("DbSet und Entity", [
                "efMapping",
                "alshemaimri"
            ], "Ein DbSet ist ein Mapping-Kandidat, keine ausgeführte READ-Operation.", [
                "Extrahiere DbSet-Property und generischen Typ",
                "Löse die Entity-Identität auf",
                "Trenne Candidate-Status von READ"
            ], [
                "3.2.4",
                "28.1",
                "38.5"
            ], "Extractors.EFCore", "DbSetExtractor.cs"),
            d("Table Mapping", [
                "efMapping",
                "shatnawi"
            ], "Ein Tabellen-Claim ist nur mit gültigem Mapping erlaubt.", [
                "Finde das ToTable-Mapping",
                "Dokumentiere konventionsbasierte Tabellennamen",
                "Setze unbekanntes Mapping auf UNRESOLVED"
            ], [
                "3.2.12 bis 3.2.13",
                "38.3"
            ], "Extractors.EFCore", "TableMappingResolver.cs"),
            d("LINQ Query Candidate", [
                "efQuerying",
                "nagy"
            ], "Das Vorhandensein eines Query-Ausdrucks bedeutet noch keine Ausführung.", [
                "Verbinde den Query Root mit DbSet",
                "Dokumentiere Where, Select und Include",
                "Bestimme die Grenze der verzögerten Ausführung"
            ], [
                "3.2.5 bis 3.2.6",
                "28.1"
            ], "Extractors.EFCore", "LinqQueryExtractor.cs"),
            d("Materialization und READ", [
                "efQuerying",
                "nagy"
            ], "READ muss mit Materializer und Zieltabelle verbunden sein.", [
                "Decke ToList, First, Single, Any und Count ab",
                "Dokumentiere asynchrone Varianten",
                "Bewahre die SourceLocation der Materialisierung"
            ], [
                "28.1",
                "38.5"
            ], "Extractors.EFCore", "ReadMaterializerRules.cs"),
            d("READ Integration Tests", [
                "proposal",
                "danphe"
            ], "READ-Regeln werden mit positiven und negativen Fixtures sowie einem Danphe-Beispiel abgeschlossen.", [
                "Bestätige einen realen READ-End-to-End-Fall",
                "Markiere DbSet ohne Materialisierung als negativ",
                "Erzeuge bei unbekanntem Mapping keinen Tabellen-Claim"
            ], [
                "7.1",
                "14.1",
                "38.10"
            ], "Tests / EFCore", "ef-read.golden.json")
        ]
    },
    {
        phase: "Phase 2: EF Core WRITE",
        phaseId: "ef-write",
        title: "Mutation, Persistence und Vertical Slice",
        goal: "Mutation wird über SaveChanges bis zur Tabelle mit einem erklärbaren Evidenzpfad verbunden.",
        days: [
            d("Add, Update und Remove", [
                "efSaving",
                "alshemaimri"
            ], "Ein Mutation-Kandidat muss von Persistence getrennt bleiben.", [
                "Decke die APIs Add, Update und Remove ab",
                "Löse Entity und DbSet-Ziel auf",
                "Dokumentiere die MUTATES-Kante mit Location"
            ], [
                "3.2.7 bis 3.2.8",
                "28.2"
            ], "Extractors.EFCore", "MutationExtractor.cs"),
            d("SaveChanges und PERSISTS", [
                "efSaving",
                "nagy"
            ], "Eine unterstützte WRITE-Operation benötigt einen erklärbaren Pfad bis SaveChanges.", [
                "Extrahiere SaveChanges und SaveChangesAsync",
                "Verbinde Mutation und Persistence in einer Method",
                "Begrenze die interprozedurale Distanz explizit"
            ], [
                "28.2",
                "38.6"
            ], "Extractors.EFCore", "PersistenceExtractor.cs"),
            d("ExecuteUpdate und ExecuteDelete", [
                "efSaving",
                "proposal"
            ], "Bulk-APIs besitzen eigene Regeln und dürfen nicht wie Change Tracking behandelt werden.", [
                "Finde Bulk-Methoden",
                "Löse die Zielabfrage auf",
                "Dokumentiere, dass SaveChanges nicht nötig ist"
            ], [
                "38.6",
                "27.1"
            ], "Extractors.EFCore", "BulkWriteRules.cs"),
            d("WRITE Target Resolution", [
                "efMapping",
                "shatnawi"
            ], "WRITES_TO wird nur bei ausreichendem Mapping erzeugt.", [
                "Erzeuge den Entity-to-table-Pfad",
                "Stoppe bei ungelöstem Mapping",
                "Behaupte Trigger oder Interceptor nicht ohne Evidenz"
            ], [
                "3.4.8",
                "38.6"
            ], "Extractors.EFCore", "WriteTargetResolver.cs"),
            d("Realer Vertical Slice", [
                "danphe",
                "proposal"
            ], "Ein realer Pfad von Method zu Table zeigt den Wert des Artefakts.", [
                "Bestimme Method und Call Chain",
                "Führe Mutation, Persistence und Mapping zusammen",
                "Prüfe alle SourceLocations manuell"
            ], [
                "10.2 bis 10.5",
                "26.2 bis 26.4"
            ], "CLI / End-to-End", "vertical-slice-001.json"),
            d("Capability Matrix", [
                "alshemaimri",
                "proposal"
            ], "Transparente Grenzen verhindern überzogene Claims.", [
                "Klassifiziere jedes EF-Muster als supported, partial oder unsupported",
                "Dokumentiere ADO.NET und SQL nur, wenn sie beobachtet wurden",
                "Formuliere eine Stop Decision für Erweiterungen"
            ], [
                "8",
                "28.4",
                "31"
            ], "Docs / Capabilities", "capability-matrix.md")
        ]
    },
    {
        phase: "Phase 3: Evidence Model",
        phaseId: "evidence-model",
        title: "EvidenceRecord, Provenance und JSONL",
        goal: "Das wissenschaftliche Modell wird vom Storage getrennt; alle Claims bleiben nachvollziehbar.",
        days: [
            d("EvidenceRecord Contract", [
                "proposal",
                "kilt"
            ], "Die zentrale Artefakteinheit muss Claim, Rule, Status und Location trennen.", [
                "Extrahiere die Pflichtfelder des Records",
                "Trenne ObservationType und ClaimType",
                "Definiere RuleId und RuleVersion"
            ], [
                "3.4",
                "10.5",
                "38.3"
            ], "Core", "EvidenceRecord.cs"),
            d("Evidence Status", [
                "proposal",
                "kilt"
            ], "OBSERVED und DERIVED dürfen nicht mit UNRESOLVED oder CONFLICTING vermischt werden.", [
                "Formuliere die Bedingung jedes Status",
                "Definiere erlaubte Übergänge",
                "Erstelle für jeden Status ein Fixture"
            ], [
                "3.4.9",
                "10.6",
                "27.4"
            ], "Core", "EvidenceStatus.cs + tests"),
            d("Globale IDs und Datenbankziel", [
                "proposal",
                "nagy"
            ], "Das Tabellenziel muss mit ausreichender Identität und ohne erfundenes Schema gespeichert werden.", [
                "Kombiniere Repository-, Project- und Symbol-ID",
                "Definiere die Identität von Database, Schema und Table",
                "Markiere partielle Identität explizit"
            ], [
                "38.4",
                "28.3"
            ], "Core", "DatabaseTargetId.cs"),
            d("Evidence Path", [
                "logiclens",
                "proposal"
            ], "RQ2 benötigt einen validen Pfad, nicht nur eine Ergebnisliste.", [
                "Definiere die Reihenfolge erforderlicher Kanten",
                "Bewahre die SourceLocation jedes Schritts",
                "Mache fehlende Schritte zu Evidence Gaps"
            ], [
                "3.4.7 bis 3.4.8",
                "14.2",
                "38.9"
            ], "Core / Paths", "EvidencePath.cs"),
            d("Deterministisches JSONL", [
                "proposal",
                "codefuse"
            ], "Dieselbe Eingabe muss dieselbe Evidenzausgabe erzeugen.", [
                "Fixiere Feldreihenfolge und Encoding",
                "Definiere den Sortierschlüssel der Records",
                "Speichere den Output-Hash im Manifest"
            ], [
                "11.3",
                "38.11"
            ], "CLI / Serialization", "evidence-v1.jsonl + hash"),
            d("Evidence Integration Gate", [
                "proposal",
                "danphe"
            ], "Vor dem Graphen muss die storageunabhängige Ausgabe valide sein.", [
                "Validiere READ- und WRITE-Records",
                "Erlaube keinen Tabellen-Claim ohne Mapping",
                "Reproduziere den Golden Snapshot"
            ], [
                "17",
                "27.3",
                "38.10"
            ], "Core / Integration", "evidence-contract-v1.md")
        ]
    },
    {
        phase: "Phase 4: Neo4j Graph",
        phaseId: "neo4j-graph",
        title: "Graph Schema und Import",
        goal: "Das Evidence Model wird nach Neo4j übertragen, ohne seine wissenschaftliche Bedeutung an den Storage zu binden.",
        days: [
            d("Property Graph Modeling", [
                "neo4jModeling",
                "yamaguchi"
            ], "Nodes und Relationships müssen Use Cases und Evidenzableitung folgen.", [
                "Leite die nötigen Nodes aus §38.8 ab",
                "Dokumentiere die Kardinalität der Beziehungen",
                "Behandle EvidenceRecord als First-Class-Objekt"
            ], [
                "3.3",
                "10.3",
                "38.8"
            ], "Graph", "graph-schema-v1.md"),
            d("Constraints und Indizes", [
                "neo4jModeling",
                "codefuse"
            ], "Globale IDs brauchen Eindeutigkeit; Queries müssen ausführbar bleiben.", [
                "Definiere Unique Constraints",
                "Wähle querygetriebene Indizes",
                "Erstelle Tests für Kollisionen und fehlende IDs"
            ], [
                "3.3.10",
                "38.8"
            ], "Graph", "constraints.cypher"),
            d("Cypher CREATE und MERGE", [
                "cypher"
            ], "Der Importer darf bei wiederholter Ausführung keine Duplikate erzeugen.", [
                "Erkläre den Unterschied zwischen CREATE und MERGE",
                "Übe MERGE auf der globalen ID",
                "Bewahre Relationship-Provenance ohne Überschreiben"
            ], [
                "3.3.8",
                "38.8"
            ], "Graph / Import", "cypher-practice.md"),
            d("Node Import", [
                "neo4jModeling",
                "proposal"
            ], "Der schrittweise Import muss test- und berichtbar sein.", [
                "Importiere Repository bis Method",
                "Importiere DatabaseObject und EvidenceRecord",
                "Dokumentiere Counts vor und nach dem Import"
            ], [
                "10.2",
                "38.8"
            ], "Graph / Import", "NodeImporter.cs"),
            d("Relationship Import", [
                "logiclens",
                "proposal"
            ], "Kanten müssen Claim Type und Provenance erhalten.", [
                "Importiere INVOKES, MAPS_TO, MUTATES und PERSISTS",
                "Verbinde READS_FROM und WRITES_TO mit Evidenz",
                "Lösche ungelöste Ziele nicht"
            ], [
                "3.3.7",
                "38.8"
            ], "Graph / Import", "RelationshipImporter.cs"),
            d("Idempotenter Graph Build", [
                "codefuse",
                "proposal"
            ], "Zwei identische Läufe müssen gleiche Counts und Query-Antworten liefern.", [
                "Baue den Graphen zweimal",
                "Prüfe auf doppelte Nodes und Edges",
                "Vergleiche Run Manifest und Counts"
            ], [
                "11.3",
                "17",
                "38.10"
            ], "Graph / Integration", "graph-build-report.json")
        ]
    },
    {
        phase: "Phase 4: Retrieval und Query",
        phaseId: "retrieval-query",
        title: "Flat vs. Graph und Query Contracts",
        goal: "Zwei Retrieval-Methoden werden auf derselben Evidenz und mit festen Fragen verglichen.",
        days: [
            d("Question Contract Schema", [
                "proposal",
                "sweqa"
            ], "Jede Frage braucht eine definierte Rolle, ein Ziel und Evidenzanforderungen.", [
                "Leite QuestionTypes aus den Use Cases ab",
                "Definiere erforderliche Evidenzfelder",
                "Schreibe die Refusal-Bedingung in den Contract"
            ], [
                "3.6.2",
                "13.3",
                "33.3",
                "38.9"
            ], "QueryContracts", "question-contract.schema.json"),
            d("Flat Retriever Freeze", [
                "tfidf",
                "draco"
            ], "Die Baseline darf nach Sichtung der Testergebnisse nicht verändert werden.", [
                "Friere Tokenizer und Konfiguration ein",
                "Dokumentiere Top-k und Tie-break",
                "Fixiere das Ausgabeformat der Kandidaten"
            ], [
                "13.2",
                "29.3"
            ], "Retrieval.Flat", "flat-config-v1.json"),
            d("Graph Query UC1 und UC2", [
                "cypher",
                "proposal"
            ], "READ- und WRITE-Queries müssen vollständige Evidenzpfade liefern.", [
                "Implementiere die Tabellenleser von UC1",
                "Implementiere Mutationen und Persistence von UC2",
                "Nimm SourceLocation in die Ausgabe auf"
            ], [
                "26.1",
                "26.2",
                "38.9"
            ], "Retrieval.Graph", "queries/uc1-uc2.cypher"),
            d("Graph Query UC3 und UC4", [
                "cypher",
                "logiclens"
            ], "Mechanismus und vollständiger Pfad werden für Architects erklärbar.", [
                "Frage den Zugriffsmechanismus ab",
                "Gib den vollständigen Evidenzpfad zurück",
                "Markiere Projektgrenzen"
            ], [
                "26.3",
                "26.4",
                "26.6"
            ], "Retrieval.Graph", "queries/uc3-uc4.cypher"),
            d("Negative Control und Refusal", [
                "proposal",
                "kilt"
            ], "Ähnliche Namen dürfen keine unbelegte Antwort erzeugen.", [
                "Implementiere fehlende Evidenz für UC5",
                "Markiere Namensähnlichkeit in UC7 als negativ",
                "Gib einen NOT_ANSWERABLE-Reason-Code zurück"
            ], [
                "26.5",
                "26.7",
                "14.3"
            ], "Verifier", "negative-controls.json"),
            d("Fair Comparison Harness", [
                "draco",
                "proposal"
            ], "Flat und Graph müssen dieselben Fragen, dieselbe Evidenz und dasselbe Budget verwenden.", [
                "Fixiere das gemeinsame Input Set",
                "Setze dasselbe Kandidatenbudget",
                "Speichere Rohdaten unverändert"
            ], [
                "13.2",
                "29.3",
                "38.11"
            ], "Evaluation", "retrieval-harness.cs")
        ]
    },
    {
        phase: "Phase 5: Goldstandard",
        phaseId: "goldstandard",
        title: "Annotation, Pilot und Data Freeze",
        goal: "Der Goldstandard wird mit klarer Einheit, Qualitätskontrolle und getrennten Pilot-/Testdaten vorbereitet.",
        days: [
            d("Annotationsleitfaden", [
                "proposal",
                "kilt"
            ], "Zwei Annotierende müssen dasselbe Evidenzelement gleich verstehen.", [
                "Definiere die Einheiten von RQ1 und RQ2",
                "Gib Beispiele für Status- und Pfadregeln",
                "Definiere die Konfliktauflösung"
            ], [
                "12.2",
                "12.3",
                "29.4"
            ], "Evaluation / Gold", "annotation-guide-v1.md"),
            d("Sampling Strategy", [
                "proposal",
                "danphe"
            ], "Die Stichprobe muss EF-Varianten und reale Schwierigkeiten abdecken.", [
                "Bilde Strata nach Operation Type",
                "Prüfe die Vielfalt von Projekten und Dateien",
                "Lege die Hard-Negative-Quote fest"
            ], [
                "12.1",
                "18.3"
            ], "Evaluation / Gold", "sampling-plan.csv"),
            d("RQ1-Annotation", [
                "proposal",
                "nagy"
            ], "Method, OperationType, DatabaseTarget und Provenance müssen manuell bestätigt werden.", [
                "Dokumentiere positive Labels",
                "Bereite FP/FN-Reason-Codes vor",
                "Öffne und prüfe die zeilengenaue Provenance"
            ], [
                "7.1",
                "14.1"
            ], "Evaluation / Gold", "gold-rq1-pilot.jsonl"),
            d("RQ2-Fragensatz", [
                "sweqa",
                "proposal"
            ], "Fragen müssen aus Rollen und Answerability Matrix stammen, nicht aus bereits gesehenen Modellantworten.", [
                "Erstelle Fragen für jeden Use Case",
                "Balanciere SUPPORTED, PARTIAL und NOT_ANSWERABLE",
                "Speichere erforderliche Evidenz separat"
            ], [
                "7.2",
                "13.3",
                "14.3"
            ], "Evaluation / Questions", "questions-v1.jsonl"),
            d("Zweitprüfung und Adjudikation", [
                "proposal"
            ], "15 bis 20 Prozent der Beispiele benötigen eine unabhängige Zweitprüfung.", [
                "Fixiere die Stichprobe der Zweitprüfung",
                "Dokumentiere Übereinstimmung und Abweichung",
                "Bewahre das Adjudikationsprotokoll ohne Löschung von Konflikten"
            ], [
                "12.3",
                "18.5"
            ], "Evaluation / Gold", "adjudication-log.csv"),
            d("Pilot/Test Freeze", [
                "proposal"
            ], "Anpassung am Testset verursacht Leakage.", [
                "Trenne Development, Pilot und Test",
                "Dokumentiere den Hash jedes Splits",
                "Formuliere das Änderungsverbot nach dem Freeze"
            ], [
                "29.1",
                "38.11"
            ], "Evaluation / Data", "dataset-manifest.json")
        ]
    },
    {
        phase: "Phase 6: RQ1-Evaluation",
        phaseId: "rq1-evaluation",
        title: "Precision, Recall und F1 der Extraktion",
        goal: "Genauigkeit und Vollständigkeit des Extractors werden je Operationstyp gemessen.",
        days: [
            d("Experimentkonfiguration RQ1", [
                "proposal"
            ], "Jeder Lauf benötigt eine eigene Konfiguration und Version.", [
                "Fixiere die Kategorien",
                "Definiere Micro- und Macro-Aggregation",
                "Dokumentiere Tool- und Corpus-Hash"
            ], [
                "13.1",
                "14.1",
                "38.11"
            ], "Evaluation", "rq1-config-v1.yaml"),
            d("READ-Extraktion ausführen", [
                "danphe",
                "proposal"
            ], "Rohe READ-Vorhersagen müssen vor der Analyse gespeichert werden.", [
                "Führe den Extractor auf dem Frozen Corpus aus",
                "Halte die Vorhersagen unveränderlich",
                "Dokumentiere Laufzeit und Warnungen"
            ], [
                "7.1",
                "13.1"
            ], "Evaluation", "runs/rq1-read/predictions.jsonl"),
            d("WRITE-Extraktion ausführen", [
                "danphe",
                "proposal"
            ], "WRITE und Persistence werden getrennt und anschließend kombiniert gemessen.", [
                "Führe Mutationen aus",
                "Führe Persistence-Links aus",
                "Dokumentiere die Anzahl ungelöster Mappings"
            ], [
                "7.1",
                "28.2"
            ], "Evaluation", "runs/rq1-write/predictions.jsonl"),
            d("Precision/Recall/F1 berechnen", [
                "proposal"
            ], "Ergebnisse müssen je Kategorie und aggregiert vorliegen.", [
                "Ermittle TP, FP und FN",
                "Berechne Precision, Recall und F1 je Kategorie",
                "Berichte Micro und Macro getrennt"
            ], [
                "3.5.8 bis 3.5.13",
                "14.1"
            ], "Evaluation / Metrics", "rq1-metrics.json"),
            d("RQ1-Fehleranalyse", [
                "shatnawi",
                "alshemaimri"
            ], "Eine Zahl ohne Fehlerursache liefert keine Anleitung zur Verbesserung.", [
                "Klassifiziere False Positives",
                "Klassifiziere False Negatives",
                "Trenne Mapping-, Resolution- und Scope-Fehler"
            ], [
                "15",
                "18"
            ], "Evaluation / Errors", "rq1-errors.csv"),
            d("RQ1 Freeze und Interpretation", [
                "hevner",
                "proposal"
            ], "Eine Regeländerung nach dem Test muss eine neue Experimentversion erzeugen.", [
                "Beantworte RQ1 mit den Ergebnissen",
                "Dokumentiere Corpus-Grenzen",
                "Vermeide überzogene Generalisierung"
            ], [
                "16",
                "17",
                "18"
            ], "Reports", "rq1-result-note.md")
        ]
    },
    {
        phase: "Phase 6: RQ2-Evaluation",
        phaseId: "rq2-evaluation",
        title: "Flat vs. Graph und Verifier-Ablation",
        goal: "Antwortqualität, Evidenz, Pfad und Refusal werden in zwei kontrollierten Experimenten gemessen.",
        days: [
            d("Vertrag für Experiment A", [
                "proposal",
                "draco"
            ], "Flat und Graph werden mit derselben Evidenz und denselben Regeln verglichen.", [
                "Definiere gemeinsame Fragen",
                "Gleiche das Retrieval-Budget an",
                "Halte den Repräsentationsunterschied als einzige Variable"
            ], [
                "13.2",
                "29.3"
            ], "Evaluation", "experiment-a.yaml"),
            d("Flat Retrieval ausführen", [
                "tfidf",
                "proposal"
            ], "Die rohe Baseline muss ohne Graph-Unterstützung laufen.", [
                "Führe alle Fragen aus",
                "Speichere Top-k-Kandidaten",
                "Dokumentiere Latenz und Coverage"
            ], [
                "7.2",
                "14.2"
            ], "Evaluation", "runs/rq2-flat/results.jsonl"),
            d("Graph Retrieval ausführen", [
                "draco",
                "cypher"
            ], "Der Graph muss Pfad und Evidenzelement zurückgeben.", [
                "Führe dieselben Fragen aus",
                "Speichere zurückgegebene Pfade",
                "Dokumentiere Latenz und fehlende Pfade"
            ], [
                "7.2",
                "14.2"
            ], "Evaluation", "runs/rq2-graph/results.jsonl"),
            d("Experiment B: Verifier-Ablation", [
                "kilt",
                "proposal"
            ], "Der Verifier-Effekt muss getrennt vom Graph-Effekt gemessen werden.", [
                "Führe Graph ohne Verifier aus",
                "Führe Graph mit Verifier aus",
                "Vergleiche unbelegte Antworten und Refusals"
            ], [
                "3.6",
                "14.3",
                "29.3"
            ], "Evaluation / Verifier", "experiment-b-results.json"),
            d("RQ2-Metriken", [
                "proposal",
                "kilt"
            ], "Die Primärmetriken sind Answer Correctness, Evidence Completeness, Path Validity und Correct Refusal.", [
                "Berechne alle vier Primärmetriken",
                "Halte sekundäre Metriken getrennt",
                "Bewahre die Granularität von Frage, Evidenz und Pfad"
            ], [
                "14.2",
                "14.3"
            ], "Evaluation / Metrics", "rq2-metrics.json"),
            d("RQ2-Fehleranalyse", [
                "sweqa",
                "proposal"
            ], "Jeder Fehler muss Retrieval, Pfad, Verifier oder Answering zugeordnet werden.", [
                "Kennzeichne die Fehlerstufe",
                "Trenne False Refusal und unbelegte Antwort",
                "Schreibe drei vollständige Fallstudien"
            ], [
                "15",
                "18"
            ], "Reports", "rq2-errors-and-cases.md")
        ]
    },
    {
        phase: "Phase 7: Answerability und Rollen",
        phaseId: "answerability-roles",
        title: "Verlässliche Ausgabe für Developer, Architect und QA",
        goal: "Jede Rolle erhält nur belegte Claims, Evidenzpfade und passende Einschränkungen.",
        days: [
            d("Answerability Matrix", [
                "proposal",
                "kilt"
            ], "Das System muss vor der Antwort entscheiden, ob die Evidenz ausreicht.", [
                "Operationalisiere SUPPORTED",
                "Operationalisiere PARTIALLY_SUPPORTED",
                "Fixiere NOT_ANSWERABLE-Gründe"
            ], [
                "3.6",
                "14.3"
            ], "Verifier", "answerability-matrix.yaml"),
            d("Developer Output", [
                "proposal",
                "sweqa"
            ], "Developer benötigen Method, File, Line und direkte Evidenz.", [
                "Definiere einen kurzen Claim",
                "Zeige direkte Source Locations",
                "Verberge ungelöstes Mapping nicht"
            ], [
                "1.6",
                "25.2",
                "26.1 bis 26.2"
            ], "Answering / Developer", "developer-output.schema.json"),
            d("Architect Output", [
                "logiclens",
                "proposal"
            ], "Architects benötigen Pfad, Boundary und Mapping.", [
                "Zeige den Call Path",
                "Markiere Projekt- und Repository-Grenzen",
                "Trenne direkte und abgeleitete Evidenz"
            ], [
                "1.6",
                "26.4",
                "26.6"
            ], "Answering / Architect", "architect-output.schema.json"),
            d("QA/Compliance Output", [
                "proposal",
                "nagy"
            ], "QA benötigt Inventar, Coverage und Evidence Gaps.", [
                "Definiere das READ/WRITE-Inventar",
                "Zeige Coverage und Unresolved Counts",
                "Verbinde jeden Claim mit einer SourceLocation"
            ], [
                "1.5",
                "1.6",
                "26.5"
            ], "Answering / QA", "qa-output.schema.json"),
            d("LLM Output Guardrail", [
                "gpt",
                "proposal"
            ], "Das LLM darf Text glätten, aber Claims und Evidenz nicht verändern.", [
                "Mache strukturierte Claims unveränderlich",
                "Füge eine Citation-Coverage-Prüfung hinzu",
                "Verwerfe unbelegte Sätze"
            ], [
                "38.9",
                "27.1"
            ], "Answering / Guardrails", "answer-validator.cs"),
            d("Rollen-Akzeptanztests", [
                "sweqa",
                "proposal"
            ], "Jede Persona muss mit festen Fragen und Erwartungen getestet werden.", [
                "Führe drei Fragen pro Rolle aus",
                "Validiere das Ausgabeschema",
                "Prüfe das Refusal-Verhalten manuell"
            ], [
                "17",
                "26"
            ], "Tests / Answering", "role-acceptance-report.md")
        ]
    },
    {
        phase: "Phase 8: Fehler und Validität",
        phaseId: "validity",
        title: "Fehlertaxonomie und Threats to Validity",
        goal: "Grenzen, Fehler und Generalisierbarkeit werden wissenschaftlich und vertretbar dokumentiert.",
        days: [
            d("Fehlertaxonomie der Extraktion", [
                "shatnawi",
                "proposal"
            ], "Syntax-, Symbol-, Mapping- und Persistence-Fehler müssen trennbar sein.", [
                "Erstelle eine Taxonomie auf Komponentenebene",
                "Dokumentiere Schweregrad und Behebbarkeit",
                "Wähle für jede Kategorie ein reales Beispiel"
            ], [
                "15",
                "18.1 bis 18.2"
            ], "Reports / Errors", "extraction-error-taxonomy.csv"),
            d("Fehlertaxonomie des Retrievals", [
                "draco",
                "sweqa"
            ], "Candidate Miss, Path Miss und Ranking Error haben unterschiedliche Ursachen.", [
                "Trenne die Fehlerstufen",
                "Vergleiche flat-only und graph-only",
                "Kennzeichne mehrdeutige Fragen"
            ], [
                "15",
                "18.1"
            ], "Reports / Errors", "retrieval-error-taxonomy.csv"),
            d("Konstrukt- und interne Validität", [
                "proposal",
                "hevner"
            ], "Die Metriken müssen tatsächlich das behauptete Konzept messen.", [
                "Erstelle eine Construct-to-metric Map",
                "Dokumentiere Leakage- und Tuning-Risiken",
                "Prüfe Confounder der Experimente A und B"
            ], [
                "18.1",
                "18.2"
            ], "Reports / Validity", "validity-internal.md"),
            d("Externe und Schlussfolgerungsvalidität", [
                "proposal",
                "danphe"
            ], "Ein Corpus reicht nicht für allgemeine Aussagen über alle C#-Projekte.", [
                "Dokumentiere Danphe-spezifischen Bias",
                "Begrenze die Generalisierung auf EF Core",
                "Berichte statistische Unsicherheit"
            ], [
                "18.3",
                "18.4"
            ], "Reports / Validity", "validity-external.md"),
            d("Researcher Bias und Ethik", [
                "proposal"
            ], "Annotation und Gesundheitsdomäne erfordern Bias-Kontrolle und Lizenzkonformität.", [
                "Liste manuelle Entscheidungen auf",
                "Verlinke Evidenz der Zweitprüfung",
                "Stelle klar, dass keine Patientendaten verwendet werden"
            ], [
                "18.5",
                "19"
            ], "Reports / Ethics", "ethics-and-bias.md"),
            d("Validity Review Gate", [
                "proposal"
            ], "Jeder Ergebnis-Claim benötigt eine entsprechende Einschränkung.", [
                "Verbinde jeden Ergebnis-Claim mit einem Threat",
                "Entferne überzogene Formulierungen",
                "Bereite schwierige Fragen der Betreuung vor"
            ], [
                "18",
                "22",
                "32"
            ], "Reports", "validity-review-checklist.md")
        ]
    },
    {
        phase: "Phase 9: Schreiben und Abgabe",
        phaseId: "writing-delivery",
        title: "Thesis Draft, Reproduktion und Demo",
        goal: "Artefakt und Ergebnisse werden zu einem reproduzierbaren, mündlich erklärbaren Paket.",
        days: [
            d("Entwurf des Methodenkapitels", [
                "proposal",
                "hevner"
            ], "Die Methode muss Corpus, Extractor, Goldstandard und Experiment reproduzierbar erklären.", [
                "Beschreibe Ein- und Ausgabe jeder Stufe",
                "Dokumentiere Stop-Regeln und Unsicherheit",
                "Versioniere die Konfigurationen"
            ], [
                "11 bis 13",
                "21"
            ], "Thesis / Method", "method-draft.md", "writing"),
            d("Entwurf des Ergebniskapitels", [
                "proposal"
            ], "Ergebnisse werden ohne zusätzliche Interpretation und in festen Tabellen berichtet.", [
                "Tabelliere die RQ1-Metriken",
                "Tabelliere RQ2 Experiment A und B",
                "Ergänze Fallstudien mit Evidenzpfad"
            ], [
                "14",
                "21"
            ], "Thesis / Results", "results-draft.md", "writing"),
            d("Entwurf der Diskussion", [
                "proposal",
                "logiclens",
                "nagy",
                "hevner",
                "sweqa"
            ], "Die Diskussion führt zu Forschungsfragen, Related Work und Validität zurück; Related Work braucht vor dem Schreiben eine sortierte Quellenliste statt loser Zitate.", [
                "Sortiere jede gelesene Quelle in genau einen Eimer: „zitiert als Grundlage“ (thesisRole cite — direkt ausgebaute Vorarbeit, meist nur ein bis zwei Quellen), „Hintergrundlektüre“ (thesisRole background — einmal gelesen, selten zitiert) oder „Related-Work-Erwähnung“ (thesisRole related-work — „bisherige Arbeiten haben X getan“, ohne Ausbau-Anspruch)",
                "Beschreibe für jede cite-Quelle in einem Satz, was diese Arbeit konkret ausbaut oder verbessert; beantworte jede Forschungsfrage direkt",
                "Begrenze Scope und Generalisierung anhand der related-work- und background-Quellen"
            ], [
                "4 bis 7",
                "15 bis 18"
            ], "Thesis / Discussion", "discussion-draft.md + source-bucket-map.md", "writing"),
            d("Replikationspaket", [
                "proposal",
                "codefuse"
            ], "Andere Forschende müssen den Lauf reproduzieren können.", [
                "Führe Build- und Run-Anweisungen aus",
                "Prüfe Konfiguration, Hash und Output-Manifest",
                "Reduziere fehlende Abhängigkeiten auf null"
            ], [
                "11.3",
                "17",
                "38.11"
            ], "Release", "replication-package-v1.zip", "writing"),
            d("Demo und Präsentation", [
                "proposal"
            ], "Der Wert des Artefakts muss an einem kurzen realen Pfad sichtbar werden.", [
                "Zeige Problem→Evidenz→Antwort",
                "Zeige eine korrekte Ablehnung",
                "Nenne Grenzen auf der Schlussfolie"
            ], [
                "24",
                "32"
            ], "Presentation", "demo-script-fa-de-en.md", "writing"),
            d("Finaler Reproduktionslauf", [
                "proposal",
                "danphe"
            ], "Die Abgabe ist erst nach einem sauberen, erfolgreichen Lauf valide.", [
                "Führe den Lauf aus einem sauberen Checkout aus",
                "Dokumentiere alle Output-Hashes",
                "Bereite Release Tag und Changelog vor"
            ], [
                "17",
                "20.2",
                "38.11"
            ], "Release", "release-candidate-1", "writing")
        ]
    },
    {
        phase: "Puffer 1",
        phaseId: "buffer-one",
        title: "Blocker beheben, ohne den Scope zu erweitern",
        goal: "Nur blockierende Fehler, fehlgeschlagene Tests und dokumentierte Lücken werden behoben.",
        days: [
            d("Blocker-Triage", [
                "proposal"
            ], "Der Puffer ist nicht für neue Funktionen da, sondern beseitigt Abgabehindernisse.", [
                "Bewerte Blocker nach Schweregrad",
                "Trenne must-fix und can-document",
                "Verbinde jeden Punkt mit RQ oder Erfolgskriterium"
            ], [
                "20.2",
                "37"
            ], "Project Management", "blocker-board.md", "buffer"),
            d("Extraktionsfehler beheben", [
                "proposal",
                "roslynSemantic"
            ], "Der größte RQ1-Fehler wird mit der kleinsten kontrollierten Änderung behoben.", [
                "Wähle eine Root Cause",
                "Erstelle vor dem Fix einen Regressionstest",
                "Erhöhe RuleVersion"
            ], [
                "14.1",
                "15"
            ], "Extractors", "extractor-hotfix + test", "buffer"),
            d("Retrieval/Verifier beheben", [
                "proposal",
                "draco"
            ], "Nur der im Pilot gezeigte Fehler wird behoben und neu gemessen.", [
                "Bestätige die Fehlerstufe",
                "Füge einen festen Test hinzu",
                "Wiederhole den A/B-Vergleich"
            ], [
                "14.2 bis 14.3",
                "15"
            ], "Retrieval / Verifier", "retrieval-hotfix + metrics", "buffer"),
            d("Dokumentationslücke", [
                "proposal"
            ], "Jedes wichtige Verhalten muss in Methode oder Capability Matrix auffindbar sein.", [
                "Finde undokumentierte Regeln",
                "Ergänze Ein- und Ausgabe sowie Grenzen",
                "Prüfe Links zwischen Code und Text"
            ], [
                "11",
                "38"
            ], "Docs", "documentation-gap-log.md", "buffer"),
            d("Fragen der Betreuung", [
                "proposal"
            ], "Schwierige Fragen sollten vor dem Gespräch sichtbar werden.", [
                "Formuliere fünf methodische Fragen",
                "Formuliere fünf Scope-Fragen",
                "Nimm eine zweiminütige Antwort für jede Frage auf"
            ], [
                "22",
                "32"
            ], "Presentation", "supervisor-qa.md", "buffer"),
            d("Puffer-Gate", [
                "proposal"
            ], "Der Puffer wird erst geschlossen, wenn der Release Candidate wieder grün ist.", [
                "Schließe alle must-fix-Punkte",
                "Führe vollständigen Test und Reproduktion aus",
                "Dokumentiere übrige Punkte als Einschränkung"
            ], [
                "17",
                "20.2"
            ], "Release", "release-candidate-2", "buffer")
        ]
    },
    {
        phase: "Puffer 2 und Abschluss",
        phaseId: "buffer-two",
        title: "Finale Abgabe ohne offene Schulden",
        goal: "Dateien, Präsentation und Fortschrittsbericht werden finalisiert; neuer Scope ist verboten.",
        days: [
            d("Finales Datenaudit", [
                "proposal"
            ], "Rohdaten, Metriken und Tabellen müssen konsistent sein.", [
                "Gleiche die Hashes ab",
                "Vergleiche Zahlen in Text und JSON",
                "Verbinde jedes Diagramm mit seiner Quelldatei"
            ], [
                "14",
                "38.11"
            ], "Evaluation / Audit", "final-data-audit.md", "buffer"),
            d("Finales Quellenaudit", [
                "proposal",
                "danphe"
            ], "Versionen von Code, Corpus und Abhängigkeiten müssen exakt dokumentiert sein.", [
                "Dokumentiere alle Commits",
                "Prüfe die Lizenzen erneut",
                "Führe einen Clean Build aus"
            ], [
                "9.3",
                "11.3",
                "19"
            ], "Release / Audit", "source-audit.md", "buffer"),
            d("Finaler Thesis-Quervergleich", [
                "proposal"
            ], "Jede Forschungsfrage braucht passende Methode, Ergebnis und Diskussion.", [
                "Prüfe die Traceability von RQ1",
                "Prüfe die Traceability von RQ2",
                "Lasse keinen Claim ohne Ergebnis"
            ], [
                "7",
                "16",
                "21"
            ], "Thesis", "thesis-traceability-matrix.csv", "buffer"),
            d("Finale Präsentationsprobe", [
                "proposal"
            ], "Die Präsentation muss unabhängig vom Text und in kontrollierter Zeit funktionieren.", [
                "Halte die Präsentation mit Zeitmessung",
                "Übe den Fallback bei Demo-Ausfall",
                "Beantworte drei schwierige Fragen frei"
            ], [
                "24",
                "32"
            ], "Presentation", "rehearsal-record.md", "buffer"),
            d("Archiv und Übergabe", [
                "proposal"
            ], "Die Abgabeversion muss von Arbeitsdateien getrennt sein.", [
                "Liste die Release-Artefakte",
                "Teste das Schnellstart-README",
                "Erzeuge Backup und Prüfsumme"
            ], [
                "17",
                "20.2"
            ], "Release", "final-handoff.zip", "buffer"),
            d("Programmabschluss und Fortschrittsrückblick", [
                "proposal",
                "hevner"
            ], "Der letzte Tag fasst die Evidenz der geleisteten Arbeit zusammen und fügt nichts Neues hinzu.", [
                "Hake die Ergebnisse jeder Phase ab",
                "Notiere wichtigste Erkenntnis und Einschränkung",
                "Formuliere die erste Handlung nach der Abgabe in einem Satz"
            ], [
                "16",
                "17",
                "20"
            ], "Reports", "final-progress-report.md", "buffer")
        ]
    }
];
const designWeekSpecs = [
    {
        phase: "Design 1: Problem und Anforderungen",
        phaseId: "design-requirements",
        title: "Problem, Stakeholder und vertretbarer Scope",
        goal: "Der Plan beginnt am 15. Oktober, nach den medizinisch geschützten Pausen. Problem, Nutzende, Anforderungen und Projektgrenzen werden präzise und testbar.",
        dates: [
            "2026-08-30",
            "2026-08-31",
            "2026-09-01",
            "2026-09-02",
            "2026-09-03",
            "2026-09-04"
        ],
        days: [
            d("Problemstellung und Projektwert", [
                "proposal",
                "hevner"
            ], "Ohne präzises Problem zerfallen Architektur und Implementierung in unverbundene Funktionen.", [
                "Formuliere das Kernproblem der Cross-Repository-Analyse in einem Satz",
                "Kläre den Unterschied zwischen Evidenz und Textähnlichkeit",
                "Beschreibe den Artefaktwert für drei Rollen getrennt"
            ], [
                "1",
                "6",
                "7"
            ], "Design / Problem Framing", "problem-statement-v1.md"),
            d("Stakeholder und Personas", [
                "proposal",
                "sweqa"
            ], "Developer, Architect und QA benötigen unterschiedliche Fragen und Evidenzstufen.", [
                "Extrahiere das Ziel jeder Persona",
                "Bestimme die Entscheidung, die jede Rolle mit der Antwort trifft",
                "Dokumentiere Informationen, die einer Rolle nicht gezeigt werden dürfen"
            ], [
                "1.6",
                "25",
                "26"
            ], "Design / Stakeholders", "stakeholders-and-personas.md"),
            d("Funktionale Anforderungen", [
                "proposal",
                "logiclens"
            ], "Jede Fähigkeit braucht Eingabe, Ausgabe und Akzeptanzkriterium.", [
                "Trenne Extract, Map, Persist, Retrieve und Answer",
                "Definiere Ein- und Ausgabe jeder Fähigkeit",
                "Verbinde jede Anforderung mit einer Forschungsfrage"
            ], [
                "3",
                "7",
                "10"
            ], "Design / Requirements", "functional-requirements.yaml"),
            d("Nichtfunktionale Anforderungen", [
                "proposal",
                "arc42"
            ], "Reproduzierbarkeit, Erklärbarkeit und Sicherheit steuern Architekturentscheidungen.", [
                "Priorisiere die wichtigsten Qualitätsziele",
                "Definiere Kriterien für Determinismus und Traceability",
                "Dokumentiere Zeit-, Daten- und Technologiegrenzen"
            ], [
                "9",
                "11.3",
                "17",
                "38"
            ], "Design / Quality Attributes", "quality-attribute-scenarios.md"),
            d("Grenze von Core, Extension und Future", [
                "proposal",
                "alshemaimri"
            ], "Ein fester Scope verhindert, dass das Projekt vor der Evaluation endlos wird.", [
                "Fixiere Roslyn, EF Core und Tabellenebene im Core",
                "Trenne Fähigkeiten, die von Beobachtungen im Corpus abhängen",
                "Verschiebe ADO.NET, SQL, Stored Procedures und neuronale Ansätze nach Future"
            ], [
                "8",
                "31",
                "37"
            ], "Design / Scope", "scope-boundary-v1.md"),
            d("Anforderungs-Review-Gate", [
                "proposal",
                "hevner"
            ], "Die Woche endet erst, wenn jede Anforderung nachvollziehbar und testbar ist.", [
                "Finde mehrdeutige Anforderungen",
                "Verbinde jede Anforderung mit RQ und Persona",
                "Reduziere Anforderungen ohne Akzeptanzkriterium auf null"
            ], [
                "7",
                "16",
                "20"
            ], "Design / Review", "requirements-review-checklist.md")
        ]
    },
    {
        phase: "Design 2: Systemarchitektur",
        phaseId: "design-architecture",
        title: "C4, Datenfluss und Modulgrenzen",
        goal: "Systemstruktur von Context bis Component sowie Modulverträge werden vor der Implementierung fixiert.",
        dates: [
            "2026-09-17",
            "2026-09-18",
            "2026-09-19",
            "2026-09-21",
            "2026-09-22",
            "2026-09-23"
        ],
        days: [
            d("System Context Diagram", [
                "c4",
                "proposal"
            ], "Das Diagramm zeigt die Beziehungen zu Nutzenden, GitHub/lokalen Repositories, Neo4j und LLM.", [
                "Bestimme externe Personen und Softwaresysteme",
                "Definiere Vertrauen und Eigentum jeder Boundary",
                "Entferne Technologiedetails aus dem Context"
            ], [
                "1.6",
                "3",
                "9"
            ], "Architecture / C4", "c4-context.dsl"),
            d("Container Diagram", [
                "c4",
                "arc42"
            ], "Container trennen Ausführung, Speicherung und Benutzeroberfläche.", [
                "Grenze CLI/API, Extractor, Graph Store und UI ab",
                "Beschreibe Protokoll und übertragene Daten jeder Beziehung",
                "Definiere jeden Container als stateful oder stateless"
            ], [
                "3",
                "10",
                "38.2"
            ], "Architecture / C4", "c4-containers.dsl"),
            d("Component Diagram und M1–M3", [
                "c4",
                "proposal"
            ], "Extraktion, Evidenzmodellierung und Retrieval benötigen überschneidungsfreie Verantwortungen.", [
                "Formuliere die Verantwortung von M1, M2 und M3 in je einem Satz",
                "Richte erlaubte Modulabhängigkeiten aus",
                "Entferne jeden Abhängigkeitszyklus"
            ], [
                "3.1 bis 3.6",
                "10"
            ], "Architecture / Components", "c4-components.dsl"),
            d("End-to-End- und Sequenzfluss", [
                "proposal",
                "nagy"
            ], "Ein reales Szenario muss von Source Code bis zur Antwort mit Evidenz verfolgbar sein.", [
                "Zeichne Repository→Facts→Evidence→Graph→Answer",
                "Markiere Erzeugungspunkte der SourceLocation",
                "Dokumentiere Failure- und Refusal-Punkte"
            ], [
                "3",
                "10.2",
                "27"
            ], "Architecture / Dynamic View", "e2e-sequence.mmd"),
            d("Verträge zwischen Modulen", [
                "proposal",
                "shatnawi"
            ], "Stabile Verträge ermöglichen unabhängige Tests von Extractor, Storage und Retrieval.", [
                "Definiere Ein- und Ausgabe-DTOs jedes Moduls",
                "Lege Versionierung und Rückwärtskompatibilität fest",
                "Modelliere erwartete Fehler und Unresolved explizit"
            ], [
                "3.2",
                "3.5",
                "38.2"
            ], "Architecture / Contracts", "module-contracts-v1.md"),
            d("ADRs für Architekturentscheidungen", [
                "adr",
                "proposal"
            ], "Begründung, verworfene Alternativen und Folgen müssen erhalten bleiben.", [
                "Erstelle ADRs für Roslyn, Neo4j und JSONL",
                "Beschreibe Alternativen und Trade-offs",
                "Dokumentiere Status und Confidence jeder Entscheidung"
            ], [
                "8",
                "10",
                "37"
            ], "Architecture / Decisions", "adr/0001-0003.md")
        ]
    },
    {
        phase: "Design 3: Domänen- und Evidenzmodell",
        phaseId: "design-evidence-model",
        title: "Gemeinsame Sprache, Program Graph und Provenance",
        goal: "Entitäten, Beziehungen, Evidenz und Unsicherheitsstatus werden schriftlich und in JSON-Beispielen fixiert.",
        dates: [
            "2026-09-25",
            "2026-09-26",
            "2026-09-28",
            "2026-10-06",
            "2026-10-07",
            "2026-10-08"
        ],
        days: [
            d("Domänenglossar", [
                "proposal",
                "allamanis"
            ], "Gemeinsame Begriffe verhindern Bedeutungsunterschiede zwischen Text, Code und Graph.", [
                "Definiere Fact, Evidence, Claim und Path getrennt",
                "Präzisiere Repository, Project, File, Type und Method",
                "Operationalisiere READ, WRITE und Persistence"
            ], [
                "2",
                "3.2",
                "3.3"
            ], "Domain Model", "domain-glossary.md"),
            d("Node Types des Program Graph", [
                "allamanis",
                "yamaguchi"
            ], "Nodes sollen Projektfragen dienen und nicht den gesamten AST kopieren.", [
                "Liste Nodes von Repository bis Table",
                "Bestimme notwendige Identität und Properties jedes Nodes",
                "Entferne Nodes ohne Nutzen für die Forschungsfragen"
            ], [
                "3.3",
                "10.3"
            ], "Graph Model", "node-catalog-v1.yaml"),
            d("Relationship Types", [
                "yamaguchi",
                "nagy"
            ], "Jede Kante benötigt klare Richtung, Bedeutung, Quelle und Erzeugungsregel.", [
                "Definiere DEFINES, INVOKES und MAPS_TO",
                "Definiere MUTATES, PERSISTS, READS_FROM und WRITES_TO",
                "Kennzeichne jede Beziehung als DIRECT oder DERIVED"
            ], [
                "3.3",
                "10.3",
                "38.5"
            ], "Graph Model", "relationship-catalog-v1.yaml"),
            d("EvidenceRecord und SourceLocation", [
                "proposal",
                "shatnawi"
            ], "Ohne Datei, Zeile und Regel ist kein Claim prüfbar.", [
                "Bestimme die Felder des EvidenceRecord",
                "Mache Repository, Commit, File und Line verpflichtend",
                "Ergänze RuleId, RuleVersion und ExtractorVersion"
            ], [
                "3.2",
                "38.4 bis 38.6"
            ], "Evidence Model", "evidence-record.schema.json"),
            d("Unsicherheit und Answer Status", [
                "proposal",
                "kilt"
            ], "Das System muss Nichtwissen modellieren und erfundene Antworten verhindern.", [
                "Definiere OBSERVED, DERIVED, UNRESOLVED und CONFLICTING",
                "Definiere SUPPORTED, PARTIALLY_SUPPORTED und NOT_ANSWERABLE",
                "Formuliere die Regel von Evidenz zu Answer Status"
            ], [
                "3.6",
                "14.3",
                "27"
            ], "Verifier / Status Model", "evidence-and-answer-status.yaml"),
            d("Ausführbarer Vertical Slice", [
                "proposal",
                "danphe",
                "roslynSyntax"
            ], "Ein früher ausführbarer Pfad zeigt Modell- und Integrationsfehler, bevor sechs reine Designwochen vergehen.", [
                "Extrahiere einen realen Controller→Service→Repository-Pfad mit Roslyn",
                "Schreibe EvidenceRecord und SourceLocation deterministisch als JSONL",
                "Führe einen Golden Test aus und markiere Lücken in Schema und Contract"
            ], [
                "10.2",
                "12",
                "17",
                "26"
            ], "Walking Skeleton / Evidence", "vertical-slice-v0.jsonl + golden test")
        ]
    },
    {
        phase: "Design 4: Test und Evaluation",
        phaseId: "design-evaluation",
        title: "Goldstandard, RQ1/RQ2 und Teststrategie",
        goal: "Vor dem Bau des Artefakts wird die Messung von Erfolg und Scheitern vollständig definiert.",
        dates: [
            "2026-10-09",
            "2026-10-10",
            "2026-10-12",
            "2026-10-13",
            "2026-10-14",
            "2026-10-15"
        ],
        days: [
            d("Akzeptanzkriterien des Gesamtsystems", [
                "proposal",
                "hevner"
            ], "Die Definition of Done muss von Evidenz und Forschungsfragen abhängen, nicht vom guten Eindruck einer Demo.", [
                "Extrahiere die Erfolgskriterien des Artefakts",
                "Trenne verpflichtende und sekundäre Metriken",
                "Markiere Schwellenwerte, die Betreuungsgenehmigung benötigen"
            ], [
                "16",
                "17",
                "20"
            ], "Evaluation / Acceptance", "system-acceptance-criteria.md"),
            d("Annotationsprotokoll entwerfen", [
                "proposal",
                "sweqa"
            ], "Der Goldstandard ist nur mit stabiler Annotationseinheit und Anleitung valide.", [
                "Definiere die Einheiten Method, Table und Relation",
                "Definiere Positive, Negative und Hard Negative",
                "Beschreibe Disagreement- und Zweitprüfungsprozess"
            ], [
                "12",
                "13.3",
                "29.4"
            ], "Evaluation / Gold", "annotation-guideline-v1.md"),
            d("Experiment A für RQ1 entwerfen", [
                "proposal",
                "shatnawi"
            ], "Precision, Recall und F1 müssen auf zählbaren Fakten berechnet werden.", [
                "Bestimme die Extraktionseinheiten",
                "Formuliere TP/FP/FN-Regeln für jede Relation",
                "Trenne Macro- und Micro-Reporting"
            ], [
                "7.1",
                "13",
                "14.1"
            ], "Evaluation / RQ1", "rq1-experiment-design.md"),
            d("Experiment B für RQ2 entwerfen", [
                "proposal",
                "draco",
                "kilt"
            ], "Flat und Graph müssen mit denselben Fragen, demselben Corpus und k verglichen werden.", [
                "Definiere unabhängige Variable und Konstanten",
                "Operationalisiere Answer Correctness und Evidence Completeness",
                "Definiere Path Validity und Correct Refusal"
            ], [
                "7.2",
                "14.2 bis 14.3",
                "29.3"
            ], "Evaluation / RQ2", "rq2-experiment-design.md"),
            d("Testpyramide und Fixture-Strategie", [
                "proposal",
                "roslynSyntax"
            ], "Die meisten Fehler sollen vor dem vollständigen Lauf durch kleine deterministische Tests auffallen.", [
                "Trenne Unit-, Golden-, Integrations- und E2E-Tests",
                "Entwirf Fixtures für Roslyn und EF",
                "Dokumentiere deterministische Reihenfolge und Snapshot-Richtlinie"
            ], [
                "17",
                "38.10"
            ], "Quality / Test Design", "test-strategy.md"),
            d("Threats to Validity vor der Ausführung", [
                "proposal",
                "hevner"
            ], "Risiken werden vor Sichtung der Ergebnisse festgehalten, um gerichtete Interpretation zu vermeiden.", [
                "Dokumentiere Construct- und Internal-Threats",
                "Dokumentiere External- und Conclusion-Threats",
                "Erfasse Mitigation und Restrisiko jedes Punkts"
            ], [
                "18"
            ], "Evaluation / Validity", "pre-registered-validity-risks.md")
        ]
    },
    {
        phase: "Design 5: Umsetzungsplan",
        phaseId: "design-delivery-plan",
        title: "Corpus, Repository-Struktur und technisches Backlog",
        goal: "Das Design wird in einen versionierten, planbaren und eindeutigen Umsetzungsplan überführt.",
        startDate: "2026-10-16",
        days: [
            d("Corpus Manifest und Freeze Plan", [
                "danphe",
                "proposal"
            ], "Eine feste Eingabe ist Voraussetzung für reproduzierbare Ergebnisse.", [
                "Dokumentiere den festen Danphe-Commit",
                "Bestimme Solutions und Projects im Scope",
                "Dokumentiere Lizenz, Build und Ausschlüsse"
            ], [
                "9.2 bis 9.3",
                "11.3"
            ], "Delivery / Corpus", "corpus-manifest-v1.yaml"),
            d("Repository- und Ordnerstruktur", [
                "arc42",
                "proposal"
            ], "Die Dateistruktur muss Architekturgrenzen und Testzyklus widerspiegeln.", [
                "Entwirf src, tests, corpus, gold und reports",
                "Ordne jedem Ordner ein verantwortliches Modul zu",
                "Trenne generierte Ausgabe vom Quellcode"
            ], [
                "10",
                "11",
                "17"
            ], "Delivery / Repository", "repository-layout.md"),
            d("Build, Versionierung und Reproduktion", [
                "adr",
                "proposal"
            ], "Jeder Lauf muss vom ersten Tag an mit Konfiguration und Version reproduzierbar sein.", [
                "Dokumentiere Versionen von Toolchain und Abhängigkeiten",
                "Entwirf RunId, ConfigHash und CorpusCommit",
                "Definiere Befehle für Clean Build, Test und Run"
            ], [
                "11.3",
                "17",
                "38.11"
            ], "Delivery / Reproduction", "reproduction-plan.md"),
            d("Abhängigkeitsgraph und Implementierungsreihenfolge", [
                "c4",
                "proposal"
            ], "Arbeit wird nach technischen Abhängigkeiten statt nach Technologieattraktivität geordnet.", [
                "Überführe M1, M2, M3 und Evaluation in Meilensteine",
                "Zeichne Abhängigkeiten und kritischen Pfad",
                "Kennzeichne parallele und blockierte Arbeit"
            ], [
                "10",
                "20"
            ], "Delivery / Roadmap", "implementation-dependency-map.mmd"),
            d("Backlog mit Definition of Done", [
                "proposal",
                "sweqa"
            ], "Jede Story benötigt Ergebnis, Test und Beziehung zu einer Forschungsfrage.", [
                "Zerlege Epics in Stories von höchstens zwei Tagen",
                "Ergänze Akzeptanzkriterien und Evidenzartefakt",
                "Wende die Scope-Labels Core, Extension und Future an"
            ], [
                "8",
                "16",
                "20"
            ], "Delivery / Backlog", "technical-backlog-v1.csv"),
            d("Design Review Version 1", [
                "arc42",
                "proposal"
            ], "Ein Gesamtüberblick deckt Widersprüche zwischen Anforderung, Architektur, Modell und Evaluation auf.", [
                "Führe das End-to-End-Szenario erneut durch",
                "Liste Traceability Gaps",
                "Gib offenen Entscheidungen eine verantwortliche Person und Frist"
            ], [
                "16",
                "20",
                "38"
            ], "Design / Review", "design-review-v1.md")
        ]
    },
    {
        phase: "Design 6: Finalisierung",
        phaseId: "design-freeze",
        title: "Traceability, Baseline und technische Bereitschaft",
        goal: "Das Design wird versioniert; danach sind nur kontrollierte Änderungen erlaubt.",
        startDate: "2026-10-23",
        days: [
            d("Vollständige Traceability Matrix", [
                "proposal",
                "hevner"
            ], "Keine Anforderung, kein Modul, kein Test und keine Forschungsfrage darf unverbunden bleiben.", [
                "Verbinde Requirement→Component",
                "Verbinde Component→Test/Metric",
                "Verbinde Metric→RQ/Thesis Section"
            ], [
                "7",
                "16",
                "21"
            ], "Design / Traceability", "traceability-matrix.csv"),
            d("Design Freeze und Readiness Gate", [
                "proposal",
                "adr",
                "arc42"
            ], "Der Designabschluss muss alle Eingaben für den unabhängigen technischen Start am 30. November bereitstellen.", [
                "Schließe alle Design-Checklisten",
                "Versioniere ADRs und erlaubte offene Punkte",
                "Bereite den ersten technischen Plantag und seine Eingaben vor"
            ], [
                "16",
                "20",
                "37"
            ], "Design / Baseline", "design-baseline-2026-11-24.zip")
        ]
    }
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
    "buffer-two"
];
const orderedTechnicalWeeks = technicalOrder.map((phaseId, technicalIndex)=>{
    const week = technicalWeekSpecs.find((item)=>item.phaseId === phaseId);
    if (!week) throw new Error(`Missing technical week: ${phaseId}`);
    return {
        ...week,
        technicalIndex
    };
});
const scheduledWeekSpecs = [
    ...designWeekSpecs,
    ...orderedTechnicalWeeks
];
function isoDate(date) {
    return date.toISOString().slice(0, 10);
}
function addUtcDays(date, days) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}
const PROJECT_DAYS_PER_CAPACITY_WEEK = 4;
const DAYS_PER_CAPACITY_WEEK = 5;
const ARTICLE_HOURS_PER_REQUIRED_READING = 16;
const WEEKLY_CAPACITY_HOURS = 40;
const originalProjectDays = scheduledWeekSpecs.flatMap((week, originalWeekIndex)=>week.days.map((spec, originalDayIndex)=>({
            spec,
            stableId: `w${originalWeekIndex + 1}-d${originalDayIndex + 1}`,
            phase: week.phase,
            phaseId: week.phaseId,
            weekTitle: week.title,
            weekGoal: week.goal
        })));
const closingCapacityDays = [
    {
        spec: d("Offene Qualitätskriterien schließen", [
            "proposal",
            "hevner"
        ], "Der Vollzeitplan endet nicht mit halbfertigen Prüfungen, sondern mit nachvollziehbar geschlossenen Qualitätskriterien.", [
            "Finde jedes noch offene Akzeptanzkriterium",
            "Schließe nur belegbare Lücken",
            "Dokumentiere bewusst verbleibende Grenzen"
        ], [
            "16",
            "17",
            "20"
        ], "Final Quality Closure", "final-quality-closure.md", "buffer"),
        stableId: "capacity-final-quality",
        phase: "Abgabe",
        phaseId: "buffer-two",
        weekTitle: "Finale Abgabe ohne offene Schulden",
        weekGoal: "Alle belegbaren Qualitätskriterien schließen und Grenzen transparent lassen."
    },
    {
        spec: d("Reproduzierbarkeit aus sauberer Umgebung prüfen", [
            "proposal",
            "danphe"
        ], "Ein letzter Clean-Run beweist, dass Artefakt, Test und Dokumentation außerhalb der Arbeitsumgebung zusammenpassen.", [
            "Starte aus einer sauberen Umgebung",
            "Führe Schnellstart und Kerntests aus",
            "Vergleiche Ergebnis, Version und dokumentierte Befehle"
        ], [
            "11.3",
            "17",
            "20.2"
        ], "Release / Reproducibility", "final-clean-run-evidence.md", "buffer"),
        stableId: "capacity-final-reproducibility",
        phase: "Abgabe",
        phaseId: "buffer-two",
        weekTitle: "Finale Abgabe ohne offene Schulden",
        weekGoal: "Die Abgabe in einer sauberen Umgebung reproduzierbar nachweisen."
    }
];
const capacityProjectDays = [
    ...originalProjectDays
];
for (const closingDay of closingCapacityDays){
    if (capacityProjectDays.length % PROJECT_DAYS_PER_CAPACITY_WEEK === 0) break;
    capacityProjectDays.push(closingDay);
}
if (capacityProjectDays.length % PROJECT_DAYS_PER_CAPACITY_WEEK !== 0) {
    throw new Error("The project-day inventory must fill complete four-day capacity weeks");
}
function uniqueStrings(values) {
    return Array.from(new Set(values));
}
function integrationSpec(projectDays, weekNumber) {
    return d("Wochenintegration, Erklärung und Testbeleg", uniqueStrings(projectDays.flatMap((day)=>day.spec.sourceIds)).slice(0, 4), "Vier kleine Projektschritte werden erst durch einen gemeinsamen Test, eine freie Erklärung und einen rückverfolgbaren Beleg zu belastbarem Wochenfortschritt.", [
        "Erkläre den Zusammenhang der vier Tagesergebnisse ohne Quelle",
        "Führe den wichtigsten gemeinsamen Test oder Sanity Check erneut aus",
        "Verknüpfe Ergebnis, Test und Quellenbeleg in einem Wochenprotokoll"
    ], uniqueStrings(projectDays.flatMap((day)=>day.spec.proposal)).slice(0, 4), "Weekly Integration / Evidence", `week-${String(weekNumber).padStart(2, "0")}-integration-evidence.md`, "evaluation");
}
const capacityWeekSpecs = Array.from({
    length: capacityProjectDays.length / PROJECT_DAYS_PER_CAPACITY_WEEK
}, (_, weekIndex)=>{
    const projectDays = capacityProjectDays.slice(weekIndex * PROJECT_DAYS_PER_CAPACITY_WEEK, (weekIndex + 1) * PROJECT_DAYS_PER_CAPACITY_WEEK);
    const first = projectDays[0];
    const last = projectDays.at(-1);
    const integration = {
        spec: integrationSpec(projectDays, weekIndex + 1),
        stableId: `capacity-w${weekIndex + 1}-integration`,
        phase: first.phase === last.phase ? first.phase : `${first.phase} / ${last.phase}`,
        phaseId: first.phaseId,
        weekTitle: first.weekTitle === last.weekTitle ? first.weekTitle : `${first.weekTitle} → ${last.weekTitle}`,
        weekGoal: first.weekGoal === last.weekGoal ? first.weekGoal : `${first.weekGoal} ${last.weekGoal}`
    };
    return {
        phase: integration.phase,
        phaseId: integration.phaseId,
        title: integration.weekTitle,
        goal: integration.weekGoal,
        projectDays: [
            ...projectDays,
            integration
        ]
    };
});
function isFullRestDate(date) {
    return trackerRestartPlan.screenBreaks.some((window)=>date >= window.procedureDate && date <= window.fullRestEnd);
}
function capacityDates(totalDays) {
    const dates = [];
    let candidate = new Date(`${trackerRestartPlan.mainPlanStart}T12:00:00Z`);
    while(dates.length < totalDays){
        const date = isoDate(candidate);
        const weekday = candidate.getUTCDay();
        const isExceptionalFirstDay = date === trackerRestartPlan.mainPlanStart;
        if ((isExceptionalFirstDay || weekday >= 1 && weekday <= 5) && !isFullRestDate(date)) {
            dates.push(candidate);
        }
        candidate = addUtcDays(candidate, 1);
    }
    return dates;
}
const allCapacityDates = capacityDates(capacityWeekSpecs.length * DAYS_PER_CAPACITY_WEEK);
const ARTICLE_BLOCKS = [
    {
        title: "Orientierung und Artikelentscheidung",
        read: "Nur Titel, Abstract, Überschriften, eine zentrale Figure/Table und die Conclusion überfliegen.",
        skip: "Noch keine Detailabschnitte und keine vollständige Übersetzung lesen."
    },
    {
        title: "Direkt relevantes Konzept",
        read: "Nur einen direkt relevanten Absatz, eine Definition oder einen kleinen Subsection zum ersten Artikelfokus lesen.",
        skip: "Historischen Hintergrund und nicht projektbezogene Beispiele heute auslassen."
    },
    {
        title: "Methode, Guideline oder Evaluation",
        read: "Nur die Methode, Guideline, Architekturpassage oder Evaluation lesen, die eine Projektentscheidung stützen kann.",
        skip: "Keine zusätzliche Methode implementieren und keine Nebenexperimente verfolgen."
    },
    {
        title: "Conclusion, Grenzen und Projektbezug",
        read: "Conclusion und relevante Limitations lesen; nur gezielt zu markierten Lücken zurückspringen.",
        skip: "Den Artikel nicht pauschal von vorn lesen und keine neue Vollübersetzung beginnen."
    }
];
function researchTrackForDay(weekIndex, dayIndex, projectDay) {
    const block = dayIndex + 1;
    const reading = articleReadings[weekIndex];
    if (reading) {
        if (block === 5) {
            return {
                mode: "article",
                block,
                plannedMinutes: 240,
                sourceId: reading.sourceId,
                title: `Artikel ${reading.order}: frei erklären und abschließen`,
                readOnly: "Keine neue Lektüre. Nur markierte Stellen öffnen, wenn beim freien Erklären eine konkrete Lücke sichtbar wird.",
                doNotRead: "Nicht von vorn beginnen, nicht alles erneut übersetzen und keine neuen Nebenquellen öffnen.",
                question: "Kann ich Problem, Methode, Ergebnis, Grenze und Projektbezug zuerst auf Persisch und danach kurz auf Englisch erklären?",
                expectedOutput: `article-${String(reading.order).padStart(2, "0")}-teachback-and-project-link.md`,
                stopRule: "Stoppe, sobald fünf Punkte frei erklärt, mit Seitenbelegen verbunden und als A/B/C-Entscheidung gespeichert sind."
            };
        }
        const stage = ARTICLE_BLOCKS[block - 1];
        const focus = reading.readingFocus[Math.min(block - 1, reading.readingFocus.length - 1)];
        return {
            mode: "article",
            block,
            plannedMinutes: 240,
            sourceId: reading.sourceId,
            title: `Artikel ${reading.order} · Block ${block}/4 · ${stage.title}`,
            readOnly: `${stage.read} Fokus: ${focus}.`,
            doNotRead: stage.skip,
            question: block === 1 ? "Warum ist dieser Artikel für die Thesis A, B oder C und welcher Teil ist wirklich erforderlich?" : `Was behauptet dieser kleine Abschnitt zu „${focus}“ und was unterstützt er für das Projekt?`,
            expectedOutput: `article-${String(reading.order).padStart(2, "0")}-block-${block}.md`,
            stopRule: "Stoppe nach einer verstandenen Einheit, höchstens zwei notwendigen Begriffen, drei eigenen Sätzen und einem Seitenbeleg. Nicht wegen offener Seiten weiterlesen."
        };
    }
    const sourceId = projectDay.spec.sourceIds.find((id)=>Boolean(sources[id])) ?? "proposal";
    return {
        mode: "project-learning",
        block,
        plannedMinutes: 240,
        sourceId,
        title: block === 5 ? "Wochenwissen frei erklären und dokumentieren" : "Projektwissen gezielt lernen und sofort anwenden",
        readOnly: block === 5 ? "Keine neue Quelle. Die vier Projektentscheidungen der Woche aus dem Gedächtnis erklären und nur konkrete Lücken gezielt prüfen." : `Nur die unten genannte Quelle und die exakten Tagesfragen zu ${projectDay.spec.module} bearbeiten.`,
        doNotRead: "Keine zusätzlichen Tabs, Tutorials oder vollständigen Dokumentationen öffnen, die das heutige Ergebnis nicht direkt ermöglichen.",
        question: projectDay.spec.lookFor[Math.min(dayIndex, projectDay.spec.lookFor.length - 1)],
        expectedOutput: block === 5 ? `week-${String(weekIndex + 1).padStart(2, "0")}-research-synthesis.md` : `week-${String(weekIndex + 1).padStart(2, "0")}-day-${block}-learning-note.md`,
        stopRule: "Stoppe nach einer verständlichen Idee, einer dokumentierten Entscheidung und einem direkten Bezug zum heutigen Projektartefakt."
    };
}
const planWeeks = capacityWeekSpecs.map((week, weekIndex)=>{
    const days = week.projectDays.map((projectDay, dayIndex)=>{
        const spec = projectDay.spec;
        const scheduledDate = allCapacityDates[weekIndex * DAYS_PER_CAPACITY_WEEK + dayIndex];
        if (!scheduledDate) throw new Error(`Missing capacity date for week ${weekIndex + 1}, day ${dayIndex + 1}`);
        const date = isoDate(scheduledDate);
        const taskMinutes = [
            80,
            100,
            60
        ];
        const proposalText = spec.proposal.map((item)=>`§ ${item}`).join(", ");
        const workMode = plannedWorkMode(date);
        const researchTrack = researchTrackForDay(weekIndex, dayIndex, projectDay);
        const taskItems = [
            spec.lookFor,
            workMode === "paper" ? [
                `Verbinde diese drei Punkte auf Papier mit ${proposalText}`,
                `Skizziere ein reales Beispiel oder Fixture für ${spec.module} ohne Bildschirm`,
                "Markiere, welcher rückverfolgbare Beleg nach der Bildschirmfreigabe geprüft werden muss"
            ] : [
                `Verbinde diese drei Punkte mit ${proposalText}`,
                `Führe ein reales Beispiel oder Fixture in ${spec.module} aus`,
                "Dokumentiere eine SourceLocation oder einen rückverfolgbaren Beleg für das Ergebnis"
            ],
            workMode === "paper" ? [
                `Entwirf das Tagesergebnis auf Papier: ${spec.deliverable}`,
                "Notiere Testidee, Akzeptanzkriterium und offene Bildschirmprüfung getrennt",
                "Übertrage und hake das Ergebnis erst nach der ärztlich erlaubten Bildschirmfreigabe ab"
            ] : [
                `Erstelle das Tagesergebnis: ${spec.deliverable}`,
                "Führe mindestens einen Test, Sanity Check oder eine unabhängige Prüfung durch",
                "Speichere den kurzen Tagesbericht und setze den Status auf „Erledigt“"
            ]
        ];
        const taskTitles = [
            "1. Finden und verstehen",
            "2. Mit dem Projekt verbinden",
            "3. Ergebnis erstellen"
        ];
        const stableId = projectDay.stableId;
        const sourceIds = uniqueStrings([
            researchTrack.sourceId,
            ...spec.sourceIds
        ]);
        return {
            ...spec,
            // Revision 2 product decision: 2026-08-19..2026-09-07 is reading-only
            // for the live NLP course, so every non-course day in that window is
            // optional and must not create backlog, streak loss, or block the
            // required-progress% (see docs/NLP-RETRIEVAL-LAB.md).
            optionalDuringCourse: spec.optionalDuringCourse ?? (!projectDay.phaseId.startsWith("design-") && spec.kind !== "course" && date >= "2026-08-19" && date <= "2026-09-07"),
            id: stableId,
            date,
            workMode,
            week: weekIndex + 1,
            phase: projectDay.phase,
            phaseId: projectDay.phaseId,
            weekTitle: week.title,
            sourceIds,
            researchTrack,
            learningResourceIds: learningResourceIdsForDay(spec, projectDay.phaseId),
            taskMinutes,
            tasks: taskTitles.map((title, taskIndex)=>({
                    id: `${stableId}-task-${taskIndex + 1}`,
                    title,
                    minutes: taskMinutes[taskIndex],
                    items: taskItems[taskIndex].map((label, itemIndex)=>({
                            id: `${stableId}-t${taskIndex + 1}-i${itemIndex + 1}`,
                            label
                        }))
                }))
        };
    });
    const weeklyOutputDay = days[days.length - 1];
    if (!weeklyOutputDay) {
        throw new Error(`Week ${week.phaseId} must define at least one weekly output`);
    }
    return {
        number: weekIndex + 1,
        phase: week.phase,
        phaseId: week.phaseId,
        title: week.title,
        goal: week.goal,
        weeklyOutput: {
            dayId: weeklyOutputDay.id,
            deliverable: weeklyOutputDay.deliverable
        },
        days
    };
});
const allDays = planWeeks.flatMap((week)=>week.days);
const allTaskItems = allDays.flatMap((day)=>day.tasks.flatMap((task)=>task.items));
const originalPlanDays = allDays.filter((day)=>/^w\d+-d\d+$/.test(day.id));
// Date-keyed data written before stable w<N>-d<N> IDs shipped used the
// previous Revision 4 schedule. Keep that exact date sequence available
// during read migration even though Revision 5 moves the calendar. Some old
// and new dates overlap; the old meaning wins here because Revision 5 never
// writes date-based IDs.
const previousDesignDayDates = [
    "2026-08-18",
    "2026-08-20",
    "2026-08-21",
    "2026-08-23",
    "2026-08-25",
    "2026-08-27",
    "2026-08-28",
    "2026-08-30",
    "2026-09-01",
    "2026-09-03",
    "2026-09-04",
    "2026-09-06",
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
    "2026-09-11",
    "2026-09-12",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-09-24",
    "2026-09-25",
    "2026-09-26",
    "2026-09-28",
    "2026-09-29",
    "2026-09-30"
];
const previousTechnicalDayDates = Array.from({
    length: technicalOrder.length
}, (_, weekIndex)=>{
    const start = addUtcDays(new Date("2026-10-11T12:00:00Z"), weekIndex * 7);
    return Array.from({
        length: 7
    }, (_, offset)=>addUtcDays(start, offset)).filter((date)=>date.getUTCDay() !== 0).map(isoDate);
}).flat();
const PREVIOUS_PLAN_DAY_DATES = [
    ...previousDesignDayDates,
    ...previousTechnicalDayDates
];
if (PREVIOUS_PLAN_DAY_DATES.length !== originalPlanDays.length) {
    throw new Error("Revision 4 date migration no longer matches the stable plan positions");
}
const LEGACY_ID_MIGRATION = new Map(originalPlanDays.flatMap((day, dayIndex)=>{
    const previousDate = PREVIOUS_PLAN_DAY_DATES[dayIndex];
    const entries = [
        [
            previousDate,
            day.id
        ]
    ];
    for (const [taskIndex, task] of day.tasks.entries()){
        entries.push([
            `${previousDate}-task-${taskIndex + 1}`,
            task.id
        ]);
        for (const [itemIndex, item] of task.items.entries()){
            entries.push([
                `${previousDate}-t${taskIndex + 1}-i${itemIndex + 1}`,
                item.id
            ]);
        }
    }
    return entries;
}));
function migrateLegacyId(id) {
    return LEGACY_ID_MIGRATION.get(id) ?? id;
}
function migrateLegacyIds(ids) {
    return new Set(Array.from(ids, migrateLegacyId));
}
const PLAN_VERSION_HISTORY = [
    {
        version: 1,
        effectiveDate: "2026-08-14",
        reason: "Erster 25-Wochen-Plan generiert und auf den heutigen Starttag datiert.",
        tasksRemoved: [],
        tasksMoved: [],
        tasksAdded: []
    },
    {
        version: 2,
        effectiveDate: "2026-08-19",
        reason: "Der Advanced-Deep-Learning-Kurs dient bis 7. September ausschließlich dem Lesen relevanter Artikel und dem Extrahieren von Thesis-Belegen; technische Kursaufgaben sind optional.",
        tasksRemoved: [
            "Verpflichtende NLP-Implementierungen, Notebooks und Modelltrainings während des Kurses",
            "Rückstands- und Streak-Abzug für technische Aufgaben vom 19. August bis 7. September"
        ],
        tasksMoved: [
            "Technische Aufgaben vom 19. August bis 7. September bleiben sichtbar, zählen aber als optional"
        ],
        tasksAdded: [
            "Doppelte Artikelnummerierung: aktuelle Kursreihenfolge C01 bis C18 und erhaltene Originalnummer O06 bis O23",
            "Sechsteiliger Extraktionsbogen für Problem, Method, Data/Evaluation, Findings, Limitations und Projektbezug",
            "Explizite Zuordnung jeder Lektüre zu RQ1/RQ2, Evidence Record, Evidence Path, Flat/Graph Retrieval und Answerability"
        ]
    },
    {
        version: 3,
        effectiveDate: "2026-08-20",
        reason: "Die Artikel der Sitzungen 9 und 10 sind jetzt nach Pflichtlektüre, wiederverwendbaren Notizen und optionalem Related Work priorisiert; jede Sitzung hat genau drei prüfbare Ergebnisse.",
        tasksRemoved: [
            "Undifferenzierte Pflichtannahme für alle 10 beziehungsweise 14 zugeordneten Artikel",
            "Erneutes Lesen von LogicLens, Abedu und Lekssays in Sitzung 10"
        ],
        tasksMoved: [
            "Nicht zentrale Übersichts-, Prompting- und Related-Work-Artikel der Sitzungen 9 und 10 in den optionalen Bereich"
        ],
        tasksAdded: [
            "Drei verbindliche Ergebnisse für Sitzung 9: KG-QA-Notiz, CPG-LM-Notiz und CodeBERT/GraphCodeBERT-Go-No-Go",
            "Drei verbindliche Ergebnisse für Sitzung 10: Provenance-Vertrag, Flat/Graph-Protokoll und RAG-Refusal-Vertrag",
            "Explizite Wiederverwendung vorhandener Notizen ohne erneute Lektüre"
        ]
    },
    {
        version: 4,
        effectiveDate: "2026-08-20",
        reason: "Der Plan ist jetzt ausgabeorientiert: maximal drei Tagesergebnisse, ein echter Leichtmodus, Kurs-Transfer binnen 24 Stunden beziehungsweise sieben Tagen und ein ausführbarer Vertical Slice in Designwoche 3.",
        tasksRemoved: [
            "Neun gleichwertige Pflicht-Häkchen pro Tag",
            "Drei Monate Wartezeit bis zur ersten Anwendung zentraler Kurskonzepte",
            "Sechs reine Designwochen ohne ausführbaren technischen Beleg"
        ],
        tasksMoved: [
            "Detail-Checklisten dienen als Qualitätsleitfaden unter höchstens drei Tagesergebnissen",
            "Kurs-Mikroartefakte ersetzen ein Tagesergebnis und erzeugen keine zusätzliche Aufgabe"
        ],
        tasksAdded: [
            "Rettungsmodus mit einem und Leichtmodus mit zwei verpflichtenden Tagesergebnissen",
            "Zehn unmittelbare Kurs-Transferpläne mit 24-Stunden-Notiz und Sieben-Tage-Artefakt",
            "Ausführbarer Roslyn→EvidenceRecord→JSONL-Vertical-Slice mit Golden Test in Woche 3"
        ]
    },
    {
        version: 5,
        effectiveDate: "2026-08-29",
        reason: "Der Fortschritt wurde wahrheitsgemäß auf noch nicht gestartet gesetzt. Kalenderbelegte Zeiten werden geschützt; der 25-Wochen-Plan beginnt am 19. Oktober neu im Leichtmodus.",
        tasksRemoved: [
            "Überfällige Pflichttermine vor dem Neustart",
            "Alt-Rückstand aus den verpassten Kurssitzungen 1 bis 7"
        ],
        tasksMoved: [
            "Alle 25 Planwochen auf den Zeitraum 19. Oktober 2026 bis 10. April 2027",
            "Kurssitzungen 1 bis 7 in eine optionale Nachholspur ab dem Neustart",
            "Transferartefakte, die in die geschützte Pause fallen, in die optionale Nachholspur"
        ],
        tasksAdded: [
            "Nur die verbleibenden Live-Sitzungen 8 bis 10 vor der Pause",
            "Sanfter Wiedereinstieg vom 14. bis 18. Oktober ausschließlich im Rettungsmodus",
            "Standardrhythmus ab 19. Oktober: 70 Minuten ab 15:00 Uhr"
        ]
    },
    {
        version: 6,
        effectiveDate: "2026-08-30",
        reason: "Alte Kurspläne sind jetzt ausdrücklich archiviert: Die Live-Sitzungen 8 bis 10 sind reine Beobachtung ohne Vorbereitung, und W1 bis W6 bleiben zukünftige Projektwochen statt Rückstand.",
        tasksRemoved: [
            "Vorablektüre und Pflichtartefakte für die Live-Sitzungen 8 bis 10",
            "Automatisches Nachholen einer verpassten Live-Sitzung vor dem Projektneustart",
            "Pflichtstatus für Sitzungen 1 bis 7 und deren frühere Transferfristen"
        ],
        tasksMoved: [
            "Sitzungen 1 bis 7 in ein archiviertes Referenzfach mit Relevanzprüfung ab dem tatsächlichen Projektstart",
            "Alle 25 Wochen gemeinsam auf ein späteres Startdatum, falls der Neustart medizinisch noch nicht möglich ist"
        ],
        tasksAdded: [
            "Maximal drei Notizzeilen nach einer tatsächlich besuchten Live-Sitzung",
            "Höchstens eine optionale Nachholsitzung pro Woche und erst nach dem verpflichtenden Wochenartefakt",
            "Sichtbarer Hinweis: W1 bis W6 sind Zukunft, das Änderungsprotokoll ist keine Aufgabenliste und medizinische Vorgaben haben Vorrang"
        ]
    },
    {
        version: 7,
        effectiveDate: "2026-08-30",
        reason: "Der Projektplan beginnt jetzt am 30. August. Zwei medizinisch angeordnete Bildschirm-Pausen bleiben vollständig geschützt; ab der jeweils zweiten Erholungswoche sind nur geeignete Software-Engineering-Entwürfe auf Papier vorgesehen.",
        tasksRemoved: [
            "Falscher Gesamtstart am 19. Oktober",
            "Bildschirmarbeit in den beiden 14-tägigen Schutzzeiträumen",
            "Pflichtaufgaben in den ersten sieben Tagen nach jedem Eingriff"
        ],
        tasksMoved: [
            "W1 auf den 30. August bis 4. September",
            "W2 bis W4 in medizinisch zulässige Papier- und Zwischenphasen ohne Verdichtung",
            "Technischer Bildschirmstart auf den 26. Oktober und Planende auf den 6. März 2027"
        ],
        tasksAdded: [
            "Sieben vollständige Ruhetage nach jedem Eingriff",
            "Papiermodus ab Tag 8 bis zum Ende der ärztlich festgelegten 14-tägigen Bildschirm-Pause",
            "Kennzeichnung jedes betroffenen Plantags als Papiermodus mit späterer digitaler Prüfung"
        ]
    },
    {
        version: 8,
        effectiveDate: "2026-08-30",
        reason: "Jede Artikellektüre nennt jetzt ausdrücklich Volltext oder konkrete Pflichtabschnitte. Jede der 25 Wochen weist außerdem mindestens einen verbindlichen, anklickbaren Wochenoutput aus.",
        tasksRemoved: [
            "Unklare DEEP-, TARGET-, REVIEW- und RELATED-Kürzel ohne konkrete Leseanweisung",
            "Wochen ohne sichtbar hervorgehobenen Mindestoutput"
        ],
        tasksMoved: [
            "Bestehende Tagesergebnisse bleiben erhalten; das letzte prüfbare Tagesergebnis jeder Woche wird zusätzlich als verbindlicher Wochenoutput markiert"
        ],
        tasksAdded: [
            "Vollständig-lesen-Kennzeichnung für DEEP-Artikel",
            "Explizite Abschnittslisten und Lesefokus für TARGET-, REVIEW- und RELATED-Artikel",
            "Mindestens ein verbindlicher Wochenoutput in jeder der 25 Wochen"
        ]
    },
    {
        version: 9,
        effectiveDate: "2026-08-30",
        reason: "Jeder Plantag beginnt jetzt mit einer kurzen, auf genau diese Aufgabe zugeschnittenen Vorwissensphase aus verlässlichen Lernseiten, damit auch neue Begriffe wie Personas ohne vorausgesetztes Wissen bearbeitet werden können.",
        tasksRemoved: [],
        tasksMoved: [],
        tasksAdded: [
            "Ein bis zwei autoritative Lernseiten für jeden der 146 Plantage",
            "Konkreter Abschnitt, geschätzte Vorbereitungszeit und direkte Verknüpfung pro Lernseite",
            "Unmittelbare Anwendungsanweisung vom Gelesenen zum Tagesartefakt"
        ]
    },
    {
        version: 10,
        effectiveDate: "2026-08-30",
        reason: "Die bestätigte Tageskapazität beträgt an medizinisch freigegebenen regulären Tagen vier Stunden. Die Vorwissenslektüre wird deshalb in den ersten 70-Minuten-Block integriert und erzeugt keine zusätzliche Arbeitszeit.",
        tasksRemoved: [],
        tasksMoved: [
            "Vorwissenslektüre in den Block Finden und verstehen statt außerhalb des Tagesbudgets"
        ],
        tasksAdded: [
            "Vier-Stunden-Modus als Standard: 210 Minuten Aufgaben und zwei Pausen zu je 15 Minuten",
            "Sichtbare Kennzeichnung, dass die Lernseiten bereits im ersten Arbeitsblock enthalten sind",
            "Medizinische Ruhe- und Papierphasen behalten Vorrang vor der regulären Tageskapazität"
        ]
    },
    {
        version: 11,
        effectiveDate: "2026-08-31",
        reason: "Die bestätigte Vollzeitkapazität beträgt acht Stunden pro regulärem Arbeitstag. Jeder verpflichtend gelesene Artikel erhält einen eigenen 16-Stunden-Zyklus; Projektlernen, Implementierung, Test und Wochenbeleg laufen parallel. Die Dauer wird aus dem realen Arbeitsbestand berechnet und nicht mehr auf 25 Wochen begrenzt.",
        tasksRemoved: [
            "Pauschale Aufforderung, einen vollständigen Artikel in einem einzelnen 70-Minuten-Block zu lesen",
            "Feste Obergrenze von 25 Planwochen"
        ],
        tasksMoved: [
            "146 bestehende Projekttage in vier Projektschritte pro Vollzeitwoche",
            "Artikelarbeit im 16-Stunden-Zyklus: vier Blöcke zu je vier Stunden plus freier Wochenabruf"
        ],
        tasksAdded: [
            "37 kapazitätsbasierte Wochen mit fünf klaren Arbeitstagen",
            "16 Stunden für jedes der 18 verpflichtend geplanten Paper",
            "Täglich vier Stunden Forschung und vier Stunden Projektlernen oder Umsetzung",
            "Ein verbindlicher Integrations-, Test- und Evidence-Beleg an jedem fünften Wochentag",
            "Stressfreie Stoppregel: verstandene Einheit und sichtbarer Beleg statt Seitenzahl"
        ]
    },
    {
        version: 12,
        effectiveDate: "2026-09-01",
        reason: "Der tatsächliche Projektstart wird jetzt verbindlich auf den 15. Oktober 2026 festgelegt. Der bisherige Standardwert vom 30. August war ein Platzhalter aus der Zeit vor Abschluss der medizinisch geschützten Pausen und entsprach nicht mehr dem realen Beginn.",
        tasksRemoved: [
            "Platzhalter-Startdatum 30. August als aktiver Planbeginn"
        ],
        tasksMoved: [
            "Alle Wochen und Tage bleiben inhaltlich unverändert und verschieben sich gemeinsam um denselben Versatz auf den 15. Oktober 2026"
        ],
        tasksAdded: [
            "15. Oktober 2026 als verbindlicher Standardstart in den App-Einstellungen"
        ]
    }
];
const PLAN_VERSION = PLAN_VERSION_HISTORY[PLAN_VERSION_HISTORY.length - 1]?.version ?? 1;
const planMeta = {
    start: trackerRestartPlan.mainPlanStart,
    designEnd: allDays.filter((day)=>day.phaseId.startsWith("design-")).at(-1)?.date ?? "2026-11-05",
    restStart: trackerRestartPlan.protectedBreakStart,
    restEnd: trackerRestartPlan.protectedBreakEnd,
    gentleRestartStart: trackerRestartPlan.gentleRestartStart,
    gentleRestartEnd: trackerRestartPlan.gentleRestartEnd,
    technicalStart: planWeeks.find((week)=>!week.days.every((day)=>day.phaseId.startsWith("design-")))?.days[0]?.date ?? "2026-10-19",
    end: allDays[allDays.length - 1]?.date ?? "2027-05-27",
    designDays: planWeeks.filter((week)=>week.phaseId.startsWith("design-")).reduce((sum, week)=>sum + week.days.length, 0),
    technicalDays: planWeeks.filter((week)=>!week.phaseId.startsWith("design-")).reduce((sum, week)=>sum + week.days.length, 0),
    totalWeeks: planWeeks.length,
    totalDays: allDays.length,
    totalItems: allTaskItems.length,
    requiredArticleCount: articleReadings.length,
    articleHoursPerRequiredReading: ARTICLE_HOURS_PER_REQUIRED_READING,
    requiredArticleHours: articleReadings.length * ARTICLE_HOURS_PER_REQUIRED_READING,
    weeklyCapacityHours: WEEKLY_CAPACITY_HOURS,
    plannedHours: planWeeks.length * WEEKLY_CAPACITY_HOURS
};
}),
];

//# sourceMappingURL=app_plan-data_ts_11d6fou._.js.map