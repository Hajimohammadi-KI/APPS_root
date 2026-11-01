import type { Language } from "./automaticity/contracts";

/** Content revision of 1 November 2026 (W33): authored replacements for closed
 * items whose key was a fragment, placeholder, rule label or note, so that a
 * complete, correct answer could not pass. Every replacement is authored text,
 * not a linguistic validator, CEFR calibration or independent content review. */
export const CONTENT_REVISION = "2026-11-01";
export const CONTENT_REVISION_VERSION = "2026-11-01.1";

export interface RevisedTask {
  readonly prompt: string;
  readonly answer: string;
  readonly alternatives?: readonly string[];
}
export interface UnitContentRevision {
  readonly language: Language;
  readonly constructionId: string;
  readonly title: string;
  /** Replaces the repair item whose prompt marked `old` as wrong. */
  readonly repair?: RevisedTask & {
    readonly old: string;
    readonly source: string;
    /** The source is acceptable language to reformulate, not an error. */
    readonly transformation?: boolean;
    /** The curriculum item was already replaced; only the Grammar Lab shows `old`. */
    readonly labOnly?: boolean;
  };
  /** Worked examples replacing fragments, placeholders and rule notes. */
  readonly examples?: readonly string[];
  /** Retrieval items that asked learners to complete a rule or note. */
  readonly retrieval?: readonly (RevisedTask & { readonly taskId: string })[];
}

/** The prompt with which the original curriculum and Grammar Lab marked `old` as wrong. */
export function retiredRepairPrompt(language: Language, old: string): string {
  return language === "en"
    ? `Correct the sentence: ${old}`
    : `Korrigiere die vorgegebene Form. Nicht richtig: ${old} Schreibe die vollständige richtige Antwort auf Deutsch.`;
}

const en = (
  constructionId: string,
  title: string,
  revision: Omit<UnitContentRevision, "language" | "constructionId" | "title">,
): UnitContentRevision => ({
  language: "en",
  constructionId,
  title,
  ...revision,
});
const de = (
  constructionId: string,
  title: string,
  revision: Omit<UnitContentRevision, "language" | "constructionId" | "title">,
): UnitContentRevision => ({
  language: "de",
  constructionId,
  title,
  ...revision,
});

export const UNIT_CONTENT_REVISIONS: readonly UnitContentRevision[] = [
  en("en.c.012", "Imperatives", {
    repair: {
      old: "You open the door.",
      source: "Don’t to touch the screen.",
      prompt:
        "Correct the negative instruction and write the full sentence: Don’t to touch the screen.",
      answer: "Don’t touch the screen.",
      alternatives: ["Do not touch the screen."],
    },
  }),
  en("en.c.013", "Prepositions of place", {
    repair: {
      old: "The keys are in the table.",
      source: "The keys are in the table.",
      prompt:
        "Correct the preposition and write the full sentence: The keys are in the table.",
      answer: "The keys are on the table.",
    },
  }),
  en("en.c.024", "Some/any/no", {
    repair: {
      old: "I don’t have some time.",
      source: "I don’t have some time.",
      prompt:
        "Correct the determiner and write the full sentence: I don’t have some time.",
      answer: "I don’t have any time.",
    },
  }),
  en("en.c.027", "Object pronouns", {
    repair: {
      old: "Please call I.",
      source: "Please call I.",
      prompt: "Correct the pronoun and write the full sentence: Please call I.",
      answer: "Please call me.",
    },
  }),
  en("en.c.029", "Present perfect", {
    repair: {
      old: "I live here since three years.",
      source: "I live here since three years.",
      prompt:
        "Correct the tense and the time word, then write the full sentence: I live here since three years.",
      answer: "I have lived here for three years.",
      alternatives: [
        "I’ve lived here for three years.",
        "I have been living here for three years.",
        "I’ve been living here for three years.",
      ],
    },
  }),
  en("en.c.032", "Past continuous", {
    repair: {
      old: "I studied when you called.",
      source: "I studied when you called.",
      prompt:
        "Correct the verb for the action in progress with the past continuous. Write the full sentence: I studied when you called.",
      answer: "I was studying when you called.",
    },
  }),
  en("en.c.033", "Past continuous vs past simple", {
    repair: {
      old: "The phone was ringing once.",
      source: "We were eating when the phone was ringing.",
      prompt:
        "Correct the verb for the short interrupting event with the past simple. Write the full sentence: We were eating when the phone was ringing.",
      answer: "We were eating when the phone rang.",
    },
  }),
  en("en.c.036", "Relative clauses", {
    repair: {
      old: "The woman which called",
      source: "The woman which called is my aunt.",
      prompt:
        "Correct the relative pronoun for a person and write the full sentence: The woman which called is my aunt.",
      answer: "The woman who called is my aunt.",
      alternatives: ["The woman that called is my aunt."],
    },
  }),
  en("en.c.037", "Gerunds and infinitives", {
    repair: {
      old: "I enjoy to read.",
      source: "I enjoy to read.",
      prompt:
        "Correct the verb pattern after enjoy and write the full sentence: I enjoy to read.",
      answer: "I enjoy reading.",
    },
  }),
  en("en.c.038", "Modal verbs of advice", {
    repair: {
      old: "You should to practise.",
      source: "You should to practise every day.",
      prompt:
        "Correct the verb after should and write the full sentence: You should to practise every day.",
      answer: "You should practise every day.",
      alternatives: ["You should practice every day."],
    },
  }),
  en("en.c.039", "Passive present and past", {
    repair: {
      old: "The bridge built in 1990.",
      source: "The bridge built in 1990.",
      prompt:
        "Correct the passive and write the full sentence: The bridge built in 1990.",
      answer: "The bridge was built in 1990.",
    },
  }),
  en("en.c.040", "Reported statements", {
    repair: {
      old: "She said she is tired yesterday.",
      source: "Yesterday she said that she is tired.",
      prompt:
        "Correct the reported verb by moving it one tense back. Write the full sentence: Yesterday she said that she is tired.",
      answer: "Yesterday she said that she was tired.",
    },
  }),
  en("en.c.041", "Question tags", {
    repair: {
      old: "You’re ready, isn’t it?",
      source: "You’re ready, isn’t it?",
      prompt:
        "Correct the question tag and write the full sentence: You’re ready, isn’t it?",
      answer: "You’re ready, aren’t you?",
      alternatives: ["You are ready, aren’t you?"],
    },
  }),
  en("en.c.043", "Present perfect continuous", {
    repair: {
      old: "I am working since eight.",
      source: "I am working since eight.",
      prompt:
        "Correct the tense with the present perfect continuous. Write the full sentence: I am working since eight.",
      answer: "I have been working since eight.",
      alternatives: ["I’ve been working since eight."],
    },
  }),
  en("en.c.044", "Past perfect", {
    repair: {
      old: "The train left before we had arrived.",
      source: "The train left before we had arrived.",
      prompt:
        "Correct the verbs so that only the earlier action is in the past perfect. Write the full sentence: The train left before we had arrived.",
      answer: "The train had left before we arrived.",
    },
  }),
  en("en.c.045", "Past perfect continuous", {
    repair: {
      old: "She was waiting for an hour before he came.",
      source: "She was waiting for an hour before he came.",
      prompt:
        "Correct the verb with the past perfect continuous to show the waiting before he came. Write the full sentence: She was waiting for an hour before he came.",
      answer: "She had been waiting for an hour before he came.",
      alternatives: ["She’d been waiting for an hour before he came."],
    },
  }),
  en("en.c.046", "Future continuous", {
    repair: {
      old: "I will travelling.",
      source: "This time tomorrow, I will travelling.",
      prompt:
        "Correct the future continuous and write the full sentence: This time tomorrow, I will travelling.",
      answer: "This time tomorrow, I will be travelling.",
      alternatives: [
        "This time tomorrow, I will be traveling.",
        "This time tomorrow, I’ll be travelling.",
        "This time tomorrow, I’ll be traveling.",
      ],
    },
  }),
  en("en.c.047", "Future perfect", {
    repair: {
      old: "By Friday, I will finish already.",
      source: "By Friday, I finish the report.",
      prompt:
        "Correct the verb with the future perfect for completion before Friday. Write the full sentence: By Friday, I finish the report.",
      answer: "By Friday, I will have finished the report.",
      alternatives: ["By Friday, I’ll have finished the report."],
    },
  }),
  en("en.c.048", "Third conditional", {
    repair: {
      old: "If I studied, I would have passed.",
      source: "If I studied, I would have passed.",
      prompt:
        "Correct the if-clause of this unreal past condition. Write the full sentence: If I studied, I would have passed.",
      answer: "If I had studied, I would have passed.",
      alternatives: ["If I’d studied, I would have passed."],
    },
  }),
  en("en.c.050", "Modal deduction present", {
    repair: {
      old: "She must to be busy.",
      source: "She must to be busy.",
      prompt:
        "Correct the verb after must and write the full sentence: She must to be busy.",
      answer: "She must be busy.",
    },
  }),
  en("en.c.051", "Modal deduction past", {
    repair: {
      old: "They must forgot.",
      source: "They must forgot.",
      prompt:
        "Correct the past deduction with must have and write the full sentence: They must forgot.",
      answer: "They must have forgotten.",
    },
  }),
  en("en.c.052", "Causative have/get", {
    repair: {
      old: "I repaired my laptop by technician.",
      source: "I repaired my laptop yesterday.",
      transformation: true,
      prompt:
        "Change the sentence because a technician did the work: use have + object + past participle. Write the full sentence: I repaired my laptop yesterday.",
      answer: "I had my laptop repaired yesterday.",
    },
  }),
  en("en.c.053", "Advanced passive", {
    repair: {
      old: "He believes to be abroad.",
      source: "He believes to be abroad.",
      prompt:
        "Correct the sentence with a passive reporting structure: He believes to be abroad.",
      answer: "He is believed to be abroad.",
    },
  }),
  en("en.c.054", "Participle clauses", {
    repair: {
      old: "Finished the report, she left.",
      source: "Finished the report, she left.",
      prompt:
        "Correct the participle clause so that it shows the earlier action. Write the full sentence: Finished the report, she left.",
      answer: "Having finished the report, she left.",
    },
  }),
  en("en.c.059", "Nominalisation", {
    repair: {
      old: "The decide of the committee",
      source: "The decide of the committee surprised everyone.",
      prompt:
        "Correct the noun form and write the full sentence: The decide of the committee surprised everyone.",
      answer: "The decision of the committee surprised everyone.",
      alternatives: ["The committee’s decision surprised everyone."],
    },
    examples: [
      "The committee’s decision surprised everyone.",
      "The analysis of the data took a week.",
    ],
  }),
  en("en.c.060", "Hedging and stance", {
    repair: {
      old: "The results prove absolutely",
      source: "The results absolutely prove the hypothesis.",
      transformation: true,
      prompt:
        "Change the claim to a hedged one with appear to support. Write the full sentence: The results absolutely prove the hypothesis.",
      answer: "The results appear to support the hypothesis.",
    },
  }),
  en("en.c.061", "Advanced discourse markers", {
    repair: {
      old: "On the other hand used without contrast.",
      source:
        "The findings are promising. On the other hand, they confirm earlier studies.",
      prompt:
        "Correct the discourse marker: the second sentence adds a point and does not contrast. Write both sentences: The findings are promising. On the other hand, they confirm earlier studies.",
      answer:
        "The findings are promising. Moreover, they confirm earlier studies.",
      alternatives: [
        "The findings are promising. Furthermore, they confirm earlier studies.",
        "The findings are promising. In addition, they confirm earlier studies.",
        "The findings are promising. Additionally, they confirm earlier studies.",
        "The findings are promising. What is more, they confirm earlier studies.",
      ],
    },
  }),
  en("en.c.062", "Substitution and ellipsis", {
    repair: {
      old: "She did it call.",
      source: "I expected her to call, and she did it call.",
      prompt:
        "Correct the ending by leaving out the repeated words after did. Write the full sentence: I expected her to call, and she did it call.",
      answer: "I expected her to call, and she did.",
    },
  }),
  en("en.c.063", "Complex relative clauses", {
    repair: {
      old: "The method which we relied on it",
      source: "This is the method which we relied on it.",
      prompt:
        "Correct the relative clause: remove the extra pronoun and put on before which. Write the full sentence: This is the method which we relied on it.",
      answer: "This is the method on which we relied.",
    },
  }),
  en("en.c.064", "Advanced reporting verbs", {
    repair: {
      old: "He admitted to make",
      source: "He admitted to make the mistake.",
      prompt:
        "Correct the verb pattern after admitted and write the full sentence: He admitted to make the mistake.",
      answer: "He admitted making the mistake.",
      alternatives: [
        "He admitted to making the mistake.",
        "He admitted having made the mistake.",
      ],
    },
  }),
  en("en.c.065", "Emphasis with auxiliaries", {
    repair: {
      old: "I am understand.",
      source: "I am understand your concern.",
      prompt:
        "Correct the sentence and add emphasis with do: I am understand your concern.",
      answer: "I do understand your concern.",
    },
  }),
  en("en.c.066", "Fronting", {
    repair: {
      old: "This issue we must to address.",
      source: "This issue we must to address.",
      prompt:
        "Correct the verb after must and keep the fronted object. Write the full sentence: This issue we must to address.",
      answer: "This issue we must address.",
      alternatives: ["This issue, we must address."],
    },
  }),
  en("en.c.067", "Complex noun phrases", {
    repair: {
      old: "a study carefully design",
      source: "They published a study carefully design.",
      prompt:
        "Correct the noun phrase and write the full sentence: They published a study carefully design.",
      answer: "They published a carefully designed study.",
    },
  }),
  en("en.c.068", "Register control", {
    repair: {
      old: "Using slang in a formal report.",
      source: "What do you mean by the requirement?",
      transformation: true,
      prompt:
        "Change this informal question for a formal meeting, using Could you clarify. Write the full question: What do you mean by the requirement?",
      answer: "Could you clarify the requirement?",
      alternatives: ["Could you clarify what you mean by the requirement?"],
    },
    examples: [
      "Could you clarify the requirement?",
      "Would you mind explaining the deadline?",
    ],
  }),
  en("en.c.069", "Advanced tense-aspect choices", {
    repair: {
      old: "Switching time frames without purpose.",
      source: "In 2019, the study has demonstrated a clear effect.",
      prompt:
        "Correct the tense for a finished past time and write the full sentence: In 2019, the study has demonstrated a clear effect.",
      answer: "In 2019, the study demonstrated a clear effect.",
    },
    examples: [
      "The study has demonstrated a clear effect.",
      "In 2019, the study demonstrated a clear effect.",
    ],
  }),
  en("en.c.070", "Parallelism", {
    repair: {
      old: "planning, to analyse, and reports",
      source: "The role requires planning, to analyse, and reports.",
      prompt:
        "Correct the list so that all three items have the same form. Write the full sentence: The role requires planning, to analyse, and reports.",
      answer: "The role requires planning, analysing, and reporting.",
      alternatives: [
        "The role requires planning, analysing and reporting.",
        "The role requires planning, analyzing, and reporting.",
        "The role requires planning, analyzing and reporting.",
      ],
    },
  }),
  en("en.c.073", "Nuanced modality", {
    repair: {
      old: "Confusing unnecessary completed action with absence of obligation.",
      source: "I needn’t have taken an umbrella, so I didn’t take one.",
      prompt:
        "Correct the modal, because no umbrella was taken. Write the full sentence: I needn’t have taken an umbrella, so I didn’t take one.",
      answer: "I didn’t need to take an umbrella, so I didn’t take one.",
    },
  }),
  en("en.c.074", "Counterfactual distance", {
    repair: {
      old: "I wonder if you can help in very formal context.",
      source: "I wonder if you can help.",
      transformation: true,
      prompt:
        "Change this request for a very formal letter, using the past tense of wonder and might be able to: I wonder if you can help.",
      answer: "I wondered if you might be able to help.",
      alternatives: ["I was wondering if you might be able to help."],
    },
  }),
  en("en.c.075", "Advanced cohesion", {
    repair: {
      old: "Unclear pronoun reference.",
      source:
        "The sample was small and the response rate was low. This weakens the conclusions.",
      prompt:
        "Correct the vague reference by replacing This with These limitations. Write both sentences: The sample was small and the response rate was low. This weakens the conclusions.",
      answer:
        "The sample was small and the response rate was low. These limitations weaken the conclusions.",
    },
    examples: [
      "The sample was small. This limitation weakens the conclusions.",
      "The response rate was low. Such a constraint affects every estimate.",
      "Some data were missing. The issue was reported to the authors.",
    ],
  }),
  en("en.c.076", "Rhetorical grammar", {
    repair: {
      old: "Unbalanced rhetorical structure.",
      source: "Not because the method failed, but the data were incomplete.",
      prompt:
        "Correct the contrast so that both parts are parallel. Write the full sentence: Not because the method failed, but the data were incomplete.",
      answer:
        "Not because the method failed, but because the data were incomplete.",
    },
  }),
  en("en.c.077", "Compressed academic structures", {
    repair: {
      old: "Overcompression that hides the agent.",
      source:
        "The model, trained on multilingual data, it performed consistently.",
      prompt:
        "Correct the sentence by removing the repeated subject: The model, trained on multilingual data, it performed consistently.",
      answer:
        "The model, trained on multilingual data, performed consistently.",
    },
  }),
  en("en.c.078", "Idiomatic clause patterns", {
    repair: {
      old: "Literal translation of idiomatic structures.",
      source: "Be it as it may, the proposal deserves consideration.",
      prompt:
        "Correct the fixed expression and write the full sentence: Be it as it may, the proposal deserves consideration.",
      answer: "Be that as it may, the proposal deserves consideration.",
    },
  }),
  en("en.c.079", "Ambiguity control", {
    repair: {
      old: "Unclear who approved what.",
      source:
        "She discussed the result with the supervisor, and she approved it.",
      prompt:
        "Correct the ambiguity so that the supervisor clearly approved the result. Write the full sentence: She discussed the result with the supervisor, and she approved it.",
      answer: "She discussed the result with the supervisor, who approved it.",
      alternatives: [
        "She discussed the result with the supervisor who approved it.",
      ],
    },
  }),
  en("en.c.080", "Style shifting", {
    repair: {
      old: "Same register in every context.",
      source: "I found out that the policy had failed.",
      transformation: true,
      prompt:
        "Change this sentence for an academic report, beginning with The analysis revealed. Write the full sentence: I found out that the policy had failed.",
      answer: "The analysis revealed that the policy had failed.",
    },
    examples: [
      "I found out that the policy had failed.",
      "The analysis revealed that the policy had failed.",
    ],
  }),
  en("en.c.081", "Advanced punctuation and grammar", {
    repair: {
      old: "Comma splices and uncontrolled semicolons.",
      source: "The result was promising, however it was inconclusive.",
      prompt:
        "Correct the comma splice before however and write the full sentence: The result was promising, however it was inconclusive.",
      answer: "The result was promising; however, it was inconclusive.",
      alternatives: ["The result was promising. However, it was inconclusive."],
    },
  }),
  en("en.c.082", "Editing for naturalness", {
    repair: {
      old: "Formally correct but non-idiomatic collocations.",
      source: "I strongly recommend you to revise the budget.",
      prompt:
        "Correct the verb pattern after recommend with a that-clause. Write the full sentence: I strongly recommend you to revise the budget.",
      answer: "I strongly recommend that you revise the budget.",
      alternatives: ["I strongly recommend that you should revise the budget."],
    },
    examples: [
      "I strongly recommend that you revise the budget.",
      "We strongly recommend reviewing the figures.",
    ],
  }),
  en("en.c.083", "Genre-specific grammar", {
    repair: {
      old: "Mixing narrative and report conventions.",
      source:
        "The report outlined the problem, evaluates two options, and recommends a solution.",
      prompt:
        "Correct the tense so that the report is described consistently in the present. Write the full sentence: The report outlined the problem, evaluates two options, and recommends a solution.",
      answer:
        "The report outlines the problem, evaluates two options, and recommends a solution.",
      alternatives: [
        "The report outlines the problem, evaluates two options and recommends a solution.",
      ],
    },
    examples: [
      "The report outlines the problem, evaluates two options, and recommends a solution.",
      "The proposal explains the need and sets out a clear timetable.",
    ],
  }),
  en("en.c.084", "Integrated automatic production", {
    repair: {
      old: "Accuracy collapses when speed increases.",
      source: "Yesterday the team finish the analysis and sended the report.",
      prompt:
        "Correct both verb forms and write the full sentence: Yesterday the team finish the analysis and sended the report.",
      answer: "Yesterday the team finished the analysis and sent the report.",
    },
  }),
  en("en.c.095", "Past ability: could, was able to, managed to", {
    repair: {
      old: "Yesterday I could fix the computer after three hours.",
      source: "Yesterday I could fix the computer after three hours.",
      prompt:
        "Correct the verb for one successful action and write the full sentence: Yesterday I could fix the computer after three hours.",
      answer: "Yesterday I managed to fix the computer after three hours.",
      alternatives: [
        "Yesterday I was able to fix the computer after three hours.",
      ],
    },
  }),
  en("en.c.097", "Phrasal verbs", {
    repair: {
      old: "Please fill the form in it.",
      source: "Please fill the form in it.",
      prompt:
        "Correct the phrasal verb and write the full sentence: Please fill the form in it.",
      answer: "Please fill in the form.",
      alternatives: ["Please fill the form in."],
    },
  }),

  de("de.c.013", "Trennbare Verben", {
    repair: {
      old: "Ich aufstehe um sieben.",
      source: "Ich aufstehe um sieben Uhr.",
      prompt:
        "Korrigiere die Stellung des trennbaren Verbs und schreibe den ganzen Satz: Ich aufstehe um sieben Uhr.",
      answer: "Ich stehe um sieben Uhr auf.",
    },
  }),
  de("de.c.014", "lokale Präpositionen", {
    repair: {
      old: "Das Buch liegt auf den Tisch.",
      source: "Das Buch liegt auf den Tisch.",
      prompt:
        "Korrigiere den Artikel nach auf und schreibe den ganzen Satz: Das Buch liegt auf den Tisch.",
      answer: "Das Buch liegt auf dem Tisch.",
    },
  }),
  de("de.c.019", "Wechselpräpositionen", {
    repair: {
      old: "Ich gehe in der Schule.",
      source: "Ich gehe in der Schule.",
      prompt:
        "Gefragt ist wohin. Korrigiere den Kasus nach in und schreibe den ganzen Satz: Ich gehe in der Schule.",
      answer: "Ich gehe in die Schule.",
    },
  }),
  de("de.c.021", "Komparativ und Superlativ", {
    repair: {
      old: "mehr besser.",
      source: "Deutsch ist mehr leicht als gedacht.",
      prompt:
        "Korrigiere die Komparativform und schreibe den ganzen Satz: Deutsch ist mehr leicht als gedacht.",
      answer: "Deutsch ist leichter als gedacht.",
    },
  }),
  de("de.c.028", "Indefinitpronomen man/jemand/niemand", {
    repair: {
      old: "In Deutschland sie trinken viel Kaffee.",
      source: "In Deutschland trinken man viel Kaffee.",
      prompt:
        "Korrigiere die Verbform zu man und schreibe den ganzen Satz: In Deutschland trinken man viel Kaffee.",
      answer: "In Deutschland trinkt man viel Kaffee.",
    },
  }),
  de("de.c.029", "Präteritum in Erzählungen", {
    repair: {
      old: "Er hat die Tür geöffnet und ging (unklarer Wechsel).",
      source: "Er hat die Tür geöffnet und ging hinaus.",
      transformation: true,
      prompt:
        "Erzähle durchgehend im Präteritum und ändere den ersten Teil. Schreibe den ganzen Satz: Er hat die Tür geöffnet und ging hinaus.",
      answer: "Er öffnete die Tür und ging hinaus.",
    },
  }),
  de("de.c.032", "Relativsätze Dativ", {
    repair: {
      old: "mit die ich spreche.",
      source: "Die Frau, mit die ich spreche, ist Ärztin.",
      prompt:
        "Korrigiere das Relativpronomen nach mit und schreibe den ganzen Satz: Die Frau, mit die ich spreche, ist Ärztin.",
      answer: "Die Frau, mit der ich spreche, ist Ärztin.",
    },
  }),
  de("de.c.034", "Konjunktiv II von sein/haben/Modalverben", {
    repair: {
      old: "Wenn ich Zeit haben würde.",
      source: "Wenn ich Zeit haben würde, könnte ich kommen.",
      transformation: true,
      prompt:
        "Verwende im wenn-Satz die Konjunktiv-II-Form von haben und schreibe den ganzen Satz: Wenn ich Zeit haben würde, könnte ich kommen.",
      answer: "Wenn ich Zeit hätte, könnte ich kommen.",
    },
  }),
  de("de.c.036", "Passiv Präteritum und Perfekt", {
    repair: {
      old: "Es ist gebaut geworden.",
      source: "Das Haus ist 1990 gebaut geworden.",
      prompt:
        "Korrigiere das Passiv im Perfekt und schreibe den ganzen Satz: Das Haus ist 1990 gebaut geworden.",
      answer: "Das Haus ist 1990 gebaut worden.",
    },
  }),
  de("de.c.038", "um...zu / damit", {
    repair: {
      old: "damit zu verstehen.",
      source: "Ich spreche langsam, damit mich zu verstehen.",
      prompt:
        "Das Subjekt wechselt zu du. Korrigiere den damit-Satz und schreibe den ganzen Satz: Ich spreche langsam, damit mich zu verstehen.",
      answer: "Ich spreche langsam, damit du mich verstehst.",
    },
  }),
  de("de.c.040", "Genitivgrundlagen", {
    repair: {
      old: "wegen dem Wetter (umgangssprachlich).",
      source: "Wegen dem Wetter fällt das Spiel aus.",
      prompt:
        "Verwende in formeller Standardsprache den Genitiv nach wegen und schreibe den ganzen Satz: Wegen dem Wetter fällt das Spiel aus.",
      answer: "Wegen des Wetters fällt das Spiel aus.",
    },
  }),
  de("de.c.042", "indirekte Fragen", {
    repair: {
      old: "wann beginnt der Kurs? im Nebensatz.",
      source: "Ich weiß nicht, wann beginnt der Kurs.",
      prompt:
        "Korrigiere die Wortstellung in der indirekten Frage und schreibe den ganzen Satz: Ich weiß nicht, wann beginnt der Kurs.",
      answer: "Ich weiß nicht, wann der Kurs beginnt.",
    },
  }),
  de("de.c.043", "Konjunktiv II Vergangenheit", {
    repair: {
      old: "Wenn ich mehr gelernt würde haben.",
      source: "Wenn ich mehr gelernt würde haben, hätte ich bestanden.",
      prompt:
        "Korrigiere den wenn-Satz im Konjunktiv II der Vergangenheit und schreibe den ganzen Satz: Wenn ich mehr gelernt würde haben, hätte ich bestanden.",
      answer: "Wenn ich mehr gelernt hätte, hätte ich bestanden.",
    },
  }),
  de("de.c.044", "Passiv mit Modalverben", {
    repair: {
      old: "muss geschrieben sein (andere Bedeutung).",
      source: "Der Bericht muss heute geschrieben sein.",
      transformation: true,
      prompt:
        "Gemeint ist der Vorgang, nicht der Zustand. Ändere das Passiv und schreibe den ganzen Satz: Der Bericht muss heute geschrieben sein.",
      answer: "Der Bericht muss heute geschrieben werden.",
    },
  }),
  de("de.c.045", "Zustandspassiv", {
    repair: {
      old: "Die Tür wird geschlossen (Vorgang) vs ist geschlossen (Zustand).",
      source: "Die Tür wird schon seit einer Stunde geschlossen.",
      prompt:
        "Gemeint ist der Zustand. Korrigiere das Passiv und schreibe den ganzen Satz: Die Tür wird schon seit einer Stunde geschlossen.",
      answer: "Die Tür ist schon seit einer Stunde geschlossen.",
    },
  }),
  de("de.c.046", "Nominalisierung", {
    repair: {
      old: "das Durchführen von die Studie.",
      source: "Das Durchführen von die Studie dauert ein Jahr.",
      prompt:
        "Bilde eine Nominalisierung mit -ung und Genitiv und schreibe den ganzen Satz: Das Durchführen von die Studie dauert ein Jahr.",
      answer: "Die Durchführung der Studie dauert ein Jahr.",
    },
  }),
  de("de.c.047", "N-Deklination", {
    repair: {
      old: "mit dem Student.",
      source: "Ich spreche mit dem Student.",
      prompt:
        "Korrigiere die Endung des Nomens und schreibe den ganzen Satz: Ich spreche mit dem Student.",
      answer: "Ich spreche mit dem Studenten.",
    },
  }),
  de("de.c.048", "Partizipien als Adjektive", {
    repair: {
      old: "die warten Gäste.",
      source: "Die warten Gäste sitzen im Foyer.",
      prompt:
        "Bilde das Partizip I als Attribut und schreibe den ganzen Satz: Die warten Gäste sitzen im Foyer.",
      answer: "Die wartenden Gäste sitzen im Foyer.",
    },
  }),
  de("de.c.049", "je...desto/umso", {
    repair: {
      old: "Je mehr ich übe, ich spreche sicherer.",
      source: "Je mehr ich übe, ich spreche sicherer.",
      prompt:
        "Korrigiere den zweiten Teil der je-desto-Konstruktion und schreibe den ganzen Satz: Je mehr ich übe, ich spreche sicherer.",
      answer: "Je mehr ich übe, desto sicherer spreche ich.",
      alternatives: ["Je mehr ich übe, umso sicherer spreche ich."],
    },
  }),
  de("de.c.050", "sowohl...als auch / weder...noch", {
    repair: {
      old: "sowohl Deutsch und Englisch.",
      source: "Sie spricht sowohl Deutsch und Englisch.",
      prompt:
        "Korrigiere den zweiteiligen Konnektor und schreibe den ganzen Satz: Sie spricht sowohl Deutsch und Englisch.",
      answer: "Sie spricht sowohl Deutsch als auch Englisch.",
    },
  }),
  de("de.c.053", "indirekte Rede Grundlagen", {
    repair: {
      old: "Er sagt, er ist krank (neutral, weniger distanziert).",
      source: "Er sagt, er ist krank.",
      transformation: true,
      prompt:
        "Gib die Aussage distanziert mit Konjunktiv I wieder und schreibe den ganzen Satz: Er sagt, er ist krank.",
      answer: "Er sagt, er sei krank.",
    },
  }),
  de("de.c.054", "Nomen-Verb-Verbindungen / Funktionsverbgefüge", {
    repair: {
      old: "eine Entscheidung machen.",
      source: "Wir müssen heute eine Entscheidung machen.",
      prompt:
        "Korrigiere das Verb der festen Verbindung und schreibe den ganzen Satz: Wir müssen heute eine Entscheidung machen.",
      answer: "Wir müssen heute eine Entscheidung treffen.",
    },
  }),
  de("de.c.055", "Wortstellung im Mittelfeld", {
    repair: {
      old: "Ich habe ihm es.",
      source: "Ich habe ihm es gestern gegeben.",
      prompt:
        "Korrigiere die Reihenfolge der Pronomen und schreibe den ganzen Satz: Ich habe ihm es gestern gegeben.",
      answer: "Ich habe es ihm gestern gegeben.",
    },
  }),
  de("de.c.056", "Konnektoren und Satzverknüpfung", {
    repair: {
      old: "dennoch ohne echten Gegensatz.",
      source: "Die Daten sind begrenzt; deshalb ist der Trend klar.",
      prompt:
        "Hier besteht ein Gegensatz. Korrigiere den Konnektor und schreibe den ganzen Satz: Die Daten sind begrenzt; deshalb ist der Trend klar.",
      answer: "Die Daten sind begrenzt; dennoch ist der Trend klar.",
      alternatives: ["Die Daten sind begrenzt; trotzdem ist der Trend klar."],
    },
  }),
  de("de.c.057", "Konjunktiv I vollständig", {
    repair: {
      old: "sie wären vorläufig ohne Kontext.",
      source: "Die Autorin erklärt, die Ergebnisse wären vorläufig.",
      transformation: true,
      prompt:
        "Verwende in der indirekten Rede den Konjunktiv I und schreibe den ganzen Satz: Die Autorin erklärt, die Ergebnisse wären vorläufig.",
      answer: "Die Autorin erklärt, die Ergebnisse seien vorläufig.",
    },
  }),
  de("de.c.058", "Subjektive Bedeutung der Modalverben", {
    repair: {
      old: "Er soll kommen = Auftrag vs soll erfahren sein = Behauptung.",
      source: "Man sagt, er ist sehr erfahren.",
      transformation: true,
      prompt:
        "Gib die Behauptung anderer mit sollen wieder und schreibe den ganzen Satz: Man sagt, er ist sehr erfahren.",
      answer: "Er soll sehr erfahren sein.",
    },
  }),
  de("de.c.059", "Ersatzformen des Passivs", {
    repair: {
      old: "Das Problem lässt lösen.",
      source: "Das Problem lässt lösen.",
      prompt:
        "Korrigiere die Ersatzform des Passivs mit lassen und schreibe den ganzen Satz: Das Problem lässt lösen.",
      answer: "Das Problem lässt sich lösen.",
    },
  }),
  de("de.c.060", "Komplexe Nominalgruppen", {
    repair: {
      old: "die erhobenen im Rahmen Daten.",
      source: "Wir analysieren die erhobenen im Rahmen der Studie Daten.",
      prompt:
        "Korrigiere die Stellung des Attributs und schreibe den ganzen Satz: Wir analysieren die erhobenen im Rahmen der Studie Daten.",
      answer: "Wir analysieren die im Rahmen der Studie erhobenen Daten.",
    },
  }),
  de("de.c.061", "Partizipialkonstruktionen", {
    repair: {
      old: "Ausgehend von die Ergebnisse schlagen wir eine neue Untersuchung vor.",
      source:
        "Ausgehend von die Ergebnisse schlagen wir eine neue Untersuchung vor.",
      prompt:
        "Korrigiere den Kasus nach von und schreibe den ganzen Satz: Ausgehend von die Ergebnisse schlagen wir eine neue Untersuchung vor.",
      answer:
        "Ausgehend von den Ergebnissen schlagen wir eine neue Untersuchung vor.",
      alternatives: [
        "Ausgehend von den Ergebnissen, schlagen wir eine neue Untersuchung vor.",
        "Von den Ergebnissen ausgehend schlagen wir eine neue Untersuchung vor.",
        "Von den Ergebnissen ausgehend, schlagen wir eine neue Untersuchung vor.",
      ],
    },
  }),
  de("de.c.062", "Appositionen", {
    repair: {
      old: "Kasusfehler in der Apposition.",
      source: "Ich spreche mit Frau Müller, die Projektleiterin.",
      prompt:
        "Korrigiere den Kasus der Apposition und schreibe den ganzen Satz: Ich spreche mit Frau Müller, die Projektleiterin.",
      answer: "Ich spreche mit Frau Müller, der Projektleiterin.",
    },
  }),
  de("de.c.063", "Informationsstruktur und Vorfeld", {
    repair: {
      old: "Besonders wichtig die Wiederholung ist.",
      source: "Besonders wichtig die regelmäßige Wiederholung ist.",
      prompt:
        "Korrigiere die Verbstellung und schreibe den ganzen Satz: Besonders wichtig die regelmäßige Wiederholung ist.",
      answer: "Besonders wichtig ist die regelmäßige Wiederholung.",
    },
  }),
  de("de.c.064", "Ausklammerung und Nachfeld", {
    repair: {
      old: "Unkontrollierte Ausklammerung mit unklarer Bindung.",
      source: "Es hat sich, dass regelmäßiger Abruf entscheidend ist, gezeigt.",
      prompt:
        "Stelle den dass-Satz ins Nachfeld und schreibe den ganzen Satz: Es hat sich, dass regelmäßiger Abruf entscheidend ist, gezeigt.",
      answer: "Es hat sich gezeigt, dass regelmäßiger Abruf entscheidend ist.",
    },
  }),
  de("de.c.065", "Konzessive und adversative Strukturen", {
    repair: {
      old: "während ohne zeitliche/adversative Klarheit.",
      source: "Weil die Stichprobe klein ist, sind die Ergebnisse relevant.",
      prompt:
        "Hier liegt ein Gegensatz vor. Ersetze weil durch einen konzessiven Konnektor und schreibe den ganzen Satz: Weil die Stichprobe klein ist, sind die Ergebnisse relevant.",
      answer: "Obwohl die Stichprobe klein ist, sind die Ergebnisse relevant.",
      alternatives: [
        "Wenngleich die Stichprobe klein ist, sind die Ergebnisse relevant.",
        "Obgleich die Stichprobe klein ist, sind die Ergebnisse relevant.",
        "Auch wenn die Stichprobe klein ist, sind die Ergebnisse relevant.",
      ],
    },
  }),
  de("de.c.066", "Wissenschaftliches Hedging", {
    repair: {
      old: "Die Daten beweisen endgültig, dass die Methode immer funktioniert.",
      source:
        "Die Daten beweisen endgültig, dass die Methode immer funktioniert.",
      transformation: true,
      prompt:
        "Schwäche die Aussage ab: Ersetze beweisen endgültig durch legen nahe und immer durch unter diesen Bedingungen. Schreibe den ganzen Satz: Die Daten beweisen endgültig, dass die Methode immer funktioniert.",
      answer:
        "Die Daten legen nahe, dass die Methode unter diesen Bedingungen funktioniert.",
    },
  }),
  de("de.c.067", "Textkohäsion", {
    repair: {
      old: "Die Stichprobe ist klein. Sie mindert sie.",
      source: "Die Stichprobe ist klein. Sie mindert sie.",
      prompt:
        "Ersetze die unklaren Pronomen im zweiten Satz durch Diese Einschränkung und die Aussagekraft. Schreibe beide Sätze: Die Stichprobe ist klein. Sie mindert sie.",
      answer:
        "Die Stichprobe ist klein. Diese Einschränkung mindert die Aussagekraft.",
    },
  }),
  de("de.c.068", "Register und Stil", {
    repair: {
      old: "Na, was heißt das? im formellen Gespräch.",
      source: "Na, was heißt das?",
      transformation: true,
      prompt:
        "Formuliere die Frage für ein formelles Gespräch mit Könnten Sie das näher erläutern. Schreibe die ganze Frage: Na, was heißt das?",
      answer: "Könnten Sie das näher erläutern?",
      alternatives: ["Könnten Sie dies näher erläutern?"],
    },
  }),
  de("de.c.069", "Verbalisierung und Nominalisierung abwägen", {
    repair: {
      old: "Übernominalisierung macht Texte schwer.",
      source: "Die Analyse der Daten erfolgte durch uns.",
      transformation: true,
      labOnly: true,
      prompt:
        "Formuliere den nominalen Satz verbal im Präteritum mit wir und schreibe den ganzen Satz: Die Analyse der Daten erfolgte durch uns.",
      answer: "Wir analysierten die Daten.",
    },
  }),
  de("de.c.070", "Parallelismus", {
    repair: {
      old: "planen, Durchführung und ausgewertet.",
      source: "Wir wollen die Studie planen, Durchführung und ausgewertet.",
      prompt:
        "Bilde parallele Infinitive und schreibe den ganzen Satz: Wir wollen die Studie planen, Durchführung und ausgewertet.",
      answer: "Wir wollen die Studie planen, durchführen und auswerten.",
    },
  }),
  de("de.c.072", "Markierte Wortstellung", {
    repair: {
      old: "Markierung ohne kommunikativen Zweck.",
      source: "Dieses Ergebnis, das muss betont werden ist vorläufig.",
      prompt:
        "Schließe die Parenthese mit dem fehlenden Komma und schreibe den ganzen Satz: Dieses Ergebnis, das muss betont werden ist vorläufig.",
      answer: "Dieses Ergebnis, das muss betont werden, ist vorläufig.",
    },
  }),
  de("de.c.073", "Komplexe Einbettung", {
    repair: {
      old: "Obwohl die Studie klein war, weil die Methode transparent war, was die Replikation erleichterte.",
      source:
        "Obwohl die Studie klein war, überzeugte ihre Methode, weil sie war transparent dokumentiert.",
      prompt:
        "Korrigiere die Verbstellung im weil-Satz und schreibe den ganzen Satz: Obwohl die Studie klein war, überzeugte ihre Methode, weil sie war transparent dokumentiert.",
      answer:
        "Obwohl die Studie klein war, überzeugte ihre Methode, weil sie transparent dokumentiert war.",
    },
  }),
  de("de.c.074", "Ellipsen und Substitution", {
    repair: {
      old: "Ellipse ohne rekonstruierbares Element.",
      source: "Einige stimmten zu, andere stimmten nicht zu.",
      transformation: true,
      prompt:
        "Vermeide die Wiederholung im zweiten Teil durch eine Ellipse und schreibe den ganzen Satz: Einige stimmten zu, andere stimmten nicht zu.",
      answer: "Einige stimmten zu, andere nicht.",
    },
  }),
  de("de.c.075", "Rhetorische Syntax", {
    repair: {
      old: "unbalancierte nicht-sondern-Struktur.",
      source: "Nicht die Menge, sondern die Qualität sind entscheidend.",
      prompt:
        "Korrigiere die Verbform, die sich nach dem Teil nach sondern richtet, und schreibe den ganzen Satz: Nicht die Menge, sondern die Qualität sind entscheidend.",
      answer: "Nicht die Menge, sondern die Qualität ist entscheidend.",
    },
  }),
  de("de.c.076", "Ambiguitätskontrolle", {
    repair: {
      old: "unklar, wer ausgewählt wurde.",
      source:
        "Die Forscherin informierte die Teilnehmerin, nachdem sie ausgewählt worden war.",
      transformation: true,
      prompt:
        "Mache mit einem Relativsatz statt des nachdem-Satzes eindeutig, dass die Teilnehmerin ausgewählt worden war. Schreibe den ganzen Satz: Die Forscherin informierte die Teilnehmerin, nachdem sie ausgewählt worden war.",
      answer:
        "Die Forscherin informierte die Teilnehmerin, die ausgewählt worden war.",
    },
  }),
  de("de.c.077", "Idiomatizität und Kollokation", {
    repair: {
      old: "eine Entscheidung machen.",
      source: "Wir müssen jetzt Verantwortung nehmen.",
      prompt:
        "Korrigiere das Verb der festen Verbindung und schreibe den ganzen Satz: Wir müssen jetzt Verantwortung nehmen.",
      answer: "Wir müssen jetzt Verantwortung übernehmen.",
    },
  }),
  de("de.c.078", "Textsortenspezifische Grammatik", {
    repair: {
      old: "Hey Leute, hiermit beantrage ich Geld für das Projekt.",
      source: "Hey Leute, hiermit beantrage ich Geld für das Projekt.",
      transformation: true,
      prompt:
        "Formuliere den Antrag formell: Lass die Anrede weg und ersetze Geld durch eine Förderung. Schreibe den ganzen Satz: Hey Leute, hiermit beantrage ich Geld für das Projekt.",
      answer: "Hiermit beantrage ich eine Förderung für das Projekt.",
    },
  }),
  de("de.c.079", "Stilistische Verdichtung", {
    repair: {
      old: "Die Studie, die im Jahr 2025 veröffentlicht wurde und die oft zitiert wurde, bestätigt den Effekt.",
      source:
        "Die Studie, die 2025 veröffentlicht wurde und die oft zitiert wurde, bestätigt den Effekt.",
      transformation: true,
      prompt:
        "Verdichte die beiden Relativsätze zu Partizipialattributen vor Studie und schreibe den ganzen Satz: Die Studie, die 2025 veröffentlicht wurde und die oft zitiert wurde, bestätigt den Effekt.",
      answer:
        "Die 2025 veröffentlichte, oft zitierte Studie bestätigt den Effekt.",
      alternatives: [
        "Die 2025 veröffentlichte und oft zitierte Studie bestätigt den Effekt.",
      ],
    },
  }),
  de("de.c.080", "Pragmatische Feinsteuerung", {
    repair: {
      old: "Schicken Sie mir sofort die Unterlagen!",
      source: "Schicken Sie mir sofort die Unterlagen!",
      transformation: true,
      prompt:
        "Formuliere die Aufforderung als höfliche Frage mit Könnten Sie und lass sofort weg. Schreibe die ganze Frage: Schicken Sie mir sofort die Unterlagen!",
      answer: "Könnten Sie mir die Unterlagen schicken?",
      alternatives: ["Könnten Sie mir bitte die Unterlagen schicken?"],
    },
  }),
  de("de.c.081", "Kohärenz langer Beiträge", {
    repair: {
      old: "lokal richtige Sätze ohne globalen Zusammenhang.",
      source: "Die Methode ist effizient. Sie ist teuer. Wir empfehlen sie.",
      transformation: true,
      prompt:
        "Verknüpfe die Sätze: Leite den zweiten mit Allerdings und den dritten mit Dennoch ein. Schreibe den ganzen Text: Die Methode ist effizient. Sie ist teuer. Wir empfehlen sie.",
      answer:
        "Die Methode ist effizient. Allerdings ist sie teuer. Dennoch empfehlen wir sie.",
    },
    examples: [
      "Die Methode ist effizient. Allerdings ist sie teuer. Dennoch empfehlen wir sie.",
      "Die Kosten steigen. Deshalb prüfen wir eine günstigere Lösung.",
    ],
    retrieval: [
      {
        taskId: "de.c.081.retrieve.1.writing",
        prompt:
          "Ergänze den Konnektor für den Einwand und schreibe den ganzen Text: Die Methode ist effizient. ___ ist sie teuer.",
        answer: "Die Methode ist effizient. Allerdings ist sie teuer.",
        alternatives: ["Die Methode ist effizient. Jedoch ist sie teuer."],
      },
      {
        taskId: "de.c.081.retrieve.2.writing",
        prompt:
          "Ergänze den Konnektor für die Folge und schreibe den ganzen Text: Die Kosten steigen. ___ prüfen wir eine günstigere Lösung.",
        answer:
          "Die Kosten steigen. Deshalb prüfen wir eine günstigere Lösung.",
        alternatives: [
          "Die Kosten steigen. Daher prüfen wir eine günstigere Lösung.",
          "Die Kosten steigen. Darum prüfen wir eine günstigere Lösung.",
          "Die Kosten steigen. Deswegen prüfen wir eine günstigere Lösung.",
          "Die Kosten steigen. Folglich prüfen wir eine günstigere Lösung.",
        ],
      },
      {
        taskId: "de.c.081.retrieve.3.writing",
        prompt:
          "Ergänze den Konnektor für den unerwarteten Gegensatz und schreibe den ganzen Text: Die Methode ist teuer. ___ empfehlen wir sie.",
        answer: "Die Methode ist teuer. Dennoch empfehlen wir sie.",
        alternatives: [
          "Die Methode ist teuer. Trotzdem empfehlen wir sie.",
          "Die Methode ist teuer. Gleichwohl empfehlen wir sie.",
        ],
      },
    ],
  }),
  de("de.c.082", "Selbstreparatur im Sprechen", {
    repair: {
      old: "lange Unterbrechung nach jedem Fehler.",
      source: "Das Treffen ist am Montag, besser gesagt im Dienstag.",
      prompt:
        "Korrigiere die Präposition in der Selbstkorrektur und schreibe den ganzen Satz: Das Treffen ist am Montag, besser gesagt im Dienstag.",
      answer: "Das Treffen ist am Montag, besser gesagt am Dienstag.",
    },
  }),
  de("de.c.084", "Integrierte automatische Produktion", {
    repair: {
      old: "Genauigkeit bricht bei höherem Tempo ein.",
      source:
        "Gestern hat das Team die Analyse beendet und den Bericht geschickt an alle.",
      prompt:
        "Korrigiere die Satzklammer im zweiten Teil und schreibe den ganzen Satz: Gestern hat das Team die Analyse beendet und den Bericht geschickt an alle.",
      answer:
        "Gestern hat das Team die Analyse beendet und den Bericht an alle geschickt.",
    },
  }),
  de("de.c.085", "Imperativ mit du, ihr und Sie", {
    repair: {
      old: "Du komm herein.",
      source: "Du komm bitte herein.",
      prompt:
        "Korrigiere den Imperativ für eine Person, die du duzt, und schreibe den ganzen Satz: Du komm bitte herein.",
      answer: "Komm bitte herein.",
    },
    examples: [
      "Komm bitte herein. Kommt bitte herein. Kommen Sie bitte herein.",
      "Setz dich bitte hierhin.",
    ],
    retrieval: [
      {
        taskId: "de.c.085.retrieve.3.writing",
        prompt:
          "Ergänze den Imperativ von sich setzen für eine Person, die du duzt, und schreibe den ganzen Satz: ___ dich bitte hierhin.",
        answer: "Setz dich bitte hierhin.",
        alternatives: ["Setze dich bitte hierhin."],
      },
    ],
  }),
  de("de.c.086", "Satzklammer im einfachen Hauptsatz", {
    examples: [
      "Ich stehe jeden Morgen um sieben Uhr auf.",
      "Wir kaufen am Samstag auf dem Markt ein.",
    ],
  }),
  de("de.c.087", "Uhrzeit, Datum und Reihenfolge", {
    examples: [
      "Am Montag beginne ich um neun Uhr. Danach mache ich eine Pause.",
      "Zuerst lese ich den Text, dann schreibe ich die Antwort.",
    ],
  }),
  de("de.c.088", "Temporale Präpositionen am, um und im", {
    examples: [
      "Am Freitag lerne ich um acht Uhr im Augustkurs.",
      "Im Winter beginnt der Kurs um neun Uhr.",
    ],
    retrieval: [
      {
        taskId: "de.c.088.retrieve.3.writing",
        prompt:
          "Ergänze die Präposition für die Jahreszeit und schreibe den ganzen Satz: ___ Winter beginnt der Kurs um neun Uhr.",
        answer: "Im Winter beginnt der Kurs um neun Uhr.",
      },
    ],
  }),
  de("de.c.089", "Häufigkeitsadverbien", {
    examples: [
      "Ich lerne abends oft Deutsch.",
      "Wir trinken morgens selten Kaffee.",
    ],
    retrieval: [
      {
        taskId: "de.c.089.retrieve.3.writing",
        prompt:
          "Setze selten ins Mittelfeld nach dem konjugierten Verb und schreibe den ganzen Satz: Wir trinken morgens Kaffee.",
        answer: "Wir trinken morgens selten Kaffee.",
        alternatives: ["Wir trinken selten morgens Kaffee."],
      },
    ],
  }),
  de("de.c.090", "es gibt mit Akkusativ", {
    examples: [
      "In meiner Straße gibt es einen Supermarkt.",
      "In meinem Zimmer gibt es einen Schreibtisch.",
    ],
  }),
  de("de.c.091", "man für allgemeine Aussagen", {
    examples: [
      "In Deutschland trinkt man viel Kaffee.",
      "Im Kino isst man oft Popcorn.",
    ],
    retrieval: [
      {
        taskId: "de.c.091.retrieve.3.writing",
        prompt:
          "Ergänze die Form von essen zu man und schreibe den ganzen Satz: Im Kino ___ man oft Popcorn.",
        answer: "Im Kino isst man oft Popcorn.",
      },
    ],
  }),
  de("de.c.092", "und, aber, denn und oder", {
    examples: [
      "Ich lerne Deutsch, denn ich lebe in Berlin.",
      "Ich bleibe zu Hause, denn ich bin krank.",
    ],
    retrieval: [
      {
        taskId: "de.c.092.retrieve.3.writing",
        prompt:
          "Ergänze nach denn ich bin in der normalen Reihenfolge und schreibe den ganzen Satz: Ich bleibe zu Hause, denn ___ krank.",
        answer: "Ich bleibe zu Hause, denn ich bin krank.",
      },
    ],
  }),
  de("de.c.093", "Mengenwörter viel, wenig und genug", {
    examples: [
      "Ich habe wenig Zeit, aber viele Aufgaben.",
      "Wir haben genug Brot, aber wenig Milch.",
    ],
    retrieval: [
      {
        taskId: "de.c.093.retrieve.3.writing",
        prompt:
          "Ergänze viel oder viele vor dem nicht zählbaren Nomen und schreibe den ganzen Satz: Heute habe ich ___ Zeit.",
        answer: "Heute habe ich viel Zeit.",
      },
    ],
  }),
  de("de.c.094", "Akkusativpronomen", {
    examples: [
      "Ich sehe den Bus. Ich sehe ihn.",
      "Ich rufe meine Schwester an. Ich rufe sie an.",
    ],
    retrieval: [
      {
        taskId: "de.c.094.retrieve.3.writing",
        prompt:
          "Ersetze meine Schwester im zweiten Satz durch ein Pronomen und schreibe beide Sätze: Ich rufe meine Schwester an. Ich rufe ___ an.",
        answer: "Ich rufe meine Schwester an. Ich rufe sie an.",
      },
    ],
  }),
  de("de.c.095", "Adjektivdeklination nach Artikeln", {
    examples: [
      "Ich kaufe einen warmen Mantel und eine warme Jacke.",
      "Wir wohnen in einem kleinen Haus.",
    ],
    retrieval: [
      {
        taskId: "de.c.095.retrieve.3.writing",
        prompt:
          "Ergänze klein mit der passenden Endung und schreibe den ganzen Satz: Wir wohnen in einem ___ Haus.",
        answer: "Wir wohnen in einem kleinen Haus.",
      },
    ],
  }),
  de("de.c.096", "Relativsätze mit der, die und das", {
    examples: [
      "Das ist die Frau, die nebenan wohnt.",
      "Das ist der Mann, der hier arbeitet.",
    ],
    retrieval: [
      {
        taskId: "de.c.096.retrieve.3.writing",
        prompt:
          "Ergänze das Relativpronomen und schreibe den ganzen Satz: Das ist der Mann, ___ hier arbeitet.",
        answer: "Das ist der Mann, der hier arbeitet.",
      },
    ],
  }),
  de("de.c.097", "Nebensätze mit ob", {
    examples: [
      "Ich weiß nicht, ob der Kurs heute stattfindet.",
      "Sie fragt, ob du morgen Zeit hast.",
    ],
    retrieval: [
      {
        taskId: "de.c.097.retrieve.3.writing",
        prompt:
          "Ergänze die Konjunktion für eine indirekte Ja-Nein-Frage und schreibe den ganzen Satz: Sie fragt, ___ du morgen Zeit hast.",
        answer: "Sie fragt, ob du morgen Zeit hast.",
      },
    ],
  }),
  de("de.c.098", "darum, deshalb und deswegen", {
    examples: [
      "Ich bin müde. Deshalb gehe ich früh ins Bett.",
      "Es regnet. Darum nehme ich den Bus.",
    ],
    retrieval: [
      {
        taskId: "de.c.098.retrieve.3.writing",
        prompt:
          "Ergänze die Form von nehmen direkt nach Darum und schreibe beide Sätze: Es regnet. Darum ___ ich den Bus.",
        answer: "Es regnet. Darum nehme ich den Bus.",
      },
    ],
  }),
  de("de.c.099", "denn und sondern", {
    examples: [
      "Ich fahre nicht, sondern ich gehe zu Fuß.",
      "Er schreibt nicht, sondern er ruft an.",
    ],
    retrieval: [
      {
        taskId: "de.c.099.retrieve.3.writing",
        prompt:
          "Ergänze nach sondern er ruft in der normalen Reihenfolge und schreibe den ganzen Satz: Er schreibt nicht, sondern ___ an.",
        answer: "Er schreibt nicht, sondern er ruft an.",
      },
    ],
  }),
  de("de.c.100", "Verben mit Dativ und Akkusativ", {
    examples: [
      "Ich zeige meiner Freundin das Foto.",
      "Wir schenken unserem Lehrer ein Buch.",
    ],
    retrieval: [
      {
        taskId: "de.c.100.retrieve.3.writing",
        prompt:
          "Ergänze unser im Dativ und schreibe den ganzen Satz: Wir schenken ___ Lehrer ein Buch.",
        answer: "Wir schenken unserem Lehrer ein Buch.",
      },
    ],
  }),
  de("de.c.101", "Verben mit Präpositionen Grundlagen", {
    repair: {
      old: "Ich warte für den Bus.",
      source: "Ich warte für den Bus.",
      prompt:
        "Korrigiere die Präposition nach warten und schreibe den ganzen Satz: Ich warte für den Bus.",
      answer: "Ich warte auf den Bus.",
    },
    examples: ["Ich warte auf den Bus.", "Sie denkt oft an ihre Familie."],
    retrieval: [
      {
        taskId: "de.c.101.retrieve.3.writing",
        prompt:
          "Ergänze die Präposition nach denken und schreibe den ganzen Satz: Sie denkt oft ___ ihre Familie.",
        answer: "Sie denkt oft an ihre Familie.",
      },
    ],
  }),
  de("de.c.102", "Futur I mit werden", {
    examples: [
      "Morgen werde ich länger arbeiten.",
      "Nächste Woche werden wir umziehen.",
    ],
    retrieval: [
      {
        taskId: "de.c.102.retrieve.3.writing",
        prompt:
          "Ergänze die Form von werden und schreibe den ganzen Satz: Nächste Woche ___ wir umziehen.",
        answer: "Nächste Woche werden wir umziehen.",
      },
    ],
  }),
  de("de.c.103", "da- und wo-Komposita Grundlagen", {
    repair: {
      old: "Bei Personen: Auf wen wartest du? Nicht: Worauf bei einer Person.",
      source: "Worauf wartest du? Ich warte auf meine Schwester.",
      prompt:
        "Die Antwort nennt eine Person. Korrigiere das Fragewort und schreibe beide Sätze: Worauf wartest du? Ich warte auf meine Schwester.",
      answer: "Auf wen wartest du? Ich warte auf meine Schwester.",
    },
    examples: [
      "Worauf wartest du? Ich warte darauf.",
      "Auf wen wartest du? Ich warte auf meinen Bruder.",
    ],
    retrieval: [
      {
        taskId: "de.c.103.retrieve.3.writing",
        prompt:
          "Ergänze das Fragewort für eine Sache und schreibe beide Sätze: ___ freust du dich? Ich freue mich auf die Ferien.",
        answer: "Worauf freust du dich? Ich freue mich auf die Ferien.",
      },
    ],
  }),
  de("de.c.104", "Infinitiv mit zu Grundlagen", {
    repair: {
      old: "zu aufstehen.",
      source: "Es ist schwer, jeden Tag früh zu aufstehen.",
      prompt:
        "Korrigiere die Stellung von zu beim trennbaren Verb und schreibe den ganzen Satz: Es ist schwer, jeden Tag früh zu aufstehen.",
      answer: "Es ist schwer, jeden Tag früh aufzustehen.",
    },
    examples: [
      "Ich versuche, früher aufzustehen.",
      "Vergiss nicht, die Tür abzuschließen.",
    ],
    retrieval: [
      {
        taskId: "de.c.104.retrieve.3.writing",
        prompt:
          "Ergänze abschließen als Infinitiv mit zu und schreibe den ganzen Satz: Vergiss nicht, die Tür ___.",
        answer: "Vergiss nicht, die Tür abzuschließen.",
      },
    ],
  }),
  de("de.c.105", "Adjektivdeklination vollständig", {
    repair: {
      old: "trotz des kaltes Wetters.",
      source: "Trotz des kaltes Wetters gehen wir spazieren.",
      prompt:
        "Korrigiere die Adjektivendung und schreibe den ganzen Satz: Trotz des kaltes Wetters gehen wir spazieren.",
      answer: "Trotz des kalten Wetters gehen wir spazieren.",
    },
    examples: [
      "Trotz des kalten Wetters besuchen wir den neuen Markt.",
      "Mit dem neuen Fahrrad fahre ich zur Arbeit.",
    ],
    retrieval: [
      {
        taskId: "de.c.105.retrieve.3.writing",
        prompt:
          "Ergänze neu mit der passenden Endung und schreibe den ganzen Satz: Mit dem ___ Fahrrad fahre ich zur Arbeit.",
        answer: "Mit dem neuen Fahrrad fahre ich zur Arbeit.",
      },
    ],
  }),
  de("de.c.106", "Pronominaladverbien", {
    repair: {
      old: "daran bei einer Person.",
      source: "Ich denke oft an meinen Bruder. Ich denke oft daran.",
      prompt:
        "Bei Personen steht Präposition plus Pronomen. Korrigiere den zweiten Satz und schreibe beide Sätze: Ich denke oft an meinen Bruder. Ich denke oft daran.",
      answer: "Ich denke oft an meinen Bruder. Ich denke oft an ihn.",
    },
    examples: [
      "Ich denke oft daran. An wen denkst du?",
      "Wir sprechen über das Projekt. Wir sprechen darüber.",
    ],
    retrieval: [
      {
        taskId: "de.c.106.retrieve.3.writing",
        prompt:
          "Ersetze über das Projekt im zweiten Satz durch ein Pronominaladverb und schreibe beide Sätze: Wir sprechen über das Projekt. Wir sprechen ___.",
        answer: "Wir sprechen über das Projekt. Wir sprechen darüber.",
      },
    ],
  }),
  de("de.c.107", "Futur I für Prognosen und Vermutungen", {
    repair: {
      old: "Die Form kann Zukunft oder Vermutung ausdrücken; der Kontext entscheidet.",
      source: "Sie wird wohl noch im Büro.",
      prompt:
        "Ergänze die fehlende Verbform der Vermutung und schreibe den ganzen Satz: Sie wird wohl noch im Büro.",
      answer: "Sie wird wohl noch im Büro sein.",
    },
    examples: [
      "Sie wird wohl noch im Büro sein.",
      "Morgen wird es wahrscheinlich regnen.",
    ],
    retrieval: [
      {
        taskId: "de.c.107.retrieve.3.writing",
        prompt:
          "Ergänze die Form von werden für die Prognose und schreibe den ganzen Satz: Morgen ___ es wahrscheinlich regnen.",
        answer: "Morgen wird es wahrscheinlich regnen.",
      },
    ],
  }),
  de("de.c.108", "Vorgangspassiv und Zustandspassiv", {
    repair: {
      old: "Vorgang: wird geöffnet. Zustand: ist geöffnet.",
      source: "Um neun Uhr wird die Tür geöffnet. Danach wird sie geöffnet.",
      prompt:
        "Der zweite Satz beschreibt den Zustand. Korrigiere ihn und schreibe beide Sätze: Um neun Uhr wird die Tür geöffnet. Danach wird sie geöffnet.",
      answer: "Um neun Uhr wird die Tür geöffnet. Danach ist sie geöffnet.",
    },
    examples: [
      "Die Tür wird geöffnet. Danach ist sie geöffnet.",
      "Das Fenster wird repariert. Danach ist es repariert.",
    ],
    retrieval: [
      {
        taskId: "de.c.108.retrieve.2.writing",
        prompt:
          "Wähle den Satz, der einen Zustand beschreibt, und schreibe ihn vollständig: A: Das Fenster wird repariert. / B: Das Fenster ist repariert.",
        answer: "Das Fenster ist repariert.",
      },
      {
        taskId: "de.c.108.retrieve.3.writing",
        prompt:
          "Ergänze die Form von sein für den Zustand und schreibe beide Sätze: Das Fenster wird repariert. Danach ___ es repariert.",
        answer: "Das Fenster wird repariert. Danach ist es repariert.",
      },
    ],
  }),
  de("de.c.109", "Temporalsätze mit bevor, nachdem und seitdem", {
    repair: {
      old: "Nachdem hatte ich gegessen.",
      source: "Nachdem hatte ich gegessen, ging ich spazieren.",
      prompt:
        "Korrigiere die Verbstellung im Nebensatz und schreibe den ganzen Satz: Nachdem hatte ich gegessen, ging ich spazieren.",
      answer: "Nachdem ich gegessen hatte, ging ich spazieren.",
    },
    examples: [
      "Nachdem ich gegessen hatte, ging ich spazieren.",
      "Bevor ich losfahre, rufe ich dich an.",
    ],
    retrieval: [
      {
        taskId: "de.c.109.retrieve.3.writing",
        prompt:
          "Ergänze die Konjunktion für das spätere Ereignis im Nebensatz und schreibe den ganzen Satz: ___ ich losfahre, rufe ich dich an.",
        answer: "Bevor ich losfahre, rufe ich dich an.",
      },
    ],
  }),
  de("de.c.110", "ohne zu und anstatt zu", {
    repair: {
      old: "Bei verschiedenem Subjekt ist meist ein vollständiger Nebensatz nötig.",
      source: "Er ging, ohne zu sich verabschieden.",
      prompt:
        "Korrigiere die Stellung von zu und schreibe den ganzen Satz: Er ging, ohne zu sich verabschieden.",
      answer: "Er ging, ohne sich zu verabschieden.",
    },
    examples: [
      "Er ging, ohne sich zu verabschieden.",
      "Anstatt zu lernen, sah sie fern.",
    ],
    retrieval: [
      {
        taskId: "de.c.110.retrieve.3.writing",
        prompt:
          "Ergänze anstatt und schreibe den ganzen Satz: ___ zu lernen, sah sie fern.",
        answer: "Anstatt zu lernen, sah sie fern.",
        alternatives: ["Statt zu lernen, sah sie fern."],
      },
    ],
  }),
  de("de.c.111", "lassen als Vollverb und Hilfsverb", {
    examples: [
      "Ich lasse mein Fahrrad reparieren.",
      "Sie lässt ihre Haare schneiden.",
    ],
    retrieval: [
      {
        taskId: "de.c.111.retrieve.3.writing",
        prompt:
          "Ergänze die Form von lassen und schreibe den ganzen Satz: Sie ___ ihre Haare schneiden.",
        answer: "Sie lässt ihre Haare schneiden.",
      },
    ],
  }),
  de("de.c.112", "brauchen nicht zu", {
    repair: {
      old: "Nicht: Du brauchst nicht kommen in formeller Standardsprache. Besser: nicht zu kommen.",
      source: "Du brauchst heute nicht kommen.",
      prompt:
        "Verwende in formeller Standardsprache brauchen mit zu und schreibe den ganzen Satz: Du brauchst heute nicht kommen.",
      answer: "Du brauchst heute nicht zu kommen.",
    },
    examples: [
      "Du brauchst heute nicht zu kommen.",
      "Sie brauchen das Formular nicht auszudrucken.",
    ],
    retrieval: [
      {
        taskId: "de.c.112.retrieve.3.writing",
        prompt:
          "Ergänze ausdrucken als Infinitiv mit zu und schreibe den ganzen Satz: Sie brauchen das Formular nicht ___.",
        answer: "Sie brauchen das Formular nicht auszudrucken.",
      },
    ],
  }),
  de("de.c.113", "Zweiteilige Konnektoren", {
    repair: {
      old: "Halte die verbundenen Teile grammatisch parallel.",
      source:
        "Einerseits spart die App Zeit, andererseits sie braucht Aufmerksamkeit.",
      prompt:
        "Korrigiere die Verbstellung nach andererseits und schreibe den ganzen Satz: Einerseits spart die App Zeit, andererseits sie braucht Aufmerksamkeit.",
      answer:
        "Einerseits spart die App Zeit, andererseits braucht sie Aufmerksamkeit.",
    },
    examples: [
      "Einerseits spart die App Zeit, andererseits braucht sie Aufmerksamkeit.",
      "Wir können entweder heute oder morgen fahren.",
    ],
    retrieval: [
      {
        taskId: "de.c.113.retrieve.3.writing",
        prompt:
          "Ergänze den zweiten Teil von entweder und schreibe den ganzen Satz: Wir können entweder heute ___ morgen fahren.",
        answer: "Wir können entweder heute oder morgen fahren.",
      },
    ],
  }),
  de("de.c.114", "Genitivpräpositionen", {
    repair: {
      old: "wegen dem Regen in formeller Sprache.",
      source: "Während dem Unterricht bleibt das Handy aus.",
      prompt:
        "Verwende in formeller Sprache den Genitiv nach während und schreibe den ganzen Satz: Während dem Unterricht bleibt das Handy aus.",
      answer: "Während des Unterrichts bleibt das Handy aus.",
      alternatives: ["Während des Unterrichtes bleibt das Handy aus."],
    },
    examples: [
      "Wegen des starken Regens blieb ich zu Hause.",
      "Innerhalb einer Woche erhalten Sie eine Antwort.",
    ],
    retrieval: [
      {
        taskId: "de.c.114.retrieve.3.writing",
        prompt:
          "Ergänze den Artikel im Genitiv nach innerhalb und schreibe den ganzen Satz: Innerhalb ___ Woche erhalten Sie eine Antwort.",
        answer: "Innerhalb einer Woche erhalten Sie eine Antwort.",
      },
    ],
  }),
  de("de.c.115", "Indirekte Rede mit Konjunktiv I", {
    repair: {
      old: "Direkt: Ich habe keine Zeit. Indirekt: sie habe keine Zeit.",
      source: "Sie sagt: Ich habe keine Zeit.",
      transformation: true,
      prompt:
        "Gib die Aussage in indirekter Rede mit Konjunktiv I und ohne dass wieder. Ausgangssatz: Sie sagt: Ich habe keine Zeit.",
      answer: "Sie sagt, sie habe keine Zeit.",
    },
    examples: [
      "Sie sagt, sie habe keine Zeit.",
      "Er erklärt, er komme morgen später.",
    ],
    retrieval: [
      {
        taskId: "de.c.115.retrieve.3.writing",
        prompt:
          "Ergänze die Form von kommen im Konjunktiv I und schreibe den ganzen Satz: Er erklärt, er ___ morgen später.",
        answer: "Er erklärt, er komme morgen später.",
      },
    ],
  }),
  de("de.c.116", "Modalpartikeln im Gespräch", {
    repair: {
      old: "Modalpartikeln sind nicht frei austauschbar; Situation und Ton entscheiden.",
      source: "Komm ja morgen kurz vorbei.",
      transformation: true,
      prompt:
        "Mache aus der Ermahnung eine freundliche Einladung mit der Modalpartikel doch. Schreibe den ganzen Satz: Komm ja morgen kurz vorbei.",
      answer: "Komm doch morgen kurz vorbei.",
    },
    examples: ["Komm doch morgen kurz vorbei.", "Das ist ja interessant!"],
    retrieval: [
      {
        taskId: "de.c.116.retrieve.3.writing",
        prompt:
          "Ergänze die Modalpartikel ja für die überraschte Feststellung und schreibe den ganzen Satz: Das ist ___ interessant!",
        answer: "Das ist ja interessant!",
      },
    ],
  }),
  de("de.c.117", "Komplexe Temporalsätze", {
    repair: {
      old: "Prüfe das Zeitverhältnis, bevor du den Konnektor wählst.",
      source:
        "Sobald die Ergebnisse vorliegen, wir informieren alle Beteiligten.",
      prompt:
        "Korrigiere die Verbstellung im Hauptsatz und schreibe den ganzen Satz: Sobald die Ergebnisse vorliegen, wir informieren alle Beteiligten.",
      answer:
        "Sobald die Ergebnisse vorliegen, informieren wir alle Beteiligten.",
    },
    examples: [
      "Sobald die Ergebnisse vorliegen, informieren wir alle Beteiligten.",
      "Solange das Projekt läuft, bleibt das Büro geöffnet.",
    ],
    retrieval: [
      {
        taskId: "de.c.117.retrieve.3.writing",
        prompt:
          "Ergänze den Konnektor für die gleiche Dauer und schreibe den ganzen Satz: ___ das Projekt läuft, bleibt das Büro geöffnet.",
        answer: "Solange das Projekt läuft, bleibt das Büro geöffnet.",
      },
    ],
  }),
  de("de.c.118", "Konzessive Verknüpfung mit dennoch und gleichwohl", {
    examples: [
      "Die Daten waren unvollständig; dennoch war eine vorsichtige Analyse möglich.",
      "Die Kosten sind hoch; gleichwohl lohnt sich die Investition.",
    ],
    retrieval: [
      {
        taskId: "de.c.118.retrieve.3.writing",
        prompt:
          "Ergänze die Form von sich lohnen direkt nach gleichwohl und schreibe den ganzen Satz: Die Kosten sind hoch; gleichwohl ___ sich die Investition.",
        answer: "Die Kosten sind hoch; gleichwohl lohnt sich die Investition.",
      },
    ],
  }),
  de("de.c.119", "Kausale und konsekutive Verknüpfung", {
    repair: {
      old: "Ursache beantwortet warum; Folge beschreibt das Ergebnis.",
      source: "Die Stichprobe war klein, weil die Aussagekraft begrenzt blieb.",
      prompt:
        "Der zweite Teil ist die Folge. Ersetze weil durch sodass und schreibe den ganzen Satz: Die Stichprobe war klein, weil die Aussagekraft begrenzt blieb.",
      answer:
        "Die Stichprobe war klein, sodass die Aussagekraft begrenzt blieb.",
      alternatives: [
        "Die Stichprobe war klein, so dass die Aussagekraft begrenzt blieb.",
      ],
    },
    examples: [
      "Die Stichprobe war klein, sodass die Aussagekraft begrenzt blieb.",
      "Da der Zug ausfiel, kamen wir zu spät.",
    ],
    retrieval: [
      {
        taskId: "de.c.119.retrieve.3.writing",
        prompt:
          "Ergänze den Konnektor für die Ursache und schreibe den ganzen Satz: ___ der Zug ausfiel, kamen wir zu spät.",
        answer: "Da der Zug ausfiel, kamen wir zu spät.",
        alternatives: ["Weil der Zug ausfiel, kamen wir zu spät."],
      },
    ],
  }),
  de("de.c.120", "Partizipialattribute erweitern", {
    repair: {
      old: "Entfalte zur Kontrolle: die Ergebnisse, die im Seminar diskutiert wurden.",
      source:
        "Wir besprechen die Ergebnisse, die im Seminar diskutiert wurden.",
      transformation: true,
      prompt:
        "Verdichte den Relativsatz zu einem Partizipialattribut und schreibe den ganzen Satz: Wir besprechen die Ergebnisse, die im Seminar diskutiert wurden.",
      answer: "Wir besprechen die im Seminar diskutierten Ergebnisse.",
    },
    examples: [
      "Wir besprechen die im Seminar diskutierten Ergebnisse.",
      "Die seit Jahren steigenden Kosten belasten das Projekt.",
    ],
    retrieval: [
      {
        taskId: "de.c.120.retrieve.2.writing",
        prompt:
          "Wähle das korrekt gebildete Partizipialattribut und schreibe es vollständig: A: die im Seminar diskutierte Ergebnisse / B: die im Seminar diskutierten Ergebnisse",
        answer: "die im Seminar diskutierten Ergebnisse",
      },
      {
        taskId: "de.c.120.retrieve.3.writing",
        prompt:
          "Ergänze das Partizip I von steigen mit der passenden Endung und schreibe den ganzen Satz: Die seit Jahren ___ Kosten belasten das Projekt.",
        answer: "Die seit Jahren steigenden Kosten belasten das Projekt.",
      },
    ],
  }),
  de("de.c.121", "Nominalisierte Adjektive", {
    repair: {
      old: "die lernenden als Nomen klein.",
      source: "Viele lernende wünschen sich mehr Zeit.",
      prompt:
        "Korrigiere die Schreibung des nominalisierten Adjektivs und schreibe den ganzen Satz: Viele lernende wünschen sich mehr Zeit.",
      answer: "Viele Lernende wünschen sich mehr Zeit.",
    },
    examples: [
      "Viele Lernende wünschen sich mehr Zeit.",
      "Die Reisenden warten am Gleis.",
    ],
    retrieval: [
      {
        taskId: "de.c.121.retrieve.3.writing",
        prompt:
          "Ergänze das nominalisierte Partizip von reisen mit der passenden Endung und schreibe den ganzen Satz: Die ___ warten am Gleis.",
        answer: "Die Reisenden warten am Gleis.",
      },
    ],
  }),
  de("de.c.122", "Erweiterte Genitivpräpositionen", {
    repair: {
      old: "Prüfe, ob ein einfacheres Verb im Alltag natürlicher wäre.",
      source: "Hinsichtlich den Ergebnissen bleiben mehrere Fragen offen.",
      prompt:
        "Korrigiere den Kasus nach hinsichtlich und schreibe den ganzen Satz: Hinsichtlich den Ergebnissen bleiben mehrere Fragen offen.",
      answer: "Hinsichtlich der Ergebnisse bleiben mehrere Fragen offen.",
    },
    examples: [
      "Hinsichtlich der Ergebnisse bleiben mehrere Fragen offen.",
      "Angesichts der hohen Kosten verschieben wir das Projekt.",
    ],
    retrieval: [
      {
        taskId: "de.c.122.retrieve.3.writing",
        prompt:
          "Ergänze den Artikel im Genitiv nach angesichts und schreibe den ganzen Satz: Angesichts ___ hohen Kosten verschieben wir das Projekt.",
        answer: "Angesichts der hohen Kosten verschieben wir das Projekt.",
      },
    ],
  }),
  de("de.c.123", "Funktionsverbgefüge systematisch", {
    repair: {
      old: "Nicht jedes einfache Verb muss nominal ersetzt werden; Register und Fokus entscheiden.",
      source: "Die Leitung macht Einfluss auf das Projekt.",
      prompt:
        "Korrigiere das Funktionsverb und schreibe den ganzen Satz: Die Leitung macht Einfluss auf das Projekt.",
      answer: "Die Leitung nimmt Einfluss auf das Projekt.",
    },
    examples: [
      "Das Team trifft morgen eine Entscheidung.",
      "Wir stellen morgen einen Antrag.",
    ],
    retrieval: [
      {
        taskId: "de.c.123.retrieve.3.writing",
        prompt:
          "Ergänze das Funktionsverb zu einen Antrag und schreibe den ganzen Satz: Wir ___ morgen einen Antrag.",
        answer: "Wir stellen morgen einen Antrag.",
      },
    ],
  }),
  de("de.c.124", "Informationsstruktur durch Vorfeldbesetzung", {
    repair: {
      old: "Nicht zwei Satzglieder vor dem finiten Verb platzieren.",
      source: "Besonders wichtig deshalb ist die transparente Dokumentation.",
      prompt:
        "Im Vorfeld steht nur ein Satzglied. Korrigiere die Wortstellung und schreibe den ganzen Satz: Besonders wichtig deshalb ist die transparente Dokumentation.",
      answer: "Besonders wichtig ist deshalb die transparente Dokumentation.",
      alternatives: [
        "Deshalb ist die transparente Dokumentation besonders wichtig.",
      ],
    },
    examples: [
      "Besonders wichtig ist die transparente Dokumentation.",
      "Im nächsten Schritt prüfen wir die Daten.",
    ],
    retrieval: [
      {
        taskId: "de.c.124.retrieve.3.writing",
        prompt:
          "Ergänze die Form von prüfen an Position zwei und schreibe den ganzen Satz: Im nächsten Schritt ___ wir die Daten.",
        answer: "Im nächsten Schritt prüfen wir die Daten.",
      },
    ],
  }),
  de("de.c.125", "Diskurspartikeln und Registersteuerung", {
    repair: {
      old: "Allerdings wirkt in einem Forschungsbericht anders als halt im Gespräch.",
      source: "Die Einschränkung ist halt methodisch bedeutsam.",
      transformation: true,
      prompt:
        "Ersetze für einen Forschungsbericht die umgangssprachliche Partikel halt durch allerdings und schreibe den ganzen Satz: Die Einschränkung ist halt methodisch bedeutsam.",
      answer: "Die Einschränkung ist allerdings methodisch bedeutsam.",
    },
    examples: [
      "Die Einschränkung ist allerdings methodisch bedeutsam.",
      "Die Methode ist allerdings aufwendig.",
    ],
    retrieval: [
      {
        taskId: "de.c.125.retrieve.3.writing",
        prompt:
          "Ergänze allerdings als Signal für den Einwand im Forschungsbericht und schreibe den ganzen Satz: Die Methode ist ___ aufwendig.",
        answer: "Die Methode ist allerdings aufwendig.",
      },
    ],
  }),
  de("de.c.126", "Tempusfolge in Berichten", {
    repair: {
      old: "Wechsle das Tempus nur, wenn sich Perspektive oder Zeitbezug ändert.",
      source: "Die Autorin berichtete, sie hat die Daten zuvor bereinigt.",
      transformation: true,
      prompt:
        "Verwende in der indirekten Rede den Konjunktiv I und schreibe den ganzen Satz: Die Autorin berichtete, sie hat die Daten zuvor bereinigt.",
      answer: "Die Autorin berichtete, sie habe die Daten zuvor bereinigt.",
      alternatives: [
        "Die Autorin berichtete, dass sie die Daten zuvor bereinigt habe.",
      ],
    },
    examples: [
      "Die Autorin berichtete, sie habe die Daten zuvor bereinigt.",
      "Nachdem die Daten bereinigt worden waren, begann die Analyse.",
    ],
    retrieval: [
      {
        taskId: "de.c.126.retrieve.2.writing",
        prompt:
          "Ergänze das Hilfsverb für die Vorzeitigkeit im Plusquamperfekt und schreibe den ganzen Satz: Nachdem die Daten bereinigt worden ___, begann die Analyse.",
        answer: "Nachdem die Daten bereinigt worden waren, begann die Analyse.",
      },
      {
        taskId: "de.c.126.retrieve.3.writing",
        prompt:
          "Ergänze die Konjunktiv-I-Form von haben und schreibe den ganzen Satz: Die Autorin berichtete, sie ___ die Daten zuvor bereinigt.",
        answer: "Die Autorin berichtete, sie habe die Daten zuvor bereinigt.",
      },
    ],
  }),
  de("de.c.127", "Komplexe Verbvalenz und Rektion", {
    repair: {
      old: "Eine semantisch ähnliche Präposition kann grammatisch trotzdem falsch sein.",
      source: "Die Analyse beruht von sorgfältig dokumentierten Annahmen.",
      prompt:
        "Korrigiere die Präposition nach beruhen und schreibe den ganzen Satz: Die Analyse beruht von sorgfältig dokumentierten Annahmen.",
      answer: "Die Analyse beruht auf sorgfältig dokumentierten Annahmen.",
    },
    examples: [
      "Die Analyse beruht auf sorgfältig dokumentierten Annahmen.",
      "Das Ergebnis hängt von der Stichprobe ab.",
    ],
    retrieval: [
      {
        taskId: "de.c.127.retrieve.3.writing",
        prompt:
          "Ergänze die Präposition nach abhängen und schreibe den ganzen Satz: Das Ergebnis hängt ___ der Stichprobe ab.",
        answer: "Das Ergebnis hängt von der Stichprobe ab.",
      },
    ],
  }),
  de("de.c.128", "Infinitiv- und Partizipialverdichtung", {
    repair: {
      old: "Vermeide schwebende Bezüge, bei denen das logische Subjekt fehlt.",
      source:
        "Nach sorgfältiger Prüfung freigegeben, archivierte das Team den Datensatz.",
      transformation: true,
      prompt:
        "Das Partizip bezieht sich auf den Datensatz. Formuliere den Hauptsatz im Passiv mit dem Datensatz als Subjekt und schreibe den ganzen Satz: Nach sorgfältiger Prüfung freigegeben, archivierte das Team den Datensatz.",
      answer:
        "Nach sorgfältiger Prüfung freigegeben, wurde der Datensatz archiviert.",
    },
    examples: [
      "Nach sorgfältiger Prüfung freigegeben, wurde der Datensatz archiviert.",
      "Um die Daten zu schützen, verschlüsselt das Team jede Datei.",
    ],
    retrieval: [
      {
        taskId: "de.c.128.retrieve.3.writing",
        prompt:
          "Ergänze den Konnektor für die Absicht und schreibe den ganzen Satz: ___ die Daten zu schützen, verschlüsselt das Team jede Datei.",
        answer: "Um die Daten zu schützen, verschlüsselt das Team jede Datei.",
      },
    ],
  }),
  de("de.c.129", "Indirekte Rede mit Tempus und Modalität", {
    repair: {
      old: "Konjunktiv markiert Distanz, ersetzt aber keine genaue Quellenangabe.",
      source:
        "Der Autor erklärte, das Verfahren kann die Fehlerquote gesenkt haben.",
      transformation: true,
      prompt:
        "Verwende den Konjunktiv I des Modalverbs und schreibe den ganzen Satz: Der Autor erklärte, das Verfahren kann die Fehlerquote gesenkt haben.",
      answer:
        "Der Autor erklärte, das Verfahren könne die Fehlerquote gesenkt haben.",
    },
    examples: [
      "Der Autor erklärte, das Verfahren könne die Fehlerquote gesenkt haben.",
      "Laut der Studie müsse die Methode weiter geprüft werden.",
    ],
    retrieval: [
      {
        taskId: "de.c.129.retrieve.3.writing",
        prompt:
          "Ergänze die Konjunktiv-I-Form von müssen und schreibe den ganzen Satz: Laut der Studie ___ die Methode weiter geprüft werden.",
        answer: "Laut der Studie müsse die Methode weiter geprüft werden.",
      },
    ],
  }),
  de("de.c.130", "Komplexe Konditionalstrukturen", {
    repair: {
      old: "Bedingung und Folge müssen denselben Realitätsgrad ausdrücken.",
      source:
        "Wenn weitere Daten verfügbar wären, lässt sich die Hypothese erneut prüfen.",
      prompt:
        "Passe nur das Verb der Folge an die irreale Bedingung an und schreibe den ganzen Satz: Wenn weitere Daten verfügbar wären, lässt sich die Hypothese erneut prüfen.",
      answer:
        "Wenn weitere Daten verfügbar wären, ließe sich die Hypothese erneut prüfen.",
    },
    examples: [
      "Sollten weitere Daten verfügbar werden, ließe sich die Hypothese erneut prüfen.",
      "Falls der Termin ausfällt, informieren wir Sie sofort.",
    ],
    retrieval: [
      {
        taskId: "de.c.130.retrieve.3.writing",
        prompt:
          "Ergänze falls für eine reale Bedingung und schreibe den ganzen Satz: ___ der Termin ausfällt, informieren wir Sie sofort.",
        answer: "Falls der Termin ausfällt, informieren wir Sie sofort.",
        alternatives: ["Wenn der Termin ausfällt, informieren wir Sie sofort."],
      },
    ],
  }),
  de("de.c.131", "Kausale Zuschreibung und wissenschaftliche Positionierung", {
    repair: {
      old: "Nicht jede Korrelation rechtfertigt verursacht durch.",
      source:
        "Der Befund lässt sich teilweise an die veränderte Stichprobe zurückführen.",
      prompt:
        "Korrigiere die Präposition nach zurückführen und schreibe den ganzen Satz: Der Befund lässt sich teilweise an die veränderte Stichprobe zurückführen.",
      answer:
        "Der Befund lässt sich teilweise auf die veränderte Stichprobe zurückführen.",
    },
    examples: [
      "Der Befund lässt sich teilweise auf die veränderte Stichprobe zurückführen.",
      "Der Anstieg geht vermutlich auf das neue Verfahren zurück.",
    ],
    retrieval: [
      {
        taskId: "de.c.131.retrieve.2.writing",
        prompt:
          "Ergänze die Präposition nach zurückgehen und schreibe den ganzen Satz: Der Anstieg geht vermutlich ___ das neue Verfahren zurück.",
        answer: "Der Anstieg geht vermutlich auf das neue Verfahren zurück.",
      },
      {
        taskId: "de.c.131.retrieve.3.writing",
        prompt:
          "Ergänze möglicherweise, um die Ursache vorsichtig zu formulieren, und schreibe den ganzen Satz: Der Unterschied ist ___ auf Messfehler zurückzuführen.",
        answer:
          "Der Unterschied ist möglicherweise auf Messfehler zurückzuführen.",
      },
    ],
  }),
  de("de.c.132", "Thema-Rhema-Gliederung", {
    repair: {
      old: "Unvermittelte Themenwechsel schwächen Kohärenz.",
      source:
        "Die erste Studie prüft die Genauigkeit. Den Ausgangspunkt der zweiten Analyse bildet sie.",
      transformation: true,
      prompt:
        "Nimm im zweiten Satz das bekannte Thema mit Diese Genauigkeit am Satzanfang wieder auf und schreibe beide Sätze: Die erste Studie prüft die Genauigkeit. Den Ausgangspunkt der zweiten Analyse bildet sie.",
      answer:
        "Die erste Studie prüft die Genauigkeit. Diese Genauigkeit bildet den Ausgangspunkt der zweiten Analyse.",
    },
    examples: [
      "Die erste Studie prüft die Genauigkeit. Diese Genauigkeit bildet den Ausgangspunkt der zweiten Analyse.",
      "Wir haben einen Fragebogen entwickelt. Dieser Fragebogen wurde zweimal getestet.",
    ],
    retrieval: [
      {
        taskId: "de.c.132.retrieve.2.writing",
        prompt:
          "Ergänze das Demonstrativum, das das bekannte Thema wieder aufnimmt, und schreibe beide Sätze: Wir haben einen Fragebogen entwickelt. ___ Fragebogen wurde zweimal getestet.",
        answer:
          "Wir haben einen Fragebogen entwickelt. Dieser Fragebogen wurde zweimal getestet.",
      },
      {
        taskId: "de.c.132.retrieve.3.writing",
        prompt:
          "Ergänze das Demonstrativum, das die Information aus dem ersten Satz wieder aufnimmt, und schreibe beide Sätze: Die Stichprobe war klein. ___ Einschränkung betrifft alle Ergebnisse.",
        answer:
          "Die Stichprobe war klein. Diese Einschränkung betrifft alle Ergebnisse.",
      },
    ],
  }),
  de("de.c.133", "Interpunktion als Bedeutungssignal", {
    repair: {
      old: "Satzzeichen ersetzen keine grammatische Verknüpfung, können sie aber verdeutlichen.",
      source: "Ein Ergebnis blieb stabil die hohe Präzision.",
      prompt:
        "Setze das Satzzeichen, das die Erklärung ankündigt, und schreibe den ganzen Satz. Ausgangssatz: Ein Ergebnis blieb stabil die hohe Präzision.",
      answer: "Ein Ergebnis blieb stabil: die hohe Präzision.",
    },
    examples: [
      "Ein Ergebnis blieb stabil: die hohe Präzision.",
      "Die Daten waren vollständig; die Analyse konnte beginnen.",
    ],
    retrieval: [
      {
        taskId: "de.c.133.retrieve.2.writing",
        prompt:
          "Setze zwischen die beiden eng verbundenen Hauptsätze ein Semikolon und schreibe den ganzen Satz. Ausgangssatz: Die Daten waren vollständig die Analyse konnte beginnen.",
        answer: "Die Daten waren vollständig; die Analyse konnte beginnen.",
      },
      {
        taskId: "de.c.133.retrieve.3.writing",
        prompt:
          "Setze das Komma vor dem Nebensatz und schreibe den ganzen Satz. Ausgangssatz: Wir beginnen sobald alle Daten vorliegen.",
        answer: "Wir beginnen, sobald alle Daten vorliegen.",
      },
    ],
  }),
  de("de.c.134", "Syntax wissenschaftlicher Zitate", {
    repair: {
      old: "Eine Quellenklammer ohne grammatische Einbettung macht den Bezug oft unklar.",
      source: "Wie Müller (2025) zeigt, die Genauigkeit hängt vom Kontext ab.",
      prompt:
        "Korrigiere die Verbstellung nach dem vorangestellten Nebensatz und schreibe den ganzen Satz: Wie Müller (2025) zeigt, die Genauigkeit hängt vom Kontext ab.",
      answer: "Wie Müller (2025) zeigt, hängt die Genauigkeit vom Kontext ab.",
    },
    examples: [
      "Wie Müller (2025) zeigt, hängt die Genauigkeit vom Kontext ab.",
      "Laut Schmidt (2024) ist die Methode zuverlässig.",
    ],
    retrieval: [
      {
        taskId: "de.c.134.retrieve.2.writing",
        prompt:
          "Ergänze die Präposition laut, mit der die Quelle eingeleitet wird, und schreibe den ganzen Satz: ___ Schmidt (2024) ist die Methode zuverlässig.",
        answer: "Laut Schmidt (2024) ist die Methode zuverlässig.",
      },
      {
        taskId: "de.c.134.retrieve.3.writing",
        prompt:
          "Ergänze die Form von sein direkt nach der Quellenangabe und schreibe den ganzen Satz: Nach Schmidt (2024) ___ die Methode zuverlässig.",
        answer: "Nach Schmidt (2024) ist die Methode zuverlässig.",
      },
    ],
  }),
  de("de.c.135", "Deixis und Perspektivsteuerung", {
    repair: {
      old: "Deiktische Ausdrücke brauchen einen eindeutig rekonstruierbaren Bezugspunkt.",
      source:
        "Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als damals.",
      prompt:
        "Korrigiere die Zeitangabe, die die Gegenwart des Sprechers bezeichnet, und schreibe den ganzen Satz: Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als damals.",
      answer:
        "Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als heute.",
    },
    examples: [
      "Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als heute.",
      "Hier, in diesem Raum, wurde der Vertrag unterzeichnet.",
    ],
    retrieval: [
      {
        taskId: "de.c.135.retrieve.3.writing",
        prompt:
          "Ergänze das Demonstrativum für den Ort, an dem der Sprecher steht, und schreibe den ganzen Satz: Hier, in ___ Raum, wurde der Vertrag unterzeichnet.",
        answer: "Hier, in diesem Raum, wurde der Vertrag unterzeichnet.",
      },
    ],
  }),
  de("de.c.136", "Anapher und Katapher", {
    repair: {
      old: "Pronomen dürfen nicht auf mehrere gleich plausible Referenten verweisen.",
      source:
        "Die Leiterin sprach mit der Assistentin, bevor sie die Messung wiederholte.",
      transformation: true,
      prompt:
        "Mache eindeutig, dass die Assistentin die Messung wiederholte, und schreibe den ganzen Satz: Die Leiterin sprach mit der Assistentin, bevor sie die Messung wiederholte.",
      answer:
        "Die Leiterin sprach mit der Assistentin, bevor diese die Messung wiederholte.",
      alternatives: [
        "Die Leiterin sprach mit der Assistentin, bevor die Assistentin die Messung wiederholte.",
      ],
    },
    examples: [
      "Das war unerwartet: dass sämtliche Messungen übereinstimmten.",
      "Der Professor begrüßte den Studenten, bevor dieser seinen Vortrag hielt.",
    ],
    retrieval: [
      {
        taskId: "de.c.136.retrieve.3.writing",
        prompt:
          "Ergänze das Demonstrativpronomen, das auf den zuletzt genannten Mann verweist, und schreibe den ganzen Satz: Der Professor begrüßte den Studenten, bevor ___ seinen Vortrag hielt.",
        answer:
          "Der Professor begrüßte den Studenten, bevor dieser seinen Vortrag hielt.",
      },
    ],
  }),
  de("de.c.137", "Skopus und Negation", {
    repair: {
      old: "Nicht alle bedeutet etwas anderes als alle nicht.",
      source: "Alle Ergebnisse waren nicht signifikant.",
      transformation: true,
      prompt:
        "Gemeint ist: Einige Ergebnisse waren signifikant, andere nicht. Stelle die Negation passend und schreibe den ganzen Satz: Alle Ergebnisse waren nicht signifikant.",
      answer: "Nicht alle Ergebnisse waren signifikant.",
    },
    examples: [
      "Nicht alle Ergebnisse waren signifikant.",
      "Sie hat nicht nur die Daten geprüft, sondern auch die Methode.",
    ],
    retrieval: [
      {
        taskId: "de.c.137.retrieve.3.writing",
        prompt:
          "Ergänze nicht nur vor dem ersten hervorgehobenen Teil und schreibe den ganzen Satz: Sie hat ___ die Daten geprüft, sondern auch die Methode.",
        answer:
          "Sie hat nicht nur die Daten geprüft, sondern auch die Methode.",
      },
    ],
  }),
  de("de.c.138", "Präsupposition und Implikatur", {
    repair: {
      old: "Implizites darf in wissenschaftlicher Argumentation nicht als belegte Tatsache erscheinen.",
      source: "Auch die zweite Studie scheiterte.",
      transformation: true,
      prompt:
        "Die erste Studie war erfolgreich. Entferne das Wort, das ein früheres Scheitern voraussetzt, und schreibe den ganzen Satz: Auch die zweite Studie scheiterte.",
      answer: "Die zweite Studie scheiterte.",
    },
    examples: [
      "Die zweite Studie scheiterte ebenfalls.",
      "Selbst die erfahrene Gruppe brauchte mehr Zeit.",
    ],
    retrieval: [
      {
        taskId: "de.c.138.retrieve.3.writing",
        prompt:
          "Ergänze selbst, um auszudrücken, dass man es von dieser Gruppe nicht erwartet hätte, und schreibe den ganzen Satz: ___ die erfahrene Gruppe brauchte mehr Zeit.",
        answer: "Selbst die erfahrene Gruppe brauchte mehr Zeit.",
        alternatives: ["Sogar die erfahrene Gruppe brauchte mehr Zeit."],
      },
    ],
  }),
  de("de.c.139", "Informationsdichte kontrollieren", {
    repair: {
      old: "Maximale Verdichtung ist nicht automatisch guter Stil.",
      source:
        "Die nach mehrfacher Prüfung bestätigten Abweichung erfordert eine neue Erklärung.",
      prompt:
        "Korrigiere die Endung des Partizipialattributs und schreibe den ganzen Satz: Die nach mehrfacher Prüfung bestätigten Abweichung erfordert eine neue Erklärung.",
      answer:
        "Die nach mehrfacher Prüfung bestätigte Abweichung erfordert eine neue Erklärung.",
    },
    examples: [
      "Die nach mehrfacher Prüfung bestätigte Abweichung erfordert eine neue Erklärung.",
      "Die Abweichung, die mehrfach geprüft wurde, erfordert eine neue Erklärung.",
    ],
    retrieval: [
      {
        taskId: "de.c.139.retrieve.3.writing",
        prompt:
          "Entfalte das Attribut zu einem Relativsatz mit wurde und schreibe den ganzen Satz: Die mehrfach geprüfte Abweichung erfordert eine neue Erklärung.",
        answer:
          "Die Abweichung, die mehrfach geprüft wurde, erfordert eine neue Erklärung.",
      },
    ],
  }),
  de("de.c.140", "Regionale Variation und Standardregister", {
    repair: {
      old: "Variation ist nicht automatisch ein Fehler; Kontext und Norm entscheiden.",
      source: "Gestern bin ich lange im Büro gesessen.",
      transformation: true,
      prompt:
        "Verwende für einen formellen Bericht in Deutschland das dort übliche Hilfsverb bei sitzen und schreibe den ganzen Satz: Gestern bin ich lange im Büro gesessen.",
      answer: "Gestern habe ich lange im Büro gesessen.",
    },
    examples: [
      "Gestern habe ich lange im Büro gesessen.",
      "Die Teilnehmenden saßen zwei Stunden im Labor.",
    ],
    retrieval: [
      {
        taskId: "de.c.140.retrieve.3.writing",
        prompt:
          "Ergänze sitzen im Präteritum für einen formellen Bericht und schreibe den ganzen Satz: Die Teilnehmenden ___ zwei Stunden im Labor.",
        answer: "Die Teilnehmenden saßen zwei Stunden im Labor.",
      },
    ],
  }),
  de("de.c.141", "Modalität und Evidentialität", {
    repair: {
      old: "Vermutung, Hörensagen und belegter Befund brauchen unterschiedliche Signale.",
      source:
        "Den vorliegenden Daten zufolge muss der Effekt überschätzt worden sein.",
      transformation: true,
      prompt:
        "Drücke mit dürfte statt muss eine vorsichtige Vermutung aus und schreibe den ganzen Satz: Den vorliegenden Daten zufolge muss der Effekt überschätzt worden sein.",
      answer:
        "Den vorliegenden Daten zufolge dürfte der Effekt überschätzt worden sein.",
    },
    examples: [
      "Den vorliegenden Daten zufolge dürfte der Effekt überschätzt worden sein.",
      "Der Autor soll die Daten selbst erhoben haben.",
    ],
    retrieval: [
      {
        taskId: "de.c.141.retrieve.3.writing",
        prompt:
          "Gib das Hörensagen mit sollen wieder und schreibe den ganzen Satz: Man sagt, der Autor hat die Daten selbst erhoben.",
        answer: "Der Autor soll die Daten selbst erhoben haben.",
      },
    ],
  }),
  de("de.c.142", "Textsortentransformation", {
    repair: {
      old: "Eine bloße Wortersetzung verändert die Textsorte noch nicht.",
      source: "Die Daten wurden von uns erhoben.",
      transformation: true,
      prompt:
        "Formuliere den Satz aus dem Bericht für einen Vortrag in der ersten Person Plural im Perfekt: Die Daten wurden von uns erhoben.",
      answer: "Wir haben die Daten erhoben.",
    },
    examples: [
      "Wir haben die Daten erhoben.",
      "Die Ergebnisse werden im Folgenden dargestellt.",
    ],
    retrieval: [
      {
        taskId: "de.c.142.retrieve.2.writing",
        prompt:
          "Formuliere den Satz für einen schriftlichen Bericht im Passiv und schreibe ihn vollständig: Wir stellen die Ergebnisse im Folgenden dar.",
        answer: "Die Ergebnisse werden im Folgenden dargestellt.",
      },
      {
        taskId: "de.c.142.retrieve.3.writing",
        prompt:
          "Formuliere den Satz für einen Vortrag in der ersten Person Plural im Präsens und schreibe ihn vollständig: Die Ergebnisse werden im Folgenden dargestellt.",
        answer: "Wir stellen die Ergebnisse im Folgenden dar.",
        alternatives: ["Im Folgenden stellen wir die Ergebnisse dar."],
      },
    ],
  }),
  de("de.c.143", "Syntaktischer Rhythmus", {
    repair: {
      old: "Rhythmus unterstützt Bedeutung; dekorative Variation ohne Funktion stört.",
      source:
        "Die These hat, obwohl mehrere Detailfragen noch offen sind, überzeugt.",
      transformation: true,
      prompt:
        "Entlaste die Satzklammer, indem du den obwohl-Satz ins Nachfeld stellst. Schreibe den ganzen Satz: Die These hat, obwohl mehrere Detailfragen noch offen sind, überzeugt.",
      answer:
        "Die These hat überzeugt, obwohl mehrere Detailfragen noch offen sind.",
    },
    examples: [
      "Die These überzeugt trotz offener Detailfragen im Kern.",
      "Die These hat überzeugt, obwohl mehrere Detailfragen noch offen sind.",
    ],
    retrieval: [
      {
        taskId: "de.c.143.retrieve.3.writing",
        prompt:
          "Stelle den Relativsatz ins Nachfeld und schreibe den ganzen Satz: Wir haben eine Lösung, die alle Beteiligten akzeptieren, gefunden.",
        answer:
          "Wir haben eine Lösung gefunden, die alle Beteiligten akzeptieren.",
      },
    ],
  }),
  de("de.c.144", "Fehlerdiagnose und präzise Reformulierung", {
    repair: {
      old: "Eine vollständige Neufassung kann den ursprünglichen Gedanken unnötig verändern.",
      source:
        "Die Ergebnisse, die wir gestern präsentiert haben, überzeugt alle Beteiligten.",
      prompt:
        "Korrigiere nur die eine fehlerhafte Form und schreibe den ganzen Satz: Die Ergebnisse, die wir gestern präsentiert haben, überzeugt alle Beteiligten.",
      answer:
        "Die Ergebnisse, die wir gestern präsentiert haben, überzeugen alle Beteiligten.",
    },
    examples: [
      "Aus dem unklaren Satz entsteht durch gezielte Reformulierung eine eindeutige Aussage.",
      "Die Ergebnisse, die wir gestern präsentiert haben, überzeugen alle Beteiligten.",
    ],
    retrieval: [
      {
        taskId: "de.c.144.retrieve.3.writing",
        prompt:
          "Ergänze die Form von werden, die zum Subjekt im Plural passt, und schreibe den ganzen Satz: Die Fragen, die gestern offen blieben, ___ heute geklärt.",
        answer: "Die Fragen, die gestern offen blieben, werden heute geklärt.",
      },
    ],
  }),
];

/** Equivalent contracted or full forms, each reviewed by hand (2026-11-01).
 * Generated candidates were rejected where contraction is impossible or the
 * instruction restricts the change; these are authored answers, not a rule. */
export const ACCEPTED_FORM_VERSION = "2026-11-01.2";
export const ACCEPTED_FORM_REVISIONS: readonly {
  readonly taskId: string;
  readonly answers: readonly string[];
}[] = [
  ["en.c.001.retrieve.mastery-20261031-0.writing", "I’m ready for the lesson."],
  ["en.c.001.retrieve.mastery-20261031-1.writing", "They’re at the station."],
  ["en.c.008.repair.0.writing", "She does not work."],
  ["en.c.010.repair.0.writing", "There’s a bank."],
  ["en.c.015.repair.0.writing", "I’m studying now."],
  [
    "en.c.015.retrieve.mastery-20261031-0.writing",
    "She’s studying for her exam.",
  ],
  [
    "en.c.015.retrieve.mastery-20261031-1.writing",
    "They’re preparing lunch right now.",
  ],
  ["en.c.020.repair.0.writing", "I’ll help."],
  ["en.c.021.repair.0.writing", "I’m going to study."],
  ["en.c.024.repair.content-20261101.writing", "I do not have any time."],
  [
    "en.c.034.retrieve.mastery-20261031-0.writing",
    "If it rains, we’ll stay at home.",
  ],
  [
    "en.c.034.retrieve.mastery-20261031-1.writing",
    "Unless you hurry, you’ll miss the bus.",
  ],
  [
    "en.c.048.retrieve.mastery-20261031-0.writing",
    "If I’d known, I would have helped you.",
  ],
  [
    "en.c.048.retrieve.mastery-20261031-1.writing",
    "If she’d left earlier, she would have caught the train.",
  ],
  ["en.c.049.repair.0.writing", "If I’d taken."],
  ["en.c.053.repair.content-20261101.writing", "He’s believed to be abroad."],
  [
    "en.c.061.repair.content-20261101.writing",
    "The findings are promising. What’s more, they confirm earlier studies.",
  ],
  [
    "en.c.073.repair.content-20261101.writing",
    "I did not need to take an umbrella, so I did not take one.",
  ],
  ["en.c.087.retrieve.1.writing", "She’s good at maths."],
  ["en.c.087.retrieve.2.writing", "I’m interested in photography."],
  ["en.c.087.retrieve.3.writing", "They’re worried about the exam."],
  ["en.c.087.repair.0.writing", "She’s good at maths."],
  ["en.c.090.retrieve.3.writing", "There’s a little milk left."],
  ["en.c.091.retrieve.1.writing", "I am visiting France in July."],
  ["en.c.091.retrieve.4.writing", "We do not work on Sundays."],
  ["en.c.093.retrieve.2.writing", "She’s used to working at night."],
  ["en.c.093.retrieve.3.writing", "They’re getting used to the weather."],
  ["en.c.093.repair.0.writing", "I’m used to working at night."],
  ["en.c.095.retrieve.4.writing", "He could not read the sign."],
  ["en.c.096.retrieve.4.writing", "She did not use to like coffee."],
  ["en.c.098.retrieve.4.writing", "He still has not replied."],
  ["en.c.100.retrieve.3.writing", "I’m thinking about the problem."],
  ["en.c.105.retrieve.3.writing", "She’s almost as tall as her sister."],
  ["en.c.106.retrieve.3.writing", "They wanted to know what we’d decided."],
  ["en.c.107.retrieve.2.writing", "She’ll probably accept."],
  ["en.c.107.retrieve.4.writing", "They’re unlikely to arrive before noon."],
  ["en.c.107.repair.0.writing", "She’ll probably accept."],
  ["en.c.109.retrieve.3.writing", "She’s believed to live abroad."],
  ["en.c.110.retrieve.3.writing", "They’re bound to notice the change."],
  [
    "en.c.110.retrieve.4.writing",
    "It’s highly unlikely that the result is random.",
  ],
  ["en.c.111.retrieve.2.writing", "I’d rather you did not mention it."],
  ["en.c.111.retrieve.4.writing", "I wish I’d accepted the offer."],
  ["en.c.120.retrieve.supplement.writing", "It’s useful to check the address."],
  ["en.c.120.repair.supplement.writing", "It’s raining outside."],
  ["en.c.122.retrieve.supplement.writing", "She’s a friend of mine."],
  ["en.c.122.vary.supplement.writing", "She’s a friend of hers."],
  ["en.c.122.repair.supplement.writing", "He’s a colleague of mine."],
].map(([taskId, answer]) => ({ taskId: taskId!, answers: [answer!] }));

/** The 2026-11-01 revision of one unit, for the Grammar Labs and the curriculum build. */
export function contentRevisionFor(
  language: Language,
  title: string,
): UnitContentRevision | undefined {
  return UNIT_CONTENT_REVISIONS.find(
    (row) => row.language === language && row.title === title,
  );
}
