/** "Type the model sentence" only asked to copy a sentence the learner could
 * see. Each model sentence now returns with its target form left out and a cue,
 * so the learner recalls the form; the answer is the model sentence itself.
 * Where a checked item of the unit already uses the same sentence, a new
 * sentence with its own answer takes its place (2026-11-02). */
const MODEL_SENTENCE_CUES: readonly (readonly [
  model: string,
  gapped: string,
  answer?: string,
])[] = [
  ["I am a student.", "I ___ a student. (be)"],
  ["She is tired.", "She ___ tired. (be)"],
  ["She works here.", "___ works here. (She / Her)"],
  ["They live nearby.", "___ live nearby. (They / Them)"],
  ["I saw a doctor.", "I saw ___ doctor. (a / an)"],
  ["The doctor was kind.", "___ doctor was kind. (definite article)"],
  [
    "two books, three boxes, two children",
    "two books, three ___, two children (box)",
  ],
  ["This is my phone.", "This is ___ phone. (my / mine)"],
  ["Their house is new.", "___ house is new. (Their / Theirs)"],
  ["I have got a brother.", "I ___ got a brother. (have / has)"],
  ["She has a car.", "She ___ a car. (have)"],
  ["He studies every day.", "He ___ every day. (study)"],
  ["Water boils at 100°C.", "Water ___ at 100°C. (boil)"],
  ["I do not drive.", "I ___ drive. (do not / does not)"],
  ["She does not work here.", "She ___ work here. (does not / do not)"],
  ["Do you live here?", "___ you live here? (Do / Does)"],
  ["Does he speak English?", "Does he ___ English? (speak / speaks)"],
  ["There is a bank here.", "There ___ a bank here. (is / are)"],
  ["There are two parks.", "There ___ two parks. (are / is)"],
  ["I can swim.", "I can ___. (swim / to swim)"],
  ["Can you help me?", "Can you ___ me? (help / to help)"],
  ["Open the door.", "___ the door. (Open / Opens)"],
  ["Don’t worry.", "___ worry. (Don’t / Not)"],
  ["The keys are on the table.", "The keys are ___ the table. (on / in)"],
  ["many books, much water", "many books, ___ water (much / many)"],
  ["I am studying now.", "I am ___ now. (study)"],
  ["She is staying with friends.", "She ___ with friends. (stay)"],
  [
    "I work every day, but I am working at home today.",
    "I work every day, but I ___ at home today. (work)",
  ],
  ["We visited Rome last year.", "We ___ Rome last year. (visit)"],
  [
    "She went home and wrote an email.",
    "She went home and ___ an email. (write)",
  ],
  ["Did you call?", "Did you ___? (call / called)"],
  ["I didn’t see him.", "I didn’t ___ him. (see / saw)"],
  ["I think it will rain.", "I think it ___. (rain)"],
  ["I’ll help you.", "I’ll ___ you. (help / to help)"],
  ["I am going to study tonight.", "I am going ___ tonight. (study)"],
  [
    "This book is easier than that one.",
    "This book is ___ than that one. (easy)",
  ],
  ["It is the most useful app.", "It is ___ app. (useful)"],
  ["I have some questions.", "I have ___ questions. (some / any)"],
  ["Do you have any time?", "Do you have ___ time? (any / many)"],
  [
    "many ideas, much time, a lot of work",
    "many ideas, ___ time, a lot of work (much / many)",
  ],
  ["I often study.", "I ___. (study, often)"],
  ["She is usually early.", "She ___ early. (usually, is)"],
  ["Please call me.", "Please call ___. (me / I)"],
  ["I saw them.", "I saw ___. (them / they)"],
  ["You must be careful.", "You must ___ careful. (be / to be)"],
  ["I have to work.", "I ___ work. (have to / must to)"],
  [
    "I have lived here for three years.",
    "I ___ here for three years. (live)",
  ],
  ["I have seen it.", "I ___ it. (see, present perfect)"],
  ["I saw it yesterday.", "I ___ it yesterday. (see)"],
  ["for two years; since 2024", "___ two years; since 2024 (for / since)"],
  [
    "I was studying when you called.",
    "I ___ when you called. (study)",
  ],
  [
    "We were eating when the phone rang.",
    "We were eating when the phone ___. (ring)",
  ],
  [
    "If I have time, I will call you.",
    "If I ___ time, I will call you. (have / will have)",
  ],
  [
    "If I had more time, I would study German.",
    "If we ___ a car, we would drive to the coast. (have)",
    "If we had a car, we would drive to the coast.",
  ],
  [
    "The woman who called is my teacher.",
    "The man ___ fixed my bike is my neighbour. (who / which)",
    "The man who fixed my bike is my neighbour.",
  ],
  ["I enjoy reading.", "I enjoy ___. (read)"],
  ["I decided to leave.", "I decided ___. (leave)"],
  [
    "You should practise every day.",
    "You should ___ every day. (practise / to practise)",
  ],
  ["English is spoken worldwide.", "English ___ worldwide. (speak)"],
  ["The bridge was built in 1990.", "The bridge ___ in 1990. (build)"],
  ["She said that she was tired.", "She said that she ___ tired. (be)"],
  [
    "You’re ready, aren’t you?",
    "You’re ready, ___? (aren’t you / isn’t it)",
  ],
  ["It is too difficult.", "It is ___ difficult. (too / enough)"],
  ["It is clear enough.", "It is ___. (enough, clear)"],
  [
    "I have been working since eight.",
    "I ___ since eight. (work)",
  ],
  [
    "The train had left before we arrived.",
    "The train ___ before we arrived. (leave)",
  ],
  ["She had been waiting for an hour.", "She ___ for an hour. (wait)"],
  [
    "This time tomorrow, I will be travelling.",
    "This time tomorrow, I ___. (travel)",
  ],
  ["By Friday, I will have finished.", "By Friday, I ___. (finish)"],
  [
    "If I had studied, I would have passed.",
    "If I ___, I would have passed. (study)",
  ],
  [
    "If I had taken the job, I would live in Berlin now.",
    "If she had moved to Paris, she ___ French now. (speak)",
    "If she had moved to Paris, she would speak French now.",
  ],
  [
    "She must be busy.",
    "The lights are off. He ___ be at home. (can’t / must)",
    "The lights are off. He can’t be at home.",
  ],
  ["He can’t know.", "He ___ know. (can’t / can’t to)"],
  ["They must have forgotten.", "They must have ___. (forget)"],
  ["I had my laptop repaired.", "I had my laptop ___. (repair)"],
  ["He is believed to be abroad.", "He ___ to be abroad. (believe)"],
  ["It should be completed soon.", "It should ___ soon. (complete)"],
  [
    "Having finished the report, she left.",
    "___ the report, she left. (finish)",
  ],
  ["I wish I knew.", "I wish I ___. (know)"],
  ["If only I had listened.", "If only I ___. (listen)"],
  [
    "Never have I seen such a result.",
    "Rarely ___ such a long queue. (have I seen / I have seen)",
    "Rarely have I seen such a long queue.",
  ],
  [
    "What I need is more practice.",
    "___ I want is a quiet room. (What / That)",
    "What I want is a quiet room.",
  ],
  ["It was Anna who called.", "It was Anna ___ called. (who / which)"],
  [
    "Had I known, I would have acted differently.",
    "___ known, I would have acted differently. (Had I / I had)",
  ],
  [
    "The committee’s decision surprised everyone.",
    "The committee’s ___ surprised everyone. (decide)",
  ],
  [
    "The results appear to support the hypothesis.",
    "The results ___ support the hypothesis. (appear)",
  ],
  [
    "Nevertheless, the limitation remains significant.",
    "___, the limitation remains significant. (Nevertheless / Moreover)",
  ],
  [
    "I expected her to call, and she did.",
    "I expected her to call, and she ___. (did / did it)",
  ],
  [
    "The method on which we relied was robust.",
    "The colleague to ___ I spoke was helpful. (whom / who)",
    "The colleague to whom I spoke was helpful.",
  ],
  ["He admitted making the error.", "He admitted ___ the error. (make)"],
  [
    "I do understand your concern.",
    "I ___ understand your concern. (do / am)",
  ],
  [
    "This issue, we must address immediately.",
    "That decision, ___ later. (review, will, we)",
    "That decision, we will review later.",
  ],
  [
    "a carefully designed longitudinal study of adult learners",
    "a carefully ___ longitudinal study of adult learners (design)",
  ],
  [
    "Could you clarify the requirement?",
    "___ clarify the requirement? (Could you / You could)",
  ],
  [
    "Would you mind explaining the deadline?",
    "Would you mind ___ the deadline? (explain)",
  ],
  [
    "The study has demonstrated a clear effect.",
    "The study ___ a clear effect. (demonstrate, present perfect)",
  ],
  [
    "In 2019, the study demonstrated a clear effect.",
    "In 2019, the study ___ a clear effect. (demonstrate)",
  ],
  [
    "The role requires planning, analysing, and reporting.",
    "The role requires planning, analysing, and ___. (report)",
  ],
  [
    "Only then did the implications become clear.",
    "Only then ___ become clear. (did the implications / the implications did)",
  ],
  [
    "Although the data were limited, the pattern that emerged was consistent.",
    "Although the data were limited, the pattern that ___ was consistent. (emerge)",
  ],
  [
    "You needn’t have attended; you didn’t need to attend.",
    "You ___ attended; you didn’t need to attend. (needn’t have / mustn’t)",
  ],
  [
    "I wondered if you might be able to help.",
    "I ___ if you might be able to help. (wonder)",
  ],
  [
    "The sample was small. This limitation weakens the conclusions.",
    "The budget was cut. ___ decision delayed the project. (This / These)",
    "The budget was cut. This decision delayed the project.",
  ],
  [
    "The response rate was low. Such a constraint affects every estimate.",
    "Two staff members left. ___ changes slowed the work. (These / This)",
    "Two staff members left. These changes slowed the work.",
  ],
  [
    "Not because the method failed, but because the data were incomplete.",
    "Not because the method failed, but ___ the data were incomplete. (because / so)",
  ],
  [
    "The model, trained on multilingual data, performed consistently.",
    "The model, ___ on multilingual data, performed consistently. (train)",
  ],
  [
    "Be that as it may, the proposal deserves consideration.",
    "___ as it may, the proposal deserves consideration. (Be that / Be it)",
  ],
  [
    "She discussed the result with the supervisor who approved it.",
    "She discussed the result with the supervisor ___ approved it. (who / which)",
  ],
  [
    "I found out that the policy had failed.",
    "I found out that the policy ___. (fail, past perfect)",
  ],
  [
    "The analysis revealed that the policy had failed.",
    "The analysis ___ that the policy had failed. (reveal)",
  ],
  [
    "The result, however, was inconclusive.",
    "The result, ___ was inconclusive. (however, / but)",
  ],
  [
    "I strongly recommend that you revise the budget.",
    "I strongly recommend ___ revise the budget. (that you / you to)",
  ],
  [
    "The report outlines the problem, evaluates two options, and recommends a solution.",
    "The report ___ the problem, evaluates two options, and recommends a solution. (outline)",
  ],
  [
    "Two-minute answer with target structures and self-repair.",
    "After the meeting, she ___ the slides and answered questions. (present)",
    "After the meeting, she presented the slides and answered questions.",
  ],
];

/** The recall item for a "Type the model sentence" exercise, if it has one. */
export function modelSentenceCue(
  model: string,
): { readonly prompt: string; readonly answer: string } | undefined {
  const row = MODEL_SENTENCE_CUES.find(([sentence]) => sentence === model);
  if (!row) return undefined;
  const [, gapped, answer] = row;
  return answer
    ? { prompt: `Complete the sentence: ${gapped}`, answer }
    : { prompt: `Complete the model sentence: ${gapped}`, answer: model };
}
