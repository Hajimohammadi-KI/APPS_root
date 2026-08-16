import type { GrammarUnit } from "./types";

export interface GrammarPattern {
  label: string;
  form: string;
  use: string;
  example: string;
  note?: string;
}

export interface GrammarContrast {
  label: string;
  left: string;
  right: string;
  explanation: string;
}

export type GrammarPracticeStageName =
  | "Notice"
  | "Choose"
  | "Build"
  | "Repair"
  | "Personalise"
  | "Speak";

export interface GrammarPracticeStage {
  stage: GrammarPracticeStageName;
  goal: string;
  prompt: string;
  model: string;
}

export interface GrammarLessonGuide {
  canDo: string;
  meaning: string[];
  patterns: GrammarPattern[];
  decisionSteps: string[];
  contrasts: GrammarContrast[];
  practiceStages: GrammarPracticeStage[];
}

type GuideDraft = Omit<GrammarLessonGuide, "practiceStages"> & {
  practiceStages?: GrammarPracticeStage[];
};

function pattern(
  label: string,
  form: string,
  use: string,
  example: string,
  note?: string,
): GrammarPattern {
  return { label, form, use, example, note };
}

function standardPractice(
  unit: GrammarUnit,
  guide: Omit<GrammarLessonGuide, "practiceStages">,
): GrammarPracticeStage[] {
  const first = guide.patterns[0];
  if (!first) {
    throw new Error(`Grammar guide for “${unit.title}” has no patterns.`);
  }
  const second = guide.patterns[1] ?? first;
  const third = guide.patterns[2] ?? second;
  return [
    {
      stage: "Notice",
      goal: "Connect meaning to form before memorising a rule.",
      prompt: `Read the examples for “${first.label}” and “${second.label}”. Underline the words that make the two patterns different, then say what each form means.`,
      model: `${first.example} / ${second.example}`,
    },
    {
      stage: "Choose",
      goal: "Select the form from meaning and context.",
      prompt: `Choose between “${first.label}” and “${second.label}” for three new situations. Say the reason before you complete each sentence.`,
      model: `I choose “${first.label}” because the speaker needs to ${first.use.toLowerCase()}.`,
    },
    {
      stage: "Build",
      goal: "Build the pattern accurately without copying.",
      prompt: `Write one complete sentence with “${first.label}” and one with “${third.label}”. Mark each part of the form.`,
      model: `${first.form} → ${first.example}`,
    },
    {
      stage: "Repair",
      goal: "Notice and correct the lesson's typical error.",
      prompt: `Repair this problem and explain the change in one short sentence: ${unit.commonError}`,
      model: `I checked the meaning first, then used this pattern: ${second.form}`,
    },
    {
      stage: "Personalise",
      goal: "Use the grammar for a real message about your life.",
      prompt: `Write three true sentences about your life or plans. Use three different patterns from this lesson and do not copy the models.`,
      model: `Model shape only: ${first.form}`,
    },
    {
      stage: "Speak",
      goal: "Retrieve the form quickly enough for conversation.",
      prompt: `Speak for 30–45 seconds and show that you can ${guide.canDo.toLowerCase()} Use at least three forms from the pattern table, then listen and record once more.`,
      model: `${first.example} ${second.example} ${third.example}`,
    },
  ];
}

function finish(unit: GrammarUnit, draft: GuideDraft): GrammarLessonGuide {
  const base = {
    canDo: draft.canDo,
    meaning: draft.meaning,
    patterns: draft.patterns,
    decisionSteps: draft.decisionSteps,
    contrasts: draft.contrasts,
  };
  return {
    ...base,
    practiceStages: draft.practiceStages ?? standardPractice(unit, base),
  };
}

function tenseDecision(timeQuestion: string): string[] {
  return [
    `First ask: ${timeQuestion}`,
    "Choose the meaning before choosing the verb form.",
    "Build the verb phrase, then check the subject and auxiliary.",
    "For a negative or question, move or add the auxiliary; do not change two verbs at once.",
    "Read the complete sentence aloud and check whether the time expression matches.",
  ];
}

function presentSimpleGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "describe routines, repeated actions, facts and stable situations accurately.",
    meaning: [
      "Use it for routines and repeated events, not only for actions happening now.",
      "Use it for facts, opinions, states and timetabled events.",
      "The third-person -s belongs only to he, she and it in affirmative statements.",
    ],
    patterns: [
      pattern("Affirmative: I/you/we/they", "subject + base verb", "describe a routine or fact", "I review five words after breakfast."),
      pattern("Affirmative: he/she/it", "subject + verb-s/-es", "describe another person's routine", "Mina studies in the library on Fridays.", "After consonant + y, use -ies: study → studies."),
      pattern("Negative", "subject + do/does not + base verb", "say that a routine or fact is not true", "She does not study late at night.", "After does, the main verb returns to its base form."),
      pattern("Yes/no question", "Do/Does + subject + base verb?", "check whether something is true", "Does Mina study on Fridays?"),
      pattern("Wh-question", "Wh-word + do/does + subject + base verb?", "ask for specific information", "Where does Mina study on Fridays?"),
      pattern("Short answer", "Yes, subject + do/does. / No, subject + do/does not.", "answer without repeating the full sentence", "Yes, she does."),
    ],
    decisionSteps: tenseDecision("Is this generally true, repeated or scheduled?"),
    contrasts: [
      {
        label: "Routine vs now",
        left: "I read research papers every morning.",
        right: "I am reading a research paper now.",
        explanation: "Present simple describes the routine; present continuous describes the action in progress now.",
      },
    ],
  });
}

function beGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "identify and describe people, places, feelings and situations with be.",
    meaning: [
      "Be links the subject to an identity, description, location, age or condition.",
      "Choose am, is or are from the subject; there is no separate base verb in an ordinary statement.",
    ],
    patterns: [
      pattern("Affirmative", "I am / he, she, it is / you, we, they are", "give an identity or description", "My study room is quiet."),
      pattern("Negative", "subject + am/is/are + not", "say a description is not true", "The exercises are not difficult today."),
      pattern("Yes/no question", "Am/Is/Are + subject + complement?", "check an identity, condition or place", "Is the next lesson ready?"),
      pattern("Wh-question", "Wh-word + am/is/are + subject?", "ask for specific information", "Where are your notes?"),
      pattern("Short answer", "Yes, subject + am/is/are. / No, subject + am/is/are not.", "answer naturally and briefly", "No, they are not."),
    ],
    decisionSteps: [
      "Find the subject.",
      "Decide whether the sentence gives an identity, description, location or condition.",
      "Choose am for I, is for one person or thing, and are for you or plural subjects.",
      "Put not after be for a negative; move be before the subject for a question.",
    ],
    contrasts: [
      {
        label: "Be vs ordinary verb",
        left: "She is careful.",
        right: "She checks her work carefully.",
        explanation: "Use be before an adjective; use an ordinary verb to name the action.",
      },
    ],
  });
}

function presentContinuousGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "describe actions in progress and temporary situations, and contrast them with routines.",
    meaning: [
      "Use it for an action happening now or around now, and for a temporary changing situation.",
      "The tense needs two parts: the correct form of be and an -ing verb.",
      "State verbs such as know, need and believe are not normally used in the continuous for their usual meanings.",
    ],
    patterns: [
      pattern("Affirmative", "subject + am/is/are + verb-ing", "describe an action in progress", "I am practising a difficult sound now."),
      pattern("Negative", "subject + am/is/are not + verb-ing", "say an action is not in progress", "She is not using the dictionary today."),
      pattern("Yes/no question", "Am/Is/Are + subject + verb-ing?", "ask about an action in progress", "Are you recording your answer?"),
      pattern("Wh-question", "Wh-word + am/is/are + subject + verb-ing?", "ask for details", "What are you practising today?"),
      pattern("Spelling", "make → making; run → running; study → studying", "form the -ing word accurately", "We are planning tomorrow's lesson."),
    ],
    decisionSteps: tenseDecision("Is the action in progress or temporary around now?"),
    contrasts: [
      {
        label: "Usual vs temporary",
        left: "I work at home on Mondays.",
        right: "I am working at home this week.",
        explanation: "The first is a routine; the second is a temporary situation.",
      },
      {
        label: "State vs action",
        left: "I understand the rule.",
        right: "I am thinking about the example.",
        explanation: "Understand describes a state; thinking here describes an active mental process.",
      },
    ],
  });
}

function pastSimpleGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "report completed past events and ask or answer about what happened.",
    meaning: [
      "Use it when the event is finished and belongs to a finished past time.",
      "Affirmative verbs may be regular or irregular; negatives and questions use did plus the base verb.",
    ],
    patterns: [
      pattern("Regular affirmative", "subject + verb-ed", "report a completed event", "I reviewed the chapter yesterday."),
      pattern("Irregular affirmative", "subject + irregular past form", "report a completed event", "She wrote three clear examples."),
      pattern("Negative", "subject + did not + base verb", "say a past event did not happen", "We did not finish the exercise."),
      pattern("Yes/no question", "Did + subject + base verb?", "ask whether an event happened", "Did you save your notes?"),
      pattern("Wh-question", "Wh-word + did + subject + base verb?", "ask for past details", "When did you finish the exercise?"),
      pattern("Past be", "was/were; was not/were not; Was/Were ...?", "describe a past state", "The first task was easy."),
    ],
    decisionSteps: tenseDecision("Is the event completed in a finished past time?"),
    contrasts: [
      {
        label: "Past form after did",
        left: "She wrote the answer.",
        right: "Did she write the answer?",
        explanation: "Did carries the past meaning, so write returns to the base form.",
      },
    ],
  });
}

function pastContinuousGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "describe an action in progress at a past time and connect it to a shorter event.",
    meaning: [
      "Use past continuous for the background or longer action in progress.",
      "Use past simple for a completed event that interrupts or advances the story.",
    ],
    patterns: [
      pattern("Affirmative", "subject + was/were + verb-ing", "show an action in progress in the past", "I was reading at eight o'clock."),
      pattern("Negative", "subject + was/were not + verb-ing", "say an action was not in progress", "They were not waiting outside."),
      pattern("Question", "Was/Were + subject + verb-ing?", "ask about background activity", "Were you studying when I called?"),
      pattern("Interrupted action", "past continuous + when + past simple", "connect a longer action to a short event", "I was recording when the phone rang."),
      pattern("Parallel actions", "while + past continuous, past continuous", "show two ongoing past actions", "While I was reading, she was taking notes."),
    ],
    decisionSteps: tenseDecision("Was the action already in progress at that past moment?"),
    contrasts: [
      {
        label: "Background vs event",
        left: "I was walking home.",
        right: "I found a useful book.",
        explanation: "Past continuous creates the background; past simple reports the completed event.",
      },
    ],
  });
}

function perfectGuide(unit: GrammarUnit, continuous: boolean): GrammarLessonGuide {
  const form = continuous
    ? "subject + have/has + been + verb-ing"
    : "subject + have/has + past participle";
  return finish(unit, {
    canDo: continuous
      ? "connect a continuing or repeated activity to the present and describe its duration."
      : "connect past experience or a past event to the present without using a finished past time.",
    meaning: continuous
      ? [
          "Use it to focus on duration, repetition or visible present results of an activity.",
          "State verbs normally use present perfect simple, not the continuous.",
        ]
      : [
          "Use it for experience, recent results and unfinished time up to now.",
          "Do not combine it with a finished past-time expression such as yesterday or in 2022.",
        ],
    patterns: continuous
      ? [
          pattern("Affirmative", form, "focus on duration or repeated activity", "I have been practising for twenty minutes."),
          pattern("Negative", "subject + have/has not + been + verb-ing", "deny an ongoing activity", "She has not been sleeping well."),
          pattern("Question", "Have/Has + subject + been + verb-ing?", "ask about duration or recent activity", "Have you been working on the same task?"),
          pattern("Duration", "for + period / since + starting point", "measure how long", "We have been studying since nine o'clock."),
          pattern("Present result", "have/has been + verb-ing + result now", "explain visible evidence", "He is tired because he has been running."),
        ]
      : [
          pattern("Affirmative", form, "connect a past event to now", "I have completed today's review."),
          pattern("Negative", "subject + have/has not + past participle", "say something has not happened up to now", "She has not opened the file yet."),
          pattern("Question", "Have/Has + subject + past participle?", "ask about experience or a result", "Have you tried this method before?"),
          pattern("Experience", "have/has + ever/never + past participle", "talk about life experience", "I have never studied Japanese."),
          pattern("Recent result", "have/has + just/already/yet + past participle", "show a recent result", "We have just finished the test."),
          pattern("Unfinished time", "have/has + past participle + for/since", "connect a state to now", "She has known him for five years."),
        ],
    decisionSteps: tenseDecision(
      continuous
        ? "Is the activity continuing, repeated or important for its duration?"
        : "Does the past event have a present connection, with no finished past time?",
    ),
    contrasts: [
      {
        label: continuous ? "Activity vs result" : "Present perfect vs past simple",
        left: continuous
          ? "I have been writing the report."
          : "I have read that article.",
        right: continuous
          ? "I have written three pages."
          : "I read it last Monday.",
        explanation: continuous
          ? "Continuous focuses on the activity or duration; simple focuses on the completed amount or result."
          : "Present perfect connects the experience to now; past simple places it in a finished past time.",
      },
    ],
  });
}

function pastPerfectGuide(unit: GrammarUnit, continuous: boolean): GrammarLessonGuide {
  return finish(unit, {
    canDo: continuous
      ? "show how long an activity had continued before another past event."
      : "make the order of two past events clear.",
    meaning: [
      continuous
        ? "Use it for duration or repeated activity before a later past reference point."
        : "Use it for the earlier of two relevant past events.",
      "The later event or reference point normally uses past simple.",
    ],
    patterns: continuous
      ? [
          pattern("Affirmative", "subject + had been + verb-ing", "show earlier duration", "I had been studying for an hour before the class began."),
          pattern("Negative", "subject + had not been + verb-ing", "deny earlier ongoing activity", "She had not been waiting long when the bus arrived."),
          pattern("Question", "Had + subject + been + verb-ing?", "ask about earlier duration", "Had they been working all morning?"),
          pattern("Timeline", "past perfect continuous + before + past simple", "order activity and later event", "We had been talking before the meeting started."),
        ]
      : [
          pattern("Affirmative", "subject + had + past participle", "mark the earlier past event", "I had saved the document before the computer restarted."),
          pattern("Negative", "subject + had not + past participle", "say the earlier event was incomplete", "She had not read the email before the call."),
          pattern("Question", "Had + subject + past participle?", "ask about the earlier event", "Had you met him before that day?"),
          pattern("Timeline", "past perfect + before/by the time + past simple", "make event order explicit", "By the time class began, we had completed the quiz."),
        ],
    decisionSteps: tenseDecision("Which event or activity came first in the past?"),
    contrasts: [
      {
        label: "Earlier vs later past",
        left: continuous ? "I had been reading for an hour." : "I had read the instructions.",
        right: "The exercise started.",
        explanation: "Past perfect marks what was already true before the past reference event.",
      },
    ],
  });
}

function futureGuide(unit: GrammarUnit, kind: "will" | "going" | "continuous" | "perfect"): GrammarLessonGuide {
  const data = {
    will: {
      canDo: "make spontaneous decisions, offers, promises and evidence-based predictions with will.",
      form: "subject + will + base verb",
      example: "I will help you with the next exercise.",
      meaning: "make a decision now, an offer, promise or prediction",
      negative: "subject + will not + base verb",
      negativeExample: "I will not forget your question.",
      question: "Will + subject + base verb?",
      questionExample: "Will you join the review?",
    },
    going: {
      canDo: "describe prior plans and predictions based on present evidence.",
      form: "subject + am/is/are going to + base verb",
      example: "I am going to revise after lunch.",
      meaning: "describe an intention decided before speaking",
      negative: "subject + am/is/are not going to + base verb",
      negativeExample: "I am not going to skip today's practice.",
      question: "Am/Is/Are + subject + going to + base verb?",
      questionExample: "Are you going to revise after lunch?",
    },
    continuous: {
      canDo: "describe an action that will be in progress at a future time.",
      form: "subject + will be + verb-ing",
      example: "At eight, I will be attending the online class.",
      meaning: "show a future action in progress",
      negative: "subject + will not be + verb-ing",
      negativeExample: "She will not be working tomorrow morning.",
      question: "Will + subject + be + verb-ing?",
      questionExample: "Will you be working tomorrow morning?",
    },
    perfect: {
      canDo: "describe what will be completed before a future deadline.",
      form: "subject + will have + past participle",
      example: "By Friday, I will have completed the unit.",
      meaning: "show completion before a future point",
      negative: "subject + will not have + past participle",
      negativeExample: "I will not have finished by noon.",
      question: "Will + subject + have + past participle?",
      questionExample: "Will you have finished by noon?",
    },
  }[kind];
  return finish(unit, {
    canDo: data.canDo,
    meaning: [
      data.meaning,
      kind === "going"
        ? "Choose am, is or are from the subject; the verb after going to stays in its base form."
        : "Keep will unchanged for every subject; build the rest of the verb phrase after it.",
    ],
    patterns: [
      pattern("Affirmative", data.form, data.meaning, data.example),
      pattern("Negative", data.negative, `say the future ${kind === "perfect" ? "completion" : "event"} will not happen`, data.negativeExample),
      pattern("Yes/no question", data.question, "ask about the future", data.questionExample),
      pattern(
        "Wh-question",
        kind === "going"
          ? "Wh-word + am/is/are + subject + going to + base verb?"
          : "Wh-word + will + subject + verb phrase?",
        "ask for future details",
        kind === "going"
          ? "What are you going to revise tonight?"
          : "What will you be doing at eight?",
      ),
      pattern(
        "Time marker",
        kind === "perfect"
          ? "by + future time"
          : kind === "continuous"
            ? "at/this time + future time"
            : "tomorrow/next.../later + future form",
        "locate the future event",
        kind === "perfect"
          ? "By next month, she will have finished the course."
          : kind === "continuous"
            ? "This time tomorrow, we will be travelling."
            : "I am going to review the lesson tomorrow.",
      ),
    ],
    decisionSteps: tenseDecision(
      kind === "will"
        ? "Is this a decision now, an offer, promise or neutral prediction?"
        : kind === "going"
          ? "Was the plan decided earlier, or is there present evidence?"
          : kind === "continuous"
            ? "Will the action be in progress at a particular future time?"
            : "Will the action be complete before a future deadline?",
    ),
    contrasts: [
      {
        label: "Future choice",
        left: kind === "going" ? "I am going to study tonight." : "I will answer the phone.",
        right: kind === "perfect" ? "By ten, I will have studied for two hours." : "At ten, I will be studying.",
        explanation: "Choose the future form from the intended meaning: decision, prior plan, action in progress or completion before a deadline.",
      },
    ],
  });
}

function conditionalGuide(unit: GrammarUnit, kind: "zero" | "first" | "second" | "third" | "mixed"): GrammarLessonGuide {
  const forms = {
    zero: ["if + present simple, present simple", "If I skip practice, I forget new words.", "general truths and repeated results"],
    first: ["if + present simple, will + base verb", "If I finish early, I will review the vocabulary.", "a real future possibility"],
    second: ["if + past simple, would + base verb", "If I had more time, I would read another article.", "an imaginary or unlikely present/future situation"],
    third: ["if + past perfect, would have + past participle", "If I had saved the file, I would not have lost my notes.", "an unreal past and its imagined result"],
    mixed: ["if + past perfect, would + base verb", "If I had slept earlier, I would feel better now.", "a past cause with a present result"],
  } as const;
  const [form, example, use] = forms[kind];
  return finish(unit, {
    canDo: `express ${use} and vary the clause order accurately.`,
    meaning: [
      `Use this conditional for ${use}.`,
      "The verb after if does not use will or would in the standard pattern.",
      "Either clause may come first; use a comma when the if-clause comes first.",
    ],
    patterns: [
      pattern("If-clause first", form, use, example),
      pattern("Result first", form.split(", ").reverse().join(" + if + "), "put the result in focus", example.split(", ").reverse().join(" if ")),
      pattern("Negative condition", form, "express a condition that is not met", kind === "first" ? "If I do not rest, I will lose focus." : "If I had not rushed, I would have noticed the error."),
      pattern("Question", "question word + result clause + if-clause?", "ask about a consequence", kind === "second" ? "What would you change if you had more time?" : "What will you do if the task is difficult?"),
    ],
    decisionSteps: [
      "Place the situation on a timeline: general, possible future, unreal present or unreal past.",
      "Decide how real the speaker believes the condition is.",
      `Build the if-clause and result clause with: ${form}.`,
      "Check that will or would has not entered the if-clause.",
      "Say the sentence in both clause orders.",
    ],
    contrasts: [
      {
        label: "Reality changes the form",
        left: "If I have time, I will call you.",
        right: "If I had time, I would call you.",
        explanation: "First conditional presents a real possibility; second conditional makes it imaginary or less likely.",
      },
    ],
  });
}

function modalGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();
  const past = /\bpast\b/.test(title);
  const probability = /deduction|probability|certainty|nuanced modality/.test(title);
  return finish(unit, {
    canDo: past
      ? "make careful deductions about past events and show different degrees of certainty."
      : probability
        ? "express present or future probability and certainty without presenting guesses as facts."
      : "express ability, obligation, advice, permission or possibility with the correct modal meaning.",
    meaning: past
      ? ["Use modal + have + past participle to judge a completed past situation.", "Choose must have for a strong positive deduction, might/may/could have for possibility, and cannot have for a strong negative deduction."]
      : probability
        ? ["Choose a modal or probability expression from the strength of the evidence.", "Distinguish logical deduction from permission, obligation and personal willingness."]
      : ["A modal changes the speaker's meaning: ability, advice, necessity, permission or possibility.", "The main verb after a modal stays in the base form and does not take -s or to."],
    patterns: past
      ? [
          pattern("Strong deduction", "must have + past participle", "show strong certainty about the past", "She must have missed the reminder."),
          pattern("Past possibility", "may/might/could have + past participle", "show an uncertain past possibility", "He might have saved a second copy."),
          pattern("Strong negative deduction", "cannot/could not have + past participle", "say a past explanation is impossible", "They cannot have finished already."),
          pattern("Past criticism", "should have + past participle", "say a better past action was possible", "I should have checked the date."),
        ]
      : probability
        ? [
          pattern("Strong positive deduction", "must + base verb / must be + complement", "show a conclusion strongly supported by evidence", "The server is responding, so it must be online."),
          pattern("Open possibility", "may/might/could + base verb", "present one possible explanation", "The delay might come from the network."),
          pattern("Strong negative deduction", "cannot/can't + base verb", "reject an explanation as logically impossible", "This cannot be the final version; two sections are missing."),
          pattern("Expected result", "should/ought to + base verb", "show a probable expected outcome", "The update should finish within a minute."),
          pattern("Lexical probability", "be likely/unlikely/bound to + base verb", "express probability with adjective phrases", "The second attempt is likely to work."),
          pattern("Future scale", "will definitely / will probably / may / probably will not / definitely will not", "grade future certainty", "The backup will probably preserve the settings."),
        ]
      : [
          pattern("Affirmative", "subject + modal + base verb", "express the selected modal meaning", "You should take a short break."),
          pattern("Negative", "subject + modal + not + base verb", "remove permission, ability or necessity", "You must not share the password."),
          pattern("Question", "Modal + subject + base verb?", "ask about ability, permission or possibility", "Can you hear the recording?"),
          pattern("Past/reference alternative", "had to / was able to / was allowed to", "express meanings without a suitable modal tense", "I had to restart the exercise."),
          pattern("Strength scale", "might → should → must", "move from possibility to advice to necessity", "You might rest. / You should rest. / You must rest."),
        ],
    decisionSteps: probability
      ? ["List the available evidence.", "Choose a certainty band: certain, probable, possible, improbable or impossible.", "Select a modal or lexical expression with matching strength and time.", "Use have + past participle only for a completed past situation.", "Avoid stronger language than the evidence supports."]
      : [
          "Name the exact meaning first: ability, advice, obligation, permission, possibility or deduction.",
          "Choose the modal for that strength and time reference.",
          "Use the base verb after a present modal; use have + past participle for a past deduction.",
          "Check whether the negative changes meaning, especially must not versus do not have to.",
        ],
    contrasts: [
      probability
        ? {
            label: past ? "Past certainty scale" : "Evidence changes certainty",
            left: past ? "She must have missed the reminder." : "The file must be incomplete.",
            right: past ? "She might have missed the reminder." : "The file might be incomplete.",
            explanation: "Must presents a strong evidence-based conclusion; might presents only a possibility.",
          }
        : {
            label: "Prohibition vs no necessity",
            left: "You must not open this file.",
            right: "You do not have to open this file.",
            explanation: "Must not prohibits the action; do not have to means the action is optional.",
          },
    ],
  });
}

function passiveGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "focus on an action or result when the agent is unknown, obvious or less important.",
    meaning: [
      "The passive changes the focus, not the time: keep the tense on be and use the past participle.",
      "Add by + agent only when the agent gives useful new information.",
    ],
    patterns: [
      pattern("Present passive", "subject + am/is/are + past participle", "describe a process or current fact", "Progress is saved automatically."),
      pattern("Past passive", "subject + was/were + past participle", "report a completed past action", "The settings were updated yesterday."),
      pattern("Perfect passive", "subject + have/has been + past participle", "connect a completed action to now", "The lesson has been revised."),
      pattern("Modal passive", "subject + modal + be + past participle", "express possibility or necessity", "The answer can be recorded again."),
      pattern("Agent", "passive clause + by + agent", "name an important agent", "The schedule was changed by the professor."),
      pattern("Question", "auxiliary + subject + past participle?", "ask about the action or result", "Was the backup imported correctly?"),
    ],
    decisionSteps: [
      "Choose the focus: the doer or the action/result.",
      "Identify the required time and tense.",
      "Put that tense on be, then add the main verb's past participle.",
      "Add the agent only if it matters.",
      "Check subject–verb agreement on be.",
    ],
    contrasts: [
      {
        label: "Active vs passive focus",
        left: "The app saves your progress.",
        right: "Your progress is saved by the app.",
        explanation: "Active focuses on the app; passive focuses on your progress.",
      },
    ],
  });
}

function reportedGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "report statements, questions and instructions while preserving the original meaning.",
    meaning: [
      "Change pronouns, time expressions and viewpoint when the reporting context changes.",
      "Backshift is common after a past reporting verb, but it is not required when the fact is still true or the report is immediate.",
    ],
    patterns: [
      pattern("Statement", "said (that) + clause / told + person + clause", "report information", "She said that the lesson was useful."),
      pattern("Yes/no question", "asked + if/whether + subject + verb", "report a yes/no question", "He asked whether I was ready."),
      pattern("Wh-question", "asked + wh-word + subject + verb", "report an information question", "She asked where I had saved the file."),
      pattern("Command/request", "told/asked + person + to + verb", "report an instruction", "The teacher asked us to compare the examples."),
      pattern("Negative command", "told/asked + person + not to + verb", "report a prohibition", "She told me not to close the page."),
    ],
    decisionSteps: [
      "Identify whether the original is a statement, question or instruction.",
      "Choose say, tell or ask and include a person where the verb requires one.",
      "Change question word order to statement order in reported questions.",
      "Adjust pronouns, place and time from the reporter's viewpoint.",
      "Backshift only when the time relationship requires it.",
    ],
    contrasts: [
      {
        label: "Direct vs reported question",
        left: "She asked, ‘Where is the file?’",
        right: "She asked where the file was.",
        explanation: "A reported question keeps the question meaning but uses statement word order and no auxiliary do.",
      },
    ],
  });
}

function nounGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();
  const article = /article|a\/an|the\b/.test(title);
  const quantifier = /quant|some|any|much|many|few|little|count|uncount/.test(title);
  return finish(unit, {
    canDo: article
      ? "choose a, an, the or no article from meaning and shared context."
      : quantifier
        ? "choose a quantity expression that matches countability, sentence type and intended amount."
        : "form and use singular, plural and possessive noun phrases accurately.",
    meaning: article
      ? ["Use a/an for one non-specific singular countable noun.", "Use the when the listener can identify the noun.", "Use no article for plural or uncountable nouns when speaking generally."]
      : quantifier
        ? ["First decide whether the noun is countable or uncountable.", "Then decide whether the sentence is affirmative, negative or a question, and whether the amount is large, small or sufficient."]
        : ["A noun phrase can show number, ownership and definiteness.", "Spelling and agreement change when a singular noun becomes plural."],
    patterns: article
      ? [
          pattern("a", "a + consonant sound + singular countable noun", "introduce one non-specific thing", "I need a notebook."),
          pattern("an", "an + vowel sound + singular countable noun", "introduce one non-specific thing", "She found an effective method.", "Choose by sound: an hour, but a university."),
          pattern("the", "the + identifiable noun", "refer to a specific or shared thing", "Please open the file we discussed."),
          pattern("No article", "plural/uncountable noun used generally", "make a general statement", "Practice improves fluency."),
        ]
      : quantifier
        ? [
          pattern("Countable quantity", "many / a few / few + plural noun", "describe a number", "I completed a few exercises."),
          pattern("Uncountable quantity", "much / a little / little + uncountable noun", "describe an amount", "We have a little time left."),
          pattern("Both types", "some / any / a lot of + noun", "describe quantity flexibly", "Do you have any questions?"),
          pattern("Enough", "enough + noun / adjective + enough", "show sufficiency", "We have enough examples, and they are clear enough."),
          pattern("Too much/many", "too much + uncountable / too many + plural", "show excess", "Too many alerts reduce my focus."),
        ]
      : [
          pattern("Singular", "determiner + singular countable noun", "refer to one thing", "This lesson has one clear goal."),
          pattern("Regular plural", "noun + -s/-es", "refer to more than one", "The course contains short lessons."),
          pattern("Irregular plural", "irregular plural form", "use a stored plural form", "Two people joined the discussion."),
          pattern("Possession", "owner + 's / plural owner + '", "show ownership or relationship", "This is the learner's notebook."),
        ],
    decisionSteps: article
      ? ["Is the noun countable?", "Is it singular or plural?", "Can the listener identify it?", "Choose a/an by sound, not spelling.", "Read the full noun phrase aloud."]
      : ["Identify the noun and its meaning.", "Decide singular/plural or countable/uncountable.", "Choose the determiner or ending.", "Check agreement with the verb and pronoun."],
    contrasts: [
      article
        ? {
            label: "First mention vs shared reference",
            left: "I opened a document.",
            right: "The document contained three exercises.",
            explanation: "A introduces it; the refers back to the now-identifiable document.",
          }
        : {
            label: "Small but positive vs almost none",
            left: "I have a little time.",
            right: "I have little time.",
            explanation: "A little means some useful amount; little emphasizes that the amount is nearly insufficient.",
          },
    ],
  });
}

function pronounGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "choose the correct pronoun or possessive form from its job in the sentence.",
    meaning: [
      "Choose by function: subject, object, owner before a noun, independent possession or reference back to the subject.",
      "The form depends on grammatical role, not only on the person.",
    ],
    patterns: [
      pattern("Subject pronoun", "I/you/he/she/it/we/they + verb", "name who performs or experiences", "She records an answer every day."),
      pattern("Object pronoun", "verb/preposition + me/you/him/her/it/us/them", "name who receives the action", "The tutor helped her."),
      pattern("Possessive adjective", "my/your/his/her/its/our/their + noun", "identify an owner before a noun", "This is their lesson plan."),
      pattern("Possessive pronoun", "mine/yours/his/hers/ours/theirs", "replace an owned noun phrase", "That notebook is mine."),
      pattern("Reflexive", "myself/yourself/himself/herself/itself/ourselves/themselves", "refer back to the subject", "I recorded myself speaking."),
    ],
    decisionSteps: ["Find the target word's job in the sentence.", "Is it before the verb, after a verb/preposition, before a noun or replacing a noun?", "Choose the matching form and person.", "Check that every pronoun has a clear reference."],
    contrasts: [
      {
        label: "Owner before noun vs independent possession",
        left: "This is my notebook.",
        right: "This notebook is mine.",
        explanation: "My must be followed by a noun; mine replaces the whole noun phrase.",
      },
    ],
  });
}

function comparisonGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "compare people, things and changes with an accurate form and degree.",
    meaning: ["Choose the form from adjective length and meaning, not from emphasis alone.", "A comparison normally needs a clear reference point, often introduced by than or in/of."],
    patterns: [
      pattern("Short comparative", "adjective-er + than", "compare two things", "This exercise is shorter than the last one."),
      pattern("Long comparative", "more/less + adjective + than", "compare two things", "The second explanation is more precise than the first."),
      pattern("Superlative", "the + adjective-est / most + adjective", "identify the extreme in a group", "This is the clearest example in the lesson."),
      pattern("Equality", "as + adjective + as", "show equal degree", "The audio task is as important as the writing task."),
      pattern("Change", "comparative and comparative / the more..., the more...", "describe connected change", "The more I practise, the faster I respond."),
    ],
    decisionSteps: ["Decide whether you compare two items, a group, equality or change.", "Check adjective length and irregular forms.", "Build the comparison marker and reference point.", "Avoid using both more and -er together."],
    contrasts: [
      {
        label: "Comparative vs superlative",
        left: "This task is easier than that one.",
        right: "This is the easiest task in the unit.",
        explanation: "Comparative relates two; superlative identifies one item within a group of three or more.",
      },
    ],
  });
}

function adjectivePatternGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();
  if (/-ed and -ing/.test(title)) {
    return finish(unit, {
      canDo: "distinguish the cause of a feeling from the person or thing that experiences it.",
      meaning: ["An -ing adjective describes the person, thing or situation that creates a feeling.", "An -ed adjective describes the person or animal that experiences the feeling."],
      patterns: [
        pattern("Cause", "thing/situation + be + -ing adjective", "describe what creates the feeling", "The final exercise was tiring."),
        pattern("Experience", "person + be/feel + -ed adjective", "describe the experienced feeling", "I felt tired after the exercise."),
        pattern("Cause + object", "thing + make + person + adjective", "connect cause and experiencer", "Long instructions make me confused."),
        pattern("Degree", "very/really/quite + -ed/-ing adjective", "adjust the strength", "The explanation was really encouraging."),
        pattern("Preposition", "-ed adjective + conventional preposition", "name the source or topic", "She is interested in pronunciation."),
      ],
      decisionSteps: ["Identify the feeling.", "Ask whether the noun causes or experiences it.", "Choose -ing for the cause and -ed for the experiencer.", "Check the adjective's usual preposition when adding a topic."],
      contrasts: [{ label: "Cause vs experiencer", left: "The lesson is confusing.", right: "The learner is confused.", explanation: "The lesson causes confusion; the learner experiences it." }],
    });
  }
  if (/so and such/.test(title)) {
    return finish(unit, {
      canDo: "intensify descriptions with so and such and connect them to results.",
      meaning: ["So intensifies an adjective, adverb or quantity word.", "Such intensifies a noun phrase; article position remains inside the noun phrase."],
      patterns: [
        pattern("so + adjective/adverb", "so + adjective/adverb", "intensify a quality or manner", "The example was so clear."),
        pattern("such + noun phrase", "such + a/an + adjective + singular noun", "intensify a noun description", "It was such a clear example."),
        pattern("Plural/uncountable", "such + adjective + plural/uncountable noun", "intensify without an article", "They gave such useful advice."),
        pattern("Quantity", "so much/many/few/little + noun", "intensify quantity", "There were so many examples that I needed a break."),
        pattern("Result", "so/such ... that + clause", "connect intensity to a consequence", "The audio was so quiet that I played it twice."),
      ],
      decisionSteps: ["Identify whether the head is an adjective/adverb, noun phrase or quantity.", "Choose so before an adjective/adverb and such before a noun phrase.", "Place a/an after such.", "Add that + result when the consequence matters."],
      contrasts: [{ label: "Same meaning, different structure", left: "The task was so difficult.", right: "It was such a difficult task.", explanation: "So modifies difficult; such modifies the whole noun phrase a difficult task." }],
    });
  }
  if (/gradable and non-gradable/.test(title)) {
    return finish(unit, {
      canDo: "match degree modifiers to gradable, extreme and absolute adjectives.",
      meaning: ["Gradable adjectives allow degrees and comparative forms.", "Extreme or absolute adjectives normally use modifiers such as absolutely, completely or virtually rather than very."],
      patterns: [
        pattern("Gradable", "slightly/quite/very/extremely + gradable adjective", "show a point on a scale", "The second task was slightly difficult."),
        pattern("Extreme", "absolutely/really + extreme adjective", "intensify a built-in extreme meaning", "The instructions were absolutely impossible to follow."),
        pattern("Absolute", "completely/almost/virtually + absolute adjective", "show completeness or near-completeness", "The backup was completely empty."),
        pattern("Weakening", "fairly/rather/a little + gradable adjective", "reduce or qualify degree", "The explanation was fairly clear."),
        pattern("Comparative", "much/far/a little + comparative", "modify a difference", "The revised version is far clearer."),
      ],
      decisionSteps: ["Place the adjective on a scale: ordinary gradable, extreme or absolute.", "Choose an intensifier compatible with that scale.", "Check whether the context needs stronger or weaker degree.", "Avoid combinations such as very impossible in careful standard usage."],
      contrasts: [{ label: "Ordinary vs extreme", left: "very tired", right: "absolutely exhausted", explanation: "Tired is gradable; exhausted already contains an extreme degree." }],
    });
  }
  return finish(unit, {
    canDo: "modify comparisons precisely to show the size, limit and development of a difference.",
    meaning: ["Use degree modifiers before the comparative form.", "Use by for the measured amount of change and of for a fraction or proportion."],
    patterns: [
      pattern("Large difference", "much/far/a lot + comparative", "show a substantial difference", "The revised page is far easier to read."),
      pattern("Small difference", "slightly/a little/a bit + comparative", "show a small difference", "The second recording is slightly clearer."),
      pattern("No difference", "no/not any + comparative", "show that a comparison does not improve", "The longer session was no more effective."),
      pattern("Measured difference", "comparative + by + amount", "quantify the change", "Accuracy improved by ten percentage points."),
      pattern("Developing change", "comparative and comparative / the more..., the more...", "show continuing or linked change", "The more I repeat, the more fluent I become."),
    ],
    decisionSteps: ["Identify the two items or stages being compared.", "Choose the comparative form.", "Decide whether the difference is large, small, absent or measured.", "Add the matching modifier and comparison reference."],
    contrasts: [{ label: "Degree of difference", left: "slightly clearer", right: "far clearer", explanation: "Both are comparative, but the modifier communicates a very different size of change." }],
  });
}

function prepositionGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();
  if (/prepositions of time/.test(title)) {
    return finish(unit, {
      canDo: "choose at, on or in for clock times, dates and longer periods, including common fixed exceptions.",
      meaning: ["Think from the smallest point to a longer container: at a point, on a day/date, in a longer period.", "Some fixed expressions must be stored as phrases, such as at night and in the morning."],
      patterns: [
        pattern("at", "at + precise time/point", "name a clock time or exact point", "The class starts at 7:00."),
        pattern("on", "on + day/date/specific day", "locate an event on a calendar day", "We meet on Monday and on 17 August."),
        pattern("in", "in + month/year/season/part of day", "locate an event in a longer period", "The course begins in August in the evening."),
        pattern("No preposition", "last/next/this/every + time noun", "use a direct time expression", "I practised every morning last week."),
        pattern("Fixed exceptions", "at night; at the weekend (BrE); in the morning; on time", "use established phrases", "I study in the morning but not at night."),
      ],
      decisionSteps: ["Identify the time expression.", "Choose point, day/date or longer period.", "Check for last, next, this or every, which normally takes no preposition.", "Check fixed exceptions and read the whole phrase."],
      contrasts: [{ label: "Day vs part of a day", left: "on Monday", right: "on Monday morning", explanation: "A named day controls on, even when a part of that day follows." }],
    });
  }
  if (/prepositions of place/.test(title)) {
    return finish(unit, {
      canDo: "locate people and objects precisely with point, surface, container and relative-position prepositions.",
      meaning: ["Visualise the spatial relationship instead of translating one preposition at a time.", "At treats a place as a point, on as a surface and in as an area or container."],
      patterns: [
        pattern("at", "at + point/activity place", "locate someone at a point", "She is waiting at the door."),
        pattern("on", "on + surface/line", "show contact with a surface", "The notes are on the desk."),
        pattern("in", "in + container/area", "show a position inside boundaries", "The file is in the folder."),
        pattern("Relative position", "above/below/behind/in front of/next to/between + noun", "locate one thing relative to another", "The microphone is next to the screen."),
        pattern("Position vs destination", "in/on = position; into/onto = movement", "distinguish location from direction", "The file is in the folder; move it into the archive."),
      ],
      decisionSteps: ["Identify the reference object or place.", "Visualise point, surface, container or relative position.", "Choose a position preposition unless movement into a destination is intended.", "Check whether the place has a conventional phrase."],
      contrasts: [{ label: "Point vs building interior", left: "I am at the library.", right: "I am in the library.", explanation: "At presents the library as a destination/activity point; in highlights physical position inside." }],
    });
  }
  if (/adjectives and prepositions/.test(title)) {
    return finish(unit, {
      canDo: "use common adjective–preposition partnerships and follow the preposition with a noun or -ing form.",
      meaning: ["Store the adjective and preposition together as one pattern.", "A verb after a preposition takes -ing, not an infinitive."],
      patterns: [
        pattern("feeling + about", "worried/excited/happy + about + noun/-ing", "name the topic of a feeling", "I am excited about starting the course."),
        pattern("response + at/by", "surprised/amazed/shocked + at/by + noun", "name the cause of a response", "She was surprised by the result."),
        pattern("skill + at", "good/bad + at + noun/-ing", "describe skill", "He is good at explaining patterns."),
        pattern("relationship + with/to", "pleased/angry + with; kind/similar + to", "describe a relationship or target", "This pattern is similar to the earlier one."),
        pattern("cause + for/of", "responsible/famous + for; afraid/proud + of", "complete common fixed partnerships", "I am proud of completing the review."),
      ],
      decisionSteps: ["Choose the adjective that expresses the intended meaning.", "Recall its preposition as part of the phrase.", "Use a noun, pronoun or -ing form after the preposition.", "Record a personal example to strengthen the partnership."],
      contrasts: [{ label: "Preposition changes the relationship", left: "angry with a person", right: "angry about a situation", explanation: "The adjective is the same, but the preposition identifies a different target." }],
    });
  }
  if (/verbs and prepositions/.test(title)) {
    return finish(unit, {
      canDo: "use common verb–preposition partnerships with the correct object pattern.",
      meaning: ["The preposition belongs to the verb pattern and may change the verb's meaning.", "A following verb takes -ing after the preposition."],
      patterns: [
        pattern("listen/talk + to", "listen/talk + to + person/thing", "name the target", "Listen to the recording twice."),
        pattern("depend/focus + on", "depend/focus + on + noun/-ing", "name a basis or focus", "Focus on producing a clear message."),
        pattern("belong/respond + to", "belong/respond + to + noun", "show relation or response", "This note belongs to the first lesson."),
        pattern("apologise/apply + for", "verb + for + noun/-ing", "name a reason or purpose", "She apologised for arriving late."),
        pattern("provide/compare + object + with", "verb + object + with + noun", "use a two-object pattern", "Compare your answer with the model."),
      ],
      decisionSteps: ["Identify the verb's intended meaning.", "Recall the complete verb–preposition pattern.", "Check whether the verb needs a direct object before the preposition.", "Use -ing if another verb follows the preposition."],
      contrasts: [{ label: "Pattern changes meaning", left: "look at the screen", right: "look for the file", explanation: "At names the visual target; for names the object of a search." }],
    });
  }
  return finish(unit, {
    canDo: "choose and place prepositions for time, place, movement and fixed combinations.",
    meaning: ["Learn a preposition as part of a meaning pattern or word partnership, not as a single translated word.", "Visualise the relationship: point, surface, container, direction, duration or source."],
    patterns: [
      pattern("Time point", "at + clock time; on + day/date; in + month/year/period", "locate an event in time", "The class starts at seven on Monday in August."),
      pattern("Place", "at + point; on + surface; in + area/container", "locate a person or thing", "My notes are in a folder on the desktop."),
      pattern("Movement", "to/into/onto/from/through + noun", "show direction or path", "Move the file into the project folder."),
      pattern("Duration/source", "for + period; since + starting point", "measure time up to a reference point", "I have practised for a week since the course began."),
      pattern("Fixed partnership", "adjective/verb/noun + required preposition", "complete a stored phrase", "She is interested in pronunciation."),
    ],
    decisionSteps: ["Name the relationship: time, place, movement, duration or fixed partnership.", "Draw or imagine the relationship.", "Choose the whole phrase, not a word-for-word translation.", "Check the noun or -ing form after the preposition."],
    contrasts: [
      {
        label: "Position vs movement",
        left: "The file is in the folder.",
        right: "Put the file into the folder.",
        explanation: "In gives a position; into gives movement from outside to inside.",
      },
    ],
  });
}

function clauseGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "connect ideas in a clear sentence while showing time, reason, contrast, condition or description.",
    meaning: ["Choose the connector from the logical relationship between the ideas.", "Check whether the structure needs a full clause, noun phrase or -ing form after it."],
    patterns: [
      pattern("Reason", "because + clause / because of + noun phrase", "give a reason", "I repeated the task because my first answer was unclear."),
      pattern("Contrast", "although + clause / despite + noun phrase or -ing", "show an unexpected contrast", "Although I was tired, I completed the review."),
      pattern("Relative clause", "noun + who/which/that + clause", "identify or add information", "The exercise that I repeated became easier."),
      pattern("Participle clause", "-ing/-ed clause, main clause", "compress related information", "Working slowly, I noticed the pattern."),
      pattern("Purpose", "to + base verb / so that + clause", "state a goal", "I recorded myself to check my pronunciation."),
    ],
    decisionSteps: ["Name the relationship between the two ideas.", "Choose a connector with the required meaning and register.", "Check what grammar follows that connector.", "Decide whether both subjects must be stated.", "Read for clarity and punctuation."],
    contrasts: [
      {
        label: "Clause vs noun phrase",
        left: "Although I was tired, I practised.",
        right: "Despite being tired, I practised.",
        explanation: "Although takes a clause; despite takes a noun phrase or -ing form.",
      },
    ],
  });
}

function verbPatternGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "choose the verb pattern that preserves the intended meaning.",
    meaning: ["Learn the first verb together with the form that follows it.", "Some verbs change meaning when followed by -ing rather than to + infinitive."],
    patterns: [
      pattern("Verb + -ing", "verb + gerund", "use after verbs such as enjoy, avoid and suggest", "I enjoy practising with short recordings."),
      pattern("Verb + to-infinitive", "verb + to + base verb", "use after verbs such as decide, hope and plan", "I plan to review the lesson tomorrow."),
      pattern("Verb + object + infinitive", "verb + person + to + base verb", "show who performs the second action", "The tutor asked me to repeat the sentence."),
      pattern("Preposition + -ing", "preposition + gerund", "use a verb after a preposition", "She improved by recording herself."),
      pattern("Meaning change", "remember/stop/try + -ing or to-infinitive", "express different time or intention", "I stopped speaking to listen. / I stopped using that method."),
    ],
    decisionSteps: ["Identify the first verb or preposition.", "Recall the pattern stored with that word.", "If both forms are possible, decide whether the meaning changes.", "Check whether an object is required between the verbs."],
    contrasts: [
      {
        label: "Stop to do vs stop doing",
        left: "I stopped to take a break.",
        right: "I stopped studying for the day.",
        explanation: "Stop to do interrupts one action for a purpose; stop doing ends the named activity.",
      },
    ],
  });
}

function haveGotGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "talk about possession, family relationships, features and common health problems with have got.",
    meaning: [
      "Have got usually describes possession or a present state, not a repeated action.",
      "Use have with I/you/we/they and has with he/she/it; got stays unchanged.",
    ],
    patterns: [
      pattern("Affirmative", "I/you/we/they have got; he/she/it has got", "describe possession or a feature", "I have got a quiet place to study."),
      pattern("Negative", "subject + have/has not got", "say something is not possessed or true", "She has not got a microphone."),
      pattern("Yes/no question", "Have/Has + subject + got?", "ask about possession or a feature", "Have you got enough time?"),
      pattern("Short answer", "Yes, subject + have/has. / No, subject + have/has not.", "answer without repeating got", "Yes, I have."),
      pattern("Standard have alternative", "subject + have/has; do/does not have; Do/Does ... have?", "use a common alternative, especially in American English", "Do you have a backup copy?"),
    ],
    decisionSteps: ["Is the meaning possession, relationship, feature or present condition?", "Find the subject and choose have or has.", "For the have got pattern, move have/has to form a question.", "Do not mix Have you got...? with Do you have got...?"],
    contrasts: [
      {
        label: "Two correct systems",
        left: "Have you got a pen?",
        right: "Do you have a pen?",
        explanation: "Both are standard; keep the auxiliary system consistent within the sentence.",
      },
    ],
  });
}

function thereGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "say that something exists, describe quantities and ask what is available.",
    meaning: ["There is/are introduces the existence or presence of something.", "Choose is or are from the noun phrase that follows."],
    patterns: [
      pattern("Singular/uncountable", "there is + singular or uncountable noun", "introduce one thing or an amount", "There is a new exercise on the page."),
      pattern("Plural", "there are + plural noun", "introduce more than one thing", "There are three examples in this lesson."),
      pattern("Negative", "there is not / there are not + noun", "say something is absent", "There is not enough space on the screen."),
      pattern("Question", "Is/Are there + noun?", "ask whether something exists", "Are there any questions?"),
      pattern("Quantity answer", "There is/are + number or quantifier + noun", "give an amount", "There are a few difficult words."),
    ],
    decisionSteps: ["Are you introducing existence, rather than identifying a location?", "Look at the noun after the verb.", "Choose is for singular/uncountable and are for plural.", "Use any naturally in most negatives and questions."],
    contrasts: [
      {
        label: "Existence vs location",
        left: "There is a notebook on the desk.",
        right: "The notebook is on the desk.",
        explanation: "There is introduces the notebook; the second sentence locates an already-known notebook.",
      },
    ],
  });
}

function imperativeGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "give clear instructions, warnings, invitations and inclusive suggestions politely.",
    meaning: ["An imperative normally addresses you, so the subject is omitted.", "Tone depends on context, voice and politeness markers; a bare imperative can sound strong."],
    patterns: [
      pattern("Positive instruction", "base verb + complement", "tell someone what to do", "Open the lesson and choose your level."),
      pattern("Negative instruction", "do not/don't + base verb", "tell someone not to do something", "Do not close the page before saving."),
      pattern("Polite request", "please + imperative / imperative + please", "soften an instruction", "Please repeat the sentence slowly."),
      pattern("Inclusive suggestion", "let's + base verb", "suggest an action together", "Let's compare the two answers."),
      pattern("Sequence", "first/then/next/finally + imperative", "organise multi-step instructions", "First listen; then record your answer."),
    ],
    decisionSteps: ["Decide whether you need an instruction, warning, request or joint suggestion.", "Start with the base verb; omit you in an ordinary imperative.", "Add don't for a negative or let's for a joint action.", "Check whether please or a softer modal request suits the relationship."],
    contrasts: [
      {
        label: "Direct vs softer",
        left: "Send me the file.",
        right: "Could you send me the file, please?",
        explanation: "Both request an action; the modal question is softer and often better with unfamiliar people.",
      },
    ],
  });
}

function simpleContinuousContrastGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "choose between present simple and present continuous from meaning, not from a single time word.",
    meaning: ["Present simple frames a routine, fact or stable state.", "Present continuous frames an action in progress, temporary situation, change or arranged future event."],
    patterns: [
      pattern("Routine/fact", "subject + present-simple verb", "describe what usually or generally happens", "I study at home every Friday."),
      pattern("Action now", "subject + am/is/are + verb-ing", "describe what is happening now", "I am studying a new pattern now."),
      pattern("Stable vs temporary", "simple = stable; continuous = temporary", "contrast a usual situation with a limited one", "She works in Berlin, but she is working from home this week."),
      pattern("State verb", "know/need/believe/prefer in present simple", "describe a state rather than an active process", "I understand the difference now."),
      pattern("Future arrangement", "present continuous + future time", "describe an arranged future event", "I am meeting my tutor tomorrow."),
    ],
    decisionSteps: ["Ask whether the speaker sees this as usual/stable or in progress/temporary.", "Check whether the verb describes a state.", "Choose the tense and build its complete form.", "Use the time expression as supporting evidence, not the only decision."],
    contrasts: [
      {
        label: "Speaker's viewpoint",
        left: "He is polite.",
        right: "He is being polite today.",
        explanation: "The simple form describes character; the continuous form presents temporary behaviour.",
      },
    ],
  });
}

function frequencyGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "describe how often something happens and place frequency expressions naturally.",
    meaning: ["Adverbs such as always, usually, often, sometimes, rarely and never show approximate frequency.", "Exact expressions such as every day and twice a week usually go at the beginning or end."],
    patterns: [
      pattern("Before main verb", "subject + frequency adverb + main verb", "describe usual frequency", "I usually review words after breakfast."),
      pattern("After be", "subject + be + frequency adverb", "describe frequency with be", "The first exercise is often easy."),
      pattern("After first auxiliary", "subject + auxiliary + frequency adverb + main verb", "place frequency in a multi-part verb", "I have never missed a saved review."),
      pattern("Sometimes", "sometimes + clause / subject + sometimes + verb / clause + sometimes", "vary focus and rhythm", "Sometimes I practise for only ten minutes."),
      pattern("Exact frequency", "once/twice/three times a week; every day", "give a measurable frequency", "She records her voice twice a week."),
    ],
    decisionSteps: ["Choose approximate or exact frequency.", "Find be, an auxiliary or the main verb.", "Place the adverb after be, after the first auxiliary, or before an ordinary main verb.", "Avoid using never with another negative."],
    contrasts: [
      {
        label: "Position changes with the verb",
        left: "I often feel tired.",
        right: "I am often tired.",
        explanation: "Often comes before an ordinary verb but after be.",
      },
    ],
  });
}

function forSinceGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "state duration and starting points with for and since.",
    meaning: ["For answers how long and is followed by a period of time.", "Since answers from when and is followed by the starting point."],
    patterns: [
      pattern("Duration", "for + period", "measure how long", "I have studied for forty minutes."),
      pattern("Starting point", "since + point in time", "name when the period began", "I have studied since nine o'clock."),
      pattern("Since-clause", "since + past-simple clause", "name a starting event", "My routine has improved since I started recording."),
      pattern("Question", "How long + have/has + subject + past participle?", "ask about duration up to now", "How long have you used this method?"),
      pattern("Finished duration", "past simple + for + period", "describe a duration that ended", "I studied there for two years, but I left in 2024."),
    ],
    decisionSteps: ["Is the period still connected to now or finished?", "Do you want the length or the starting point?", "Choose for + period or since + point/event.", "Check that the tense matches whether the situation continues."],
    contrasts: [
      {
        label: "Period vs point",
        left: "for three weeks",
        right: "since 1 August",
        explanation: "Both can describe the same duration from different viewpoints.",
      },
    ],
  });
}

function questionTagGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "add a natural question tag to check information or invite agreement.",
    meaning: ["A tag repeats the statement's auxiliary and refers to the subject with a pronoun.", "A positive statement normally takes a negative tag; a negative statement takes a positive tag."],
    patterns: [
      pattern("Positive statement", "positive clause, negative auxiliary + pronoun?", "check expected agreement", "You saved the file, didn't you?"),
      pattern("Negative statement", "negative clause, positive auxiliary + pronoun?", "check a negative belief", "She isn't tired, is she?"),
      pattern("Be", "be-clause, opposite be + pronoun?", "form a tag without do", "They are ready, aren't they?"),
      pattern("No auxiliary", "present/past simple clause, do/does/did tag", "supply the missing auxiliary", "He works here, doesn't he?"),
      pattern("Special forms", "I'm ..., aren't I?; Let's ..., shall we?; imperative, will you?", "handle fixed tag patterns", "Let's begin, shall we?"),
    ],
    decisionSteps: ["Find the statement's auxiliary and tense.", "Reverse positive/negative polarity.", "Replace the subject with the correct pronoun.", "Use falling intonation for expected agreement and rising intonation for a real question."],
    contrasts: [
      {
        label: "Expectation vs open check",
        left: "You're ready, aren't you? ↘",
        right: "You're ready, aren't you? ↗",
        explanation: "Falling intonation expects agreement; rising intonation asks more openly.",
      },
    ],
  });
}

function tooEnoughGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "express excess and sufficiency with the correct word order.",
    meaning: ["Too means more than wanted or possible and usually signals a problem.", "Enough means sufficient for a purpose; its position changes with nouns and adjectives."],
    patterns: [
      pattern("Excess quality", "too + adjective/adverb", "show a problematic degree", "The recording is too quiet to understand."),
      pattern("Excess amount", "too much + uncountable / too many + plural noun", "show a problematic quantity", "There are too many new words today."),
      pattern("Sufficient quality", "adjective/adverb + enough", "show a sufficient degree", "The text is clear enough to read."),
      pattern("Sufficient amount", "enough + noun", "show a sufficient quantity", "We have enough time for one more exercise."),
      pattern("Result", "too ... to + verb / enough ... to + verb", "connect degree to a possible result", "I am rested enough to continue."),
    ],
    decisionSteps: ["Is the amount insufficient, sufficient or excessive?", "Identify whether the next word is a noun or adjective/adverb.", "Put enough before a noun but after an adjective/adverb.", "Add to + verb when you need to state the result."],
    contrasts: [
      {
        label: "Not enough vs too",
        left: "The audio isn't loud enough.",
        right: "The audio is too quiet.",
        explanation: "Both describe the same problem from opposite adjective scales.",
      },
    ],
  });
}

function unrealGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "express present wishes, past regrets, desired change and other unreal meanings on the correct timeline.",
    meaning: ["Unreal grammar moves the verb one step back to show distance from reality, not necessarily past time.", "Choose the form by locating the unreal situation in the present, past or desired future."],
    patterns: [
      pattern("Present wish", "wish/if only + past simple", "imagine a different present", "I wish I had more energy today."),
      pattern("Past regret", "wish/if only + past perfect", "imagine a different past", "If only I had saved the earlier version."),
      pattern("Desired change", "wish + subject + would + base verb", "complain about or request a change", "I wish the noise would stop."),
      pattern("Ability wish", "wish + could + base verb", "wish for a different ability or possibility", "I wish I could remember every word."),
      pattern("It's time", "it is time + subject + past simple", "say an action should happen now", "It is time we took a break."),
      pattern("Would rather", "would rather + subject + past simple", "state a preference about another person's action", "I would rather you spoke more slowly."),
    ],
    decisionSteps: ["Place the unreal idea on a timeline: present, past or desired future change.", "Choose past simple for unreal present and past perfect for past regret.", "Use would for desired change, not normally for your own deliberate action.", "Check that the grammatical past is expressing distance from reality."],
    contrasts: [
      {
        label: "Present wish vs past regret",
        left: "I wish I knew the answer.",
        right: "I wish I had known the answer.",
        explanation: "Past simple changes an unreal present; past perfect reimagines a finished past.",
      },
    ],
  });
}

function counterfactualGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "control degrees of factual distance across present, past and mixed counterfactual meanings.",
    meaning: ["Counterfactual distance is a viewpoint: past forms can mark remoteness rather than past time.", "Modal choice can make an imagined result tentative, expected, desired or strongly asserted."],
    patterns: [
      pattern("Open condition", "if + present, modal/future result", "leave a condition genuinely possible", "If the evidence is complete, we can answer the question."),
      pattern("Remote present/future", "if + past, would/could/might + base verb", "present an unlikely or imagined situation", "If the evidence were complete, we could answer the question."),
      pattern("Counterfactual past", "if + past perfect, would/could/might have + participle", "reimagine a finished past", "If the source had been available, we might have reached a different conclusion."),
      pattern("Mixed timeline", "if + past perfect, would + base verb", "connect a past cause to a present result", "If we had stored the data, the analysis would be easier now."),
      pattern("Implicit condition", "modal result without an explicit if-clause", "leave the condition recoverable from context", "With a larger sample, the result might be more reliable."),
    ],
    decisionSteps: ["State the factual situation first.", "Locate the imagined alternative and its result on the timeline.", "Choose open or remote viewpoint.", "Select would, could or might from the intended consequence.", "Check that the two clauses express the correct time relationship."],
    contrasts: [
      {
        label: "Possible vs remote",
        left: "If the test succeeds, we will continue.",
        right: "If the test succeeded, we would continue.",
        explanation: "The first keeps success open; the second presents it as more remote or hypothetical.",
      },
    ],
  });
}

function causativeGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "say that another person performs a service or that someone causes another person to act.",
    meaning: ["Have/get + object + past participle focuses on arranging a service, not doing it yourself.", "Have + person + base verb and get + person + to-infinitive name the person who performs the action."],
    patterns: [
      pattern("Arrange a service with have", "subject + have + object + past participle", "arrange for a service", "I had my laptop repaired yesterday."),
      pattern("Arrange a service with get", "subject + get + object + past participle", "arrange a service, often less formally", "She is getting her microphone tested."),
      pattern("Cause with have", "subject + have + person + base verb", "instruct or arrange for a person to act", "The teacher had us repeat the dialogue."),
      pattern("Persuade with get", "subject + get + person + to + base verb", "persuade or manage to make a person act", "I got my partner to record the question."),
      pattern("Unwanted event", "subject + have + object + past participle", "report an event experienced by the subject", "He had his account locked after several failed attempts."),
    ],
    decisionSteps: ["Did the subject perform the action personally?", "Decide whether to focus on a service/result or the person who acts.", "Choose object + participle for a service, or person + verb pattern for caused action.", "Put have/get in the required tense and keep the final verb form fixed."],
    contrasts: [
      {
        label: "Do it vs arrange it",
        left: "I repaired my laptop.",
        right: "I had my laptop repaired.",
        explanation: "The first says I did the work; the causative says I arranged for someone else to do it.",
      },
    ],
  });
}

function usedToGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "distinguish past habits from familiarity and the process of becoming familiar.",
    meaning: ["Used to + base verb describes a past state or habit that is no longer true.", "Be used to and get used to contain to as a preposition, so a following verb takes -ing."],
    patterns: [
      pattern("Past habit/state", "subject + used to + base verb", "describe a discontinued past situation", "I used to study late at night."),
      pattern("Past-habit negative", "subject + did not use to + base verb", "deny a past habit", "I did not use to record my voice."),
      pattern("Past-habit question", "Did + subject + use to + base verb?", "ask about a past habit", "Did you use to learn words from lists?"),
      pattern("Familiar now", "subject + be used to + noun/verb-ing", "say something feels normal", "I am used to speaking into a microphone."),
      pattern("Becoming familiar", "subject + get used to + noun/verb-ing", "describe adaptation", "She is getting used to the new layout."),
    ],
    decisionSteps: ["Do you mean a discontinued past habit, present familiarity or adaptation?", "Choose used to, be used to or get used to.", "Use a base verb after past-habit used to; use a noun or -ing after be/get used to.", "Use did + use to for a standard question or negative."],
    contrasts: [
      {
        label: "Past habit vs familiarity",
        left: "I used to study alone.",
        right: "I am used to studying alone.",
        explanation: "The first habit ended; the second situation is familiar now.",
      },
    ],
  });
}

function pastHabitsGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "describe repeated past behaviour and past states while showing whether they still continue.",
    meaning: ["Used to describes repeated actions or states that are no longer true.", "Would describes repeated past actions in an established past context, but not ordinary past states."],
    patterns: [
      pattern("Past action or state", "used to + base verb", "describe a discontinued habit or state", "I used to keep vocabulary on paper."),
      pattern("Repeated action in a story", "would + base verb", "recall repeated behaviour after the past context is clear", "Every evening, I would review ten words."),
      pattern("Specific or dated event", "past simple + finished time", "report one event or a sequence", "Last Friday, I reviewed the whole unit."),
      pattern("Negative habit", "did not use to + base verb", "deny a former habit", "I did not use to practise speaking."),
      pattern("Question", "Did + subject + use to + base verb?", "ask about a former habit or state", "Did you use to study at night?"),
    ],
    decisionSteps: ["Is the meaning repeated, a state or one specific event?", "Is it no longer true?", "Use used to for actions or states; would only for repeated actions with clear past context.", "Use past simple for a specific finished event.", "Use did + use to in standard questions and negatives."],
    contrasts: [{ label: "Action vs state", left: "We used to meet every week. / We would meet every week.", right: "I used to live nearby. (not normally would live)", explanation: "Would can replace used to for repeated actions, but not for an ordinary state such as live, know or have." }],
  });
}

function pastAbilityGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "distinguish general past ability from success in one particular difficult situation.",
    meaning: ["Could normally describes general ability in the past.", "Was/were able to or managed to is preferred for one successful completed event, especially when it was difficult."],
    patterns: [
      pattern("General ability", "could + base verb", "describe an ability over a past period", "At school, I could remember long poems."),
      pattern("Specific success", "was/were able to + base verb", "report success on one occasion", "I was able to recover the deleted note."),
      pattern("Difficult success", "managed to + base verb", "emphasise effort before success", "She managed to finish despite the noise."),
      pattern("Specific failure", "could not / was not able to + base verb", "report inability on one occasion", "I could not open the damaged file."),
      pattern("Perception/thought", "could + see/hear/understand/remember", "describe a specific mental or sensory ability", "From the back, I could hear every word."),
    ],
    decisionSteps: ["Is the ability general over a period or one completed event?", "Did the person succeed?", "Choose could for general ability, able to for specific success, or managed to to stress difficulty.", "Check whether a sensory/mental verb naturally allows could for one occasion."],
    contrasts: [
      {
        label: "General ability vs achieved result",
        left: "I could read quickly when I was younger.",
        right: "I managed to read the whole report before class.",
        explanation: "Could describes a general capacity; managed to reports one achieved result.",
      },
    ],
  });
}

function phrasalVerbGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "store and use phrasal verbs with their meaning, object pattern, register and word order.",
    meaning: ["Treat a phrasal verb as one vocabulary-and-grammar unit.", "Its particle may be inseparable, separable or part of a three-word verb; learn the object pattern with it."],
    patterns: [
      pattern("Intransitive", "verb + particle; no object", "describe an action without an object", "The computer suddenly shut down."),
      pattern("Separable noun object", "verb + noun + particle / verb + particle + noun", "place a noun object in either position", "Please turn the volume down. / Turn down the volume."),
      pattern("Separable pronoun", "verb + pronoun + particle", "place a pronoun between verb and particle", "The volume is high; please turn it down."),
      pattern("Inseparable", "verb + particle + object", "keep verb and particle together", "I am looking for a clearer example."),
      pattern("Three-word verb", "verb + particle + preposition + object", "use a fixed three-part unit", "I need to catch up with the class."),
    ],
    decisionSteps: ["Learn the phrasal verb's meaning and register as one unit.", "Check whether it needs an object.", "If it is separable, identify whether the object is a noun or pronoun.", "Put a pronoun between verb and particle.", "Test the verb in a new context rather than translating each part."],
    contrasts: [
      {
        label: "Noun can move; pronoun must move",
        left: "Turn down the music. / Turn the music down.",
        right: "Turn it down.",
        explanation: "With a separable phrasal verb, a pronoun object must go in the middle.",
      },
    ],
  });
}

function possessiveFormGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "ask about ownership and build singular, plural and irregular possessive noun phrases.",
    meaning: ["Possessive 's expresses ownership and many relationships, not only literal possession.", "The apostrophe position depends on whether the owner is singular or an already-plural noun ending in -s."],
    patterns: [
      pattern("Singular owner", "singular noun + 's + possessed noun", "show a relationship with one owner", "This is the learner's recording."),
      pattern("Regular plural owner", "plural noun ending -s + ' + possessed noun", "show a relationship with plural owners", "The students' answers were saved."),
      pattern("Irregular plural owner", "irregular plural + 's + possessed noun", "show ownership with a plural not ending in -s", "The children's books are here."),
      pattern("Whose question", "Whose + noun + be + this/that/these/those?", "ask about ownership", "Whose headphones are these?"),
      pattern("Independent answer", "possessive pronoun / noun + 's", "answer without repeating the possessed noun", "They are mine. / They are Sara's."),
    ],
    decisionSteps: ["Identify the owner and the owned/related noun.", "Decide whether the owner is singular, regular plural or irregular plural.", "Place the apostrophe accordingly.", "Use whose for the question and a possessive form for the answer."],
    contrasts: [
      {
        label: "Contraction vs possession",
        left: "The learner's tired. (= learner is)",
        right: "The learner's notebook. (= notebook of the learner)",
        explanation: "The following word shows whether 's is a verb contraction or a possessive marker.",
      },
    ],
  });
}

function mechanicsGuide(unit: GrammarUnit, advanced: boolean): GrammarLessonGuide {
  return finish(unit, {
    canDo: advanced
      ? "use punctuation to represent complex clause relationships, interruption, explanation and emphasis."
      : "use capitals and apostrophes to mark sentence boundaries, names, contractions and possession.",
    meaning: advanced
      ? ["Punctuation makes grammatical structure and rhetorical relationship visible.", "Choose a mark from the clause relationship; do not insert punctuation only where you pause."]
      : ["Capitals mark sentence beginnings, the pronoun I and proper names.", "Apostrophes mark omitted letters or possession; they do not form ordinary plurals."],
    patterns: advanced
      ? [
          pattern("Semicolon", "independent clause; closely related independent clause", "join two balanced related statements", "The first test measured recall; the second measured transfer."),
          pattern("Colon", "complete clause: explanation/list/example", "announce an expansion", "One problem remained: the evidence was incomplete."),
          pattern("Dash", "clause — interruption or emphatic addition", "create a strong break", "The result—unexpected but consistent—changed the analysis."),
          pattern("Parentheses", "sentence (supplementary information) sentence", "background non-essential detail", "The second sample (collected in June) produced similar results."),
          pattern("Non-defining commas", "noun, non-defining clause, rest", "mark supplementary relative information", "The prototype, which ran locally, stored every note."),
        ]
      : [
          pattern("Sentence/proper name", "Capital letter at sentence start and in proper names", "mark boundaries and unique names", "Mina studies English in Berlin."),
          pattern("Pronoun I", "I always capitalised", "write the first-person pronoun", "My partner and I practise together."),
          pattern("Contraction", "letters omitted → apostrophe", "shorten a verb phrase", "I am → I'm; do not → don't."),
          pattern("Possession", "singular 's / regular plural s'", "show ownership or relationship", "the teacher's book / the teachers' room"),
          pattern("Its vs it's", "its = possessive; it's = it is/has", "avoid a common apostrophe error", "The app saves its data; it's ready now."),
        ],
    decisionSteps: advanced
      ? ["Identify every complete and dependent clause.", "Name the relationship: balance, explanation, interruption or supplementary detail.", "Choose the mark that represents that relationship.", "Check that a colon or semicolon follows a complete clause.", "Read for clarity, then remove decorative punctuation."]
      : ["Mark the start of every sentence.", "Capitalise I and genuine proper names.", "For an apostrophe, decide contraction or possession.", "If possession, identify singular or plural owner.", "Never add an apostrophe only to make a plural."],
    contrasts: [
      advanced
        ? {
            label: "Semicolon vs colon",
            left: "The sample was small; the pattern was stable.",
            right: "The study had one limitation: the sample was small.",
            explanation: "A semicolon balances related clauses; a colon announces an explanation of the first clause.",
          }
        : {
            label: "Plural vs possession",
            left: "three learners",
            right: "one learner's notes",
            explanation: "An ordinary plural has no apostrophe; possession does.",
          },
    ],
  });
}

function varietyGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "recognise common British and American grammar differences and remain consistent without treating either variety as incorrect.",
    meaning: ["Most grammar is shared; differences are preferences that depend on context and variety.", "Choose a target variety for formal work, but understand both in listening and reading."],
    patterns: [
      pattern("Recent past", "BrE often present perfect; AmE also past simple", "report a recent completed event", "BrE: I've just eaten. / AmE: I just ate."),
      pattern("Possession", "BrE have got / AmE have", "describe possession", "Have you got a pen? / Do you have a pen?"),
      pattern("Past participle", "BrE got / AmE gotten for some meanings", "express development or acquisition", "The task has got easier. / The task has gotten easier."),
      pattern("Collective noun", "BrE singular or plural; AmE usually singular", "choose agreement by viewing the group", "The team are ready. / The team is ready."),
      pattern("Time/preposition", "at the weekend / on the weekend", "use a variety-specific fixed phrase", "We revise at the weekend. / We revise on the weekend."),
    ],
    decisionSteps: ["Identify whether the form is a true grammar difference or only spelling/vocabulary.", "Choose the target variety for the document.", "Use that variety consistently in formal work.", "Treat the other standard variety as acceptable, not an error.", "Prioritise clarity when the audience is international."],
    contrasts: [
      {
        label: "Difference is not error",
        left: "I've already finished. (common BrE preference)",
        right: "I already finished. (common AmE option)",
        explanation: "Both are standard in their contexts; consistency and audience matter more than declaring one universally correct.",
      },
    ],
  });
}

function inversionGuide(unit: GrammarUnit, conditional: boolean): GrammarLessonGuide {
  return finish(unit, {
    canDo: conditional
      ? "form formal conditionals without if and preserve the original time and meaning."
      : "use negative-fronting inversion for controlled emphasis in formal speech and writing.",
    meaning: conditional
      ? ["Omit if only when had, were or should can move before the subject.", "The inverted form is more formal but keeps the conditional meaning."]
      : ["When a negative or restrictive expression is fronted, auxiliary–subject inversion follows.", "Use this marked structure selectively; ordinary word order is usually more natural in conversation."],
    patterns: conditional
      ? [
          pattern("Third conditional", "Had + subject + past participle, would have + past participle", "form a formal unreal past condition", "Had I saved the file, I would have kept my notes."),
          pattern("Second conditional", "Were + subject + complement/to-infinitive, would + base verb", "form a formal unreal present condition", "Were I less tired, I would continue."),
          pattern("Tentative future", "Should + subject + base verb, imperative/will/can...", "form a formal possible future condition", "Should you need help, call me."),
          pattern("Negative condition", "Had/Were/Should + subject + not ...", "make the condition negative", "Had she not checked, the error would have remained."),
        ]
      : [
          pattern("Never/rarely", "negative adverbial + auxiliary + subject + verb", "emphasise rarity", "Rarely have I seen such a clear explanation."),
          pattern("Only after/when", "only + time expression + auxiliary + subject + verb", "emphasise a delayed condition", "Only after I repeated it did I understand."),
          pattern("Not until", "not until + clause + auxiliary + subject + verb", "emphasise the late point of change", "Not until the final example did the rule become clear."),
          pattern("No sooner", "no sooner + had + subject + participle + than...", "show immediate sequence", "No sooner had I saved the file than the screen closed."),
          pattern("Under no circumstances", "restrictive phrase + modal/auxiliary + subject + verb", "express a strong prohibition", "Under no circumstances should you share the key."),
        ],
    decisionSteps: conditional
      ? ["Build the full if-conditional first.", "Check for had, were or should in the if-clause.", "Remove if and move that auxiliary before the subject.", "Keep the result clause unchanged and check the timeline."]
      : ["Decide whether strong formal emphasis is useful.", "Front the negative or restrictive expression.", "Identify or add the correct auxiliary.", "Invert only auxiliary and subject; keep the main verb form correct.", "Compare with an ordinary version for register."],
    contrasts: [
      conditional
        ? {
            label: "Ordinary vs inverted condition",
            left: "If I had known, I would have prepared.",
            right: "Had I known, I would have prepared.",
            explanation: "Meaning and timeline are the same; the inverted version is more formal.",
          }
        : {
            label: "Ordinary vs marked emphasis",
            left: "I had rarely heard such a clear answer.",
            right: "Rarely had I heard such a clear answer.",
            explanation: "Fronting rarely triggers inversion and gives the statement marked emphasis.",
          },
    ],
  });
}

function informationStructureGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();
  if (/cleft sentence/.test(title)) {
    return finish(unit, {
      canDo: "use several cleft structures to focus a person, thing, time, place, reason or whole message.",
      meaning: ["A cleft divides one message into two clauses so one element receives contrastive focus.", "Choose the cleft type from what must be highlighted; keep tense and agreement on be accurate."],
      patterns: [
        pattern("It-cleft: person", "It + be + person + who/that + clause", "focus who performed or received an action", "It was Mina who found the missing note."),
        pattern("It-cleft: thing/time/place", "It + be + focus + that + clause", "focus an object, time or place", "It was after the second test that the error appeared."),
        pattern("What-cleft", "What + clause + be + focus", "focus a thing, action or need", "What I need is a short break."),
        pattern("Reversed what-cleft", "focus + be + what + clause", "place the focus first", "A short break is what I need."),
        pattern("All-cleft", "All + clause + be + focus", "focus the only thing or action", "All I did was restart the app."),
        pattern("The reason/way/place", "The reason/way/place + clause + be + focus", "focus an explanation, method or location", "The reason I repeated the task was to improve fluency."),
      ],
      decisionSteps: ["Write the neutral sentence first.", "Underline the single element that needs contrastive focus.", "Choose it-cleft for a person/time/place or wh-/all-cleft for a thing, action or need.", "Keep tense on be consistent with the original meaning.", "Remove any duplicated subject or object from the second clause."],
      contrasts: [{ label: "Neutral vs cleft focus", left: "The final example clarified the rule.", right: "It was the final example that clarified the rule.", explanation: "The cleft corrects or contrasts which example produced the result." }],
    });
  }
  if (/emphasis with auxiliar/.test(title)) {
    return finish(unit, {
      canDo: "use auxiliary verbs to contradict, confirm and intensify a statement without creating a double verb form.",
      meaning: ["Do/does/did can carry emphasis in an affirmative simple-tense statement.", "When an auxiliary already exists, stress that auxiliary instead of adding do."],
      patterns: [
        pattern("Present simple emphasis", "subject + do/does + base verb", "contradict a negative assumption or insist", "I do understand the rule."),
        pattern("Past simple emphasis", "subject + did + base verb", "confirm a disputed past event", "She did save the backup."),
        pattern("Be emphasis", "subject + stressed am/is/are/was/were", "contradict a description or state", "The file is available."),
        pattern("Perfect emphasis", "subject + stressed have/has/had + participle", "confirm completion or prior event", "I have completed the review."),
        pattern("Modal emphasis", "subject + stressed modal + base verb", "insist on ability, certainty or obligation", "You can finish this task."),
        pattern("Emphatic imperative", "do + base verb", "make an invitation or request warmer/stronger", "Do sit down and rest."),
      ],
      decisionSteps: ["Identify the assumption you want to contradict or confirm.", "Find whether the clause already has be, have, a modal or another auxiliary.", "If none exists in simple present/past, add do/does/did and use the base verb.", "If one exists, stress it; do not add a second auxiliary.", "Use emphasis selectively so it retains force."],
      contrasts: [{ label: "Neutral vs corrective emphasis", left: "I saved the file.", right: "I did save the file.", explanation: "The second form strongly confirms the event against doubt or contradiction." }],
    });
  }
  if (/^fronting$/.test(title)) {
    return finish(unit, {
      canDo: "front topics, objects, complements and adverbials while keeping reference and word order controlled.",
      meaning: ["Fronting moves a normally later element to the beginning to establish topic, contrast or scene.", "Most fronting keeps subject–verb order; negative fronting is a separate pattern that triggers inversion."],
      patterns: [
        pattern("Object fronting", "object, subject + verb + gap", "contrast or establish an object as topic", "This final chapter, I have not read yet."),
        pattern("Complement fronting", "subject complement + be + subject", "create literary or formal emphasis", "Most useful was the final comparison."),
        pattern("Place fronting", "place phrase + verb + subject", "present a scene, especially with place verbs", "On the desk lay three marked articles."),
        pattern("Adverbial fronting", "time/manner/condition phrase, main clause", "orient the reader before the main message", "After the second attempt, the pattern became clear."),
        pattern("Participle fronting", "-ing/-ed phrase, main clause", "background a related action or state", "Encouraged by the result, I continued."),
        pattern("Negative fronting", "negative phrase + auxiliary + subject + verb", "create strong formal emphasis with inversion", "Only then did I understand the rule."),
      ],
      decisionSteps: ["Identify the element to make the topic or scene.", "Check that its reference is clear in context.", "Move it to the front and preserve ordinary subject–verb order.", "Use inversion only after a negative or restrictive fronted phrase.", "Compare with the neutral version and keep the fronted form only if focus improves."],
      contrasts: [{ label: "Topic fronting vs negative inversion", left: "This book, I enjoyed.", right: "Never had I enjoyed a book so much.", explanation: "Object fronting keeps ordinary subject–verb order; negative fronting triggers auxiliary–subject inversion." }],
    });
  }
  return finish(unit, {
    canDo: "reorganise a sentence to control focus and emphasis without changing its core factual meaning.",
    meaning: ["English usually places given information before new or contrastive information.", "Clefting, fronting and auxiliary emphasis are marked choices; use them when the listener needs a clear focus."],
    patterns: [
      pattern("It-cleft", "It + be + focus + that/who + clause", "focus one element", "It was the final example that clarified the rule."),
      pattern("What-cleft", "What + clause + be + focus", "focus a thing, need or result", "What I need is a short break."),
      pattern("Fronted topic", "topic phrase, subject + verb...", "establish a topic before commenting", "This final exercise, I found genuinely useful."),
      pattern("Auxiliary emphasis", "subject + do/does/did + base verb", "correct a contrast or add insistence", "I did save the document."),
      pattern("End focus", "given information + new/heavy information", "place important new material late", "The study identified one especially important limitation."),
    ],
    decisionSteps: ["Identify the information the reader already knows.", "Choose the single element that deserves focus.", "Select ordinary order, a cleft, fronting or auxiliary emphasis.", "Check reference and agreement after reorganising.", "Use the marked form only if it improves clarity or rhetorical effect."],
    contrasts: [
      {
        label: "Neutral vs focused",
        left: "The second test revealed the error.",
        right: "It was the second test that revealed the error.",
        explanation: "The cleft explicitly contrasts the second test with other possible sources.",
      },
    ],
  });
}

function compressionGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "compress information for academic writing while keeping agents, actions and relationships clear.",
    meaning: ["Nominalisation and non-finite clauses can package information densely.", "Compression is useful only when the reader can still recover who did what and how the ideas relate."],
    patterns: [
      pattern("Nominalisation", "verb/adjective → noun phrase", "package an action or quality as a concept", "The team evaluated the tool. → The team's evaluation of the tool..."),
      pattern("Post-modified noun", "noun + prepositional/relative/participle phrase", "add dense identifying information", "The evidence collected from three repositories was incomplete."),
      pattern("Reduced active clause", "verb-ing phrase + main clause", "compress clauses with the same active subject", "Comparing both systems, the researchers found two differences."),
      pattern("Reduced passive clause", "past-participle phrase + main clause", "compress passive information", "Stored locally, the notes remained private."),
      pattern("To-infinitive purpose/result", "noun/adjective + to-infinitive", "compress purpose or potential", "The next step is to validate the result."),
    ],
    decisionSteps: ["Write the full clause version first.", "Mark every agent, action and logical relationship.", "Compress only repeated or background information.", "Check that a reduced clause has the correct understood subject.", "Prefer clarity over maximum noun density."],
    contrasts: [
      {
        label: "Clear compression vs noun pile",
        left: "We evaluated how accurately the system retrieved evidence.",
        right: "The evaluation of the system's evidence-retrieval accuracy...",
        explanation: "The noun phrase is denser, but the clause is often easier to process. Choose for purpose and reader.",
      },
    ],
  });
}

function cohesionGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "connect sentences and clauses clearly through reference, substitution, parallel form and punctuation.",
    meaning: ["Cohesion shows how each idea connects to earlier and later text.", "A connector cannot repair a missing logical relationship; decide the relationship first."],
    patterns: [
      pattern("Reference", "pronoun/demonstrative + clear earlier referent", "avoid unnecessary repetition", "The first test failed. This result changed the plan."),
      pattern("Substitution", "one/ones; do so; so/not", "replace a repeated structure", "The graph method retrieved more files than the flat one."),
      pattern("Ellipsis", "omit recoverable repeated words", "make coordinated language concise", "Some participants chose audio; others, text."),
      pattern("Logical marker", "sentence connector + comma + clause", "signal contrast, result, addition or example", "The sample was small. Nevertheless, the pattern was consistent."),
      pattern("Parallel structure", "matching grammatical forms in a series", "make related ideas easy to compare", "The tool must extract entities, connect evidence and explain results."),
      pattern("Punctuation boundary", "full stop/semicolon/colon/comma selected by relationship", "show sentence structure visibly", "One issue remained: the source was incomplete."),
    ],
    decisionSteps: ["State the exact relationship between the ideas.", "Choose reference, repetition, substitution or a connector.", "Keep parallel ideas in parallel grammatical forms.", "Select punctuation from the clause structure.", "Read without context and check that every reference is unambiguous."],
    contrasts: [
      {
        label: "Connector meaning",
        left: "The method was simple. However, it was slow.",
        right: "The method was simple. Therefore, it was slow.",
        explanation: "However marks contrast; therefore claims a result. Grammar is correct in both, but only one may match the logic.",
      },
    ],
  });
}

function registerGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "adjust certainty, directness and grammatical style for audience, purpose and genre.",
    meaning: ["Register is a set of choices, not a list of forbidden informal words.", "Hedging should accurately represent evidence and uncertainty, not make every claim vague."],
    patterns: [
      pattern("Calibrated claim", "subject + may/appears to/tends to + verb", "reduce certainty to match evidence", "The result may reflect the small sample."),
      pattern("Evidence frame", "the data/results suggest/indicate that + clause", "attribute a cautious interpretation to evidence", "The results suggest that graph context improved recall."),
      pattern("Direct formal instruction", "imperative or modal + precise action", "guide a reader without conversational filler", "Compare the two outputs before drawing a conclusion."),
      pattern("Informal interaction", "contraction + common phrasal expression", "sound natural in familiar conversation", "I'll look into it and get back to you."),
      pattern("Genre frame", "purpose-specific move + conventional grammar", "meet the needs of a report, email or discussion", "This section evaluates the second research question."),
      pattern("Variety choice", "consistent BrE or AmE form within a document", "maintain editorial consistency", "The team has analysed the data. / The team has analyzed the data."),
    ],
    decisionSteps: ["Identify audience, relationship, purpose and genre.", "Decide the justified strength of the claim.", "Choose directness, vocabulary and sentence density together.", "Keep one language variety and level of formality consistent.", "Edit for naturalness by reading the whole passage aloud."],
    contrasts: [
      {
        label: "Certainty must match evidence",
        left: "The method proves that graphs are better.",
        right: "In this sample, the graph method appears to improve retrieval.",
        explanation: "The second version limits scope and certainty to what the evidence can support.",
      },
    ],
  });
}

function reportingVerbGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "select a reporting verb that accurately represents the source's communicative act and level of commitment.",
    meaning: ["Reporting verbs encode stance: report, argue, suggest, acknowledge and demonstrate do not mean the same thing.", "Each reporting verb controls a particular complement pattern."],
    patterns: [
      pattern("Verb + that-clause", "argue/claim/note + that + clause", "report a proposition", "The authors argue that context improves retrieval."),
      pattern("Verb + -ing", "suggest/recommend + verb-ing", "report a proposed action", "The study recommends testing larger repositories."),
      pattern("Verb + object + to-infinitive", "advise/encourage/allow + object + to + verb", "report an action assigned to someone", "The guide encourages researchers to record assumptions."),
      pattern("Verb + preposition", "attribute ... to / distinguish ... from / warn ... about", "complete a fixed reporting pattern", "The authors attribute the error to missing metadata."),
      pattern("Passive reporting", "it is argued that / subject is thought to...", "background the source or create formal distance", "It is widely accepted that evaluation needs clear criteria."),
    ],
    decisionSteps: ["Identify what the source actually did: reported, proposed, criticised, demonstrated or admitted.", "Choose a verb with matching strength.", "Recall the verb's complement pattern.", "Name the source clearly and preserve its intended degree of certainty."],
    contrasts: [
      {
        label: "Claim strength",
        left: "The authors prove that...",
        right: "The authors suggest that...",
        explanation: "Prove claims conclusive support; suggest presents a more cautious interpretation.",
      },
    ],
  });
}

function tenseAspectGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "choose tense and aspect from timeline, completion, duration and discourse viewpoint.",
    meaning: ["Tense locates a situation relative to speaking or another reference time.", "Aspect shows whether the speaker views it as whole, ongoing, repeated, prior or relevant to a later point."],
    patterns: [
      pattern("Simple", "present/past simple", "view an event as a fact, routine or complete whole", "The system returned ten results."),
      pattern("Continuous", "be + verb-ing", "view an event from inside its duration", "The system was processing a large repository."),
      pattern("Perfect", "have + past participle", "look back from a later reference point", "The system has stored the latest result."),
      pattern("Perfect continuous", "have + been + verb-ing", "combine prior duration with a later reference point", "The system has been analysing files for an hour."),
      pattern("Narrative shift", "past simple / past continuous / past perfect", "sequence event, background and earlier cause", "The test stopped while the tool was indexing because a file had become unavailable."),
    ],
    decisionSteps: ["Set the reference time: now, a past point or a future point.", "Decide whether the situation is whole, in progress or earlier than that point.", "Choose simple, continuous, perfect or perfect continuous.", "Check time markers and state verbs.", "Read the surrounding paragraph to keep the viewpoint stable."],
    contrasts: [
      {
        label: "Same event, different viewpoint",
        left: "I wrote the analysis.",
        right: "I was writing the analysis.",
        explanation: "Simple presents a complete event; continuous places the listener inside the activity.",
      },
    ],
  });
}

function ambiguityGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "identify and revise ambiguous reference, attachment, coordination and scope.",
    meaning: ["A sentence may be grammatical but still allow two unintended interpretations.", "Revision should make the intended relationship explicit without adding unnecessary complexity."],
    patterns: [
      pattern("Pronoun reference", "noun repeated or uniquely identified pronoun", "make the referent unmistakable", "When Sara spoke to Mina, Sara opened the file."),
      pattern("Modifier attachment", "modifier placed next to its target", "show exactly what the modifier describes", "Using the new tool, the researcher analysed the repository."),
      pattern("Coordination", "repeat function words or restructure parallel items", "show which elements belong together", "We tested old files and tested new repositories."),
      pattern("Scope", "place only/not/even beside the intended focus", "control what a limiting word affects", "We tested only the retrieval stage."),
      pattern("Punctuation", "punctuation chosen to mark clause boundaries", "separate competing structures", "The participants who practised improved; the others did not."),
    ],
    decisionSteps: ["List every possible referent and attachment.", "Paraphrase the sentence in two ways.", "Move the modifier beside its target or repeat the necessary noun/function word.", "Check scope words such as only and not.", "Ask whether an unfamiliar reader can recover only the intended meaning."],
    contrasts: [
      {
        label: "Dangling modifier",
        left: "After reading the paper, the argument seemed clearer.",
        right: "After reading the paper, I understood the argument more clearly.",
        explanation: "The revised sentence names the person who read the paper.",
      },
    ],
  });
}

function integratedProductionGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "plan, produce, monitor and repair complex grammar automatically in a sustained message.",
    meaning: ["Automaticity means retrieving appropriate grammar while attention remains on meaning.", "Accuracy, complexity and speed are trained in stages; speed never replaces a clear message."],
    patterns: [
      pattern("Plan", "purpose + audience + three key meanings", "reduce planning load before speaking or writing", "Goal: explain one result to a non-specialist in three points."),
      pattern("Produce", "short clause → linked clause → supported claim", "build a message in manageable units", "The test failed, although the input was valid, because one dependency was missing."),
      pattern("Monitor", "pause at meaning boundaries; check one target at a time", "protect fluency while noticing important errors", "First check tense consistency; then check reference."),
      pattern("Repair", "self-correction marker + corrected form", "correct without abandoning the message", "The tool find—sorry, found—the correct file."),
      pattern("Transfer", "same grammar + new topic/register", "prove flexible control beyond memorised examples", "Explain the same result in a message to a friend and in a formal report."),
    ],
    decisionSteps: ["Choose one communicative goal and two target structures.", "Plan keywords, not a full script.", "Produce the message once without stopping for minor errors.", "Review one accuracy category, then repeat.", "Transfer the same grammar to a new context after a delay."],
    contrasts: [
      {
        label: "Completion vs automaticity",
        left: "I completed ten grammar items.",
        right: "I used the pattern accurately in a new 45-second explanation.",
        explanation: "Item completion shows coverage; successful transfer under time pressure provides stronger automaticity evidence.",
      },
    ],
  });
}

function asLikeGuide(unit: GrammarUnit): GrammarLessonGuide {
  return finish(unit, {
    canDo: "choose as or like for role, function, similarity and examples.",
    meaning: ["As introduces a real role/function or a clause.", "Like introduces similarity and is normally followed by a noun phrase; such as introduces examples."],
    patterns: [
      pattern("Role/function", "as + noun", "state the actual role of someone or something", "She works as a language tutor."),
      pattern("Similarity", "like + noun/pronoun", "say two things are similar", "This exercise feels like a game."),
      pattern("Clause", "as + subject + verb", "mean in the way that or while/because", "Complete the task as the example shows."),
      pattern("Examples", "such as + examples", "introduce members of a category", "Practise state verbs such as know and believe."),
      pattern("Comparison clause", "as if/as though + clause", "describe an apparent situation", "He speaks as if he knows the result."),
    ],
    decisionSteps: ["Do you mean real role, similarity, manner clause or example?", "Choose as for role/clause, like for similarity, and such as for examples.", "Check whether a noun phrase or full clause follows.", "Avoid like for a formal example list when such as is clearer."],
    contrasts: [
      {
        label: "Real role vs similarity",
        left: "She works as a teacher.",
        right: "She speaks like a teacher.",
        explanation: "As names her real job; like compares her manner to a teacher's manner.",
      },
    ],
  });
}

function fallbackGuide(unit: GrammarUnit): GrammarLessonGuide {
  const examples = unit.examples.filter(Boolean);
  return finish(unit, {
    canDo: `use ${unit.title.toLowerCase()} to communicate a precise meaning in speech and writing.`,
    meaning: [unit.rule, "Choose the structure from its communicative purpose, then check form, position and register."],
    patterns: [
      pattern("Core form", unit.rule, "express the lesson's central meaning", examples[0] ?? unit.transferTest),
      pattern("Negative or limiting context", `negative/limiting form of: ${unit.rule}`, "limit or deny the central meaning", examples[1] ?? unit.repairTest),
      pattern("Question or interaction", `question/response form of: ${unit.rule}`, "use the structure in interaction", examples[2] ?? unit.testAnswer),
      pattern("Formal or expanded form", `expanded form of: ${unit.rule}`, "use the structure in a fuller message", unit.transferTest),
    ],
    decisionSteps: ["Name the message you want to communicate.", `Recall the core rule: ${unit.rule}`, "Choose the sentence position and form.", `Check against the typical problem: ${unit.commonError}`, "Say or write a new personal example."],
    contrasts: [
      {
        label: "Accurate choice",
        left: examples[0] ?? unit.testAnswer,
        right: unit.repairTest,
        explanation: "Compare the form, position and communicative meaning before producing your own sentence.",
      },
    ],
  });
}

export function getGrammarLessonGuide(unit: GrammarUnit): GrammarLessonGuide {
  const title = unit.title.toLowerCase();

  if (/have\/has got/.test(title)) return haveGotGuide(unit);
  if (/there is\/there are/.test(title)) return thereGuide(unit);
  if (/imperative/.test(title)) return imperativeGuide(unit);
  if (/present simple vs continuous/.test(title)) return simpleContinuousContrastGuide(unit);
  if (/adverbs of frequency/.test(title)) return frequencyGuide(unit);
  if (/for and since/.test(title)) return forSinceGuide(unit);
  if (/question tags/.test(title)) return questionTagGuide(unit);
  if (/too\/enough|too and enough/.test(title)) return tooEnoughGuide(unit);
  if (/wish and if only|unreal time/.test(title)) return unrealGuide(unit);
  if (/counterfactual distance/.test(title)) return counterfactualGuide(unit);
  if (/causative have\/get/.test(title)) return causativeGuide(unit);
  if (/used to, be used to, get used to/.test(title)) return usedToGuide(unit);
  if (/past habits:/.test(title)) return pastHabitsGuide(unit);
  if (/past ability:/.test(title)) return pastAbilityGuide(unit);
  if (/phrasal verb/.test(title)) return phrasalVerbGuide(unit);
  if (/possessive ’s and whose|possessive 's and whose/.test(title)) return possessiveFormGuide(unit);
  if (/capital letters and apostrophes/.test(title)) return mechanicsGuide(unit, false);
  if (/advanced punctuation and grammar/.test(title)) return mechanicsGuide(unit, true);
  if (/british and american grammar/.test(title)) return varietyGuide(unit);
  if (/adjectives ending in -ed and -ing|intensifiers: so and such|gradable and non-gradable adjectives|modifying comparatives/.test(title)) return adjectivePatternGuide(unit);
  if (/inversion in conditional/.test(title)) return inversionGuide(unit, true);
  if (/inversion after negative/.test(title)) return inversionGuide(unit, false);
  if (/cleft sentence|emphasis with auxiliar|fronting|marked word order|rhetorical grammar/.test(title)) return informationStructureGuide(unit);
  if (/nominalisation|compressed academic|complex noun phrases/.test(title)) return compressionGuide(unit);
  if (/advanced discourse marker|substitution and ellipsis|parallelism|advanced cohesion/.test(title)) return cohesionGuide(unit);
  if (/advanced reporting verb/.test(title)) return reportingVerbGuide(unit);
  if (/hedging and stance|register control|style shifting|genre-specific|editing for naturalness/.test(title)) return registerGuide(unit);
  if (/advanced tense-aspect/.test(title)) return tenseAspectGuide(unit);
  if (/layered subordination/.test(title)) return clauseGuide(unit);
  if (/ambiguity control/.test(title)) return ambiguityGuide(unit);
  if (/integrated automatic production/.test(title)) return integratedProductionGuide(unit);
  if (/using as and like/.test(title)) return asLikeGuide(unit);
  if (/present simple/.test(title) && !/continuous/.test(title)) return presentSimpleGuide(unit);
  if (/going to/.test(title)) return futureGuide(unit, "going");
  if (/\bbe\b|am,? is|is,? are|verb be/.test(title)) return beGuide(unit);
  if (/present continuous|stative and dynamic/.test(title)) return presentContinuousGuide(unit);
  if (/past simple/.test(title) && !/continuous|perfect/.test(title)) return pastSimpleGuide(unit);
  if (/past continuous/.test(title) && !/perfect/.test(title)) return pastContinuousGuide(unit);
  if (/present perfect continuous/.test(title)) return perfectGuide(unit, true);
  if (/present perfect/.test(title)) return perfectGuide(unit, false);
  if (/past perfect continuous/.test(title)) return pastPerfectGuide(unit, true);
  if (/past perfect/.test(title)) return pastPerfectGuide(unit, false);
  if (/future perfect/.test(title)) return futureGuide(unit, "perfect");
  if (/future continuous/.test(title)) return futureGuide(unit, "continuous");
  if (/\bwill\b|future forms/.test(title)) return futureGuide(unit, "will");
  if (/zero conditional/.test(title)) return conditionalGuide(unit, "zero");
  if (/first conditional/.test(title)) return conditionalGuide(unit, "first");
  if (/second conditional/.test(title)) return conditionalGuide(unit, "second");
  if (/third conditional/.test(title)) return conditionalGuide(unit, "third");
  if (/mixed conditional/.test(title)) return conditionalGuide(unit, "mixed");
  if (/modal|\bcan\b|must|have to|should|deduction|obligation|permission|ability|certainty|probability/.test(title)) return modalGuide(unit);
  if (/passive/.test(title)) return passiveGuide(unit);
  if (/reported|indirect question/.test(title)) return reportedGuide(unit);
  if (/pronoun|possessive|reflexive|whose/.test(title)) return pronounGuide(unit);
  if (/article|plural nouns?|countable|uncountable|quantifier|some\/any\/no|much\/many|\bfew\b|\blittle\b/.test(title)) return nounGuide(unit);
  if (/preposition/.test(title)) return prepositionGuide(unit);
  if (/compar|superlative|adjective|so and such|too and enough/.test(title)) return comparisonGuide(unit);
  if (/relative|clause|connector|contrast|purpose|participle|linking|concession/.test(title)) return clauseGuide(unit);
  if (/gerund|infinitive|verb pattern|phrasal|used to/.test(title)) return verbPatternGuide(unit);
  return fallbackGuide(unit);
}
