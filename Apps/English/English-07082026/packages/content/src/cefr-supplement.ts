import type {
  CefrLevel,
  GrammarExercise,
  GrammarUnit,
} from "./types";

interface SupplementDefinition {
  level: CefrLevel;
  title: string;
  rule: string;
  examples: [string, string, string, string];
  targets: [string, string, string, string];
  commonError: [incorrect: string, corrected: string];
  sourceUrl: string;
}

function clozeExercise(sentence: string, target: string): GrammarExercise {
  const blanked = sentence.replace(target, "_____");
  return [`Complete the sentence: ${blanked}`, sentence];
}

function createSupplement(definition: SupplementDefinition): GrammarUnit {
  const [incorrect, corrected] = definition.commonError;
  const [first, second, third, transfer] = definition.examples;
  const exercises: GrammarExercise[] = [
    [`Correct the sentence: ${incorrect}`, corrected],
    ...definition.examples.map((sentence, index) =>
      clozeExercise(sentence, definition.targets[index] ?? ""),
    ),
  ];

  return {
    level: definition.level,
    title: definition.title,
    rule: definition.rule,
    examples: [first, second, third],
    commonError: `${incorrect} → ${corrected}`,
    exercises,
    links: [
      [
        "Verified online explanation",
        definition.sourceUrl,
        `British Council explanation and examples for “${definition.title}”.`,
        "explanation",
      ],
      [
        "Verified online exercises",
        definition.sourceUrl,
        `British Council interactive tests for “${definition.title}”.`,
        "exercise",
      ],
    ],
    testAnswer: first,
    recallTest: definition.rule,
    repairTest: corrected,
    transferTest: transfer,
  };
}

const definitions: SupplementDefinition[] = [
  {
    level: "A1",
    title: "Possessive ’s and whose",
    rule:
      "Use ’s after a singular person or noun to show possession, and use whose to ask who owns something.",
    examples: [
      "This is Maya’s book.",
      "My brother’s room is small.",
      "Whose coat is this?",
      "The children’s bags are by the door.",
    ],
    targets: ["Maya’s", "brother’s", "Whose", "children’s"],
    commonError: ["This is Saras bag.", "This is Sara’s bag."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/possessive-s",
  },
  {
    level: "A1",
    title: "Prepositions of time: at, in, on",
    rule:
      "Use at with clock times, on with days and dates, and in with months, years, seasons, and longer periods.",
    examples: [
      "The lesson starts at seven.",
      "We meet on Monday.",
      "Her birthday is in July.",
      "I usually read at night.",
    ],
    targets: ["at", "on", "in", "at"],
    commonError: ["We meet in Monday.", "We meet on Monday."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2-grammar/prepositions-of-time-at-in-on",
  },
  {
    level: "A2",
    title: "Adjectives and prepositions",
    rule:
      "Learn common adjective–preposition combinations as complete patterns; a preposition is followed by a noun or an -ing form.",
    examples: [
      "She is good at maths.",
      "I am interested in photography.",
      "They are worried about the exam.",
      "You should be proud of your progress.",
    ],
    targets: ["at", "in", "about", "of"],
    commonError: ["She is good in maths.", "She is good at maths."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/adjectives-prepositions",
  },
  {
    level: "A2",
    title: "Adjectives ending in -ed and -ing",
    rule:
      "Use -ed adjectives for how someone feels and -ing adjectives for the person, thing, or situation that causes the feeling.",
    examples: [
      "I was bored during the lecture.",
      "The lecture was boring.",
      "We were excited about the trip.",
      "The final scene was surprising.",
    ],
    targets: ["bored", "boring", "excited", "surprising"],
    commonError: [
      "I was boring during the lecture.",
      "I was bored during the lecture.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/adjectives-ending-ed-ing",
  },
  {
    level: "A2",
    title: "Infinitive of purpose",
    rule:
      "Use to plus the base form of a verb to explain the purpose of an action or answer the question why.",
    examples: [
      "I called to ask for your help.",
      "She went outside to get some air.",
      "We exercise to stay healthy.",
      "He saved money to buy a bicycle.",
    ],
    targets: ["to ask", "to get", "to stay", "to buy"],
    commonError: [
      "I went to the shop for buy milk.",
      "I went to the shop to buy milk.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/infinitive-purpose",
  },
  {
    level: "A2",
    title: "Quantifiers: few, a few, little, a little",
    rule:
      "Use few or a few with plural countable nouns and little or a little with uncountable nouns; forms without a often suggest an insufficient amount.",
    examples: [
      "I have a few questions.",
      "Few people knew the answer.",
      "There is a little milk left.",
      "We have very little time.",
    ],
    targets: ["a few", "Few", "a little", "little"],
    commonError: [
      "There are a little chairs.",
      "There are a few chairs.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2-grammar/quantifiers-few-a-few-little-a-bit",
  },
  {
    level: "B1",
    title: "Capital letters and apostrophes",
    rule:
      "Use capital letters for sentence beginnings and proper names; use apostrophes for possession and omitted letters, not for ordinary plurals.",
    examples: [
      "I’m visiting France in July.",
      "Sarah’s laptop is on the desk.",
      "The students’ projects are ready.",
      "We don’t work on Sundays.",
    ],
    targets: ["France", "Sarah’s", "students’", "don’t"],
    commonError: [
      "my sisters live in canada.",
      "My sisters live in Canada.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/capital-letters-apostrophes",
  },
  {
    level: "B1",
    title: "Contrasting ideas: although, despite, however",
    rule:
      "Use although or even though before a clause, despite or in spite of before a noun or -ing form, and however to connect contrasting sentences.",
    examples: [
      "Although it was raining, we went out.",
      "Despite the rain, we went out.",
      "The task was difficult; however, we finished it.",
      "In spite of feeling tired, she continued.",
    ],
    targets: ["Although", "Despite", "however", "In spite of"],
    commonError: [
      "Despite it was raining, we went out.",
      "Although it was raining, we went out.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/contrasting-ideas-although-despite-others",
  },
  {
    level: "B1",
    title: "Used to, be used to, get used to",
    rule:
      "Use used to plus a base verb for past states or habits, be used to plus a noun or -ing form for familiarity, and get used to for the process of becoming familiar.",
    examples: [
      "I used to live near the sea.",
      "She is used to working at night.",
      "They are getting used to the weather.",
      "Did you use to play outside?",
    ],
    targets: ["used to live", "used to working", "getting used to", "use to play"],
    commonError: [
      "I am used to work at night.",
      "I am used to working at night.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2-grammar/different-uses-of-used-to",
  },
  {
    level: "B1",
    title: "Intensifiers: so and such",
    rule:
      "Use so before an adjective or adverb, such before a noun phrase, and so much or so many before quantities.",
    examples: [
      "The film was so exciting.",
      "It was such an exciting film.",
      "She has so many ideas.",
      "We had such good weather.",
    ],
    targets: ["so", "such", "so many", "such"],
    commonError: ["It was so good film.", "It was such a good film."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/intensifiers-so-such",
  },
  {
    level: "B1",
    title: "Past ability: could, was able to, managed to",
    rule:
      "Use could for general past ability and was able to or managed to for a successful action on one particular occasion.",
    examples: [
      "I could swim when I was six.",
      "We were able to solve the problem.",
      "She managed to open the door.",
      "He couldn’t read the sign.",
    ],
    targets: ["could", "were able to", "managed to", "couldn’t"],
    commonError: [
      "Yesterday I could fix the computer after three hours.",
      "Yesterday I managed to fix the computer after three hours.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-ability",
  },
  {
    level: "B1",
    title: "Past habits: used to, would, past simple",
    rule:
      "Use used to for past states or repeated actions, would for repeated past actions, and the past simple for completed past facts and events.",
    examples: [
      "We used to live in Madrid.",
      "Every summer, we would visit my aunt.",
      "I played tennis every Saturday.",
      "She didn’t use to like coffee.",
    ],
    targets: ["used to", "would", "played", "didn’t use to"],
    commonError: ["We would live in Madrid.", "We used to live in Madrid."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2-grammar/past-habits-used-to-would-past-simple",
  },
  {
    level: "B1",
    title: "Phrasal verbs",
    rule:
      "A phrasal verb combines a verb with one or more particles; learn its meaning and whether an object can separate the verb and particle.",
    examples: [
      "Please fill in the form.",
      "They called off the meeting.",
      "Can you look after my cat?",
      "We need to come up with a solution.",
    ],
    targets: ["fill in", "called off", "look after", "come up with"],
    commonError: ["Please fill the form in it.", "Please fill in the form."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/phrasal-verbs",
  },
  {
    level: "B1",
    title: "Present perfect: just, yet, still, already",
    rule:
      "Use just and already mainly in affirmative present-perfect clauses, yet mainly in questions and negatives, and still to emphasize that a situation continues.",
    examples: [
      "I have just finished.",
      "She has already called.",
      "Have they arrived yet?",
      "He still hasn’t replied.",
    ],
    targets: ["just", "already", "yet", "still"],
    commonError: ["I have finished yesterday.", "I finished yesterday."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect-just-yet-still-already",
  },
  {
    level: "B1",
    title: "Reflexive pronouns",
    rule:
      "Use myself, yourself, himself, herself, itself, ourselves, yourselves, and themselves when the object refers back to the subject or to add emphasis.",
    examples: [
      "She taught herself Spanish.",
      "I made the cake myself.",
      "We enjoyed ourselves.",
      "Be careful not to hurt yourself.",
    ],
    targets: ["herself", "myself", "ourselves", "yourself"],
    commonError: ["He cut hisself.", "He cut himself."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/reflexive-pronouns",
  },
  {
    level: "B1",
    title: "Stative and dynamic verbs",
    rule:
      "Stative verbs normally describe states, thoughts, possession, or senses and usually avoid continuous forms, while dynamic verbs describe actions.",
    examples: [
      "I believe you.",
      "She owns two bicycles.",
      "I am thinking about the problem.",
      "The soup tastes delicious.",
    ],
    targets: ["believe", "owns", "am thinking", "tastes"],
    commonError: ["I am knowing the answer.", "I know the answer."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/stative-verbs",
  },
  {
    level: "B1",
    title: "Using as and like",
    rule:
      "Use like before a noun or pronoun to compare, and use as before a clause or to describe a role or function.",
    examples: [
      "She sings like a professional.",
      "Do it as I showed you.",
      "He works as a designer.",
      "It looks like rain.",
    ],
    targets: ["like", "as", "as", "like"],
    commonError: [
      "He works like a teacher at the school.",
      "He works as a teacher at the school.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2-grammar/using-as-like",
  },
  {
    level: "B1",
    title: "Verbs and prepositions",
    rule:
      "Learn common verb–preposition combinations as complete patterns because the required preposition is determined by the verb and meaning.",
    examples: [
      "This book belongs to me.",
      "We talked about the proposal.",
      "She apologized for the delay.",
      "I agree with your conclusion.",
    ],
    targets: ["belongs to", "talked about", "apologized for", "agree with"],
    commonError: ["It depends of the weather.", "It depends on the weather."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-prepositions",
  },
  {
    level: "B2",
    title: "Gradable and non-gradable adjectives",
    rule:
      "Use degree adverbs such as fairly or very with gradable adjectives and absolute intensifiers such as absolutely or completely with non-gradable adjectives.",
    examples: [
      "The room was fairly cold.",
      "The water was absolutely freezing.",
      "That explanation is completely impossible.",
      "I was a bit tired after the journey.",
    ],
    targets: ["fairly", "absolutely", "completely", "a bit"],
    commonError: [
      "The water was very freezing.",
      "The water was absolutely freezing.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/adjectives-gradable-non-gradable",
  },
  {
    level: "B2",
    title: "British and American grammar",
    rule:
      "Recognize common British–American grammar differences and keep choices consistent with the intended variety and context.",
    examples: [
      "British English: I’ve just eaten.",
      "American English: I just ate.",
      "British English: We met at the weekend.",
      "American English: We met on the weekend.",
    ],
    targets: ["I’ve just eaten", "I just ate", "at the weekend", "on the weekend"],
    commonError: ["I have just ate lunch.", "I have just eaten lunch."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/british-english-american-english",
  },
  {
    level: "B2",
    title: "Modifying comparatives",
    rule:
      "Use words such as much, far, slightly, or a bit to express the size of a difference, and almost or exactly with as … as comparisons.",
    examples: [
      "The new route is much shorter.",
      "Sales were slightly lower.",
      "She is almost as tall as her sister.",
      "The result was exactly the same as before.",
    ],
    targets: ["much", "slightly", "almost", "exactly"],
    commonError: ["This route is very shorter.", "This route is much shorter."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/modifying-comparatives",
  },
  {
    level: "B2",
    title: "Reported speech: questions",
    rule:
      "In reported questions, use statement word order, backshift tense when appropriate, and use if or whether for yes/no questions.",
    examples: [
      "She asked where I lived.",
      "He asked if I was ready.",
      "They wanted to know what we had decided.",
      "I asked whether the train had left.",
    ],
    targets: ["where I lived", "if I was ready", "what we had decided", "whether"],
    commonError: ["She asked where did I live.", "She asked where I lived."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/reported-speech-questions",
  },
  {
    level: "B2",
    title: "Future degrees of certainty",
    rule:
      "Express future certainty with adverbs and probability expressions such as definitely, probably, be likely to, and be unlikely to.",
    examples: [
      "The train will definitely be late.",
      "She will probably accept.",
      "Prices are likely to rise.",
      "They are unlikely to arrive before noon.",
    ],
    targets: ["definitely", "probably", "likely to", "unlikely to"],
    commonError: [
      "She will accepts probably.",
      "She will probably accept.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/future-degrees-certainty",
  },
  {
    level: "B2",
    title: "Gerund or infinitive: change in meaning",
    rule:
      "Some verbs can take an -ing form or a to-infinitive with different meanings; learn each contrast as a complete pattern.",
    examples: [
      "He stopped smoking.",
      "He stopped to smoke.",
      "I remember meeting her.",
      "Remember to lock the door.",
    ],
    targets: ["stopped smoking", "stopped to smoke", "remember meeting", "Remember to lock"],
    commonError: [
      "I stopped to smoke last year.",
      "I stopped smoking last year.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-followed-ing-or-infinitive-change-meaning",
  },
  {
    level: "C1",
    title: "Advanced passives review",
    rule:
      "Control passive forms across tense, aspect, modality, reporting structures, and clauses with two objects while choosing an appropriate focus.",
    examples: [
      "The road is being repaired.",
      "The results will have been published by noon.",
      "She is believed to live abroad.",
      "The documents should have been signed earlier.",
    ],
    targets: ["is being repaired", "will have been published", "is believed", "should have been signed"],
    commonError: [
      "The work has completed.",
      "The work has been completed.",
    ],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/c1/advanced-passives-review",
  },
  {
    level: "C1",
    title: "Modals and expressions of probability",
    rule:
      "Calibrate probability with modal verbs, modal perfect forms, adverbs, and expressions such as be bound to, be likely to, and it is conceivable that.",
    examples: [
      "The keys must be upstairs.",
      "She may have missed the train.",
      "They are bound to notice the change.",
      "It is highly unlikely that the result is random.",
    ],
    targets: ["must", "may have missed", "bound to", "highly unlikely"],
    commonError: ["He must to be at home.", "He must be at home."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/c1/modals-probability",
  },
  {
    level: "C1",
    title: "Unreal time",
    rule:
      "Use past forms after wish, it is time, would rather, and as if or as though to create distance from present or past reality.",
    examples: [
      "It’s time we left.",
      "I’d rather you didn’t mention it.",
      "She talks as though she knew everything.",
      "I wish I had accepted the offer.",
    ],
    targets: ["left", "didn’t mention", "knew", "had accepted"],
    commonError: ["It’s time we leave.", "It’s time we left."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/c1/unreal-time",
  },
  {
    level: "C1",
    title: "Word order in phrasal verbs",
    rule:
      "Place noun objects according to whether a phrasal verb is separable, but put pronoun objects between a separable verb and its particle.",
    examples: [
      "Turn the radio down.",
      "Turn it down.",
      "She looks after her younger brother.",
      "We ran out of time.",
    ],
    targets: ["radio down", "it down", "looks after", "ran out of"],
    commonError: ["Turn down it.", "Turn it down."],
    sourceUrl:
      "https://learnenglish.britishcouncil.org/free-resources/grammar/c1/word-order-phrasal-verbs",
  },
];

export const cefrSupplementalUnits: GrammarUnit[] =
  definitions.map(createSupplement);

