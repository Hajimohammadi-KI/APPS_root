import type { Language } from "./automaticity/contracts";

export const LEARNING_CYCLE_VERSION = "2026-11-04.2";

interface ClosedCycleStep {
  prompt: string;
  acceptedAnswers: string[];
}
export interface LearningCycleSpec {
  language: Language;
  constructionId: string;
  goals: { form: string; meaning: string; use: string };
  notice: string;
  vary: ClosedCycleStep;
  produce: string;
  transfer: string;
  retain: ClosedCycleStep;
}

/** Authored practice material. These examples are neither an independent test
 * bank nor human-qualified content. Keep this corpus outside browser evaluators. */
export const LEARNING_CYCLES: readonly LearningCycleSpec[] = [
  {
    language: "en",
    constructionId: "en.c.001",
    goals: {
      form: "Match am, is and are to the subject.",
      meaning: "Describe who someone is or their present state.",
      use: "Introduce yourself and check that people are ready.",
    },
    notice:
      "Compare ‘I am a nurse’ and ‘I am tired’. Which describes a job and which describes a present state? Explain in your own words.",
    vary: {
      prompt:
        "At a station, two friends are late. Complete with am, is or are; write the full sentence: They ___ late for the train.",
      acceptedAnswers: [
        "They are late for the train.",
        "They’re late for the train.",
      ],
    },
    produce:
      "Write two short sentences introducing yourself to a new classmate. Include your name or role and how you feel today.",
    transfer:
      "A visitor is looking for the right room. Write a short welcome message explaining who you are, where the group is and whether everyone is ready to start.",
    retain: {
      prompt:
        "A colleague asks about Maya. Complete with am, is or are and write the full sentence: Maya ___ at the office.",
      acceptedAnswers: ["Maya is at the office."],
    },
  },
  {
    language: "en",
    constructionId: "en.c.015",
    goals: {
      form: "Build be + an -ing verb with subject agreement.",
      meaning: "Distinguish an activity happening now from a regular activity.",
      use: "Explain a temporary situation or what is happening at the moment.",
    },
    notice:
      "Compare ‘She works at home every Friday’ and ‘She is working at home today’. What does each tell you about the timing? Explain the difference.",
    vary: {
      prompt:
        "Use the present continuous of wait. Write the full sentence: The passengers ___ outside the terminal right now.",
      acceptedAnswers: [
        "The passengers are waiting outside the terminal right now.",
      ],
    },
    produce:
      "Write a message about two things happening around you now. Explain why one of them matters to you.",
    transfer:
      "You cannot join an online meeting yet because there is an interruption at home. Send the organiser a brief update about the situation and say what you will do next.",
    retain: {
      prompt:
        "Use the present continuous of repair. Write the full sentence: A mechanic ___ my bicycle at the moment.",
      acceptedAnswers: ["A mechanic is repairing my bicycle at the moment."],
    },
  },
  {
    language: "en",
    constructionId: "en.c.034",
    goals: {
      form: "Link a present-tense if-clause to will + a base verb.",
      meaning: "Connect a possible future condition to its consequence.",
      use: "Agree practical plans that depend on a future event.",
    },
    notice:
      "Compare ‘If the bus arrives soon, we will catch the train’ and ‘The bus always arrives at six’. Which proposes a future condition, and which reports a routine? Explain.",
    vary: {
      prompt:
        "Use will and move. Write the completed sentence: If the wind gets stronger, the team ___ the concert indoors.",
      acceptedAnswers: [
        "If the wind gets stronger, the team will move the concert indoors.",
      ],
    },
    produce:
      "Write a realistic plan for your coming weekend. Explain what you intend to do and how a possible change in circumstances would affect your plan.",
    transfer:
      "You are coordinating a school trip. A parent asks what will happen if the museum closes unexpectedly. Reply with a practical alternative and explain when you will confirm the arrangements.",
    retain: {
      prompt:
        "Use will and send. Write the full sentence: If the parcel arrives today, I ___ you a message.",
      acceptedAnswers: [
        "If the parcel arrives today, I will send you a message.",
      ],
    },
  },
  {
    language: "en",
    constructionId: "en.c.048",
    goals: {
      form: "Combine if + past perfect with would have + past participle.",
      meaning: "Imagine a past that did not happen and its unreal result.",
      use: "Reflect on missed opportunities without changing the facts.",
    },
    notice:
      "Compare ‘If I have time, I will help’ and ‘If I had had time, I would have helped’. Which leaves the help possible, and which looks back on an unreal past? Explain.",
    vary: {
      prompt:
        "Use would in a third conditional. Write the full sentence: If we had left earlier, we ___ the ferry. (catch)",
      acceptedAnswers: [
        "If we had left earlier, we would have caught the ferry.",
      ],
    },
    produce:
      "Describe a small past decision of your own and an alternative result you now imagine. Make clear what actually happened and what did not.",
    transfer:
      "A project review asks why a delivery failed. The address was corrected only after the driver left. Write a tactful explanation of how earlier information could have changed the outcome, then suggest a practical improvement.",
    retain: {
      prompt:
        "Use would in a third conditional. Write the full sentence: If I had seen the forecast, I ___ an umbrella. (bring)",
      acceptedAnswers: [
        "If I had seen the forecast, I would have brought an umbrella.",
      ],
    },
  },
  {
    language: "en",
    constructionId: "en.c.058",
    goals: {
      form: "Invert had and its subject in a past conditional without if.",
      meaning: "Preserve the unreal past condition when changing its form.",
      use: "Express a counterfactual in formal correspondence.",
    },
    notice:
      "Compare ‘If we had received notice, we would have attended’ and ‘Had we received notice, we would have attended’. Does the event history change? Explain the change in style and word order.",
    vary: {
      prompt:
        "Rewrite without if, beginning Had. Preserve the facts: If the organisers had informed us, we would have booked tickets.",
      acceptedAnswers: [
        "Had the organisers informed us, we would have booked tickets.",
      ],
    },
    produce:
      "Write a short formal reflection on a missed opportunity of your own. Give the actual outcome and describe how earlier knowledge might have changed it.",
    transfer:
      "Reply to a formal complaint about a cancelled appointment. You received no notice of the cancellation. Explain the consequence of that missing information and propose a remedy in a professional tone.",
    retain: {
      prompt:
        "Rewrite without if, beginning Had. Keep the meaning: If the technician had checked the cable, she would have found the fault.",
      acceptedAnswers: [
        "Had the technician checked the cable, she would have found the fault.",
      ],
    },
  },
  {
    language: "en",
    constructionId: "en.c.072",
    goals: {
      form: "Integrate concession and a relative clause without losing clause agreement.",
      meaning:
        "Keep the main claim distinct from a limitation and background detail.",
      use: "Present nuanced evidence to a critical reader.",
    },
    notice:
      "Read ‘Although the trial was short, its protocol, which was published in advance, reassured the panel’. Identify the limitation, the main claim and the background detail. Explain how the reader can keep them separate.",
    vary: {
      prompt:
        "Combine the statements using Although and a relative clause beginning which. Keep every fact: The pilot was brief. Its design was robust. Its design impressed the committee.",
      acceptedAnswers: [
        "Although the pilot was brief, its design, which was robust, impressed the committee.",
      ],
    },
    produce:
      "Write a short paragraph about evidence for a decision you care about. State a claim, acknowledge a limitation and add a relevant background detail without making the message hard to follow.",
    transfer:
      "A city council is considering an experimental transport scheme. Write a concise recommendation that weighs one reported benefit against a limitation of the evidence and explains what further information the council needs.",
    retain: {
      prompt:
        "Combine the statements using Although and a relative clause beginning which. Preserve every fact: The survey was local. Its sample was diverse. Its sample strengthened the analysis.",
      acceptedAnswers: [
        "Although the survey was local, its sample, which was diverse, strengthened the analysis.",
      ],
    },
  },
  {
    language: "de",
    constructionId: "de.c.001",
    goals: {
      form: "Die Form von sein an das Personalpronomen anpassen.",
      meaning: "Person, Ort und gegenwärtigen Zustand unterscheiden.",
      use: "Sich vorstellen und die Bereitschaft einer Gruppe mitteilen.",
    },
    notice:
      "Vergleiche: ‚Wir sind Studierende‘ und ‚Wir sind müde‘. Welcher Satz nennt eine Rolle und welcher einen Zustand? Erkläre den Unterschied mit eigenen Worten.",
    vary: {
      prompt:
        "Ergänze die passende Form von sein und schreibe den ganzen Satz: Ihr ___ im richtigen Raum.",
      acceptedAnswers: ["Ihr seid im richtigen Raum."],
    },
    produce:
      "Stelle dich einer neuen Lerngruppe in zwei kurzen Sätzen vor. Sage, wer du bist und wie es dir heute geht.",
    transfer:
      "Eine neue Kollegin sucht euer Team. Schreibe eine kurze Begrüßung: Wer seid ihr, wo seid ihr und ist die Gruppe bereit anzufangen?",
    retain: {
      prompt:
        "Ergänze die passende Form von sein und schreibe den ganzen Satz: Du ___ heute pünktlich.",
      acceptedAnswers: ["Du bist heute pünktlich."],
    },
  },
  {
    language: "de",
    constructionId: "de.c.015",
    goals: {
      form: "Haben mit dem Partizip II verbinden und die Satzklammer beachten.",
      meaning: "Eine abgeschlossene Tätigkeit in der Vergangenheit ausdrücken.",
      use: "Im Alltag berichten, was bereits erledigt wurde.",
    },
    notice:
      "Vergleiche: ‚Ich koche heute Suppe‘ und ‚Ich habe gestern Suppe gekocht‘. Welche Tätigkeit ist als vergangen dargestellt? Erkläre, welche Wörter das zeigen.",
    vary: {
      prompt:
        "Ergänze das Partizip II von kaufen und schreibe den ganzen Satz: Wir haben am Samstag Gemüse ___.",
      acceptedAnswers: ["Wir haben am Samstag Gemüse gekauft."],
    },
    produce:
      "Schreibe einer Freundin, was du gestern erledigt hast und was noch offen ist. Verwende eigene konkrete Tätigkeiten.",
    transfer:
      "Du übergibst eine Schicht im Café. Schreibe dem nächsten Team eine kurze Nachricht: Was ist schon erledigt, und was muss es noch tun?",
    retain: {
      prompt:
        "Ergänze das Partizip II von machen und schreibe den ganzen Satz: Lea hat vorhin ihre Hausaufgaben ___.",
      acceptedAnswers: ["Lea hat vorhin ihre Hausaufgaben gemacht."],
    },
  },
  {
    language: "de",
    constructionId: "de.c.033",
    goals: {
      form: "Würde nach dem Subjekt flektieren und mit einem Infinitiv verbinden.",
      meaning: "Einen Wunsch als vorgestellte Möglichkeit ausdrücken.",
      use: "Wünsche und unverbindliche Vorschläge höflich formulieren.",
    },
    notice:
      "Vergleiche: ‚Wir fahren am Freitag ans Meer‘ und ‚Wir würden gern ans Meer fahren‘. Welcher Satz stellt einen Plan als fest dar und welcher einen Wunsch? Erkläre.",
    vary: {
      prompt:
        "Formuliere denselben Wunsch mit würden und gern. Schreibe den ganzen Satz: Wir möchten gern ein Museum besuchen.",
      acceptedAnswers: ["Wir würden gern ein Museum besuchen."],
    },
    produce:
      "Schreibe zwei eigene Wünsche für eine freie Woche. Erkläre auch, was dir daran gefällt.",
    transfer:
      "Deine Gruppe plant einen gemeinsamen Ausflug, hat sich aber noch nicht entschieden. Schlage ein Ziel höflich vor und frage die anderen nach ihrer Meinung.",
    retain: {
      prompt:
        "Formuliere denselben Wunsch mit würde und gern. Schreibe den ganzen Satz: Lea möchte gern Klavier lernen.",
      acceptedAnswers: ["Lea würde gern Klavier lernen."],
    },
  },
  {
    language: "de",
    constructionId: "de.c.043",
    goals: {
      form: "Hätte oder wäre und Partizip II in irrealen Vergangenheitsbedingungen einsetzen.",
      meaning:
        "Tatsächlichen Verlauf und nicht eingetretene Alternative auseinanderhalten.",
      use: "Vergangene Entscheidungen und verpasste Möglichkeiten reflektieren.",
    },
    notice:
      "Vergleiche: ‚Wenn ich Zeit habe, komme ich mit‘ und ‚Wenn ich Zeit gehabt hätte, wäre ich mitgekommen‘. Bei welchem Satz ist das Mitkommen noch offen? Was sagt der andere über die Vergangenheit?",
    vary: {
      prompt:
        "Ergänze die passende Form von haben im Konjunktiv II der Vergangenheit. Schreibe den ganzen Satz: Wenn wir reserviert hätten, ___ wir einen Tisch bekommen.",
      acceptedAnswers: [
        "Wenn wir reserviert hätten, hätten wir einen Tisch bekommen.",
      ],
    },
    produce:
      "Beschreibe eine kleine verpasste Gelegenheit aus deinem Alltag. Trenne klar, was tatsächlich geschah und wie es unter anderen Umständen hätte ausgehen können.",
    transfer:
      "Eine Kollegin fragt, warum ihr eine Besprechung verpasst habt. Der Termin wurde euch zu spät mitgeteilt. Erkläre den möglichen anderen Verlauf sachlich und schlage eine Verbesserung für die nächste Einladung vor.",
    retain: {
      prompt:
        "Ergänze die passende Form von sein im Konjunktiv II der Vergangenheit. Schreibe den ganzen Satz: Wenn der Wecker geklingelt hätte, ___ ich früher aufgestanden.",
      acceptedAnswers: [
        "Wenn der Wecker geklingelt hätte, wäre ich früher aufgestanden.",
      ],
    },
  },
  {
    language: "de",
    constructionId: "de.c.057",
    goals: {
      form: "Die dritte Person im Konjunktiv I für die indirekte Rede bilden.",
      meaning:
        "Die Quelle einer Aussage von der eigenen Behauptung unterscheiden.",
      use: "Aussagen in einer sachlichen Zusammenfassung als fremde Angaben kennzeichnen.",
    },
    notice:
      "Vergleiche: ‚Die Firma ist zahlungsfähig‘ und ‚Die Sprecherin erklärt, die Firma sei zahlungsfähig‘. Wer verantwortet die Aussage jeweils? Erkläre, ohne aus der zweiten Aussage Wahrheit oder Unwahrheit abzuleiten.",
    vary: {
      prompt:
        "Gib Toms Aussage mit Konjunktiv I wieder. Beginne mit Tom erklärt, und verwende keinen dass-Satz: Tom erklärt: Ich habe heute Dienst.",
      acceptedAnswers: ["Tom erklärt, er habe heute Dienst."],
    },
    produce:
      "Fasse eine kurze Aussage zusammen, die dir jemand mitgeteilt hat. Mache deutlich, von wem sie stammt und dass du sie hier nur wiedergibst.",
    transfer:
      "Du schreibst ein neutrales Sitzungsprotokoll. Die Projektleiterin kündigt an, dass die Lieferung pünktlich ankommt; eine Bestätigung fehlt noch. Berichte ihre Ankündigung und benenne die offene Prüfung, ohne selbst die Pünktlichkeit zu garantieren.",
    retain: {
      prompt:
        "Gib Amirs Aussage mit Konjunktiv I wieder. Beginne mit Amir berichtet, und verwende keinen dass-Satz: Amir berichtet: Ich bin wieder gesund.",
      acceptedAnswers: ["Amir berichtet, er sei wieder gesund."],
    },
  },
  {
    language: "de",
    constructionId: "de.c.071",
    goals: {
      form: "Ein flektiertes Modalverb mit dem Infinitiv verbinden.",
      meaning: "Eine Möglichkeit von einer gesicherten Feststellung abgrenzen.",
      use: "Unsicherheit in differenzierten Empfehlungen sprachlich sichtbar machen.",
    },
    notice:
      "Vergleiche: ‚Die Änderung verursacht Verzögerungen‘ und ‚Die Änderung könnte Verzögerungen verursachen‘. Welcher Satz behauptet eine Folge und welcher hält sie für möglich? Erkläre die unterschiedliche Stärke der Aussage.",
    vary: {
      prompt:
        "Formuliere dieselbe Möglichkeit mit könnte, ohne sie als Tatsache auszugeben: Der Umbau führt möglicherweise zu Verzögerungen.",
      acceptedAnswers: ["Der Umbau könnte zu Verzögerungen führen."],
    },
    produce:
      "Formuliere eine vorsichtige eigene Prognose zu einer geplanten Veränderung. Benenne eine mögliche Folge und welche Information deine Einschätzung noch verändern würde.",
    transfer:
      "Ein Gemeinderat berät über längere Öffnungszeiten einer Bibliothek. Schreibe eine abgewogene Empfehlung: Welche Vorteile sind denkbar, was ist noch unsicher und welche Daten sollte der Rat vor der Entscheidung erheben?",
    retain: {
      prompt:
        "Formuliere dieselbe Möglichkeit mit könnte, ohne sie als Tatsache auszugeben: Das neue Verfahren spart möglicherweise Energie.",
      acceptedAnswers: ["Das neue Verfahren könnte Energie sparen."],
    },
  },
];
