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

/** One-gap items whose missing words the learner could not work out (Sie ist
 * ___.), each given a visible cue: the word in brackets, an instruction that
 * names it, or options of which only one fits (2026-11-01, W33). Where the gap
 * sat on a content word instead of the unit's target, it moved to the target;
 * a second example that only repeated the first became a new sentence. The
 * first answer fits the gap; further answers are reviewed equivalents. */
export const GAP_CUE_VERSION = "2026-11-01.3";
const setze =
  "Setze die fehlende Form ein und schreibe die vollständige Antwort auf Deutsch: ";
const zweites =
  "Wende die Form in einem zweiten kontrollierten Beispiel an. Ergänze die Lücke und schreibe die vollständige Antwort auf Deutsch: ";
export const GAP_CUE_REVISIONS: readonly {
  readonly taskId: string;
  readonly prompt: string;
  readonly answers?: readonly string[];
}[] = (
  [
    [
      "en.c.048.retrieve.mastery-20261031-1.forms-202611012.writing",
      "Use would and catch in the third conditional. Write the full sentence: If she had left earlier, she ___ the train. (catch)",
    ],
    [
      "en.c.085.retrieve.1.writing",
      "Complete the sentence with the possessive form of the name in brackets: This is _____ book. (Maya)",
    ],
    [
      "en.c.085.retrieve.2.writing",
      "Complete the sentence with the possessive form of the word in brackets: My _____ room is small. (brother)",
    ],
    [
      "en.c.085.retrieve.4.writing",
      "Complete the sentence with the possessive form of the word in brackets: The _____ bags are by the door. (children)",
    ],
    [
      "en.c.087.retrieve.2.forms-202611012.writing",
      "Complete the sentence with the right preposition: I am interested _____ photography.",
    ],
    [
      "en.c.088.retrieve.1.writing",
      "Say how you felt while you listened. Complete the sentence with bored or boring: I was _____ during the lecture.",
    ],
    [
      "en.c.088.retrieve.2.writing",
      "Complete the sentence with bored or boring: The lecture was _____.",
    ],
    [
      "en.c.088.retrieve.3.writing",
      "Complete the sentence with excited or exciting: We were _____ about the trip.",
    ],
    [
      "en.c.088.retrieve.4.writing",
      "Complete the sentence with surprised or surprising: The final scene was _____.",
    ],
    [
      "en.c.089.retrieve.1.writing",
      "Complete the sentence with the verb in brackets to show the purpose: I called _____ for your help. (ask)",
      "I called to ask for your help.",
      "I called in order to ask for your help.",
    ],
    [
      "en.c.089.retrieve.2.writing",
      "Complete the sentence with the verb in brackets to show the purpose: She went outside _____ some air. (get)",
      "She went outside to get some air.",
      "She went outside in order to get some air.",
    ],
    [
      "en.c.089.retrieve.3.writing",
      "Complete the sentence with the verb in brackets to show the purpose: We exercise _____ healthy. (stay)",
      "We exercise to stay healthy.",
      "We exercise in order to stay healthy.",
    ],
    [
      "en.c.089.retrieve.4.writing",
      "Complete the sentence with the verb in brackets to show the purpose: He saved money _____ a bicycle. (buy)",
      "He saved money to buy a bicycle.",
      "He saved money in order to buy a bicycle.",
    ],
    [
      "en.c.091.retrieve.1.forms-202611012.writing",
      "Complete the sentence with the word in brackets, using capital letters correctly: I’m visiting _____ in July. (france)",
    ],
    [
      "en.c.091.retrieve.2.writing",
      "Complete the sentence with the possessive form of the name in brackets, using capital letters correctly: _____ laptop is on the desk. (sarah)",
    ],
    [
      "en.c.091.retrieve.3.writing",
      "Complete the sentence with the possessive form of the plural word in brackets: The _____ projects are ready. (students)",
    ],
    [
      "en.c.092.retrieve.2.writing",
      "Complete the sentence: _____ the rain, we went out. (Despite / Although)",
    ],
    [
      "en.c.092.retrieve.3.writing",
      "Complete the sentence: The task was difficult; _____, we finished it. (however / although)",
    ],
    [
      "en.c.092.retrieve.4.writing",
      "Complete the sentence: _____ feeling tired, she continued. (In spite of / However)",
    ],
    [
      "en.c.093.retrieve.1.writing",
      "Write about a past state that is no longer true. Use used to and live: I _____ near the sea.",
    ],
    [
      "en.c.093.retrieve.2.forms-202611012.writing",
      "Say that working at night is normal for her. Use be used to and work: She is _____ at night.",
    ],
    [
      "en.c.093.retrieve.3.forms-202611012.writing",
      "Say that they are slowly becoming familiar with it. Use get used to: They are _____ the weather.",
    ],
    [
      "en.c.093.retrieve.4.writing",
      "Ask about a childhood habit. Use used to and play: Did you _____ outside?",
    ],
    [
      "en.c.094.retrieve.2.writing",
      "Complete the sentence with so or such: It was _____ an exciting film.",
    ],
    [
      "en.c.094.retrieve.4.writing",
      "Complete the sentence with so or such: We had _____ good weather.",
    ],
    [
      "en.c.095.retrieve.2.writing",
      "Say that they succeeded on one occasion. Use be able to: We _____ solve the problem.",
    ],
    [
      "en.c.095.retrieve.3.writing",
      "Say that she succeeded after trying. Use manage to: She _____ open the door.",
    ],
    [
      "en.c.096.retrieve.1.writing",
      "Write about a past state that has changed. Use used to: We _____ live in Madrid.",
    ],
    [
      "en.c.096.retrieve.3.writing",
      "Complete the sentence with the past simple of the verb in brackets: I _____ tennis every Saturday. (play)",
    ],
    [
      "en.c.096.retrieve.4.forms-202611012.writing",
      "Say that this past state was not true. Use not and use to: She _____ like coffee.",
    ],
    [
      "en.c.097.retrieve.1.writing",
      "Complete the sentence with the phrasal verb that means write the information on: Please _____ the form. (fill in / call off)",
    ],
    [
      "en.c.097.retrieve.2.writing",
      "Complete the sentence with the phrasal verb that means cancelled: They _____ the meeting. (called off / looked after)",
    ],
    [
      "en.c.097.retrieve.3.writing",
      "Complete the sentence with the phrasal verb that means take care of: Can you _____ my cat? (look after / fill in)",
    ],
    [
      "en.c.097.retrieve.4.writing",
      "Complete the sentence with the phrasal verb that means think of: We need to _____ a solution. (come up with / call off)",
    ],
    [
      "en.c.098.retrieve.1.writing",
      "Complete the sentence with just or yet: I have _____ finished.",
    ],
    [
      "en.c.098.retrieve.2.writing",
      "Complete the sentence with already or yet: She has _____ called.",
    ],
    [
      "en.c.098.retrieve.3.writing",
      "Complete the sentence with yet or still: Have they arrived _____?",
    ],
    [
      "en.c.098.retrieve.4.forms-202611012.writing",
      "Complete the sentence with still or yet: He _____ hasn’t replied.",
    ],
    [
      "en.c.100.retrieve.1.writing",
      "Use the verb in brackets in the correct present form: I _____ you. (believe)",
    ],
    [
      "en.c.100.retrieve.2.writing",
      "Use the verb in brackets in the correct present form: She _____ two bicycles. (own)",
    ],
    [
      "en.c.100.retrieve.3.forms-202611012.writing",
      "Use the verb in brackets in the correct present form: I _____ about the problem. (think)",
    ],
    [
      "en.c.100.retrieve.4.writing",
      "Use the verb in brackets in the correct present form: The soup _____ delicious. (taste)",
    ],
    [
      "en.c.101.retrieve.1.writing",
      "She is not a professional, but she sings well. Complete the sentence with as or like: She sings _____ a professional.",
    ],
    [
      "en.c.101.retrieve.4.writing",
      "Complete the sentence with as or like: It looks _____ rain.",
    ],
    [
      "en.c.102.retrieve.1.writing",
      "Use the verb in brackets with the right preposition: This book _____ me. (belong)",
    ],
    [
      "en.c.102.retrieve.2.writing",
      "Use the verb in brackets in the past simple with the right preposition: We _____ the proposal. (talk)",
    ],
    [
      "en.c.102.retrieve.3.writing",
      "Use the verb in brackets in the past simple with the right preposition: She _____ the delay. (apologize)",
      "She apologized for the delay.",
      "She apologised for the delay.",
    ],
    [
      "en.c.102.retrieve.4.writing",
      "Use the verb in brackets with the right preposition: I _____ your conclusion. (agree)",
    ],
    [
      "en.c.103.retrieve.1.writing",
      "Complete the sentence with fairly or absolutely: The room was _____ cold.",
    ],
    [
      "en.c.103.retrieve.2.writing",
      "Complete the sentence with absolutely or fairly: The water was _____ freezing.",
    ],
    [
      "en.c.103.retrieve.4.writing",
      "Complete the sentence: I was _____ tired after the journey. (a bit / absolutely)",
    ],
    [
      "en.c.104.retrieve.1.writing",
      "Write the sentence in typical British English with just and eat: I _____.",
      "I’ve just eaten.",
      "I have just eaten.",
    ],
    [
      "en.c.104.retrieve.2.writing",
      "Write the sentence in typical American English with just: I _____. (eat, past simple)",
      "I just ate.",
    ],
    [
      "en.c.105.retrieve.2.writing",
      "Complete the sentence with slightly or almost: Sales were _____ lower.",
    ],
    [
      "en.c.105.retrieve.3.forms-202611012.writing",
      "Complete the sentence with almost or slightly: She is _____ as tall as her sister.",
    ],
    [
      "en.c.105.retrieve.4.writing",
      "Complete the sentence with exactly or slightly: The result was _____ the same as before.",
    ],
    [
      "en.c.106.retrieve.1.writing",
      "Report the question “Where do you live?”: She asked _____.",
      "She asked where I lived.",
      "She asked me where I lived.",
    ],
    [
      "en.c.106.retrieve.2.writing",
      "Report the question “Are you ready?”: He asked _____.",
      "He asked if I was ready.",
      "He asked whether I was ready.",
      "He asked me if I was ready.",
      "He asked me whether I was ready.",
    ],
    [
      "en.c.106.retrieve.3.forms-202611012.writing",
      "Report the question “What have you decided?”: They wanted to know _____.",
    ],
    [
      "en.c.107.retrieve.1.writing",
      "Complete the sentence with definitely or unlikely: The train will _____ be late.",
    ],
    [
      "en.c.107.retrieve.2.forms-202611012.writing",
      "You think this is likely but not certain. Complete the sentence with probably or definitely: She will _____ accept.",
    ],
    [
      "en.c.107.retrieve.3.writing",
      "Complete the sentence: Prices are _____ rise. (likely to / probably)",
    ],
    [
      "en.c.107.retrieve.4.forms-202611012.writing",
      "Complete the sentence: They are _____ arrive before noon. (unlikely to / probably)",
    ],
    [
      "en.c.108.retrieve.1.writing",
      "He no longer smokes. Complete the sentence with stop and smoke: He _____.",
      "He stopped smoking.",
      "He has stopped smoking.",
      "He’s stopped smoking.",
    ],
    [
      "en.c.108.retrieve.2.writing",
      "He paused what he was doing in order to have a cigarette. Complete the sentence with stop and smoke: He _____.",
    ],
    [
      "en.c.108.retrieve.3.writing",
      "You met her in the past and you still have that memory. Complete the sentence with remember and meet: I _____ her.",
    ],
    [
      "en.c.108.retrieve.4.writing",
      "Tell someone not to forget this task. Complete the sentence with remember and lock: _____ the door.",
    ],
    [
      "en.c.109.retrieve.1.writing",
      "Use the present continuous passive of repair: The road _____.",
    ],
    [
      "en.c.109.retrieve.2.writing",
      "Use the future perfect passive of publish: The results _____ by noon.",
    ],
    [
      "en.c.109.retrieve.3.forms-202611012.writing",
      "Use believe in a passive reporting structure: She _____ to live abroad.",
    ],
    [
      "en.c.109.retrieve.4.writing",
      "Use should and the perfect passive of sign: The documents _____ earlier.",
    ],
    [
      "en.c.110.retrieve.2.writing",
      "Say that it is possible this happened. Use may and miss: She _____ the train.",
    ],
    [
      "en.c.110.retrieve.3.forms-202611012.writing",
      "Say that it is certain to happen. Use be bound to: They are _____ notice the change.",
    ],
    [
      "en.c.110.retrieve.4.forms-202611012.writing",
      "Say that the chance is very small. Use highly and likely: It is _____ that the result is random.",
    ],
    [
      "en.c.111.retrieve.1.writing",
      "Complete the sentence with the verb in brackets: It’s time we _____. (leave)",
    ],
    [
      "en.c.111.retrieve.2.forms-202611012.writing",
      "Complete the sentence with the negative of the verb in brackets: I’d rather you _____ it. (mention)",
    ],
    [
      "en.c.111.retrieve.3.writing",
      "Complete the sentence with the verb in brackets: She talks as though she _____ everything. (know)",
    ],
    [
      "en.c.111.retrieve.4.forms-202611012.writing",
      "Express regret about the past with the verb in brackets: I wish I _____ the offer. (accept)",
    ],
    [
      "en.c.112.retrieve.1.writing",
      "Put the noun object between the verb and the particle. Use radio and down: Turn the _____.",
    ],
    [
      "en.c.112.retrieve.2.writing",
      "Replace the radio with a pronoun. Use it and down: Turn _____.",
    ],
    [
      "en.c.112.retrieve.3.writing",
      "Complete the sentence with look after, which cannot be separated: She _____ her younger brother.",
    ],
    [
      "en.c.112.retrieve.4.writing",
      "Complete the sentence: We _____ time. (run out of, past simple)",
    ],
    ["de.c.001.retrieve.3.writing", zweites + "Sie ___ müde. (sein)"],
    ["de.c.003.retrieve.1.writing", setze + "Ich ___ Deutsch. (lernen)"],
    ["de.c.004.retrieve.1.writing", setze + "Du ___ nach Hause. (fahren)"],
    ["de.c.004.retrieve.3.writing", zweites + "Er ___ ein Buch. (lesen)"],
    ["de.c.005.retrieve.1.writing", setze + "Wo ___ du? (wohnen)"],
    ["de.c.006.retrieve.1.writing", setze + "___ du morgen? (kommen)"],
    [
      "de.c.007.retrieve.3.writing",
      "Ergänze den bestimmten Artikel und schreibe den ganzen Satz: ___ Buch ist neu.",
    ],
    ["de.c.009.retrieve.3.writing", zweites + "Ich kaufe ___ Tisch. (ein)"],
    ["de.c.010.retrieve.3.writing", zweites + "___ Kurs beginnt heute. (wir)"],
    [
      "de.c.011.retrieve.3.writing",
      zweites + "Ich komme heute ___. (nicht / kein)",
    ],
    [
      "de.c.013.retrieve.1.writing",
      setze + "Ich ___ um sieben Uhr auf. (aufstehen)",
    ],
    [
      "de.c.013.retrieve.3.writing",
      zweites + "Er ___ um sieben Uhr auf. (aufstehen)",
      "Er steht um sieben Uhr auf.",
    ],
    [
      "de.c.014.retrieve.3.writing",
      zweites + "Das Buch liegt ___ Tisch. (auf)",
    ],
    ["de.c.015.retrieve.1.writing", setze + "Ich habe gestern ___. (arbeiten)"],
    [
      "de.c.015.retrieve.3.writing",
      zweites + "Ich habe gestern Tennis ___. (spielen)",
      "Ich habe gestern Tennis gespielt.",
    ],
    [
      "de.c.016.retrieve.3.writing",
      zweites + "Wir sind nach Berlin ___. (fahren)",
    ],
    [
      "de.c.018.retrieve.3.writing",
      zweites + "Ich gebe ___ Mann das Buch. (der)",
    ],
    ["de.c.019.retrieve.1.writing", setze + "Das Bild hängt ___ Wand. (an)"],
    ["de.c.019.retrieve.3.writing", zweites + "Ich hänge es ___ Wand. (an)"],
    ["de.c.020.retrieve.1.writing", setze + "Ich ___ heute lernen. (müssen)"],
    ["de.c.021.retrieve.3.writing", zweites + "Das ist am ___. (gut)"],
    [
      "de.c.023.retrieve.1.writing",
      setze + "Ich glaube, dass er heute ___. (kommen)",
    ],
    [
      "de.c.023.retrieve.3.writing",
      zweites + "Ich weiß, dass sie morgen ___. (arbeiten)",
      "Ich weiß, dass sie morgen arbeitet.",
    ],
    [
      "de.c.025.retrieve.3.writing",
      zweites + "Ich interessiere ___ für Musik. (sich)",
    ],
    ["de.c.026.retrieve.1.writing", setze + "Der Kurs ist ___. (interessant)"],
    [
      "de.c.026.retrieve.3.writing",
      zweites + "Die Aufgabe ist ___. (schwierig)",
      "Die Aufgabe ist schwierig.",
    ],
    [
      "de.c.027.retrieve.1.writing",
      setze + "Morgen ___ ich mit dem Zug nach Berlin. (fahren)",
    ],
    [
      "de.c.027.retrieve.3.writing",
      zweites + "Heute ___ ich mit dem Bus zur Arbeit. (fahren)",
      "Heute fahre ich mit dem Bus zur Arbeit.",
    ],
    [
      "de.c.028.retrieve.1.writing",
      setze + "In Deutschland ___ man viel Kaffee. (trinken)",
    ],
    [
      "de.c.029.retrieve.1.writing",
      setze + "Er ___ die Tür und ging hinaus. (öffnen)",
    ],
    [
      "de.c.029.retrieve.3.writing",
      zweites + "Sie ___ das Fenster und schaute hinaus. (öffnen)",
      "Sie öffnete das Fenster und schaute hinaus.",
    ],
    [
      "de.c.030.retrieve.3.writing",
      zweites + "Nachdem ich ___ hatte, ging ich spazieren. (essen)",
    ],
    [
      "de.c.032.retrieve.3.writing",
      zweites + "Die Frau, mit ___ ich spreche, ist Ärztin.",
    ],
    [
      "de.c.033.retrieve.1.writing",
      setze + "Ich ___ gern mehr sprechen. (werden)",
    ],
    [
      "de.c.033.retrieve.3.writing",
      zweites + "Wir ___ gern länger bleiben. (werden)",
      "Wir würden gern länger bleiben.",
    ],
    ["de.c.035.retrieve.1.writing", setze + "Das Haus wird ___. (bauen)"],
    [
      "de.c.035.retrieve.3.writing",
      zweites + "Die Straße wird ___. (reparieren)",
      "Die Straße wird repariert.",
    ],
    ["de.c.036.retrieve.3.writing", zweites + "Es ist ___ worden. (bauen)"],
    [
      "de.c.038.retrieve.1.writing",
      setze + "Ich lerne, ___ die Prüfung zu bestehen. (um / damit)",
    ],
    [
      "de.c.038.retrieve.3.writing",
      zweites + "Ich erkläre es, ___ du es verstehst. (damit / um)",
    ],
    [
      "de.c.040.retrieve.3.writing",
      zweites + "Wir bleiben wegen des ___ zu Hause. (Wetter)",
      "Wir bleiben wegen des Wetters zu Hause.",
    ],
    [
      "de.c.041.retrieve.3.writing",
      zweites + "Ich spreche mit einem ___ Lehrer. (gut)",
      "Ich spreche mit einem guten Lehrer.",
    ],
    [
      "de.c.042.retrieve.3.writing",
      zweites + "Können Sie mir sagen, wann der Kurs ___? (beginnen)",
    ],
    [
      "de.c.044.retrieve.3.writing",
      zweites + "Der Bericht muss heute ___ werden. (schreiben)",
    ],
    ["de.c.045.retrieve.3.writing", zweites + "Die Tür ist ___. (schließen)"],
    [
      "de.c.046.retrieve.1.writing",
      "Bilde aus dem Verb in Klammern ein Nomen und schreibe den ganzen Satz: Die ___ der Studie dauert ein Jahr. (durchführen)",
      "Die Durchführung der Studie dauert ein Jahr.",
    ],
    [
      "de.c.046.retrieve.3.writing",
      "Bilde aus dem Verb in Klammern ein Nomen und schreibe den ganzen Satz: Nach der ___ der Daten beginnt die Analyse. (erheben)",
      "Nach der Erhebung der Daten beginnt die Analyse.",
    ],
    [
      "de.c.047.retrieve.1.writing",
      setze + "Ich spreche mit dem ___. (Student)",
      "Ich spreche mit dem Studenten.",
    ],
    [
      "de.c.047.retrieve.3.writing",
      zweites + "Ich sehe den ___. (Kollege)",
      "Ich sehe den Kollegen.",
    ],
    [
      "de.c.048.retrieve.1.writing",
      setze + "Die ___ Gäste setzen sich. (warten)",
      "Die wartenden Gäste setzen sich.",
    ],
    [
      "de.c.048.retrieve.3.writing",
      zweites + "Bitte öffne die ___ Tür. (schließen)",
      "Bitte öffne die geschlossene Tür.",
    ],
    [
      "de.c.050.retrieve.3.writing",
      zweites + "Sie spricht sowohl Deutsch ___ Englisch.",
    ],
    [
      "de.c.051.retrieve.3.writing",
      zweites +
        "Das Thema, ___ wir sprechen, betrifft alle Studierenden. (über)",
    ],
    ["de.c.052.retrieve.3.writing", zweites + "Worauf ___ du? (warten)"],
    [
      "de.c.053.retrieve.3.writing",
      zweites + "Sie sagt, sie ___ müde. (sein)",
      "Sie sagt, sie sei müde.",
    ],
    [
      "de.c.054.retrieve.1.writing",
      "Ergänze das passende Funktionsverb und schreibe den ganzen Satz: Wir müssen bald eine Entscheidung ___. (treffen / machen)",
      "Wir müssen bald eine Entscheidung treffen.",
    ],
    [
      "de.c.054.retrieve.3.writing",
      "Ergänze das passende Funktionsverb und schreibe den ganzen Satz: Wir sollten diese Möglichkeit in Betracht ___. (ziehen / nehmen)",
      "Wir sollten diese Möglichkeit in Betracht ziehen.",
    ],
    [
      "de.c.055.retrieve.3.writing",
      zweites + "Ich habe ___ gestern gegeben. (es, ihm)",
    ],
    [
      "de.c.056.retrieve.3.writing",
      zweites +
        "Die Daten sind begrenzt; ___ ist der Trend klar. (dennoch / deshalb)",
    ],
    [
      "de.c.057.retrieve.3.writing",
      zweites + "Die Autorin erklärt, die Ergebnisse ___ vorläufig. (sein)",
    ],
    [
      "de.c.058.retrieve.3.writing",
      zweites + "Sie dürfte ___ sein. (ankommen)",
    ],
    [
      "de.c.059.retrieve.1.writing",
      setze + "Das Problem ___ sich lösen. (lassen)",
    ],
    [
      "de.c.059.retrieve.3.writing",
      zweites + "Die Aufgabe ist zu ___. (erledigen)",
    ],
    [
      "de.c.060.retrieve.1.writing",
      setze + "Wir analysieren die im Rahmen der Studie ___ Daten. (erheben)",
      "Wir analysieren die im Rahmen der Studie erhobenen Daten.",
    ],
    [
      "de.c.060.retrieve.3.writing",
      zweites +
        "Die von der Kommission ___ Maßnahmen treten morgen in Kraft. (beschließen)",
      "Die von der Kommission beschlossenen Maßnahmen treten morgen in Kraft.",
    ],
    [
      "de.c.061.retrieve.3.writing",
      zweites +
        "Von den Ergebnissen ___, schlagen wir eine neue Untersuchung vor. (ausgehen)",
    ],
    [
      "de.c.062.retrieve.1.writing",
      setze + "Ich spreche mit Frau Müller, ___. (die Projektleiterin)",
      "Ich spreche mit Frau Müller, der Projektleiterin.",
    ],
    [
      "de.c.062.retrieve.3.writing",
      zweites + "Wir danken Herrn Kaya, ___. (unser Kollege)",
      "Wir danken Herrn Kaya, unserem Kollegen.",
    ],
    [
      "de.c.063.retrieve.3.writing",
      zweites + "Besonders wichtig ___ die regelmäßige Wiederholung. (sein)",
    ],
    [
      "de.c.064.retrieve.3.writing",
      zweites +
        "Es hat sich gezeigt, dass regelmäßiger Abruf entscheidend ___. (sein)",
    ],
    [
      "de.c.065.retrieve.1.writing",
      setze +
        "___ die Stichprobe klein ist, sind die Ergebnisse relevant. (Wenngleich / Weil)",
    ],
    [
      "de.c.065.retrieve.3.writing",
      zweites +
        "___ die Kosten hoch sind, lohnt sich die Investition. (Obgleich / Damit)",
      "Obgleich die Kosten hoch sind, lohnt sich die Investition.",
    ],
    [
      "de.c.066.retrieve.1.writing",
      setze +
        "Die Daten ___ nahe, dass weitere Untersuchungen erforderlich sind. (nahelegen)",
    ],
    [
      "de.c.066.retrieve.3.writing",
      zweites +
        "Die Ergebnisse ___ zu bestätigen, dass die Methode wirkt. (scheinen)",
      "Die Ergebnisse scheinen zu bestätigen, dass die Methode wirkt.",
    ],
    [
      "de.c.067.retrieve.2.writing",
      "Ergänze die Lücke, sodass der Text zusammenhängt. Schreibe den vollständigen deutschen Text: Die Finanzierung fehlt. ___ Faktor kann das Projekt verzögern. (solch)",
    ],
    [
      "de.c.067.retrieve.3.writing",
      "Überarbeite ein zweites kontrolliertes Textbeispiel. Ergänze die Lücke und schreibe den vollständigen deutschen Text: Viele Teilnehmende brachen ab. ___ Problem muss gelöst werden. (dies)",
      "Viele Teilnehmende brachen ab. Dieses Problem muss gelöst werden.",
    ],
    [
      "de.c.068.retrieve.3.writing",
      zweites + "___ Sie mir die Unterlagen schicken? (können, höflich)",
      "Könnten Sie mir die Unterlagen schicken?",
    ],
    [
      "de.c.070.retrieve.1.writing",
      setze +
        "Wir müssen die Studie planen, ___ und auswerten. (die Durchführung)",
      "Wir müssen die Studie planen, durchführen und auswerten.",
    ],
    [
      "de.c.070.retrieve.3.writing",
      zweites +
        "Die Planung, die ___ und die Auswertung dauern ein Jahr. (durchführen)",
      "Die Planung, die Durchführung und die Auswertung dauern ein Jahr.",
    ],
    [
      "de.c.071.retrieve.3.writing",
      zweites +
        "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen ___. (haben)",
      "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.",
      "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hätte.",
    ],
    [
      "de.c.072.retrieve.3.writing",
      zweites +
        "Dieses Ergebnis, das muss betont werden, ___ vorläufig. (sein)",
    ],
    [
      "de.c.073.retrieve.1.writing",
      setze +
        "Obwohl die Studie klein war, ___ ihre Methode, weil sie transparent dokumentiert wurde, was wiederum die Replikation erleichterte. (überzeugen, Präteritum)",
    ],
    [
      "de.c.073.retrieve.3.writing",
      zweites +
        "Obwohl die Studie klein war, überzeugte ihre Methode, weil sie transparent ___ wurde, was wiederum die Replikation erleichterte. (dokumentieren)",
    ],
    [
      "de.c.074.retrieve.3.writing",
      zweites + "Einige ___ zu, andere nicht. (zustimmen, Präteritum)",
    ],
    [
      "de.c.076.retrieve.3.writing",
      zweites +
        "Die Forscherin informierte die ___, die ausgewählt worden war. (Teilnehmerin / Teilnehmerinnen)",
    ],
    [
      "de.c.077.retrieve.1.writing",
      "Ergänze das übliche Verb und schreibe den ganzen Satz: Wer leitet, muss Verantwortung ___. (übernehmen / machen)",
      "Wer leitet, muss Verantwortung übernehmen.",
    ],
    [
      "de.c.078.retrieve.1.writing",
      "Ergänze die Lücke, sodass der Text zusammenhängt. Schreibe den vollständigen deutschen Text: Der Bericht ___ den Ausgangszustand, bewertet die Ergebnisse und empfiehlt konkrete Maßnahmen. (beschreiben)",
    ],
    [
      "de.c.078.retrieve.2.writing",
      "Ergänze die Lücke, sodass der Text zusammenhängt. Schreibe den vollständigen deutschen Text: Der Antrag begründet den Bedarf und ___ einen überprüfbaren Zeitplan. (nennen)",
    ],
    [
      "de.c.079.retrieve.3.writing",
      zweites +
        "Die 2025 ___, mehrfach zitierte Studie bestätigt den langfristigen Effekt. (veröffentlichen)",
    ],
    [
      "de.c.080.retrieve.3.writing",
      zweites +
        "___ Sie so freundlich, mir die Unterlagen bis Freitag zu senden? (sein, höflich)",
    ],
    [
      "de.c.083.retrieve.3.writing",
      zweites +
        "Ich habe Interesse ___ einer Mitarbeit im Forschungsprojekt. (an / in)",
    ],
    [
      "de.c.084.retrieve.1.writing",
      setze +
        "Die Methode spart Zeit, ___ setzt sie geschulte Fachkräfte voraus. (allerdings / deshalb)",
      "Die Methode spart Zeit, allerdings setzt sie geschulte Fachkräfte voraus.",
    ],
    [
      "de.c.084.retrieve.3.writing",
      zweites +
        "Zuerst fassen wir die Ergebnisse zusammen; ___ diskutieren wir offene Fragen. (anschließend / obwohl)",
      "Zuerst fassen wir die Ergebnisse zusammen; anschließend diskutieren wir offene Fragen.",
    ],
    [
      "de.c.086.retrieve.1.writing",
      setze + "Ich ___ jeden Morgen um sieben Uhr auf. (aufstehen)",
    ],
    [
      "de.c.089.retrieve.1.writing",
      setze + "Ich ___ abends oft Deutsch. (lernen)",
    ],
    [
      "de.c.091.retrieve.1.writing",
      setze + "In Deutschland ___ man viel Kaffee. (trinken)",
    ],
    [
      "de.c.091.retrieve.content-20261101-3.writing",
      "Ergänze die Form von essen zu man und schreibe den ganzen Satz: Im Kino ___ man oft Popcorn. (essen)",
    ],
    [
      "de.c.096.retrieve.1.writing",
      setze + "Das ist die Frau, ___ nebenan wohnt.",
    ],
    [
      "de.c.098.retrieve.1.writing",
      setze + "Ich bin müde. Deshalb ___ ich früh ins Bett. (gehen)",
    ],
    [
      "de.c.102.retrieve.1.writing",
      setze + "Morgen ___ ich länger arbeiten. (werden)",
    ],
    [
      "de.c.111.retrieve.1.writing",
      setze + "Ich ___ mein Fahrrad reparieren. (lassen)",
    ],
    [
      "de.c.116.retrieve.1.writing",
      "Ergänze die Modalpartikel für eine freundliche Einladung und schreibe den ganzen Satz: Komm ___ morgen kurz vorbei.",
    ],
    [
      "de.c.117.retrieve.1.writing",
      "Ergänze den Konnektor für „direkt nachdem“ und schreibe den ganzen Satz: ___ die Ergebnisse vorliegen, informieren wir alle Beteiligten. (Sobald / Solange)",
    ],
    [
      "de.c.117.retrieve.content-20261101-3.writing",
      "Ergänze den Konnektor für die gleiche Dauer und schreibe den ganzen Satz: ___ das Projekt läuft, bleibt das Büro geöffnet. (Solange / Sobald)",
    ],
    [
      "de.c.119.retrieve.content-20261101-3.writing",
      "Ergänze den Konnektor für die Ursache und schreibe den ganzen Satz: ___ der Zug ausfiel, kamen wir zu spät. (Da / Obwohl)",
    ],
    [
      "de.c.122.retrieve.1.writing",
      "Ergänze die Genitivpräposition für „in Bezug auf“ und schreibe den ganzen Satz: ___ der Ergebnisse bleiben mehrere Fragen offen. (Hinsichtlich / Mittels)",
      "Hinsichtlich der Ergebnisse bleiben mehrere Fragen offen.",
      "Bezüglich der Ergebnisse bleiben mehrere Fragen offen.",
    ],
    [
      "de.c.123.retrieve.content-20261101-3.writing",
      "Ergänze das Funktionsverb zu einen Antrag und schreibe den ganzen Satz: Wir ___ morgen einen Antrag. (stellen / treffen)",
    ],
    [
      "de.c.124.retrieve.1.writing",
      setze + "Besonders wichtig ___ die transparente Dokumentation. (sein)",
    ],
    [
      "de.c.130.retrieve.1.writing",
      "Ergänze sollte für eine Bedingung ohne wenn und schreibe den ganzen Satz: ___ weitere Daten verfügbar werden, ließe sich die Hypothese erneut prüfen.",
    ],
    [
      "de.c.137.retrieve.1.writing",
      setze + "___ Ergebnisse waren signifikant. (nicht, alle)",
    ],
    [
      "de.c.140.retrieve.content-20261101-3.writing",
      "Ergänze sitzen im Präteritum für einen formellen Bericht und schreibe den ganzen Satz: Die Teilnehmenden ___ zwei Stunden im Labor. (sitzen)",
    ],
  ] as const
).map(([taskId, prompt, ...answers]) =>
  answers.length ? { taskId, prompt, answers } : { taskId, prompt },
);

/** Two more checkable written items for each English unit whose only closed
 * item was its repair (2026-11-01, W33). Most offer two options of which only
 * one fits, so the other is recognised as wrong; the rest name the word to use.
 * The first answer fits the gap; further answers are reviewed equivalents. */
export const CHECKED_PRACTICE_VERSION = "2026-11-01.4";
/** The second round (2026-11-01.5): the English units that still had none of
 * these (the Lab showed "State the rule" there) and the two German units with
 * fewer than three checkable items. */
export const RECALL_VERSION = "2026-11-01.5";
export const CHECKED_PRACTICE: readonly {
  readonly unit: string;
  readonly prompt: string;
  readonly answers: readonly string[];
  readonly version: string;
}[] = [
  ...(
    [
    [
      "en.c.002",
      "Complete the sentence: ___ lives near the station. (He / Him)",
      "He lives near the station.",
    ],
    [
      "en.c.002",
      "Complete the sentence: My sister and I are students. ___ study at the same school. (We / Us)",
      "My sister and I are students. We study at the same school.",
    ],
    [
      "en.c.003",
      "Complete the sentence with a or an: She is ___ engineer.",
      "She is an engineer.",
    ],
    [
      "en.c.003",
      "Complete the sentence: I bought a lamp. ___ lamp is in my bedroom. (The / A)",
      "I bought a lamp. The lamp is in my bedroom.",
    ],
    [
      "en.c.004",
      "Write the plural of the noun in brackets: There are three ___ on the table. (box)",
      "There are three boxes on the table.",
    ],
    [
      "en.c.004",
      "Write the plural of the noun in brackets: Two ___ are waiting outside. (child)",
      "Two children are waiting outside.",
    ],
    [
      "en.c.005",
      "Complete the sentence with my or mine: This is ___ phone.",
      "This is my phone.",
    ],
    [
      "en.c.005",
      "Complete the sentence: ___ house is new. (Their / They)",
      "Their house is new.",
    ],
    [
      "en.c.006",
      "Complete the sentence with have or has: She ___ a car.",
      "She has a car.",
    ],
    [
      "en.c.006",
      "Complete the sentence with have or has: I ___ got a brother.",
      "I have got a brother.",
      "I’ve got a brother.",
    ],
    [
      "en.c.007",
      "Use the verb in brackets in the present simple: He ___ every day. (study)",
      "He studies every day.",
    ],
    [
      "en.c.007",
      "Use the verb in brackets in the present simple: She ___ to work by bus. (go)",
      "She goes to work by bus.",
    ],
    [
      "en.c.008",
      "Complete the sentence with don’t or doesn’t: She ___ work here.",
      "She doesn’t work here.",
      "She does not work here.",
    ],
    [
      "en.c.008",
      "Complete the sentence with don’t or doesn’t: I ___ drive.",
      "I don’t drive.",
      "I do not drive.",
    ],
    [
      "en.c.009",
      "Complete the question with Do or Does: ___ he speak English?",
      "Does he speak English?",
    ],
    [
      "en.c.009",
      "Complete the question with Do or Does: ___ you live here?",
      "Do you live here?",
    ],
    [
      "en.c.010",
      "Complete the sentence with is or are: There ___ two parks near my flat.",
      "There are two parks near my flat.",
    ],
    [
      "en.c.010",
      "Complete the sentence with is or are: There ___ a bank on this street.",
      "There is a bank on this street.",
      "There’s a bank on this street.",
    ],
    [
      "en.c.011",
      "Use can and the verb in brackets: I ___ very well. (swim)",
      "I can swim very well.",
    ],
    [
      "en.c.011",
      "Complete the sentence with can or can’t: I ___ come tomorrow because I am working.",
      "I can’t come tomorrow because I am working.",
      "I cannot come tomorrow because I am working.",
    ],
    [
      "en.c.012",
      "Complete the instruction: ___ worry about the test. (Don’t / Not)",
      "Don’t worry about the test.",
      "Do not worry about the test.",
    ],
    [
      "en.c.012",
      "Use the verb in brackets as an instruction: ___ the door, please. (open)",
      "Open the door, please.",
    ],
    [
      "en.c.013",
      "Complete the sentence with in or at: The milk is ___ the fridge.",
      "The milk is in the fridge.",
    ],
    [
      "en.c.013",
      "Complete the sentence with under or between: The cat is ___ the bed.",
      "The cat is under the bed.",
    ],
    [
      "en.c.014",
      "Complete the question with much or many: How ___ water do you drink?",
      "How much water do you drink?",
    ],
    [
      "en.c.014",
      "Complete the sentence with much or many: There aren’t ___ chairs in the room.",
      "There aren’t many chairs in the room.",
      "There are not many chairs in the room.",
    ],
    [
      "en.c.016",
      "Use the verb in brackets in the present continuous for now: Look! It ___. (rain)",
      "Look! It is raining.",
      "Look! It’s raining.",
    ],
    [
      "en.c.016",
      "Use the verb in brackets in the present simple for a routine: She ___ to work every day. (drive)",
      "She drives to work every day.",
    ],
    [
      "en.c.017",
      "Use the past simple of the verb in brackets: They ___ the museum on Sunday. (visit)",
      "They visited the museum on Sunday.",
    ],
    [
      "en.c.017",
      "Use the past simple of the verb in brackets: I ___ my grandmother yesterday. (call)",
      "I called my grandmother yesterday.",
    ],
    [
      "en.c.018",
      "Use the past simple of the verb in brackets: She ___ an email last night. (write)",
      "She wrote an email last night.",
    ],
    [
      "en.c.018",
      "Use the past simple of the verb in brackets: We ___ home early yesterday. (go)",
      "We went home early yesterday.",
    ],
    [
      "en.c.019",
      "Use didn’t and the verb in brackets: I ___ him at the party. (see)",
      "I didn’t see him at the party.",
      "I did not see him at the party.",
    ],
    [
      "en.c.019",
      "Complete the question with Did or Do: ___ you call her yesterday?",
      "Did you call her yesterday?",
    ],
    [
      "en.c.020",
      "Use will and the verb in brackets for a promise: I ___ you tomorrow. (help)",
      "I will help you tomorrow.",
      "I’ll help you tomorrow.",
    ],
    [
      "en.c.020",
      "Use will and the verb in brackets for a prediction: I think it ___ later. (rain)",
      "I think it will rain later.",
      "I think it’ll rain later.",
    ],
    [
      "en.c.021",
      "Use be going to and the verb in brackets for a plan: I ___ German next year. (study)",
      "I am going to study German next year.",
      "I’m going to study German next year.",
    ],
    [
      "en.c.021",
      "Use be going to and the verb in brackets: Look at those clouds! It ___. (rain)",
      "Look at those clouds! It is going to rain.",
      "Look at those clouds! It’s going to rain.",
    ],
    [
      "en.c.022",
      "Use the comparative of the adjective in brackets: This book is ___ than that one. (easy)",
      "This book is easier than that one.",
    ],
    [
      "en.c.022",
      "Use the comparative of the adjective in brackets: Trains are ___ than buses. (comfortable)",
      "Trains are more comfortable than buses.",
    ],
    [
      "en.c.023",
      "Use the superlative of the adjective in brackets: It is ___ app on my phone. (useful)",
      "It is the most useful app on my phone.",
    ],
    [
      "en.c.023",
      "Use the superlative of the adjective in brackets: This is ___ room in the house. (small)",
      "This is the smallest room in the house.",
    ],
    [
      "en.c.024",
      "Complete the sentence with some or any: I have ___ questions about the homework.",
      "I have some questions about the homework.",
    ],
    [
      "en.c.024",
      "Complete the sentence with some or any: We don’t have ___ milk left.",
      "We don’t have any milk left.",
      "We do not have any milk left.",
    ],
    [
      "en.c.025",
      "Complete the sentence with much or many: She has ___ ideas for the project.",
      "She has many ideas for the project.",
    ],
    [
      "en.c.025",
      "Complete the sentence with much or many: We don’t have ___ time.",
      "We don’t have much time.",
      "We do not have much time.",
    ],
    [
      "en.c.026",
      "Put usually in the right place: She ___ early. (is, usually)",
      "She is usually early.",
    ],
    [
      "en.c.026",
      "Put always in the right place: We ___ breakfast at home. (always, have)",
      "We always have breakfast at home.",
    ],
    [
      "en.c.027",
      "Complete the sentence with them or they: I saw ___ at the station.",
      "I saw them at the station.",
    ],
    [
      "en.c.027",
      "Complete the question with me or I: Can you help ___?",
      "Can you help me?",
    ],
    [
      "en.c.028",
      "Use have to and the verb in brackets for a rule at work: I ___ a uniform at work. (wear)",
      "I have to wear a uniform at work.",
    ],
    [
      "en.c.028",
      "Use must and the verb in brackets for strong advice: You ___ careful on this road. (be)",
      "You must be careful on this road.",
    ],
    [
      "en.c.029",
      "Use the present perfect of the verb in brackets: She ___ in Paris since 2020. (work)",
      "She has worked in Paris since 2020.",
      "She’s worked in Paris since 2020.",
    ],
    [
      "en.c.029",
      "Use the present perfect of the verb in brackets: I ___ this film before. (see)",
      "I have seen this film before.",
      "I’ve seen this film before.",
    ],
    [
      "en.c.030",
      "Use the past simple or the present perfect of the verb in brackets: I ___ it yesterday. (see)",
      "I saw it yesterday.",
    ],
    [
      "en.c.030",
      "Use the past simple or the present perfect of the verb in brackets: I ___ to Japan twice so far. (be)",
      "I have been to Japan twice so far.",
      "I’ve been to Japan twice so far.",
    ],
    [
      "en.c.031",
      "Complete the sentence with for or since: I have lived here ___ 2024.",
      "I have lived here since 2024.",
    ],
    [
      "en.c.031",
      "Complete the sentence with for or since: She has worked here ___ two years.",
      "She has worked here for two years.",
    ],
    [
      "en.c.032",
      "Use the past continuous of the verb in brackets: They ___ TV at eight o’clock last night. (watch)",
      "They were watching TV at eight o’clock last night.",
    ],
    [
      "en.c.032",
      "Use the past continuous of the verb in brackets: She ___ dinner when I arrived. (cook)",
      "She was cooking dinner when I arrived.",
    ],
    [
      "en.c.033",
      "Use the past simple of the verb in brackets for the interrupting event: I was walking home when it ___ to rain. (start)",
      "I was walking home when it started to rain.",
    ],
    [
      "en.c.033",
      "Use the past continuous of the verb in brackets for the background: She ___ when the lights went out. (read)",
      "She was reading when the lights went out.",
    ],
    [
      "en.c.035",
      "Use the past simple of the verb in brackets: If I ___ more time, I would study German. (have)",
      "If I had more time, I would study German.",
    ],
    [
      "en.c.035",
      "Use would and the verb in brackets: If she lived closer, she ___ us more often. (visit)",
      "If she lived closer, she would visit us more often.",
      "If she lived closer, she’d visit us more often.",
    ],
    [
      "en.c.036",
      "Complete the sentence with who or which: The woman ___ called is my teacher.",
      "The woman who called is my teacher.",
    ],
    [
      "en.c.036",
      "Complete the sentence with who or which: This is the book ___ changed my mind.",
      "This is the book which changed my mind.",
    ],
    [
      "en.c.037",
      "Use the verb in brackets after enjoy: I enjoy ___ in the park. (walk)",
      "I enjoy walking in the park.",
    ],
    [
      "en.c.037",
      "Use the verb in brackets after decided: She decided ___ early. (leave)",
      "She decided to leave early.",
    ],
    [
      "en.c.038",
      "Use should and the verb in brackets: You ___ more water. (drink)",
      "You should drink more water.",
    ],
    [
      "en.c.038",
      "Use shouldn’t and the verb in brackets: You ___ so late. (stay up)",
      "You shouldn’t stay up so late.",
      "You should not stay up so late.",
    ],
    [
      "en.c.039",
      "Use the present simple passive of the verb in brackets: English ___ in many countries. (speak)",
      "English is spoken in many countries.",
    ],
    [
      "en.c.039",
      "Use the past simple passive of the verb in brackets: The letter ___ last week. (send)",
      "The letter was sent last week.",
    ],
    [
      "en.c.040",
      "Report the statement “I am tired.”: She said that she ___.",
      "She said that she was tired.",
    ],
    [
      "en.c.040",
      "Report the statement “We live in Leeds.”: They said that they ___ in Leeds.",
      "They said that they lived in Leeds.",
    ],
    [
      "en.c.041",
      "Complete the question tag: She works here, ___? (doesn’t she / isn’t she)",
      "She works here, doesn’t she?",
    ],
    [
      "en.c.041",
      "Complete the question tag: They can swim, ___? (can’t they / don’t they)",
      "They can swim, can’t they?",
    ],
    [
      "en.c.042",
      "Complete the sentence with too or enough: The water is warm ___ for swimming.",
      "The water is warm enough for swimming.",
    ],
    [
      "en.c.042",
      "Complete the sentence with too or enough: It is ___ cold to go out.",
      "It is too cold to go out.",
    ],
    [
      "en.c.043",
      "Use the present perfect continuous of the verb in brackets: She ___ for two hours. (study)",
      "She has been studying for two hours.",
      "She’s been studying for two hours.",
    ],
    [
      "en.c.043",
      "Use the present perfect continuous of the verb in brackets: It ___ all day. (rain)",
      "It has been raining all day.",
      "It’s been raining all day.",
    ],
    [
      "en.c.044",
      "Use the past perfect of the verb in brackets: When we arrived, the film ___. (start)",
      "When we arrived, the film had started.",
    ],
    [
      "en.c.044",
      "Use the past perfect of the verb in brackets: She ___ the book before she saw the film. (read)",
      "She had read the book before she saw the film.",
    ],
    [
      "en.c.045",
      "Use the past perfect continuous of the verb in brackets: She ___ for an hour when the bus came. (wait)",
      "She had been waiting for an hour when the bus came.",
    ],
    [
      "en.c.045",
      "Use the past perfect continuous of the verb in brackets: They were tired because they ___ all day. (work)",
      "They were tired because they had been working all day.",
    ],
    [
      "en.c.046",
      "Use the future continuous of the verb in brackets: This time tomorrow, I ___ to Rome. (fly)",
      "This time tomorrow, I will be flying to Rome.",
      "This time tomorrow, I’ll be flying to Rome.",
    ],
    [
      "en.c.046",
      "Use the future continuous of the verb in brackets: At nine tonight, we ___ dinner. (have)",
      "At nine tonight, we will be having dinner.",
      "At nine tonight, we’ll be having dinner.",
    ],
    [
      "en.c.047",
      "Use the future perfect of the verb in brackets: By June, they ___ the new library. (build)",
      "By June, they will have built the new library.",
      "By June, they’ll have built the new library.",
    ],
    [
      "en.c.047",
      "Use the future perfect of the verb in brackets: By the time you arrive, we ___ dinner. (cook)",
      "By the time you arrive, we will have cooked dinner.",
      "By the time you arrive, we’ll have cooked dinner.",
    ],
    [
      "en.c.049",
      "Use the past perfect of the verb in brackets: If I ___ the job, I would live in Berlin now. (take)",
      "If I had taken the job, I would live in Berlin now.",
      "If I’d taken the job, I would live in Berlin now.",
    ],
    [
      "en.c.049",
      "Use would and the verb in brackets for a present result: If she had studied medicine, she ___ a doctor now. (be)",
      "If she had studied medicine, she would be a doctor now.",
      "If she had studied medicine, she’d be a doctor now.",
    ],
    [
      "en.c.050",
      "Her light is on and her phone is engaged. Complete the sentence with must or can’t: She ___ be busy.",
      "She must be busy.",
    ],
    [
      "en.c.050",
      "He has never studied this topic. Complete the sentence with must or can’t: He ___ know the answer.",
      "He can’t know the answer.",
      "He cannot know the answer.",
    ],
    [
      "en.c.051",
      "Use must have and the verb in brackets: The door is open; they ___ to lock it. (forget)",
      "The door is open; they must have forgotten to lock it.",
    ],
    [
      "en.c.051",
      "Use can’t have and the verb in brackets: She ___ the email; she was offline all day. (read)",
      "She can’t have read the email; she was offline all day.",
      "She cannot have read the email; she was offline all day.",
    ],
    [
      "en.c.052",
      "Use had, the object and the past participle of the verb in brackets: She ___ last week. (her hair, cut)",
      "She had her hair cut last week.",
    ],
    [
      "en.c.052",
      "Use have, the object and the past participle of the verb in brackets: We are going to ___ next month. (the house, paint)",
      "We are going to have the house painted next month.",
      "We are going to get the house painted next month.",
    ],
    [
      "en.c.053",
      "Use believe in a passive reporting structure: The painting ___ to be very old.",
      "The painting is believed to be very old.",
    ],
    [
      "en.c.053",
      "Use should and the passive of the verb in brackets: The work ___ by Friday. (complete)",
      "The work should be completed by Friday.",
    ],
    [
      "en.c.054",
      "Use having and the past participle of the verb in brackets: ___ the report, she went home. (finish)",
      "Having finished the report, she went home.",
    ],
    [
      "en.c.054",
      "Use a past participle clause with the verb in brackets: ___ in 1900, the house needs repairs. (build)",
      "Built in 1900, the house needs repairs.",
    ],
    [
      "en.c.055",
      "Use the past simple of the verb in brackets after wish: I wish I ___ the answer. (know)",
      "I wish I knew the answer.",
    ],
    [
      "en.c.055",
      "Use the past perfect of the verb in brackets after if only: If only I ___ to your advice. (listen)",
      "If only I had listened to your advice.",
      "If only I’d listened to your advice.",
    ],
    [
      "en.c.056",
      "Complete the sentence: Never ___ seen such a result. (have I / I have)",
      "Never have I seen such a result.",
    ],
    [
      "en.c.056",
      "Complete the sentence: Rarely ___ such a clear answer. (do we hear / we hear)",
      "Rarely do we hear such a clear answer.",
    ],
    [
      "en.c.057",
      "Complete the sentence with who or which: It was Anna ___ called me.",
      "It was Anna who called me.",
    ],
    [
      "en.c.057",
      "Complete the sentence: What I need ___ more practice. (is / it is)",
      "What I need is more practice.",
    ],
    [
      "en.c.059",
      "Use the noun form of the verb in brackets: The ___ of the data took a week. (analyse)",
      "The analysis of the data took a week.",
    ],
    [
      "en.c.059",
      "Use the noun form of the verb in brackets: The ___ of the new rules caused confusion. (introduce)",
      "The introduction of the new rules caused confusion.",
    ],
    [
      "en.c.060",
      "Use tend to to limit the claim: Older learners ___ need more practice.",
      "Older learners tend to need more practice.",
    ],
    [
      "en.c.060",
      "Use may to limit the claim: This method ___ reduce errors.",
      "This method may reduce errors.",
    ],
    [
      "en.c.061",
      "Complete the text with Moreover or However: The method is fast. ___, it is expensive.",
      "The method is fast. However, it is expensive.",
    ],
    [
      "en.c.061",
      "Complete the text with Moreover or Nevertheless: The study was small. ___, the results are useful.",
      "The study was small. Nevertheless, the results are useful.",
    ],
    [
      "en.c.062",
      "Complete the sentence with so or neither: I like coffee, and ___ does my brother.",
      "I like coffee, and so does my brother.",
    ],
    [
      "en.c.062",
      "Complete the sentence with one or ones: I don’t like the red shoes; I prefer the black ___.",
      "I don’t like the red shoes; I prefer the black ones.",
      "I do not like the red shoes; I prefer the black ones.",
    ],
    [
      "en.c.063",
      "Complete the sentence with whom or which: The colleague with ___ I work is very helpful.",
      "The colleague with whom I work is very helpful.",
    ],
    [
      "en.c.063",
      "Complete the sentence with which or whom: The method on ___ we relied was robust.",
      "The method on which we relied was robust.",
    ],
    [
      "en.c.064",
      "Use the verb in brackets after deny: He denied ___ the money. (take)",
      "He denied taking the money.",
      "He denied having taken the money.",
    ],
    [
      "en.c.064",
      "Use urge with the object and the verb in brackets: She urged ___ carefully. (us, check)",
      "She urged us to check carefully.",
    ],
    [
      "en.c.065",
      "Add emphasis with does: She ___ like the idea, but she has questions.",
      "She does like the idea, but she has questions.",
    ],
    [
      "en.c.065",
      "Add emphasis with did: We ___ send the form last week.",
      "We did send the form last week.",
    ],
    [
      "en.c.066",
      "Keep the fronted object and order the words in brackets: This issue, ___ immediately. (we, address, must)",
      "This issue, we must address immediately.",
    ],
    [
      "en.c.066",
      "Complete the sentence with the fronted place phrase: On the table ___ a letter. (lay / laid)",
      "On the table lay a letter.",
    ],
    [
      "en.c.067",
      "Use the -ing form of the verb in brackets after the noun: The students ___ in the study improved quickly. (take part)",
      "The students taking part in the study improved quickly.",
    ],
    [
      "en.c.067",
      "Use the past participle of the verb in brackets after the noun: The data ___ last year were incomplete. (collect)",
      "The data collected last year were incomplete.",
    ],
    [
      "en.c.068",
      "Write a formal request with could and send: ___ me the report by Friday?",
      "Could you send me the report by Friday?",
    ],
    [
      "en.c.068",
      "Use would you mind and the verb in brackets: Would you mind ___ the door? (close)",
      "Would you mind closing the door?",
    ],
    [
      "en.c.069",
      "Use the present perfect or past simple of the verb in brackets: Since then, several studies ___ the effect. (confirm)",
      "Since then, several studies have confirmed the effect.",
    ],
    [
      "en.c.069",
      "Use the present perfect or past simple of the verb in brackets: The researchers ___ the data in 2021. (publish)",
      "The researchers published the data in 2021.",
    ],
    [
      "en.c.070",
      "Keep the list parallel with the verb in brackets: She likes swimming, cycling and ___. (run)",
      "She likes swimming, cycling and running.",
      "She likes swimming, cycling, and running.",
    ],
    [
      "en.c.070",
      "Keep the list parallel with the verb in brackets: We want to reduce costs and ___ quality. (improve)",
      "We want to reduce costs and improve quality.",
      "We want to reduce costs and to improve quality.",
    ],
    [
      "en.c.071",
      "Complete the sentence: Only later ___ the mistake. (did she notice / she noticed)",
      "Only later did she notice the mistake.",
    ],
    [
      "en.c.071",
      "Complete the sentence: Not only ___ late, but he also forgot the documents. (was he / he was)",
      "Not only was he late, but he also forgot the documents.",
    ],
    [
      "en.c.073",
      "The meeting was not necessary, but you went. Use needn’t have and the verb in brackets: You ___. (attend)",
      "You needn’t have attended.",
      "You need not have attended.",
    ],
    [
      "en.c.073",
      "It was not necessary, so you did not do it. Use didn’t need to and the verb in brackets: I ___ a taxi. (take)",
      "I didn’t need to take a taxi.",
      "I did not need to take a taxi.",
    ],
    [
      "en.c.074",
      "Make the request more distant with the past tense of the verb in brackets: I ___ if you could help me. (wonder)",
      "I wondered if you could help me.",
      "I was wondering if you could help me.",
    ],
    [
      "en.c.074",
      "Use might to make the suggestion tentative: It ___ be worth checking the figures again.",
      "It might be worth checking the figures again.",
    ],
    [
      "en.c.075",
      "Complete the text with This or These: The sample was small. ___ limitation weakens the conclusions.",
      "The sample was small. This limitation weakens the conclusions.",
    ],
    [
      "en.c.075",
      "Complete the text with Such or This: The response rate was low. ___ a constraint affects every estimate.",
      "The response rate was low. Such a constraint affects every estimate.",
    ],
    [
      "en.c.076",
      "Complete the contrast with but: Not the price ___ the quality decided the matter.",
      "Not the price but the quality decided the matter.",
    ],
    [
      "en.c.076",
      "Complete the sentence for emphasis: ___ was the result that nobody believed it. (So surprising / Such surprising)",
      "So surprising was the result that nobody believed it.",
    ],
    [
      "en.c.077",
      "Use the past participle of the verb in brackets: The survey, ___ in 2024, included 500 participants. (conduct)",
      "The survey, conducted in 2024, included 500 participants.",
    ],
    [
      "en.c.077",
      "Add the words in brackets as an apposition: Dr Lee, ___, presented the results. (the project leader)",
      "Dr Lee, the project leader, presented the results.",
    ],
    [
      "en.c.078",
      "Complete the fixed expression: ___ it may, we must decide today. (Be that as / Be it as)",
      "Be that as it may, we must decide today.",
    ],
    [
      "en.c.078",
      "Complete the fixed pattern with the adjective in brackets: ___ as it may seem, the plan worked. (strange)",
      "Strange as it may seem, the plan worked.",
    ],
    [
      "en.c.079",
      "Use who so that the supervisor approved it: She discussed the result with the supervisor, ___ approved it.",
      "She discussed the result with the supervisor, who approved it.",
    ],
    [
      "en.c.079",
      "Complete the sentence with which or who: The manager praised the report, ___ was finished early.",
      "The manager praised the report, which was finished early.",
    ],
    [
      "en.c.080",
      "Recast the sentence in academic style with indicate: The data ___ that costs have risen.",
      "The data indicate that costs have risen.",
      "The data indicates that costs have risen.",
    ],
    [
      "en.c.080",
      "Recast the sentence for a formal report with the verb in brackets: We ___ a survey of 200 users. (conduct, past simple)",
      "We conducted a survey of 200 users.",
    ],
    [
      "en.c.081",
      "Add however between commas: The plan, ___ was rejected.",
      "The plan, however, was rejected.",
    ],
    [
      "en.c.081",
      "Join the clauses with a semicolon and therefore: Costs rose ___ prices increased.",
      "Costs rose; therefore, prices increased.",
    ],
    [
      "en.c.082",
      "Use recommend with the -ing form of the verb in brackets: We strongly recommend ___ the figures. (review)",
      "We strongly recommend reviewing the figures.",
    ],
    [
      "en.c.082",
      "Use suggest with a that-clause and the verb in brackets: I suggest that he ___ the manager. (call)",
      "I suggest that he call the manager.",
      "I suggest that he calls the manager.",
      "I suggest that he should call the manager.",
    ],
    [
      "en.c.083",
      "Use the present simple of the verb in brackets, as in a report summary: The report ___ the problem and evaluates two options. (outline)",
      "The report outlines the problem and evaluates two options.",
    ],
    [
      "en.c.083",
      "Use the present simple of the verb in brackets: The proposal ___ a clear timetable. (set out)",
      "The proposal sets out a clear timetable.",
    ],
    [
      "en.c.084",
      "Use the past simple of the verb in brackets: Yesterday the team ___ the analysis. (finish)",
      "Yesterday the team finished the analysis.",
    ],
    [
      "en.c.084",
      "Use the past simple of the verb in brackets: Then they ___ the report to the client. (send)",
      "Then they sent the report to the client.",
    ],
    ] as const
  ).map(([unit, prompt, ...answers]) => ({
    unit,
    prompt,
    answers,
    version: CHECKED_PRACTICE_VERSION,
  })),
  ...(
    [
      ["en.c.001", "Complete the sentence with is or are: My parents ___ at home today.", "My parents are at home today."],
      ["en.c.001", "Complete the sentence with am or is: My brother ___ a nurse.", "My brother is a nurse."],
      ["en.c.015", "Use the present continuous of the verb in brackets: Look, the baby ___. (sleep)", "Look, the baby is sleeping.", "Look, the baby’s sleeping."],
      ["en.c.015", "Use the present continuous of the verb in brackets: We ___ in a hotel this week. (stay)", "We are staying in a hotel this week.", "We’re staying in a hotel this week."],
      ["en.c.034", "Use the present simple of the verb in brackets after if: If she ___ now, she will catch the train. (leave)", "If she leaves now, she will catch the train.", "If she leaves now, she’ll catch the train."],
      ["en.c.034", "Use will and the verb in brackets: If she calls, I ___ her the news. (tell)", "If she calls, I will tell her the news.", "If she calls, I’ll tell her the news."],
      ["en.c.048", "Use the past perfect of the verb in brackets: If we ___ the map, we would have found the hotel. (check)", "If we had checked the map, we would have found the hotel.", "If we’d checked the map, we would have found the hotel."],
      ["en.c.048", "Use would have and the verb in brackets: If he had asked, I ___ him. (help)", "If he had asked, I would have helped him.", "If he had asked, I’d have helped him."],
      ["en.c.058", "Complete the sentence: ___ the instructions, she would not have made the mistake. (Had she read / She had read)", "Had she read the instructions, she would not have made the mistake."],
      ["en.c.058", "Complete the sentence: ___ any problems arise, please contact us. (Should / Would)", "Should any problems arise, please contact us."],
      ["en.c.072", "Complete the sentence with which or that: The report, ___ was published last week, includes data that nobody had checked.", "The report, which was published last week, includes data that nobody had checked."],
      ["en.c.072", "Complete the sentence: ___ the sample was small, the results, which were consistent, convinced the reviewers. (Although / Because)", "Although the sample was small, the results, which were consistent, convinced the reviewers."],
      ["en.c.085", "Write the possessive form of the plural word in brackets: This is my ___ car. (parents)", "This is my parents’ car."],
      ["en.c.086", "Complete the sentence with on or in: The shop opens ___ 2 May.", "The shop opens on 2 May."],
      ["en.c.087", "Complete the sentence with of or at: I am afraid ___ dogs.", "I am afraid of dogs.", "I’m afraid of dogs."],
      ["en.c.088", "Say how she felt. Complete the sentence with confused or confusing: She was ___ by the instructions.", "She was confused by the instructions."],
      ["en.c.089", "Complete the sentence with the verb in brackets to show the purpose: I went to the library ___ a book. (borrow)", "I went to the library to borrow a book.", "I went to the library in order to borrow a book."],
      ["en.c.090", "Complete the sentence: Can I have ___ sugar, please? (a little / a few)", "Can I have a little sugar, please?"],
      ["en.c.091", "Complete the sentence with its or it’s: The dog wagged ___ tail.", "The dog wagged its tail."],
      ["en.c.092", "Complete the sentence with although or despite: She passed the exam ___ she was ill.", "She passed the exam although she was ill."],
      ["en.c.093", "Ask about a past habit that has changed. Complete the question with use or used: Did you ___ to walk to school?", "Did you use to walk to school?"],
      ["en.c.094", "Complete the sentence with so or such: The music was ___ loud that we left.", "The music was so loud that we left."],
      ["en.c.095", "Say that he succeeded once after trying. Complete the sentence with could or managed: He ___ to find a seat on the busy train.", "He managed to find a seat on the busy train."],
      ["en.c.096", "Use would and the verb in brackets for a repeated past action: Every evening, my grandfather ___ us stories. (tell)", "Every evening, my grandfather would tell us stories."],
      ["en.c.097", "Complete the sentence with the phrasal verb that means postpone: We had to ___ the trip. (put off / put on)", "We had to put off the trip."],
      ["en.c.098", "Complete the sentence with yet or already: I haven’t finished my homework ___.", "I haven’t finished my homework yet.", "I have not finished my homework yet."],
      ["en.c.099", "Complete the sentence with themselves or theirselves: The children dressed ___.", "The children dressed themselves."],
      ["en.c.100", "Use the verb in the correct present form: This bag ___ to my sister. (belongs / is belonging)", "This bag belongs to my sister."],
      ["en.c.101", "Complete the sentence with as or like: My brother looks ___ my father.", "My brother looks like my father."],
      ["en.c.102", "Use the verb in brackets with the right preposition: It ___ the weather. (depend)", "It depends on the weather."],
      ["en.c.103", "Complete the sentence with very or absolutely: The film was ___ good.", "The film was very good."],
      ["en.c.104", "Use the typical American English form: Your English has ___ much better. (gotten / got)", "Your English has gotten much better."],
      ["en.c.105", "Complete the sentence with much or very: This test is ___ easier than the last one.", "This test is much easier than the last one."],
      ["en.c.106", "Report the question “Where is the station?”: She asked where ___. (the station was / was the station)", "She asked where the station was."],
      ["en.c.107", "Complete the sentence: It ___ rain tomorrow, so take an umbrella. (is likely to / likely)", "It is likely to rain tomorrow, so take an umbrella.", "It’s likely to rain tomorrow, so take an umbrella."],
      ["en.c.108", "You planned to send it, but you did not. Complete the sentence with the verb in brackets: I forgot ___ the email. (send)", "I forgot to send the email."],
      ["en.c.109", "Use the present perfect passive of the verb in brackets: The new rules ___ to all staff. (explain)", "The new rules have been explained to all staff."],
      ["en.c.110", "Say that it is almost certain. Use must have and the verb in brackets: The streets are wet; it ___ in the night. (rain)", "The streets are wet; it must have rained in the night."],
      ["en.c.111", "Use the past form of the verb in brackets after would rather: I’d rather you ___ here tomorrow. (come)", "I’d rather you came here tomorrow."],
      ["en.c.112", "Replace the form with a pronoun: Please fill ___. (it in / in it)", "Please fill it in."],
      ["de.c.069", "Formuliere „nach der Analyse der Daten“ als Nebensatz und schreibe den ganzen Satz: Nachdem wir die Daten ___ hatten, veröffentlichten wir die Ergebnisse. (analysieren)", "Nachdem wir die Daten analysiert hatten, veröffentlichten wir die Ergebnisse."],
      ["de.c.069", "Bilde für einen dichten Bericht aus dem Verb in Klammern ein Nomen und schreibe den ganzen Satz: Nach der ___ der Daten veröffentlichten wir die Ergebnisse. (analysieren)", "Nach der Analyse der Daten veröffentlichten wir die Ergebnisse."],
      ["de.c.069", "Bilde aus dem Verb in Klammern ein Nomen und schreibe den ganzen Satz: Die ___ der Ergebnisse folgt im nächsten Kapitel. (darstellen)", "Die Darstellung der Ergebnisse folgt im nächsten Kapitel."],
      ["de.c.090", "Setze die richtige Akkusativform ein und schreibe den vollständigen Satz: In meinem Zimmer gibt es ___ Schreibtisch. (ein / einen)", "In meinem Zimmer gibt es einen Schreibtisch."],
      ["de.c.090", "Setze die richtige Akkusativform ein und schreibe den vollständigen Satz: In der Nähe gibt es ___ Bahnhof. (kein / keinen)", "In der Nähe gibt es keinen Bahnhof."],
    ] as const
  ).map(([unit, prompt, ...answers]) => ({
    unit,
    prompt,
    answers,
    version: RECALL_VERSION,
  })),
];

/** Items that gave their answer away or repeated another item of the unit
 * (2026-11-01.5): a bracket cue that was already the answer now has to be
 * changed (another form, another order, options), a repeated sentence became a
 * new one, and a gap whose answer held words the sentence did not show now
 * shows them. The first answer fits; further answers are reviewed equivalents. */
export const RECALL_REVISIONS: readonly {
  readonly taskId: string;
  readonly prompt: string;
  readonly answers?: readonly string[];
}[] = (
  [
    ["en.c.012.retrieve.checks-202611014-1.writing", "Complete the instruction: ___ down, please. (Sit / Sits)", "Sit down, please."],
    ["en.c.026.retrieve.checks-202611014-0.writing", "Put the words in brackets in the right order: She ___ early. (usually, is)"],
    ["en.c.026.retrieve.checks-202611014-1.writing", "Put the words in brackets in the right order: We ___ breakfast at home. (have, always)"],
    ["en.c.070.retrieve.checks-202611014-1.writing", "Keep the list parallel with the verb of the noun in brackets: We want to reduce costs and ___ quality. (improvement)"],
    ["en.c.077.retrieve.checks-202611014-1.writing", "Correct the punctuation so that two commas mark the apposition: Dr Lee the project leader presented the results.", "Dr Lee, the project leader, presented the results."],
    ["en.c.078.retrieve.checks-202611014-1.writing", "Transform the sentence with as it may seem: Although it may seem strange, the plan worked.", "Strange as it may seem, the plan worked."],
    ["en.c.082.retrieve.checks-202611014-1.writing", "Use suggest with a that-clause: I suggest ___ the manager. (that he call / him to call)", "I suggest that he call the manager.", "I suggest that he calls the manager.", "I suggest that he should call the manager."],
    ["en.c.100.retrieve.1.cues-202611013.writing", "Use the verb in the correct present form: I _____ you. (believe / am believing)"],
    ["en.c.104.retrieve.3.writing", "Say when you met in typical British English, using at and weekend: We met _____.", "We met at the weekend."],
    ["en.c.104.retrieve.4.writing", "Say when you met in typical American English, using on and weekend: We met _____.", "We met on the weekend."],
    ["de.c.008.retrieve.3.writing", zweites + "Im Park spielen drei ___. (Kind)", "Im Park spielen drei Kinder."],
    ["de.c.026.retrieve.1.cues-202611013.writing", setze + "Der Kurs ist ___. (interessant / interessante)"],
    ["de.c.026.retrieve.3.cues-202611013.writing", zweites + "Die Aufgabe ist ___. (schwierig / schwierige)", "Die Aufgabe ist schwierig."],
    ["de.c.037.retrieve.3.writing", zweites + "Es ist wichtig, pünktlich ___. (ankommen)", "Es ist wichtig, pünktlich anzukommen."],
    ["de.c.055.retrieve.3.cues-202611013.writing", zweites + "Ich habe ___ gestern gegeben. (ihm, es)"],
    ["de.c.059.retrieve.3.cues-202611013.writing", "Formuliere mit sein + zu um und schreibe den ganzen Satz: Die Aufgabe muss erledigt werden.", "Die Aufgabe ist zu erledigen."],
    ["de.c.066.retrieve.3.cues-202611013.writing", zweites + "Das Ergebnis ___ zu bestätigen, dass die Methode wirkt. (scheinen)", "Das Ergebnis scheint zu bestätigen, dass die Methode wirkt."],
    ["de.c.082.retrieve.2.writing", "Wähle die passende Selbstkorrektur und schreibe sie vollständig auf Deutsch: A: Wir treffen uns am Montag—nein, falsch, alles falsch. / B: Wir treffen uns am Montag—Verzeihung, ich meine: am Dienstag.", "Wir treffen uns am Montag—Verzeihung, ich meine: am Dienstag."],
    ["de.c.082.retrieve.3.writing", zweites + "Ich habe—besser gesagt: ich ___—bereits begonnen. (haben, Präteritum)"],
    ["de.c.137.retrieve.1.cues-202611013.writing", setze + "___ Ergebnisse waren signifikant. (alle, nicht)"],
  ] as const
).map(([taskId, prompt, ...answers]) =>
  answers.length ? { taskId, prompt, answers } : { taskId, prompt },
);

/** Unit titles for the revisions above, so the Grammar Labs find them. */
const UNIT_TITLES: ReadonlyMap<string, string> = new Map([
  ["de.c.001", "Personalpronomen und sein"],
  ["de.c.003", "Präsens regelmäßiger Verben"],
  ["de.c.004", "Präsens unregelmäßiger Verben"],
  ["de.c.005", "W-Fragen"],
  ["de.c.006", "Ja/Nein-Fragen"],
  ["de.c.007", "bestimmter und unbestimmter Artikel"],
  ["de.c.008", "Pluralformen"],
  ["de.c.009", "Akkusativ"],
  ["de.c.010", "Possessivartikel"],
  ["de.c.011", "nicht und kein"],
  ["de.c.013", "Trennbare Verben"],
  ["de.c.014", "lokale Präpositionen"],
  ["de.c.015", "Perfekt mit haben"],
  ["de.c.016", "Perfekt mit sein"],
  ["de.c.018", "Dativ"],
  ["de.c.019", "Wechselpräpositionen"],
  ["de.c.020", "Modalverben müssen, dürfen, sollen, wollen"],
  ["de.c.021", "Komparativ und Superlativ"],
  ["de.c.023", "Nebensatz mit dass"],
  ["de.c.025", "Reflexive Verben"],
  ["de.c.026", "Adjektiv nach sein"],
  ["de.c.027", "Zeitangaben und Wortstellung"],
  ["de.c.028", "Indefinitpronomen man/jemand/niemand"],
  ["de.c.029", "Präteritum in Erzählungen"],
  ["de.c.030", "Plusquamperfekt"],
  ["de.c.032", "Relativsätze Dativ"],
  ["de.c.033", "Konjunktiv II mit würde"],
  ["de.c.035", "Passiv Präsens"],
  ["de.c.036", "Passiv Präteritum und Perfekt"],
  ["de.c.037", "Infinitiv mit zu"],
  ["de.c.038", "um...zu / damit"],
  ["de.c.040", "Genitivgrundlagen"],
  ["de.c.041", "Adjektivdeklination Grundlagen"],
  ["de.c.042", "indirekte Fragen"],
  ["de.c.044", "Passiv mit Modalverben"],
  ["de.c.045", "Zustandspassiv"],
  ["de.c.046", "Nominalisierung"],
  ["de.c.047", "N-Deklination"],
  ["de.c.048", "Partizipien als Adjektive"],
  ["de.c.050", "sowohl...als auch / weder...noch"],
  ["de.c.051", "erweiterte Relativsätze"],
  ["de.c.052", "Verben mit Präpositionen"],
  ["de.c.053", "indirekte Rede Grundlagen"],
  ["de.c.054", "Nomen-Verb-Verbindungen / Funktionsverbgefüge"],
  ["de.c.055", "Wortstellung im Mittelfeld"],
  ["de.c.056", "Konnektoren und Satzverknüpfung"],
  ["de.c.057", "Konjunktiv I vollständig"],
  ["de.c.058", "Subjektive Bedeutung der Modalverben"],
  ["de.c.059", "Ersatzformen des Passivs"],
  ["de.c.060", "Komplexe Nominalgruppen"],
  ["de.c.061", "Partizipialkonstruktionen"],
  ["de.c.062", "Appositionen"],
  ["de.c.063", "Informationsstruktur und Vorfeld"],
  ["de.c.064", "Ausklammerung und Nachfeld"],
  ["de.c.065", "Konzessive und adversative Strukturen"],
  ["de.c.066", "Wissenschaftliches Hedging"],
  ["de.c.067", "Textkohäsion"],
  ["de.c.068", "Register und Stil"],
  ["de.c.069", "Verbalisierung und Nominalisierung abwägen"],
  ["de.c.070", "Parallelismus"],
  ["de.c.071", "Feine Bedeutungsunterschiede im Modus"],
  ["de.c.072", "Markierte Wortstellung"],
  ["de.c.073", "Komplexe Einbettung"],
  ["de.c.074", "Ellipsen und Substitution"],
  ["de.c.076", "Ambiguitätskontrolle"],
  ["de.c.077", "Idiomatizität und Kollokation"],
  ["de.c.078", "Textsortenspezifische Grammatik"],
  ["de.c.079", "Stilistische Verdichtung"],
  ["de.c.080", "Pragmatische Feinsteuerung"],
  ["de.c.082", "Selbstreparatur im Sprechen"],
  ["de.c.083", "Mehrsprachige Interferenzkontrolle"],
  ["de.c.084", "Integrierte automatische Produktion"],
  ["de.c.086", "Satzklammer im einfachen Hauptsatz"],
  ["de.c.089", "Häufigkeitsadverbien"],
  ["de.c.090", "es gibt mit Akkusativ"],
  ["de.c.091", "man für allgemeine Aussagen"],
  ["de.c.096", "Relativsätze mit der, die und das"],
  ["de.c.098", "darum, deshalb und deswegen"],
  ["de.c.102", "Futur I mit werden"],
  ["de.c.111", "lassen als Vollverb und Hilfsverb"],
  ["de.c.116", "Modalpartikeln im Gespräch"],
  ["de.c.117", "Komplexe Temporalsätze"],
  ["de.c.119", "Kausale und konsekutive Verknüpfung"],
  ["de.c.122", "Erweiterte Genitivpräpositionen"],
  ["de.c.123", "Funktionsverbgefüge systematisch"],
  ["de.c.124", "Informationsstruktur durch Vorfeldbesetzung"],
  ["de.c.130", "Komplexe Konditionalstrukturen"],
  ["de.c.137", "Skopus und Negation"],
  ["de.c.140", "Regionale Variation und Standardregister"],
  ["en.c.001", "Verb be: am/is/are"],
  ["en.c.002", "Subject pronouns"],
  ["en.c.003", "Articles a/an/the"],
  ["en.c.004", "Plural nouns"],
  ["en.c.005", "Possessive adjectives"],
  ["en.c.006", "Have/has got"],
  ["en.c.007", "Present simple affirmative"],
  ["en.c.008", "Present simple negatives"],
  ["en.c.009", "Present simple questions"],
  ["en.c.010", "There is/There are"],
  ["en.c.011", "Can/can’t"],
  ["en.c.012", "Imperatives"],
  ["en.c.013", "Prepositions of place"],
  ["en.c.014", "Countable and uncountable nouns"],
  ["en.c.015", "Present continuous"],
  ["en.c.016", "Present simple vs continuous"],
  ["en.c.017", "Past simple regular"],
  ["en.c.018", "Past simple irregular"],
  ["en.c.019", "Past simple questions and negatives"],
  ["en.c.020", "Future with will"],
  ["en.c.021", "Be going to"],
  ["en.c.022", "Comparatives"],
  ["en.c.023", "Superlatives"],
  ["en.c.024", "Some/any/no"],
  ["en.c.025", "Much/many/a lot of"],
  ["en.c.026", "Adverbs of frequency"],
  ["en.c.027", "Object pronouns"],
  ["en.c.028", "Must/have to"],
  ["en.c.029", "Present perfect"],
  ["en.c.030", "Present perfect vs past simple"],
  ["en.c.031", "For and since"],
  ["en.c.032", "Past continuous"],
  ["en.c.033", "Past continuous vs past simple"],
  ["en.c.034", "First conditional"],
  ["en.c.035", "Second conditional"],
  ["en.c.036", "Relative clauses"],
  ["en.c.037", "Gerunds and infinitives"],
  ["en.c.038", "Modal verbs of advice"],
  ["en.c.039", "Passive present and past"],
  ["en.c.040", "Reported statements"],
  ["en.c.041", "Question tags"],
  ["en.c.042", "Too/enough"],
  ["en.c.043", "Present perfect continuous"],
  ["en.c.044", "Past perfect"],
  ["en.c.045", "Past perfect continuous"],
  ["en.c.046", "Future continuous"],
  ["en.c.047", "Future perfect"],
  ["en.c.048", "Third conditional"],
  ["en.c.049", "Mixed conditionals"],
  ["en.c.050", "Modal deduction present"],
  ["en.c.051", "Modal deduction past"],
  ["en.c.052", "Causative have/get"],
  ["en.c.053", "Advanced passive"],
  ["en.c.054", "Participle clauses"],
  ["en.c.055", "Wish and if only"],
  ["en.c.056", "Inversion after negative adverbials"],
  ["en.c.057", "Cleft sentences"],
  ["en.c.058", "Inversion in conditionals"],
  ["en.c.059", "Nominalisation"],
  ["en.c.060", "Hedging and stance"],
  ["en.c.061", "Advanced discourse markers"],
  ["en.c.062", "Substitution and ellipsis"],
  ["en.c.063", "Complex relative clauses"],
  ["en.c.064", "Advanced reporting verbs"],
  ["en.c.065", "Emphasis with auxiliaries"],
  ["en.c.066", "Fronting"],
  ["en.c.067", "Complex noun phrases"],
  ["en.c.068", "Register control"],
  ["en.c.069", "Advanced tense-aspect choices"],
  ["en.c.070", "Parallelism"],
  ["en.c.071", "Marked word order"],
  ["en.c.072", "Layered subordination"],
  ["en.c.073", "Nuanced modality"],
  ["en.c.074", "Counterfactual distance"],
  ["en.c.075", "Advanced cohesion"],
  ["en.c.076", "Rhetorical grammar"],
  ["en.c.077", "Compressed academic structures"],
  ["en.c.078", "Idiomatic clause patterns"],
  ["en.c.079", "Ambiguity control"],
  ["en.c.080", "Style shifting"],
  ["en.c.081", "Advanced punctuation and grammar"],
  ["en.c.082", "Editing for naturalness"],
  ["en.c.083", "Genre-specific grammar"],
  ["en.c.084", "Integrated automatic production"],
  ["en.c.085", "Possessive ’s and whose"],
  ["en.c.086", "Prepositions of time: at, in, on"],
  ["en.c.087", "Adjectives and prepositions"],
  ["en.c.088", "Adjectives ending in -ed and -ing"],
  ["en.c.089", "Infinitive of purpose"],
  ["en.c.090", "Quantifiers: few, a few, little, a little"],
  ["en.c.091", "Capital letters and apostrophes"],
  ["en.c.092", "Contrasting ideas: although, despite, however"],
  ["en.c.093", "Used to, be used to, get used to"],
  ["en.c.094", "Intensifiers: so and such"],
  ["en.c.095", "Past ability: could, was able to, managed to"],
  ["en.c.096", "Past habits: used to, would, past simple"],
  ["en.c.097", "Phrasal verbs"],
  ["en.c.098", "Present perfect: just, yet, still, already"],
  ["en.c.099", "Reflexive pronouns"],
  ["en.c.100", "Stative and dynamic verbs"],
  ["en.c.101", "Using as and like"],
  ["en.c.102", "Verbs and prepositions"],
  ["en.c.103", "Gradable and non-gradable adjectives"],
  ["en.c.104", "British and American grammar"],
  ["en.c.105", "Modifying comparatives"],
  ["en.c.106", "Reported speech: questions"],
  ["en.c.107", "Future degrees of certainty"],
  ["en.c.108", "Gerund or infinitive: change in meaning"],
  ["en.c.109", "Advanced passives review"],
  ["en.c.110", "Modals and expressions of probability"],
  ["en.c.111", "Unreal time"],
  ["en.c.112", "Word order in phrasal verbs"],
]);

const unitFor = (language: Language, title: string) =>
  [...UNIT_TITLES].find(
    ([id, name]) => id.startsWith(`${language}.`) && name === title,
  )?.[0];

/** Gap-cue and recall revisions of one Grammar Lab unit by exercise number:
 * Lab exercise N is the learning path's retrieve.N item (revised retrieval
 * items keep N); the later revision of an item wins. */
export function gapCueRevisionsFor(
  language: Language,
  title: string,
): ReadonlyMap<number, (typeof GAP_CUE_REVISIONS)[number]> {
  const unit = unitFor(language, title);
  const revisions = new Map<number, (typeof GAP_CUE_REVISIONS)[number]>();
  for (const revision of unit
    ? [...GAP_CUE_REVISIONS, ...RECALL_REVISIONS]
    : []) {
    const [, id, index] =
      revision.taskId.match(
        /^(.+?)\.retrieve\.(?:content-\d+-)?(\d+)\.(?:(?:forms|cues)-\d+\.)*writing$/u,
      ) ?? [];
    if (id === unit) revisions.set(Number(index), revision);
  }
  return revisions;
}

/** The learning path's added checkable items of one unit, in their current
 * revision, for the Grammar Lab. Task N of a version is checks-<version>-N. */
export function checkedPracticeFor(
  language: Language,
  title: string,
): readonly { readonly prompt: string; readonly answers: readonly string[] }[] {
  const unit = unitFor(language, title);
  const count = new Map<string, number>();
  return CHECKED_PRACTICE.filter((row) => row.unit === unit).map((row) => {
    const index = count.get(row.version) ?? 0;
    count.set(row.version, index + 1);
    const id = `${row.unit}.retrieve.checks-${row.version.replace(/\D/gu, "")}-${index}.writing`;
    const revision = RECALL_REVISIONS.find((item) => item.taskId === id);
    return {
      prompt: revision?.prompt ?? row.prompt,
      answers: revision?.answers ?? row.answers,
    };
  });
}

/** The 2026-11-01 revision of one unit, for the Grammar Labs and the curriculum build. */
export function contentRevisionFor(
  language: Language,
  title: string,
): UnitContentRevision | undefined {
  return UNIT_CONTENT_REVISIONS.find(
    (row) => row.language === language && row.title === title,
  );
}
