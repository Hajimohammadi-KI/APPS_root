import type { CefrLevel } from "./types";

export const INTEGRATED_SKILLS = [
  "listening",
  "speaking",
  "reading",
  "writing",
] as const;

export type IntegratedSkill = (typeof INTEGRATED_SKILLS)[number];

export type AutomaticityStage =
  | "understand"
  | "recognise"
  | "recall"
  | "supported"
  | "independent"
  | "transfer"
  | "review";

export interface AutomaticityStep {
  id: string;
  stage: AutomaticityStage;
  title: string;
  instruction: string;
  responsePrompt: string;
  minWords: number;
  supportAvailable: boolean;
  delayedReview: boolean;
}

export interface IntegratedSkillsUnit {
  id: string;
  number: number;
  title: string;
  outcome: string;
  grammar: string;
  vocabulary: readonly string[];
  pronunciation: string;
  model: string;
  listeningText: string;
  readingText: string;
  speakingPrompt: string;
  writingPrompt: string;
}

export interface IntegratedSkillsLevel {
  cefr: CefrLevel;
  title: string;
  descriptor: string;
  baseLessons: readonly string[];
  exitCriteria: readonly string[];
  units: readonly IntegratedSkillsUnit[];
}

const levels: readonly IntegratedSkillsLevel[] = [
  {
    cefr: "A1",
    title: "Foundation",
    descriptor:
      "Understand and produce short, useful language about immediate personal needs.",
    baseLessons: [
      "Core sentence: subject + verb + essential information",
      "High-frequency chunks for greeting, asking, thanking, and checking",
      "Clear word stress, final sounds, and the alphabet",
      "Capital letters, full stops, and one idea per sentence",
    ],
    exitCriteria: [
      "Understand the main point of slow, clear everyday messages",
      "Give a connected 45-second personal response with familiar language",
      "Read a short practical message and locate two details",
      "Write four connected sentences with understandable spelling",
    ],
    units: [
      {
        id: "a1-introductions",
        number: 1,
        title: "Introduce yourself clearly",
        outcome:
          "Introduce yourself and ask another person two simple questions.",
        grammar: "be, subject pronouns, and simple question forms",
        vocabulary: ["name", "live", "work", "from", "like", "meet"],
        pronunciation: "Stress the important word in each short sentence.",
        model:
          "Hello, I’m Mina. I’m from Iran, and I live in Berlin. I study English in the morning. I like music and walking. Where are you from?",
        listeningText:
          "Hello, my name is Mina. I live in Berlin with my sister. I study English every morning because I want to speak with confidence.",
        readingText:
          "Mina is a new learner in the class. She lives in Berlin and studies before breakfast. Her goal is to speak English in everyday situations.",
        speakingPrompt:
          "Introduce yourself, say where you live, name one routine, and ask one question.",
        writingPrompt:
          "Write four sentences for a friendly introduction message.",
      },
      {
        id: "a1-routines",
        number: 2,
        title: "Describe a daily routine",
        outcome: "Explain the order and time of ordinary daily activities.",
        grammar: "present simple, time phrases, and first/then/finally",
        vocabulary: [
          "wake up",
          "breakfast",
          "start",
          "finish",
          "usually",
          "evening",
        ],
        pronunciation: "Keep a steady rhythm in lists of daily actions.",
        model:
          "I usually wake up at seven. First, I drink water. Then I eat breakfast and start work. In the evening, I practise English for twelve minutes.",
        listeningText:
          "Sam wakes up at half past six. He takes the bus at eight and finishes work at four. After dinner, he calls his daughter and reads for twenty minutes.",
        readingText:
          "Every weekday, Sam follows a simple plan. He prepares breakfast, travels by bus, and works until four. His quiet reading time begins after dinner.",
        speakingPrompt:
          "Describe your morning and evening using first, then, and finally.",
        writingPrompt: "Write five short sentences about a normal weekday.",
      },
      {
        id: "a1-shopping",
        number: 3,
        title: "Buy an everyday item",
        outcome:
          "Ask for an item, understand a price, and make a simple choice.",
        grammar: "this/that, some/any, can I, and how much",
        vocabulary: ["price", "size", "cash", "card", "need", "change"],
        pronunciation: "Use rising intonation for short checking questions.",
        model:
          "Excuse me, do you have this notebook in blue? How much is it? I need one large notebook. Can I pay by card?",
        listeningText:
          "The blue notebook costs four euros. The larger notebook costs six euros. The customer chooses the larger one and pays by card.",
        readingText:
          "Today’s offer: large notebooks are six euros. Blue and black are available. Card payments are welcome, and the shop closes at six.",
        speakingPrompt:
          "Ask for one item, check its price or size, and say how you want to pay.",
        writingPrompt:
          "Write a short shopping list and one polite question for the shop assistant.",
      },
      {
        id: "a1-appointments",
        number: 4,
        title: "Arrange an appointment",
        outcome: "Understand and confirm a simple date, time, and place.",
        grammar: "can, at/on, and short confirmation questions",
        vocabulary: [
          "appointment",
          "available",
          "morning",
          "afternoon",
          "address",
          "confirm",
        ],
        pronunciation: "Say dates and times slowly in clear groups.",
        model:
          "I need an appointment, please. Are you available on Friday morning? Ten thirty is good for me. Could you repeat the address?",
        listeningText:
          "Your appointment is on Friday, the ninth of August, at ten thirty. Please arrive ten minutes early. The office is next to the pharmacy.",
        readingText:
          "Appointment confirmation: Friday, 9 August, 10:30. Address: 18 Park Street. Please bring your identification and arrive early.",
        speakingPrompt:
          "Request an appointment, choose a time, and repeat the final details.",
        writingPrompt:
          "Write a four-line appointment confirmation with date, time, place, and one reminder.",
      },
    ],
  },
  {
    cefr: "A2",
    title: "Everyday Communication",
    descriptor:
      "Handle familiar exchanges and describe experiences, plans, and practical problems.",
    baseLessons: [
      "Past, present, and planned future in short connected messages",
      "Common collocations for travel, health, work, and services",
      "Sentence stress for contrast and polite requests",
      "Paragraph basics: topic, supporting details, and conclusion",
    ],
    exitCriteria: [
      "Follow the main idea and key details in familiar announcements",
      "Speak for one minute about an experience or practical plan",
      "Understand short narratives and practical instructions",
      "Write a clear six-sentence paragraph or functional message",
    ],
    units: [
      {
        id: "a2-past-event",
        number: 1,
        title: "Tell a memorable story",
        outcome: "Describe a completed event in a clear time order.",
        grammar: "past simple and sequencing expressions",
        vocabulary: [
          "happened",
          "decided",
          "arrived",
          "suddenly",
          "after that",
          "luckily",
        ],
        pronunciation:
          "Make regular past endings audible without adding a syllable.",
        model:
          "Last Saturday, I missed my usual train. I waited for the next one and met an old friend. We travelled together, so the delay became a pleasant surprise.",
        listeningText:
          "Nora planned to visit a museum, but the bus broke down. She walked to a small gallery nearby instead. She enjoyed it and decided to return with a friend.",
        readingText:
          "A delayed journey changed Nora’s afternoon. Instead of giving up, she chose a nearby gallery. The unexpected visit became the best part of her day.",
        speakingPrompt:
          "Tell a short true story with a beginning, a change, and an ending.",
        writingPrompt:
          "Write six sentences about an unexpected but useful experience.",
      },
      {
        id: "a2-travel-plan",
        number: 2,
        title: "Plan a short trip",
        outcome: "Compare options and agree on a practical travel plan.",
        grammar: "going to, comparatives, and because",
        vocabulary: [
          "route",
          "ticket",
          "cheaper",
          "direct",
          "luggage",
          "reserve",
        ],
        pronunciation: "Stress the words that show a comparison or decision.",
        model:
          "We’re going to travel by train because it is more comfortable than the bus. The early train is cheaper, but the later train is direct. I suggest the direct train.",
        listeningText:
          "Two travellers compare a bus at eight and a train at nine. The bus is cheaper, but it takes two hours longer. They choose the train and reserve two seats.",
        readingText:
          "Option A leaves at 08:00 and costs 18 euros. Option B leaves at 09:00, costs 25 euros, and arrives earlier because it has no changes.",
        speakingPrompt:
          "Compare two ways to travel and recommend one with two reasons.",
        writingPrompt:
          "Write a message explaining your travel choice, departure time, and preparation.",
      },
      {
        id: "a2-health",
        number: 3,
        title: "Explain a health concern",
        outcome:
          "Describe symptoms, understand advice, and confirm the next action.",
        grammar: "present perfect for duration, should, and imperatives",
        vocabulary: ["symptom", "pain", "rest", "medicine", "improve", "worse"],
        pronunciation: "Pause between symptoms so each detail is clear.",
        model:
          "I have had a headache since yesterday evening. It becomes worse when I read. I have rested, but it has not improved. What should I do next?",
        listeningText:
          "The pharmacist advises the customer to drink water, rest, and avoid bright screens. If the headache becomes worse, the customer should contact a doctor.",
        readingText:
          "Self-care note: rest in a quiet room, drink enough water, and follow the medicine instructions. Seek professional help if symptoms become severe.",
        speakingPrompt:
          "Describe a minor health problem, its duration, and what you have already tried.",
        writingPrompt:
          "Write a clear message asking a clinic for advice or an appointment.",
      },
      {
        id: "a2-service-problem",
        number: 4,
        title: "Solve a service problem",
        outcome: "Explain what went wrong and request a reasonable solution.",
        grammar: "past simple, polite could/would, and object pronouns",
        vocabulary: [
          "order",
          "receipt",
          "missing",
          "replace",
          "refund",
          "delivery",
        ],
        pronunciation: "Keep a calm falling tone in polite but firm requests.",
        model:
          "My order arrived yesterday, but one item was missing. I have the receipt and the delivery email. Could you send the missing item or give me a refund?",
        listeningText:
          "A customer reports a missing lamp. The assistant checks the order number and offers a replacement on Tuesday. The customer accepts the replacement.",
        readingText:
          "Customer service reply: we are sorry that your order was incomplete. We can send a replacement within three working days or return the item cost.",
        speakingPrompt:
          "Explain a service problem, provide two facts, and request one solution.",
        writingPrompt:
          "Write a polite complaint with order details, the problem, and your preferred solution.",
      },
    ],
  },
  {
    cefr: "B1",
    title: "Independent Communication",
    descriptor:
      "Understand clear standard language and explain experiences, opinions, and solutions.",
    baseLessons: [
      "Narrative and opinion structures with reasons and examples",
      "Independent vocabulary strategies: word families and collocations",
      "Intonation for opinions, clarification, and turn-taking",
      "Connected paragraphs using reference words and linking expressions",
    ],
    exitCriteria: [
      "Identify main ideas, viewpoints, and supporting details in standard speech",
      "Sustain a 90-second response and clarify misunderstandings",
      "Read factual texts and distinguish claims from examples",
      "Write an organised opinion or problem-solution text",
    ],
    units: [
      {
        id: "b1-learning",
        number: 1,
        title: "Choose an effective learning method",
        outcome:
          "Compare learning methods and justify a personal study decision.",
        grammar: "comparatives, present perfect experience, and although",
        vocabulary: [
          "method",
          "feedback",
          "focus",
          "flexible",
          "effective",
          "evidence",
        ],
        pronunciation: "Use contrastive stress to compare two methods.",
        model:
          "Online practice is flexible, although classroom discussion gives faster human feedback. I have used both methods. For me, a short daily routine plus one weekly conversation works best.",
        listeningText:
          "Two learners compare independent study and group lessons. One values flexibility; the other needs immediate feedback. They agree that regular practice matters more than the format.",
        readingText:
          "A useful study plan combines retrieval, feedback, and repetition. Long sessions may feel productive, but shorter sessions repeated over time often create more stable recall.",
        speakingPrompt:
          "Compare two learning methods and recommend a realistic combination.",
        writingPrompt:
          "Write an opinion paragraph about the most effective way to practise a language.",
      },
      {
        id: "b1-workplace",
        number: 2,
        title: "Handle a workplace misunderstanding",
        outcome:
          "Clarify information, explain an error, and agree on a repair plan.",
        grammar: "reported information, modals, and first conditional",
        vocabulary: [
          "deadline",
          "clarify",
          "responsibility",
          "update",
          "priority",
          "confirm",
        ],
        pronunciation:
          "Use polite intonation when interrupting or asking for clarification.",
        model:
          "I understood that the report was due on Thursday, but the calendar says Wednesday. Could we confirm the deadline? If it is Wednesday, I will send a shorter draft first.",
        listeningText:
          "A manager and colleague discover that they noted different deadlines. They check the original email, agree on Wednesday afternoon, and divide the remaining work.",
        readingText:
          "Project update: the first draft is due Wednesday at three. The data table is the priority. Additional examples can be added during Thursday’s review.",
        speakingPrompt:
          "Clarify a misunderstanding and propose a practical next step.",
        writingPrompt:
          "Write a concise follow-up email confirming responsibilities and deadlines.",
      },
      {
        id: "b1-wellbeing",
        number: 3,
        title: "Discuss stress and sustainable habits",
        outcome:
          "Explain causes, evaluate advice, and propose a manageable habit.",
        grammar: "cause and result, gerunds, and should/might",
        vocabulary: [
          "pressure",
          "recover",
          "boundary",
          "routine",
          "manageable",
          "support",
        ],
        pronunciation: "Group longer explanations into short thought units.",
        model:
          "Constant notifications can increase pressure because attention never fully rests. Turning them off for twenty minutes might help. A small boundary is easier to maintain than a perfect routine.",
        listeningText:
          "A coach recommends choosing one manageable change rather than five difficult changes. The learner decides to protect a quiet twelve-minute period each morning.",
        readingText:
          "Sustainable habits are specific and small enough to repeat. Missing one day is not failure. The important action is returning to the routine without adding punishment.",
        speakingPrompt:
          "Explain one source of stress and recommend one realistic change with reasons.",
        writingPrompt:
          "Write a problem-solution paragraph about maintaining a healthy learning routine.",
      },
      {
        id: "b1-information",
        number: 4,
        title: "Evaluate everyday information",
        outcome:
          "Separate a claim, supporting evidence, and a personal opinion.",
        grammar: "relative clauses, reporting verbs, and may/might",
        vocabulary: [
          "claim",
          "source",
          "evidence",
          "reliable",
          "compare",
          "publish",
        ],
        pronunciation:
          "Stress source names and evidence words rather than fillers.",
        model:
          "The article claims that the method improves memory, but it gives no source. A university page reports a smaller benefit. I would compare both claims before making a decision.",
        listeningText:
          "A radio guest describes a new study, while the host asks who conducted it and how many people participated. The guest cannot answer every question.",
        readingText:
          "Reliable information normally identifies the author, date, evidence, and limits. A confident tone alone does not make a claim trustworthy.",
        speakingPrompt:
          "Evaluate a claim by asking who produced it, what evidence exists, and what remains uncertain.",
        writingPrompt:
          "Write a short evaluation of an online claim using one strength and one limitation.",
      },
    ],
  },
  {
    cefr: "B2",
    title: "Confident Communication",
    descriptor:
      "Understand complex main ideas and communicate detailed arguments with clear interaction.",
    baseLessons: [
      "Argument structure: claim, evidence, counterargument, and qualified conclusion",
      "Topic-specific vocabulary, precise collocations, and paraphrase",
      "Fluent chunking, stance, and emphasis in extended speech",
      "Cohesive multi-paragraph writing with controlled register",
    ],
    exitCriteria: [
      "Follow extended explanations and distinguish speaker stance",
      "Present and defend a two-minute argument with responsive interaction",
      "Synthesize information across two complex factual texts",
      "Write a coherent argument or report with evidence and qualification",
    ],
    units: [
      {
        id: "b2-ai-learning",
        number: 1,
        title: "Evaluate AI-supported learning",
        outcome:
          "Balance benefits and risks and propose responsible conditions of use.",
        grammar: "hedging, concession, and passive reporting structures",
        vocabulary: [
          "assistance",
          "dependence",
          "verify",
          "transparent",
          "bias",
          "accountability",
        ],
        pronunciation:
          "Use intonation to distinguish a claim from a qualification.",
        model:
          "AI assistance can increase access to feedback; however, unverified answers may reinforce errors. It should therefore be used transparently, with learners required to explain and check the final result.",
        listeningText:
          "A teacher supports AI for brainstorming but opposes hidden automated writing. A learner values immediate explanations. Both agree that verification and disclosure are essential.",
        readingText:
          "Educational tools can reduce routine workload and personalise practice. Their value depends on data quality, transparent limitations, and tasks that still require independent thinking.",
        speakingPrompt:
          "Present two benefits, two risks, and a balanced policy for AI-supported study.",
        writingPrompt:
          "Write a structured argument defining responsible AI use in language learning.",
      },
      {
        id: "b2-remote-work",
        number: 2,
        title: "Negotiate a flexible work plan",
        outcome:
          "Compare stakeholder needs and negotiate measurable conditions.",
        grammar: "mixed conditionals, modal nuance, and diplomatic questions",
        vocabulary: [
          "productivity",
          "coordination",
          "autonomy",
          "availability",
          "measure",
          "compromise",
        ],
        pronunciation:
          "Soften disagreement while keeping the proposal precise.",
        model:
          "A flexible plan could improve concentration, provided that shared availability remains predictable. I propose two remote days, a daily coordination window, and a review after six weeks.",
        listeningText:
          "An employee requests three remote days. The manager worries about coordination. They compromise on two days and agree to measure response time, output, and team feedback.",
        readingText:
          "Flexible work policies are most effective when expectations are explicit. Location alone is a weak measure; teams also need agreed outcomes, communication windows, and review dates.",
        speakingPrompt:
          "Negotiate a flexible arrangement, respond to one objection, and define how success will be measured.",
        writingPrompt:
          "Write a professional proposal with benefits, safeguards, and a review process.",
      },
      {
        id: "b2-public-information",
        number: 3,
        title: "Compare conflicting public information",
        outcome:
          "Synthesize competing claims and communicate uncertainty responsibly.",
        grammar: "reporting verbs, noun clauses, and degrees of certainty",
        vocabulary: [
          "consensus",
          "estimate",
          "methodology",
          "uncertain",
          "contradict",
          "context",
        ],
        pronunciation: "Signal confidence levels through stress and pausing.",
        model:
          "The reports agree on the general direction but differ in scale. One uses a national survey, whereas the other examines a small local sample. The stronger conclusion is therefore limited.",
        listeningText:
          "Two experts interpret the same trend differently. One emphasises recent growth; the other notes that the longer-term change is modest. Their disagreement concerns scale, not direction.",
        readingText:
          "Conflicting figures do not always indicate dishonesty. Different dates, populations, definitions, and methods can produce different results. A responsible comparison identifies these conditions.",
        speakingPrompt:
          "Compare two claims, identify why they differ, and state what can safely be concluded.",
        writingPrompt:
          "Write a synthesis that reports agreement, disagreement, evidence quality, and uncertainty.",
      },
      {
        id: "b2-community-policy",
        number: 4,
        title: "Recommend a community policy",
        outcome:
          "Use criteria and evidence to recommend a fair local decision.",
        grammar: "conditionals, participle clauses, and evaluative language",
        vocabulary: [
          "access",
          "impact",
          "budget",
          "resident",
          "equitable",
          "implement",
        ],
        pronunciation:
          "Emphasise evaluation criteria and the final recommendation.",
        model:
          "Extending library hours would benefit workers and students, but staffing costs must be controlled. A three-month evening pilot would provide evidence before permanent implementation.",
        listeningText:
          "Residents support longer library hours, while staff raise safety and budget concerns. The council considers a limited pilot with monitored attendance and costs.",
        readingText:
          "A fair policy review considers who benefits, who carries the cost, and whether the outcome can be measured. Pilot programmes can reduce uncertainty before a permanent decision.",
        speakingPrompt:
          "Recommend one community policy using three criteria and respond to a cost objection.",
        writingPrompt:
          "Write a recommendation report with criteria, evidence, limitations, and next steps.",
      },
    ],
  },
  {
    cefr: "C1",
    title: "Advanced Communication",
    descriptor:
      "Understand demanding material and communicate flexibly, precisely, and effectively.",
    baseLessons: [
      "Synthesis, qualification, rhetorical structure, and implicit meaning",
      "Precise academic and professional collocations with register control",
      "Prosodic control for emphasis, distancing, and audience guidance",
      "Extended analytical writing with source integration and revision",
    ],
    exitCriteria: [
      "Interpret implicit stance and detailed argument in demanding speech",
      "Deliver a structured three-minute explanation with flexible reformulation",
      "Evaluate reasoning and synthesize multiple dense texts",
      "Write a precise analytical text adapted to purpose and audience",
    ],
    units: [
      {
        id: "c1-research-synthesis",
        number: 1,
        title: "Synthesize research responsibly",
        outcome:
          "Integrate several findings without hiding disagreement or limitations.",
        grammar: "advanced reporting, nominalisation, and cautious claims",
        vocabulary: [
          "correlate",
          "causal",
          "robust",
          "limitation",
          "replicate",
          "infer",
        ],
        pronunciation:
          "Use pauses to separate evidence, interpretation, and limitation.",
        model:
          "Taken together, the studies indicate a modest association rather than a demonstrated causal effect. The finding appears robust across two samples, although neither design eliminates self-selection.",
        listeningText:
          "A researcher summarises three studies, distinguishes correlation from causation, and explains why replication strengthens but does not finalise the conclusion.",
        readingText:
          "Synthesis is more than listing sources. It identifies patterns, methodological differences, and the boundaries of a defensible conclusion while preserving meaningful disagreement.",
        speakingPrompt:
          "Synthesize three hypothetical findings and distinguish evidence from inference.",
        writingPrompt:
          "Write an analytical synthesis with convergence, disagreement, limitation, and conclusion.",
      },
      {
        id: "c1-leadership-decision",
        number: 2,
        title: "Explain a complex decision",
        outcome:
          "Make decision criteria transparent and address competing stakeholder needs.",
        grammar:
          "cleft structures, inversion for emphasis, and nuanced modality",
        vocabulary: [
          "trade-off",
          "constraint",
          "stakeholder",
          "priority",
          "mitigate",
          "justify",
        ],
        pronunciation:
          "Guide the listener through priorities with controlled emphasis.",
        model:
          "What determined the decision was not cost alone but the interaction between reliability, staff capacity, and long-term maintenance. The chosen option is imperfect, yet its risks are more manageable.",
        listeningText:
          "A director rejects the cheapest proposal because hidden maintenance demands would overload staff. She explains the criteria, acknowledges disadvantages, and proposes mitigation.",
        readingText:
          "Transparent decisions distinguish constraints from preferences. They also explain rejected alternatives, foreseeable consequences, and the evidence that would trigger reconsideration.",
        speakingPrompt:
          "Explain a difficult decision, including criteria, rejected options, risks, and mitigation.",
        writingPrompt:
          "Write a decision memo that enables a critical reader to understand your reasoning.",
      },
      {
        id: "c1-public-debate",
        number: 3,
        title: "Respond to a nuanced argument",
        outcome:
          "Represent another position fairly before refining or challenging it.",
        grammar:
          "concessive clauses, stance adverbials, and rhetorical questions",
        vocabulary: [
          "premise",
          "assumption",
          "counterexample",
          "concede",
          "distort",
          "nuance",
        ],
        pronunciation:
          "Separate respectful representation from critical response.",
        model:
          "The argument rightly highlights unequal access; nevertheless, it assumes that a single policy would affect every group similarly. A more convincing proposal would preserve the concern while allowing local adaptation.",
        listeningText:
          "A speaker first summarises an opponent’s concern accurately, then challenges one assumption and offers a narrower alternative rather than dismissing the entire position.",
        readingText:
          "Strong rebuttal begins with accurate representation. Attacking a simplified version may sound decisive, but it weakens credibility and prevents genuine comparison of alternatives.",
        speakingPrompt:
          "Summarise a position fairly, concede one strength, challenge one assumption, and propose a refinement.",
        writingPrompt:
          "Write a respectful critical response that avoids exaggeration and false certainty.",
      },
      {
        id: "c1-register",
        number: 4,
        title: "Adapt language to audience",
        outcome:
          "Express the same complex message appropriately in conversational and formal registers.",
        grammar:
          "register-sensitive modality, ellipsis, and formal subordination",
        vocabulary: [
          "register",
          "directness",
          "convention",
          "concise",
          "diplomatic",
          "accessible",
        ],
        pronunciation:
          "Adjust pacing and emphasis for conversation versus presentation.",
        model:
          "Informal: We need to check the figures before we decide. Formal: A final decision should be deferred until the figures have been independently verified.",
        listeningText:
          "A project lead gives the same update to a colleague and then to a public committee. The facts remain stable, but directness, detail, and terminology change.",
        readingText:
          "Effective register is not simply formal vocabulary. It reflects purpose, relationship, expected knowledge, and the consequences of ambiguity for a particular audience.",
        speakingPrompt:
          "Deliver the same difficult message first to a friend and then to a formal committee.",
        writingPrompt:
          "Write two versions of one message: a concise personal note and a formal professional statement.",
      },
    ],
  },
  {
    cefr: "C2",
    title: "Mastery and Precision",
    descriptor:
      "Process virtually all spoken and written language and express fine distinctions naturally.",
    baseLessons: [
      "Layered argument, ambiguity control, genre conventions, and rhetorical compression",
      "Idiomatic precision, connotation, and deliberate lexical restraint",
      "Flexible prosody for irony, qualification, authority, and empathy",
      "Publication-level revision for logic, rhythm, precision, and audience",
    ],
    exitCriteria: [
      "Interpret subtle stance, implication, humour, and strategic ambiguity",
      "Speak flexibly under pressure while preserving precision and register",
      "Reconstruct and critique complex reasoning across genres",
      "Produce polished writing with deliberate style and reliable self-editing",
    ],
    units: [
      {
        id: "c2-ambiguity",
        number: 1,
        title: "Control ambiguity deliberately",
        outcome:
          "Identify unintended ambiguity and preserve useful ambiguity when appropriate.",
        grammar: "scope, attachment, reference, and information structure",
        vocabulary: [
          "scope",
          "referent",
          "implicit",
          "deliberate",
          "misread",
          "disambiguate",
        ],
        pronunciation:
          "Use prosody to clarify attachment and intended contrast.",
        model:
          "The committee reviewed the proposal with the adviser who had raised the objection. Revision is needed because the original wording leaves both the adviser’s role and the source of the objection unclear.",
        listeningText:
          "A mediator notices that two participants interpret the same sentence differently. She restates the message twice, making each possible meaning explicit before confirming the intended one.",
        readingText:
          "Ambiguity is not inherently defective. Literary and diplomatic language may exploit it, whereas safety instructions and contractual decisions usually require explicit scope and reference.",
        speakingPrompt:
          "Explain two interpretations of an ambiguous statement and reformulate it for one precise meaning.",
        writingPrompt:
          "Revise an ambiguous paragraph, then explain which linguistic choices removed uncertainty.",
      },
      {
        id: "c2-ethical-argument",
        number: 2,
        title: "Build an ethically complex argument",
        outcome:
          "Reason across competing values without reducing the issue to a false binary.",
        grammar:
          "layered concession, counterfactual distance, and rhetorical parallelism",
        vocabulary: [
          "proportional",
          "legitimate",
          "autonomy",
          "obligation",
          "reconcile",
          "principle",
        ],
        pronunciation:
          "Use measured pacing to distinguish values, consequences, and judgment.",
        model:
          "Protecting autonomy does not eliminate collective obligation; nor does public benefit justify unlimited intervention. A defensible policy must show that restrictions are necessary, proportionate, and open to review.",
        listeningText:
          "Two ethicists share the same values but rank them differently. Their disagreement becomes clearer when they distinguish immediate harm, long-term trust, and reversibility.",
        readingText:
          "Complex ethical reasoning tests principles against difficult cases. It avoids treating consequences as irrelevant, while also resisting the claim that a desirable outcome excuses every method.",
        speakingPrompt:
          "Analyse a policy conflict using competing values, difficult cases, and a qualified judgment.",
        writingPrompt:
          "Write a nuanced argument that reconciles two legitimate but conflicting principles.",
      },
      {
        id: "c2-genre-shift",
        number: 3,
        title: "Transform meaning across genres",
        outcome:
          "Preserve factual meaning while changing purpose, voice, density, and structure.",
        grammar: "genre-specific compression, voice, deixis, and cohesion",
        vocabulary: [
          "framing",
          "density",
          "voice",
          "convention",
          "salience",
          "recast",
        ],
        pronunciation:
          "Shift delivery appropriately between narrative, briefing, and formal argument.",
        model:
          "Narrative foregrounds experience; a briefing foregrounds decisions; analysis foregrounds relationships between evidence and interpretation. The facts may remain constant while salience changes.",
        listeningText:
          "A witness tells a chronological story, after which an analyst converts it into a concise briefing. The transformation removes personal detail but preserves verified events and uncertainty.",
        readingText:
          "Genre transformation is not synonym replacement. It requires decisions about what the audience needs first, which relationships must be explicit, and how strongly conclusions should be stated.",
        speakingPrompt:
          "Present one event as a personal story, an executive briefing, and an analytical explanation.",
        writingPrompt:
          "Recast one source passage into two genres and justify the structural changes.",
      },
      {
        id: "c2-integrated-mastery",
        number: 4,
        title: "Maintain precision under pressure",
        outcome:
          "Integrate listening, speaking, reading, and writing while self-repairing naturally.",
        grammar: "full-system control under divided attention",
        vocabulary: [
          "synthesize",
          "prioritise",
          "reformulate",
          "qualify",
          "coherent",
          "spontaneous",
        ],
        pronunciation:
          "Preserve intelligibility, rhythm, and nuance during spontaneous reformulation.",
        model:
          "After reviewing the evidence, identify the strongest conclusion, acknowledge what remains unresolved, and adapt the explanation when challenged without abandoning necessary qualification.",
        listeningText:
          "A specialist receives new evidence midway through a briefing. She pauses, revises one claim explicitly, and explains why the central recommendation remains unchanged.",
        readingText:
          "Mastery is visible when accuracy survives competing demands: understanding new information, planning a response, monitoring the listener, and repairing language without losing coherence.",
        speakingPrompt:
          "Give a three-minute synthesis, respond to a challenge, and reformulate one complex point for a non-specialist.",
        writingPrompt:
          "Produce a polished synthesis, then edit it for precision, naturalness, and a different audience.",
      },
    ],
  },
] as const;

const skillLabels: Record<IntegratedSkill, string> = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
};

function minimumWords(level: CefrLevel, stage: AutomaticityStage) {
  const levelBase: Record<CefrLevel, number> = {
    A1: 3,
    A2: 4,
    B1: 6,
    B2: 8,
    C1: 10,
    C2: 12,
  };
  const multiplier: Record<AutomaticityStage, number> = {
    understand: 1,
    recognise: 1,
    recall: 1.5,
    supported: 2,
    independent: 3,
    transfer: 3,
    review: 2,
  };
  return Math.ceil(levelBase[level] * multiplier[stage]);
}

function skillTask(unit: IntegratedSkillsUnit, skill: IntegratedSkill) {
  if (skill === "listening") return unit.listeningText;
  if (skill === "reading") return unit.readingText;
  if (skill === "speaking") return unit.speakingPrompt;
  return unit.writingPrompt;
}

export function buildAutomaticitySteps(
  level: CefrLevel,
  unit: IntegratedSkillsUnit,
  skill: IntegratedSkill,
): readonly AutomaticityStep[] {
  const label = skillLabels[skill];
  const target = skillTask(unit, skill);
  const steps: readonly Omit<AutomaticityStep, "id" | "minWords">[] = [
    {
      stage: "understand",
      title: "1. Understand",
      instruction: `Listen to the instruction and study the short ${label.toLowerCase()} model. Work with one idea only.`,
      responsePrompt: "In your own words, what is the task about?",
      supportAvailable: true,
      delayedReview: false,
    },
    {
      stage: "recognise",
      title: "2. Recognise",
      instruction: `Find useful language for this goal: ${unit.grammar}.`,
      responsePrompt: "Type or say two useful words or chunks you noticed.",
      supportAvailable: true,
      delayedReview: false,
    },
    {
      stage: "recall",
      title: "3. Recall",
      instruction:
        "Hide the model, pause, and retrieve the main idea from memory before responding.",
      responsePrompt: "Recall the main idea without copying the model.",
      supportAvailable: false,
      delayedReview: false,
    },
    {
      stage: "supported",
      title: "4. Produce with support",
      instruction: `Use the word bank or model frame to complete the ${label.toLowerCase()} goal once.`,
      responsePrompt: target,
      supportAvailable: true,
      delayedReview: false,
    },
    {
      stage: "independent",
      title: "5. Produce independently",
      instruction:
        "Close the support and complete the same goal again with your own language.",
      responsePrompt: `Complete the ${label.toLowerCase()} task without copying or reading a script.`,
      supportAvailable: false,
      delayedReview: false,
    },
    {
      stage: "transfer",
      title: "6. Transfer",
      instruction:
        "Change the person, place, purpose, or opinion. Use the same skill in a genuinely new situation.",
      responsePrompt: `Create a new ${label.toLowerCase()} response connected to your own life or work.`,
      supportAvailable: false,
      delayedReview: false,
    },
    {
      stage: "review",
      title: "7. Recall later",
      instruction:
        "Return after a delay. Retrieve the skill and target language before opening support.",
      responsePrompt: `What can you still ${skill === "listening" || skill === "reading" ? "understand and explain" : "produce"} without reviewing the lesson?`,
      supportAvailable: false,
      delayedReview: true,
    },
  ];

  return steps.map((step) => ({
    ...step,
    id: `${unit.id}:${skill}:${step.stage}`,
    minWords: minimumWords(level, step.stage),
  }));
}

type SupplementalTopic = {
  id: string;
  title: string;
  outcome: string;
  grammar: string;
  vocabulary: readonly [string, string, string, string, string, string];
  situation: string;
};

const supplementalTopics: Readonly<Record<CefrLevel, readonly SupplementalTopic[]>> = {
  A1: [
    { id: "family", title: "Talk about family and friends", outcome: "Describe familiar people and ask simple personal questions.", grammar: "have got, possessives, and who questions", vocabulary: ["parent", "child", "friend", "kind", "live", "together"], situation: "a friendly conversation with a new neighbour" },
    { id: "home", title: "Describe your home", outcome: "Name rooms, objects, and locations in a familiar home.", grammar: "there is/are and place prepositions", vocabulary: ["room", "kitchen", "table", "near", "behind", "comfortable"], situation: "showing a visitor around your home" },
    { id: "food", title: "Order food and drink", outcome: "Choose a simple meal and make a polite request.", grammar: "would like, countable nouns, and some/any", vocabulary: ["menu", "water", "bread", "order", "please", "bill"], situation: "ordering a meal in a quiet cafe" },
    { id: "directions", title: "Ask for and follow directions", outcome: "Ask where a place is and understand short directions.", grammar: "imperatives, where, and place prepositions", vocabulary: ["left", "right", "straight", "corner", "station", "opposite"], situation: "finding a station in an unfamiliar street" },
    { id: "weather", title: "Talk about weather and clothes", outcome: "Describe current weather and choose suitable clothes.", grammar: "present continuous and it is", vocabulary: ["sunny", "rain", "cold", "coat", "wear", "today"], situation: "preparing to leave home in changing weather" },
    { id: "health", title: "Explain a simple health need", outcome: "Name a common symptom and understand basic advice.", grammar: "have, feel, should, and simple negatives", vocabulary: ["headache", "pain", "rest", "medicine", "better", "appointment"], situation: "speaking to a pharmacist about a minor problem" },
    { id: "free-time", title: "Share free-time interests", outcome: "Say what you enjoy and invite someone to join you.", grammar: "like plus -ing and can", vocabulary: ["music", "walk", "read", "weekend", "join", "enjoy"], situation: "making a simple weekend plan with a friend" },
    { id: "transport", title: "Use local transport", outcome: "Buy a ticket and confirm a destination or departure time.", grammar: "one-way/return questions and at/to", vocabulary: ["ticket", "platform", "bus", "train", "leave", "arrive"], situation: "buying a train ticket at a station" },
  ],
  A2: [
    { id: "home-change", title: "Describe a change at home", outcome: "Compare a past and present living situation.", grammar: "past simple, present simple, and comparatives", vocabulary: ["move", "neighbourhood", "quieter", "rent", "space", "before"], situation: "telling a friend about a recent move" },
    { id: "celebration", title: "Plan a celebration", outcome: "Agree on practical arrangements and divide simple responsibilities.", grammar: "going to, will, and object pronouns", vocabulary: ["invite", "prepare", "bring", "guest", "decide", "together"], situation: "planning a small family celebration" },
    { id: "learning", title: "Explain how you learn", outcome: "Describe a learning habit and say why it helps.", grammar: "because, infinitive of purpose, and frequency adverbs", vocabulary: ["practise", "remember", "repeat", "useful", "difficult", "improve"], situation: "sharing study advice with a classmate" },
    { id: "workday", title: "Report a workday problem", outcome: "Explain a routine problem and request a practical change.", grammar: "past simple, have to, and could", vocabulary: ["shift", "schedule", "late", "manager", "change", "solve"], situation: "speaking to a supervisor about a schedule" },
    { id: "technology", title: "Use everyday technology", outcome: "Explain a basic device problem and follow instructions.", grammar: "imperatives, present perfect with just, and if", vocabulary: ["screen", "password", "restart", "message", "connect", "button"], situation: "asking for help with a phone" },
    { id: "local-area", title: "Recommend a local place", outcome: "Describe a place and give reasons for a recommendation.", grammar: "comparatives, superlatives, and relative clauses with that", vocabulary: ["market", "park", "crowded", "friendly", "recommend", "nearby"], situation: "helping a visitor choose a local place" },
    { id: "news", title: "Retell a simple news item", outcome: "Summarise the main event and two details in sequence.", grammar: "past simple and sequencing linkers", vocabulary: ["report", "happen", "first", "later", "reason", "result"], situation: "telling a friend about local news" },
    { id: "environment", title: "Choose a greener routine", outcome: "Compare two everyday choices and make a simple commitment.", grammar: "should, can, and first conditional", vocabulary: ["waste", "reuse", "energy", "choice", "reduce", "habit"], situation: "agreeing on one greener household habit" },
  ],
  B1: [
    { id: "travel-choice", title: "Compare travel choices", outcome: "Compare alternatives and justify a practical decision.", grammar: "comparatives, conditionals, and reason clauses", vocabulary: ["route", "cost", "reliable", "delay", "option", "prefer"], situation: "choosing transport for a group trip" },
    { id: "community", title: "Propose a community improvement", outcome: "Explain a local need and propose a realistic solution.", grammar: "modals, purpose clauses, and relative clauses", vocabulary: ["resident", "facility", "access", "proposal", "benefit", "maintain"], situation: "speaking at a neighbourhood meeting" },
    { id: "culture", title: "Explain a cultural custom", outcome: "Describe a custom and respond to respectful questions.", grammar: "used to, passive voice, and defining clauses", vocabulary: ["custom", "celebrate", "tradition", "meaning", "respect", "generation"], situation: "explaining a custom to an international visitor" },
    { id: "money", title: "Make a personal budget decision", outcome: "Discuss priorities and explain a spending decision.", grammar: "quantifiers, conditionals, and contrast linkers", vocabulary: ["budget", "afford", "essential", "save", "expense", "priority"], situation: "planning monthly expenses with a partner" },
    { id: "media", title: "Check a media claim", outcome: "Separate a claim from evidence and explain uncertainty.", grammar: "reported speech and probability modals", vocabulary: ["source", "claim", "evidence", "likely", "verify", "misleading"], situation: "checking a surprising post before sharing it" },
    { id: "relationships", title: "Resolve a personal disagreement", outcome: "Explain feelings, listen, and negotiate a next step.", grammar: "reported speech, wish, and polite modals", vocabulary: ["misunderstanding", "interrupt", "apologise", "fair", "agree", "solution"], situation: "repairing a misunderstanding with a friend" },
    { id: "public-service", title: "Handle a public-service request", outcome: "Describe a problem, provide details, and confirm action.", grammar: "present perfect, passive voice, and indirect questions", vocabulary: ["application", "document", "reference", "process", "confirm", "requirement"], situation: "asking an office about an application" },
    { id: "future-goal", title: "Present a realistic future goal", outcome: "Explain a goal, obstacles, and a practical action plan.", grammar: "future forms, conditionals, and time clauses", vocabulary: ["goal", "milestone", "challenge", "strategy", "progress", "achieve"], situation: "discussing a six-month learning goal" },
  ],
  B2: [
    { id: "health-policy", title: "Assess a public-health proposal", outcome: "Weigh evidence, consequences, and implementation constraints.", grammar: "complex conditionals, passives, and concession", vocabulary: ["prevention", "access", "outcome", "intervention", "equity", "constraint"], situation: "evaluating a local public-health proposal" },
    { id: "education-change", title: "Debate an education reform", outcome: "Compare stakeholder views and defend a measured position.", grammar: "reporting verbs, hedging, and participle clauses", vocabulary: ["curriculum", "assessment", "stakeholder", "workload", "evidence", "reform"], situation: "contributing to an education consultation" },
    { id: "consumer-rights", title: "Negotiate a consumer complaint", outcome: "Present evidence and negotiate an acceptable remedy.", grammar: "formal requests, conditionals, and passive reporting", vocabulary: ["refund", "warranty", "defect", "receipt", "resolve", "compensation"], situation: "resolving a disputed purchase" },
    { id: "urban-life", title: "Compare urban development options", outcome: "Evaluate trade-offs in housing, transport, and public space.", grammar: "nominalisation, comparison, and concession", vocabulary: ["density", "infrastructure", "affordable", "commute", "resident", "trade-off"], situation: "reviewing two urban development plans" },
    { id: "culture-review", title: "Deliver a nuanced cultural review", outcome: "Interpret choices, support judgments, and acknowledge limits.", grammar: "cleft sentences, modifiers, and stance adverbs", vocabulary: ["interpretation", "audience", "subtle", "convention", "effective", "limitation"], situation: "reviewing a film for a discussion group" },
    { id: "risk", title: "Communicate risk responsibly", outcome: "Explain probability without exaggeration and recommend action.", grammar: "probability modals, conditionals, and hedging", vocabulary: ["probability", "exposure", "uncertain", "mitigate", "scenario", "proportionate"], situation: "briefing colleagues about a project risk" },
    { id: "collaboration", title: "Repair a team process", outcome: "Diagnose a collaboration problem and negotiate new norms.", grammar: "mixed conditionals, reporting verbs, and emphasis", vocabulary: ["accountability", "handover", "expectation", "feedback", "coordinate", "priority"], situation: "facilitating a team process review" },
    { id: "data-story", title: "Explain a data trend", outcome: "Describe change, qualify interpretation, and answer questions.", grammar: "trend language, approximation, and contrast clauses", vocabulary: ["increase", "decline", "fluctuate", "estimate", "correlation", "indicator"], situation: "presenting a simple dashboard to colleagues" },
  ],
  C1: [
    { id: "policy-brief", title: "Deliver a policy briefing", outcome: "Synthesize competing evidence into a concise recommendation.", grammar: "nominalisation, hedging, and complex cohesion", vocabulary: ["feasibility", "implication", "criterion", "stakeholder", "recommendation", "caveat"], situation: "briefing decision-makers with limited time" },
    { id: "research-critique", title: "Critique a research design", outcome: "Identify strengths, limitations, and warranted conclusions.", grammar: "stance structures, passives, and concessive clauses", vocabulary: ["validity", "sample", "bias", "method", "replicate", "inference"], situation: "responding to a research presentation" },
    { id: "conflict", title: "Mediate a complex disagreement", outcome: "Reframe positions and build conditional common ground.", grammar: "distancing, conditionals, and diplomatic reformulation", vocabulary: ["underlying", "concern", "reframe", "compromise", "legitimate", "resolution"], situation: "mediating between two professional teams" },
    { id: "ethics-case", title: "Analyse an ethical dilemma", outcome: "Distinguish principles, consequences, and uncertainty.", grammar: "inversion, modal perfects, and abstract reference", vocabulary: ["dilemma", "obligation", "consequence", "autonomy", "proportionate", "justify"], situation: "discussing an ethically difficult case" },
    { id: "public-talk", title: "Adapt a public explanation", outcome: "Make expert content accessible without distorting it.", grammar: "apposition, reformulation, and information focus", vocabulary: ["analogy", "assumption", "accessible", "distort", "clarify", "audience"], situation: "explaining specialist work to the public" },
    { id: "literary-view", title: "Interpret a complex text", outcome: "Develop an interpretation and address an alternative reading.", grammar: "subordination, evaluative language, and reference chains", vocabulary: ["motif", "perspective", "ambiguity", "narrative", "interpret", "counterreading"], situation: "leading a discussion of a literary passage" },
    { id: "strategy", title: "Challenge a strategic proposal", outcome: "Test assumptions and propose a more resilient alternative.", grammar: "counterfactuals, emphasis, and embedded questions", vocabulary: ["assumption", "dependency", "resilient", "trade-off", "scenario", "contingency"], situation: "reviewing a strategic plan with senior colleagues" },
    { id: "cross-cultural", title: "Navigate cross-cultural expectations", outcome: "Explain differing norms and prevent avoidable misunderstanding.", grammar: "nuanced modality, comparison, and metadiscourse", vocabulary: ["implicit", "norm", "expectation", "interpret", "context", "sensitivity"], situation: "preparing an international team meeting" },
  ],
  C2: [
    { id: "expert-debate", title: "Chair an expert debate", outcome: "Integrate divergent arguments and expose hidden assumptions.", grammar: "advanced cohesion, inversion, and controlled ellipsis", vocabulary: ["premise", "contention", "reconcile", "nuance", "warrant", "synthesis"], situation: "chairing a high-level expert discussion" },
    { id: "legal-meaning", title: "Clarify precise institutional language", outcome: "Explain interpretive consequences without oversimplification.", grammar: "dense nominal groups, scope, and qualification", vocabulary: ["provision", "scope", "interpretation", "exception", "binding", "ambiguity"], situation: "clarifying a complex institutional document" },
    { id: "crisis", title: "Communicate during a crisis", outcome: "Balance precision, reassurance, uncertainty, and accountability.", grammar: "evidentiality, controlled emphasis, and stance", vocabulary: ["verified", "provisional", "accountability", "escalate", "contain", "disclosure"], situation: "giving a time-critical public update" },
    { id: "satire", title: "Interpret irony and implied meaning", outcome: "Explain layered intent, tone, and cultural presupposition.", grammar: "pragmatic inference, marked word order, and echo structures", vocabulary: ["irony", "allusion", "implication", "deadpan", "subvert", "presuppose"], situation: "explaining a satirical text to an international audience" },
    { id: "multisource", title: "Reconstruct a multi-source account", outcome: "Reconcile partial sources while preserving uncertainty.", grammar: "complex attribution, tense control, and source framing", vocabulary: ["corroborate", "discrepancy", "account", "timeline", "provenance", "tentative"], situation: "reconstructing events from conflicting reports" },
    { id: "diplomacy", title: "Draft a diplomatic intervention", outcome: "Signal disagreement while protecting relationships and options.", grammar: "mitigation, oblique reference, and rhetorical balance", vocabulary: ["reservation", "constructive", "mutual", "framework", "undertaking", "alignment"], situation: "responding in a sensitive international meeting" },
    { id: "creative-voice", title: "Control voice and style creatively", outcome: "Shift register and rhythm while preserving exact meaning.", grammar: "stylistic fronting, ellipsis, and parallelism", vocabulary: ["cadence", "voice", "register", "compress", "evoke", "texture"], situation: "rewriting the same message for three genres" },
    { id: "oral-defence", title: "Defend a complex position orally", outcome: "Respond spontaneously to sustained expert challenge.", grammar: "full-range reformulation, concession, and metadiscourse", vocabulary: ["objection", "distinction", "substantiate", "qualification", "framework", "implication"], situation: "defending a thesis claim before expert reviewers" },
  ],
};

function buildSupplementalUnit(level: CefrLevel, topic: SupplementalTopic, number: number): IntegratedSkillsUnit {
  const words = topic.vocabulary;
  return {
    id: `${level.toLowerCase()}-${topic.id}`,
    number,
    title: topic.title,
    outcome: topic.outcome,
    grammar: topic.grammar,
    vocabulary: words,
    pronunciation: `Use clear thought groups and make the key contrast audible while speaking in ${topic.situation}.`,
    model: `In ${topic.situation}, I would first make the purpose clear, add the most useful detail, and then check that the other person has understood me.`,
    listeningText: `You are listening to someone in ${topic.situation}. Notice the purpose, the key detail, the speaker's attitude, and the action that should happen next. Then explain the message in your own words.`,
    readingText: `This short text concerns ${topic.situation}. It presents a main point, relevant details, and a practical consequence. Identify the evidence, infer the writer's purpose, and decide what response is appropriate.`,
    speakingPrompt: `Respond to ${topic.situation}. Use the target grammar, include at least three topic words, and finish with a clear next step or conclusion.`,
    writingPrompt: `Write a connected response for ${topic.situation}. Organise it clearly, use the target grammar accurately, and revise one sentence for precision.`,
  };
}

const completeLevels: readonly IntegratedSkillsLevel[] = levels.map((level) => ({
  ...level,
  units: [
    ...level.units,
    ...supplementalTopics[level.cefr].map((topic, index) =>
      buildSupplementalUnit(level.cefr, topic, level.units.length + index + 1),
    ),
  ],
}));

export function getIntegratedSkillsLevel(
  level: CefrLevel,
): IntegratedSkillsLevel {
  return completeLevels.find((candidate) => candidate.cefr === level) ?? completeLevels[0]!;
}

export const integratedSkillsLevels = completeLevels;
