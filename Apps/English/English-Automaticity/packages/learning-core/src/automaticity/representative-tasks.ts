import type { Language, Stage } from "./contracts";
import type { FamilyId, PracticeTask } from "./curriculum";
import type { RuleId } from "./construction-rules";

export const REPRESENTATIVE_VERSION = "2026-09-05.5";
export interface RepresentativeScope {
  rule: RuleId;
  constructionId: string;
  familyId: FamilyId;
  target: string;
  sources: string[];
  scenarios: [
    { facts: string; frame: string[]; example: string; error: string },
    { facts: string; frame: string[]; example: string; error: string },
  ];
  transfer: string;
}
const bc = "https://learnenglish.britishcouncil.org/free-resources/grammar/";
const ids = "https://grammis.ids-mannheim.de/";
export const REPRESENTATIVE_SCOPES: RepresentativeScope[] = [
  {
    rule: "en.inflection",
    constructionId: "en.c.007",
    familyId: "G06",
    target: "present simple subject–verb agreement",
    sources: [bc + "english-grammar-reference/present-simple"],
    scenarios: [
      {
        facts:
          "Mina; work; in the library; every day. Describe this routine in the present simple.",
        frame: ["mina", "work", "in the library", "every day"],
        example: "Mina works in the library every day.",
        error: "Mina work in the library every day.",
      },
      {
        facts:
          "Omar; study; at home; every evening. Describe this routine in the present simple.",
        frame: ["omar", "study", "at home", "every evening"],
        example: "Omar studies at home every evening.",
        error: "Omar study at home every evening.",
      },
    ],
    transfer:
      "Tell a colleague about two people's different routines. Use your own people, activities and times.",
  },
  {
    rule: "de.inflection",
    constructionId: "de.c.041",
    familyId: "G05",
    target: "Adjektivendung nach bestimmtem Artikel im Akkusativ und Dativ",
    sources: [ids + "systematische-grammatik/371"],
    scenarios: [
      {
        facts:
          "Sprecher: ich; Handlung: erklären; Gegenstand: der neue Plan. Verwende einen bestimmten Artikel.",
        frame: ["ich", "explain", "plan"],
        example: "Ich erkläre den neuen Plan.",
        error: "Ich erkläre dem neue Plan.",
      },
      {
        facts:
          "Sprecher: wir; Handlung: arbeiten mit; Gegenstand: der neue Ansatz. Verwende einen bestimmten Artikel.",
        frame: ["wir", "work", "ansatz"],
        example: "Wir arbeiten mit dem neuen Ansatz.",
        error: "Wir arbeiten mit den neue Ansatz.",
      },
    ],
    transfer:
      "Erkläre einem Kollegen, welchen Gegenstand du verwendest und mit welchem neuen Gegenstand ihr arbeitet. Wähle eigene Nomen und passende Adjektive.",
  },
  {
    rule: "en.valency",
    constructionId: "en.c.102",
    familyId: "G08",
    target: "depend/rely on and participant roles",
    sources: [bc + "b1-b2/verbs-prepositions"],
    scenarios: [
      {
        facts:
          "Mina needs Omar's support. Use depend or rely in the present simple. Keep both names.",
        frame: ["mina", "depend", "omar"],
        example: "Mina depends on Omar.",
        error: "Mina depends to Omar.",
      },
      {
        facts:
          "Omar needs Mina's support. Use depend or rely in the present simple. Keep both names.",
        frame: ["omar", "depend", "mina"],
        example: "Omar relies on Mina.",
        error: "Omar relies with Mina.",
      },
    ],
    transfer:
      "Explain who you rely on for a real task and why. Make clear who provides the support.",
  },
  {
    rule: "de.valency",
    constructionId: "de.c.127",
    familyId: "G08",
    target: "jemanden kontaktieren ohne mit",
    sources: [
      "https://www.duden.de/rechtschreibung/kontaktieren",
      ids + "progr%40mm/6876",
    ],
    scenarios: [
      {
        facts:
          "Mina hat gestern den Kontakt zu Omar hergestellt. Verwende kontaktieren im Perfekt und nenne beide Namen und gestern.",
        frame: ["mina", "contact", "omar", "gestern"],
        example: "Mina hat gestern Omar kontaktiert.",
        error: "Mina hat gestern mit Omar kontaktiert.",
      },
      {
        facts:
          "Omar hat gestern den Kontakt zu Mina hergestellt. Verwende kontaktieren im Perfekt und nenne beide Namen und gestern.",
        frame: ["omar", "contact", "mina", "gestern"],
        example: "Gestern hat Omar Mina kontaktiert.",
        error: "Omar hat gestern mit Mina kontaktiert.",
      },
    ],
    transfer:
      "Berichte von einem Kontakt in deinem Alltag: Wer hat wen kontaktiert? Beschreibe zusätzlich, mit wem du gesprochen hast.",
  },
  {
    rule: "en.temporal",
    constructionId: "en.c.030",
    familyId: "G06",
    target: "finished past time versus present perfect",
    sources: [bc + "english-grammar-reference/present-perfect"],
    scenarios: [
      {
        facts:
          "Mina; finish the report; yesterday. State when this completed event happened and keep the time expression.",
        frame: ["mina", "finish", "report", "yesterday"],
        example: "Mina finished the report yesterday.",
        error: "Mina has finished the report yesterday.",
      },
      {
        facts:
          "Omar; finish the report; last Monday. State when this completed event happened and keep the time expression.",
        frame: ["omar", "finish", "report", "last monday"],
        example: "Last Monday, Omar finished the report.",
        error: "Omar has finished the report last Monday.",
      },
    ],
    transfer:
      "Give a colleague one update about something you have completed and another about an event at a specific finished past time. Make the time difference clear.",
  },
  {
    rule: "de.temporal",
    constructionId: "de.c.015",
    familyId: "G06",
    target: "Perfekt mit haben und Partizip II",
    sources: [ids + "systematische-grammatik/1219"],
    scenarios: [
      {
        facts:
          "Mina; den Bericht schreiben; gestern. Berichte im Perfekt und nenne alle Angaben.",
        frame: ["mina", "write", "report", "gestern"],
        example: "Mina hat gestern den Bericht geschrieben.",
        error: "Mina ist gestern den Bericht schreiben.",
      },
      {
        facts:
          "Omar; den Bericht schreiben; am Montag. Berichte im Perfekt und nenne alle Angaben.",
        frame: ["omar", "write", "report", "am montag"],
        example: "Am Montag hat Omar den Bericht geschrieben.",
        error: "Omar ist am Montag den Bericht geschrieben.",
      },
    ],
    transfer:
      "Erzähle von zwei abgeschlossenen Aufgaben aus deinem Alltag. Verwende das Perfekt und passende Zeitangaben.",
  },
  {
    rule: "en.clause",
    constructionId: "en.c.040",
    familyId: "G17",
    target: "statement order in a present reporting clause",
    sources: [bc + "english-grammar-reference/reported-speech"],
    scenarios: [
      {
        facts:
          "Mina is speaking now. Her message: Omar is ready. Report it using says, keep both names, and do not use quotation marks.",
        frame: ["mina", "say", "omar", "ready"],
        example: "Mina says that Omar is ready.",
        error: "Mina says that Omar ready is.",
      },
      {
        facts:
          "Omar is speaking now. His message: Mina is ready. Report it using says, keep both names, and do not use quotation marks.",
        frame: ["omar", "say", "mina", "ready"],
        example: "Omar says Mina is ready.",
        error: "Omar says Mina ready is.",
      },
    ],
    transfer:
      "Tell a teammate what another person is saying about a current plan. Make clear who is speaking and who the message concerns.",
  },
  {
    rule: "de.clause",
    constructionId: "de.c.022",
    familyId: "G14",
    target: "weil mit Verbendstellung im geschriebenen Standarddeutsch",
    sources: [ids + "progr%40mm/6851"],
    scenarios: [
      {
        facts:
          "Mina bleibt zu Hause. Grund: Omar ist krank. Verbinde mit weil und nenne beide Namen. Verwende geschriebenes Standarddeutsch.",
        frame: ["mina", "stay-home", "omar", "ill"],
        example: "Mina bleibt zu Hause, weil Omar krank ist.",
        error: "Mina bleibt zu Hause, weil Omar ist krank.",
      },
      {
        facts:
          "Omar bleibt zu Hause. Grund: Mina ist krank. Verbinde mit weil und nenne beide Namen. Verwende geschriebenes Standarddeutsch.",
        frame: ["omar", "stay-home", "mina", "ill"],
        example: "Weil Mina krank ist, bleibt Omar zu Hause.",
        error: "Weil Mina krank ist, Omar bleibt zu Hause.",
      },
    ],
    transfer:
      "Begründe in einer Nachricht eine echte Änderung deines Tagesplans. Stelle klar, wessen Situation den Plan verändert hat.",
  },
  {
    rule: "en.voice",
    constructionId: "en.c.053",
    familyId: "G11",
    target: "obligation or possibility with modal passive",
    sources: [bc + "b1-b2/passives"],
    scenarios: [
      {
        facts:
          "Object: the report. Action: check. Checking is required. Express the obligation in the passive; the person doing it is unspecified.",
        frame: ["report", "must", "check"],
        example: "The report must be checked.",
        error: "The report must checked.",
      },
      {
        facts:
          "Object: the door. Action: open. Opening it is possible. Use can and the passive; the person doing it is unspecified.",
        frame: ["door", "can", "open"],
        example: "The door can be opened.",
        error: "The door can is opened.",
      },
    ],
    transfer:
      "Write a short instruction about something that must be done and something that can be done. Focus on the objects or actions, not on who does them.",
  },
  {
    rule: "de.voice",
    constructionId: "de.c.044",
    familyId: "G11",
    target: "Passiv mit müssen oder können",
    sources: [ids + "progr%40mm/1695"],
    scenarios: [
      {
        facts:
          "Gegenstand: der Bericht. Handlung: prüfen. Die Prüfung ist Pflicht. Formuliere im Passiv mit müssen, ohne eine handelnde Person zu nennen.",
        frame: ["report", "muss", "check"],
        example: "Der Bericht muss geprüft werden.",
        error: "Der Bericht muss geprüft wird.",
      },
      {
        facts:
          "Gegenstand: die Tür. Handlung: öffnen. Das Öffnen ist möglich. Formuliere im Passiv mit können, ohne eine handelnde Person zu nennen.",
        frame: ["door", "kann", "open"],
        example: "Die Tür kann geöffnet werden.",
        error: "Die Tür kann öffnen werden.",
      },
    ],
    transfer:
      "Erkläre einem Kollegen, was unbedingt erledigt werden muss und was optional gemacht werden kann. Verwende eigene Gegenstände und Handlungen.",
  },
  {
    rule: "en.discourse",
    constructionId: "en.c.092",
    familyId: "G14",
    target: "contrast while preserving both propositions",
    sources: [bc + "b1-b2/contrasting-ideas-although-despite-others"],
    scenarios: [
      {
        facts:
          "Mina is tired. Mina keeps working. Connect these facts to express an unexpected contrast. Keep the name in both clauses.",
        frame: ["mina", "tired", "mina", "working"],
        example: "Although Mina is tired, Mina keeps working.",
        error: "Although Mina is tired, Mina keep working.",
      },
      {
        facts:
          "Omar is tired. Omar keeps working. Connect these facts to express an unexpected contrast. Keep the name in both clauses.",
        frame: ["omar", "tired", "omar", "working"],
        example: "Omar keeps working although Omar is tired.",
        error: "Omar keep working although Omar is tired.",
      },
    ],
    transfer:
      "Describe a choice you made despite a difficulty. Give enough context to make the unexpected contrast clear.",
  },
  {
    rule: "de.discourse",
    constructionId: "de.c.039",
    familyId: "G14",
    target: "konzessive Verknüpfung mit obwohl, trotzdem oder aber",
    sources: [ids + "progr%40mm/6851"],
    scenarios: [
      {
        facts:
          "Mina ist müde. Mina arbeitet weiter. Verbinde die Aussagen als unerwarteten Gegensatz. Nenne Mina in beiden Teilsätzen. Verwende geschriebenes Standarddeutsch.",
        frame: ["mina", "tired", "mina", "working"],
        example: "Obwohl Mina müde ist, arbeitet Mina weiter.",
        error: "Obwohl Mina müde ist, Mina arbeitet weiter.",
      },
      {
        facts:
          "Omar ist müde. Omar arbeitet weiter. Verbinde die Aussagen als unerwarteten Gegensatz. Nenne Omar in beiden Teilsätzen. Verwende geschriebenes Standarddeutsch.",
        frame: ["omar", "tired", "omar", "working"],
        example: "Omar ist müde, trotzdem arbeitet Omar weiter.",
        error: "Omar arbeitet weiter, obwohl Omar ist müde.",
      },
    ],
    transfer:
      "Erkläre eine eigene Entscheidung, die du trotz einer Schwierigkeit getroffen hast. Mache den unerwarteten Gegensatz deutlich.",
  },
];

export function representativeTasks(
  scope: RepresentativeScope,
): PracticeTask[] {
  const language = scope.rule.slice(0, 2) as Language,
    en = language === "en";
  return (
    [
      "notice",
      "retrieve",
      "vary",
      "produce",
      "repair",
      "transfer",
      "retain",
    ] as Stage[]
  ).flatMap((stage) =>
    (["writing", "speaking"] as const).map((modality) => {
      const scenario = stage === "vary" || stage === "retain" ? 1 : 0;
      const scene = scope.scenarios[scenario];
      const manual =
        ["notice", "produce", "transfer"].includes(stage) ||
        modality === "speaking";
      const instructions =
        stage === "notice"
          ? en
            ? `Explain how the form expresses its meaning: ${scene.example}`
            : `Erkläre den Zusammenhang zwischen Form und Bedeutung: ${scene.example}`
          : stage === "produce" || stage === "transfer"
            ? scope.transfer
            : (stage === "repair"
                ? en
                  ? `Repair this sentence without changing the facts: ${scene.error} `
                  : `Korrigiere diesen Satz, ohne die Angaben zu verändern: ${scene.error} `
                : "") +
              (stage === "retain"
                ? en
                  ? "Without reopening examples: "
                  : "Ohne die Beispiele erneut zu öffnen: "
                : "") +
              scene.facts +
              (en
                ? " Write one complete sentence. Word order and wording may vary."
                : " Formuliere einen vollständigen Satz. Wortstellung und Formulierung dürfen variieren.");
      return {
        id: `${scope.constructionId}.representative.${stage}.${modality}`,
        version: REPRESENTATIVE_VERSION,
        constructionId: scope.constructionId,
        familyId: scope.familyId,
        // Reused scene variants intentionally share exposure identity, including modalities.
        itemFamily: `${scope.rule}.representative.${manual && ["produce", "transfer"].includes(stage) ? stage : scenario}`,
        contextId: `${scope.rule}.scene.${scenario}`,
        rubricVersion: "representative-construction-v1",
        stage,
        modality,
        partition: stage === "notice" ? "teaching" : "practice",
        transferCondition: stage === "transfer" ? "elicited" : "none",
        contentReview: "authored",
        prompt:
          modality === "speaking"
            ? (en
                ? "Record your answer aloud. "
                : "Sprich deine Antwort und nimm sie auf. ") +
              instructions
                .replace(
                  en
                    ? "Write one complete sentence."
                    : "Formuliere einen vollständigen Satz.",
                  en
                    ? "Say one complete sentence."
                    : "Sprich einen vollständigen Satz.",
                )
                .replace(/\bWrite\b/g, "Say")
            : instructions,
        answerPolicy: stage === "notice" ? "reflection" : "open",
        responseKind:
          stage === "notice"
            ? "reflection"
            : stage === "repair"
              ? "correction"
              : "free_output",
        acceptedAnswers: [],
        hints: [scope.target],
        solution: manual && stage !== "notice" ? null : scene.example,
        normalisation: {
          nfc: true,
          whitespace: true,
          terminalFullStop: true,
          preserveCase: true,
        },
        sourceId: `representative:${scope.rule}`,
        constructionAssessment: {
          rule: scope.rule,
          version: "1.0.0",
          scenario,
          route: manual ? "human_review" : "bounded_rule",
        },
      };
    }),
  );
}

/** A changed prompt, task version or rubric cannot silently inherit a rule. */
export function resolveRepresentativeTask(
  task: PracticeTask,
): { scope: RepresentativeScope; scenario: 0 | 1 } | null {
  const scope = REPRESENTATIVE_SCOPES.find(
    (row) => row.constructionId === task.constructionId,
  );
  if (!scope) return null;
  const expected = representativeTasks(scope).find((row) => row.id === task.id);
  if (!expected) return null;
  for (const key of Object.keys(expected) as (keyof PracticeTask)[]) {
    if (key === "contentReview") continue; // A later real review does not change authored content.
    if (JSON.stringify(task[key]) !== JSON.stringify(expected[key]))
      return null;
  }
  return { scope, scenario: expected.constructionAssessment!.scenario };
}
