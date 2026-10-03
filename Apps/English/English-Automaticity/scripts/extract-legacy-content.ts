import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const generatedDir = resolve(root, "packages/content/src/generated");

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Missing marker: ${start}`);
  const valueStart = startIndex + start.length;
  const endIndex = source.indexOf(end, valueStart);
  if (endIndex < 0) throw new Error(`Missing marker: ${end}`);
  return source.slice(valueStart, endIndex);
}

function evaluateLiteral<T>(literal: string): T {
  // The input is the repository's own immutable catalog, not user input.
  return Function(`"use strict"; return (${literal});`)() as T;
}

async function writeGenerated(
  filename: string,
  typeName: string,
  exportName: string,
  value: unknown,
) {
  const file = resolve(generatedDir, filename);
  const body = [
    "/* Generated from the v27 legacy PWA and normalized for safe, natural learner-facing English. Do not edit by hand. */",
    `import type { ${typeName} } from "../types";`,
    "",
    `export const ${exportName}: ${typeName}[] = ${JSON.stringify(value, null, 2)};`,
    "",
  ].join("\n");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body, "utf8");
}

type LegacyTopic = {
  track: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  skill: string;
  category: string;
  topic: string;
  task: string;
  modelAnswer: string;
  targetGrammar: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

type SpokenChunk = {
  text: string;
  purpose: string;
  example: string;
};

type EnrichedTopic = LegacyTopic & {
  spokenChunks: SpokenChunk[];
};

const SPOKEN_CHUNKS_BY_LEVEL: Record<LegacyTopic["level"], readonly SpokenChunk[]> = {
  A1: [
    {
      text: "Let me think.",
      purpose: "Give yourself a natural moment to think.",
      example: "Let me think. I usually cook at home.",
    },
    {
      text: "For me, ...",
      purpose: "Make the answer personal.",
      example: "For me, weekends are family time.",
    },
    {
      text: "For example, ...",
      purpose: "Add one clear example.",
      example: "For example, I walk to work.",
    },
    {
      text: "What about you?",
      purpose: "Return the conversation to the other person.",
      example: "I like quiet places. What about you?",
    },
  ],
  A2: [
    {
      text: "To be honest, ...",
      purpose: "Introduce a genuine opinion or feeling.",
      example: "To be honest, I was nervous at first.",
    },
    {
      text: "The thing is, ...",
      purpose: "Explain the important detail.",
      example: "The thing is, I did not have much time.",
    },
    {
      text: "In the end, ...",
      purpose: "Finish a short story or experience.",
      example: "In the end, everything worked out well.",
    },
    {
      text: "Compared with before, ...",
      purpose: "Make a simple comparison with the past.",
      example: "Compared with before, I feel much more confident.",
    },
  ],
  B1: [
    {
      text: "From my point of view, ...",
      purpose: "State your position clearly.",
      example: "From my point of view, flexible learning works best.",
    },
    {
      text: "It really depends on ...",
      purpose: "Show that the answer changes with the situation.",
      example: "It really depends on the person and their goals.",
    },
    {
      text: "On the other hand, ...",
      purpose: "Introduce a contrasting point.",
      example: "On the other hand, the change may cost more.",
    },
    {
      text: "What I mean is ...",
      purpose: "Clarify or repair what you just said.",
      example: "What I mean is we need a more practical solution.",
    },
  ],
  B2: [
    {
      text: "What stands out to me is ...",
      purpose: "Highlight the most important observation.",
      example: "What stands out to me is the speed of the change.",
    },
    {
      text: "That said, ...",
      purpose: "Add a measured contrast or limitation.",
      example: "That said, the benefits should not be ignored.",
    },
    {
      text: "The main issue is that ...",
      purpose: "Frame the central problem precisely.",
      example: "The main issue is that access is still unequal.",
    },
    {
      text: "All things considered, ...",
      purpose: "Give a balanced spoken conclusion.",
      example: "All things considered, the plan is worth trying.",
    },
  ],
  C1: [
    {
      text: "From a broader perspective, ...",
      purpose: "Move from one example to the wider context.",
      example: "From a broader perspective, the policy affects everyone.",
    },
    {
      text: "What tends to happen is ...",
      purpose: "Describe a recurring pattern naturally.",
      example: "What tends to happen is that short-term fixes become permanent.",
    },
    {
      text: "That raises the question of ...",
      purpose: "Introduce the next issue in the discussion.",
      example: "That raises the question of who should be responsible.",
    },
    {
      text: "To put it another way, ...",
      purpose: "Rephrase a complex idea for clarity.",
      example: "To put it another way, trust matters more than speed.",
    },
  ],
  C2: [
    {
      text: "The crux of the matter is ...",
      purpose: "Identify the decisive point in a nuanced argument.",
      example: "The crux of the matter is whether the evidence is reliable.",
    },
    {
      text: "Be that as it may, ...",
      purpose: "Acknowledge a point before redirecting the argument.",
      example: "Be that as it may, the underlying problem remains unresolved.",
    },
    {
      text: "What is often overlooked is ...",
      purpose: "Surface a subtle or neglected consideration.",
      example: "What is often overlooked is the effect on informal workers.",
    },
    {
      text: "If we take that argument to its logical conclusion, ...",
      purpose: "Test the full implication of a claim.",
      example: "If we take that argument to its logical conclusion, no exception would be possible.",
    },
  ],
};

function normalizeTopicCopy(topic: LegacyTopic, index: number): LegacyTopic {
  const subject = `“${topic.topic}”`;
  const variants = index % 3;

  if (topic.level === "A1") {
    return {
      ...topic,
      task: `Talk about ${subject}. Give four short sentences: one fact, one personal detail, one example, and one question.`,
      modelAnswer:
        variants === 0
          ? `Today I want to talk about ${topic.topic}. It is part of my everyday life. I can give one simple example. What is your experience?`
          : variants === 1
            ? `My topic is ${topic.topic}. I know something about it from daily life. One useful detail is easy to explain. What would you like to know?`
            : `I am going to speak about ${topic.topic}. This topic matters to me. I have one short example from this week. What do you think?`,
    };
  }

  if (topic.level === "A2") {
    return {
      ...topic,
      task: `Describe one real experience connected with ${subject}. Say what happened, add two concrete details, and compare it with an earlier experience.`,
      modelAnswer:
        variants === 0
          ? `I recently had an experience connected with ${topic.topic}. Two details were especially important to me. Compared with the past, I can handle this kind of situation more confidently now.`
          : variants === 1
            ? `Last week I dealt with something related to ${topic.topic}. At first it was unfamiliar, but one small decision made it easier. I understand the situation better than I did before.`
            : `A recent situation made me think about ${topic.topic}. I noticed two practical details and changed one part of my routine. The experience was easier than a similar one in the past.`,
    };
  }

  if (topic.level === "B1") {
    return {
      ...topic,
      task: `Give your view on ${subject}. Explain one benefit, one concern, and one personal example before asking a follow-up question.`,
      modelAnswer:
        variants === 0
          ? `When I think about ${topic.topic}, I can see both a clear benefit and a real challenge. The benefit can improve everyday decisions, while the challenge requires care. I have noticed both sides in my own experience.`
          : variants === 1
            ? `${topic.topic} can create useful opportunities, but it can also cause practical problems. In my experience, the result depends on how people use it and what support they have.`
            : `My view of ${topic.topic} is balanced. One aspect can make life easier, whereas another can create pressure or confusion. A situation from my own life helped me understand this contrast.`,
    };
  }

  return topic;
}

function normalizeTopic(topic: LegacyTopic, index: number): EnrichedTopic {
  return {
    ...normalizeTopicCopy(topic, index),
    spokenChunks: SPOKEN_CHUNKS_BY_LEVEL[topic.level].map((chunk) => ({ ...chunk })),
  };
}

const [indexHtml, resourcesJs] = await Promise.all([
  readFile(resolve(root, "legacy", "index.html"), "utf8"),
  readFile(resolve(root, "legacy", "resources.js"), "utf8"),
]);

const topics = evaluateLiteral<LegacyTopic[]>(
  sliceBetween(indexHtml, 'TOPICS=', ', GRAMMAR='),
).map(normalizeTopic);
const grammar = evaluateLiteral<unknown[]>(
  sliceBetween(indexHtml, 'GRAMMAR=', ', T='),
);
const resources = evaluateLiteral<unknown[]>(
  sliceBetween(
    resourcesJs.replaceAll("\r\n", "\n"),
    "const ONLINE_RESOURCE_GROUPS = ",
    ";\n\nfunction",
  ),
);
await Promise.all([
  writeGenerated("topics.ts", "ConversationTopic", "conversationTopics", topics),
  writeGenerated("grammar.ts", "GrammarUnit", "grammarUnits", grammar),
  writeGenerated("resources.ts", "OnlineResource", "onlineResources", resources),
]);

console.log(
  `Extracted ${topics.length} topics, ${grammar.length} grammar units, ` +
    `and ${resources.length} resources.`,
);
