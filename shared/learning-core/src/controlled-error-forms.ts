import type { Language } from "./automaticity/contracts";

export const CONTROLLED_ERROR_VERSION = "2026-11-04.1";
export const CONTROLLED_ERROR_DATE = "2026-11-04";

export interface ControlledErrorSpec {
  readonly language: Language;
  readonly constructionId: string;
  readonly taskId: string;
  readonly prompt: string;
  readonly acceptedAnswers: readonly string[];
  readonly rejectedAnswers: readonly {
    readonly answer: string;
    readonly explanation: string;
  }[];
}

/** Authored exact forms, not a grammar recognizer or independent human review.
 * Absence from this list says nothing about whether an answer is grammatical.
 * Keep this authoring corpus out of the general browser evaluator bundle. */
export const CONTROLLED_ERROR_FORMS: readonly ControlledErrorSpec[] = [
  {
    language: "en",
    constructionId: "en.c.001",
    taskId: "en.c.001.retrieve.mastery-20261031-0.forms-202611012.writing",
    prompt:
      "Complete with am, is or are. Write the full sentence: I ___ ready for the lesson.",
    acceptedAnswers: [
      "I am ready for the lesson.",
      "I’m ready for the lesson.",
    ],
    rejectedAnswers: [
      {
        answer: "I is ready for the lesson.",
        explanation: "Check which form of be agrees with I.",
      },
      {
        answer: "I are ready for the lesson.",
        explanation: "Check which form of be agrees with I.",
      },
    ],
  },
  {
    language: "en",
    constructionId: "en.c.015",
    taskId: "en.c.015.retrieve.mastery-20261031-0.forms-202611012.writing",
    prompt:
      "Use the present continuous of study. Write the completed sentence: She ___ for her exam.",
    acceptedAnswers: [
      "She is studying for her exam.",
      "She’s studying for her exam.",
    ],
    rejectedAnswers: [
      {
        answer: "She is study for her exam.",
        explanation: "After be, the continuous verb needs its -ing form.",
      },
      {
        answer: "She studying for her exam.",
        explanation:
          "The continuous verb needs a finite form of be before the -ing form.",
      },
    ],
  },
  {
    language: "en",
    constructionId: "en.c.034",
    taskId: "en.c.034.retrieve.mastery-20261031-0.forms-202611012.writing",
    prompt:
      "Use will and stay. Write the completed conditional sentence: If it rains, we ___ at home.",
    acceptedAnswers: [
      "If it rains, we will stay at home.",
      "If it rains, we’ll stay at home.",
    ],
    rejectedAnswers: [
      {
        answer: "If it rains, we will stays at home.",
        explanation: "After will, use the base form of the verb, without -s.",
      },
      {
        answer: "If it rains, we will staying at home.",
        explanation:
          "Will cannot be followed directly by an -ing form; check the verb form.",
      },
    ],
  },
  {
    language: "en",
    constructionId: "en.c.048",
    taskId: "en.c.048.retrieve.mastery-20261031-0.forms-202611012.writing",
    prompt:
      "Use would and help in the third conditional. Write the full sentence: If I had known, I ___ you.",
    acceptedAnswers: [
      "If I had known, I would have helped you.",
      "If I’d known, I would have helped you.",
    ],
    rejectedAnswers: [
      {
        answer: "If I had known, I would have help you.",
        explanation: "After have in this verb group, use the past participle.",
      },
      {
        answer: "If I had known, I would had helped you.",
        explanation: "After would, the next verb must be in its base form.",
      },
    ],
  },
  {
    language: "en",
    constructionId: "en.c.058",
    taskId: "en.c.058.retrieve.mastery-20261031-0.writing",
    prompt:
      "Keep the meaning. Rewrite without if, beginning Had: If I had known about the delay, I would have called.",
    acceptedAnswers: ["Had I known about the delay, I would have called."],
    rejectedAnswers: [
      {
        answer: "Had I knew about the delay, I would have called.",
        explanation:
          "In the inverted perfect clause, had is followed by a past participle.",
      },
      {
        answer: "Had I have known about the delay, I would have called.",
        explanation:
          "Do not add have after the inverted had; check the perfect verb group.",
      },
    ],
  },
  {
    language: "en",
    constructionId: "en.c.072",
    taskId: "en.c.072.retrieve.mastery-20261031-1.writing",
    prompt:
      "Combine all three statements using Although and a relative clause beginning which. Keep their meaning: The study was small. Its method was transparent. Its method convinced the reviewers.",
    acceptedAnswers: [
      "Although the study was small, its method, which was transparent, convinced the reviewers.",
    ],
    rejectedAnswers: [
      {
        answer:
          "Although the study was small, its method, which were transparent, convinced the reviewers.",
        explanation:
          "Which refers to the singular noun method; check agreement inside the relative clause.",
      },
      {
        answer:
          "Although the study was small, its method, which was transparent, have convinced the reviewers.",
        explanation:
          "The main-clause subject is the singular noun method; check its agreement with have.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.001",
    taskId: "de.c.001.retrieve.mastery-20261031-0.writing",
    prompt:
      "Ergänze die passende Form von sein und schreibe den ganzen Satz: Wir ___ bereit.",
    acceptedAnswers: ["Wir sind bereit."],
    rejectedAnswers: [
      {
        answer: "Wir ist bereit.",
        explanation: "Prüfe die Form von sein für das Subjekt wir.",
      },
      {
        answer: "Wir bist bereit.",
        explanation: "Die Verbform muss zur ersten Person Plural wir passen.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.015",
    taskId: "de.c.015.retrieve.mastery-20261031-0.writing",
    prompt:
      "Ergänze das Partizip II von kochen und schreibe den ganzen Satz: Ich habe gestern Suppe ___.",
    acceptedAnswers: ["Ich habe gestern Suppe gekocht."],
    rejectedAnswers: [
      {
        answer: "Ich habe gestern Suppe kochen.",
        explanation: "Im Perfekt braucht kochen nach habe das Partizip II.",
      },
      {
        answer: "Ich habe gestern Suppe kocht.",
        explanation:
          "Verwende nach habe ein Partizip II statt einer Präsensform.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.033",
    taskId: "de.c.033.retrieve.mastery-20261031-0.writing",
    prompt:
      "Formuliere denselben Wunsch mit würde und gern. Schreibe den ganzen Satz: Ich möchte gern nach Berlin reisen.",
    acceptedAnswers: ["Ich würde gern nach Berlin reisen."],
    rejectedAnswers: [
      {
        answer: "Ich würde gern nach Berlin reist.",
        explanation: "Nach würde steht das zweite Verb im Infinitiv.",
      },
      {
        answer: "Ich würden gern nach Berlin reisen.",
        explanation: "Prüfe die Form von würden für das Subjekt ich.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.043",
    taskId: "de.c.043.retrieve.mastery-20261031-0.writing",
    prompt:
      "Ergänze die passende Form von sein im Konjunktiv II der Vergangenheit und schreibe den ganzen Satz: Wenn ich Zeit gehabt hätte, ___ ich mitgekommen.",
    acceptedAnswers: ["Wenn ich Zeit gehabt hätte, wäre ich mitgekommen."],
    rejectedAnswers: [
      {
        answer: "Wenn ich Zeit gehabt hätte, wärest ich mitgekommen.",
        explanation:
          "Das Subjekt ich verlangt die erste Person Singular des Hilfsverbs.",
      },
      {
        answer: "Wenn ich Zeit gehabt hätte, wäre ich mitgekommt.",
        explanation: "Prüfe das Partizip II von mitkommen am Satzende.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.057",
    taskId: "de.c.057.retrieve.mastery-20261031-0.writing",
    prompt:
      "Gib Lenas Aussage in indirekter Rede mit Konjunktiv I wieder. Beginne mit Lena sagt, und verwende keinen dass-Satz: Lena sagt: Ich bin krank.",
    acceptedAnswers: ["Lena sagt, sie sei krank."],
    rejectedAnswers: [
      {
        answer: "Lena sagt, sie seist krank.",
        explanation: "Seist ist eine Form für du; prüfe die Verbform für sie.",
      },
      {
        answer: "Lena sagt, sie sei ist krank.",
        explanation:
          "In diesem Teilsatz stehen zwei finite Formen von sein; prüfe die Verbgruppe.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.071",
    taskId: "de.c.071.retrieve.mastery-20261031-0.writing",
    prompt:
      "Formuliere dieselbe Möglichkeit mit könnte, ohne sie als Tatsache auszugeben: Die Maßnahme hat möglicherweise unbeabsichtigte Folgen.",
    acceptedAnswers: ["Die Maßnahme könnte unbeabsichtigte Folgen haben."],
    rejectedAnswers: [
      {
        answer: "Die Maßnahme könnte unbeabsichtigte Folgen hat.",
        explanation: "Nach dem Modalverb steht das zweite Verb im Infinitiv.",
      },
      {
        answer: "Die Maßnahme könnten unbeabsichtigte Folgen haben.",
        explanation:
          "Das Subjekt die Maßnahme ist Singular; prüfe die Form des Modalverbs.",
      },
    ],
  },
  {
    language: "de",
    constructionId: "de.c.086",
    taskId: "de.c.086.retrieve.1.cues-202611013.writing",
    prompt:
      "Setze die fehlende Form ein und schreibe die vollständige Antwort auf Deutsch: Ich ___ jeden Morgen um sieben Uhr auf. (aufstehen)",
    acceptedAnswers: ["Ich stehe jeden Morgen um sieben Uhr auf."],
    rejectedAnswers: [
      {
        answer: "Ich aufstehe jeden Morgen um sieben Uhr.",
        explanation:
          "Im einfachen Hauptsatz wird aufstehen getrennt: Prüfe die finite Verbform und die Stellung der Partikel.",
      },
      {
        answer: "Ich stehst jeden Morgen um sieben Uhr auf.",
        explanation: "Prüfe die finite Verbform für das Subjekt ich.",
      },
    ],
  },
];

export function acceptedAnswerFingerprint(answers: readonly string[]): string {
  return JSON.stringify(answers);
}

/** Exact prompt and accepted-answer guards prevent reuse after task changes. */
export function controlledErrorsForTask(
  language: Language,
  task: {
    readonly id?: string;
    readonly prompt: string;
    readonly acceptedAnswers: readonly string[];
  },
): ControlledErrorSpec["rejectedAnswers"] {
  return (
    CONTROLLED_ERROR_FORMS.find(
      (spec) =>
        spec.language === language &&
        (task.id === undefined ||
          task.id === spec.taskId ||
          task.id === controlledErrorTaskId(spec.taskId)) &&
        task.prompt === spec.prompt &&
        acceptedAnswerFingerprint(task.acceptedAnswers) ===
          acceptedAnswerFingerprint(spec.acceptedAnswers),
    )?.rejectedAnswers ?? []
  );
}

export function controlledErrorTaskId(originalId: string): string {
  return originalId.replace(/\.writing$/u, ".errors-202611041.writing");
}

/** For authoring a matching Grammar Lab item. Never matches by topic alone. */
export function controlledErrorsForAnswer(
  language: Language,
  constructionId: string,
  acceptedAnswers: readonly string[],
): ControlledErrorSpec["rejectedAnswers"] {
  const matches = CONTROLLED_ERROR_FORMS.filter(
    (spec) =>
      spec.language === language &&
      spec.constructionId === constructionId &&
      acceptedAnswerFingerprint(spec.acceptedAnswers) ===
        acceptedAnswerFingerprint(acceptedAnswers),
  );
  return matches.length === 1 ? matches[0]!.rejectedAnswers : [];
}
