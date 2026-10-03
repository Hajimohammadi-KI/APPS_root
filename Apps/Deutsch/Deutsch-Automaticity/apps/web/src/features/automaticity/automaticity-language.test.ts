import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { detectAnswerLanguage } from "@grammar/domain";
import { analyzeWeilClause } from "./automaticity-analysis";

const componentSource = readFileSync(
  new URL("./automaticity-lab.tsx", import.meta.url),
  "utf8",
);
const start = componentSource.indexOf("  async function analyzeLessonOutput(");
const end = componentSource.indexOf("\n  function checkPractice()", start);
if (start < 0 || end < 0)
  throw new Error("The lesson output handler could not be found.");
const handlerSource = new Bun.Transpiler({ loader: "tsx" }).transformSync(
  componentSource.slice(start, end),
);

async function analyzeViaLessonHandler(text: string) {
  const messages: string[] = [];
  const context = {
    TOPIC: "Nebensatz mit weil",
    detectAnswerLanguage,
    analyzeWeilClause,
    setMessage: (message: string) => messages.push(message),
    handler: undefined as
      | undefined
      | ((text: string, minimumSentences: number) => Promise<unknown>),
  };
  runInNewContext(
    `${handlerSource}\nglobalThis.handler = analyzeLessonOutput;`,
    context,
  );
  return { result: await context.handler!(text, 4), messages };
}

describe("Automaticity language guard before special-case assessment", () => {
  it("keeps mixed-language weil repetitions unassessed before the local shortcut", async () => {
    const text = Array(6).fill("We practise, weil work matters.").join(" ");
    const { result, messages } = await analyzeViaLessonHandler(text);
    expect(result).toBeNull();
    expect(messages.join(" ")).toContain("nicht bewertet");
  });

  it("keeps the valid German local pathway available", async () => {
    const text =
      "Ich lerne, weil ich Zeit habe. Wir gehen, weil es spät ist. Sie wartet, weil er noch arbeitet. Ich bleibe, weil ich müde bin. Er liest, weil das Buch spannend ist. Wir lachen, weil sie lustig ist.";
    const { result, messages } = await analyzeViaLessonHandler(text);
    expect(result).not.toBeNull();
    expect(messages).toEqual([]);
  });
});
