import type { TeacherContentItem } from "./teacher-content";

const CREATED_AT = "2026-08-29T00:00:00.000Z";

type StarterRow = Omit<TeacherContentItem, "updatedAt" | "status">;

function item(row: StarterRow): TeacherContentItem {
  return { ...row, status: "published", updatedAt: CREATED_AT };
}

// These are newly authored prompts for this app. They intentionally do not
// quote, transcribe, or bundle the locally licensed QSkills material.
export const originalEnglishStarterContent: readonly TeacherContentItem[] = [
  item({
    id: "original-en-a1-verb",
    kind: "verb",
    level: "A1",
    title: "Be for introductions",
    contextKey: "teacher.a1.verb.be-introductions",
    body: "Use am, is, and are to share a name, place, and one everyday fact. Say: I am ..., She is ..., We are ... .",
  }),
  item({
    id: "original-en-a1-example",
    kind: "example",
    level: "A1",
    title: "A friendly first message",
    contextKey: "teacher.a1.example.first-message",
    body: "Hello, I am Laleh. I am from Shiraz, but I am in Berlin today. My class is friendly. Are you new here too?",
  }),
  item({
    id: "original-en-a1-exercise",
    kind: "exercise",
    level: "A1",
    title: "Complete an introduction",
    contextKey: "teacher.a1.exercise.complete-introduction",
    body: "Choose am, is, or are: 1) My name ___ Reza. 2) We ___ ready for class. 3) I ___ happy to meet you. Answers: is, are, am.",
  }),
  item({
    id: "original-en-a1-conversation",
    kind: "conversation",
    level: "A1",
    title: "Meet a new neighbour",
    contextKey: "teacher.a1.conversation.new-neighbour",
    body: "A: Hello, I am Sara. I live next door. B: Nice to meet you. I am Amir. A: Are you new in this building? B: Yes, I am. Where are the shops?",
  }),

  item({
    id: "original-en-a2-verb",
    kind: "verb",
    level: "A2",
    title: "Past simple for a change of plan",
    contextKey: "teacher.a2.verb.past-change",
    body: "Use the past simple to say what happened, then explain the result: The train stopped, so I walked. I decided to call my friend.",
  }),
  item({
    id: "original-en-a2-example",
    kind: "example",
    level: "A2",
    title: "An unexpected afternoon",
    contextKey: "teacher.a2.example.unexpected-afternoon",
    body: "Yesterday I planned to visit the library, but it closed early. I found a small park nearby, called my sister, and we had tea outside.",
  }),
  item({
    id: "original-en-a2-exercise",
    kind: "exercise",
    level: "A2",
    title: "Put the story in order",
    contextKey: "teacher.a2.exercise.story-order",
    body: "Put these actions in a logical order: arrived at the station / missed the bus / took the next bus / reached the meeting. Then tell the story using first, then, and finally.",
  }),
  item({
    id: "original-en-a2-conversation",
    kind: "conversation",
    level: "A2",
    title: "Choose a travel option",
    contextKey: "teacher.a2.conversation.travel-option",
    body: "A: The bus is cheaper, but it takes longer. B: The train costs more, but it is direct. A: Let us take the train because we have luggage. B: Good idea. I will reserve the tickets.",
  }),

  item({
    id: "original-en-b1-verb",
    kind: "verb",
    level: "B1",
    title: "Present perfect for experience",
    contextKey: "teacher.b1.verb.present-perfect-experience",
    body: "Use have or has plus a past participle to connect past experience to now. Add a detail: I have tried ..., but I have not decided ... yet.",
  }),
  item({
    id: "original-en-b1-example",
    kind: "example",
    level: "B1",
    title: "A practical study decision",
    contextKey: "teacher.b1.example.study-decision",
    body: "I have used videos and conversation groups. Videos helped me notice useful phrases, but speaking with people has shown me where I hesitate. I now combine both methods.",
  }),
  item({
    id: "original-en-b1-exercise",
    kind: "exercise",
    level: "B1",
    title: "Check a claim before sharing",
    contextKey: "teacher.b1.exercise.check-claim",
    body: "A post says a new app guarantees fluency in one week. Write three questions about source, evidence, and limitations before deciding whether to share it.",
  }),
  item({
    id: "original-en-b1-conversation",
    kind: "conversation",
    level: "B1",
    title: "Clarify a work deadline",
    contextKey: "teacher.b1.conversation.clarify-deadline",
    body: "A: I understood that the report was due on Thursday. B: The calendar shows Wednesday afternoon. A: Could we check the original message? If Wednesday is correct, I can send the table first.",
  }),

  item({
    id: "original-en-b2-verb",
    kind: "verb",
    level: "B2",
    title: "Hedging a recommendation",
    contextKey: "teacher.b2.verb.hedged-recommendation",
    body: "Use may, might, appears to, and likely to make a measured claim: The change may improve access, although the cost is likely to rise at first.",
  }),
  item({
    id: "original-en-b2-example",
    kind: "example",
    level: "B2",
    title: "A balanced technology position",
    contextKey: "teacher.b2.example.balanced-technology",
    body: "Digital tools can shorten routine tasks, yet they may also hide errors when users accept suggestions without checking them. Training and clear review steps are therefore essential.",
  }),
  item({
    id: "original-en-b2-exercise",
    kind: "exercise",
    level: "B2",
    title: "Compare two urban plans",
    contextKey: "teacher.b2.exercise.urban-plans",
    body: "Plan A adds parking near the centre. Plan B adds a bus lane and trees. State one benefit, one drawback, and one condition that would make your preferred plan fairer.",
  }),
  item({
    id: "original-en-b2-conversation",
    kind: "conversation",
    level: "B2",
    title: "Respond to a counterargument",
    contextKey: "teacher.b2.conversation.counterargument",
    body: "A: Remote work improves flexibility. B: That is true for some roles; however, new colleagues may receive less informal support. A: We could keep flexibility while planning regular mentoring sessions.",
  }),

  item({
    id: "original-en-c1-verb",
    kind: "verb",
    level: "C1",
    title: "Qualifying an academic conclusion",
    contextKey: "teacher.c1.verb.qualifying-conclusion",
    body: "Use cautious reporting language: The findings suggest ..., subject to the limitation that ... . This prevents a narrow study from sounding more certain than it is.",
  }),
  item({
    id: "original-en-c1-example",
    kind: "example",
    level: "C1",
    title: "Explain a research limitation",
    contextKey: "teacher.c1.example.research-limitation",
    body: "Although the sample was carefully selected, it represented one workplace only. The results therefore indicate a useful pattern rather than a conclusion that can automatically be applied elsewhere.",
  }),
  item({
    id: "original-en-c1-exercise",
    kind: "exercise",
    level: "C1",
    title: "Rewrite for a public audience",
    contextKey: "teacher.c1.exercise.public-audience",
    body: "Rewrite this specialist sentence for a community meeting without losing accuracy: 'The intervention reduced variance but did not establish causality.' Then name one meaning you deliberately kept.",
  }),
  item({
    id: "original-en-c1-conversation",
    kind: "conversation",
    level: "C1",
    title: "Mediate a team disagreement",
    contextKey: "teacher.c1.conversation.team-mediation",
    body: "A: The team needs speed. B: The team needs a safer review process. C: Both concerns are legitimate. Could we separate urgent decisions from decisions that require a second check?",
  }),

  item({
    id: "original-en-c2-verb",
    kind: "verb",
    level: "C2",
    title: "Frame uncertainty precisely",
    contextKey: "teacher.c2.verb.precise-uncertainty",
    body: "Use evidential framing to separate verified facts from interpretation: The records confirm ..., whereas the proposed explanation remains provisional.",
  }),
  item({
    id: "original-en-c2-example",
    kind: "example",
    level: "C2",
    title: "A careful crisis update",
    contextKey: "teacher.c2.example.crisis-update",
    body: "We can confirm that the service interruption affected the eastern district between 09:10 and 10:05. The cause is still under review; we will distinguish verified findings from early assumptions in the next update.",
  }),
  item({
    id: "original-en-c2-exercise",
    kind: "exercise",
    level: "C2",
    title: "Reconcile conflicting accounts",
    contextKey: "teacher.c2.exercise.reconcile-accounts",
    body: "Two witnesses agree on the time but disagree about the sequence. Produce a five-sentence summary that preserves both accounts, identifies the shared evidence, and avoids inventing certainty.",
  }),
  item({
    id: "original-en-c2-conversation",
    kind: "conversation",
    level: "C2",
    title: "Chair a nuanced debate",
    contextKey: "teacher.c2.conversation.chair-debate",
    body: "Chair: We agree on the objective but not the threshold for action. Let us identify the assumptions behind each proposal, then decide which uncertainty is acceptable and who carries the remaining risk.",
  }),
];
