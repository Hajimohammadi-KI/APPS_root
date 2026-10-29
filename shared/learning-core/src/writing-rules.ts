import { tokenizeText } from "./text";

export interface WritingIssue {
  readonly ruleId: string;
  readonly start: number;
  readonly end: number;
  readonly original: string;
  readonly replacement: string;
  readonly message: string;
}
const vowelSound = new Set("hour hours hourly honest honestly honour honourable honor honorable heir heiress apple orange egg elephant idea interesting unusual umbrella uncle urgent early old open excellent expensive effective important independent American English".toLowerCase().split(" "));
const consonantSound = new Set("university universities universal uniform union unique unit united useful user European euro one one-way once book car dog house student teacher friend new good big small young year yellow".toLowerCase().split(" "));

/** High precision, finite lexical scope. Absence of issues never establishes correctness. */
export function writingIssues(source: string, language: "en" | "de"): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const tokens = tokenizeText(source.slice(0, 20000));
  const lower = tokens.map(t => t.normalized.toLocaleLowerCase(language));
  const add = (index: number, replacement: string, ruleId: string, message: string) => {
    const token = tokens[index]!;
    issues.push({ ruleId, start: token.start, end: token.end, original: token.text, replacement, message });
  };
  if (language === "en") {
    for (let i = 0; i < tokens.length - 1; i++) {
      const article = lower[i]!, next = lower[i+1]!;
      if ((article === "a" && vowelSound.has(next)) || (article === "an" && consonantSound.has(next))) {
        let replacement = article === "a" ? "an" : "a";
        if (tokens[i]!.text[0] === "A") replacement = replacement[0]!.toUpperCase() + replacement.slice(1);
        add(i, replacement, "EN_INITIAL_SOUND", "Choose a/an by the initial sound, not the first letter.");
      }
    }
  }
  return issues;
}
