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

function normalizeTopic(topic: LegacyTopic, index: number): LegacyTopic {
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
